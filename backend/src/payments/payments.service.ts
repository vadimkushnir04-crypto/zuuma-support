// backend/src/payments/payments.service.ts
// ✅ УПРОЩЁННАЯ ВЕРСИЯ - только разовые покупки токенов

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment } from '../entities/payment.entity';
import { Subscription } from '../entities/subscription.entity';
import { User } from '../entities/user.entity';
import { Plan } from '../tokens/plan.entity';
import { YooCheckout } from '@a2seven/yoo-checkout';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class PaymentsService {
  private yooKassa: YooCheckout;
  private isProcessing = false;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    private configService: ConfigService,
    private dataSource: DataSource,
  ) {
    const shopId = this.configService.get<string>('YOOKASSA_SHOP_ID');
    const secretKey = this.configService.get<string>('YOOKASSA_SECRET_KEY');

    if (!shopId || !secretKey) {
      console.error('❌ YooKassa credentials not configured');
    } else {
      this.yooKassa = new YooCheckout({ shopId, secretKey });
      console.log('✅ YooKassa initialized');
    }
  }

  /**
   * ✅ Создание разового платежа за токены
   */
  async createPayment(userId: string, planSlug: string, customTokens?: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    let plan: Plan | null = null;
    let tokensAmount = 0;
    let priceCents = 0;
    let description = '';

    if (planSlug === 'custom' && customTokens) {
      // Кастомная покупка
      const packs = Math.floor(customTokens / 100000);
      if (packs < 1) {
        throw new BadRequestException('Минимальная покупка: 100 000 токенов');
      }
      
      tokensAmount = packs * 100000;
      priceCents = packs * 9900; // 99 рублей за 100k
      description = `Покупка ${tokensAmount.toLocaleString()} токенов`;
    } else {
      // Готовый пакет
      plan = await this.planRepository.findOne({ where: { slug: planSlug } });
      if (!plan) throw new NotFoundException('Plan not found');

      if (parseInt(plan.price_cents) === 0) {
        throw new BadRequestException('Cannot create payment for free plan');
      }

      tokensAmount = parseInt(plan.monthly_tokens.toString());
      priceCents = parseInt(plan.price_cents);
      description = `Покупка пакета ${plan.title}`;
    }

    const amountInRubles = (priceCents / 100).toFixed(2);

    return await this.dataSource.transaction(async (manager) => {
      const payment = manager.create(Payment, {
        userId,
        planId: plan?.id,
        amountCents: priceCents,
        currency: 'RUB',
        yookassaStatus: 'pending',
        description,
        metadata: {
          planSlug: planSlug,
          tokensAmount,
          customPurchase: planSlug === 'custom',
        },
      } as any);

      const savedPayment = await manager.save(payment);

      try {
        const yooPayment = await this.yooKassa.createPayment({
          amount: {
            value: amountInRubles,
            currency: 'RUB',
          },
          confirmation: {
            type: 'redirect',
            return_url: `${this.configService.get('FRONTEND_URL')}/profile?payment_success=true`,
          },
          capture: true,
          description,
          receipt: {
            customer: {
              email: user.email,
            },
            items: [
              {
                description: description,
                amount: {
                  value: amountInRubles,
                  currency: 'RUB',
                },
                quantity: "1",
                vat_code: 1,
              },
            ],
          },
          metadata: {
            userId,
            paymentId: savedPayment.id,
            tokensAmount,
            planSlug,
          },
        });

        savedPayment.yookassaPaymentId = yooPayment.id;
        savedPayment.yookassaStatus = yooPayment.status;
        savedPayment.confirmationUrl = yooPayment.confirmation?.confirmation_url;
        await manager.save(savedPayment);

        console.log('✅ Payment created:', {
          paymentId: savedPayment.id,
          yookassaId: yooPayment.id,
          tokens: tokensAmount,
          amount: yooPayment.amount.value,
        });

        return {
          paymentId: savedPayment.id,
          confirmationUrl: yooPayment.confirmation?.confirmation_url,
          amount: yooPayment.amount.value,
        };
      } catch (error) {
        console.error('❌ YooKassa payment creation failed:', error.response?.data || error);
        throw new BadRequestException('Failed to create payment');
      }
    });
  }

  /**
   * ✅ Обработчик Webhook от YooKassa
   */
  async handleWebhook(webhookData: any) {
    const eventType = webhookData.event;
    const paymentObject = webhookData.object;
    const yooPaymentId = paymentObject?.id;

    if (!eventType || !yooPaymentId) {
      console.warn('⚠️ Некорректный webhook: нет event или id');
      return;
    }

    if (['refund.succeeded', 'payout.succeeded'].includes(eventType)) {
      console.log(`ℹ️ Webhook ${eventType} — пропущен`);
      return;
    }

    const payment = await this.paymentRepository.findOne({
      where: { yookassaPaymentId: yooPaymentId },
      relations: ['plan'],
    });

    if (!payment) {
      console.warn(`⚠️ Платёж ${yooPaymentId} не найден`);
      return;
    }

    if (payment.yookassaStatus === 'succeeded' && eventType === 'payment.succeeded') {
      console.log(`🔁 Повторный webhook от YooKassa для платежа ${yooPaymentId} (игнорируем)`);
      return 'duplicate';
    }

    payment.yookassaStatus = paymentObject.status;
    payment.paymentMethod = paymentObject.payment_method?.type;
    await this.paymentRepository.save(payment);

    if (eventType === 'payment.succeeded') {
      console.log(`✅ Платёж ${yooPaymentId} прошёл успешно`);

      if (payment.subscriptionId) {
        console.log(`⚠️ Подписка для платежа ${yooPaymentId} уже существует`);
        return 'duplicate';
      }

      try {
        await this.activateTokenPurchase(payment);
        console.log(`🎉 Токены активированы для платежа ${payment.id}`);
      } catch (error) {
        console.error('❌ Ошибка при активации токенов:', error.message);
      }
    }

    console.log(`✅ Webhook обработан: ${eventType} (${yooPaymentId})`);
    return 'processed';
  }

  /**
   * ✅ Активация купленных токенов
   */
  private async activateTokenPurchase(payment: Payment) {
    console.log('🔄 Starting token activation');

    await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { id: payment.userId } });
      if (!user) throw new Error('User not found');

      // Получаем количество токенов из метаданных платежа
      const tokensAmount = payment.metadata?.tokensAmount || 
                          (payment.plan ? parseInt(payment.plan.monthly_tokens.toString()) : 0);

      if (tokensAmount === 0) {
        throw new Error('Tokens amount is 0');
      }

      // Отменяем старые активные "подписки" (пакеты токенов)
      const oldPackages = await manager.find(Subscription, {
        where: { userId: payment.userId, status: 'active' },
      });
      
      for (const pkg of oldPackages) {
        pkg.status = 'expired';
        await manager.save(pkg);
      }

      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 30); // Токены живут 30 дней

      // Создаём новую "подписку" (по сути пакет токенов)
      const tokenPackage = manager.create(Subscription, {
        userId: payment.userId,
        planId: payment.planId,
        status: 'active',
        startedAt: now,
        expiresAt,
        canRefund: false, // Убираем возвраты для простоты
      });

      const savedPackage = await manager.save(tokenPackage);

      payment.subscriptionId = savedPackage.id;
      await manager.save(payment);

      // Обновляем баланс пользователя
      user.tokens_limit = tokensAmount;
      user.tokens_used = 0;
      
      // Определяем лимит ассистентов по размеру пакета
      if (tokensAmount >= 10000000) {
        user.assistants_limit = 100;
      } else if (tokensAmount >= 5000000) {
        user.assistants_limit = 50;
      } else if (tokensAmount >= 1000000) {
        user.assistants_limit = 10;
      } else {
        user.assistants_limit = 1;
      }

      await manager.save(user);

      console.log('✅ Token package activated:', {
        id: savedPackage.id,
        tokens: tokensAmount,
        expiresAt: expiresAt.toISOString(),
      });
    });
  }

  /**
   * ✅ CRON: Проверка истёкших пакетов токенов
   */
  @Cron('0 */6 * * *') // Каждые 6 часов
  async checkExpiredTokenPackages() {
    if (this.isProcessing) {
      console.log('⚠️ Skip cron — already running');
      return;
    }

    this.isProcessing = true;
    console.log('🕒 Checking expired token packages:', new Date().toISOString());

    try {
      const now = new Date();

      const expiredPackages = await this.subscriptionRepository.find({
        where: {
          status: 'active',
          expiresAt: LessThan(now),
        },
        relations: ['user'],
      });

      console.log(`📊 Found ${expiredPackages.length} expired token packages`);

      if (expiredPackages.length === 0) return;

      const freePlan = await this.planRepository.findOne({
        where: { slug: 'free' },
      });

      if (!freePlan) {
        console.warn('⚠️ Free план не найден');
        return;
      }

      for (const pkg of expiredPackages) {
        try {
          pkg.status = 'expired';
          await this.subscriptionRepository.save(pkg);

          if (pkg.user) {
            pkg.user.plan = 'free';
            pkg.user.tokens_used = 0;
            pkg.user.tokens_limit = parseInt(freePlan.monthly_tokens.toString());
            pkg.user.assistants_limit = 1;
            await this.userRepository.save(pkg.user);

            console.log(`✅ Token package expired: ${pkg.id}, user: ${pkg.user.email} → switched to Free`);
          }
        } catch (err) {
          console.error(`❌ Failed to expire package ${pkg.id}:`, err);
        }
      }
    } catch (error) {
      console.error('❌ Error in checkExpiredTokenPackages:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * ✅ Получить активный пакет токенов
   */
  async getActiveTokenPackage(userId: string) {
    const tokenPackage = await this.subscriptionRepository.findOne({
      where: { userId, status: 'active' },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });

    if (!tokenPackage) return null;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    const tokensUsed = Number(user?.tokens_used || 0);
    const tokensLimit = Number(user?.tokens_limit || 0);

    return {
      ...tokenPackage,
      tokensUsed,
      tokensLimit,
      tokensRemaining: tokensLimit - tokensUsed,
    };
  }

  /**
   * ✅ История платежей
   */
  async getPaymentHistory(userId: string) {
    return this.paymentRepository.find({
      where: { userId },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * ✅ Отмена пакета токенов (если пользователь хочет вернуться на Free)
   */
  async cancelSubscription(userId: string, subscriptionId: string) {
    return await this.dataSource.transaction(async (manager) => {
      const tokenPackage = await manager.findOne(Subscription, {
        where: { id: subscriptionId, userId },
        relations: ['plan'],
      });

      if (!tokenPackage) {
        throw new NotFoundException('Token package not found');
      }

      if (tokenPackage.status !== 'active') {
        throw new BadRequestException('Token package is not active');
      }

      const now = new Date();
      tokenPackage.status = 'cancelled';
      await manager.save(tokenPackage);

      // Возвращаем на Free план
      await this.revertToFreePlan(userId);

      console.log('✅ Token package cancelled by user:', subscriptionId);

      return {
        success: true,
        message: 'Пакет токенов отменён. Вы переведены на Free план.',
      };
    });
  }

  /**
   * ✅ Возврат средств (если пользователь передумал)
   * Условия: не использовано больше 50k токенов
   */
  async refundPayment(userId: string, subscriptionId: string) {
    console.log('💸 Starting refund process');

    const tokenPackage = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, userId },
    });

    if (!tokenPackage) {
      throw new NotFoundException('Token package not found');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const tokensUsed = Number(user.tokens_used || 0);
    const REFUND_TOKENS_THRESHOLD = 50000; // Максимум 50k токенов для возврата

    // ⚠️ Блокируем возврат если токены использованы
    if (tokensUsed > REFUND_TOKENS_THRESHOLD) {
      throw new BadRequestException(
        `Возврат недоступен: вы использовали ${tokensUsed.toLocaleString()} токенов. ` +
        `Максимум для возврата: ${REFUND_TOKENS_THRESHOLD.toLocaleString()} токенов.`
      );
    }

    // Находим платеж
    let payment = await this.paymentRepository.findOne({
      where: { subscriptionId: tokenPackage.id },
    });

    if (!payment) {
      payment = await this.paymentRepository.findOne({
        where: {
          userId,
          planId: tokenPackage.planId,
          yookassaStatus: 'succeeded',
        },
        order: { createdAt: 'DESC' },
      });
    }

    if (!payment || payment.refunded) {
      throw new BadRequestException('Payment not found or already refunded');
    }

    try {
      const refund = await this.yooKassa.createRefund({
        payment_id: payment.yookassaPaymentId!,
        amount: {
          value: (payment.amountCents / 100).toFixed(2),
          currency: payment.currency,
        },
      });

      const now = new Date();

      payment.refunded = true;
      payment.refundAmountCents = payment.amountCents;
      payment.refundedAt = now;
      payment.yookassaRefundId = refund.id;
      await this.paymentRepository.save(payment);

      tokenPackage.status = 'cancelled';
      await this.subscriptionRepository.save(tokenPackage);

      await this.revertToFreePlan(userId);

      console.log('✅ Refund completed:', {
        refundId: refund.id,
        amount: refund.amount.value,
        tokensWereUsed: tokensUsed,
      });

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount.value,
        message: 'Возврат средств выполнен успешно.',
      };
    } catch (error) {
      console.error('❌ Refund failed:', error);
      throw new BadRequestException('Failed to process refund: ' + error.message);
    }
  }

  /**
   * ✅ Вернуть пользователя на Free план
   */
  private async revertToFreePlan(userId: string) {
    const freePlan = await this.planRepository.findOne({ where: { slug: 'free' } });
    if (!freePlan) {
      console.warn('⚠️ Free план не найден в БД');
      return;
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    user.plan = 'free';
    user.tokens_limit = parseInt(freePlan.monthly_tokens.toString());
    user.tokens_used = Math.min(Number(user.tokens_used || 0), user.tokens_limit);
    user.assistants_limit = 1;

    await this.userRepository.save(user);

    console.log('✅ User reverted to Free plan:', user.email);
  }
}