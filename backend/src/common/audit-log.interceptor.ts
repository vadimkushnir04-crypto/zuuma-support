import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditLogService } from './audit-log.service';
import { AuditAction } from './entities/audit-log.entity';

/**
 * Декоратор для маркировки методов, которые нужно логировать
 */
export const AuditLog = (action: AuditAction) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('audit_action', action, descriptor.value);
    return descriptor;
  };
};

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    
    // Получаем action из метаданных
    const action = Reflect.getMetadata('audit_action', handler);
    
    if (!action) {
      return next.handle(); // Если нет метаданных, не логируем
    }

    const userId = request.user?.id || request.user?.userId;
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'] || '';
    const startTime = Date.now();

    // Логируем после выполнения запроса
    return next.handle().pipe(
      tap(async (response) => {
        const duration = Date.now() - startTime;
        
        // Сохраняем audit log
        await this.auditLogService.log({
          userId,
          action,
          details: {
            method: request.method,
            url: request.url,
            body: this.sanitizeBody(request.body),
            query: request.query,
          },
          ipAddress,
          userAgent,
          status: 'success',
          metadata: {
            duration,
            responseStatus: context.switchToHttp().getResponse().statusCode,
          },
        });
      }),
      catchError(async (error) => {
        const duration = Date.now() - startTime;
        
        // Логируем ошибку
        await this.auditLogService.log({
          userId,
          action,
          details: {
            method: request.method,
            url: request.url,
            body: this.sanitizeBody(request.body),
            query: request.query,
          },
          ipAddress,
          userAgent,
          status: 'failure',
          errorMessage: error.message,
          metadata: {
            duration,
            stackTrace: error.stack,
          },
        });

        throw error;
      }),
    );
  }

  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return {};
    
    const sanitized = { ...body };
    
    // Удаляем чувствительные данные (пароли, токены)
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }
    
    return sanitized;
  }
}