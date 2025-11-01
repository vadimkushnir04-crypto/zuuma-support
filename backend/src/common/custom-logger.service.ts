import { Injectable, LoggerService, Scope } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as path from 'path';

/**
 * Custom Winston Logger с интеграцией в Loki
 * Заменяет стандартный NestJS logger
 */
@Injectable({ scope: Scope.TRANSIENT })
export class CustomLogger implements LoggerService {
  private logger: winston.Logger;
  private context?: string;

  constructor(context?: string) {
    this.context = context;
    this.initializeLogger();
  }

  private initializeLogger() {
    // Форматы для разных типов логов
    const consoleFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, context, trace, ...meta }) => {
        const ctx = context || this.context || 'Application';
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `${timestamp} [${ctx}] ${level}: ${message} ${metaStr}`;
      }),
    );

    const fileFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
    );

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: fileFormat,
      defaultMeta: { 
        service: 'nestjs-app',
        environment: process.env.NODE_ENV || 'development',
      },
      transports: [
        // Console transport (для development)
        new winston.transports.Console({
          format: consoleFormat,
          level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        }),

        // Все логи (daily rotate)
        new winston.transports.DailyRotateFile({
          filename: path.join(process.cwd(), 'logs', 'combined-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          format: fileFormat,
          level: 'info',
        }),

        // Только ошибки (daily rotate)
        new winston.transports.DailyRotateFile({
          filename: path.join(process.cwd(), 'logs', 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '90d',
          format: fileFormat,
          level: 'error',
        }),

        // Audit logs (отдельно)
        new winston.transports.DailyRotateFile({
          filename: path.join(process.cwd(), 'logs', 'audit-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '365d', // Храним год для compliance
          format: fileFormat,
          level: 'info',
        }),

        // Debug logs (только в development)
        ...(process.env.NODE_ENV !== 'production'
          ? [
              new winston.transports.DailyRotateFile({
                filename: path.join(process.cwd(), 'logs', 'debug-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                maxSize: '20m',
                maxFiles: '7d',
                format: fileFormat,
                level: 'debug',
              }),
            ]
          : []),
      ],

      // Не падать при ошибках логирования
      exitOnError: false,
    });
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, context?: string, meta?: Record<string, any>) {
    this.logger.info(message, { context: context || this.context, ...meta });
  }

  error(message: string, trace?: string, context?: string, meta?: Record<string, any>) {
    this.logger.error(message, {
      context: context || this.context,
      trace,
      ...meta,
    });
  }

  warn(message: string, context?: string, meta?: Record<string, any>) {
    this.logger.warn(message, { context: context || this.context, ...meta });
  }

  debug(message: string, context?: string, meta?: Record<string, any>) {
    this.logger.debug(message, { context: context || this.context, ...meta });
  }

  verbose(message: string, context?: string, meta?: Record<string, any>) {
    this.logger.verbose(message, { context: context || this.context, ...meta });
  }

  /**
   * Специальный метод для audit логов
   */
  audit(action: string, userId: string, details: Record<string, any>) {
    this.logger.info('AUDIT', {
      action,
      userId,
      ...details,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * HTTP Request logging
   */
  logRequest(req: any, res: any, responseTime: number) {
    const { method, originalUrl, ip, headers } = req;
    const { statusCode } = res;

    this.logger.info('HTTP Request', {
      method,
      url: originalUrl,
      statusCode,
      responseTime: `${responseTime}ms`,
      ip,
      userAgent: headers['user-agent'],
      userId: req.user?.id,
    });
  }

  /**
   * Database Query logging
   */
  logQuery(query: string, duration: number, error?: Error) {
    if (error) {
      this.logger.error('Database Query Failed', {
        query: query.substring(0, 200), // Первые 200 символов
        duration: `${duration}ms`,
        error: error.message,
        stack: error.stack,
      });
    } else if (duration > 1000) {
      // Логируем медленные запросы
      this.logger.warn('Slow Query Detected', {
        query: query.substring(0, 200),
        duration: `${duration}ms`,
      });
    } else {
      this.logger.debug('Database Query', {
        query: query.substring(0, 200),
        duration: `${duration}ms`,
      });
    }
  }

  /**
   * External API call logging
   */
  logExternalCall(
    service: string,
    method: string,
    url: string,
    duration: number,
    statusCode?: number,
    error?: Error,
  ) {
    if (error) {
      this.logger.error('External API Call Failed', {
        service,
        method,
        url,
        duration: `${duration}ms`,
        error: error.message,
      });
    } else {
      this.logger.info('External API Call', {
        service,
        method,
        url,
        statusCode,
        duration: `${duration}ms`,
      });
    }
  }

  /**
   * Security event logging
   */
  logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any>,
  ) {
    const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    
    this.logger.log(level, `SECURITY: ${event}`, {
      severity,
      ...details,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Performance monitoring
   */
  logPerformance(
    operation: string,
    duration: number,
    threshold: number = 1000,
  ) {
    if (duration > threshold) {
      this.logger.warn('Performance Issue', {
        operation,
        duration: `${duration}ms`,
        threshold: `${threshold}ms`,
      });
    } else {
      this.logger.debug('Performance', {
        operation,
        duration: `${duration}ms`,
      });
    }
  }

  /**
   * Custom event logging (для Loki labels)
   */
  logEvent(
    event: string,
    level: 'info' | 'warn' | 'error' = 'info',
    data: Record<string, any> = {},
  ) {
    this.logger.log(level, event, {
      event,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Global Error Handler для необработанных ошибок
 */
export function setupGlobalErrorHandlers(logger: CustomLogger) {
  // Необработанные Promise rejections
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection', reason?.stack || reason, 'Process', {
      reason: reason?.message || reason,
      promise: promise.toString(),
    });
  });

  // Необработанные исключения
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', error.stack, 'Process', {
      error: error.message,
    });
    
    // В production - graceful shutdown
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

  // Предупреждения (например, deprecations)
  process.on('warning', (warning: Error) => {
    logger.warn('Process Warning', 'Process', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack,
    });
  });
}