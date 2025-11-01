import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';
import { AuditLogInterceptor } from './audit-log.interceptor';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * Глобальный модуль для аудита действий пользователей
 * Используется во всех модулях приложения
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
    ConfigModule,
  ],
  providers: [
    AuditLogService, 
    AuditLogInterceptor,
    JwtAuthGuard,
  ],
  controllers: [AuditLogController],
  exports: [
    AuditLogService, 
    AuditLogInterceptor,
  ],
})
export class AuditLogModule {}