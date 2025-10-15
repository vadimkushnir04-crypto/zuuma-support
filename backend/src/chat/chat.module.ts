// backend/src/chat/chat.module.ts
import { Module, forwardRef } from "@nestjs/common";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { KnowledgeModule } from "../knowledge/knowledge.module";
import { AssistantsModule } from '../assistants/assistants.module';
import { AuthModule } from '../auth/auth.module';
import { TokensModule } from '../tokens/tokens.module';
import { SupportModule } from '../support/support.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    KnowledgeModule,
    AssistantsModule,
    AuthModule,
    TokensModule,
    CommonModule, // ← для RateLimiterService
    forwardRef(() => SupportModule),
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}