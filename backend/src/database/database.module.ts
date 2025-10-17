// backend/src/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assistant } from '../assistants/entities/assistant.entity';
import { GlobalFunction } from '../assistants/entities/global-function.entity';
import { User } from '../entities/user.entity';
import { Integration } from '../integrations/entities/integration.entity';
import { TelegramBot } from '../telegram/entities/telegram-bot.entity';
import { TokenBalance } from '../tokens/token-balance.entity';
import { TokenTransaction } from '../tokens/token-transaction.entity';
import { AssistantLimit } from '../tokens/assistant-limit.entity';
import { Plan } from '../tokens/plan.entity';
import { ChatSession } from '../support/entities/chat-session.entity';
import { ChatMessage } from '../support/entities/chat-message.entity';
import { SupportManager } from '../support/entities/support-manager.entity';

import { Subscription } from '../entities/subscription.entity';
import { Payment } from '../entities/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: String(process.env.DB_PASSWORD || 'password'),
      database: process.env.DB_NAME || 'assistants_db',
      entities: [
        Assistant,
        GlobalFunction,
        User,
        Integration,
        TelegramBot,
        TokenBalance,       
        TokenTransaction,
        AssistantLimit,
        Plan,
        ChatSession,
        ChatMessage,
        SupportManager,
        Subscription,
        Payment,
      ],
      synchronize: false, // ⚠️ Всегда false в продакшене!
      logging: process.env.NODE_ENV === 'development',
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}