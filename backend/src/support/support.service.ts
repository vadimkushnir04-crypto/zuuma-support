// backend/src/support/support.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
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

type SenderType = 'user' | 'ai' | 'manager';

@Injectable()
export class SupportService {
  private readonly logger = new Logger('SupportService');
  private readonly MAX_WS_RETRY = 3;

  constructor(
    @InjectRepository(ChatSession)
    public chatSessionRepo: Repository<ChatSession>,

    @InjectRepository(ChatMessage)
    private chatMessageRepo: Repository<ChatMessage>,

    @InjectRepository(SupportManager)
    private managerRepo: Repository<SupportManager>,

    @InjectRepository(TelegramBot)
    private telegramBotRepo: Repository<TelegramBot>,

    @Inject(forwardRef(() => TelegramWebhookService))
    private readonly telegramWebhookService: TelegramWebhookService,
    private readonly encryptionService: EncryptionService,

    private moduleRef: ModuleRef, // <- для динамического получения TelegramWebhookService
    private readonly gateway: SupportGateway, // <- WS gateway
  ) {}

  // ============================================
  // CHAT SESSIONS
  // ============================================

  async getOrCreateChatSession(
    assistantId: string,
    userIdentifier: string,
    integrationType: string,
    externalChatId?: string,
  ): Promise<ChatSession> {
    const session = await this.chatSessionRepo.findOne({
      where: {
        assistantId,
        userIdentifier,
        status: In(['ai', 'pending_human', 'human_active']),
      },
      order: { createdAt: 'DESC' },
    });

    if (session) {
      return session;
    }

    const newSession = this.chatSessionRepo.create({
      assistantId,
      userIdentifier,
      integrationType,
      externalChatId,
      status: 'ai',
    });

    await this.chatSessionRepo.save(newSession);
    this.logger.log(`✅ Created new chat session: ${newSession.id}`);
    return newSession;
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
  // ESCALATION / MANAGERS / RESOLVE
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
    this.logger.log(`🚨 Chat escalated: ${sessionId} reason=${reason} urgency=${urgency}`);

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
    this.logger.log(`👤 Manager ${managerId} assigned to chat ${sessionId}`);

    return session;
  }

  async resolveChat(sessionId: string, resolvedBy: string): Promise<ChatSession> {
    const session = await this.getChatSession(sessionId);

    session.status = 'resolved';
    session.resolvedAt = new Date();
    session.resolvedBy = resolvedBy;

    await this.chatSessionRepo.save(session);
    this.logger.log(`✅ Chat resolved: ${sessionId} by ${resolvedBy}`);

    return session;
  }

  // ============================================
  // MESSAGES (centralized)
  // ============================================

  /**
   * Central message saver + emitter.
   * - saves message to DB
   * - emits via WS to session room and assistant room if needed
   * - sends to Telegram for ai/manager (not for user)
   *
   * Attempts limited retries for WS/TG if gateway not ready.
   */
  async saveMessage(
    chatSessionId: string,
    senderType: SenderType,
    content: string,
    senderId?: string,
    metadata?: any,
    userIdentifier?: string,
    files?: any[],
    retryAttempt = 0,
  ): Promise<ChatMessage> {
    if (!content || !content.toString().trim()) {
      throw new BadRequestException('Message content cannot be empty');
    }

    // Safety: normalize content
    let cleanContent = content.toString().trim();

    // Safer sources trimming: only if metadata.sources is a number and content ends with a specific pattern
    if (typeof metadata?.sources === 'number') {
      const sourcesPattern = `\n\nИсточники: ${metadata.sources}`;
      if (cleanContent.endsWith(sourcesPattern)) {
        cleanContent = cleanContent.slice(0, -sourcesPattern.length).trim();
        this.logger.warn(`Trimmed trailing sources pattern from message for session ${chatSessionId}`);
      }
    }

    // Verify session exists
    const session = await this.chatSessionRepo.findOne({ where: { id: chatSessionId } });
    if (!session) {
      throw new NotFoundException(`ChatSession ${chatSessionId} not found`);
    }

    const messageMetadata = {
      ...metadata,
      sources: typeof metadata?.sources === 'number' ? metadata.sources : undefined,
      files: Array.isArray(files) ? files : [],
    };

    const message = this.chatMessageRepo.create({
      chatSessionId,
      senderType,
      senderId,
      content: cleanContent,
      metadata: messageMetadata,
    });

    const saved = await this.chatMessageRepo.save(message);

    this.logger.log(`💬 Saved message ${saved.id} (${senderType}) in session ${chatSessionId}`);

    // Prepare payload for WS emit (normalize createdAt to ISO string)
    const payload = {
      id: saved.id,
      chatSessionId,
      senderType,
      content: cleanContent,
      createdAt: (saved.createdAt instanceof Date) ? saved.createdAt.toISOString() : String(saved.createdAt),
      senderId,
      metadata: messageMetadata,
      files: messageMetadata.files || [],
      userIdentifier: userIdentifier ?? session.userIdentifier ?? undefined,
      assistantId: session.assistantId,
    };

    // Emit via WS (with limited retries)
    try {
      await this.emitToSessionWithRetry(chatSessionId, payload, retryAttempt);
    } catch (err) {
      this.logger.error(`Failed to emit WS message for ${chatSessionId}: ${err?.message || err}`);
    }

    // Send to Telegram only for ai or manager (user messages shouldn't be proxied automatically)
    if ((senderType === 'ai' || senderType === 'manager') && session.integrationType === 'telegram' && session.externalChatId) {
      try {
        await this.sendToTelegram(session, saved, messageMetadata, files);
      } catch (tgErr) {
        this.logger.error(`Failed to send message ${saved.id} to Telegram: ${tgErr?.message || tgErr}`);
      }
    }

    return saved;
  }

  /**
   * Emit helper with simple retry logic (no infinite recursion).
   */
  private async emitToSessionWithRetry(sessionId: string, payload: any, attempt = 0): Promise<void> {
    if (this.gateway?.server) {
      try {
        this.gateway.emitMessageToSession(sessionId, payload);
        // gateway.emitMessageToSession internally logs assistant-room emission
        return;
      } catch (err) {
        this.logger.warn(`WS emit error on attempt ${attempt} for ${sessionId}: ${err?.message || err}`);
        // fallthrough to retry below
      }
    } else {
      this.logger.warn(`Gateway not ready for session ${sessionId} (attempt ${attempt})`);
    }

    if (attempt < this.MAX_WS_RETRY) {
      const delayMs = 250 * (attempt + 1);
      await new Promise((res) => setTimeout(res, delayMs));
      return this.emitToSessionWithRetry(sessionId, payload, attempt + 1);
    } else {
      throw new Error(`Gateway not available after ${this.MAX_WS_RETRY} attempts`);
    }
  }

  /**
   * Send saved message to Telegram using TelegramWebhookService (if configured).
   * We dynamically fetch the service via moduleRef to avoid circular deps issues.
   */
  private async sendToTelegram(session: ChatSession, savedMessage: ChatMessage, metadata: any, files?: any[]) {
    // get telegram service (best-effort)
    const telegramService = this.moduleRef.get<TelegramWebhookService>(
      TelegramWebhookService,
      { strict: false },
    ) as TelegramWebhookService | undefined;

    if (!telegramService) {
      this.logger.warn('TelegramWebhookService not available (moduleRef returned undefined)');
      return;
    }

    // get bot info (if any)
    const bot = await this.telegramBotRepo.findOne({
      where: { assistantId: session.assistantId },
    });

    if (!bot) {
      this.logger.warn(`No Telegram bot configured for assistant ${session.assistantId}`);
      return;
    }

    const botToken = this.encryptionService.decrypt(bot.botToken);
    const chatId = Number(session.externalChatId);

    // Сначала отправляем файлы, если они есть (каждый отдельно, с caption = fileName или без)
    if (files && files.length > 0) {
      for (const file of files) {
        const fileUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}${file.fileUrl}`;
        try {
          if (file.fileType === 'image') {
            // Можно добавить caption из savedMessage.content, если нужно интегрировать текст,
            // но для простоты оставляем fileName или пустой
            await telegramService.sendTelegramPhoto(botToken, chatId, fileUrl, file.fileName);
          } else {
            await telegramService.sendTelegramDocument(botToken, chatId, fileUrl, file.fileName);
          }
          this.logger.log(`✅ Sent file ${file.fileName} to Telegram chat ${chatId}`);
        } catch (err) {
          this.logger.error(`Failed to send file ${file.fileName} to Telegram: ${err?.message || err}`);
        }
      }
    }

    // Всегда отправляем текст, если он не пустой (независимо от файлов)
    if (savedMessage.content && savedMessage.content.trim()) {
      try {
        await telegramService.sendTelegramMessageForSession(session, savedMessage.content);
        this.logger.log(`✅ Sent message ${savedMessage.id} to Telegram chat ${chatId}`);
      } catch (err) {
        this.logger.error(`Failed to send text message to Telegram: ${err?.message || err}`);
      }
    }
  }

  // ============================================
  // Get chat messages (DB)
  // ============================================

  async getChatMessages(sessionId: string, limit = 100): Promise<ChatMessage[]> {
    return this.chatMessageRepo.find({
      where: { chatSessionId: sessionId },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  // ============================================
  // MANAGERS CRUD
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
    this.logger.log(`✅ Manager created: ${manager.id} (${manager.email})`);
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
    this.logger.log(`Manager ${managerId} deactivated`);
  }

  // ============================================
  // sendManagerMessage (uses saveMessage now)
  // ============================================

  async sendManagerMessage(chatSessionId: string, content: string, managerId?: string) {
    if (!content?.trim()) {
      throw new BadRequestException('Message content cannot be empty');
    }

    // Ensure session exists
    const session = await this.getChatSession(chatSessionId);

    // Use unified saveMessage for persistence + emit + telegram
    const saved = await this.saveMessage(
      chatSessionId,
      'manager',
      content,
      managerId,
      undefined, // metadata
      undefined, // userIdentifier
      undefined, // files
      0
    );

    return saved;
  }

  // ============================================
  // findByConversationId
  // ============================================

  async findByConversationId(conversationId: string): Promise<ChatSession | null> {
    if (!conversationId) return null;
    return this.chatSessionRepo.findOne({
      where: { conversationId },
      relations: [], // avoid loading messages here by default (performance)
    });
  }

  // ============================================
  // handleIncomingMessage (used by chat service)
  // ============================================
  async handleIncomingMessage(chatSessionId: string, content: string, senderType: 'user' | 'ai') {
    // Validate
    const session = await this.chatSessionRepo.findOne({
      where: { id: chatSessionId },
    });
    if (!session) throw new NotFoundException('Chat session not found');

    // Persist + emit + Telegram inside saveMessage
    await this.saveMessage(chatSessionId, senderType as SenderType, content, undefined, undefined, undefined, undefined);
  }

  // ============================================
  // Safe WS emit helper
  // ============================================
  async emitMessageToSessionSafe(sessionId: string, payload: any): Promise<void> {
    try {
      await this.emitToSessionWithRetry(sessionId, payload, 0);
      this.logger.log(`[SupportService] Emitted to session ${sessionId}: ${String(payload?.content)?.slice(0, 80)}`);
    } catch (err) {
      this.logger.error(`[SupportService] Emit error for session ${sessionId}: ${err?.message || err}`);
    }
  }

  // ============================================
  // returnToAi
  // ============================================
  async returnToAi(sessionId: string, message?: string): Promise<ChatSession> {
    const session = await this.getChatSession(sessionId);

    if (session.status === 'resolved') {
      throw new Error('Cannot return resolved chat to AI');
    }

    if (message?.trim()) {
      await this.saveMessage(
        sessionId,
        'manager',
        message,
        undefined,
        { returnedToAi: true },
        undefined,
        undefined
      );
    }

    session.status = 'ai';
    session.assignedManagerId = undefined;
    session.escalatedAt = undefined;
    session.escalationReason = undefined;
    session.escalationUrgency = undefined;

    await this.chatSessionRepo.save(session);
    this.logger.log(`🔄 Chat ${sessionId} returned to AI`);

    // Send a system/ai message to notify user
    await this.saveMessage(
      sessionId,
      'ai',
      'Спасибо за ожидание! Я снова готов помочь вам. Чем могу быть полезен? 😊',
      undefined,
      { systemMessage: true },
      undefined,
      undefined
    );

    return session;
  }
}