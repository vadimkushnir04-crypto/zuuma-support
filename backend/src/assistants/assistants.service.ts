// backend/src/assistants/assistants.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { QdrantClient } from '@qdrant/js-client-rest';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { Assistant } from './entities/assistant.entity';
import {
  CreateAssistantDto,
  UpdateAssistantDto,
  AssistantListResponse,
  AssistantStatsResponse,
  AssistantChatRequest,
  AssistantChatResponse,
} from './assistants.types';

import { PromptBuilderService } from './services/prompt-builder.service';

// Хранилище истории (в production лучше использовать Redis)
const conversationsStorage = new Map<string, Array<{ 
  role: string; 
  content: string; 
  timestamp: Date 
}>>();

// Настройки по умолчанию для нового ассистента
const defaultSettings = {
  temperature: 0.7,
  maxTokens: 2000,
  maxHistoryMessages: 10,
  enableToxicityFilter: true,
  allowSmallTalk: true,
  searchLimit: 10,
  minSearchScore: 0.3,
  customGreeting: 'Здравствуйте! Я ваш AI ассистент. Чем могу помочь?',
  fallbackMessage: 'Извините, я не смог найти ответ на ваш вопрос. Попробуйте переформулировать запрос.',
  theme: 'light' as const,
  primaryColor: '#667eea',
  
  // Новые настройки поведения
  allowVPN: false,
  allowCompetitorPrices: false,
  allowProfanity: false,
  allowPersonalAdvice: true,
  mood: 'cheerful' as const,
  useEmojis: true,
  maxResponseLength: 'medium' as const,
  customSystemPrompt: '',
};

@Injectable()
export class AssistantsService {
  private qdrant: QdrantClient;

  constructor(
    @InjectRepository(Assistant)
    private assistantRepository: Repository<Assistant>,
    private readonly knowledgeService: KnowledgeService,
    private readonly promptBuilder: PromptBuilderService
  ) {
    this.qdrant = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      checkCompatibility: false,
    });
  }

  // Создание нового ассистента
  async createAssistant(userId: string, dto: CreateAssistantDto): Promise<Assistant> {
    const id = uuidv4();
    const apiKey = this.generateApiKey();
    const collectionName = `assistant_${id}`;

    await this.ensureCollection(collectionName);

    const assistant = this.assistantRepository.create({
      id,
      userId,
      name: dto.name,
      description: dto.description,
      collectionName,
      apiKey,
      systemPrompt: dto.systemPrompt,
      isActive: true,
      trained: false,
      settings: { ...defaultSettings, ...dto.settings },
      totalQueries: 0,
    });

    const savedAssistant = await this.assistantRepository.save(assistant);
    console.log(`✅ Создан ассистент: ${savedAssistant.name} (${id}) для пользователя ${userId}`);
    return savedAssistant;
  }

  // Получение всех ассистентов пользователя
  async getAssistants(userId: string): Promise<AssistantListResponse> {
    const assistants = await this.assistantRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return {
      assistants: assistants as any,
      total: assistants.length,
    };
  }

  async getAssistantStatsByUserId(userId: string): Promise<AssistantStatsResponse[]> {
    const assistants = await this.assistantRepository.find({
      where: { userId },
      order: { lastUsed: 'DESC' },
    });

    const stats = await Promise.all(
      assistants.map(async (assistant) => {
        let totalDocuments = 0;
        try {
          const collection = await this.qdrant.getCollection(assistant.collectionName);
          totalDocuments = collection.points_count ?? 0;
        } catch (error) {
          console.warn(`Не удалось получить статистику для коллекции ${assistant.collectionName}`);
        }

        return {
          id: assistant.id,
          name: assistant.name,
          totalQueries: assistant.totalQueries || 0,
          totalDocuments,
          lastUsed: assistant.lastUsed ?? null,
          isActive: assistant.isActive,
          apiKey: assistant.apiKey,
        };
      })
    );

    return stats;
  }

  // Получение ассистента по ID
  async getAssistant(id: string): Promise<Assistant | null> {
    const assistant = await this.assistantRepository.findOne({ where: { id } });
    
    if (assistant) {
      // Генерируем актуальный промпт на основе настроек
      assistant.systemPrompt = this.promptBuilder.buildSystemPrompt(assistant.settings);
    }
    
    return assistant;
  }

  // Получение ассистента по API ключу
  async getAssistantByApiKey(apiKey: string): Promise<Assistant | null> {
    try {
      console.log('🔍 Looking for assistant with apiKey:', apiKey);
      
      const assistant = await this.assistantRepository.findOne({ 
        where: { apiKey, isActive: true } 
      });
      
      if (assistant) {
        // Генерируем актуальный промпт
        assistant.systemPrompt = this.promptBuilder.buildSystemPrompt(assistant.settings);
        
        console.log('✅ Found assistant:', {
          id: assistant.id,
          name: assistant.name,
          mood: assistant.settings?.mood || 'default',
          collectionName: assistant.collectionName,
        });
        
        // Проверяем collectionName
        if (!assistant.collectionName) {
          console.error('❌ Assistant has no collectionName! Generating...');
          assistant.collectionName = `assistant_${assistant.id}`;
          await this.assistantRepository.save(assistant);
          console.log('✅ Generated collectionName:', assistant.collectionName);
        }
        
        // Проверяем существование коллекции в Qdrant
        try {
          const collection = await this.qdrant.getCollection(assistant.collectionName);
          console.log(`📊 Collection ${assistant.collectionName} exists with ${collection.points_count} documents`);
        } catch (error) {
          console.error(`❌ Collection ${assistant.collectionName} not found in Qdrant!`);
          await this.ensureCollection(assistant.collectionName);
        }
      } else {
        console.log('⚠️ No assistant found for apiKey:', apiKey);
      }
      
      return assistant;
    } catch (error) {
      console.error('❌ Error getting assistant by API key:', error);
      return null;
    }
  }

  // Обновление ассистента
  async updateAssistant(id: string, dto: UpdateAssistantDto): Promise<Assistant> {
    const assistant = await this.assistantRepository.findOne({ where: { id } });
    if (!assistant) {
      throw new Error('Ассистент не найден');
    }

    if (dto.name !== undefined) assistant.name = dto.name;
    if (dto.description !== undefined) assistant.description = dto.description;
    if (dto.systemPrompt !== undefined) assistant.systemPrompt = dto.systemPrompt;
    if (dto.isActive !== undefined) assistant.isActive = dto.isActive;
    if (dto.trained !== undefined) assistant.trained = dto.trained;

    if (dto.settings) {
      assistant.settings = { ...assistant.settings, ...dto.settings };
    }

    const updatedAssistant = await this.assistantRepository.save(assistant);
    console.log(`✅ Обновлен ассистент: ${updatedAssistant.name} (${id})`);
    return updatedAssistant;
  }

  // Обновление статистики
  async incrementAssistantStats(assistantId: string): Promise<void> {
    try {
      const assistant = await this.assistantRepository.findOne({ 
        where: { id: assistantId } 
      });
      
      if (assistant) {
        assistant.totalQueries = (assistant.totalQueries || 0) + 1;
        assistant.lastUsed = new Date();
        await this.assistantRepository.save(assistant);
      }
    } catch (error) {
      console.warn('⚠️ Failed to increment stats:', error.message);
    }
  }

  // Удаление ассистента
  async deleteAssistant(id: string, userId: string): Promise<void> {
      const assistant = await this.assistantRepository.findOne({
        where: { id, userId },
      });

      if (!assistant) {
        throw new Error('Ассистент не найден');
      }

      try {
        // 1. Удаляем коллекцию из Qdrant
        try {
          const { QdrantClient } = require('@qdrant/js-client-rest');
          const qdrant = new QdrantClient({ 
            url: process.env.QDRANT_URL || 'http://localhost:6333' 
          });
          
          await qdrant.deleteCollection(assistant.collectionName);
          console.log(`✅ Deleted Qdrant collection: ${assistant.collectionName}`);
        } catch (error) {
          console.error('Error deleting Qdrant collection:', error);
        }

        // 2. 🗂️ Удаляем папку с файлами
        try {
          const fs = require('fs');
          const path = require('path');
          
          const uploadDir = path.join(process.cwd(), 'uploads', id);
          
          if (fs.existsSync(uploadDir)) {
            console.log(`🗑️ Deleting files directory: ${uploadDir}`);
            
            // Рекурсивно удаляем папку и все файлы в ней
            fs.rmSync(uploadDir, { recursive: true, force: true });
            
            console.log(`✅ Deleted files directory for assistant: ${id}`);
          } else {
            console.log(`📂 No files directory found for assistant: ${id}`);
          }
        } catch (error) {
          console.error('❌ Error deleting files directory:', error);
          // Не прерываем процесс удаления ассистента если не удалось удалить файлы
        }

        // 3. Удаляем ассистента из БД
        await this.assistantRepository.remove(assistant);
        
        console.log(`🗑️ Удален ассистент: ${assistant.name} (${id})`);
        
      } catch (error) {
        console.error('Error deleting assistant:', error);
        throw new Error('Не удалось удалить ассистента');
      }
    }

  // Регенерация API ключа
  async regenerateApiKey(id: string): Promise<string> {
    const assistant = await this.assistantRepository.findOne({ where: { id } });
    if (!assistant) {
      throw new Error('Ассистент не найден');
    }

    const newApiKey = this.generateApiKey();
    assistant.apiKey = newApiKey;
    await this.assistantRepository.save(assistant);

    console.log(`🔄 Регенерирован API ключ для ассистента: ${assistant.name}`);
    return newApiKey;
  }

  // Обработка чата через API ключ
  async chatWithAssistant(
    apiKey: string,
    request: AssistantChatRequest
  ): Promise<AssistantChatResponse> {
    const assistant = await this.getAssistantByApiKey(apiKey);
    if (!assistant) {
      throw new Error('Недействительный API ключ');
    }

    if (!assistant.isActive) {
      throw new Error('Ассистент отключен');
    }

    // Обновляем статистику
    await this.incrementAssistantStats(assistant.id);

    const conversationId = request.conversationId || uuidv4();
    let conversationHistory = request.history || [];
    
    if (request.conversationId) {
      const storedHistory = conversationsStorage.get(conversationId) || [];
      conversationHistory = storedHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));
    }

    const result = await this.knowledgeService.generateAnswer(
      request.message,
      assistant.collectionName,
      assistant.systemPrompt,
      conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      0,
      assistant.id
    );

    // Сохраняем историю
    if (!conversationsStorage.has(conversationId)) {
      conversationsStorage.set(conversationId, []);
    }
    
    const conversation = conversationsStorage.get(conversationId);
    
    if (conversation) {
      conversation.push(
        { role: 'user', content: request.message, timestamp: new Date() },
        { role: 'assistant', content: result.answer, timestamp: new Date() }
      );

      const maxHistory = assistant.settings?.maxHistoryMessages || 10;
      if (conversation.length > maxHistory * 2) {
        conversation.splice(0, conversation.length - maxHistory * 2);
      }
    }

    return {
      response: result.answer,
      conversationId,
      sources: result.sources || 0,
      hasContext: result.hasContext || false,
      searchResults: result.searchResults,
    };
  }

  // Загрузка документов в ассистента
  async uploadToAssistant(
    assistantId: string,
    text: string,
    title?: string
  ): Promise<{ success: boolean; message: string; chunks: number }> {
    const assistant = await this.assistantRepository.findOne({ where: { id: assistantId } });
    if (!assistant) {
      throw new Error('Ассистент не найден');
    }

    return await this.knowledgeService.uploadText(
      text,
      assistant.collectionName,
      title || 'Документ'
    );
  }

  // Приватные методы
  private generateApiKey(): string {
    const prefix = 'ak';
    const randomPart = uuidv4().replace(/-/g, '');
    return `${prefix}_${randomPart}`;
  }

  private async ensureCollection(collectionName: string) {
    try {
      await this.qdrant.getCollection(collectionName);
      console.log(`✅ Коллекция ${collectionName} уже существует`);
    } catch (error) {
      await this.qdrant.createCollection(collectionName, {
        vectors: {
          size: 256, // ✅ Изменено с 768 на 256 для Yandex GPT
          distance: 'Cosine',
        },
      });
      console.log(`✅ Создана новая коллекция: ${collectionName}`);
    }
  }

  // Метод для отладки
  async debugAssistantData(assistantId: string) {
    const assistant = await this.getAssistant(assistantId);
    if (!assistant) {
      throw new Error('Ассистент не найден');
    }

    try {
      const collection = await this.qdrant.getCollection(assistant.collectionName);
      console.log(`📊 Коллекция ${assistant.collectionName}:`);
      console.log(`   - Документов: ${collection.points_count || 0}`);
      
      const vectorSize = collection.config?.params?.vectors?.size || 256;
      console.log(`   - Размер векторов: ${vectorSize}`);
      
      const searchResult = await this.qdrant.scroll(assistant.collectionName, {
        limit: 5,
      });
      
      console.log(`   - Первые 5 документов:`, searchResult.points.map(p => {
        const text = p.payload?.text;
        return {
          id: p.id,
          text: typeof text === 'string' ? text.substring(0, 100) + '...' : 'No text content',
          title: p.payload?.title || 'No title'
        };
      }));
      
      return {
        collectionName: assistant.collectionName,
        documentsCount: collection.points_count || 0,
        sampleDocuments: searchResult.points.length,
        vectorSize: vectorSize
      };
    } catch (error) {
      console.error(`❌ Ошибка коллекции ${assistant.collectionName}:`, error.message);
      return {
        collectionName: assistant.collectionName,
        documentsCount: 0,
        sampleDocuments: 0,
        error: error.message
      };
    }
  }
}