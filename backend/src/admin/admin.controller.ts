// backend/src/admin/admin.controller.ts

import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Query, 
  UseGuards,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { User } from '../entities/user.entity';
import { Subscription } from '../entities/subscription.entity';
import { PaymentsService } from '../payments/payments.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard) // ✅ Защита всех эндпоинтов
export class AdminController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    private paymentsService: PaymentsService,
  ) {}

  /**
   * Поиск пользователя по email
   * GET /admin/users/search?email=user@example.com
   */
  @Get('users/search')
  async searchUser(@Query('email') email: string) {
    if (!email) {
      throw new NotFoundException('Email parameter is required');
    }

    const user = await this.userRepository.findOne({ 
      where: { email: email.toLowerCase() } 
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Возвращаем только необходимые данные
    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name, // ✅ snake_case
      plan: user.plan,
      tokensUsed: user.tokens_used || 0,
      tokensLimit: user.tokens_limit || 0,
      assistantsLimit: user.assistants_limit || 1,
      createdAt: user.created_at,
    };
  }

  /**
   * Получение подписки пользователя
   * GET /admin/users/:userId/subscription
   */
  @Get('users/:userId/subscription')
  async getUserSubscription(@Param('userId') userId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId, status: 'active' },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });

    if (!subscription) {
      throw new NotFoundException('Активная подписка не найдена');
    }

    return {
      id: subscription.id,
      planId: subscription.planId,
      status: subscription.status,
      startedAt: subscription.startedAt,
      expiresAt: subscription.expiresAt,
      autoRenew: subscription.autoRenew,
      paymentMethodId: subscription.paymentMethodId,
      nextBillingDate: subscription.nextBillingDate,
      failedPaymentsCount: subscription.failedPaymentsCount,
      cancelledAt: subscription.cancelledAt,
    };
  }

  /**
   * Отмена подписки администратором
   * POST /admin/subscriptions/:subscriptionId/cancel
   */
  @Post('subscriptions/:subscriptionId/cancel')
  async cancelSubscription(
    @Param('subscriptionId') subscriptionId: string,
    @Req() req: any,
  ) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['user'],
    });

    if (!subscription) {
      throw new NotFoundException('Подписка не найдена');
    }

    // Логируем действие администратора
    console.log('🛡️ Admin action: Cancel subscription', {
      admin: req.user.email,
      subscriptionId,
      userId: subscription.userId,
    });

    // Используем существующий метод
    const result = await this.paymentsService.cancelSubscription(
      subscription.userId, 
      subscriptionId
    );

    return {
      success: true,
      message: `Подписка отменена администратором. ${result.message}`,
      subscription: {
        id: subscriptionId,
        status: 'cancelled',
        expiresAt: result.expiresAt,
        autoRenew: false,
      },
    };
  }

  /**
   * Возврат средств администратором
   * POST /admin/subscriptions/:subscriptionId/refund
   */
  @Post('subscriptions/:subscriptionId/refund')
  async refundSubscription(
    @Param('subscriptionId') subscriptionId: string,
    @Req() req: any,
  ) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['user'],
    });

    if (!subscription) {
      throw new NotFoundException('Подписка не найдена');
    }

    const user = subscription.user;
    const tokensUsed = Number(user.tokens_used || 0);

    // Логируем действие администратора с предупреждением
    console.log('🛡️ Admin action: Refund subscription', {
      admin: req.user.email,
      subscriptionId,
      userId: subscription.userId,
      tokensUsed,
      warning: tokensUsed > 0 ? 'USER_HAS_USED_TOKENS' : null,
    });

    // ✅ Используем forceRefund для админа (обходит все проверки)
    try {
      // Попробуем сначала обычный возврат (если токены не использованы)
      if (tokensUsed === 0) {
        const result = await this.paymentsService.refundPayment(
          subscription.userId, 
          subscriptionId
        );
        
        return {
          success: true,
          message: `Возврат выполнен. ${result.message}`,
          refundId: result.refundId,
          amount: result.amount,
          tokensUsed: 0,
        };
      }
      
      // Если токены использованы - используем принудительный возврат
      const result = await this.paymentsService.forceRefund(
        subscriptionId,
        req.user.email
      );

      return {
        success: true,
        message: `Возврат выполнен администратором (токены использованы: ${tokensUsed})`,
        refundId: result.refundId,
        amount: result.amount,
        tokensUsed,
      };
    } catch (error) {
      console.error('❌ Admin refund failed:', error);
      throw error;
    }
  }

  /**
   * Получение списка всех пользователей (опционально)
   * GET /admin/users?page=1&limit=50
   */
  @Get('users')
  async getAllUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    const [users, total] = await this.userRepository.findAndCount({
      select: ['id', 'email', 'full_name', 'plan', 'tokens_used', 'tokens_limit', 'created_at'],
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return {
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        fullName: user.full_name, // ✅ snake_case
        plan: user.plan,
        tokensUsed: user.tokens_used,
        tokensLimit: user.tokens_limit,
        createdAt: user.created_at,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Получение статистики платформы (опционально)
   * GET /admin/stats
   */
  @Get('stats')
  async getStats() {
    const totalUsers = await this.userRepository.count();
    const activeSubscriptions = await this.subscriptionRepository.count({
      where: { status: 'active' },
    });
    
    const usersByPlan = await this.userRepository
      .createQueryBuilder('user')
      .select('user.plan', 'plan')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.plan')
      .getRawMany();

    return {
      totalUsers,
      activeSubscriptions,
      usersByPlan,
    };
  }
}