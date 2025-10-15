import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokensController } from './tokens.controller';
import { TokensService } from './tokens.service';
import { TokenBalance } from './token-balance.entity';
import { TokenTransaction } from './token-transaction.entity';
import { AssistantLimit } from './assistant-limit.entity';
import { Plan } from './plan.entity';
import { AuthModule } from '../auth/auth.module';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TokenBalance,
      TokenTransaction,
      AssistantLimit,
      Plan,
      User,
    ]),
    AuthModule
  ],
  controllers: [TokensController],
  providers: [TokensService],
  exports: [TokensService]
})
export class TokensModule {}