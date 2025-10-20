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

  async handleWebhook(webhookData: any) {
    console.log('🔥 Webhook received:', webhookData.event);
    console.log('📦 Webhook data:', JSON.stringify(webhookData, null, 2));

    const eventType = webhookData.event;

    if (eventType === 'refund.succeeded') {
      console.log('💸 Refund webhook received, no action needed (already processed)');
      return;
    }

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
      return;
    }

    console.log('✅ Payment found:', {
      id: payment.id,
      userId: payment.userId,
      planId: payment.planId,
      currentStatus: payment.yookassaStatus,
    });

    payment.yookassaStatus = webhookData.object.status;
    payment.paymentMethod = webhookData.object.payment_method?.type;
    await this.paymentRepository.save(payment);

    console.log('✅ Payment status updated to:', webhookData.object.status);

    if (webhookData.object.status === 'succeeded') {
      console.log('🚀 Activating subscription...');
      
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

  private async activateSubscription(payment: Payment) {
    console.log('📄 Starting subscription activation for payment:', payment.id);
    
    const subscription = await this.dataSource.transaction(async (manager) => {
      console.log('📦 Fetching plan:', payment.planId);
      const plan = await manager.findOne(Plan, { where: { id: payment.planId } });
      if (!plan) {
        console.error('❌ Plan not found:', payment.planId);
        throw new Error('Plan not found');
      }
      console.log('✅ Plan found:', { slug: plan.slug, title: plan.title });

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

      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + 1);

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

      payment.subscriptionId = savedSubscription.id;
      await manager.save(payment);
      console.log('✅ Payment linked to subscription');

      console.log('👤 Updating user:', payment.userId);
      const user = await manager.findOne(User, { where: { id: payment.userId } });
      if (user) {
        const oldPlan = user.plan;
        
        // ✅ ВАЖНО: При смене плана ВСЕГДА обнуляем tokens_used
        user.plan = plan.slug;
        user.plan_id = plan.id;
        user.tokens_limit = parseInt(plan.monthly_tokens);
        user.tokens_used = 0; // ✅ СБРОС ТОКЕНОВ ПРИ АПГРЕЙДЕ
        user.assistants_limit = 
          plan.slug === 'free' ? 1 :
          plan.slug === 'pro' ? 10 :
          plan.slug === 'max' ? 50 : 1;

        await manager.save(user);
        console.log('✅ User updated:', {
          oldPlan,
          newPlan: plan.slug,
          newLimit: user.tokens_limit,
          tokensReset: true, // ✅ Подтверждаем сброс
        });
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
   * ✅ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверка использованных токенов перед возвратом
   */
  async refundPayment(userId: string, subscriptionId: string) {
    console.log('💸 Starting refund process:', { userId, subscriptionId });
    
    // ✅ ШАГ 1: Проверяем подписку
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      console.error('❌ Subscription not found:', subscriptionId);
      throw new NotFoundException('Subscription not found');
    }

    // ✅ ШАГ 2: Проверяем сроки возврата
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

    // ✅ ШАГ 3: КРИТИЧЕСКИ ВАЖНО - Проверяем использованные токены!
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const tokensUsed = Number(user.tokens_used || 0);
    
    console.log('🔍 Checking tokens usage:', {
      userId,
      tokensUsed,
      tokensLimit: user.tokens_limit,
    });

    // ❌ БЛОКИРУЕМ ВОЗВРАТ если хоть 1 токен использован
    if (tokensUsed > 0) {
      console.error('❌ Refund blocked: tokens were used', {
        tokensUsed,
        message: 'Cannot refund when tokens have been used',
      });
      throw new BadRequestException(
        `Возврат недоступен: вы уже использовали ${tokensUsed.toLocaleString()} токенов. ` +
        `Возврат возможен только если токены не были использованы.`
      );
    }

    console.log('✅ Tokens check passed: no tokens used');

    // ✅ ШАГ 4: Находим платеж
    console.log('🔍 Looking for payment for subscription:', subscriptionId);
    
    let payment = await this.paymentRepository.findOne({
      where: { subscriptionId: subscription.id },
    });

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

      // Возвращаем к free плану
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
      throw new BadRequestException('Failed to process refund: ' + error.message);
    }
  }

  /**
   * ✅ ИСПРАВЛЕНО: При возврате правильно обрабатываем токены
   */
  private async revertToFreePlan(userId: string) {
    const freePlan = await this.planRepository.findOne({ where: { slug: 'free' } });
    if (!freePlan) return;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    user.plan = freePlan.slug;
    user.plan_id = freePlan.id;
    user.tokens_limit = parseInt(freePlan.monthly_tokens);
    
    // ✅ ИСПРАВЛЕНО: Не больше чем лимит Free плана
    user.tokens_used = Math.min(Number(user.tokens_used || 0), user.tokens_limit);
    
    user.assistants_limit = 1;

    await this.userRepository.save(user);
    
    console.log('✅ User reverted to Free plan:', {
      userId,
      plan: user.plan,
      tokensLimit: user.tokens_limit,
      tokensUsed: user.tokens_used,
    });
  }

  /**
   * ✅ ОБНОВЛЕНО: Возвращаем info о токенах для фронтенда
   */
  async getActiveSubscription(userId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId, status: 'active' },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });

    if (!subscription) return null;

    // ✅ Добавляем информацию о токенах
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const tokensUsed = Number(user?.tokens_used || 0);

    // ✅ Возврат НЕ доступен если токены использованы
    const canRefundWithTokens = subscription.canRefund && tokensUsed === 0;

    return {
      ...subscription,
      tokensUsed, // ✅ Добавляем для фронтенда
      canRefundWithTokens, // ✅ Реальная доступность возврата
    };
  }

  async getPaymentHistory(userId: string) {
    return this.paymentRepository.find({
      where: { userId },
      relations: ['plan', 'subscription'],
      order: { createdAt: 'DESC' },
    });
  }
}