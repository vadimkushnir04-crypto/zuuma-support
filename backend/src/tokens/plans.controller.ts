import { Controller, Get } from '@nestjs/common';
import { TokensService } from './tokens.service';

/**
 * Публичный контроллер для получения тарифных планов
 * БЕЗ авторизации - доступен всем
 */
@Controller('tokens/plans')
export class PlansController {
  constructor(private readonly tokensService: TokensService) {}

  /**
   * Получить все доступные тарифные планы
   * GET /api/tokens/plans
   * 
   * Публичный эндпоинт - авторизация НЕ требуется
   */
  @Get()
  async getAllPlans() {
    console.log('📋 [PUBLIC] GET /api/tokens/plans');
    try {
      const plans = await this.tokensService.getAllPlans();
      console.log(`✅ Plans found: ${plans?.length || 0}`);
      return plans;
    } catch (error) {
      console.error('❌ Error fetching plans:', error);
      throw error;
    }
  }
}