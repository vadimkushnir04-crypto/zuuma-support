import { Controller, Post, Body, Req } from '@nestjs/common';
import { CustomLogger } from './custom-logger.service';

interface ErrorLogDto {
  type: 'react_error' | 'global_error' | 'unhandled_rejection' | 'manual_error' | 'api_error';
  message: string;
  stack?: string;
  componentStack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  context?: string;
  userAgent?: string;
  url?: string;
  timestamp?: string;
  additionalData?: Record<string, any>;
}

/**
 * Контроллер для приёма ошибок от frontend
 * Альтернатива Sentry - логирует в ваш Loki
 */
@Controller('errors')
export class ErrorsController {
  private readonly logger = new CustomLogger('ErrorsController');

  /**
   * Endpoint для логирования ошибок от frontend
   * Доступен как авторизованным, так и не авторизованным пользователям
   */
  @Post('log')
  async logError(@Body() errorDto: ErrorLogDto, @Req() req: any) {
    const userId = req.user?.id || 'anonymous';
    const ipAddress = this.getClientIp(req);

    // Логируем в Winston (который отправляет в Loki)
    this.logger.error('Frontend Error', errorDto.stack, 'Frontend', {
      ...errorDto, // ✅ Все поля из errorDto
      userId,
      ipAddress,
      userAgent: errorDto.userAgent || req.headers['user-agent'],
    });

    // Если критичная ошибка - отправляем алерт
    if (this.isCriticalError(errorDto)) {
      await this.sendCriticalErrorAlert(errorDto, userId, ipAddress);
    }

    return {
      success: true,
      message: 'Error logged successfully',
    };
  }

  /**
   * Endpoint для batch логирования (несколько ошибок сразу)
   */
  @Post('log-batch')
  async logErrorsBatch(@Body() errors: ErrorLogDto[], @Req() req: any) {
    const userId = req.user?.id || 'anonymous';
    const ipAddress = this.getClientIp(req);

    for (const errorDto of errors) {
      this.logger.error('Frontend Error (Batch)', errorDto.stack, 'Frontend', {
        ...errorDto,
        userId,
        ipAddress,
      });
    }

    return {
      success: true,
      message: `${errors.length} errors logged successfully`,
    };
  }

  /**
   * Получить статистику ошибок (только для админов)
   */
  @Post('stats')
  async getErrorStats(@Body() filters: { startDate?: string; endDate?: string }) {
    return {
      success: true,
      message: 'Stats endpoint - implement as needed',
    };
  }

  /**
   * Проверка, является ли ошибка критичной
   */
  private isCriticalError(error: ErrorLogDto): boolean {
    const criticalKeywords = [
      'payment',
      'subscription',
      'auth',
      'security',
      'database',
      'crash',
      'fatal',
    ];

    const message = error.message.toLowerCase();
    return criticalKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Отправка алерта о критичной ошибке
   */
  private async sendCriticalErrorAlert(
    error: ErrorLogDto,
    userId: string,
    ipAddress: string,
  ) {
    this.logger.error('CRITICAL ERROR DETECTED', error.stack, 'Alert', {
      userId,
      ipAddress,
      error,
    });
  }

  /**
   * Получить IP адрес клиента
   */
  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.headers['x-real-ip'] ||
      request.ip ||
      'unknown'
    );
  }
}