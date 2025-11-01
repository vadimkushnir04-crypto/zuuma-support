// backend/src/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from '../entities/payment.entity';
import { Subscription } from '../entities/subscription.entity';
import { User } from '../entities/user.entity';
import { Plan } from '../tokens/plan.entity';
import { TokensModule } from '../tokens/tokens.module';
import { AuthModule } from '../auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      Subscription,
      User,
      Plan,
    ]),
    TokensModule,
    AuthModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}