// backend/src/common/error-formatter.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorFormatterInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // Форматируем ошибки для разных клиентов
        const response = context.switchToHttp().getResponse();
        const request = context.switchToHttp().getRequest();
        
        // Определяем тип клиента
        const userAgent = request.headers['user-agent'] || '';
        const isTelegram = request.body?.telegramUserId || request.body?.telegramChatId;
        const isWidget = request.body?.apiKey && !request.headers.authorization;
        
        let formattedError: any = {
          success: false,
          timestamp: new Date().toISOString(),
        };

        // Обработка разных типов ошибок
        if (error instanceof HttpException) {
          const status = error.getStatus();
          const errorResponse: any = error.getResponse();
          
          // Rate Limit Error (429)
          if (status === HttpStatus.TOO_MANY_REQUESTS) {
            formattedError = {
              ...formattedError,
              error: this.formatRateLimitError(errorResponse, isTelegram, isWidget),
              retryAfter: errorResponse.retryAfter || 30,
              type: 'RATE_LIMIT',
            };
          }
          // Unauthorized (401)
          else if (status === HttpStatus.UNAUTHORIZED) {
            formattedError = {
              ...formattedError,
              error: this.formatAuthError(isTelegram, isWidget),
              type: 'AUTH_ERROR',
            };
          }
          // Bad Request (400)
          else if (status === HttpStatus.BAD_REQUEST) {
            formattedError = {
              ...formattedError,
              error: errorResponse.error || errorResponse.message || 'Некорректный запрос',
              type: errorResponse.type || 'BAD_REQUEST',
            };
          }
          // Другие HTTP ошибки
          else {
            formattedError = {
              ...formattedError,
              error: errorResponse.error || errorResponse.message || 'Произошла ошибка',
              type: 'HTTP_ERROR',
            };
          }
          
          response.status(status).json(formattedError);
          return throwError(() => error);
        }
        
        // Обработка неожиданных ошибок
        formattedError = {
          ...formattedError,
          error: 'Внутренняя ошибка сервера. Попробуйте позже.',
          type: 'SERVER_ERROR',
        };
        
        if (process.env.NODE_ENV === 'development') {
          formattedError.details = error.message;
          formattedError.stack = error.stack;
        }
        
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(formattedError);
        return throwError(() => error);
      }),
    );
  }

  private formatRateLimitError(errorResponse: any, isTelegram: boolean, isWidget: boolean): string {
    const baseError = errorResponse.error || '';
    
    // Для Telegram - более разговорный стиль
    if (isTelegram) {
      if (baseError.includes('спам')) {
        return '⏸ Эй, не спамь! 😊 Дай мне немного времени на ответ.';
      }
      if (baseError.includes('минуту')) {
        return '⏱ Слишком быстро! Подожди немного перед следующим сообщением.';
      }
      if (baseError.includes('час')) {
        return '⏰ Достигнут лимит сообщений в час. Попробуй чуть позже!';
      }
      return '⏳ Подожди немного перед следующим сообщением.';
    }
    
    // Для виджета - короче и по делу
    if (isWidget) {
      return baseError || 'Вы отправляете сообщения слишком часто. Пожалуйста, подождите.';
    }
    
    // Для веб-приложения - полная информация
    return baseError || 'Превышен лимит запросов. Пожалуйста, подождите перед следующим сообщением.';
  }

  private formatAuthError(isTelegram: boolean, isWidget: boolean): string {
    if (isTelegram) {
      return '🔐 Нужна авторизация. Используй /start для начала работы.';
    }
    
    if (isWidget) {
      return 'Ошибка авторизации. Проверьте API ключ.';
    }
    
    return 'Сессия истекла. Пожалуйста, войдите снова.';
  }
}