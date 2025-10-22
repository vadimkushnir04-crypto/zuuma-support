import { 
  Controller, 
  Get, 
  Query, 
  UseGuards, 
  Req,
  HttpException,
  HttpStatus,
  Res
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditLogService } from './audit-log.service';
import { AuditAction } from './entities/audit-log.entity';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  async getUserLogs(
    @Req() req: any,
    @Query('action') action?: AuditAction,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userId = req.user.id;

    const options = {
      action,
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

  @Get('actions/:action')
  async getActionDetails(
    @Req() req: any,
    @Query('action') action: AuditAction,
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
}