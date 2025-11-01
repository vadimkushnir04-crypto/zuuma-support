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
 * 
 * @example
 * @AuditLog(AuditAction.ASSISTANT_CREATED)
 * async createAssistant() { ... }
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
    
    // Если пользователь не авторизован, не логируем
    if (!userId) {
      return next.handle();
    }

    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'] || '';
    const startTime = Date.now();

    // Логируем после выполнения запроса
    return next.handle().pipe(
      tap(async (response) => {
        const duration = Date.now() - startTime;
        
        try {
          // Сохраняем audit log
          await this.auditLogService.log({
            userId,
            action,
            details: {
              method: request.method,
              url: request.url,
              body: this.sanitizeBody(request.body),
              query: request.query,
              params: request.params,
            },
            ipAddress,
            userAgent,
            status: 'success',
            metadata: {
              duration,
              responseStatus: context.switchToHttp().getResponse().statusCode,
              browserInfo: this.getBrowserInfo(userAgent),
              deviceType: this.getDeviceType(userAgent),
            },
          });
        } catch (error) {
          // Не падаем, если логирование не удалось
          console.error('Audit log failed:', error);
        }
      }),
      catchError(async (error) => {
        const duration = Date.now() - startTime;
        
        try {
          // Логируем ошибку
          await this.auditLogService.log({
            userId,
            action,
            details: {
              method: request.method,
              url: request.url,
              body: this.sanitizeBody(request.body),
              query: request.query,
              params: request.params,
            },
            ipAddress,
            userAgent,
            status: 'failure',
            errorMessage: error.message,
            metadata: {
              duration,
              stackTrace: error.stack,
              errorName: error.name,
            },
          });
        } catch (logError) {
          console.error('Audit log failed:', logError);
        }

        throw error;
      }),
    );
  }

  /**
   * Получить IP адрес клиента
   */
  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }

  /**
   * Очистить чувствительные данные из body
   */
  private sanitizeBody(body: any): any {
    if (!body) return {};
    
    const sanitized = { ...body };
    
    // Удаляем чувствительные данные
    const sensitiveFields = [
      'password', 
      'token', 
      'apiKey', 
      'secret', 
      'accessToken',
      'refreshToken',
      'creditCard',
      'cvv',
      'ssn',
    ];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }
    
    return sanitized;
  }

  /**
   * Определить браузер из User-Agent
   */
  private getBrowserInfo(userAgent: string): string {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return 'Other';
  }

  /**
   * Определить тип устройства из User-Agent
   */
  private getDeviceType(userAgent: string): string {
    if (!userAgent) return 'Unknown';
    
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(userAgent)) {
      return 'Tablet';
    }
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune/i.test(userAgent)) {
      return 'Mobile';
    }
    return 'Desktop';
  }
}

/**
 * Простая функция-хелпер для ручного логирования
 * Используйте когда декоратор @AuditLog не подходит
 */
export const logAuditAction = async (
  auditLogService: AuditLogService,
  userId: string,
  action: AuditAction,
  details?: any,
  request?: any,
) => {
  try {
    await auditLogService.log({
      userId,
      action,
      details,
      ipAddress: request ? getIpFromRequest(request) : undefined,
      userAgent: request?.headers?.['user-agent'],
    });
  } catch (error) {
    console.error('Manual audit log failed:', error);
  }
};

function getIpFromRequest(request: any): string {
  return (
    request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    request.headers['x-real-ip'] ||
    request.ip ||
    'unknown'
  );
}