// backend/src/chat/chat.service.ts
import { Injectable, BadRequestException } from "@nestjs/common";
import { LLMService, ChatMessage } from "../common/llm.service";
import { SupportBotConfig } from "../knowledge/support-bot.config";
import { TokensService } from "../tokens/tokens.service";
import { SupportService } from '../support/support.service';
import { NotificationService } from '../support/notification.service';

@Injectable()
export class ChatService {
  constructor(
    private llmService: LLMService,
    private tokensService: TokensService,
    private supportService: SupportService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Загружает последние N сообщений из БД
   */
  private async loadHistory(conversationId: string, limit = 30) {
    const dbMessages = await this.supportService.getChatMessages(conversationId, limit);

    return dbMessages.map(m => ({
      role: m.senderType === 'user' ? 'user' : 'assistant',
      text: m.content
    })) as ChatMessage[];
  }

  /**
   * Основной LLM-запрос
   */
  async ask(
    question: string,
    conversationId: string = "default",
    userId?: string,
    assistantId?: string
  ): Promise<string> {

    console.log('💬 ChatService.ask:', {
      conversationId,
      question: question.substring(0, 100)
    });

    // Найдём сессию
    const session = await this.supportService.findByConversationId(conversationId);

    // Сохраняем сообщение пользователя в БД
    if (session) {
      await this.supportService.handleIncomingMessage(session.id, question, 'user');
    }

    // Загружаем историю из БД
    const history = await this.loadHistory(conversationId, 50);

    console.log('📚 История из БД:', history.length, 'сообщений');

    // Эскалация
    if (
      question.toLowerCase().includes("переведи") ||
      question.toLowerCase().includes("другому сотруднику")
    ) {
      const lastTwo = history.slice(-2).map(m => m.text).join(" ");
      if (lastTwo.includes("переведи")) {
        return "Понимаю ваше желание 📞. Передаю ваш запрос старшему специалисту.";
      }
      return "Я постараюсь помочь вам сам 🤝. Расскажите подробнее о ситуации.";
    }

    // Формируем system + историю + новый вопрос
    const messages: ChatMessage[] = [
      {
        role: "system",
        text: SupportBotConfig.systemPrompts.standard.replace(
          "{contextText}",
          "Контекст отсутствует."
        )
      },
      ...history.slice(-SupportBotConfig.behavior.maxHistoryMessages),
      { role: "user", text: question }
    ];

    // Вызов LLM
    const response = await this.llmService.chat(messages, {
      temperature: 0.7,
      maxTokens: 2000,
      provider: 'yandexgpt',
      model: 'yandexgpt-lite',
    });

    const answer = response.content || "Нет ответа";

    // Сохраняем ответ ассистента в БД
    if (session && assistantId) {
      await this.supportService.emitMessageToSessionSafe(conversationId, {
        id: `msg-${Date.now()}`,
        content: answer,
        senderType: 'assistant',
        chatSessionId: conversationId,
        createdAt: new Date(),
        assistantId: assistantId,
      });

      await this.supportService.handleIncomingMessage(
        session.id,
        answer,
        'ai'   // <<<<<< правильный тип
      );
    }

    // Списание токенов
    if (userId && assistantId && response.tokensUsed) {
      const t = response.tokensUsed.total;

      try {
        await this.tokensService.consumeTokens(
          userId,
          t,
          assistantId,
          {
            conversationId,
            question: question.substring(0, 100),
            model: response.model,
            promptTokens: response.tokensUsed.prompt,
            completionTokens: response.tokensUsed.completion,
            timestamp: new Date()
          }
        );
      } catch (e) {
        console.error("❌ Ошибка списания токенов:", e);
      }
    }

    return answer;
  }

  /**
   * Асинхронная версия LLM
   */
  async askAsync(question: string, conversationId: string = "default") {
    const history = await this.loadHistory(conversationId, 50);

    const messages: ChatMessage[] = [
      {
        role: "system",
        text: SupportBotConfig.systemPrompts.standard.replace(
          "{contextText}",
          "Контекст отсутствует."
        )
      },
      ...history.slice(-10),
      { role: "user", text: question }
    ];

    return await this.llmService.chatYandexGPTAsync(messages, {
      temperature: 0.7,
      maxTokens: 2000,
      model: 'yandexgpt-lite',
    });
  }

  /**
   * Получение результата асинхронной операции
   */
  async getAsyncAnswer(
    operationId: string,
    conversationId: string,
    userId?: string,
    assistantId?: string,
  ): Promise<string | null> {

    const response = await this.llmService.getAsyncResult(operationId);
    if (!response) return null;

    const session = await this.supportService.findByConversationId(conversationId);

    if (session) {
      await this.supportService.handleIncomingMessage(
        session.id,
        response.content,
        'ai'  // правильный тип
      );
    }

    if (userId && assistantId && response.tokensUsed) {
      await this.tokensService.consumeTokens(
        userId,
        response.tokensUsed.total,
        assistantId,
        {
          conversationId,
          operationId,
          timestamp: new Date(),
        }
      );
    }

    return response.content;
  }
}
