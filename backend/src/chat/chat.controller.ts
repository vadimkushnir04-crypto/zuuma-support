// backend/src/chat/chat.controller.ts
import { 
  Controller, 
  Post,
  Get, 
  Body, 
  Headers,
  Param,
  UnauthorizedException,
  BadRequestException,
  UseGuards,
  Request
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { AssistantsService } from '../assistants/assistants.service';
import { AuthService } from '../auth/auth.service';
import { TokensService } from '../tokens/tokens.service';
import { ChatService } from './chat.service';
import { RateLimitGuard } from '../common/rate-limit.guard';
import { RateLimiterService } from '../common/rate-limiter.service';
import { SupportService } from '../support/support.service';

interface ChatRequest {
  message: string;
  conversationId?: string;
  apiKey?: string;
  assistantId?: string;
  telegramUserId?: string;
  telegramChatId?: string;
  userId?: string;
  sessionId?: string;
  userIdentifier?: string; // 🔥 Добавлено
}

@Controller('chat')
export class ChatController {
  private conversations = new Map<string, Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>>();

  constructor(
    private readonly knowledgeService: KnowledgeService,
    private readonly assistantsService: AssistantsService,
    private readonly authService: AuthService,
    private readonly tokensService: TokensService,
    private readonly rateLimiter: RateLimiterService,
    private readonly supportService: SupportService,
  ) {}

  @Post('ask')
  @UseGuards(RateLimitGuard)
  async chat(
    @Headers('authorization') authHeader: string,
    @Body() body: ChatRequest,
    @Request() req?: any
  ) {
    console.log('📥 Incoming chat request:', {
      hasAuth: !!authHeader,
      hasApiKey: !!body.apiKey,
      hasAssistantId: !!body.assistantId,
      hasTelegramUserId: !!body.telegramUserId,
      message: body.message.substring(0, 50) + '...'
    });

    let assistant;
    let userId: string | null = null;
    let conversationKey: string;
    let userIdentifier: string;

    // Вариант A: Фронтенд с JWT токеном + assistantId
    if (authHeader?.startsWith('Bearer ') && body.assistantId) {
      const token = authHeader.substring(7);
      
      try {
        const jwtPayload = this.authService.verifyToken(token);
        userId = jwtPayload.id;
        userIdentifier = body.userIdentifier || userId;

        assistant = await this.assistantsService.getAssistant(body.assistantId);
        
        if (!assistant) {
          throw new BadRequestException('Ассистент не найден');
        }

        if (assistant.userId !== userId) {
          throw new UnauthorizedException('У вас нет доступа к этому ассистенту');
        }

        conversationKey = `user:${userId}:assistant:${body.assistantId}:${body.conversationId || 'default'}`;
        
        console.log('✅ Frontend request authenticated:', { 
          userId, 
          assistantId: body.assistantId,
          collectionName: assistant.collectionName 
        });
      } catch (error) {
        console.error('❌ Auth error:', error);
        throw new UnauthorizedException('Недействительный токен');
      }
    }
    else if (body.apiKey) {
      assistant = await this.assistantsService.getAssistantByApiKey(body.apiKey);
      userId = assistant?.userId;
      
      if (!assistant) {
        throw new UnauthorizedException('Недействительный API ключ');
      }

      if (!assistant.isActive) {
        throw new BadRequestException('Ассистент отключен');
      }

      userIdentifier = body.sessionId || body.userId || req?.ip || 'anonymous';
      conversationKey = `widget:${assistant.id}:${body.conversationId || userIdentifier}`;
      
      console.log('✅ Widget/API request authenticated:', { 
        assistantId: assistant.id,
        userIdentifier,
        collectionName: assistant.collectionName 
      });
    }
    else if (body.telegramUserId && body.apiKey) {
      assistant = await this.assistantsService.getAssistantByApiKey(body.apiKey);
      userId = assistant?.userId;
      
      if (!assistant) {
        throw new UnauthorizedException('Недействительный API ключ бота');
      }

      userIdentifier = `telegram:${body.telegramUserId}`;
      conversationKey = `telegram:${body.telegramUserId}:${assistant.id}`;
      
      console.log('✅ Telegram request authenticated:', { 
        telegramUserId: body.telegramUserId, 
        assistantId: assistant.id,
        collectionName: assistant.collectionName 
      });
    }
    else {
      throw new BadRequestException(
        'Требуется либо JWT токен + assistantId, либо apiKey'
      );
    }

    // 🔥 Определяем requestUserIdentifier ПОСЛЕ всех if/else блоков
    const requestUserIdentifier = body.userIdentifier || userIdentifier;
    console.log('🔑 Using userIdentifier:', requestUserIdentifier);

    const rateLimitCheck = await this.rateLimiter.checkRateLimit(
      userIdentifier,
      assistant.id,
      body.message
    );

    if (!rateLimitCheck.allowed) {
      console.warn(`🚫 Rate limit exceeded for ${userIdentifier}`);
      throw new BadRequestException({
        success: false,
        error: rateLimitCheck.reason,
        retryAfter: rateLimitCheck.retryAfter,
        type: 'RATE_LIMIT_EXCEEDED'
      });
    }

    console.log(`🔍 Using collection: ${assistant.collectionName}`);
    
    const chatSession = await this.supportService.getOrCreateChatSession(
      assistant.id,
      userIdentifier,
      body.apiKey ? 'widget' : (body.telegramUserId ? 'telegram' : 'frontend'),
      body.telegramChatId || body.conversationId,
    );

    console.log(`💾 Chat session: ${chatSession.id}, status: ${chatSession.status}`);

    // 🔥 Сохраняем сообщение пользователя всегда (даже в эскалированных чатах)
    const userMessage = await this.supportService.saveMessage(
      chatSession.id,
      'user',
      body.message,
      userId || undefined,
      undefined, // metadata
      requestUserIdentifier, // 🔥 Передаем userIdentifier
    );

    // 🔥 Если чат эскалирован - просто сообщаем об этом, не генерируем ответ AI
    if (chatSession.status === 'pending_human' || chatSession.status === 'human_active') {
      return {
        success: true,
        answer: '⏳ Ваш запрос передан специалисту поддержки. Пожалуйста, ожидайте ответа.',
        escalated: true,
        chatSessionId: chatSession.id,
        status: chatSession.status,
        userMessageId: userMessage.id,
      };
    }

    const history = this.conversations.get(conversationKey) || [];
    console.log(`📚 Conversation history: ${history.length} messages`);

    try {
      console.log(`🎯 Calling generateAnswer with collection: ${assistant.collectionName}`);
      
      const result = await this.knowledgeService.generateAnswer(
        body.message,
        assistant.collectionName,
        assistant.systemPrompt?.trim() || undefined,
        history,
        0,
        assistant.id
      );

      if (result.functionCalled === 'escalate_to_human' && result.functionArgs) {
        const { reason, urgency } = result.functionArgs;
        
        await this.supportService.escalateToHuman(
          chatSession.id,
          reason || 'User requested human support',
          urgency || 'medium',
        );

        console.log('🚨 Chat escalated:', { 
          chatSessionId: chatSession.id, 
          reason, 
          urgency 
        });

        const aiMessage = await this.supportService.saveMessage(
          chatSession.id,
          'ai',
          result.answer,
          undefined,
          {
            escalated: true,
            reason,
            urgency,
          },
          requestUserIdentifier,
          result.files
        );

        return {
          success: true,
          answer: result.answer,
          escalated: true,
          chatSessionId: chatSession.id,
          conversationId: body.conversationId || conversationKey,
          userMessageId: userMessage.id,
          aiMessageId: aiMessage.id,
        };
      }

      // Проверка на ошибку токенов (fallback)
      if (result.error && result.error.includes('Недостаточно токенов')) {
        throw new BadRequestException({
          success: false,
          error: 'Недостаточно токенов. Пожалуйста, пополните баланс.',
          type: 'INSUFFICIENT_TOKENS'
        });
      }

      // Токены уже списаны - только логируем
      if (result.tokensCharged && result.tokensCharged > 0) {
        console.log(`💰 Tokens already charged: ${result.tokensCharged}`);
      } else if (result.fromCannedResponses) {
        console.log(`⚡ Canned response: ${result.tokensCharged || 5} tokens`);
      } else if (result.fromCache) {
        console.log(`💾 Response from cache: 0 tokens`);
      }

      await this.rateLimiter.recordMessage(
        userIdentifier,
        assistant.id,
        body.message
      );

      const aiMessage = await this.supportService.saveMessage(
        chatSession.id,
        'ai',
        result.answer,
        undefined,
        {
          sources: result.sources,
          hasContext: result.hasContext,
          functionCalled: result.functionCalled,
        },
        requestUserIdentifier,
        result.files
      );

      const updatedHistory = [
        ...history,
        { role: 'user' as const, content: body.message, timestamp: new Date() },
        { role: 'assistant' as const, content: result.answer, timestamp: new Date() }
      ];

      const maxHistory = assistant.settings?.maxHistoryMessages || 10;
      if (updatedHistory.length > maxHistory * 2) {
        updatedHistory.splice(0, updatedHistory.length - maxHistory * 2);
      }

      this.conversations.set(conversationKey, updatedHistory);

      await this.assistantsService.incrementAssistantStats(assistant.id);

      console.log(`✅ Answer generated successfully`);
      
      return {
        success: true,
        answer: result.answer,
        conversationId: body.conversationId || conversationKey,
        chatSessionId: chatSession.id,
        sources: result.sources || 0,
        hasContext: result.hasContext || false,
        functionCalled: result.functionCalled,
        userMessageId: userMessage.id,
        aiMessageId: aiMessage.id,
      };

    } catch (error) {
      console.error('❌ Error generating answer:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      if (error.message && error.message.includes('Недостаточно токенов')) {
        throw new BadRequestException({
          success: false,
          error: 'Недостаточно токенов. Пожалуйста, пополните баланс.',
          type: 'INSUFFICIENT_TOKENS'
        });
      }
      
      return {
        success: false,
        answer: 'Извините, произошла ошибка при обработке вашего запроса. Попробуйте ещё раз.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        conversationId: body.conversationId || conversationKey,
      };
    }
  }

  @Get('debug/:apiKey')
  async debugAssistant(@Param('apiKey') apiKey: string) {
    console.log('🔍 Debug request for apiKey:', apiKey);
    
    const assistant = await this.assistantsService.getAssistantByApiKey(apiKey);
    
    if (!assistant) {
      return {
        error: 'Assistant not found',
        apiKey
      };
    }
    
    const debugInfo = await this.assistantsService.debugAssistantData(assistant.id);
    
    return {
      assistant: {
        id: assistant.id,
        name: assistant.name,
        apiKey: assistant.apiKey,
        collectionName: assistant.collectionName,
        trained: assistant.trained,
        isActive: assistant.isActive,
        systemPrompt: assistant.systemPrompt?.substring(0, 100) + '...'
      },
      collection: debugInfo,
      testQuestion: 'Привет! Расскажи о ваших продуктах',
      note: 'Use POST /chat/test to test this assistant'
    };
  }

  @Post('test')
  async testChat(@Body() body: { apiKey: string; message: string }) {
    console.log('🧪 Test chat request:', body);
    
    try {
      const assistant = await this.assistantsService.getAssistantByApiKey(body.apiKey);
      
      if (!assistant) {
        return { error: 'Assistant not found' };
      }
      
      const result = await this.knowledgeService.generateAnswer(
        body.message,
        assistant.collectionName,
        assistant.systemPrompt || 'Вы - AI ассистент.',
        [],
        0,
        assistant.id
      );
      
      return {
        success: true,
        assistant: assistant.name,
        collection: assistant.collectionName,
        answer: result.answer,
        sources: result.sources,
        hasContext: result.hasContext
      };
    } catch (error) {
      console.error('❌ Test error:', error);
      return {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }
  }
}