// backend/src/embeddings/embeddings.module.ts
import { Module } from '@nestjs/common';
import { EmbeddingsService } from './embeddings.service';
import { EmbeddingsCacheService } from './embeddings-cache.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule], // Для CacheService
  providers: [EmbeddingsService, EmbeddingsCacheService],
  exports: [EmbeddingsService, EmbeddingsCacheService],
})
export class EmbeddingsModule {}