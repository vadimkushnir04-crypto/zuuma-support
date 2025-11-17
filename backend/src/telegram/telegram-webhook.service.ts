// backend/src/telegram/telegram-webhook.service.ts
// ✅ ИСПРАВЛЕНО: История загружается из БД вместо Map в памяти

import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelegramBot } from './entities/telegram-bot.entity';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { AssistantsService } from '../assistants/assistants.service';
import { EncryptionService } from '../common/encryption.service';
import { TokensService } from '../tokens/tokens.service';
import { SupportService } from '../support/support.service';
import { ChatSession } from '../support/entities/chat-session.entity';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
    date: number;
  };
}

@Injectable()
export class TelegramWebhookService {
  // ❌ УДАЛЕНО: Map в памяти больше не используется
  // private conversations = new Map<...>();

  constructor(
    @InjectRepository(TelegramBot)
    private botsRepository: Repository<TelegramBot>,
    private readonly knowledgeService: KnowledgeService,
    private readonly assistantsService: AssistantsService,
    private readonly encryptionService: EncryptionService,
    private readonly tokensService: TokensService,
    @Inject(forwardRef(() => SupportService))
    private readonly supportService: SupportService,
  ) {}

  async handleUpdate(botIdentifier: string, update: TelegramUpdate): Promise<void> {
    console.log('📨 Processing update:', JSON.stringify(update, null, 2));
    
    if (!update.message?.text) {
      console.log('⚠️ No text in message, skipping');
      return;
    }

    const message = update.message;
    const chatId = message.chat.id;
    const userId = message.from.id;
    const userMessage = message.text ?? '';

    console.log(`💬 Message from user ${userId} in chat ${chatId}: "${userMessage}"`);

    const bot = await this.botsRepository.findOne({ 
      where: { id: botIdentifier } 
    });
    
    if (!bot) {
      console.error('❌ Bot not found by ID:', botIdentifier);
      return;
    }

    console.log('✅ Bot found:', bot.botName, 'Assistant:', bot.assistantId);

    const decryptedToken = this.encryptionService.decrypt(bot.botToken);
    
    if (!userMessage.trim()) return;
    
    await this.processTelegramMessage(bot, decryptedToken, chatId, userId, userMessage);
  }

  private async processTelegramMessage(
    bot: TelegramBot,
    botToken: string,
    chatId: number,
    userId: number,
    userMessage: string
  ): Promise<void> {
    console.log('🔍 [PROCESS] Processing message from bot ID:', bot.id);

    const currentBot = await this.botsRepository.findOne({ where: { id: bot.id } });
    if (!currentBot) {
      console.warn('⚠️ Bot not found in DB');
      return;
    }

    if (currentBot.status === 'inactive' || currentBot.status === 'error') {
      await this.sendTelegramMessage(botToken, chatId, '😴 Ассистент сейчас отдыхает. Попробуйте написать позже.');
      return;
    }

    const assistant = await this.assistantsService.getAssistant(currentBot.assistantId);
    if (!assistant) {
      await this.sendTelegramMessage(botToken, chatId, 'Ошибка: ассистент не настроен.');
      return;
    }

    // Команды
    if (userMessage.startsWith('/')) {
      await this.handleCommand(botToken, chatId, userMessage, currentBot);
      return;
    }

    // Получаем или создаем сессию
    const userIdentifier = `telegram:${userId}`;
    const chatSession = await this.supportService.getOrCreateChatSession(
      assistant.id,
      userIdentifier,
      'telegram',
      String(chatId),
    );

    // ============================================
    // ✅ ИСПРАВЛЕНИЕ: Загружаем историю из БД
    // ============================================
    
    const maxHistoryMessages = assistant.settings?.maxHistoryMessages || 10;
    
    const dbMessages = await this.supportService.getChatMessages(
      chatSession.id,
      maxHistoryMessages * 2
    );
    
    const history = dbMessages.map(msg => ({
      role: msg.senderType === 'user' ? ('user' as const) : ('assistant' as const),
      content: msg.content,
      timestamp: msg.createdAt,
    }));
    
    console.log(`📚 Loaded Telegram history from DB: ${history.length} messages`);

    // Сохраняем сообщение пользователя
    await this.supportService.saveMessage(
      chatSession.id,
      'user',
      userMessage,
      currentBot.userId,
    );

    // Если чат передан человеку
    if (chatSession.status === 'pending_human' || chatSession.status === 'human_active') {
      await this.sendTelegramMessage(botToken, chatId, '⏳ Ваш запрос передан специалисту поддержки. Пожалуйста, ожидайте ответа.');
      return;
    }

    // Симуляция печати
    await this.sendTypingAction(botToken, chatId);

    try {
      const result = await this.knowledgeService.generateAnswer(
        userMessage,
        assistant.collectionName,
        assistant.systemPrompt,
        history, // ✅ ПЕРЕДАЁМ РЕАЛЬНУЮ ИСТОРИЮ ИЗ БД!
        0,
        assistant.id
      );

      // Эскалация
      if (result.functionCalled === 'escalate_to_human' && result.functionArgs) {
        const { reason, urgency } = result.functionArgs;

        await this.supportService.escalateToHuman(
          chatSession.id,
          reason || 'User requested human support via Telegram',
          urgency || 'medium',
        );

        await this.supportService.saveMessage(
          chatSession.id,
          'ai',
          result.answer,
          undefined,
          { escalated: true, reason, urgency }
        );

        await this.sendTelegramMessage(botToken, chatId, result.answer);
        return;
      }

      // Очистка ответа
      let cleanAnswer = (result.answer || '').replace(/<\|channel\|>.*?<\|message\|>/gs, '').replace(/<\|[^|>]+\|>/g, '').trim();
      if (!cleanAnswer || cleanAnswer.length < 2) cleanAnswer = result.answer;

      // Сохраняем ответ AI в БД
      await this.supportService.saveMessage(
        chatSession.id,
        'ai',
        cleanAnswer,
        undefined,
        { sources: result.sources, hasContext: result.hasContext },
        undefined,
        result.files
      );

      // ❌ УДАЛЕНО: Больше не обновляем Map в памяти
      // const conversationKey = `telegram:${userId}:bot:${currentBot.id}`;
      // const updatedHistory = [...];
      // this.conversations.set(conversationKey, updatedHistory);

      currentBot.totalMessages = (currentBot.totalMessages || 0) + 1;
      currentBot.lastMessageAt = new Date();
      await this.botsRepository.save(currentBot);

    } catch (error) {
      console.error('❌ Error processing message:', error);
      await this.sendTelegramMessage(botToken, chatId, 'Извините, произошла ошибка.');
    }
  }

  private async handleCommand(
    botToken: string, 
    chatId: number, 
    command: string,
    bot: TelegramBot
  ): Promise<void> {
    switch (command) {
      case '/start':
        await this.sendTelegramMessage(botToken, chatId, 
          'Здравствуйте! Я ваш AI ассистент. Задайте мне любой вопрос.');
        break;

      case '/help':
        await this.sendTelegramMessage(botToken, chatId, 
          `Доступные команды:
/start - Начать общение
/help - Показать справку
/clear - Очистить историю

Просто отправьте ваш вопрос!`);
        break;

      case '/clear':
        // ✅ ИСПРАВЛЕНО: Очищаем историю в БД, а не в памяти
        const userIdentifier = `telegram:${chatId}`;
        const chatSession = await this.supportService.getOrCreateChatSession(
          bot.assistantId,
          userIdentifier,
          'telegram',
          String(chatId),
        );
        
        // Помечаем старую сессию как resolved и создаём новую
        if (chatSession) {
          await this.supportService.resolveChat(chatSession.id, 'user');
        }
        
        await this.sendTelegramMessage(botToken, chatId, 'История очищена! Начните новый диалог.');
        break;

      default:
        await this.sendTelegramMessage(botToken, chatId, 
          'Неизвестная команда. Используйте /help');
    }
  }

  private async findBotByToken(token: string): Promise<TelegramBot | null> {
    const bots = await this.botsRepository.find();
    for (const bot of bots) {
      try {
        const decrypted = this.encryptionService.decrypt(bot.botToken);
        if (decrypted === token) return bot;
      } catch (error) {
        continue;
      }
    }
    return null;
  }

  public async sendTelegramMessage(
    botToken: string, 
    chatId: number, 
    text: string,
    options: Record<string, any> = {}
  ): Promise<void> {
    if (!text || text.trim().length === 0) {
      console.error('❌ Attempted to send empty message, aborting');
      return;
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, ...options })
        }
      );
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Telegram API error:', result);
      } else {
        console.log('✅ Message sent successfully');
      }
    } catch (error) {
      console.error('❌ Failed to send message:', error);
    }
  }

  private async sendTypingAction(botToken: string, chatId: number): Promise<void> {
    try {
      await fetch(
        `https://api.telegram.org/bot${botToken}/sendChatAction`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, action: 'typing' })
        }
      );
    } catch (error) {
      console.error('❌ Failed to send typing action:', error);
    }
  }

  public async sendTelegramMessageForSession(session: ChatSession, text: string) {
    if (!session || !session.externalChatId) return;

    const bot = await this.botsRepository.findOne({ 
      where: { assistantId: session.assistantId } 
    });

    if (!bot) {
      console.warn('No bot found for session', session.id);
      return;
    }

    try {
      const botToken = this.encryptionService.decrypt(bot.botToken);
      await this.sendTelegramMessage(botToken, Number(session.externalChatId), text);
    } catch (err) {
      console.error('Error sending Telegram message for session:', err);
    }
  }

  public async sendTelegramPhoto(
    botToken: string,
    chatId: number,
    photoUrl: string,
    caption?: string
  ): Promise<void> {
    try {
      console.log(`📸 Sending photo to Telegram: ${photoUrl}`);
      
      const fileResponse = await fetch(photoUrl);
      
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file: ${fileResponse.statusText}`);
      }
      
      const fileBuffer = await fileResponse.arrayBuffer();
      
      const FormData = require('form-data');
      const formData = new FormData();
      
      formData.append('chat_id', chatId.toString());
      formData.append('photo', Buffer.from(fileBuffer), 'photo.jpg');
      
      if (caption) {
        formData.append('caption', caption);
      }
      
      const axios = require('axios');
      
      const response = await axios.post(
        `https://api.telegram.org/bot${botToken}/sendPhoto`,
        formData,
        {
          headers: formData.getHeaders(),
        }
      );

      console.log('✅ Photo sent successfully');
      
    } catch (error) {
      console.error('❌ Failed to send photo:', error.message);
      throw error;
    }
  }

  public async sendTelegramDocument(
    botToken: string,
    chatId: number,
    documentUrl: string,
    caption?: string
  ): Promise<void> {
    try {
      console.log(`📄 Sending document to Telegram: ${documentUrl}`);
      
      const fileResponse = await fetch(documentUrl);
      
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file: ${fileResponse.statusText}`);
      }
      
      const fileBuffer = await fileResponse.arrayBuffer();
      const fileName = caption || 'document.pdf';
      
      const FormData = require('form-data');
      const formData = new FormData();
      
      formData.append('chat_id', chatId.toString());
      formData.append('document', Buffer.from(fileBuffer), {
        filename: fileName,
      });
      
      if (caption) {
        formData.append('caption', caption);
      }
      
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendDocument`,
        {
          method: 'POST',
          body: formData,
          headers: formData.getHeaders ? formData.getHeaders() : {}
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Telegram API error:', errorText);
        throw new Error(`Telegram API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Document sent successfully');
      
    } catch (error) {
      console.error('❌ Failed to send document:', error);
      throw error;
    }
  }
}