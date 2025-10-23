// backend/src/common/audit-log.module.ts
import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';
import { AuditLogInterceptor } from './audit-log.interceptor';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Global() // Делаем модуль глобальным, чтобы использовать везде
@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]),
    // ✅ ИСПРАВЛЕНО: Добавили JwtModule и ConfigModule
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
    JwtAuthGuard, // ✅ Добавили JwtAuthGuard как provider
  ],
  controllers: [AuditLogController],
  exports: [AuditLogService, AuditLogInterceptor],
})
export class AuditLogModule {}