// backend/src/telegram/telegram.controller.ts
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
} from '@nestjs/common';

import { AuthService } from '../auth/auth.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { CreateTelegramBotDto } from './dto/telegram.dto';
import { ConnectManualBotDto } from '../integrations/dto/integration.dto';

@Controller('telegram')
export class TelegramController {
  constructor(
    private readonly authService: AuthService,
    private readonly integrationsService: IntegrationsService,
  ) {}

  private extractUserId(authHeader?: string): string {
    if (!authHeader) throw new BadRequestException('Authorization header missing');

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) throw new BadRequestException('JWT token missing');

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

@Post('bots/connect-manual')
@HttpCode(HttpStatus.CREATED)
async connectManualBot(
  @Body() dto: CreateTelegramBotDto,
  @Headers('authorization') authHeader?: string,
) {
  console.log('📥 Received DTO:', JSON.stringify(dto, null, 2));

  const userId = this.extractUserId(authHeader);

  if (!dto.botToken) {
    throw new BadRequestException('Bot token is required');
  }

  if (!dto.assistantId) {
    throw new BadRequestException('Assistant ID is required');
  }

  const result = await this.integrationsService.createIntegration(userId, dto);

  return {
    success: true,
    integration: result,
    message: 'Bot connected successfully'
  };
}

  @Post('bots')
  @HttpCode(HttpStatus.CREATED)
  async createBot(
    @Body() body: CreateTelegramBotDto & { userId?: string },
    @Headers('authorization') authHeader?: string,
  ) {
    const userId = body.userId || this.extractUserId(authHeader);
    const { userId: _, ...dto } = body;

    const svc = this.integrationsService as any;
    const result = await (svc.createIntegration?.(userId, dto) ?? svc.create?.(userId, dto));

    return { success: true, result };
  }

  @Get('bots/user')
  async getUserBotsNoParam(@Headers('authorization') authHeader?: string) {
    const userId = this.extractUserId(authHeader);

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

  @Delete('bots/:botId')
  @HttpCode(HttpStatus.OK)
  async deleteBot(
    @Param('botId') botId: string,
    @Body() body: { userId?: string },
    @Headers('authorization') authHeader?: string,
  ) {
    const userId = body.userId || this.extractUserId(authHeader);
    if (!userId) throw new BadRequestException('userId is required');

    const svc = this.integrationsService as any;
    await (svc.deleteIntegration?.(userId, botId) ?? svc.delete?.(userId, botId));

    return { success: true, message: 'Bot deleted' };
  }

  @Get('auth/status')
  async getAuthStatus(@Headers('authorization') authHeader?: string) {
    try {
      const userId = this.extractUserId(authHeader);
      return { success: true, authenticated: true, userId };
    } catch (error) {
      return { success: false, authenticated: false, error: (error as any).message || 'Unknown error' };
    }
  }
}
