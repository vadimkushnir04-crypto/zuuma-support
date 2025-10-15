// backend/src/knowledge/answer-cache.service.ts
import { Injectable } from '@nestjs/common';
import { CacheService } from '../common/cache.service';

// Импортируем тип из knowledge.types.ts
export interface GenerateAnswerResult {
  answer: string;
  hasContext: boolean;
  sources: number;
  searchResults?: any[];
  functionCalled?: string;
  functionResult?: any;
  fromCache?: boolean;
  isToxic?: boolean;
  toxicCount?: number;
  isOutOfScope?: boolean;
  error?: string;
}

@Injectable()
export class AnswerCacheService {
  constructor(private readonly cache: CacheService) {}

  /**
   * Получить закешированный ответ
   */
  getCachedAnswer(
    query: string,
    assistantId: string,
  ): GenerateAnswerResult | null {
    const normalizedQuery = this.normalizeQuery(query);
    const cacheKey = this.cache.generateKey('answer', assistantId, normalizedQuery);
    
    return this.cache.get<GenerateAnswerResult>(cacheKey);
  }

  /**
   * Сохранить ответ в кеш
   */
  cacheAnswer(
    query: string,
    assistantId: string,
    answer: GenerateAnswerResult,
    ttlMs: number = 300000 // 5 минут по умолчанию
  ): void {
    const normalizedQuery = this.normalizeQuery(query);
    const cacheKey = this.cache.generateKey('answer', assistantId, normalizedQuery);
    
    // Кешируем только успешные ответы с контекстом
    if (answer.answer && answer.hasContext) {
      this.cache.set(cacheKey, answer, ttlMs);
    }
  }

  /**
   * Очистить кеш ответов для конкретного ассистента
   */
  clearAssistantCache(assistantId: string): number {
    return this.cache.clearByPrefix(`answer:${assistantId}`);
  }

  /**
   * Нормализация запроса для лучшего кеширования
   */
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[!?.,;:]+$/, '')
      .substring(0, 500);
  }
}