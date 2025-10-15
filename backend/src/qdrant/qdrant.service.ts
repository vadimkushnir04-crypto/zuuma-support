// backend/src/qdrant/qdrant.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';

@Injectable()
export class QdrantService implements OnModuleInit {
  private client: QdrantClient;

  async onModuleInit() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
    });

    // Проверим, что есть коллекция
    await this.ensureCollection('documents');
  }

  private async ensureCollection(collectionName: string) {
    const collections = await this.client.getCollections();
    const exists = collections.collections.some(c => c.name === collectionName);

    if (!exists) {
      await this.client.createCollection(collectionName, {
        vectors: {
          // ⚠️ ВАЖНО: Размерность для YandexGPT Embeddings = 256
          // (было 768 для nomic-embed-text-v1.5)
          size: 256,
          distance: 'Cosine',
        },
      });
      console.log(`✅ Создана коллекция: ${collectionName} (YandexGPT embeddings, dim=256)`);
    } else {
      console.log(`ℹ️ Коллекция ${collectionName} уже существует`);
    }
  }

  async addDocument(
    collection: string,
    id: string,
    embedding: number[],
    payload: Record<string, any>,
  ) {
    // Проверяем размерность эмбеддинга
    if (embedding.length !== 256) {
      console.warn(`⚠️ Expected embedding size 256, got ${embedding.length}`);
    }

    return this.client.upsert(collection, {
      points: [
        {
          id,
          vector: embedding,
          payload,
        },
      ],
    });
  }

  async search(
    collection: string,
    queryEmbedding: number[],
    limit = 5,
  ) {
    // Проверяем размерность эмбеддинга
    if (queryEmbedding.length !== 256) {
      console.warn(`⚠️ Expected embedding size 256, got ${queryEmbedding.length}`);
    }

    return this.client.search(collection, {
      vector: queryEmbedding,
      limit,
    });
  }

  /**
   * Получить информацию о коллекции
   */
  async getCollectionInfo(collection: string) {
    try {
      const info = await this.client.getCollection(collection);
      console.log(`📊 Collection "${collection}":`, {
        points_count: info.points_count,
        vectors_config: info.config?.params?.vectors,
      });
      return info;
    } catch (error) {
      console.error(`❌ Error getting collection info:`, error);
      throw error;
    }
  }
}