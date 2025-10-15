// backend/src/support/support.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { SupportManager } from './entities/support-manager.entity';
import { AuthModule } from '../auth/auth.module';
import { TelegramModule } from '../telegram/telegram.module';
import { SupportGateway } from './support.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSession, ChatMessage, SupportManager]),
    AuthModule,
    forwardRef(() => TelegramModule), // ✅ правильно оставляем forwardRef
  ],
  controllers: [SupportController],
  providers: [
    SupportService,
    SupportGateway, // ✅ Gateway подключён как provider
  ],
  exports: [
    SupportService,
    SupportGateway, // ✅ экспортируем для других модулей
    TypeOrmModule,
  ],
})
export class SupportModule {}
