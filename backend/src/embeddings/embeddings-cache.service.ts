// backend/src/embeddings/embeddings-cache.service.ts
import { Injectable } from '@nestjs/common';
import { CacheService, CacheStats } from '../common/cache.service'; // ✅ Импортируем тип

interface EmbeddingCacheEntry {
  embedding: number[];
  model: string;
  timestamp: number;
}

@Injectable()
export class EmbeddingsCacheService {
  constructor(private readonly cache: CacheService) {}

  /**
   * Получить закешированный эмбеддинг
   */
  getCachedEmbedding(text: string, model: string = 'default'): number[] | null {
    const cacheKey = this.cache.generateKey('embedding', model, text);
    const entry = this.cache.get<EmbeddingCacheEntry>(cacheKey);
    
    if (entry) {
      console.log(`💾 Using cached embedding for: "${text.substring(0, 50)}..."`);
      return entry.embedding;
    }
    
    return null;
  }

  /**
   * Получить несколько закешированных эмбеддингов
   */
  getCachedEmbeddings(texts: string[], model: string = 'default'): {
    cached: Map<number, number[]>;
    missing: number[];
  } {
    const cached = new Map<number, number[]>();
    const missing: number[] = [];

    texts.forEach((text, index) => {
      const embedding = this.getCachedEmbedding(text, model);
      if (embedding) {
        cached.set(index, embedding);
      } else {
        missing.push(index);
      }
    });

    console.log(`📊 Embeddings cache: ${cached.size} hits, ${missing.length} misses`);
    
    return { cached, missing };
  }

  /**
   * Сохранить эмбеддинг в кеш
   */
  cacheEmbedding(
    text: string,
    embedding: number[],
    model: string = 'default',
    ttlMs: number = 86400000 // 24 часа по умолчанию
  ): void {
    const cacheKey = this.cache.generateKey('embedding', model, text);
    
    const entry: EmbeddingCacheEntry = {
      embedding,
      model,
      timestamp: Date.now(),
    };

    this.cache.set(cacheKey, entry, ttlMs);
    console.log(`💾 Cached embedding for: "${text.substring(0, 50)}..."`);
  }

  /**
   * Сохранить несколько эмбеддингов
   */
  cacheEmbeddings(
    texts: string[],
    embeddings: number[][],
    model: string = 'default',
    ttlMs: number = 86400000
  ): void {
    texts.forEach((text, index) => {
      if (embeddings[index]) {
        this.cacheEmbedding(text, embeddings[index], model, ttlMs);
      }
    });
    
    console.log(`💾 Cached ${texts.length} embeddings`);
  }

  /**
   * Очистить кеш эмбеддингов для конкретной модели
   */
  clearModelCache(model: string): number {
    return this.cache.clearByPrefix(`embedding:${model}`);
  }

  /**
   * Получить статистику кеша эмбеддингов
   */
  getStats(): CacheStats { // ✅ Явно указываем тип
    return this.cache.getStats();
  }
}