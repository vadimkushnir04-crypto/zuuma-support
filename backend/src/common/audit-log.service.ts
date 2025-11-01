import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Основной метод для логирования действий
   */
  async log(params: {
    userId: string;
    action: AuditAction;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    status?: 'success' | 'failure' | 'pending';
    errorMessage?: string;
    metadata?: any;
  }): Promise<AuditLog | null> {
    try {
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
    } catch (error) {
      // Не падаем, если логирование не удалось
      this.logger.error(`Failed to save audit log: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Получить логи пользователя с фильтрами
   */
  async getUserLogs(
    userId: string,
    options?: {
      action?: AuditAction;
      actions?: AuditAction[];
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
      status?: 'success' | 'failure' | 'pending';
    },
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const query = this.auditLogRepository
      .createQueryBuilder('log')
      .where('log.userId = :userId', { userId });

    if (options?.action) {
      query.andWhere('log.action = :action', { action: options.action });
    }

    if (options?.actions && options.actions.length > 0) {
      query.andWhere('log.action IN (:...actions)', { actions: options.actions });
    }

    if (options?.status) {
      query.andWhere('log.status = :status', { status: options.status });
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

  /**
   * Статистика действий пользователя
   */
  async getUserActionStats(userId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .addSelect('log.status', 'status')
      .where('log.userId = :userId', { userId })
      .andWhere('log.createdAt >= :startDate', { startDate })
      .groupBy('log.action')
      .addGroupBy('log.status')
      .getRawMany();

    return stats;
  }

  /**
   * Поиск подозрительной активности
   */
  async findSuspiciousActivity(userId: string): Promise<AuditLog[]> {
    const suspiciousActions = [
      AuditAction.FUNCTION_CREATED,
      AuditAction.FUNCTION_UPDATED,
      AuditAction.FUNCTION_DELETED,
      AuditAction.API_KEY_CREATED,
      AuditAction.LOGIN_FAILED,
      AuditAction.RATE_LIMIT_EXCEEDED,
    ];

    return await this.auditLogRepository.find({
      where: {
        userId,
        action: In(suspiciousActions),
      },
      order: {
        createdAt: 'DESC',
      },
      take: 100,
    });
  }

  /**
   * Получить недавние неудачные попытки входа
   */
  async getRecentFailedLogins(userId: string, hours: number = 24): Promise<number> {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    const count = await this.auditLogRepository.count({
      where: {
        userId,
        action: AuditAction.LOGIN_FAILED,
        createdAt: Between(startDate, new Date()),
      },
    });

    return count;
  }

  /**
   * Статистика по IP адресам
   */
  async getIpAddressStats(userId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.ipAddress', 'ipAddress')
      .addSelect('COUNT(*)', 'count')
      .addSelect('MAX(log.createdAt)', 'lastSeen')
      .where('log.userId = :userId', { userId })
      .andWhere('log.createdAt >= :startDate', { startDate })
      .andWhere('log.ipAddress IS NOT NULL')
      .groupBy('log.ipAddress')
      .orderBy('count', 'DESC')
      .getRawMany();

    return stats;
  }

  /**
   * Экспорт логов
   */
  async exportUserLogs(userId: string, format: 'json' | 'csv' = 'json'): Promise<string> {
    const logs = await this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10000, // Ограничение для экспорта
    });

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }

    // CSV формат
    const headers = 'Timestamp,Action,IP Address,Status,Details\n';
    const rows = logs
      .map(log => {
        const detailsStr = JSON.stringify(log.details || {}).replace(/"/g, '""');
        return `${log.createdAt.toISOString()},${log.action},${log.ipAddress || 'N/A'},${log.status},"${detailsStr}"`;
      })
      .join('\n');

    return headers + rows;
  }

  /**
   * Получить активность по дням
   */
  async getDailyActivity(userId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.auditLogRepository
      .createQueryBuilder('log')
      .select("DATE(log.createdAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('log.userId = :userId', { userId })
      .andWhere('log.createdAt >= :startDate', { startDate })
      .groupBy('DATE(log.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return stats;
  }

  /**
   * Получить последние действия (для дашборда)
   */
  async getRecentActivity(userId: string, limit: number = 10): Promise<AuditLog[]> {
    return await this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Подсчет действий определенного типа
   */
  async countActionsByType(
    userId: string, 
    actions: AuditAction[], 
    startDate?: Date
  ): Promise<number> {
    const query = this.auditLogRepository
      .createQueryBuilder('log')
      .where('log.userId = :userId', { userId })
      .andWhere('log.action IN (:...actions)', { actions });

    if (startDate) {
      query.andWhere('log.createdAt >= :startDate', { startDate });
    }

    return await query.getCount();
  }

  /**
   * Очистка старых логов (для maintenance)
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(`Cleaned up ${result.affected} audit logs older than ${daysToKeep} days`);
    return result.affected || 0;
  }

  /**
   * Получить глобальную статистику (для админов)
   */
  async getGlobalStats(days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COUNT(DISTINCT log.userId)', 'uniqueUsers')
      .where('log.createdAt >= :startDate', { startDate })
      .groupBy('log.action')
      .orderBy('count', 'DESC')
      .getRawMany();

    return stats;
  }
}