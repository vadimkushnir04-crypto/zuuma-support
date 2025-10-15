// backend/src/telegram/telegram-bot.service.ts
import { Injectable, BadRequestException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Integration } from '../integrations/entities/integration.entity';
import { EncryptionService } from '../common/encryption.service';
import { CreateTelegramBotDto, UpdateTelegramBotDto } from './dto/telegram.dto';

import { validate as isUUID } from 'uuid';
import { IntegrationsService } from '../integrations/integrations.service';
import { ConnectManualBotDto } from '../integrations/dto/integration.dto';

import TelegramBotAPI from 'node-telegram-bot-api';
import { TelegramBot } from './entities/telegram-bot.entity';
import { TelegramWebhookService } from './telegram-webhook.service';

import { SupportService } from '../support/support.service';

@Injectable()
export class TelegramBotService {
  private activeBots: Map<string, TelegramBotAPI> = new Map();

  constructor(
    @InjectRepository(TelegramBot)
    private telegramBotRepository: Repository<TelegramBot>,
    @InjectRepository(Integration)
    private integrationRepository: Repository<Integration>,
    private encryptionService: EncryptionService,
    @Inject(forwardRef(() => IntegrationsService))
    private readonly integrationsService: IntegrationsService,
    @Inject(forwardRef(() => TelegramWebhookService)) // добавьте это
    private readonly webhookService: TelegramWebhookService,
    private readonly supportService: SupportService,
  ) {}

  async createBot(userId: string, dto: CreateTelegramBotDto) {
  // ✅ dto уже содержит botToken, не нужно преобразовывать
  
  if (!isUUID(userId)) {
    throw new BadRequestException('Invalid userId');
  }

  try {
    // 1. Проверяем токен
    const botInfo = await this.verifyBotToken(dto.botToken);

    // 2. Проверяем уникальность
    const existing = await this.telegramBotRepository.findOne({
      where: { botUsername: botInfo.username },
    });
    if (existing) {
      throw new BadRequestException('This bot is already connected');
    }

    // 3. ❌ УДАЛИТЕ этот вызов - интеграция УЖЕ создана в integrationsService
    // const savedIntegration = await this.integrationsService.createIntegration(...)

    // 4. Найдите существующую интеграцию
    const integrations = await this.integrationRepository.find({
      where: { 
        userId,
        type: 'telegram',
        status: 'creating'
      },
      order: { createdAt: 'DESC' },
      take: 1
    });

    const savedIntegration = integrations[0];
    if (!savedIntegration) {
      throw new BadRequestException('Integration not found');
    }

    // 5. Шифруем токен
    const encryptedToken = this.encryptionService.encrypt(dto.botToken);
    const webhookSecret = this.encryptionService.hashWebhookSecret(dto.botToken);

    // 6. Создаём запись бота
    const bot = this.telegramBotRepository.create({
      integrationId: savedIntegration.id,
      userId,
      assistantId: dto.assistantId,
      botToken: encryptedToken,
      botUsername: botInfo.username,
      botName: dto.botName,
      botId: botInfo.id.toString(),
      webhookSecret,
      description: dto.description,
      commands: dto.commands || ['/start', '/help'],
      status: 'creating',
    });

    const savedBot = await this.telegramBotRepository.save(bot);

    // 7. Настраиваем webhook
    await this.setupWebhook(savedBot);

    // 8. Обновляем статус
    savedBot.status = 'active';
    await this.telegramBotRepository.save(savedBot);

    return {
      success: true,
      bot: this.sanitizeBotData(savedBot),
      integration: savedIntegration,
    };
  } catch (error) {
    console.error('Error creating bot:', error);
    throw new BadRequestException(error.message || 'Failed to create bot');
  }
}


  private async verifyBotToken(token: string) {
    try {
      const bot = new TelegramBotAPI(token, { polling: false });
      const me = await bot.getMe();
      
      return {
        id: me.id,
        username: me.username,
        firstName: me.first_name,
      };
    } catch (error) {
      throw new BadRequestException('Invalid bot token');
    }
  }

    private async setupWebhook(bot: TelegramBot) {
      const decryptedToken = this.encryptionService.decrypt(bot.botToken);

      if (process.env.NODE_ENV !== 'production') {
        console.log(`⚙️ Dev mode: запускаем бота ${bot.botUsername} через polling`);
        
        // ✅ Проверяем, не запущен ли уже этот бот
        const existingBot = this.activeBots.get(bot.id);
        if (existingBot) {
          console.log('⚠️ Bot already running, stopping old instance');
          try {
            await existingBot.stopPolling();
          } catch (error) {
            console.log('Old polling already stopped');
          }
          this.activeBots.delete(bot.id);
        }
        
        const botAPI = new TelegramBotAPI(decryptedToken, { polling: true });
        
        // Обработчик сообщений
        botAPI.on('message', async (msg) => {
          console.log('📩 Message received from', msg.from?.username, ':', msg.text);
            await this.webhookService.handleUpdate(
              decryptedToken, // токен бота
              { update_id: Date.now(), message: msg as any } // объект обновления
            );
        });

        // Обработчик ошибок
        // ✅ НОВЫЙ КОД:
        botAPI.on('polling_error', async (error) => {
          const errorMsg = error.message || '';
          
          // 🔴 Критические ошибки - останавливаем бота
          if (errorMsg.includes('401 Unauthorized') || 
              errorMsg.includes('404 Not Found') ||
              errorMsg.includes('Invalid token')) {
            
            console.error(`🛑 [BOT] Critical error for ${bot.botUsername}: ${errorMsg}`);
            console.error('🛑 [BOT] Stopping bot due to invalid token...');
            
            // Останавливаем polling
            try {
              await botAPI.stopPolling();
              this.activeBots.delete(bot.id);
            } catch (stopError) {
              // Игнорируем ошибки остановки
            }
            
            // Обновляем статус в БД
            bot.status = 'error';
            await this.telegramBotRepository.save(bot);
            
            console.error(`❌ [BOT] Bot ${bot.botUsername} stopped due to: ${errorMsg}`);
            
          } else {
            // ⚠️ Временные ошибки - просто логируем
            console.warn(`⚠️ [BOT] Temporary polling error for ${bot.botUsername}: ${errorMsg}`);
          }
        });

        this.activeBots.set(bot.id, botAPI);
        bot.status = 'active';
        await this.telegramBotRepository.save(bot);
        
        console.log('✅ Bot listening via polling:', bot.botUsername);
        return;
      }

    // Production webhook
    if (!process.env.BACKEND_URL || !process.env.BACKEND_URL.startsWith('https://')) {
      throw new BadRequestException(
        'BACKEND_URL должен быть задан и начинаться с https:// для webhook',
      );
    }

    const webhookUrl = `${process.env.BACKEND_URL}/telegram/webhook/${bot.id}`;
    const botAPI = new TelegramBotAPI(decryptedToken, { polling: false });

    await botAPI.setWebHook(webhookUrl, {
      secret_token: bot.webhookSecret,
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: true,
    } as any);

    bot.webhookUrl = webhookUrl;
    await this.telegramBotRepository.save(bot);

    this.activeBots.set(bot.id, botAPI);

    console.log(`✅ Webhook установлен: ${webhookUrl}`);
  }

// Метод для запуска УЖЕ СОЗДАННОГО бота (без создания записи в БД)
async setupAndStartBot(bot: TelegramBot) {
  console.log('🚀 Starting bot:', bot.botUsername);
  
  // Только запускаем, не создаём запись
  await this.setupWebhook(bot);
  
  // НЕ вызываем startBot, т.к. setupWebhook уже запускает polling
  console.log('✅ Bot setup complete');
}


  async startBot(botId: string) {
  console.log('▶️ [START] Starting bot:', botId);
  
  const bot = await this.telegramBotRepository.findOne({ where: { id: botId } });
  if (!bot) {
    console.warn('⚠️ [START] Bot not found:', botId);
    throw new NotFoundException('Bot not found');
  }

  console.log('📌 [START] Bot status:', bot.status);
  console.log('📌 [START] Bot username:', bot.botUsername);

  // Если бот уже активен, сначала останавливаем
  const existingBot = this.activeBots.get(botId);
  if (existingBot) {
    console.log('⚠️ [START] Bot already running, restarting...');
    try {
      await existingBot.stopPolling();
    } catch (error) {
      console.log('ℹ️ [START] Old polling already stopped');
    }
    this.activeBots.delete(botId);
  }

  try {
    const decryptedToken = this.encryptionService.decrypt(bot.botToken);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔧 [START] DEV mode: starting polling');
      
      const botAPI = new TelegramBotAPI(decryptedToken, { polling: true });
      
      botAPI.on('message', async (msg) => {
        console.log('📨 [BOT] Message from', msg.from?.username, ':', msg.text);
        await this.webhookService.handleUpdate(
          decryptedToken, // токен бота
          { update_id: Date.now(), message: msg as any } // объект обновления
        );
      });

      botAPI.on('polling_error', async (error) => {
        const errorMsg = error.message || '';
        
        if (errorMsg.includes('401 Unauthorized') || 
            errorMsg.includes('404 Not Found') ||
            errorMsg.includes('Invalid token')) {
          
          console.error(`🛑 [START] Critical error: ${errorMsg}`);
          
          try {
            await botAPI.stopPolling();
            this.activeBots.delete(botId);
          } catch {}
          
          bot.status = 'error';
          await this.telegramBotRepository.save(bot);
          
        } else {
          console.warn(`⚠️ [START] Temporary polling error: ${errorMsg}`);
        }
      });

      this.activeBots.set(botId, botAPI);
      console.log('✅ [START] Bot polling started');
    } else {
      console.log('🌐 [START] PROD mode: setting webhook');
      const webhookUrl = `${process.env.BACKEND_URL}/telegram/webhook/${botId}`;
      const botAPI = new TelegramBotAPI(decryptedToken, { polling: false });

      await botAPI.setWebHook(webhookUrl, {
        secret_token: bot.webhookSecret,
        allowed_updates: ['message', 'callback_query'],
      } as any);

      this.activeBots.set(botId, botAPI);
      console.log('✅ [START] Webhook set:', webhookUrl);
    }
    
    bot.status = 'active';
    await this.telegramBotRepository.save(bot);
    console.log('✅ [START] Bot status updated to active');
    
  } catch (error) {
    
    bot.status = 'error';
    await this.telegramBotRepository.save(bot);
    throw error;
  }
}

  async stopBot(botId: string) {
    console.log('⏸️ [STOP] Stopping bot:', botId);
    
    const bot = await this.telegramBotRepository.findOne({ where: { id: botId } });
    if (!bot) {
      console.warn('⚠️ [STOP] Bot not found:', botId);
      throw new NotFoundException('Bot not found');
    }

    const botAPI = this.activeBots.get(botId);
    
    if (botAPI) {
      console.log('🛑 [STOP] Stopping active bot instance');
      
      try {
        if (process.env.NODE_ENV !== 'production') {
          await botAPI.stopPolling();
          console.log('✅ [STOP] Polling stopped');
        } else {
          await botAPI.deleteWebHook();
          console.log('✅ [STOP] Webhook deleted');
        }
      } catch (error) {
        console.error('⚠️ [STOP] Error during stop:', error.message);
      }
      
      this.activeBots.delete(botId);
      console.log('✅ [STOP] Bot removed from active bots');
    } else {
      console.log('ℹ️ [STOP] Bot was not in active bots map');
    }

    bot.status = 'inactive';
    await this.telegramBotRepository.save(bot);
    console.log('✅ [STOP] Bot status updated to inactive');
  }

  async deleteBot(userId: string, botId: string) {
    const bot = await this.telegramBotRepository.findOne({
      where: { id: botId, userId },
    });

    if (!bot) {
      throw new NotFoundException('Bot not found');
    }

    await this.stopBot(botId);
    await this.telegramBotRepository.remove(bot);
  }

  async getUserBots(userId: string) {
    return this.telegramBotRepository.find({
      where: { userId },
      relations: ['assistant', 'integration'],
      order: { createdAt: 'DESC' },
    });
  }

  getBotAPI(botId: string): TelegramBotAPI | undefined {
    return this.activeBots.get(botId);
  }

  private sanitizeBotData(bot: TelegramBot) {
    const { botToken, webhookSecret, ...sanitized } = bot;
    return {
      ...sanitized,
      botToken: '***', // Скрываем токен
    };
  }

  async incrementStats(botId: string, userId?: number) {
    const bot = await this.telegramBotRepository.findOne({
      where: { id: botId },
    });

    if (bot) {
      bot.totalMessages += 1;
      bot.lastMessageAt = new Date();
      
      // Упрощенный подсчет уникальных пользователей
      // В реальности нужна отдельная таблица для пользователей
      
      await this.telegramBotRepository.save(bot);
    }
  }

  async onModuleDestroy() {
    console.log('🛑 Stopping all bots...');
    for (const [botId, botAPI] of this.activeBots.entries()) {
      try {
        await botAPI.stopPolling();
        console.log('✅ Stopped bot:', botId);
      } catch (error) {
        console.log('Bot already stopped:', botId);
      }
    }
    this.activeBots.clear();
  }


  // При инициализации модуля - восстановить активные боты
  async onModuleInit() {
    console.log('🚀 [INIT] Initializing Telegram Bot Service');
    
    const activeBots = await this.telegramBotRepository.find({
      where: { status: 'active' },
    });

    console.log(`📋 [INIT] Found ${activeBots.length} active bots to restore`);

    for (const bot of activeBots) {
      try {
        console.log(`🔄 [INIT] Restoring bot: ${bot.botUsername}`);
        await this.startBot(bot.id);
      } catch (error) {
        console.error(`❌ [INIT] Failed to restore bot ${bot.botUsername}:`, error.message);
      }
    }

    console.log('✅ [INIT] Bot service initialized');
  }

}