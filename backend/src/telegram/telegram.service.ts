// backend/src/telegram/telegram.service.ts - НОВЫЙ ФАЙЛ
import { Injectable } from '@nestjs/common';
import TelegramBotAPI from 'node-telegram-bot-api';
import { EncryptionService } from '../common/encryption.service';

@Injectable()
export class TelegramService {
  constructor(
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Настройка webhook для бота
   */
  async setWebhook(encryptedToken: string, botId: string): Promise<boolean> {
    const backendUrl = process.env.BACKEND_URL;
    
    if (!backendUrl) {
      console.error('❌ BACKEND_URL not set in environment');
      return false;
    }

    // В development используем ngrok или локальный тоннель
    const webhookUrl = `${backendUrl}/telegram/webhook/${botId}`;
    
    try {
      const decryptedToken = this.encryptionService.decrypt(encryptedToken);
      
      const response = await fetch(
        `https://api.telegram.org/bot${decryptedToken}/setWebhook`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: webhookUrl,
            allowed_updates: ['message'],
          })
        }
      );

      const result = await response.json();
      
      if (result.ok) {
        console.log(`✅ Webhook set for bot ${botId}: ${webhookUrl}`);
        return true;
      } else {
        console.error('❌ Failed to set webhook:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ Error setting webhook:', error);
      return false;
    }
  }

  /**
   * Удаление webhook
   */
  async deleteWebhook(encryptedToken: string): Promise<boolean> {
    try {
      const decryptedToken = this.encryptionService.decrypt(encryptedToken);
      
      const response = await fetch(
        `https://api.telegram.org/bot${decryptedToken}/deleteWebhook`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const result = await response.json();
      
      if (result.ok) {
        console.log('✅ Webhook deleted');
        return true;
      } else {
        console.error('❌ Failed to delete webhook:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ Error deleting webhook:', error);
      return false;
    }
  }

  /**
   * Проверка токена бота
   */
  async verifyBotToken(token: string): Promise<{
    id: number;
    username: string;
    firstName: string;
  } | null> {
    try {
      const bot = new TelegramBotAPI(token, { polling: false });
      const me = await bot.getMe();
      
      return {
        id: me.id,
        username: me.username || '',
        firstName: me.first_name,
      };
    } catch (error) {
      console.error('❌ Invalid bot token:', error.message);
      return null;
    }
  }
}