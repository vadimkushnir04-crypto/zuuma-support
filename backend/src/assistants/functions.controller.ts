// backend/src/assistants/functions.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body,
  Req,
  HttpException,
  HttpStatus,
  UseGuards
} from '@nestjs/common';
import { FunctionsService } from './functions.service';
import { AuditLogService } from '../common/audit-log.service';
import { AuditAction } from '../common/entities/audit-log.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('assistants/:assistantId/functions')
@UseGuards(JwtAuthGuard)
export class FunctionsController {
  constructor(
    private readonly functionsService: FunctionsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  getFunctions(
    @Param('assistantId') assistantId: string,
    @Req() req: any,
  ) {
    return { 
      success: true, 
      data: this.functionsService.getFunctions(assistantId) 
    };
  }

  @Post()
  async createFunction(
    @Param('assistantId') assistantId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.userId;
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';

    try {
      // Проверка на опасные операции
      if (this.containsDangerousOperations(body.code || body.implementation)) {
        const dangerousPatterns = this.detectDangerousPatterns(body.code || body.implementation);
        
        console.warn(`⚠️ User ${userId} attempted to create dangerous function: ${body.name}`);
        
        // Логируем попытку создания опасной функции
        await this.auditLogService.log({
          userId,
          action: AuditAction.FUNCTION_CREATED,
          details: {
            functionName: body.name,
            functionCode: body.code || body.implementation,
            assistantId,
            warning: 'DANGEROUS_OPERATION_DETECTED',
            dangerousPatterns,
            blocked: false,
          },
          ipAddress,
          userAgent,
          status: 'success',
          errorMessage: `Warning: Function contains dangerous patterns: ${dangerousPatterns.join(', ')}`,
        });

        const result = this.functionsService.createFunction(assistantId, body);
        
        return { 
          success: true, 
          data: result,
          warning: `⚠️ ПРЕДУПРЕЖДЕНИЕ: Функция содержит потенциально опасные операции: ${dangerousPatterns.join(', ')}. Используйте с осторожностью!`
        };
      }

      // Создаем функцию
      const result = this.functionsService.createFunction(assistantId, body);

      // Логируем создание функции с полным кодом
      await this.auditLogService.log({
        userId,
        action: AuditAction.FUNCTION_CREATED,
        details: {
          functionName: body.name,
          functionCode: body.code || body.implementation,
          functionDescription: body.description,
          assistantId,
          endpoint: body.endpoint,
          method: body.method,
          timestamp: new Date().toISOString(),
        },
        ipAddress,
        userAgent,
        status: 'success',
      });

      console.log(`✅ Function created by user ${userId}: ${body.name}`);

      return { success: true, data: result };
    } catch (error) {
      await this.auditLogService.log({
        userId,
        action: AuditAction.FUNCTION_CREATED,
        details: {
          functionName: body.name,
          assistantId,
        },
        ipAddress,
        userAgent,
        status: 'failure',
        errorMessage: error.message,
      });

      throw error;
    }
  }

  @Put(':functionId')
  async updateFunction(
    @Param('assistantId') assistantId: string,
    @Param('functionId') functionId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.userId;
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';

    try {
      // Проверка на опасные операции в новом коде
      const codeToCheck = body.code || body.implementation;
      if (codeToCheck && this.containsDangerousOperations(codeToCheck)) {
        const dangerousPatterns = this.detectDangerousPatterns(codeToCheck);
        
        await this.auditLogService.log({
          userId,
          action: AuditAction.FUNCTION_UPDATED,
          details: {
            functionId,
            newCode: codeToCheck,
            assistantId,
            warning: 'DANGEROUS_OPERATION_DETECTED',
            dangerousPatterns,
          },
          ipAddress,
          userAgent,
          status: 'success',
          errorMessage: `Warning: Updated function contains dangerous patterns: ${dangerousPatterns.join(', ')}`,
        });
      }

      const result = this.functionsService.updateFunction(assistantId, functionId, body);

      // Логируем обновление функции
      await this.auditLogService.log({
        userId,
        action: AuditAction.FUNCTION_UPDATED,
        details: {
          functionId,
          functionName: body.name || result.name,
          newCode: codeToCheck,
          assistantId,
          changes: body,
          timestamp: new Date().toISOString(),
        },
        ipAddress,
        userAgent,
        status: 'success',
      });

      console.log(`✅ Function updated by user ${userId}: ${functionId}`);

      return { success: true, data: result };
    } catch (error) {
      await this.auditLogService.log({
        userId,
        action: AuditAction.FUNCTION_UPDATED,
        details: { functionId, assistantId },
        ipAddress,
        userAgent,
        status: 'failure',
        errorMessage: error.message,
      });

      throw error;
    }
  }

  @Delete(':functionId')
  async deleteFunction(
    @Param('assistantId') assistantId: string,
    @Param('functionId') functionId: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.userId;
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';

    try {
      // Получаем информацию о функции перед удалением
      const func = this.functionsService.getFunctions(assistantId).find(f => f.id === functionId);
      
      this.functionsService.deleteFunction(assistantId, functionId);

      // Логируем удаление функции с кодом для истории
      await this.auditLogService.log({
        userId,
        action: AuditAction.FUNCTION_DELETED,
        details: {
          functionId,
          functionName: func?.name || 'Unknown',
          functionCode: func?.code || func?.implementation,
          assistantId,
          timestamp: new Date().toISOString(),
        },
        ipAddress,
        userAgent,
        status: 'success',
      });

      console.log(`✅ Function deleted by user ${userId}: ${functionId}`);

      return { success: true };
    } catch (error) {
      await this.auditLogService.log({
        userId,
        action: AuditAction.FUNCTION_DELETED,
        details: { functionId, assistantId },
        ipAddress,
        userAgent,
        status: 'failure',
        errorMessage: error.message,
      });

      throw error;
    }
  }

  @Post(':functionId/test')
  async testFunction(
    @Param('assistantId') assistantId: string,
    @Param('functionId') functionId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.userId;
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    const startTime = Date.now();

    try {
      const result = await this.functionsService.testFunction(assistantId, functionId, body);
      const duration = Date.now() - startTime;

      // Получаем имя функции из списка функций
      const func = this.functionsService.getFunctions(assistantId).find(f => f.id === functionId);
      const functionName = func?.name || 'Unknown';

      // Логируем выполнение функции
      await this.auditLogService.log({
        userId,
        action: AuditAction.FUNCTION_EXECUTED,
        details: {
          functionId,
          functionName,
          assistantId,
          testParameters: body,
          resultSuccess: result.success,
          resultMessage: result.message,
          timestamp: new Date().toISOString(),
        },
        ipAddress,
        userAgent,
        status: result.success ? 'success' : 'failure',
        errorMessage: result.success ? undefined : result.message,
        metadata: {
          duration,
        },
      });

      console.log(`${result.success ? '✅' : '❌'} Function executed by user ${userId}: ${functionId} (${duration}ms)`);

      return {
        success: result.success,
        message: result.message,
        data: result.data,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      await this.auditLogService.log({
        userId,
        action: AuditAction.FUNCTION_EXECUTED,
        details: {
          functionId,
          assistantId,
          testParameters: body,
        },
        ipAddress,
        userAgent,
        status: 'failure',
        errorMessage: error.message,
        metadata: {
          duration,
        },
      });

      throw error;
    }
  }

  // ============================================
  // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // ============================================

  private getClientIp(req: any): string {
    return (
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Проверка на опасные операции в коде функции
   */
  private containsDangerousOperations(code: string): boolean {
    if (!code) return false;

    const dangerousPatterns = [
      /DELETE\s+FROM/gi,
      /DROP\s+TABLE/gi,
      /DROP\s+DATABASE/gi,
      /TRUNCATE/gi,
      /ALTER\s+TABLE/gi,
      /DROP\s+COLUMN/gi,
      /GRANT\s+ALL/gi,
      /REVOKE/gi,
      /UPDATE\s+.*\s+SET\s+.*\s+WHERE\s+1\s*=\s*1/gi,
      /DELETE\s+FROM\s+.*\s+WHERE\s+1\s*=\s*1/gi,
    ];

    return dangerousPatterns.some(pattern => pattern.test(code));
  }

  /**
   * Определить какие именно опасные паттерны найдены
   */
  private detectDangerousPatterns(code: string): string[] {
    if (!code) return [];

    const patterns = [
      { name: 'DELETE FROM', regex: /DELETE\s+FROM/gi },
      { name: 'DROP TABLE', regex: /DROP\s+TABLE/gi },
      { name: 'DROP DATABASE', regex: /DROP\s+DATABASE/gi },
      { name: 'TRUNCATE', regex: /TRUNCATE/gi },
      { name: 'ALTER TABLE', regex: /ALTER\s+TABLE/gi },
      { name: 'DROP COLUMN', regex: /DROP\s+COLUMN/gi },
      { name: 'GRANT ALL', regex: /GRANT\s+ALL/gi },
      { name: 'REVOKE', regex: /REVOKE/gi },
      { name: 'UPDATE WHERE 1=1', regex: /UPDATE\s+.*\s+SET\s+.*\s+WHERE\s+1\s*=\s*1/gi },
      { name: 'DELETE WHERE 1=1', regex: /DELETE\s+FROM\s+.*\s+WHERE\s+1\s*=\s*1/gi },
    ];

    return patterns
      .filter(p => p.regex.test(code))
      .map(p => p.name);
  }
}