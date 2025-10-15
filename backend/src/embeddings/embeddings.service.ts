// backend/src/embeddings/embeddings.service.ts
import { Injectable } from '@nestjs/common';
import { LLMService } from '../common/llm.service';
import { EmbeddingsCacheService } from './embeddings-cache.service';
import { CacheStats } from '../common/cache.service';

@Injectable()
export class EmbeddingsService {
  // Размерность эмбеддингов YandexGPT
  private readonly embeddingDimension = 256;

  constructor(
    private readonly llmService: LLMService,
    private readonly embeddingsCache: EmbeddingsCacheService
  ) {}

  /**
   * Получить эмбеддинг для одного текста (с кэшированием)
   */
  async getEmbedding(text: string): Promise<number[]> {
    // 1. Проверяем кэш
    const cached = this.embeddingsCache.getCachedEmbedding(text, 'yandexgpt');
    if (cached) {
      return cached;
    }

    console.log(`🔄 Fetching embedding for: "${text.substring(0, 50)}..."`);

    try {
      // Используем YandexGPT для эмбеддингов
      const embedding = await this.llmService.getEmbedding(text, 'yandexgpt');
      
      // Кэшируем результат
      this.embeddingsCache.cacheEmbedding(text, embedding, 'yandexgpt');
      
      return embedding;
    } catch (error: any) {
      console.error('❌ Ошибка получения эмбеддинга:', error.message);
      throw new Error(`Не удалось получить эмбеддинг: ${error.message}`);
    }
  }

  /**
   * Получить эмбеддинги для массива текстов (с кэшированием)
   */
  async getEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    console.log(`📊 Getting embeddings for ${texts.length} texts...`);

    // 1. Проверяем кэш
    const { cached, missing } = this.embeddingsCache.getCachedEmbeddings(
      texts, 
      'yandexgpt'
    );

    // 2. Если все есть в кэше
    if (missing.length === 0) {
      console.log(`✅ All ${texts.length} embeddings found in cache!`);
      return texts.map((_, i) => cached.get(i)!);
    }

    // 3. Запрашиваем только недостающие
    console.log(`🔄 Fetching ${missing.length} missing embeddings...`);
    const missingTexts = missing.map((i) => texts[i]);

    try {
      // YandexGPT не поддерживает батч-запросы, обрабатываем последовательно
      const newEmbeddings: number[][] = [];
      
      for (const text of missingTexts) {
        const embedding = await this.llmService.getEmbedding(text, 'yandexgpt');
        newEmbeddings.push(embedding);
        
        // Небольшая задержка чтобы не превысить rate limit
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // 4. Кэшируем новые
      this.embeddingsCache.cacheEmbeddings(
        missingTexts, 
        newEmbeddings, 
        'yandexgpt'
      );

      // 5. Собираем итоговый список
      const result: number[][] = [];
      let missingIndex = 0;

      for (let i = 0; i < texts.length; i++) {
        if (cached.has(i)) {
          result.push(cached.get(i)!);
        } else {
          result.push(newEmbeddings[missingIndex++]);
        }
      }

      console.log(
        `✅ Returned ${result.length} embeddings (${cached.size} from cache, ${newEmbeddings.length} new)`,
      );

      return result;
    } catch (error: any) {
      console.error('❌ Ошибка получения эмбеддингов:', error.message);
      throw error;
    }
  }

  /**
   * Проверка доступности сервиса эмбеддингов
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getEmbedding('test');
      return true;
    } catch (error: any) {
      console.error('Сервис эмбеддингов недоступен:', error.message);
      return false;
    }
  }

  /**
   * Очистить кэш эмбеддингов
   */
  clearCache(): number {
    return this.embeddingsCache.clearModelCache('yandexgpt');
  }

  /**
   * Получить статистику кэша
   */
  getCacheStats(): CacheStats {
    return this.embeddingsCache.getStats();
  }

  /**
   * Получить размерность эмбеддингов
   */
  getEmbeddingDimension(): number {
    return this.embeddingDimension;
  }
}