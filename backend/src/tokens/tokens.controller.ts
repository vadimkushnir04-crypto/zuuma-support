import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';
import { Query } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Контроллер для работы с токенами
 * Требует авторизации для всех эндпоинтов
 */
@Controller('tokens')
@UseGuards(JwtAuthGuard)
export class TokensController {
  constructor(
    private tokensService: TokensService,
    private authService: AuthService,
    private dataSource: DataSource
  ) {}

  /**
   * Получить баланс токенов текущего пользователя
   * GET /api/tokens
   */
  @Get()
  async get(@Req() req: any) {
    const userId = req.user.id;
    const balance = await this.tokensService.getBalance(userId);
    return { balance };
  }

  /**
   * Пополнить токены (используется при оплате)
   * POST /api/tokens/topup
   */
  @Post('topup')
  async topUp(@Req() req: any, @Body() body: { amount: number, paymentMeta?: any }) {
    await this.tokensService.topUpTokens(
      req.user.id, 
      body.amount, 
      body.paymentMeta?.description || 'Ручное пополнение токенов'
    );
    
    const balance = await this.tokensService.getBalance(req.user.id);
    
    return { 
      success: true, 
      message: `Начислено ${body.amount} токенов`,
      balance 
    };
  }

  /**
   * Списать токены (используется при работе ассистента)
   * POST /api/tokens/consume
   */
  @Post('consume')
  async consume(@Req() req: any, @Body() body: { amount: number, assistantId?: string, meta?: any }) {
    const r = await this.tokensService.consumeTokens(req.user.id, body.amount, body.assistantId, body.meta);
    return r;
  }

  /**
   * Получить историю транзакций
   * GET /api/tokens/transactions
   */
  @Get('transactions')
  async transactions(@Req() req: any) {
    return this.tokensService.getTransactions(req.user.id);
  }

  /**
   * Сменить тарифный план (старый метод, оставлен для совместимости)
   * POST /api/tokens/change-plan
   */
  @Post('change-plan')
  async changePlan(@Req() req: any, @Body() body: { planSlug: string }) {
    const result = await this.tokensService.upgradePlan(req.user.id, body.planSlug);
    return result;
  }

  /**
   * Синхронизация лимитов пользователя с тарифом
   * GET /api/tokens/sync
   */
  @Get('sync')
  async syncUserLimits(@Req() req: any) {
    const userId = req.user.id;
    const result = await this.tokensService.syncUserWithPlan(userId);
    return { 
      success: true, 
      message: 'Лимиты синхронизированы',
      ...result 
    };
  }

  @Get('history')
  async getHistory(@Req() req: any, @Query('limit') limit: string = '50') {
    const userId = req.user.id;
    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const txRepo = this.dataSource.getRepository('TokenTransaction');
    
    const transactions = await txRepo
      .createQueryBuilder('tx')
      .where('tx.user_id = :userId', { userId })
      .orderBy('tx.created_at', 'DESC')
      .limit(limitNum)
      .getMany();

    return { transactions };
  }

  /**
   * Аналитика использования токенов за последние 30 дней
   * GET /api/tokens/analytics
   */
  @Get('analytics')
  async analytics(@Req() req: any, @Query('range') range?: string) {
    const timeRange = range || '30d';
    return this.tokensService.getDetailedAnalytics(req.user.id, timeRange);
  }
}