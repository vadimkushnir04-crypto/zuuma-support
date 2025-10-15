// backend/src/chat/chat.service.ts
import { Injectable, BadRequestException } from "@nestjs/common";
import { LLMService, ChatMessage } from "../common/llm.service";
import { SupportBotConfig } from "../knowledge/support-bot.config";
import { TokensService } from "../tokens/tokens.service";
import { SupportService } from '../support/support.service';

interface ConversationState {
  hasGreeted: boolean;
  escalationCount: number;
  messages: { role: "user" | "assistant"; content: string }[];
}

@Injectable()
export class ChatService {
  private conversations = new Map<string, ConversationState>();

  constructor(
    private llmService: LLMService,
    private tokensService: TokensService,
    private supportService: SupportService,
  ) {}

  private getState(conversationId: string): ConversationState {
    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, {
        hasGreeted: false,
        escalationCount: 0,
        messages: [],
      });
    }
    return this.conversations.get(conversationId)!;
  }

  async ask(
    question: string, 
    conversationId: string = "default",
    userId?: string,
    assistantId?: string
  ): Promise<string> {
    const state = this.getState(conversationId);

    // Проверка на эскалацию
    if (
      question.toLowerCase().includes("переведи") ||
      question.toLowerCase().includes("другому сотруднику")
    ) {
      state.escalationCount++;
      const activeSession = await this.supportService.findByConversationId(conversationId);
      if (activeSession) {
        await this.supportService.handleIncomingMessage(activeSession.id, question, 'user');
      }
      if (state.escalationCount >= 2) {
        return "Понимаю ваше желание 📞. Передаю ваш запрос старшему специалисту, пожалуйста, оставайтесь на линии.";
      } else {
        return "Я постараюсь помочь вам сам 🤝. Расскажите подробнее о ситуации, и я постараюсь её решить.";
      }
    }

    // Приветствие только при первой реплике
    let greeting: string | null = null;
    if (!state.hasGreeted) {
      state.hasGreeted = true;
      greeting = SupportBotConfig.behavior.defaultGreeting;
    }

    // Сохраняем запрос пользователя в историю
    state.messages.push({ role: "user", content: question });

    // Формируем сообщения для LLM
    const historyMessages = state.messages.slice(-10);

    console.log("💬 Новый запрос:", question);
    console.log("📚 История диалога:", state.messages.length, "сообщений");

    // ============================================
    // 🚀 ИСПОЛЬЗУЕМ НОВЫЙ LLM SERVICE
    // ============================================
    
    const messages: ChatMessage[] = [
      {
        role: "system",
        text: SupportBotConfig.systemPrompts.standard.replace(
          "{contextText}",
          "Контекст отсутствует."
        ),
      },
      ...historyMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        text: m.content,
      })),
    ];

    // Используем YandexGPT по умолчанию
    const response = await this.llmService.chat(messages, {
      temperature: 0.7,
      maxTokens: 2000,
      provider: 'yandexgpt', // или 'openrouter', 'gigachat'
      model: 'yandexgpt-lite', // самая дешевая модель
    });

    const answer = response.content || "Нет ответа";

    // Сохраняем ответ ассистента в историю
    state.messages.push({ role: "assistant", content: answer });

    console.log("🤖 Ответ LLM:", answer.substring(0, 100) + "...");
    console.log("📊 Токены использовано:", response.tokensUsed);

    // ============================================
    // 💰 ТОЧНЫЙ ПОДСЧЕТ И СПИСАНИЕ ТОКЕНОВ
    // ============================================
    
    if (userId && assistantId && response.tokensUsed) {
      const tokensUsed = response.tokensUsed.total;
      
      try {
        await this.tokensService.consumeTokens(
          userId,
          tokensUsed,
          assistantId,
          { 
            conversationId,
            question: question.substring(0, 100),
            model: response.model,
            promptTokens: response.tokensUsed.prompt,
            completionTokens: response.tokensUsed.completion,
            timestamp: new Date(),
          }
        );
        console.log(`💰 Списано токенов: ${tokensUsed}`);
      } catch (error) {
        console.error('❌ Ошибка списания токенов:', error.message);
        throw new BadRequestException('Недостаточно токенов. Пополните баланс.');
      }
    }

    // Добавляем приветствие к первому ответу
    return greeting ? `${greeting}\n\n${answer}` : answer;
  }

  /**
   * Асинхронная версия (дешевле в 2 раза!)
   * Используй для не срочных задач
   */
  async askAsync(
    question: string,
    conversationId: string = "default",
  ): Promise<{ operationId: string }> {
    const state = this.getState(conversationId);
    state.messages.push({ role: "user", content: question });

    const messages: ChatMessage[] = [
      {
        role: "system",
        text: SupportBotConfig.systemPrompts.standard.replace(
          "{contextText}",
          "Контекст отсутствует."
        ),
      },
      ...state.messages.slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        text: m.content,
      })),
    ];

    return await this.llmService.chatYandexGPTAsync(messages, {
      temperature: 0.7,
      maxTokens: 2000,
      model: 'yandexgpt-lite',
    });
  }

  /**
   * Получить результат асинхронной операции
   */
  async getAsyncAnswer(
    operationId: string,
    conversationId: string,
    userId?: string,
    assistantId?: string,
  ): Promise<string | null> {
    const response = await this.llmService.getAsyncResult(operationId);
    
    if (!response) {
      return null; // Еще не готово
    }

    const state = this.getState(conversationId);
    state.messages.push({ 
      role: "assistant", 
      content: response.content 
    });

    // Списываем токены
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