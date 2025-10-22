// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { SupportModule } from './support/support.module';
import { AuditLogModule } from './common/audit-log.module';

// ✅ Импортируем модули (правильная архитектура)

import { AssistantsModule } from './assistants/assistants.module';
import { ChatModule } from './chat/chat.module';
import { AuthModule } from './auth/auth.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { TelegramModule } from './telegram/telegram.module';
import { CommonModule } from './common/common.module';
import { TokensModule } from './tokens/tokens.module';
import { FilesController } from './assistants/files.controller';
import { LLMService } from './common/llm.service';

import { PaymentsModule } from './payments/payments.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // делает ConfigService доступным везде
      envFilePath: '.env',
    }),
    DatabaseModule,
    AssistantsModule,
    CommonModule,
    ChatModule,
    AuthModule,
    KnowledgeModule, 
    IntegrationsModule,
    TokensModule,
    TelegramModule,
    SupportModule,
    PaymentsModule,
    AuditLogModule,
  ],
  controllers: [
    FilesController
  ],
  providers: [
    LLMService,
  ],
  exports: [LLMService],
})
export class AppModule {}