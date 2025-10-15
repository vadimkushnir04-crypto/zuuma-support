// backend/src/common/common.module.ts
import { Module, Global } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { RateLimiterService } from './rate-limiter.service';
import { RateLimitGuard } from './rate-limit.guard';
import { CacheService } from './cache.service';
import { LLMService } from './llm.service';

@Global()
@Module({
  providers: [
    EncryptionService,
    RateLimiterService,
    RateLimitGuard,
    CacheService,
    LLMService,
  ],
  exports: [
    EncryptionService,
    RateLimiterService,
    RateLimitGuard,
    CacheService,
    LLMService,
  ],
})
export class CommonModule {
  constructor(
    private readonly rateLimiter: RateLimiterService,
    private readonly cache: CacheService,
  ) {
    // Запускаем периодическую очистку rate limiter (раз в час)
    setInterval(() => {
      this.rateLimiter.cleanup();
    }, 3600000);

    // Запускаем периодическую очистку кеша (каждые 10 минут)
    setInterval(() => {
      this.cache.cleanup();
    }, 600000);
  }
}