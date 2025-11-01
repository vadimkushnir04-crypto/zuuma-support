import { 
  Controller, 
  Get, 
  Query, 
  UseGuards, 
  Req,
  HttpException,
  HttpStatus,
  Res,
  Param,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditLogService } from './audit-log.service';
import { AuditAction } from './entities/audit-log.entity';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * Получить логи пользователя
   */
  @Get()
  async getUserLogs(
    @Req() req: any,
    @Query('action') action?: AuditAction,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: 'success' | 'failure' | 'pending',
  ) {
    const userId = req.user.id;

    const options = {
      action,
      status,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const result = await this.auditLogService.getUserLogs(userId, options);

    return {
      success: true,
      logs: result.logs,
      total: result.total,
      limit: options.limit,
      offset: options.offset,
    };
  }

  /**
   * Статистика действий пользователя
   */
  @Get('stats')
  async getUserStats(
    @Req() req: any,
    @Query('days') days?: string,
  ) {
    const userId = req.user.id;
    const daysCount = days ? parseInt(days, 10) : 30;

    const stats = await this.auditLogService.getUserActionStats(userId, daysCount);

    return {
      success: true,
      stats,
      period: `${daysCount} days`,
    };
  }

  /**
   * Подозрительная активность
   */
  @Get('suspicious')
  async getSuspiciousActivity(@Req() req: any) {
    const userId = req.user.id;
    const logs = await this.auditLogService.findSuspiciousActivity(userId);

    return {
      success: true,
      logs,
      count: logs.length,
    };
  }

  /**
   * Недавняя активность (для дашборда)
   */
  @Get('recent')
  async getRecentActivity(
    @Req() req: any,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.id;
    const limitCount = limit ? parseInt(limit, 10) : 10;

    const logs = await this.auditLogService.getRecentActivity(userId, limitCount);

    return {
      success: true,
      logs,
    };
  }

  /**
   * Активность по дням
   */
  @Get('daily')
  async getDailyActivity(
    @Req() req: any,
    @Query('days') days?: string,
  ) {
    const userId = req.user.id;
    const daysCount = days ? parseInt(days, 10) : 30;

    const activity = await this.auditLogService.getDailyActivity(userId, daysCount);

    return {
      success: true,
      activity,
      period: `${daysCount} days`,
    };
  }

  /**
   * Статистика по IP адресам
   */
  @Get('ip-stats')
  async getIpStats(
    @Req() req: any,
    @Query('days') days?: string,
  ) {
    const userId = req.user.id;
    const daysCount = days ? parseInt(days, 10) : 30;

    const stats = await this.auditLogService.getIpAddressStats(userId, daysCount);

    return {
      success: true,
      stats,
      period: `${daysCount} days`,
    };
  }

  /**
   * Экспорт логов
   */
  @Get('export')
  async exportLogs(
    @Res() res: Response,
    @Req() req: any,
    @Query('format') format?: 'json' | 'csv',
  ) {
    const userId = req.user.id;
    const exportFormat = format || 'json';

    try {
      const data = await this.auditLogService.exportUserLogs(userId, exportFormat);

      if (exportFormat === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${userId}-${Date.now()}.csv"`);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${userId}-${Date.now()}.json"`);
      }

      return res.send(data);
    } catch (error) {
      throw new HttpException(
        { success: false, error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Детали конкретного действия
   */
  @Get('actions/:action')
  async getActionDetails(
    @Req() req: any,
    @Param('action') action: AuditAction,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.id;
    const limitCount = limit ? parseInt(limit, 10) : 20;

    const result = await this.auditLogService.getUserLogs(userId, {
      action,
      limit: limitCount,
    });

    return {
      success: true,
      action,
      logs: result.logs,
      total: result.total,
    };
  }

  /**
   * Получить количество неудачных попыток входа
   */
  @Get('security/failed-logins')
  async getFailedLogins(
    @Req() req: any,
    @Query('hours') hours?: string,
  ) {
    const userId = req.user.id;
    const hoursCount = hours ? parseInt(hours, 10) : 24;

    const count = await this.auditLogService.getRecentFailedLogins(userId, hoursCount);

    return {
      success: true,
      failedLoginCount: count,
      period: `${hoursCount} hours`,
    };
  }

  /**
   * Глобальная статистика (только для админов)
   */
  @Get('admin/global-stats')
  async getGlobalStats(
    @Req() req: any,
    @Query('days') days?: string,
  ) {
    // TODO: Добавить проверку на роль администратора
    // if (!req.user.isAdmin) {
    //   throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    // }

    const daysCount = days ? parseInt(days, 10) : 30;
    const stats = await this.auditLogService.getGlobalStats(daysCount);

    return {
      success: true,
      stats,
      period: `${daysCount} days`,
    };
  }
}