// backend/src/knowledge/knowledge.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { AnswerCacheService } from './answer-cache.service';
import { AIFunctionCallingService } from './ai-function-calling.service';
import { FileProcessingService } from './file-processing.service';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { AssistantsModule } from '../assistants/assistants.module';
import { CommonModule } from '../common/common.module';
import { TokensModule } from '../tokens/tokens.module';
import { CannedResponsesService } from './canned-responses.service';

@Module({
  imports: [
    EmbeddingsModule,
    CommonModule,
    forwardRef(() => AssistantsModule),
    // Настройка Multer для загрузки файлов
    MulterModule.register({
      dest: './uploads',
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
    TokensModule,
  ],
  controllers: [KnowledgeController],
  providers: [
    KnowledgeService,
    AnswerCacheService,
    AIFunctionCallingService,
    FileProcessingService,
    CannedResponsesService,
  ],
  exports: [
    KnowledgeService,
    AnswerCacheService,
    FileProcessingService, // ← Экспортируем
  ],
})
export class KnowledgeModule {}