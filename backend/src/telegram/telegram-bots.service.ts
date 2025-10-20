// backend/src/telegram/telegram-bots.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelegramBot } from './entities/telegram-bot.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class TelegramBotsService {
  constructor(
    @InjectRepository(TelegramBot)
    private telegramBotRepository: Repository<TelegramBot>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * ✅ Создание бота с проверкой лимита
   */
  async createBot(userId: string, data: Partial<TelegramBot>): Promise<TelegramBot> {
    // ✅ ШАГ 1: Проверяем лимит ботов
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    // Приводим plan к правильному типу с дефолтным значением
    const userPlan = (user.plan || 'free') as 'free' | 'pro' | 'max';

    // Определяем лимит ботов на основе плана
    const botsLimitMap: Record<'free' | 'pro' | 'max', number> = {
      free: 1,
      pro: 10,
      max: 50,
    };
    
    const botsLimit = botsLimitMap[userPlan];
    
    // Считаем текущие боты
    const currentBots = await this.telegramBotRepository.count({ 
      where: { userId } 
    });
    
    console.log('🔍 Checking bots limit:', {
      userId,
      currentBots,
      limit: botsLimit,
      plan: userPlan,
    });
    
    // ❌ БЛОКИРУЕМ если превышен лимит
    if (currentBots >= botsLimit) {
      const planNames: Record<'free' | 'pro' | 'max', string> = {
        free: 'Free (1 бот)',
        pro: 'Pro (до 10 ботов)',
        max: 'Max (до 50 ботов)',
      };
      
      const planName = planNames[userPlan];
      
      throw new BadRequestException(
        `Достигнут лимит Telegram ботов для тарифа ${planName}. ` +
        `У вас уже ${currentBots} из ${botsLimit}. ` +
        `Обновите тариф для создания большего количества ботов.`
      );
    }

    // ✅ ШАГ 2: Создаём бота
    const bot = this.telegramBotRepository.create({
      ...data,
      userId,
    });

    const savedBot = await this.telegramBotRepository.save(bot);
    console.log(`✅ Создан Telegram бот для пользователя ${userId}`);
    console.log(`📊 Ботов у пользователя: ${currentBots + 1} / ${botsLimit}`);
    
    return savedBot;
  }

  /**
   * Получение всех ботов пользователя
   */
  async getBotsByUserId(userId: string): Promise<TelegramBot[]> {
    return this.telegramBotRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Получение одного бота
   */
  async getBotById(botId: string, userId: string): Promise<TelegramBot | null> {
    return this.telegramBotRepository.findOne({
      where: { id: botId, userId },
    });
  }

  /**
   * Удаление бота
   */
  async deleteBot(botId: string, userId: string): Promise<void> {
    const bot = await this.telegramBotRepository.findOne({
      where: { id: botId, userId },
    });

    if (!bot) {
      throw new BadRequestException('Бот не найден');
    }

    await this.telegramBotRepository.remove(bot);
    console.log(`🗑️ Удалён Telegram бот ${botId}`);
  }
}