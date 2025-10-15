// backend/src/payments/payments.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment } from '../entities/payment.entity';
import { Subscription } from '../entities/subscription.entity';
import { User } from '../entities/user.entity';
import { Plan } from '../tokens/plan.entity';
import { TokensService } from '../tokens/tokens.service';

// Устанавливаем SDK ЮКасса: npm install @a2seven/yoo-checkout
import { YooCheckout } from '@a2seven/yoo-checkout';

@Injectable()
export class PaymentsService {
  private yooKassa: YooCheckout;
  private readonly GRACE_PERIOD_DAYS = 7;

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
    private tokensService: TokensService,
    private dataSource: DataSource,
  ) {
    // Инициализируем ЮКасса SDK
    const shopId = this.configService.get<string>('YOOKASSA_SHOP_ID');
    const secretKey = this.configService.get<string>('YOOKASSA_SECRET_KEY');

    if (!shopId || !secretKey) {
      console.error('❌ YooKassa credentials not configured');
    } else {
      this.yooKassa = new YooCheckout({
        shopId,
        secretKey,
      });
      console.log('✅ YooKassa initialized');
    }
  }

  /**
   * Создание платежа для подписки на план
   */
  async createPayment(userId: string, planSlug: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const plan = await this.planRepository.findOne({ where: { slug: planSlug } });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // Проверяем что план платный
    if (parseInt(plan.price_cents) === 0) {
      throw new BadRequestException('Cannot create payment for free plan');
    }

    // Создаем payment в БД
    const payment = this.paymentRepository.create({
      userId,
      planId: plan.id,
      amountCents: parseInt(plan.price_cents),
      currency: 'RUB',
      yookassaStatus: 'pending',
      description: `Подписка на план ${plan.title}`,
      metadata: {
        planSlug,
        planTitle: plan.title,
      },
    });

    const savedPayment = await this.paymentRepository.save(payment);

    try {
      // Создаем платеж в ЮКасса
      // ✅ Конвертируем центы в рубли (price_cents / 100)
      const amountInRubles = (parseInt(plan.price_cents) / 100).toFixed(2);
      
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
        description: `Подписка на план ${plan.title}`,
        metadata: {
          userId,
          paymentId: savedPayment.id,
          planId: plan.id,
          planSlug,
        },
      });

      // Обновляем payment данными от ЮКасса
      savedPayment.yookassaPaymentId = yooPayment.id;
      savedPayment.yookassaStatus = yooPayment.status;
      savedPayment.confirmationUrl = yooPayment.confirmation?.confirmation_url;
      await this.paymentRepository.save(savedPayment);

      console.log('✅ Payment created:', {
        paymentId: savedPayment.id,
        yookassaId: yooPayment.id,
        amount: yooPayment.amount.value,
        currency: 'RUB',
      });

      return {
        paymentId: savedPayment.id,
        confirmationUrl: yooPayment.confirmation?.confirmation_url,
        amount: yooPayment.amount.value,
      };
    } catch (error) {
      console.error('❌ YooKassa payment creation failed:', error);
      throw new BadRequestException('Failed to create payment');
    }
  }

  /**
   * Webhook обработчик от ЮКасса
   */
  async handleWebhook(webhookData: any) {
    console.log('📥 Webhook received:', webhookData.event);
    console.log('📦 Webhook data:', JSON.stringify(webhookData, null, 2));

    const eventType = webhookData.event;

    // ✅ Обрабатываем refund.succeeded отдельно
    if (eventType === 'refund.succeeded') {
      console.log('💸 Refund webhook received, no action needed (already processed)');
      return; // Возврат уже обработан в refundPayment()
    }

    // Обрабатываем платежи
    const yooPaymentId = webhookData.object?.id;
    if (!yooPaymentId) {
      console.error('❌ No payment ID in webhook');
      return;
    }

    console.log('🔍 Looking for payment with yookassaPaymentId:', yooPaymentId);

    const payment = await this.paymentRepository.findOne({
      where: { yookassaPaymentId: yooPaymentId },
      relations: ['plan'],
    });

    if (!payment) {
      console.error('❌ Payment not found:', yooPaymentId);
      console.error('❌ Searched in DB for yookassaPaymentId:', yooPaymentId);
      return;
    }

    console.log('✅ Payment found:', {
      id: payment.id,
      userId: payment.userId,
      planId: payment.planId,
      currentStatus: payment.yookassaStatus,
    });

    // Обновляем статус платежа
    payment.yookassaStatus = webhookData.object.status;
    payment.paymentMethod = webhookData.object.payment_method?.type;
    await this.paymentRepository.save(payment);

    console.log('✅ Payment status updated to:', webhookData.object.status);

    // Если платеж успешен - активируем подписку
    if (webhookData.object.status === 'succeeded') {
      console.log('🚀 Activating subscription...');
      
      // ✅ ПРОВЕРКА: Подписка уже активирована?
      if (payment.subscriptionId) {
        console.log('⚠️ Subscription already exists:', payment.subscriptionId);
        console.log('✅ Webhook processed (duplicate, skipped)');
        return;
      }
      
      try {
        await this.activateSubscription(payment);
        console.log('✅ Subscription activated successfully!');
      } catch (error) {
        console.error('❌ Failed to activate subscription:', error);
        throw error;
      }
    }

    console.log('✅ Webhook processed:', {
      paymentId: payment.id,
      status: webhookData.object.status,
    });
  }

  /**
   * Активация подписки после успешного платежа
   */
  private async activateSubscription(payment: Payment) {
    console.log('🔄 Starting subscription activation for payment:', payment.id);
    
    const subscription = await this.dataSource.transaction(async (manager) => {
      // Получаем план
      console.log('📦 Fetching plan:', payment.planId);
      const plan = await manager.findOne(Plan, { where: { id: payment.planId } });
      if (!plan) {
        console.error('❌ Plan not found:', payment.planId);
        throw new Error('Plan not found');
      }
      console.log('✅ Plan found:', { slug: plan.slug, title: plan.title });

      // ✅ ОЧИСТКА: Отменяем старые активные подписки пользователя
      const oldSubscriptions = await manager.find(Subscription, {
        where: { userId: payment.userId, status: 'active' },
      });
      
      if (oldSubscriptions.length > 0) {
        console.log(`🧹 Cancelling ${oldSubscriptions.length} old subscription(s)`);
        for (const oldSub of oldSubscriptions) {
          oldSub.status = 'cancelled';
          oldSub.cancelledAt = new Date();
          await manager.save(oldSub);
        }
      }

      // Создаем подписку
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + 1); // +1 месяц

      const refundDeadline = new Date(now);
      refundDeadline.setDate(refundDeadline.getDate() + this.GRACE_PERIOD_DAYS);

      console.log('📝 Creating subscription:', {
        userId: payment.userId,
        planId: plan.id,
        expiresAt: expiresAt.toISOString(),
        refundDeadline: refundDeadline.toISOString(),
      });

      const subscription = manager.create(Subscription, {
        userId: payment.userId,
        planId: plan.id,
        status: 'active',
        startedAt: now,
        expiresAt,
        refundDeadline,
        canRefund: true,
        autoRenew: true,
      });

      const savedSubscription = await manager.save(subscription);
      console.log('✅ Subscription created:', savedSubscription.id);

      // Связываем payment с subscription
      payment.subscriptionId = savedSubscription.id;
      await manager.save(payment);
      console.log('✅ Payment linked to subscription');

      // Обновляем пользователя
      console.log('📝 Updating user:', payment.userId);
      const user = await manager.findOne(User, { where: { id: payment.userId } });
      if (user) {
        const oldPlan = user.plan;
        const oldPlanId = user.plan_id;
        
        // ✅ ОБНОВЛЯЕМ ОБА ПОЛЯ: plan (текстовое) и plan_id (UUID)
        user.plan = plan.slug;  // <- Это поле читает фронтенд!
        user.plan_id = plan.id;
        
        // ✅ ЗАМЕНЯЕМ лимит токенов (не складываем!)
        user.tokens_limit = parseInt(plan.monthly_tokens);
        
        // ✅ СБРАСЫВАЕМ использованные токены при смене плана
        user.tokens_used = 0;
        
        user.assistants_limit = 
          plan.slug === 'free' ? 1 :
          plan.slug === 'pro' ? 10 :
          plan.slug === 'max' ? 50 : 1;

        await manager.save(user);
        console.log('✅ User updated:', {
          oldPlan: `${oldPlan} (${oldPlanId})`,
          newPlan: `${plan.slug} (${plan.id})`,
          newLimit: user.tokens_limit,
          tokensReset: true,
        });

        // ❌ НЕ НУЖНО добавлять токены - они уже установлены через tokens_limit!
        // tokensToAdd = 0;
      } else {
        console.error('❌ User not found:', payment.userId);
      }

      console.log('✅ Transaction completed successfully');
      return savedSubscription;
    });

    console.log('✅ Subscription activated:', {
      userId: payment.userId,
      subscriptionId: subscription.id,
    });

    return subscription;
  }

  /**
   * Отмена подписки
   */
  async cancelSubscription(userId: string, subscriptionId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, userId },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== 'active') {
      throw new BadRequestException('Subscription is not active');
    }

    const now = new Date();
    subscription.status = 'cancelled';
    subscription.cancelledAt = now;
    subscription.autoRenew = false;

    await this.subscriptionRepository.save(subscription);

    // ✅ НЕ возвращаем на Free сразу - токены активны до конца периода
    // await this.revertToFreePlan(userId); <- Убрали!

    console.log('✅ Subscription cancelled:', subscriptionId);
    
    const expiresAt = subscription.expiresAt;
    const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      success: true,
      canRefund: subscription.canRefund && now <= subscription.refundDeadline!,
      expiresAt,
      daysLeft,
      message: subscription.canRefund && now <= subscription.refundDeadline!
        ? `Подписка отменена. Вы можете запросить возврат средств. План будет активен до ${expiresAt.toLocaleDateString('ru-RU')}.`
        : `Подписка отменена. Токены останутся активными до ${expiresAt.toLocaleDateString('ru-RU')} (${daysLeft} дн.). После этого вы автоматически перейдёте на бесплатный план.`,
    };
  }

  /**
   * Возврат средств (только в течение grace period)
   */
  async refundPayment(userId: string, subscriptionId: string) {
    console.log('💸 Starting refund process:', { userId, subscriptionId });
    
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      console.error('❌ Subscription not found:', subscriptionId);
      throw new NotFoundException('Subscription not found');
    }

    const now = new Date();
    console.log('🔍 Checking refund eligibility:', {
      canRefund: subscription.canRefund,
      refundDeadline: subscription.refundDeadline,
      now: now.toISOString(),
      isBeforeDeadline: now <= subscription.refundDeadline!,
    });
    
    if (!subscription.canRefund || now > subscription.refundDeadline!) {
      console.error('❌ Refund not available:', {
        canRefund: subscription.canRefund,
        expired: now > subscription.refundDeadline!,
      });
      throw new BadRequestException(
        `Возврат средств доступен только в течение ${this.GRACE_PERIOD_DAYS} дней после оплаты`
      );
    }

    // Находим платеж
    console.log('🔍 Looking for payment for subscription:', subscriptionId);
    
    // ✅ Ищем payment связанный с этой подпиской ИЛИ с тем же пользователем и планом
    let payment = await this.paymentRepository.findOne({
      where: { subscriptionId: subscription.id },
    });

    // Если не нашли по subscriptionId, ищем по userId и planId (на случай дублей)
    if (!payment) {
      console.log('🔍 Trying alternative search: userId + planId + recent');
      payment = await this.paymentRepository.findOne({
        where: { 
          userId,
          planId: subscription.planId,
          yookassaStatus: 'succeeded',
        },
        order: { createdAt: 'DESC' },
      });
    }

    if (!payment || payment.refunded) {
      console.error('❌ Payment issue:', {
        found: !!payment,
        refunded: payment?.refunded,
        subscriptionId,
        userId,
      });
      throw new BadRequestException('Payment not found or already refunded');
    }

    console.log('✅ Payment found:', {
      id: payment.id,
      yookassaPaymentId: payment.yookassaPaymentId,
      amount: payment.amountCents,
      subscriptionId: payment.subscriptionId,
    });

    try {
      console.log('💳 Creating refund in YooKassa...');
      
      // Создаем возврат в ЮКасса
      const refund = await this.yooKassa.createRefund({
        payment_id: payment.yookassaPaymentId!,
        amount: {
          value: (payment.amountCents / 100).toFixed(2),
          currency: payment.currency,
        },
      });

      console.log('✅ YooKassa refund created:', {
        refundId: refund.id,
        status: refund.status,
      });

      // Обновляем payment
      payment.refunded = true;
      payment.refundAmountCents = payment.amountCents;
      payment.refundedAt = now;
      payment.yookassaRefundId = refund.id;
      await this.paymentRepository.save(payment);
      console.log('✅ Payment updated with refund info');

      // Деактивируем подписку
      subscription.status = 'cancelled';
      subscription.canRefund = false;
      await this.subscriptionRepository.save(subscription);
      console.log('✅ Subscription cancelled');

      // Списываем токены и возвращаем к free плану
      console.log('🔄 Reverting to free plan...');
      await this.revertToFreePlan(userId);

      console.log('✅ Refund processed:', {
        subscriptionId,
        refundId: refund.id,
      });

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount.value,
        message: 'Возврат средств выполнен успешно',
      };
    } catch (error) {
      console.error('❌ Refund failed:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
      });
      throw new BadRequestException('Failed to process refund: ' + error.message);
    }
  }

  /**
   * Возврат пользователя на Free план
   */
  private async revertToFreePlan(userId: string) {
    const freePlan = await this.planRepository.findOne({ where: { slug: 'free' } });
    if (!freePlan) return;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    // ✅ Обновляем оба поля
    user.plan = freePlan.slug;  // Текстовое поле
    user.plan_id = freePlan.id;  // UUID поле
    user.tokens_limit = parseInt(freePlan.monthly_tokens);
    user.tokens_used = 0;  // Сбрасываем использованные токены
    user.assistants_limit = 1;

    await this.userRepository.save(user);
    
    console.log('✅ User reverted to Free plan:', {
      userId,
      plan: user.plan,
      tokensLimit: user.tokens_limit,
    });
  }

  /**
   * Получить активную подписку пользователя
   */
  async getActiveSubscription(userId: string) {
    // ✅ Получаем самую свежую активную подписку
    return this.subscriptionRepository.findOne({
      where: { userId, status: 'active' },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * История платежей пользователя
   */
  async getPaymentHistory(userId: string) {
    return this.paymentRepository.find({
      where: { userId },
      relations: ['plan', 'subscription'],
      order: { createdAt: 'DESC' },
    });
  }
}