// backend/src/telegram/telegram.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramBot } from './entities/telegram-bot.entity';
import { Integration } from '../integrations/entities/integration.entity';
import { TelegramController } from './telegram.controller';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramWebhookController } from './telegram-webhook.controller';
import { TelegramWebhookService } from './telegram-webhook.service';
import { TelegramService } from './telegram.service';
import { IntegrationsModule } from '../integrations/integrations.module';
import { AuthModule } from '../auth/auth.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { AssistantsModule } from '../assistants/assistants.module';
import { CommonModule } from '../common/common.module';
import { TokensModule } from '../tokens/tokens.module';
import { SupportModule } from '../support/support.module'; // Import here

@Module({
  imports: [
    TypeOrmModule.forFeature([TelegramBot, Integration]),

    // Keep forwardRef for potential other circles
    forwardRef(() => IntegrationsModule),
    forwardRef(() => AuthModule),
    forwardRef(() => KnowledgeModule),
    forwardRef(() => AssistantsModule),
    forwardRef(() => CommonModule),
    forwardRef(() => TokensModule),
    forwardRef(() => SupportModule), // Use forwardRef here
  ],
controllers: [TelegramController, TelegramWebhookController],
  providers: [
    TelegramBotService,
    TelegramWebhookService,
    TelegramService,
  ],
  exports: [
    TelegramBotService,
    TelegramWebhookService,
    TelegramService,
    TypeOrmModule,  // Add this: Exports all forFeature repositories (including TelegramBotRepository)
  ],
})
export class TelegramModule {}