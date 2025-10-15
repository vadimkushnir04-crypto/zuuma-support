import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';

@Controller('api/tokens')
@UseGuards(JwtAuthGuard)
export class TokensController {
  constructor(
    private tokensService: TokensService,
    private authService: AuthService
  ) {}

  @Get()
  async get(@Req() req: any) {
    const userId = req.user.id;
    const balance = await this.tokensService.getBalance(userId);
    return { balance };
  }

  @Post('topup')
  async topUp(@Req() req: any, @Body() body: { amount: number, paymentMeta?: any }) {
    // ✅ Исправлено: используем topUpTokens вместо topUp
    await this.tokensService.topUpTokens(
      req.user.id, 
      body.amount, 
      body.paymentMeta?.description || 'Ручное пополнение токенов'
    );
    
    // Возвращаем обновленный баланс
    const balance = await this.tokensService.getBalance(req.user.id);
    
    return { 
      success: true, 
      message: `Начислено ${body.amount} токенов`,
      balance 
    };
  }

  @Post('consume')
  async consume(@Req() req: any, @Body() body: { amount: number, assistantId?: string, meta?: any }) {
    const r = await this.tokensService.consumeTokens(req.user.id, body.amount, body.assistantId, body.meta);
    return r;
  }

  @Get('transactions')
  async transactions(@Req() req: any) {
    return this.tokensService.getTransactions(req.user.id);
  }

  @Post('change-plan')
  async changePlan(@Req() req: any, @Body() body: { planSlug: string }) {
    const result = await this.tokensService.upgradePlan(req.user.id, body.planSlug);
    return result;
  }

  @Get('plans')
  async getPlans() {
    return this.tokensService.getAllPlans();
  }

  @Get('analytics')
  async analytics(@Req() req: any) {
    const from = new Date(Date.now() - 30*24*3600*1000);
    const to = new Date();
    return this.tokensService.getDetailedAnalytics(req.user.id, from, to);
  }
}