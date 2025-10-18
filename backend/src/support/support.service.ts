// backend/src/support/support.service.ts
import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { SupportManager } from './entities/support-manager.entity';
import { CreateManagerDto, ChatFilterDto } from './dto/support.dto';
import { TelegramBot } from '../telegram/entities/telegram-bot.entity';
import { TelegramWebhookService } from '../telegram/telegram-webhook.service';
import { EncryptionService } from '../common/encryption.service';
import { SupportGateway } from './support.gateway';
import { ModuleRef } from '@nestjs/core';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';


@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(ChatSession)
    private chatSessionRepo: Repository<ChatSession>,
    
    @InjectRepository(ChatMessage)
    private chatMessageRepo: Repository<ChatMessage>,
    
    @InjectRepository(SupportManager)
    private managerRepo: Repository<SupportManager>,

    @InjectRepository(TelegramBot)
    private telegramBotRepo: Repository<TelegramBot>,
    
    @Inject(forwardRef(() => TelegramWebhookService))
    private readonly telegramWebhookService: TelegramWebhookService,
    private readonly encryptionService: EncryptionService,

    private moduleRef: ModuleRef,            // <- для динамического получения TelegramWebhookService
    private readonly gateway: SupportGateway, // <- WS gateway
  ) {}

  // ============================================
  // 📊 CHAT SESSIONS
  // ============================================

  async getOrCreateChatSession(
    assistantId: string,
    userIdentifier: string,
    integrationType: string,
    externalChatId?: string,
  ): Promise<ChatSession> {
    // Ищем существующую активную сессию
    let session = await this.chatSessionRepo.findOne({
      where: {
        assistantId,
        userIdentifier,
        status: In(['ai', 'pending_human', 'human_active']),
      },
      order: { createdAt: 'DESC' },
    });

    if (!session) {
      session = this.chatSessionRepo.create({
        assistantId,
        userIdentifier,
        integrationType,
        externalChatId,
        status: 'ai',
      });
      await this.chatSessionRepo.save(session);
      console.log('✅ Created new chat session:', session.id);
    }

    return session;
  }

  async getChatSessions(filters: ChatFilterDto, companyId: string) {
    const query = this.chatSessionRepo.createQueryBuilder('session');

    if (filters.status) {
      query.andWhere('session.status = :status', { status: filters.status });
    }

    if (filters.assistantId) {
      query.andWhere('session.assistantId = :assistantId', {
        assistantId: filters.assistantId,
      });
    }

    if (filters.managerId) {
      query.andWhere('session.assignedManagerId = :managerId', {
        managerId: filters.managerId,
      });
    }

    if (filters.integrationType) {
      query.andWhere('session.integrationType = :type', {
        type: filters.integrationType,
      });
    }

    query.orderBy('session.escalatedAt', 'DESC', 'NULLS LAST');
    query.addOrderBy('session.createdAt', 'DESC');

    if (filters.limit) {
      query.take(filters.limit);
    }

    if (filters.offset) {
      query.skip(filters.offset);
    }

    const [sessions, total] = await query.getManyAndCount();

    return { sessions, total };
  }

  async getChatSession(sessionId: string): Promise<ChatSession> {
    const session = await this.chatSessionRepo.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    return session;
  }

  // ============================================
  // 🚨 ESCALATION
  // ============================================

  async escalateToHuman(
    sessionId: string,
    reason: string,
    urgency: 'low' | 'medium' | 'high' = 'medium',
  ): Promise<ChatSession> {
    const session = await this.getChatSession(sessionId);

    if (session.status === 'resolved') {
      throw new BadRequestException('Cannot escalate resolved chat');
    }

    session.status = 'pending_human';
    session.escalationReason = reason;
    session.escalationUrgency = urgency;
    session.escalatedAt = new Date();

    await this.chatSessionRepo.save(session);

    console.log('🚨 Chat escalated to human:', {
      sessionId,
      reason,
      urgency,
    });

    // TODO: отправить уведомление менеджеру (email/webhook/websocket)

    return session;
  }

  async assignManager(sessionId: string, managerId: string): Promise<ChatSession> {
    const session = await this.getChatSession(sessionId);
    const manager = await this.getManager(managerId);

    if (!manager.active) {
      throw new BadRequestException('Manager is not active');
    }

    session.assignedManagerId = managerId;
    session.status = 'human_active';

    await this.chatSessionRepo.save(session);

    console.log('👤 Manager assigned to chat:', { sessionId, managerId });

    return session;
  }

  async resolveChat(sessionId: string, resolvedBy: string): Promise<ChatSession> {
    const session = await this.getChatSession(sessionId);

    session.status = 'resolved';
    session.resolvedAt = new Date();
    session.resolvedBy = resolvedBy;

    await this.chatSessionRepo.save(session);

    console.log('✅ Chat resolved:', { sessionId, resolvedBy });

    return session;
  }

  // ============================================
  // 💬 MESSAGES
  // ============================================
// В support.service.ts замените метод saveMessage:

  async saveMessage(
    chatSessionId: string,
    senderType: 'user' | 'ai' | 'manager',
    content: string,
    senderId?: string,
    metadata?: any,
    userIdentifier?: string,
    files?: any[]
  ): Promise<ChatMessage> {
    if (!content?.trim()) {
      throw new BadRequestException('Message content cannot be empty');
    }

    const session = await this.chatSessionRepo.findOne({ where: { id: chatSessionId } });
    if (!session) {
      throw new NotFoundException(`ChatSession ${chatSessionId} not found`);
    }

    // ✅ Добавляем files в metadata
    const messageMetadata = {
      ...metadata,
      files: files || [],
    };

    const message = this.chatMessageRepo.create({
      chatSessionId,
      senderType,
      senderId,
      content,
      metadata: messageMetadata,
    });

    await this.chatMessageRepo.save(message);

    console.log('💬 Message saved:', { 
      id: message.id, 
      chatSessionId, 
      senderId,
      filesCount: files?.length || 0
    });

    const payload = {
      id: message.id,
      chatSessionId,
      senderType,
      content,
      createdAt: message.createdAt || new Date().toISOString(),
      senderId,
      metadata: messageMetadata,
      files: files || [],
      userIdentifier,
    };

    // ✅ WebSocket отправка с проверкой готовности Gateway
    if (!this.gateway?.server) {
      console.warn('⚠️ Gateway not ready, delaying emit');
      setTimeout(() => this.saveMessage(chatSessionId, senderType, content, senderId, metadata, userIdentifier, files), 500);
    } else {
      try {
        // Отправляем в комнату сессии (для support страницы и Chat.tsx)
        this.gateway.emitMessageToSession(chatSessionId, payload);
      } catch (err) {
        console.error('WS emit error:', err);
      }
    }

    // ✅ Отправка в Telegram ТОЛЬКО для сообщений от AI и manager
    if (
      session.integrationType === 'telegram' &&
      session.externalChatId &&
      senderType !== 'user'
    ) {
      const telegramService = this.moduleRef.get<TelegramWebhookService>(
        TelegramWebhookService,
        { strict: false },
      );

      if (telegramService) {
        try {
          // 1️⃣ Отправляем текст
          await telegramService.sendTelegramMessageForSession(session, content);
          
          // 2️⃣ Отправляем файлы
          if (files && files.length > 0) {
            console.log(`📎 Sending ${files.length} file(s) to Telegram`);
            
            const bot = await this.telegramBotRepo.findOne({ 
              where: { assistantId: session.assistantId } 
            });
            
            if (bot) {
              const botToken = this.encryptionService.decrypt(bot.botToken);
              const chatId = Number(session.externalChatId);
              
              for (const file of files) {
                const fileUrl = `${process.env.NEXT_PUBLIC_API_URL}${file.fileUrl}`;
                
                try {
                  if (file.fileType === 'image') {
                    await telegramService.sendTelegramPhoto(botToken, chatId, fileUrl, file.fileName);
                  } else {
                    await telegramService.sendTelegramDocument(botToken, chatId, fileUrl, file.fileName);
                  }
                  console.log(`✅ File sent to Telegram: ${file.fileName}`);
                } catch (fileError) {
                  console.error(`❌ Failed to send file ${file.fileName}:`, fileError);
                  await telegramService.sendTelegramMessage(
                    botToken, 
                    chatId, 
                    `⚠️ Не удалось отправить файл: ${file.fileName}`
                  );
                }
              }
            }
          }
        } catch (err) {
          console.error('Failed to send message to Telegram:', err);
        }
      }
    }

    return message;
  }


  async getChatMessages(sessionId: string, limit = 100): Promise<ChatMessage[]> {
    return this.chatMessageRepo.find({
      where: { chatSessionId: sessionId },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  // ============================================
  // 👥 MANAGERS
  // ============================================

  async createManager(dto: CreateManagerDto, createdByUserId: string, companyId: string): Promise<SupportManager> {
    const existing = await this.managerRepo.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('Manager with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const manager = this.managerRepo.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
      role: dto.role || 'responder',
      companyId,
      createdByUserId,
      active: true,
    });

    await this.managerRepo.save(manager);

    console.log('✅ Manager created:', { id: manager.id, email: manager.email });

    return manager;
  }

  async getManager(managerId: string): Promise<SupportManager> {
    const manager = await this.managerRepo.findOne({
      where: { id: managerId },
    });

    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    return manager;
  }

  async getManagersByCompany(companyId: string): Promise<SupportManager[]> {
    return this.managerRepo.find({
      where: { companyId, active: true },
      order: { createdAt: 'DESC' },
    });
  }

  async hasActiveManagers(companyId: string): Promise<boolean> {
    const count = await this.managerRepo.count({
      where: { companyId, active: true },
    });
    return count > 0;
  }

  async deactivateManager(managerId: string): Promise<void> {
    await this.managerRepo.update(managerId, { active: false });
  }

// ===============================
// 💬 Отправка сообщения менеджера
// ===============================
async sendManagerMessage(chatSessionId: string, content: string, managerId?: string) {
  if (!content?.trim()) {
    throw new BadRequestException('Message content cannot be empty');
  }

  const session = await this.getChatSession(chatSessionId);
  if (!session) throw new NotFoundException('Chat session not found');

  const messageEntity = this.chatMessageRepo.create({
    chatSessionId,
    senderType: 'manager',
    senderId: managerId,
    content,
  });
  const saved = await this.chatMessageRepo.save(messageEntity);

  const payload = {
    id: saved.id,
    chatSessionId,
    senderType: 'manager',
    content,
    createdAt: saved.createdAt || new Date().toISOString(),
    senderId: managerId,
  };

  // 1️⃣ Отправляем WS событие в комнату сессии с проверкой готовности Gateway
  if (!this.gateway?.server) {
    console.warn('⚠️ Gateway not ready, delaying emit');
    setTimeout(() => this.sendManagerMessage(chatSessionId, content, managerId), 500);
  } else {
    try {
      this.gateway.emitMessageToSession(chatSessionId, payload);
    } catch (err) {
      console.error('WS emit error:', err);
    }
  }

  // 2️⃣ Если есть assistantId — уведомляем комнату ассистента
  if (session.assistantId) {
    try {
      this.gateway.emitToAssistantRoom(session.assistantId, {
        ...payload,
        assistantId: session.assistantId,
      });
    } catch (err) {
      console.error('WS emit to assistant room error:', err);
    }
  }

  // 3️⃣ Если это Telegram чат — отсылаем туда
  if (session.integrationType === 'telegram' && session.externalChatId) {
    const telegramService = this.moduleRef.get<TelegramWebhookService>(
      TelegramWebhookService,
      { strict: false },
    );

    if (telegramService?.sendTelegramMessageForSession) {
      try {
        await telegramService.sendTelegramMessageForSession(session, content);
      } catch (err) {
        console.error('Failed to send message to Telegram:', err);
      }
    } else {
      console.warn('TelegramWebhookService not available or missing helper method');
    }
  }

  return saved;
}

  async findByConversationId(conversationId: string): Promise<ChatSession | null> {
    return this.chatSessionRepo.findOne({
      where: { conversationId },
      relations: ['messages'],
    });
  }

  async handleIncomingMessage(chatSessionId: string, content: string, senderType: 'user' | 'ai') {
    const session = await this.chatSessionRepo.findOne({
      where: { id: chatSessionId },
      relations: ['messages'],
    });
    if (!session) throw new NotFoundException('Chat session not found');

    const message = this.chatMessageRepo.create({
      chatSession: session,
      content,
      senderType,
    });

    await this.chatMessageRepo.save(message);

    // 🔹 Здесь происходит отправка в WebSocket
    if (!this.gateway?.server) {
      console.warn('⚠️ Gateway not ready, delaying emit');
      setTimeout(() => this.handleIncomingMessage(chatSessionId, content, senderType), 500);
      return;
    }

    this.gateway.emitMessageToSession(session.id, {
      id: message.id,
      senderType,
      content,
      createdAt: message.createdAt,
    });
  }


  async emitMessageToSessionSafe(sessionId: string, payload: any): Promise<void> {
    try {
      this.gateway.emitMessageToSession(sessionId, payload);
      console.log(`[SupportService] Emitted to session ${sessionId}: ${payload.content}`);
      // НЕ добавляйте отправку в TG здесь! Она только для 'manager' в sendManagerMessage
    } catch (err) {
      console.error('[SupportService] Emit error:', err);
    }
  }

  async returnToAi(sessionId: string, message?: string): Promise<ChatSession> {
    const session = await this.getChatSession(sessionId);

    if (session.status === 'resolved') {
      throw new Error('Cannot return resolved chat to AI');
    }

    // Отправляем финальное сообщение от менеджера (опционально)
    if (message?.trim()) {
      await this.saveMessage(
        sessionId,
        'manager',
        message,
        undefined,
        { returnedToAi: true }
      );
    }

    // Меняем статус обратно на AI (используем undefined вместо null для TypeORM)
    session.status = 'ai';
    session.assignedManagerId = undefined;
    session.escalatedAt = undefined;
    session.escalationReason = undefined;
    session.escalationUrgency = undefined;
    
    await this.chatSessionRepo.save(session);

    console.log('🔄 Chat returned to AI:', { sessionId });

    // Отправляем уведомление клиенту
    await this.saveMessage(
      sessionId,
      'ai',
      'Спасибо за ожидание! Я снова готов помочь вам. Чем могу быть полезен? 😊',
      undefined,
      { systemMessage: true }
    );

    return session;
  }



}