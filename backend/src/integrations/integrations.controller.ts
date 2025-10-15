import { Controller, Post, Get, Body, Param, Delete, Put, Req, UseGuards } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { ConnectManualBotDto } from './dto/integration.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  async getAllIntegrations(@Req() req) {
    const userId = req.user?.id;
    console.log('👤 User ID from token:', userId);
    
    if (!userId) {
      return { data: [], error: 'User not authenticated' };
    }
    
    const integrations = await this.integrationsService.findByUserId(userId);
    return { data: integrations };
  }

  // ⬇️ СПЕЦИФИЧНЫЕ МАРШРУТЫ ДОЛЖНЫ БЫТЬ ПЕРЕД :id
  @Get(':id/analytics')
  async getAnalytics(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.integrationsService.getIntegrationAnalytics(userId, id);
  }

  @Put(':id/toggle')
  async toggleIntegration(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    console.log('👤 Toggle - User ID:', userId);
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const integration = await this.integrationsService.toggleIntegration(userId, id);
    
    return {
      success: true,
      integration,
      message: integration.status === 'active' ? 'Integration started' : 'Integration stopped',
    };
  }

  @Put(':id/settings')
  async updateSettings(
    @Param('id') id: string,
    @Body() settings: { name?: string; assistantId?: string; commands?: string[] },
    @Req() req: any
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.integrationsService.updateIntegrationSettings(userId, id, settings);
  }

  @Post('telegram')
  async connectTelegramBot(@Req() req: any, @Body() dto: ConnectManualBotDto) {
    const userId = req.user.id;
    return this.integrationsService.createIntegration(userId, dto);
  }

  @Post('webhook/telegram/:integrationId')
  async handleTelegramWebhook(
    @Param('integrationId') integrationId: string,
    @Body() update: any
  ) {
    return this.integrationsService.handleTelegramUpdate(integrationId, update);
  }

  @Delete(':id')
  async deleteIntegration(@Param('id') id: string, @Req() req: any) {
    return this.integrationsService.delete(id, req.user.id);
  }
}