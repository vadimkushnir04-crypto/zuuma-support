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
import { Res } from '@nestjs/common';

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
   * Webhook от ЮKassa
   * POST /api/payments/webhook
   *
   * ⚠️ Этот эндпоинт должен быть доступен без авторизации!
   */
  @Post('webhook')
  async handleWebhook(
    @Body() webhookData: any,
    @Headers() headers: any,
    @Res() res: any
  ) {
    console.log('\n🔔 ==== WEBHOOK START ====================================');
    console.log('📦 Event:', webhookData.event);
    console.log('🆔 Payment ID:', webhookData.object?.id);
    console.log('📊 Status:', webhookData.object?.status);
    console.log('⏰ Received at:', new Date().toISOString());

    try {
      const result = await this.paymentsService.handleWebhook(webhookData);

      // 🔁 Короткий лог, если webhook уже обрабатывался
      if (result === 'duplicate') {
        console.log(`🔁 Повторный webhook для платежа ${webhookData.object?.id} (игнорируем)`);
      } else {
        console.log('✅ Webhook обработан успешно');
      }

      // ✅ Обязательно возвращаем "OK" — иначе ЮKassa будет слать повторно
      return res.status(200).send('OK');
    } catch (error) {
      console.error('❌ Ошибка обработки webhook:', error.message);
      // ⚠️ Всё равно отвечаем 200, чтобы ЮKassa не повторяла запрос
      return res.status(200).send('OK');
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
@UseGuards(JwtAuthGuard)
async toggleAutoRenew(@Req() req: any, @Param('id') subscriptionId: string) {
  return this.paymentsService.toggleAutoRenew(req.user.id, subscriptionId);
}

}