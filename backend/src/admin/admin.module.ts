// backend/src/admin/admin.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { User } from '../entities/user.entity';
import { Subscription } from '../entities/subscription.entity';
import { Payment } from '../entities/payment.entity';
import { Plan } from '../tokens/plan.entity';
import { PaymentsService } from '../payments/payments.service';
import { TokensService } from '../tokens/tokens.service';
import { TokenBalance } from '../tokens/token-balance.entity';
import { TokenTransaction } from '../tokens/token-transaction.entity';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Subscription,
      Payment,
      Plan,
      TokenBalance,
      TokenTransaction,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { 
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '7d' 
        },
      }),
    }),
  ],
  controllers: [AdminController],
  providers: [PaymentsService, TokensService],
})
export class AdminModule {}