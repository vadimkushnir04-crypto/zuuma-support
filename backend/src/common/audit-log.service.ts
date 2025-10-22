import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm'; // ИСПРАВЛЕНО: добавлен In
import { AuditLog, AuditAction } from './entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(params: {
    userId: string;
    action: AuditAction;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    status?: 'success' | 'failure' | 'pending';
    errorMessage?: string;
    metadata?: any;
  }): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      userId: params.userId,
      action: params.action,
      details: params.details || {},
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      status: params.status || 'success',
      errorMessage: params.errorMessage,
      metadata: params.metadata || {},
    });

    return await this.auditLogRepository.save(auditLog);
  }

  async getUserLogs(
    userId: string,
    options?: {
      action?: AuditAction;
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const query = this.auditLogRepository
      .createQueryBuilder('log')
      .where('log.userId = :userId', { userId });

    if (options?.action) {
      query.andWhere('log.action = :action', { action: options.action });
    }

    if (options?.startDate) {
      query.andWhere('log.createdAt >= :startDate', { startDate: options.startDate });
    }

    if (options?.endDate) {
      query.andWhere('log.createdAt <= :endDate', { endDate: options.endDate });
    }

    query
      .orderBy('log.createdAt', 'DESC')
      .skip(options?.offset || 0)
      .take(options?.limit || 50);

    const [logs, total] = await query.getManyAndCount();

    return { logs, total };
  }

  async getUserActionStats(userId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where('log.userId = :userId', { userId })
      .andWhere('log.createdAt >= :startDate', { startDate })
      .groupBy('log.action')
      .getRawMany();

    return stats;
  }

  async findSuspiciousActivity(userId: string): Promise<AuditLog[]> {
    const suspiciousActions = [
      AuditAction.FUNCTION_CREATED,
      AuditAction.FUNCTION_UPDATED,
      AuditAction.FUNCTION_DELETED,
      AuditAction.API_KEY_CREATED,
    ];

    return await this.auditLogRepository.find({
      where: {
        userId,
        action: In(suspiciousActions), // ИСПРАВЛЕНО: теперь In импортирован
      },
      order: {
        createdAt: 'DESC',
      },
      take: 100,
    });
  }

  async exportUserLogs(userId: string, format: 'json' | 'csv' = 'json'): Promise<string> {
    const logs = await this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }

    // CSV формат
    const headers = 'Timestamp,Action,IP Address,Status,Details\n';
    const rows = logs
      .map(log => {
        return `${log.createdAt.toISOString()},${log.action},${log.ipAddress || 'N/A'},${log.status},"${JSON.stringify(log.details).replace(/"/g, '""')}"`;
      })
      .join('\n');

    return headers + rows;
  }
}