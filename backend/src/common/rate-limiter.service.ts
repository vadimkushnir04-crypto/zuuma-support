// backend/src/common/rate-limiter.service.ts
import { Injectable } from '@nestjs/common';

// ✅ ЭКСПОРТИРУЕМ интерфейсы чтобы TypeScript был доволен
export interface RateLimitConfig {
  messagesPerMinute: number;
  messagesPerHour: number;
  messagesPerDay: number;
  minMessageInterval: number;
  spamDetection: {
    enabled: boolean;
    maxIdenticalMessages: number;
  };
}

export interface UserRateLimitData {
  messagesThisMinute: number;
  messagesThisHour: number;
  messagesThisDay: number;
  lastMessageTime: number;
  lastMessages: string[];
  minuteResetTime: number;
  hourResetTime: number;
  dayResetTime: number;
}

@Injectable()
export class RateLimiterService {
  // In-memory хранилище (для production лучше Redis)
  private userLimits: Map<string, UserRateLimitData> = new Map();
  
  // Дефолтная конфигурация
  private defaultConfig: RateLimitConfig = {
    messagesPerMinute: 10,
    messagesPerHour: 50,
    messagesPerDay: 200,
    minMessageInterval: 1000, // 1 секунда между сообщениями
    spamDetection: {
      enabled: true,
      maxIdenticalMessages: 5, // 3 одинаковых сообщения подряд = спам
    }
  };

  // Можно переопределить конфиг для конкретного ассистента/компании
  private assistantConfigs: Map<string, RateLimitConfig> = new Map();

  /**
   * Проверка: может ли пользователь отправить сообщение
   */
  async checkRateLimit(
    userId: string, 
    assistantId: string,
    message: string
  ): Promise<{ allowed: boolean; reason?: string; retryAfter?: number }> {
    const config = this.getConfig(assistantId);
    const now = Date.now();
    
    // Получаем или создаём данные пользователя
    let userData = this.getUserData(userId, assistantId);
    
    // 1. Проверка минимального интервала между сообщениями
    const timeSinceLastMessage = now - userData.lastMessageTime;
    if (timeSinceLastMessage < config.minMessageInterval) {
      return {
        allowed: false,
        reason: 'Слишком быстро! Подождите немного перед следующим сообщением 😊',
        retryAfter: Math.ceil((config.minMessageInterval - timeSinceLastMessage) / 1000)
      };
    }

    // 2. Сброс счётчиков если прошло время
    this.resetCountersIfNeeded(userData, now);

    // 3. Проверка лимитов
    if (userData.messagesThisMinute >= config.messagesPerMinute) {
      const resetIn = Math.ceil((userData.minuteResetTime - now) / 1000);
      return {
        allowed: false,
        reason: `Достигнут лимит сообщений в минуту (${config.messagesPerMinute}). Попробуйте через ${resetIn} сек.`,
        retryAfter: resetIn
      };
    }

    if (userData.messagesThisHour >= config.messagesPerHour) {
      const resetIn = Math.ceil((userData.hourResetTime - now) / 60000);
      return {
        allowed: false,
        reason: `Достигнут часовой лимит (${config.messagesPerHour} сообщений). Попробуйте через ${resetIn} мин.`,
        retryAfter: resetIn * 60
      };
    }

    if (userData.messagesThisDay >= config.messagesPerDay) {
      const resetIn = Math.ceil((userData.dayResetTime - now) / 3600000);
      return {
        allowed: false,
        reason: `Достигнут дневной лимит (${config.messagesPerDay} сообщений). Попробуйте завтра.`,
        retryAfter: resetIn * 3600
      };
    }

    // 4. Детекция спама (одинаковые сообщения)
    if (config.spamDetection.enabled) {
      const spamCheck = this.checkSpam(userData, message, config);
      if (!spamCheck.allowed) {
        return spamCheck;
      }
    }

    // ✅ Всё ок, разрешаем
    return { allowed: true };
  }

  /**
   * Записываем факт отправки сообщения
   */
  async recordMessage(userId: string, assistantId: string, message: string): Promise<void> {
    const key = this.getKey(userId, assistantId);
    const userData = this.userLimits.get(key);
    const now = Date.now();

    if (userData) {
      userData.messagesThisMinute++;
      userData.messagesThisHour++;
      userData.messagesThisDay++;
      userData.lastMessageTime = now;
      
      // Сохраняем последние N сообщений для детекции спама
      userData.lastMessages.push(message.toLowerCase().trim());
      if (userData.lastMessages.length > 5) {
        userData.lastMessages.shift(); // Храним только последние 5
      }
    }

    console.log(`📊 Rate limit stats for ${userId}: ${userData?.messagesThisMinute}/min, ${userData?.messagesThisHour}/hour, ${userData?.messagesThisDay}/day`);
  }

  /**
   * Устанавливаем кастомный конфиг для ассистента
   */
  setAssistantConfig(assistantId: string, config: Partial<RateLimitConfig>): void {
    const fullConfig = { ...this.defaultConfig, ...config };
    this.assistantConfigs.set(assistantId, fullConfig);
    console.log(`⚙️ Rate limit config set for assistant ${assistantId}:`, fullConfig);
  }

  /**
   * Получаем статистику пользователя
   */
  getUserStats(userId: string, assistantId: string): UserRateLimitData | null {
    const key = this.getKey(userId, assistantId);
    return this.userLimits.get(key) || null;
  }

  /**
   * Сбрасываем лимиты пользователя (для админов)
   */
  resetUserLimits(userId: string, assistantId: string): void {
    const key = this.getKey(userId, assistantId);
    this.userLimits.delete(key);
    console.log(`🔄 Reset rate limits for user ${userId}`);
  }

  // ============ ПРИВАТНЫЕ МЕТОДЫ ============

  private getKey(userId: string, assistantId: string): string {
    return `${assistantId}:${userId}`;
  }

  private getConfig(assistantId: string): RateLimitConfig {
    return this.assistantConfigs.get(assistantId) || this.defaultConfig;
  }

  private getUserData(userId: string, assistantId: string): UserRateLimitData {
    const key = this.getKey(userId, assistantId);
    const now = Date.now();

    if (!this.userLimits.has(key)) {
      const newData: UserRateLimitData = {
        messagesThisMinute: 0,
        messagesThisHour: 0,
        messagesThisDay: 0,
        lastMessageTime: 0,
        lastMessages: [],
        minuteResetTime: now + 60000,
        hourResetTime: now + 3600000,
        dayResetTime: now + 86400000,
      };
      this.userLimits.set(key, newData);
    }

    return this.userLimits.get(key)!;
  }

  private resetCountersIfNeeded(userData: UserRateLimitData, now: number): void {
    // Сброс минутного счётчика
    if (now >= userData.minuteResetTime) {
      userData.messagesThisMinute = 0;
      userData.minuteResetTime = now + 60000;
    }

    // Сброс часового счётчика
    if (now >= userData.hourResetTime) {
      userData.messagesThisHour = 0;
      userData.hourResetTime = now + 3600000;
    }

    // Сброс дневного счётчика
    if (now >= userData.dayResetTime) {
      userData.messagesThisDay = 0;
      userData.dayResetTime = now + 86400000;
      userData.lastMessages = []; // Очищаем историю сообщений
    }
  }

  private checkSpam(
    userData: UserRateLimitData, 
    message: string, 
    config: RateLimitConfig
  ): { allowed: boolean; reason?: string } {
    const normalizedMessage = message.toLowerCase().trim();
    
    // Проверяем последние N сообщений
    const recentIdentical = userData.lastMessages.filter(
      msg => msg === normalizedMessage
    ).length;

    if (recentIdentical >= config.spamDetection.maxIdenticalMessages) {
      return {
        allowed: false,
        reason: '🚫 Обнаружен спам. Пожалуйста, не отправляйте одинаковые сообщения.'
      };
    }

    return { allowed: true };
  }

  /**
   * Очистка старых данных (запускать периодически)
   */
  cleanup(): void {
    const now = Date.now();
    const dayAgo = now - 86400000;

    for (const [key, data] of this.userLimits.entries()) {
      // Удаляем данные пользователей, неактивных более суток
      if (data.lastMessageTime < dayAgo) {
        this.userLimits.delete(key);
      }
    }

    console.log(`🧹 Cleaned up old rate limit data. Active users: ${this.userLimits.size}`);
  }
}