// backend/src/common/llm.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  text: string;
}

export interface LLMResponse {
  content: string;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  model?: string;
}

export type LLMProvider = 'yandexgpt';

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);
  
  // === YandexGPT ===
  private yandexApiKey: string;
  private yandexFolderId: string;
  private yandexUrl = 'https://llm.api.cloud.yandex.net/foundationModels/v1';
  

  constructor(private configService: ConfigService) {
    // YandexGPT (основной)
    this.yandexApiKey = this.configService.get<string>('YANDEX_API_KEY') || '';
    this.yandexFolderId = this.configService.get<string>('YANDEX_FOLDER_ID') || '';
    
    this.logger.log('LLM Service initialized');
    this.logger.log(`YandexGPT: ${this.yandexApiKey ? '✅' : '❌'}`);

  }

  /**
   * Универсальный метод для чата с автовыбором провайдера
   */
  async chat(
    messages: ChatMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
      provider?: LLMProvider;
      model?: string;
    } = {}
  ): Promise<LLMResponse> {
    const provider = options.provider || this.getDefaultProvider();
    
    this.logger.debug(`Using provider: ${provider}`);
    
    try {
      switch (provider) {
        case 'yandexgpt':
          return await this.chatYandexGPT(messages, options);
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
    } catch (error) {
      this.logger.error(`Chat error with ${provider}:`, error);
      
      throw error;
    }
  }

  /**
   * YandexGPT Chat
   */
  private async chatYandexGPT(
    messages: ChatMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    } = {}
  ): Promise<LLMResponse> {
    const model = options.model || 'yandexgpt-lite'; // или yandexgpt
    const modelUri = `gpt://${this.yandexFolderId}/${model}/latest`;
    
    const body = {
      modelUri,
      completionOptions: {
        stream: false,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 2000,
      },
      messages: messages.map(m => ({
        role: m.role,
        text: m.text,
      })),
    };

    const response = await fetch(`${this.yandexUrl}/completion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${this.yandexApiKey}`,
        'x-folder-id': this.yandexFolderId,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`YandexGPT error: ${error}`);
    }

    const data = await response.json();
    
    const result = data.result;
    const alternative = result?.alternatives?.[0];
    const usage = result?.usage;

    return {
      content: alternative?.message?.text || '',
      tokensUsed: {
        prompt: usage?.inputTextTokens || 0,
        completion: usage?.completionTokens || 0,
        total: usage?.totalTokens || 0,
      },
      model: modelUri,
    };
  }

  /**
   * Асинхронная генерация YandexGPT (дешевле в 2 раза!)
   */
  async chatYandexGPTAsync(
    messages: ChatMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    } = {}
  ): Promise<{ operationId: string }> {
    const model = options.model || 'yandexgpt-lite';
    const modelUri = `gpt://${this.yandexFolderId}/${model}/latest`;
    
    const body = {
      modelUri,
      completionOptions: {
        stream: false,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 2000,
      },
      messages: messages.map(m => ({
        role: m.role,
        text: m.text,
      })),
    };

    const response = await fetch(`${this.yandexUrl}/completionAsync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${this.yandexApiKey}`,
        'x-folder-id': this.yandexFolderId,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`YandexGPT Async error: ${error}`);
    }

    const data = await response.json();
    return { operationId: data.id };
  }

  /**
   * Получить результат асинхронной операции
   */
  async getAsyncResult(operationId: string): Promise<LLMResponse | null> {
    const response = await fetch(
      `https://operation.api.cloud.yandex.net/operations/${operationId}`,
      {
        headers: {
          'Authorization': `Api-Key ${this.yandexApiKey}`,
        },
      }
    );

    const data = await response.json();
    
    if (!data.done) {
      return null; // Еще не готово
    }

    if (data.error) {
      throw new Error(`Async operation failed: ${JSON.stringify(data.error)}`);
    }

    const result = data.response;
    const alternative = result?.alternatives?.[0];
    const usage = result?.usage;

    return {
      content: alternative?.message?.text || '',
      tokensUsed: {
        prompt: usage?.inputTextTokens || 0,
        completion: usage?.completionTokens || 0,
        total: usage?.totalTokens || 0,
      },
    };
  }


  /**
   * Определить провайдер по умолчанию
   */
  private getDefaultProvider(): LLMProvider {
    if (this.yandexApiKey) return 'yandexgpt';
    throw new Error('No LLM provider configured');
  }

  /**
   * Получить эмбеддинги (только YandexGPT)
   */
  async getEmbedding(
    text: string,
    provider: 'yandexgpt' = 'yandexgpt'
  ): Promise<number[]> {
    if (provider !== 'yandexgpt') {
      console.warn(`⚠️ Провайдер ${provider} не поддерживается, используем YandexGPT`);
    }

    return await this.getYandexEmbedding(text);
  }


  /**
   * YandexGPT Embeddings
   */
  private async getYandexEmbedding(text: string): Promise<number[]> {
    const modelUri = `emb://${this.yandexFolderId}/text-search-query/latest`;

    const response = await fetch(
      `${this.yandexUrl}/textEmbedding`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Api-Key ${this.yandexApiKey}`,
          'x-folder-id': this.yandexFolderId,
        },
        body: JSON.stringify({
          modelUri,
          text,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`YandexGPT Embedding error: ${error}`);
    }

    const data = await response.json();
    return data.embedding;
  }



  /**
   * Токенизация (YandexGPT)
   * ВАЖНО: используй это для точного подсчета токенов!
   */
  async tokenize(
    text: string,
    model: 'yandexgpt-lite' | 'yandexgpt' = 'yandexgpt-lite'
  ): Promise<{ tokens: string[]; count: number }> {
    const modelUri = `gpt://${this.yandexFolderId}/${model}/latest`;

    const response = await fetch(
      `${this.yandexUrl}/tokenize`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Api-Key ${this.yandexApiKey}`,
          'x-folder-id': this.yandexFolderId,
        },
        body: JSON.stringify({
          modelUri,
          text,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Tokenization error: ${error}`);
    }

    const data = await response.json();
    
    return {
      tokens: data.tokens || [],
      count: data.tokens?.length || 0,
    };
  }

  /**
   * Проверка здоровья провайдеров
   */
  async healthCheck(): Promise<{
    yandexgpt: boolean;
  }> {
    return {
      yandexgpt: !!this.yandexApiKey,
    };
  }
}