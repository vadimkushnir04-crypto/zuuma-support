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
   * POST /api/payments/webhook
   * 
   * ВАЖНО: Этот эндпоинт должен быть доступен без авторизации!
   */
  @Post('webhook')
  async handleWebhook(
    @Body() webhookData: any,
    @Headers() headers: any
  ) {
    console.log('\n🔔 ==========================================');
    console.log('📥 WEBHOOK RECEIVED FROM YOOKASSA');
    console.log('🔔 ==========================================');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('📦 Event:', webhookData.event);
    console.log('🆔 Payment ID:', webhookData.object?.id);
    console.log('💰 Amount:', webhookData.object?.amount?.value, webhookData.object?.amount?.currency);
    console.log('📊 Status:', webhookData.object?.status);
    console.log('🔑 Headers:', JSON.stringify(headers, null, 2));
    console.log('📋 Full webhook data:', JSON.stringify(webhookData, null, 2));
    console.log('🔔 ==========================================\n');

    try {
      await this.paymentsService.handleWebhook(webhookData);
      console.log('✅ Webhook processed successfully\n');
      return { success: true };
    } catch (error) {
      console.error('❌ Webhook processing failed:', error);
      console.error('❌ Error stack:', error.stack);
      // Всё равно возвращаем 200, чтобы ЮКасса не повторяла запрос
      return { success: false, error: error.message };
    }
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

  @Post('subscription/:id/toggle-auto-renew')
    async toggleAutoRenew(@Req() req: any, @Param('id') subscriptionId: string) {
    return this.paymentsService.toggleAutoRenew(req.user.id, subscriptionId);
}

}