// backend/src/notification-bot/notification-bot.service.ts

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';

@Injectable()
export class NotificationBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('NotificationBot');
  private bot: TelegramBot | null = null;
  private isInitialized = false;

  async onModuleInit() {
    await this.startBot();
  }

  async onModuleDestroy() {
    await this.stopBot();
  }

  /**
   * 🚀 Запуск бота
   */
  private async startBot() {
    const token = process.env.NOTIFICATION_BOT_TOKEN;
    
    if (!token) {
      this.logger.warn('⚠️ NOTIFICATION_BOT_TOKEN not configured - notification bot disabled');
      this.logger.warn('Set NOTIFICATION_BOT_TOKEN in .env to enable notifications');
      return;
    }

    try {
      this.bot = new TelegramBot(token, { 
        polling: {
          interval: 1000,
          autoStart: true,
          params: {
            timeout: 10
          }
        }
      });

      // Проверка подключения
      const info = await this.bot.getMe();
      this.logger.log(`✅ Notification bot started: @${info.username} (ID: ${info.id})`);
      this.logger.log(`📱 Users can get their Chat ID by sending /start to @${info.username}`);

      this.setupHandlers();
      this.isInitialized = true;

    } catch (error) {
      this.logger.error(`❌ Failed to start notification bot: ${error.message}`);
      this.logger.error('Check your NOTIFICATION_BOT_TOKEN in .env');
    }
  }

  /**
   * 🛑 Остановка бота
   */
  private async stopBot() {
    if (this.bot && this.isInitialized) {
      try {
        await this.bot.stopPolling();
        this.logger.log('👋 Notification bot stopped');
      } catch (error) {
        this.logger.error(`Error stopping bot: ${error.message}`);
      }
    }
  }

  /**
   * 🎮 Настройка обработчиков команд
   */
  private setupHandlers() {
    if (!this.bot) return;

    // Обработчик /start
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const username = msg.from?.username;
      const firstName = msg.from?.first_name;
      
      this.logger.log(`📱 /start from ${username ? '@' + username : 'user'} (Chat ID: ${chatId})`);

      const response = `
🤖 *ZUUMA Notification Bot*

👋 Привет${firstName ? ', ' + firstName : ''}!

📋 *Ваш Chat ID:* \`${chatId}\`

*Как настроить уведомления:*

1️⃣ Скопируйте Chat ID выше (нажмите на него)
2️⃣ Зайдите на https://zuuma.ru/assistants/create
3️⃣ Создайте или откройте ассистента
4️⃣ Откройте раздел "Настройки уведомлений"
5️⃣ Вставьте Chat ID в поле "Telegram Chat ID"
6️⃣ Нажмите "Сохранить"

✅ *Готово!* Теперь вы будете получать уведомления о:
• 🔴 Запросах клиентов на связь с оператором
• 🟡 Низком балансе токенов
• ⚠️ Критических ошибках

*Команды:*
/start - Показать Chat ID
/help - Подробная помощь
/test - Тестовое уведомление

💡 *Совет:* Сохраните этот Chat ID в надёжном месте
      `.trim();

      try {
        await this.bot!.sendMessage(chatId, response, { 
          parse_mode: 'Markdown',
          disable_web_page_preview: true 
        });
      } catch (error) {
        this.logger.error(`Failed to send /start response: ${error.message}`);
      }
    });

    // Обработчик /help
    this.bot.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id;
      
      const helpText = `
📖 *Помощь - ZUUMA Notification Bot*

*Что это за бот?*
Этот бот отправляет вам уведомления о важных событиях в ваших AI ассистентах на платформе ZUUMA.

*Как получить Chat ID?*
Отправьте команду /start

*Как настроить уведомления?*
1. Получите Chat ID через /start
2. Добавьте его в настройки ассистента на zuuma.ru
3. Готово! Уведомления будут приходить сюда

*Какие уведомления я получу?*
🔴 *Эскалации* - когда клиент просит связь с оператором
🟡 *Токены* - когда баланс токенов заканчивается
⚠️ *Ошибки* - критические проблемы в работе

*Можно ли отключить уведомления?*
Да, просто удалите Chat ID из настроек ассистента на zuuma.ru

*Проблемы?*
Напишите в поддержку: delovoi.acount@gmail.com

*Команды:*
/start - Получить Chat ID
/help - Эта справка
/test - Тестовое уведомление
      `.trim();

      try {
        await this.bot!.sendMessage(chatId, helpText, { 
          parse_mode: 'Markdown',
          disable_web_page_preview: true 
        });
      } catch (error) {
        this.logger.error(`Failed to send /help response: ${error.message}`);
      }
    });

    // Обработчик /test
    this.bot.onText(/\/test/, async (msg) => {
      const chatId = msg.chat.id;
      
      this.logger.log(`🧪 /test from Chat ID: ${chatId}`);

      const testMessage = `
🧪 *Тестовое уведомление*

Если вы видите это сообщение - уведомления работают корректно! ✅

📋 Ваш Chat ID: \`${chatId}\`

Пример реального уведомления:
──────────────────
🔴 *Новая эскалация - Тестовый ассистент*

👤 Пользователь: user_12345
📋 Причина: Пользователь запросил связь с оператором
⏰ Время: ${new Date().toLocaleString('ru-RU')}

💬 Последние сообщения:
👤 Здравствуйте, хочу поговорить с менеджером
🤖 Конечно! Передаю ваш запрос специалисту...

🔗 Перейти к чату: https://zuuma.ru/support/chat/xxx
──────────────────

Всё работает! 🎉
      `.trim();

      try {
        await this.bot!.sendMessage(chatId, testMessage, { 
          parse_mode: 'Markdown',
          disable_web_page_preview: true 
        });
      } catch (error) {
        this.logger.error(`Failed to send /test response: ${error.message}`);
      }
    });

    // Обработчик любых других сообщений
    this.bot.on('message', async (msg) => {
      // Пропускаем команды (они обрабатываются выше)
      if (msg.text?.startsWith('/')) return;
      
      const chatId = msg.chat.id;
      const text = msg.text || '[non-text message]';
      
      this.logger.log(`💬 Message from ${chatId}: ${text.substring(0, 50)}`);
      
      const reply = `
Получил ваше сообщение! 📨

Ваш Chat ID: \`${chatId}\`

Используйте команду /start для получения инструкций по настройке уведомлений.

Или /help для подробной справки.
      `.trim();

      try {
        await this.bot!.sendMessage(chatId, reply, { 
          parse_mode: 'Markdown' 
        });
      } catch (error) {
        this.logger.error(`Failed to reply to message: ${error.message}`);
      }
    });

    // Обработка ошибок polling
    this.bot.on('polling_error', (error: any) => {
      // Игнорируем ETELEGRAM ошибки (обычно это просто таймауты)
      if (error?.code === 'ETELEGRAM' || error?.code === 'EFATAL') {
        this.logger.debug(`Telegram polling error (normal): ${error.message}`);
      } else {
        this.logger.error(`Polling error: ${error.message}`);
      }
    });

    // Обработка других ошибок
    this.bot.on('error', (error: any) => {
      this.logger.error(`Bot error: ${error.message || error}`);
    });
  }

  /**
   * 📱 Отправка уведомления (публичный метод для использования в ChatService)
   */
  async sendNotification(chatId: string | number, message: string): Promise<boolean> {
    if (!this.bot || !this.isInitialized) {
      this.logger.warn('Notification bot not initialized - cannot send notification');
      return false;
    }

    try {
      await this.bot.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });
      
      this.logger.log(`✅ Notification sent to Chat ID: ${chatId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send notification to ${chatId}: ${error.message}`);
      return false;
    }
  }

  /**
   * 🔍 Проверка доступности бота
   */
  isAvailable(): boolean {
    return this.bot !== null && this.isInitialized;
  }

  /**
   * 📊 Получение информации о боте
   */
  async getBotInfo() {
    if (!this.bot) return null;

    try {
      const info = await this.bot.getMe();
      return {
        id: info.id,
        username: info.username,
        firstName: info.first_name,
        isAvailable: this.isInitialized
      };
    } catch (error) {
      this.logger.error(`Failed to get bot info: ${error.message}`);
      return null;
    }
  }
}