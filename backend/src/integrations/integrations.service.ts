// backend/src/integrations/integrations.service.ts
import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Integration } from './entities/integration.entity';
import { Assistant } from '../assistants/entities/assistant.entity';
import { ConnectManualBotDto } from './dto/integration.dto';
import { TelegramBotService } from '../telegram/telegram-bot.service';
import { TelegramBot } from '../telegram/entities/telegram-bot.entity';
import { EncryptionService } from '../common/encryption.service';

@Injectable()
export class IntegrationsService {
  constructor(
    @InjectRepository(Integration)
    private integrationRepository: Repository<Integration>,
    @InjectRepository(Assistant)
    private assistantRepository: Repository<Assistant>,
    @InjectRepository(TelegramBot)
    private telegramBotRepository: Repository<TelegramBot>,
    @Inject(forwardRef(() => TelegramBotService))
    private readonly telegramBotService: TelegramBotService,
    private encryptionService: EncryptionService,
  ) {}

  async createIntegration(userId: string, dto: ConnectManualBotDto) {
    console.log('🔧 Creating integration for user:', userId);
    console.log('📋 DTO received:', JSON.stringify(dto, null, 2));

    if (!userId || !dto.assistantId || !dto.botToken) {
      throw new BadRequestException(
        'Missing required fields: userId, assistantId, or botToken'
      );
    }

    const integration = this.integrationRepository.create({
      userId,
      name: dto.botName,
      type: 'telegram',
      assistantId: dto.assistantId,
      status: 'creating',
      config: {
        commands: dto.commands || ['/start', '/help'],
      },
    });

    const savedIntegration = await this.integrationRepository.save(integration);

    await this.telegramBotService.createBot(userId, {
      assistantId: dto.assistantId,
      botToken: dto.botToken,
      botName: dto.botName,
      description: dto.description,
      commands: dto.commands || ['/start', '/help'],
      creationMethod: 'manual',
    });

    savedIntegration.status = 'active';
    await this.integrationRepository.save(savedIntegration);

    return savedIntegration;
  }

  async updateStatus(id: string, status: string) {
    await this.integrationRepository.update(id, { status });
    return this.integrationRepository.findOne({ where: { id } });
  }

  async findAll(userId: string) {
    const integrations = await this.integrationRepository.find({ where: { userId } });
    return Promise.all(
      integrations.map(async (integration) => {
        const assistant = await this.assistantRepository.findOne({ where: { id: integration.assistantId } });
        return this.formatIntegrationResponse(integration, assistant);
      }),
    );
  }

  async findByUserId(userId: string) {
    console.log('🔍 Finding integrations for user:', userId);
    const integrations = await this.integrationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
    console.log('📦 Found integrations:', integrations.length);
    return integrations;
  }

  async findOne(integrationId: string) {
    return this.integrationRepository.findOne({
      where: { id: integrationId },
      relations: ['assistant'],
    });
  }

  async toggleStatus(id: string, userId: string) {
    const integration = await this.integrationRepository.findOne({ where: { id, userId } });
    if (!integration) {
      return { success: false, error: 'Integration not found' };
    }

    const newStatus = integration.status === 'active' ? 'inactive' : 'active';
    await this.integrationRepository.update(id, { status: newStatus });

    return { success: true, status: newStatus };
  }

  async toggleIntegration(userId: string, integrationId: string) {
    console.log('🔄 [TOGGLE] Starting toggle for integration:', integrationId);
    console.log('👤 [TOGGLE] User:', userId);

    const integration = await this.integrationRepository.findOne({
      where: { id: integrationId, userId },
    });

    if (!integration) {
      console.error('❌ [TOGGLE] Integration not found');
      throw new BadRequestException('Integration not found');
    }

    console.log('📊 [TOGGLE] Current integration status:', integration.status);

    // Находим связанного бота
    const bot = await this.telegramBotRepository.findOne({
      where: { integrationId: integration.id },
    });

    if (!bot) {
      console.error('❌ [TOGGLE] Bot not found for integration');
      throw new BadRequestException('Bot not found for this integration');
    }

    console.log('🤖 [TOGGLE] Found bot:', bot.id, 'with status:', bot.status);

    const newStatus = integration.status === 'active' ? 'inactive' : 'active';
    const newBotStatus = newStatus === 'active' ? 'active' : 'inactive';
    
    console.log(`🔄 [TOGGLE] Changing status: ${integration.status} -> ${newStatus}`);

    try {
      if (newStatus === 'active') {
        console.log('▶️ [TOGGLE] Starting bot:', bot.id);
        await this.telegramBotService.startBot(bot.id);
        
        // Обновляем статус бота в БД
        bot.status = 'active';
        await this.telegramBotRepository.save(bot);
        console.log('✅ [TOGGLE] Bot status updated to active in DB');
      } else {
        console.log('⏸️ [TOGGLE] Stopping bot:', bot.id);
        await this.telegramBotService.stopBot(bot.id);
        
        // Обновляем статус бота в БД
        bot.status = 'inactive';
        await this.telegramBotRepository.save(bot);
        console.log('✅ [TOGGLE] Bot status updated to inactive in DB');
      }

      // Обновляем статус интеграции
      integration.status = newStatus;
      await this.integrationRepository.save(integration);
      console.log('✅ [TOGGLE] Integration status updated to', newStatus, 'in DB');

      // Проверяем что сохранилось
      const verifyBot = await this.telegramBotRepository.findOne({ where: { id: bot.id } });
      const verifyIntegration = await this.integrationRepository.findOne({ where: { id: integration.id } });
      
      console.log('🔍 [TOGGLE] Verification - Bot status in DB:', verifyBot?.status);
      console.log('🔍 [TOGGLE] Verification - Integration status in DB:', verifyIntegration?.status);

      console.log('✅ [TOGGLE] Toggle completed successfully');
      return integration;
    } catch (error) {
      console.error('❌ [TOGGLE] Error during toggle:', error);
      throw error;
    }
  }

  async delete(id: string, userId: string) {
    const result = await this.integrationRepository.delete({ id, userId });
    return { success: (result.affected || 0) > 0 };
  }

  // ✅ НОВЫЙ МЕТОД: Получение аналитики интеграции
  async getIntegrationAnalytics(userId: string, integrationId: string) {
    console.log('📊 [ANALYTICS] Getting analytics for integration:', integrationId);

    const integration = await this.integrationRepository.findOne({
      where: { id: integrationId, userId },
    });

    if (!integration) {
      throw new BadRequestException('Integration not found');
    }

    // Находим связанного бота для статистики
    const bot = await this.telegramBotRepository.findOne({
      where: { integrationId: integration.id },
    });

    return {
      integrationId: integration.id,
      name: integration.name,
      status: integration.status,
      totalMessages: bot?.totalMessages || 0,
      totalUsers: bot?.totalUsers || 0,
      lastMessageAt: bot?.lastMessageAt || null,
      createdAt: integration.createdAt,
    };
  }

  // ✅ НОВЫЙ МЕТОД: Обновление настроек интеграции
  async updateIntegrationSettings(
    userId: string,
    integrationId: string,
    settings: {
      name?: string;
      assistantId?: string;
      commands?: string[];
    }
  ) {
    console.log('⚙️ [SETTINGS] Updating integration:', integrationId);
    console.log('📋 [SETTINGS] New settings:', settings);

    const integration = await this.integrationRepository.findOne({
      where: { id: integrationId, userId },
    });

    if (!integration) {
      throw new BadRequestException('Integration not found');
    }

    // Обновляем поля если они переданы
    if (settings.name) {
      integration.name = settings.name;
    }

    if (settings.assistantId) {
      integration.assistantId = settings.assistantId;
      
      // Также обновляем assistantId у бота
      const bot = await this.telegramBotRepository.findOne({
        where: { integrationId: integration.id },
      });
      
      if (bot) {
        bot.assistantId = settings.assistantId;
        await this.telegramBotRepository.save(bot);
        console.log('🤖 [SETTINGS] Bot assistant updated');
      }
    }

    if (settings.commands && settings.commands.length > 0) {
      integration.config = {
        ...integration.config,
        commands: settings.commands,
      };

      // Обновляем команды у бота
      const bot = await this.telegramBotRepository.findOne({
        where: { integrationId: integration.id },
      });

      if (bot) {
        bot.commands = settings.commands;
        await this.telegramBotRepository.save(bot);
        console.log('🤖 [SETTINGS] Bot commands updated');
      }
    }

    const updatedIntegration = await this.integrationRepository.save(integration);
    console.log('✅ [SETTINGS] Integration updated successfully');

    return updatedIntegration;
  }

  async handleTelegramUpdate(integrationId: string, update: any) {
    const integration = await this.findOne(integrationId);
    if (!integration || !integration.telegramToken) {
      return { success: false, error: 'Integration not found or invalid' };
    }

    const message = update.message?.text;
    if (!message) return { success: false, error: 'No message text' };

    console.log(`📩 Update for bot ${integrationId}:`, message);
    return { success: true };
  }

  private formatIntegrationResponse(integration: Integration, assistant?: Assistant | null) {
    return {
      id: integration.id,
      name: integration.name,
      type: integration.type,
      assistant: assistant?.name || 'Unknown',
      status: integration.status,
      created: integration.createdAt.toISOString(),
      config: integration.config,
    };
  }
}