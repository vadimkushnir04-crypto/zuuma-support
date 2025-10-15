// backend/src/common/rate-limit.guard.ts
import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { RateLimiterService } from './rate-limiter.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly rateLimiter: RateLimiterService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Извлекаем данные из запроса
    const userId = this.extractUserId(request);
    const assistantId = request.body?.assistantId || request.params?.assistantId || 'default';
    const message = request.body?.query || request.body?.message || '';

    if (!userId) {
      // Если нет userId, пропускаем (или можно заблокировать)
      console.warn('⚠️ Rate limit check skipped: no userId');
      return true;
    }

    // Проверяем rate limit
    const check = await this.rateLimiter.checkRateLimit(userId, assistantId, message);

    if (!check.allowed) {
      console.warn(`🚫 Rate limit exceeded for user ${userId}: ${check.reason}`);
      
      throw new HttpException(
        {
          success: false,
          error: check.reason,
          retryAfter: check.retryAfter,
          type: 'RATE_LIMIT_EXCEEDED'
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // Разрешаем запрос и записываем факт отправки
    await this.rateLimiter.recordMessage(userId, assistantId, message);
    
    return true;
  }

  private extractUserId(request: any): string | null {
    // Вариант 1: Из JWT токена (если есть аутентификация)
    if (request.user?.id) {
      return request.user.id;
    }

    // Вариант 2: Из body (для чатов без авторизации)
    if (request.body?.userId || request.body?.sessionId) {
      return request.body.userId || request.body.sessionId;
    }

    // Вариант 3: IP адрес (для анонимных пользователей)
    const ip = request.ip || request.connection.remoteAddress;
    if (ip) {
      return `ip:${ip}`;
    }

    return null;
  }
}