// backend/src/payments/payments.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  UnauthorizedException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Создать платеж
   * POST /payments/create
   */
  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createPayment(
    @Req() req: any,
    @Body() body: { planSlug: string }
  ) {
    const userId = req.user.id;

    const result = await this.paymentsService.createPayment(
      userId,
      body.planSlug
    );

    return {
      success: true,
      ...result,
    };
  }

  /**
   * Webhook от ЮКасса
   * POST /payments/webhook
   */
  @Post('webhook')
  async handleWebhook(@Body() webhookData: any) {
    console.log('📥 Webhook received from YooKassa');
    
    await this.paymentsService.handleWebhook(webhookData);
    
    return { success: true };
  }

  /**
   * Получить активную подписку
   * GET /payments/subscription
   */
  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  async getSubscription(@Req() req: any) {
    const userId = req.user.id;
    
    const subscription = await this.paymentsService.getActiveSubscription(userId);
    
    return {
      success: true,
      subscription,
    };
  }

  /**
   * Отменить подписку
   * POST /payments/subscription/:id/cancel
   */
  @Post('subscription/:id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelSubscription(
    @Req() req: any,
    @Param('id') subscriptionId: string
  ) {
    const userId = req.user.id;
    
    const result = await this.paymentsService.cancelSubscription(
      userId,
      subscriptionId
    );
    
    return result;
  }

  /**
   * Запросить возврат
   * POST /payments/subscription/:id/refund
   */
  @Post('subscription/:id/refund')
  @UseGuards(JwtAuthGuard)
  async refundSubscription(
    @Req() req: any,
    @Param('id') subscriptionId: string
  ) {
    const userId = req.user.id;
    
    const result = await this.paymentsService.refundPayment(
      userId,
      subscriptionId
    );
    
    return result;
  }

  /**
   * История платежей
   * GET /payments/history
   */
  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getPaymentHistory(@Req() req: any) {
    const userId = req.user.id;
    
    const payments = await this.paymentsService.getPaymentHistory(userId);
    
    return {
      success: true,
      payments,
    };
  }
}