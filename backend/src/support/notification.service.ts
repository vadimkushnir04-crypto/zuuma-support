// backend/src/support/notification.service.ts - ИСПРАВЛЕННАЯ ВЕРСИЯ

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assistant } from '../assistants/entities/assistant.entity';
import { EmailService } from '../common/email.service';

export interface EscalationNotification {
  sessionId: string;
  assistantId: string;
  assistantName: string;
  userIdentifier: string;
  reason: string;
  urgency: 'low' | 'medium' | 'high';
  lastMessages: Array<{ role: string; content: string }>;
  timestamp: Date;
  metadata?: any;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger('NotificationService');

  constructor(
    @InjectRepository(Assistant)
    private assistantRepo: Repository<Assistant>,
    
    private emailService: EmailService,
  ) {}

  /**
   * 🚨 Отправка уведомления о эскалации по всем настроенным каналам
   */
  async notifyEscalation(notification: EscalationNotification): Promise<void> {
    this.logger.log(`🚨 Sending escalation notification for session ${notification.sessionId}`);

    try {
      // Получаем настройки ассистента
      const assistant = await this.assistantRepo.findOne({
        where: { id: notification.assistantId },
        relations: ['user'],
      });

      if (!assistant) {
        this.logger.error('Assistant not found');
        return;
      }

      // Формируем текст уведомления
      const message = this.formatEscalationMessage(notification);

      // 1️⃣ Telegram уведомление (приоритет)
      if (assistant.settings?.notificationTelegramChatId) {
        await this.sendTelegramNotification(
          assistant.settings.notificationTelegramChatId,
          message
        );
      }

      // 2️⃣ Email уведомление
      const emailTo = assistant.settings?.notificationEmail || assistant.user?.email;
      
      if (emailTo) {
        await this.sendEmailNotification(
          emailTo,
          notification.assistantName,
          message,
          notification
        );
      }

      this.logger.log(`✅ Escalation notifications sent successfully`);
    } catch (error) {
      this.logger.error(`Failed to send escalation notification: ${error.message}`);
    }
  }

  /**
   * 📝 Форматирование сообщения для уведомления
   */
  private formatEscalationMessage(notification: EscalationNotification): string {
    const urgencyEmoji = {
      low: '🔵',
      medium: '🟡',
      high: '🔴'
    };

    const emoji = urgencyEmoji[notification.urgency];

    let message = `${emoji} Новая эскалация - ${notification.assistantName}\n\n`;
    message += `👤 Пользователь: ${notification.userIdentifier}\n`;
    message += `📋 Причина: ${notification.reason}\n`;
    message += `⏰ Время: ${notification.timestamp.toLocaleString('ru-RU')}\n\n`;

    // Добавляем последние сообщения
    if (notification.lastMessages && notification.lastMessages.length > 0) {
      message += `💬 Последние сообщения:\n`;
      notification.lastMessages.forEach((msg) => {
        const roleEmoji = msg.role === 'user' ? '👤' : '🤖';
        message += `${roleEmoji} ${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}\n`;
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://zuuma.ru';
    message += `\n🔗 Перейти к чату: ${frontendUrl}/support/chat/${notification.sessionId}`;

    return message;
  }

  /**
   * 📱 Отправка в Telegram
   */
  private async sendTelegramNotification(
    chatId: string,
    message: string
  ): Promise<void> {
    try {
      const notificationBotToken = process.env.NOTIFICATION_BOT_TOKEN;
      
      if (!notificationBotToken) {
        this.logger.warn('NOTIFICATION_BOT_TOKEN not configured - skipping Telegram notification');
        return;
      }

      const url = `https://api.telegram.org/bot${notificationBotToken}/sendMessage`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Telegram API error: ${JSON.stringify(errorData)}`);
      }

      this.logger.log(`✅ Telegram notification sent to chat ${chatId}`);
    } catch (error) {
      this.logger.error(`Failed to send Telegram notification: ${error.message}`);
    }
  }

  /**
   * 📧 Отправка Email уведомления
   */
  private async sendEmailNotification(
    email: string,
    assistantName: string,
    message: string,
    notification: EscalationNotification
  ): Promise<void> {
    try {
      // Используем существующий метод sendLowTokensWarning как временное решение
      // или создаём новый метод в EmailService
      
      const subject = `🚨 Эскалация: ${assistantName}`;
      const htmlBody = this.formatEmailBody(notification, message);
      
      // Отправляем через существующий EmailService
      await this.emailService.sendEmail(
        email,
        subject,
        htmlBody
      );

      this.logger.log(`✅ Email notification sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send email notification: ${error.message}`);
    }
  }

  /**
   * 📧 Форматирование HTML для email
   */
  private formatEmailBody(notification: EscalationNotification, plainMessage: string): string {
    const urgencyColors = {
      low: '#3b82f6',
      medium: '#f59e0b',
      high: '#ef4444'
    };

    const color = urgencyColors[notification.urgency];
    const frontendUrl = process.env.FRONTEND_URL || 'https://zuuma.ru';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${color}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; }
            .message { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid ${color}; border-radius: 4px; }
            .button { display: inline-block; background: ${color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🚨 Новая эскалация</h2>
              <p>${notification.assistantName}</p>
            </div>
            <div class="content">
              <p><strong>👤 Пользователь:</strong> ${notification.userIdentifier}</p>
              <p><strong>📋 Причина:</strong> ${notification.reason}</p>
              <p><strong>⏰ Время:</strong> ${notification.timestamp.toLocaleString('ru-RU')}</p>
              
              ${notification.lastMessages && notification.lastMessages.length > 0 ? `
                <h3>💬 Последние сообщения:</h3>
                ${notification.lastMessages.map(msg => `
                  <div class="message">
                    <strong>${msg.role === 'user' ? '👤 Пользователь' : '🤖 Ассистент'}:</strong><br/>
                    ${msg.content}
                  </div>
                `).join('')}
              ` : ''}
              
              <a href="${frontendUrl}/support/chat/${notification.sessionId}" class="button">
                Перейти к чату
              </a>
            </div>
            <div class="footer">
              <p>Это автоматическое уведомление от вашего AI ассистента</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * 🔔 Уведомление о критических событиях (нехватка токенов)
   */
  async notifyCriticalEvent(
    assistantId: string,
    eventType: 'low_tokens' | 'no_tokens' | 'system_error',
    message: string,
    metadata?: any
  ): Promise<void> {
    const assistant = await this.assistantRepo.findOne({
      where: { id: assistantId },
      relations: ['user'],
    });

    if (!assistant) return;

    const urgencyMap = {
      low_tokens: '🟡',
      no_tokens: '🔴',
      system_error: '⚠️'
    };

    const notificationMessage = `${urgencyMap[eventType]} ${message}\n\n` +
      `🤖 Ассистент: ${assistant.name}\n` +
      `⏰ ${new Date().toLocaleString('ru-RU')}`;

    // Отправляем по всем каналам
    if (assistant.settings?.notificationTelegramChatId) {
      await this.sendTelegramNotification(
        assistant.settings.notificationTelegramChatId,
        notificationMessage
      );
    }

    const emailTo = assistant.settings?.notificationEmail || assistant.user?.email;
    if (emailTo) {
      try {
        await this.emailService.sendEmail(
          emailTo,
          `${urgencyMap[eventType]} ${eventType.toUpperCase()}: ${assistant.name}`,
          `<pre>${notificationMessage}</pre>`
        );
      } catch (error) {
        this.logger.error(`Failed to send critical event email: ${error.message}`);
      }
    }
  }
}