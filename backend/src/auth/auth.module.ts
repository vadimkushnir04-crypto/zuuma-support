// backend/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../entities/user.entity';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TokenBalance } from '../tokens/token-balance.entity';
import { Plan } from '../tokens/plan.entity';
import { GoogleStrategy } from './google.strategy';
import { AuditLog } from '../common/entities/audit-log.entity'; // ✅ Импорт AuditLog
import { AuditLogModule } from '../common/audit-log.module'; // ✅ Импорт AuditLogModule

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, 
      TokenBalance, 
      Plan,
      AuditLog // ✅ КРИТИЧНО: регистрируем AuditLog для AuthModule
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    AuditLogModule, // ✅ КРИТИЧНО: импортируем AuditLogModule для доступа к AuditLogService
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, GoogleStrategy],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}