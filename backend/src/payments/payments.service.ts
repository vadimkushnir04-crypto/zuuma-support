// backend/src/payments/payments.service.ts
// ✅ ПОЛНАЯ ВЕРСИЯ с рекуррентными платежами

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThanOrEqual } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment } from '../entities/payment.entity';
import { Subscription } from '../entities/subscription.entity';
import { User } from '../entities/user.entity';
import { Plan } from '../tokens/plan.entity';
import { TokensService } from '../tokens/tokens.service';
import { YooCheckout } from '@a2seven/yoo-checkout';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PaymentsService {
  private yooKassa: YooCheckout;
  private readonly GRACE_PERIOD_DAYS = 7;
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private isProcessing = false;
  
  // ✅ ТЕСТОВЫЙ РЕЖИМ: true = минуты вместо месяцев
  private readonly TEST_MODE = process.env.SUBSCRIPTION_TEST_MODE === 'true';
  private readonly TEST_PERIOD_MINUTES = 2; // Тестовая подписка на 2 минуты

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
    const shopId = this.configService.get<string>('YOOKASSA_SHOP_ID');
    const secretKey = this.configService.get<string>('YOOKASSA_SECRET_KEY');

    if (!shopId || !secretKey) {
      console.error('❌ YooKassa credentials not configured');
    } else {
      this.yooKassa = new YooCheckout({ shopId, secretKey });
      console.log('✅ YooKassa initialized');
      
      if (this.TEST_MODE) {
        console.log(`⚠️ TEST MODE ENABLED: Subscriptions expire in ${this.TEST_PERIOD_MINUTES} minutes`);
      }
    }
  }

  /**
   * ✅ ОБНОВЛЕНО: Создание платежа с сохранением платежного метода
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

    if (parseInt(plan.price_cents) === 0) {
      throw new BadRequestException('Cannot create payment for free plan');
    }

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
      const amountInRubles = (parseInt(plan.price_cents) / 100).toFixed(2);
      
      // ✅ ВАЖНО: Добавляем save_payment_method для рекуррентных платежей
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
        save_payment_method: true, // ✅ СОХРАНЯЕМ ПЛАТЕЖНЫЙ МЕТОД
        description: `Подписка на план ${plan.title} (автопродление)`,
        metadata: {
          userId,
          paymentId: savedPayment.id,
          planId: plan.id,
          planSlug,
        },
      });

      savedPayment.yookassaPaymentId = yooPayment.id;
      savedPayment.yookassaStatus = yooPayment.status;
      savedPayment.confirmationUrl = yooPayment.confirmation?.confirmation_url;
      await this.paymentRepository.save(savedPayment);

      console.log('✅ Payment created with save_payment_method:', {
        paymentId: savedPayment.id,
        yookassaId: yooPayment.id,
        amount: yooPayment.amount.value,
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
   * ✅ ОБНОВЛЕНО: Webhook с сохранением payment_method_id
   */
  async handleWebhook(webhookData: any) {
    console.log('🔥 Webhook received:', webhookData.event);

    const eventType = webhookData.event;

    if (eventType === 'refund.succeeded') {
      console.log('💸 Refund webhook, no action needed');
      return;
    }

    const yooPaymentId = webhookData.object?.id;
    if (!yooPaymentId) {
      console.error('❌ No payment ID in webhook');
      return;
    }

    const payment = await this.paymentRepository.findOne({
      where: { yookassaPaymentId: yooPaymentId },
      relations: ['plan'],
    });

    if (!payment) {
      console.error('❌ Payment not found:', yooPaymentId);
      return;
    }

    payment.yookassaStatus = webhookData.object.status;
    payment.paymentMethod = webhookData.object.payment_method?.type;
    await this.paymentRepository.save(payment);

    if (webhookData.object.status === 'succeeded') {
      console.log('🚀 Activating subscription...');
      
      if (payment.subscriptionId) {
        console.log('⚠️ Subscription already exists');
        return;
      }
      
      // ✅ ВАЖНО: Извлекаем payment_method_id из webhook
      const paymentMethodId = webhookData.object.payment_method?.id;
      
      try {
        await this.activateSubscription(payment, paymentMethodId);
        console.log('✅ Subscription activated with payment method:', paymentMethodId);
      } catch (error) {
        console.error('❌ Failed to activate subscription:', error);
        throw error;
      }
    }

    console.log('✅ Webhook processed');
  }

  /**
   * ✅ ОБНОВЛЕНО: Активация подписки с payment_method_id и next_billing_date
   */
  private async activateSubscription(payment: Payment, paymentMethodId?: string) {
    console.log('📄 Starting subscription activation');
    
    const subscription = await this.dataSource.transaction(async (manager) => {
      const plan = await manager.findOne(Plan, { where: { id: payment.planId } });
      if (!plan) {
        throw new Error('Plan not found');
      }

      // Отменяем старые подписки
      const oldSubscriptions = await manager.find(Subscription, {
        where: { userId: payment.userId, status: 'active' },
      });
      
      for (const oldSub of oldSubscriptions) {
        oldSub.status = 'cancelled';
        oldSub.cancelledAt = new Date();
        await manager.save(oldSub);
      }

      const now = new Date();
      
      // ✅ ТЕСТОВЫЙ РЕЖИМ: Короткий период вместо месяца
      const expiresAt = new Date(now);
      const nextBillingDate = new Date(now);
      
      if (this.TEST_MODE) {
        // Тест: +2 минуты
        expiresAt.setMinutes(expiresAt.getMinutes() + this.TEST_PERIOD_MINUTES);
        nextBillingDate.setMinutes(nextBillingDate.getMinutes() + this.TEST_PERIOD_MINUTES);
        console.log(`⚠️ TEST MODE: Expires at ${expiresAt.toISOString()}`);
      } else {
        // Продакшн: +1 месяц
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      }

      const refundDeadline = new Date(now);
      refundDeadline.setDate(refundDeadline.getDate() + this.GRACE_PERIOD_DAYS);

      const subscription = manager.create(Subscription, {
        userId: payment.userId,
        planId: plan.id,
        status: 'active',
        startedAt: now,
        expiresAt,
        refundDeadline,
        canRefund: true,
        autoRenew: true,
        paymentMethodId, // ✅ СОХРАНЯЕМ payment_method_id
        nextBillingDate, // ✅ УСТАНАВЛИВАЕМ дату следующего списания
        failedPaymentsCount: 0,
      });

      const savedSubscription = await manager.save(subscription);

      payment.subscriptionId = savedSubscription.id;
      await manager.save(payment);

      // Обновляем пользователя
      const user = await manager.findOne(User, { where: { id: payment.userId } });
      if (user) {
        user.plan = plan.slug as 'free' | 'pro' | 'max';
        user.tokens_limit = parseInt(plan.monthly_tokens);
        user.tokens_used = 0;
        user.assistants_limit = 
          plan.slug === 'free' ? 1 :
          plan.slug === 'pro' ? 10 :
          plan.slug === 'max' ? 50 : 1;

        await manager.save(user);
      }

      console.log('✅ Subscription activated:', {
        id: savedSubscription.id,
        expiresAt: expiresAt.toISOString(),
        nextBillingDate: nextBillingDate.toISOString(),
        hasPaymentMethod: !!paymentMethodId,
      });

      return savedSubscription;
    });

    return subscription;
  }

  /**
   * ✅ CRON-задача с защитой от параллельного запуска
   * Использует advisory lock на уровне PostgreSQL
   */
  @Cron(process.env.SUBSCRIPTION_TEST_MODE === 'true' ? '*/1 * * * *' : '0 * * * *')
  async checkExpiringSubs() {
    if (this.isProcessing) {
      console.log('⚠️ Skip cron — already running in this instance');
      return;
    }

    this.isProcessing = true;
    console.log('🕒 CRON TRIGGERED', new Date().toISOString());

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // 🔒 Пытаемся захватить advisory lock (уникальный ключ 987654321)
      const lockResult = await queryRunner.query(`SELECT pg_try_advisory_lock(987654321);`);
      const lockAcquired = lockResult[0]?.pg_try_advisory_lock;

      if (!lockAcquired) {
        console.log('⚠️ Another instance is already running checkExpiringSubs() — skipping');
        return;
      }

      console.log('🔐 Lock acquired — processing recurring payments...');
      await this.processRecurringPayments();

    } catch (error) {
      console.error('❌ Error in cron job:', error);
    } finally {
      // 🔓 Освобождаем блокировку, если взяли её
      try {
        await queryRunner.query(`SELECT pg_advisory_unlock(987654321);`);
      } catch (e) {
        console.warn('⚠️ Could not release advisory lock:', e);
      }
      await queryRunner.release();
      this.isProcessing = false;
    }
  }

  /**
   * ✅ НОВОЕ: Обработка автоматических платежей
   */
  async processRecurringPayments() {
    console.log('🚀 Starting processRecurringPayments()');
    const now = new Date();
    
    const subscriptionsToRenew = await this.subscriptionRepository.find({
      where: {
        status: 'active',
        autoRenew: true,
        nextBillingDate: LessThanOrEqual(now),
      },
      relations: ['plan', 'user'],
    });

    console.log(`📊 Found ${subscriptionsToRenew.length} subscriptions to renew`);

    for (const subscription of subscriptionsToRenew) {
      try {
        await this.renewSubscription(subscription);
      } catch (error) {
        console.error(`❌ Failed to renew subscription ${subscription.id}:`, error);
      }
    }
  }

  /**
   * ✅ НОВОЕ: Продление подписки с автоплатежом
   */
  private async renewSubscription(subscription: Subscription) {
    console.log(`🔄 Renewing subscription: ${subscription.id}`);

    // Проверяем что есть сохраненный платежный метод
    if (!subscription.paymentMethodId) {
      console.error('❌ No payment method saved, cannot auto-renew');
      await this.handleFailedRenewal(subscription, 'NO_PAYMENT_METHOD');
      return;
    }

    // Проверяем лимит попыток
    if (subscription.failedPaymentsCount >= this.MAX_RETRY_ATTEMPTS) {
      console.error('❌ Max retry attempts reached');
      await this.cancelSubscriptionDueToFailure(subscription);
      return;
    }

    try {
      const plan = subscription.plan;
      const amountInRubles = (parseInt(plan.price_cents) / 100).toFixed(2);

      // ✅ Создаем рекуррентный платеж используя сохраненный метод
      const payment = await this.yooKassa.createPayment({
        amount: {
          value: amountInRubles,
          currency: 'RUB',
        },
        payment_method_id: subscription.paymentMethodId, // ✅ ИСПОЛЬЗУЕМ сохраненный метод
        capture: true,
        description: `Автопродление подписки ${plan.title}`,
        metadata: {
          userId: subscription.userId,
          subscriptionId: subscription.id,
          planId: plan.id,
          recurring: true,
        },
      });

      // Сохраняем платеж в БД
      const savedPayment = await this.paymentRepository.save({
        userId: subscription.userId,
        planId: plan.id,
        subscriptionId: subscription.id,
        amountCents: parseInt(plan.price_cents),
        currency: 'RUB',
        yookassaPaymentId: payment.id,
        yookassaStatus: payment.status,
        description: `Автопродление подписки ${plan.title}`,
        metadata: {
          recurring: true,
          subscriptionId: subscription.id,
        },
      });

      console.log('✅ Recurring payment created:', {
        paymentId: savedPayment.id,
        yookassaId: payment.id,
        status: payment.status,
      });

      // Если платеж сразу succeeded (обычно так и есть при сохраненном методе)
      if (payment.status === 'succeeded') {
        await this.handleSuccessfulRenewal(subscription);
      } else {
        // Иначе ждем webhook
        subscription.lastPaymentAttempt = new Date();
        await this.subscriptionRepository.save(subscription);
      }

    } catch (error) {
      console.error('❌ Recurring payment failed:', error);
      await this.handleFailedRenewal(subscription, error.message);
    }
  }

  /**
   * ✅ НОВОЕ: Успешное продление
   */
  private async handleSuccessfulRenewal(subscription: Subscription) {
    const now = new Date();
    
    // ✅ ИСПРАВЛЕНО: Проверка на undefined перед использованием
    const currentExpiresAt = subscription.expiresAt || now;
    const currentNextBillingDate = subscription.nextBillingDate || now;
    
    // Продлеваем подписку
    const newExpiresAt = new Date(currentExpiresAt);
    const newNextBillingDate = new Date(currentNextBillingDate);
    
    if (this.TEST_MODE) {
      newExpiresAt.setMinutes(newExpiresAt.getMinutes() + this.TEST_PERIOD_MINUTES);
      newNextBillingDate.setMinutes(newNextBillingDate.getMinutes() + this.TEST_PERIOD_MINUTES);
    } else {
      newExpiresAt.setMonth(newExpiresAt.getMonth() + 1);
      newNextBillingDate.setMonth(newNextBillingDate.getMonth() + 1);
    }

    subscription.expiresAt = newExpiresAt;
    subscription.nextBillingDate = newNextBillingDate;
    subscription.failedPaymentsCount = 0; // Сбрасываем счетчик ошибок
    subscription.lastPaymentAttempt = now;

    await this.subscriptionRepository.save(subscription);

    // Обновляем токены пользователя (сбрасываем счетчик)
    const user = await this.userRepository.findOne({ 
      where: { id: subscription.userId } 
    });
    
    if (user) {
      user.tokens_used = 0; // Сброс при продлении
      await this.userRepository.save(user);
    }

    console.log('✅ Subscription renewed successfully:', {
      subscriptionId: subscription.id,
      newExpiresAt: newExpiresAt.toISOString(),
      newNextBillingDate: newNextBillingDate.toISOString(),
    });

    // TODO: Отправить email о успешном продлении
  }

  /**
   * ✅ НОВОЕ: Неудачное продление
   */
  private async handleFailedRenewal(subscription: Subscription, reason: string) {
    subscription.failedPaymentsCount += 1;
    subscription.lastPaymentAttempt = new Date();

    await this.subscriptionRepository.save(subscription);

    console.log(`⚠️ Renewal failed (attempt ${subscription.failedPaymentsCount}/${this.MAX_RETRY_ATTEMPTS}):`, {
      subscriptionId: subscription.id,
      reason,
    });

    // TODO: Отправить email о неудачной попытке списания
    
    // Если это последняя попытка - отменяем подписку
    if (subscription.failedPaymentsCount >= this.MAX_RETRY_ATTEMPTS) {
      await this.cancelSubscriptionDueToFailure(subscription);
    }
  }

  /**
   * ✅ НОВОЕ: Отмена подписки из-за неудачных платежей
   */
  private async cancelSubscriptionDueToFailure(subscription: Subscription) {
    subscription.status = 'payment_failed';
    subscription.autoRenew = false;
    await this.subscriptionRepository.save(subscription);

    // Возвращаем пользователя на Free план
    await this.revertToFreePlan(subscription.userId);

    console.log('❌ Subscription cancelled due to payment failures:', subscription.id);

    // TODO: Отправить email о отмене подписки
  }

  /**
   * Отмена подписки пользователем
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
    subscription.autoRenew = false; // ✅ ОТКЛЮЧАЕМ автопродление

    await this.subscriptionRepository.save(subscription);

    console.log('✅ Subscription cancelled by user:', subscriptionId);
    
    const expiresAt = subscription.expiresAt;
    const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      success: true,
      canRefund: subscription.canRefund && now <= subscription.refundDeadline!,
      expiresAt,
      daysLeft,
      message: subscription.canRefund && now <= subscription.refundDeadline!
        ? `Подписка отменена. Автопродление отключено. Вы можете запросить возврат средств. План будет активен до ${expiresAt.toLocaleDateString('ru-RU')}.`
        : `Подписка отменена. Автопродление отключено. Токены останутся активными до ${expiresAt.toLocaleDateString('ru-RU')} (${daysLeft} дн.).`,
    };
  }

  /**
   * ✅ НОВЫЙ МЕТОД: Принудительный возврат (для админа)
   * Обходит все проверки токенов и дедлайнов
   */
  async forceRefund(subscriptionId: string, adminEmail: string) {
    console.log('🛡️ Force refund initiated by admin:', adminEmail);
    
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['user'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const user = subscription.user;
    const tokensUsed = Number(user.tokens_used || 0);

    // ⚠️ ПРЕДУПРЕЖДЕНИЕ в логах если токены использованы
    if (tokensUsed > 0) {
      console.warn(`⚠️ Admin ${adminEmail} is refunding subscription with ${tokensUsed} tokens used`);
    }

    // Находим платеж
    let payment = await this.paymentRepository.findOne({
      where: { subscriptionId: subscription.id },
    });

    if (!payment) {
      payment = await this.paymentRepository.findOne({
        where: { 
          userId: subscription.userId,
          planId: subscription.planId,
          yookassaStatus: 'succeeded',
        },
        order: { createdAt: 'DESC' },
      });
    }

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    if (payment.refunded) {
      throw new BadRequestException('Payment already refunded');
    }

    // ✅ Создаем возврат в ЮKassa (БЕЗ проверок)
    try {
      const refund = await this.yooKassa.createRefund({
        payment_id: payment.yookassaPaymentId!,
        amount: {
          value: (payment.amountCents / 100).toFixed(2),
          currency: payment.currency,
        },
      });

      const now = new Date();

      // Обновляем платеж
      payment.refunded = true;
      payment.refundAmountCents = payment.amountCents;
      payment.refundedAt = now;
      payment.yookassaRefundId = refund.id;
      await this.paymentRepository.save(payment);

      // Отменяем подписку
      subscription.status = 'cancelled';
      subscription.canRefund = false;
      subscription.autoRenew = false;
      await this.subscriptionRepository.save(subscription);

      // Возвращаем на Free план
      await this.revertToFreePlan(subscription.userId);

      console.log('✅ Force refund completed by admin:', {
        admin: adminEmail,
        refundId: refund.id,
        amount: refund.amount.value,
        tokensWereUsed: tokensUsed,
      });

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount.value,
        message: 'Возврат средств выполнен администратором (обход проверок)',
        tokensUsed,
      };
    } catch (error) {
      console.error('❌ Force refund failed:', error);
      throw new BadRequestException('Failed to process force refund: ' + error.message);
    }
  }

  /**
   * Возврат средств
   */
  async refundPayment(userId: string, subscriptionId: string) {
    console.log('💸 Starting refund process');
    
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // ✅ ИСПРАВЛЕНО: Проверяем токены ДО проверки времени
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const tokensUsed = Number(user.tokens_used || 0);
    const REFUND_TOKENS_THRESHOLD = 50000; // Настраиваемый порог

    // ⚠️ КРИТИЧНО: Блокируем возврат если токены использованы
    if (tokensUsed > REFUND_TOKENS_THRESHOLD) {
      throw new BadRequestException(
        `Возврат недоступен: вы использовали ${tokensUsed.toLocaleString()} токенов. ` +
        `Максимум для возврата: ${REFUND_TOKENS_THRESHOLD.toLocaleString()} токенов.`
      );
    }

    // Проверяем дедлайн возврата
    const now = new Date();
    if (!subscription.canRefund || now > subscription.refundDeadline!) {
      throw new BadRequestException(
        `Возврат средств доступен только в течение ${this.GRACE_PERIOD_DAYS} дней после оплаты`
      );
    }

    let payment = await this.paymentRepository.findOne({
      where: { subscriptionId: subscription.id },
    });

    if (!payment) {
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

      payment.refunded = true;
      payment.refundAmountCents = payment.amountCents;
      payment.refundedAt = now;
      payment.yookassaRefundId = refund.id;
      await this.paymentRepository.save(payment);

      subscription.status = 'cancelled';
      subscription.canRefund = false;
      subscription.autoRenew = false;
      await this.subscriptionRepository.save(subscription);

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
        message: 'Возврат средств выполнен успешно. Автопродление отключено.',
      };
    } catch (error) {
      console.error('❌ Refund failed:', error);
      throw new BadRequestException('Failed to process refund: ' + error.message);
    }
  }

  private async revertToFreePlan(userId: string) {
    const freePlan = await this.planRepository.findOne({ where: { slug: 'free' } });
    if (!freePlan) return;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    user.plan = 'free';
    user.tokens_limit = parseInt(freePlan.monthly_tokens);
    user.tokens_used = Math.min(Number(user.tokens_used || 0), user.tokens_limit);
    user.assistants_limit = 1;

    await this.userRepository.save(user);
  }

  async getActiveSubscription(userId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId, status: 'active' },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });

    if (!subscription) return null;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    const tokensUsed = Number(user?.tokens_used || 0);

    return {
      ...subscription,
      tokensUsed,
      canRefundWithTokens: subscription.canRefund && tokensUsed === 0,
    };
  }

  async getPaymentHistory(userId: string) {
    return this.paymentRepository.find({
      where: { userId },
      relations: ['plan', 'subscription'],
      order: { createdAt: 'DESC' },
    });
  }

  async toggleAutoRenew(userId: string, subscriptionId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== 'active') {
      throw new BadRequestException('Subscription is not active');
    }

    // Переключаем флаг
    subscription.autoRenew = !subscription.autoRenew;
    await this.subscriptionRepository.save(subscription);

    const message = subscription.autoRenew
      ? `✅ Автопродление включено. Следующее списание: ${subscription.nextBillingDate?.toLocaleDateString('ru-RU')}`
      : '❌ Автопродление отключено. Подписка останется активной до конца оплаченного периода.';

    console.log(`🔄 Auto-renew toggled:`, {
      subscriptionId,
      autoRenew: subscription.autoRenew,
    });

    return {
      success: true,
      autoRenew: subscription.autoRenew,
      message,
    };
  }

}