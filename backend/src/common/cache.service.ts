// backend/src/common/cache.service.ts
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
  expiresAt: number;
}

export interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryUsage: number;
}

@Injectable()
export class CacheService {
  // In-memory кеш (для production - Redis)
  private cache = new Map<string, CacheEntry<any>>();
  
  // Статистика
  private stats = {
    hits: 0,
    misses: 0,
  };

  // Настройки по умолчанию
  private defaultTTL = 3600000; // 1 час
  private maxCacheSize = 1000; // максимум записей

  /**
   * Получить данные из кеша
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      console.log(`❌ Cache MISS: ${key}`);
      return null;
    }

    // Проверяем не истек ли срок
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      console.log(`⏰ Cache EXPIRED: ${key}`);
      return null;
    }

    // Увеличиваем счетчик хитов
    entry.hits++;
    this.stats.hits++;
    
    console.log(`✅ Cache HIT: ${key} (hits: ${entry.hits})`);
    return entry.data;
  }

  /**
   * Сохранить данные в кеш
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    const ttl = ttlMs || this.defaultTTL;
    
    // Проверяем размер кеша
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      hits: 0,
      expiresAt: Date.now() + ttl,
    };

    this.cache.set(key, entry);
    console.log(`💾 Cache SET: ${key} (TTL: ${Math.round(ttl/1000)}s)`);
  }

  /**
   * Проверить наличие ключа
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Проверяем не истек ли
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Удалить из кеша
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Очистить весь кеш
   */
  clear(): void {
    this.cache.clear();
    console.log('🧹 Cache cleared');
  }

  /**
   * Очистить кеш по префиксу (например, все кеши конкретного ассистента)
   */
  clearByPrefix(prefix: string): number {
    let deleted = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    console.log(`🧹 Cleared ${deleted} entries with prefix: ${prefix}`);
    return deleted;
  }

  /**
   * Получить статистику кеша
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 
      ? (this.stats.hits / totalRequests) * 100 
      : 0;

    // Приблизительный подсчет памяти
    let memoryUsage = 0;
    for (const entry of this.cache.values()) {
      memoryUsage += JSON.stringify(entry.data).length;
    }

    return {
      totalEntries: this.cache.size,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage: Math.round(memoryUsage / 1024), // в KB
    };
  }

  /**
   * Периодическая очистка истекших записей
   */
  cleanup(): void {
    const now = Date.now();
    let deleted = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        deleted++;
      }
    }

    if (deleted > 0) {
      console.log(`🧹 Cleaned up ${deleted} expired cache entries`);
    }
  }

  /**
   * Удалить самые старые записи при переполнении
   */
  private evictOldest(): void {
    // Находим самую старую запись
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`🗑️ Evicted oldest cache entry: ${oldestKey}`);
    }
  }

  /**
   * Генерация ключа кеша из объекта
   */
  generateKey(prefix: string, ...parts: any[]): string {
    const data = parts.map(p => 
      typeof p === 'object' ? JSON.stringify(p) : String(p)
    ).join(':');
    
    const hash = crypto.createHash('md5').update(data).digest('hex');
    return `${prefix}:${hash}`;
  }
}