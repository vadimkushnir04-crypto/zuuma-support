// backend/src/chat/chat.service.ts - ПОЛНАЯ ВЕРСИЯ

import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { KnowledgeService } from "../knowledge/knowledge.service";
import { SupportService } from '../support/support.service';
import { AssistantsService } from '../assistants/assistants.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assistant } from '../assistants/entities/assistant.entity';
import { EmailService } from '../common/email.service';
import { NotificationBotService } from '../notification-bot/notification-bot.service';

interface EscalationNotification {
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
export class ChatService {
  private readonly logger = new Logger('ChatService');

  constructor(
    private knowledgeService: KnowledgeService,
    private supportService: SupportService,
    private assistantsService: AssistantsService,
    @InjectRepository(Assistant)
    private assistantRepo: Repository<Assistant>,
    private emailService: EmailService, // ✅ Используем EmailService напрямую
    private readonly notificationBotService: NotificationBotService,
  ) {}

  /**
   * 💬 Главный метод для общения с ассистентом
   */
  async chat(
    apiKey: string,
    message: string,
    conversationId?: string,
    conversationHistory: any[] = []
  ) {
    try {
      console.log('💬 ChatService.chat:', {
        apiKey: apiKey.substring(0, 10) + '...',
        message: message.substring(0, 100),
        conversationId,
        historyLength: conversationHistory.length
      });

      // ============================================
      // 1️⃣ ПОЛУЧЕНИЕ АССИСТЕНТА
      // ============================================
      const assistant = await this.assistantsService.getAssistantByApiKey(apiKey);
      
      if (!assistant) {
        throw new BadRequestException('Недействительный API ключ');
      }

      if (!assistant.isActive) {
        throw new BadRequestException('Ассистент отключен');
      }

      // ============================================
      // 2️⃣ ПОЛУЧЕНИЕ ИЛИ СОЗДАНИЕ СЕССИИ
      // ============================================
      let chatSession = conversationId 
        ? await this.supportService.findByConversationId(conversationId)
        : null;

      if (!chatSession) {
        // Создаём новую сессию
        const userIdentifier = `user_${Date.now()}`;
        chatSession = await this.supportService.getOrCreateChatSession(
          assistant.id,
          userIdentifier,
          'web',
          conversationId
        );
        
        console.log(`✅ Created new session: ${chatSession.id}`);
      }

      // ============================================
      // 3️⃣ СОХРАНЕНИЕ СООБЩЕНИЯ ПОЛЬЗОВАТЕЛЯ
      // ============================================
      await this.supportService.saveMessage(
        chatSession.id,
        'user',
        message,
        undefined,
        undefined,
        chatSession.userIdentifier
      );

      // ============================================
      // 4️⃣ ПОЛУЧЕНИЕ ОТВЕТА ОТ KNOWLEDGE SERVICE
      // ============================================
      const result = await this.knowledgeService.generateAnswer(
        message,
        assistant.collectionName,
        assistant.systemPrompt,
        conversationHistory,
        0,
        assistant.id
      );

      // ============================================
      // 5️⃣ ОБРАБОТКА ЭСКАЛАЦИИ
      // ============================================
      if (result.functionCalled === 'escalate_to_human') {
        console.log('🚨 Escalation detected - processing...');
        
        await this.handleEscalation(
          chatSession,
          assistant,
          message,
          conversationHistory,
          result.functionArgs
        );
      }

      // ============================================
      // 6️⃣ СОХРАНЕНИЕ ОТВЕТА АССИСТЕНТА
      // ============================================
      await this.supportService.saveMessage(
        chatSession.id,
        'ai',
        result.answer,
        assistant.id,
        {
          sources: result.sources,
          hasContext: result.hasContext,
          tokensCharged: result.tokensCharged,
          functionCalled: result.functionCalled,
          searchResults: result.searchResults
        },
        chatSession.userIdentifier,
        result.files // передаём файлы если есть
      );

      // ============================================
      // 7️⃣ ОБНОВЛЕНИЕ СТАТИСТИКИ
      // ============================================
      await this.assistantsService.incrementAssistantStats(assistant.id);

      // ============================================
      // 8️⃣ ВОЗВРАТ РЕЗУЛЬТАТА
      // ============================================
      return {
        response: result.answer,
        conversationId: chatSession.id,
        sessionId: chatSession.id,
        sources: result.sources || 0,
        hasContext: result.hasContext || false,
        searchResults: result.searchResults,
        files: result.files,
        escalated: result.functionCalled === 'escalate_to_human',
        tokensCharged: result.tokensCharged
      };

    } catch (error) {
      this.logger.error('Chat error:', error);
      
      // Специальная обработка ошибки токенов
      if (error.response?.type === 'INSUFFICIENT_TOKENS') {
        throw new BadRequestException({
          success: false,
          error: 'Недостаточно токенов. Пожалуйста, пополните баланс.',
          type: 'INSUFFICIENT_TOKENS'
        });
      }
      
      throw error;
    }
  }

  /**
   * 🚨 Обработка эскалации к человеку
   */
  private async handleEscalation(
    chatSession: any,
    assistant: Assistant,
    currentMessage: string,
    history: any[],
    escalationArgs: any
  ): Promise<void> {
    try {
      console.log('🚨 Processing escalation:', {
        session: chatSession.id,
        assistant: assistant.name,
        reason: escalationArgs?.reason
      });

      // ============================================
      // 1️⃣ ОБНОВЛЕНИЕ СТАТУСА СЕССИИ
      // ============================================
      await this.supportService.escalateToHuman(
        chatSession.id,
        escalationArgs?.reason || 'User requested human support',
        escalationArgs?.urgency || 'medium'
      );

      // ============================================
      // 2️⃣ ФОРМИРОВАНИЕ КОНТЕКСТА
      // ============================================
      const lastMessages = [
        ...history.slice(-3),
        { role: 'user', content: currentMessage }
      ];

      // ============================================
      // 3️⃣ ОТПРАВКА УВЕДОМЛЕНИЙ
      // ============================================
      const notification: EscalationNotification = {
        sessionId: chatSession.id,
        assistantId: assistant.id,
        assistantName: assistant.name,
        userIdentifier: chatSession.userIdentifier,
        reason: escalationArgs?.reason || 'User requested human support',
        urgency: escalationArgs?.urgency || 'medium',
        lastMessages: lastMessages,
        timestamp: new Date(),
        metadata: escalationArgs?.metadata
      };

      await this.sendEscalationNotifications(notification, assistant);

      console.log('✅ Escalation processed successfully');

    } catch (error) {
      this.logger.error('Failed to process escalation:', error);
      // Не прерываем ответ пользователю даже если уведомления не отправились
    }
  }

  /**
   * 📧 Отправка уведомлений о эскалации
   */
  async sendEscalationNotifications(
    notification: EscalationNotification,
    assistant: Assistant
  ): Promise<void> {
    try {
      const message = this.formatEscalationMessage(notification);

      // 1️⃣ Telegram уведомление
      if (assistant.settings?.notificationTelegramChatId) {
        await this.sendTelegramNotification(
          assistant.settings.notificationTelegramChatId,
          message
        );
      }

      // 2️⃣ Email уведомление
      if (assistant.settings?.notificationEmail || assistant.user?.email) {
        const email = assistant.settings?.notificationEmail || assistant.user?.email;
        await this.sendEmailNotification(email, assistant.name, notification);
      }

      // 3️⃣ WebSocket уже обрабатывается через SupportGateway автоматически

      this.logger.log(`✅ Escalation notifications sent for session ${notification.sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to send notifications: ${error.message}`);
    }
  }

  /**
   * 📝 Форматирование сообщения для Telegram (HTML формат)
   */
  private formatEscalationMessage(notification: EscalationNotification): string {
    const urgencyEmoji = {
      low: '🔵',
      medium: '🟡',
      high: '🔴'
    };

    const emoji = urgencyEmoji[notification.urgency];
    const frontendUrl = process.env.FRONTEND_URL || 'https://zuuma.ru';

    // ✅ ИСПРАВЛЕНИЕ: Правильный HTML формат для Telegram
    let message = `<b>${emoji} Новая эскалация — ${notification.assistantName}</b>\n\n`;
    message += `👤 <b>Пользователь:</b> ${notification.userIdentifier}\n`;
    message += `📋 <b>Причина:</b> ${notification.reason}\n`;
    message += `⏰ <b>Время:</b> ${notification.timestamp.toLocaleString('ru-RU')}\n\n`;

    if (notification.lastMessages && notification.lastMessages.length > 0) {
      message += `<b>💬 Последние сообщения:</b>\n`;
      notification.lastMessages.forEach((msg) => {
        const roleEmoji = msg.role === 'user' ? '👤' : '🤖';
        const content = msg.content.substring(0, 200);
        // ✅ Экранируем HTML символы
        const escapedContent = content
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        message += `${roleEmoji} ${escapedContent}${msg.content.length > 200 ? '...' : ''}\n`;
      });
    }

    message += `\n🔗 <a href="${frontendUrl}/support/chat/${notification.sessionId}">Перейти к чату</a>`;

    return message;
  }

  /**
   * 📱 Отправка в Telegram
   */
  private async sendTelegramNotification(chatId: string, message: string): Promise<void> {
    try {
      console.log('📱 Attempting Telegram notification:', {
        chatId,
        botAvailable: this.notificationBotService.isAvailable()
      });

      // ✅ Используем NotificationBotService вместо прямого fetch
      const sent = await this.notificationBotService.sendNotification(chatId, message);
      
      if (sent) {
        this.logger.log(`✅ Telegram notification sent to chat ${chatId}`);
      } else {
        this.logger.warn(`⚠️ Failed to send Telegram notification (bot not available)`);
      }
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
    notification: EscalationNotification
  ): Promise<void> {
    try {
      const subject = `🚨 Эскалация: ${assistantName}`;
      const htmlBody = this.formatEmailBody(notification);
      
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
  private formatEmailBody(notification: EscalationNotification): string {
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
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .message { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid ${color}; }
            .button { display: inline-block; background: ${color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
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
              
              ${notification.lastMessages?.length > 0 ? `
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
          </div>
        </body>
      </html>
    `;
  }
}