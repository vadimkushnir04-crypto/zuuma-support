import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Headers,
  BadRequestException,
  Req,
} from '@nestjs/common';
import type { Request } from 'express'; // ✅ типовой импорт

import { AuthService } from '../auth/auth.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { CreateTelegramBotDto } from './dto/telegram.dto';

@Controller('telegram')
export class TelegramController {
  constructor(
    private readonly authService: AuthService,
    private readonly integrationsService: IntegrationsService,
  ) {}

  /**
   * Извлекает userId из JWT токена (в заголовке или куках)
   */
  private extractUserId(authHeader?: string, req?: Request): string {
    let token: string | undefined;

    // 1️⃣ Проверяем заголовок Authorization
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '').trim();
    }

    // 2️⃣ Если нет — берем из cookies
    if (!token && req?.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new BadRequestException('JWT token missing (no header or cookie)');
    }

    try {
      const payload = this.authService.verifyToken(token);
      const id = (payload as any)?.id || (payload as any)?.userId;
      if (!id) throw new BadRequestException('Invalid token payload');
      return id;
    } catch (error) {
      console.error('Token verification failed:', (error as any).message || error);
      throw new BadRequestException('Invalid JWT token');
    }
  }

  // =====================================================
  // 🤖 Подключение Telegram-бота вручную
  // =====================================================

  @Post('bots/connect-manual')
  @HttpCode(HttpStatus.CREATED)
  async connectManualBot(
    @Body() dto: CreateTelegramBotDto,
    @Headers('authorization') authHeader: string | undefined,
    @Req() req: Request,
  ) {
    console.log('📥 Received DTO:', JSON.stringify(dto, null, 2));

    const userId = this.extractUserId(authHeader, req);

    if (!dto.botToken) throw new BadRequestException('Bot token is required');
    if (!dto.assistantId) throw new BadRequestException('Assistant ID is required');

    const result = await this.integrationsService.createIntegration(userId, dto);

    return {
      success: true,
      integration: result,
      message: 'Bot connected successfully',
    };
  }

  // =====================================================
  // 🧩 Создание бота (универсальный эндпоинт)
  // =====================================================

  @Post('bots')
  @HttpCode(HttpStatus.CREATED)
  async createBot(
    @Body() body: CreateTelegramBotDto & { userId?: string },
    @Headers('authorization') authHeader?: string,
    @Req() req?: Request,
  ) {
    const userId = body.userId || this.extractUserId(authHeader, req);
    const { userId: _, ...dto } = body;

    const svc = this.integrationsService as any;
    const result = await (svc.createIntegration?.(userId, dto) ?? svc.create?.(userId, dto));

    return { success: true, result };
  }

  // =====================================================
  // 📋 Получение ботов пользователя
  // =====================================================

  @Get('bots/user')
  async getUserBotsNoParam(
    @Headers('authorization') authHeader?: string,
    @Req() req?: Request,
  ) {
    const userId = this.extractUserId(authHeader, req);

    const svc = this.integrationsService as any;
    const bots =
      (await svc.getUserIntegrations?.(userId)) ??
      (await svc.getIntegrationsByUser?.(userId)) ??
      (await svc.getIntegrations?.(userId));

    return { success: true, bots };
  }

  @Get('bots/user/:userId')
  async getUserBots(@Param('userId') userId: string) {
    if (!userId) throw new BadRequestException('userId is required');

    const svc = this.integrationsService as any;
    const bots =
      (await svc.getUserIntegrations?.(userId)) ??
      (await svc.getIntegrationsByUser?.(userId)) ??
      (await svc.getIntegrations?.(userId));

    return { success: true, bots };
  }

  // =====================================================
  // ▶️ / ⏸ Управление ботами
  // =====================================================

  @Post('bots/:botId/start')
  @HttpCode(HttpStatus.OK)
  async startBot(@Param('botId') botId: string) {
    const svc = this.integrationsService as any;
    await (svc.startIntegration?.(botId) ?? svc.start?.(botId));
    return { success: true, message: 'Bot started' };
  }

  @Post('bots/:botId/stop')
  @HttpCode(HttpStatus.OK)
  async stopBot(@Param('botId') botId: string) {
    const svc = this.integrationsService as any;
    await (svc.stopIntegration?.(botId) ?? svc.stop?.(botId));
    return { success: true, message: 'Bot stopped' };
  }

  // =====================================================
  // 🗑 Удаление бота
  // =====================================================

  @Delete('bots/:botId')
  @HttpCode(HttpStatus.OK)
  async deleteBot(
    @Param('botId') botId: string,
    @Body() body: { userId?: string },
    @Headers('authorization') authHeader?: string,
    @Req() req?: Request,
  ) {
    const userId = body.userId || this.extractUserId(authHeader, req);
    if (!userId) throw new BadRequestException('userId is required');

    const svc = this.integrationsService as any;
    await (svc.deleteIntegration?.(userId, botId) ?? svc.delete?.(userId, botId));

    return { success: true, message: 'Bot deleted' };
  }

  // =====================================================
  // 🔐 Проверка авторизации
  // =====================================================

  @Get('auth/status')
  async getAuthStatus(
    @Headers('authorization') authHeader?: string,
    @Req() req?: Request,
  ) {
    try {
      const userId = this.extractUserId(authHeader, req);
      return { success: true, authenticated: true, userId };
    } catch (error) {
      return {
        success: false,
        authenticated: false,
        error: (error as any).message || 'Unknown error',
      };
    }
  }
}
