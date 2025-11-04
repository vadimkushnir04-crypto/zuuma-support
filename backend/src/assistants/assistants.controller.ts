// backend/src/assistants/assistants.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Headers,
  UseGuards,
  Request as Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AssistantsService } from './assistants.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { KnowledgeService } from '../knowledge/knowledge.service';
import type {
  CreateAssistantDto,
  UpdateAssistantDto,
  AssistantChatRequest,
} from './assistants.types';
import { GlobalFunctionsService } from './services/global-functions.service';
import { QdrantClient } from '@qdrant/js-client-rest';

@Controller('assistants')
export class AssistantsController {
  private qdrant: QdrantClient; // ✅ Добавили свойство

  constructor(
    private readonly assistantsService: AssistantsService,
    private readonly authService: AuthService,
    private readonly globalFunctionsService: GlobalFunctionsService,
    private readonly knowledgeService: KnowledgeService,
  ) {
    // ✅ Инициализируем Qdrant
    this.qdrant = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
    });
  }

  // ⚠️ ВАЖНО: Специфичные маршруты (stats, demo) должны быть ПЕРЕД :id

  // Получение статистики ассистентов
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getAssistantStats(@Req() req: any) {
    try {
      console.log('📊 Getting assistant stats for user:', req.user?.id);
      
      if (!req.user?.id) {
        throw new HttpException('User ID not found in request', HttpStatus.BAD_REQUEST);
      }
      
      const userId = req.user.id;
      const stats = await this.assistantsService.getAssistantStatsByUserId(userId);
      
      console.log('📊 Stats retrieved successfully:', stats?.length || 0, 'items');
      
      return {
        success: true,
        data: stats || [],
      };
    } catch (error) {
      console.error('❌ Error in getAssistantStats:', error);
      console.error('Stack trace:', error.stack);
      
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Ошибка получения статистики',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Создание нового ассистента
  @Post()
  @UseGuards(JwtAuthGuard)
  async createAssistant(
    @Req() req: any,
    @Body() createDto: CreateAssistantDto
  ) {
    try {
      const userId = req.user.id;
      const assistant = await this.assistantsService.createAssistant(userId, createDto);
      
      return {
        success: true,
        data: assistant,
        message: `Ассистент "${assistant.name}" создан успешно`,
      };
    } catch (error) {
      console.error('❌ Error in createAssistant:', error);
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Ошибка создания ассистента'
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Получение списка ассистентов (только свои)
  @Get()
  @UseGuards(JwtAuthGuard)
  async getAssistants(@Req() req: any) {
    try {
      console.log('📋 Getting assistants for user:', req.user?.id);
      
      if (!req.user?.id) {
        throw new HttpException('User ID not found in request', HttpStatus.BAD_REQUEST);
      }
      
      const userId = req.user.id;
      const result = await this.assistantsService.getAssistants(userId);
      
      console.log('📋 Assistants retrieved successfully:', result?.assistants?.length || 0, 'items');
      
      return {
        success: true,
        data: result || { assistants: [], total: 0 },
      };
    } catch (error) {
      console.error('❌ Error in getAssistants:', error);
      console.error('Stack trace:', error.stack);
      
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Ошибка получения ассистентов',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Получение конкретного ассистента
  @Get(':id')
  async getAssistant(@Param('id') id: string) {
    try {
      const assistant = await this.assistantsService.getAssistant(id);
      if (!assistant) {
        throw new HttpException('Ассистент не найден', HttpStatus.NOT_FOUND);
      }
      return {
        success: true,
        data: assistant,
      };
    } catch (error) {
      console.error('❌ Error in getAssistant:', error);
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Ошибка получения ассистента'
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Обновление ассистента (PUT для полного обновления)
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateAssistantPut(
    @Param('id') id: string,
    @Body() updateDto: UpdateAssistantDto,
  ) {
    try {
      const assistant = await this.assistantsService.updateAssistant(id, updateDto);
      return {
        success: true,
        data: assistant,
        message: `Ассистент "${assistant.name}" обновлен успешно`,
      };
    } catch (error) {
      console.error('❌ Error in updateAssistantPut:', error);
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Ошибка обновления ассистента'
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Обновление ассистента (PATCH для частичного обновления)
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateAssistant(
    @Param('id') id: string,
    @Body() updateDto: UpdateAssistantDto,
  ) {
    try {
      const assistant = await this.assistantsService.updateAssistant(id, updateDto);
      return {
        success: true,
        data: assistant,
        message: `Ассистент "${assistant.name}" обновлен успешно`,
      };
    } catch (error) {
      console.error('❌ Error in updateAssistant:', error);
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Ошибка обновления ассистента'
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Удаление ассистента
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteAssistant(@Param('id') id: string, @Req() req: any) {
    try {
      await this.assistantsService.deleteAssistant(id, req.user.id);
      return {
        success: true,
        message: 'Ассистент успешно удален',
      };
    } catch (error) {
      console.error('❌ Error in deleteAssistant:', error);
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Ошибка удаления ассистента'
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Регенерация API ключа
  @Post(':id/regenerate-key')
  @UseGuards(JwtAuthGuard)
  async regenerateApiKey(@Param('id') id: string) {
    try {
      const newApiKey = await this.assistantsService.regenerateApiKey(id);
      return {
        success: true,
        data: { apiKey: newApiKey },
        message: 'API ключ успешно обновлен',
      };
    } catch (error) {
      console.error('❌ Error in regenerateApiKey:', error);
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Ошибка регенерации API ключа'
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Загрузка документов в ассистента
  @Post(':id/upload')
  @UseGuards(JwtAuthGuard)
  async uploadToAssistant(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { text: string; title?: string },
  ) {
    try {
      const userId = req.user.id;
      
      if (!body.text || !body.text.trim()) {
        throw new HttpException('Требуется текст документа', HttpStatus.BAD_REQUEST);
      }

      const assistant = await this.assistantsService.getAssistant(id);
      
      if (!assistant) {
        throw new HttpException('Ассистент не найден', HttpStatus.NOT_FOUND);
      }

      if (assistant.userId && assistant.userId !== userId) {
        throw new UnauthorizedException('У вас нет доступа к этому ассистенту');
      }

      const result = await this.assistantsService.uploadToAssistant(
        id,
        body.text,
        body.title,
      );

      return {
        success: true,
        data: result,
        message: `Документ успешно загружен (${result.chunks} фрагментов)`,
      };
    } catch (error) {
      console.error('❌ Error in uploadToAssistant:', error);
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Ошибка загрузки документа'
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Получить список текстовых загрузок
   * GET /assistants/:id/texts
   */
  @Get(':id/texts')
  @UseGuards(JwtAuthGuard)
  async getTexts(@Param('id') assistantId: string, @Req() req: any) {
    try {
      console.log(`📝 Getting texts for assistant: ${assistantId}`);
      
      const collectionName = `assistant_${assistantId}`;
      
      const scrollResult = await this.qdrant.scroll(collectionName, {
        limit: 1000,
        with_payload: true,
        with_vector: false,
      });

      // Группируем по textId
      const textsMap = new Map();
      
      for (const point of scrollResult.points) {
        const payload = point.payload as any;
        
        // Пропускаем файлы
        if (payload.fileUrl) continue;
        
        const textId = payload.textId || payload.title || 'unknown';
        
        if (!textsMap.has(textId)) {
          textsMap.set(textId, {
            id: textId,
            title: payload.title || 'Без названия',
            description: payload.description || '',
            chunks: 1,
            createdAt: payload.timestamp || payload.createdAt,
            preview: payload.text?.substring(0, 200) || '',
          });
        } else {
          textsMap.get(textId).chunks += 1;
        }
      }

      const texts = Array.from(textsMap.values())
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      console.log(`✅ Found ${texts.length} texts`);
      
      return {
        success: true,
        texts,
        total: texts.length,
      };

    } catch (error) {
      console.error('❌ Error getting texts:', error);
      return {
        success: false,
        texts: [],
        error: error.message,
      };
    }
  }

  /**
   * Получить полный текст
   * GET /assistants/:id/texts/:textId/content
   */
  @Get(':id/texts/:textId/content')
  @UseGuards(JwtAuthGuard)
  async getTextContent(
    @Param('id') assistantId: string,
    @Param('textId') textId: string,
  ) {
    try {
      const collectionName = `assistant_${assistantId}`;
      
      // Ищем первый чанк с оригинальным текстом
      const scrollResult = await this.qdrant.scroll(collectionName, {
        filter: {
          must: [
            {
              should: [
                { key: 'textId', match: { text: textId } },
                { key: 'title', match: { text: textId } }
              ]
            },
            { key: 'isFirstChunk', match: { value: true } }
          ]
        },
        limit: 1,
        with_payload: true,
      });

      if (scrollResult.points.length === 0) {
        throw new HttpException('Текст не найден', HttpStatus.NOT_FOUND);
      }

      const payload = scrollResult.points[0].payload as any;
      
      return {
        success: true,
        data: {
          textId: textId,
          title: payload.title,
          description: payload.description,
          text: payload.originalText || payload.text || '',
        }
      };

    } catch (error) {
      console.error('❌ Error getting text content:', error);
      throw new HttpException(
        error.message || 'Ошибка получения текста',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Удалить текст
   * DELETE /assistants/:id/texts/:textId
   */
  @Delete(':id/texts/:textId')
  @UseGuards(JwtAuthGuard)
  async deleteText(
    @Param('id') assistantId: string,
    @Param('textId') textId: string,
  ) {
    try {
      console.log(`🗑️ Deleting text: ${textId}`);
      
      const collectionName = `assistant_${assistantId}`;
      
      const scrollResult = await this.qdrant.scroll(collectionName, {
        filter: {
          should: [
            { key: 'textId', match: { text: textId } },
            { key: 'title', match: { text: textId } }
          ]
        },
        limit: 1000,
      });

      if (scrollResult.points.length === 0) {
        throw new HttpException('Текст не найден', HttpStatus.NOT_FOUND);
      }

      const pointIds = scrollResult.points.map(p => p.id);
      
      await this.qdrant.delete(collectionName, {
        points: pointIds,
        wait: true,
      });

      console.log(`✅ Deleted ${pointIds.length} chunks`);

      return {
        success: true,
        message: 'Текст удален',
        deletedChunks: pointIds.length,
      };

    } catch (error) {
      console.error('❌ Error deleting text:', error);
      throw new HttpException(
        error.message || 'Ошибка удаления',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Обновить текст (пересоздает chunks)
   * PATCH /assistants/:id/texts/:textId
   */
  @Patch(':id/texts/:textId')
  @UseGuards(JwtAuthGuard)
  async updateText(
    @Param('id') assistantId: string,
    @Param('textId') textId: string,
    @Body('title') title?: string,
    @Body('description') description?: string,
    @Body('text') text?: string,
  ) {
    try {
      console.log(`✏️ Updating text: ${textId}`);
      
      const collectionName = `assistant_${assistantId}`;
      
      // Находим старые данные
      const scrollResult = await this.qdrant.scroll(collectionName, {
        filter: {
          should: [
            { key: 'textId', match: { text: textId } },
            { key: 'title', match: { text: textId } }
          ]
        },
        limit: 1000,
        with_payload: true,
      });

      if (scrollResult.points.length === 0) {
        throw new HttpException('Текст не найден', HttpStatus.NOT_FOUND);
      }

      const oldPayload = scrollResult.points[0].payload as any;
      const oldTitle = oldPayload.title;
      const oldDescription = oldPayload.description;
      const oldText = oldPayload.originalText || oldPayload.text;

      // Удаляем старые chunks
      const pointIds = scrollResult.points.map(p => p.id);
      await this.qdrant.delete(collectionName, {
        points: pointIds,
        wait: true,
      });

      console.log(`🗑️ Deleted ${pointIds.length} old chunks`);

      // Создаем новые chunks
      const newText = text?.trim() || oldText;
      const newTitle = title || oldTitle;
      const newDescription = description !== undefined ? description : oldDescription;
      
      const result = await this.knowledgeService.uploadText(
        newText,
        collectionName,
        newTitle,
        newDescription
      );

      return {
        success: true,
        message: 'Текст обновлен',
        chunks: result.chunks,
      };

    } catch (error) {
      console.error('❌ Error updating text:', error);
      throw new HttpException(
        error.message || 'Ошибка обновления',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Отладка ассистента
  @Get(':id/debug')
  async debugAssistant(@Param('id') id: string) {
    try {
      const debug = await this.assistantsService.debugAssistantData(id);
      return { success: true, debug };
    } catch (error) {
      console.error('❌ Error in debugAssistant:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
  

  // Получить функции ассистента
  @Get(':id/functions')
  async getAssistantFunctions(@Param('id') assistantId: string) {
    try {
      const functions = await this.globalFunctionsService.getAssistantFunctions(assistantId);
      return {
        success: true,
        data: functions,
        count: functions.length,
      };
    } catch (error) {
      console.error('❌ Error in getAssistantFunctions:', error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  // Назначить функцию ассистенту
  @Post(':id/functions/assign')
  @UseGuards(JwtAuthGuard)
  async assignFunction(
    @Param('id') assistantId: string,
    @Body() body: { globalFunctionId: string }
  ) {
    try {
      await this.globalFunctionsService.assignFunctionToAssistant(assistantId, body.globalFunctionId);
      return {
        success: true,
        message: 'Функция назначена ассистенту',
      };
    } catch (error) {
      console.error('❌ Error in assignFunction:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Убрать функцию у ассистента
  @Delete(':id/functions/:functionId')
  @UseGuards(JwtAuthGuard)
  async removeFunction(
    @Param('id') assistantId: string,
    @Param('functionId') functionId: string
  ) {
    try {
      await this.globalFunctionsService.removeFunctionFromAssistant(assistantId, functionId);
      return {
        success: true,
        message: 'Функция удалена у ассистента',
      };
    } catch (error) {
      console.error('❌ Error in removeFunction:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Отдельный контроллер для публичного API (используется виджетами)
@Controller('chat')
export class AssistantChatController {
  constructor(
    private readonly assistantsService: AssistantsService,
    private readonly globalFunctionsService: GlobalFunctionsService,
  ) {}

  // Публичный эндпоинт для чата
  @Post()
  async chat(
    @Headers('authorization') authHeader: string,
    @Body() request: AssistantChatRequest,
  ) {
    try {
      const apiKey = this.extractApiKey(authHeader);
      if (!apiKey) {
        throw new HttpException(
          'Требуется API ключ в заголовке Authorization',
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (!request.message || !request.message.trim()) {
        throw new HttpException('Требуется сообщение', HttpStatus.BAD_REQUEST);
      }

      const response = await this.assistantsService.chatWithAssistant(apiKey, request);

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      console.error('❌ Error in chat:', error);
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Ошибка обработки запроса'
        },
        statusCode,
      );
    }
  }

  // Получение информации об ассистенте по API ключу
  @Get('info')
  async getAssistantInfo(@Headers('authorization') authHeader: string) {
    try {
      const apiKey = this.extractApiKey(authHeader);
      if (!apiKey) {
        throw new HttpException(
          'Требуется API ключ в заголовке Authorization',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const assistant = await this.assistantsService.getAssistantByApiKey(apiKey);
      if (!assistant) {
        throw new HttpException('Недействительный API ключ', HttpStatus.UNAUTHORIZED);
      }

      return {
        success: true,
        data: {
          name: assistant.name,
          description: assistant.description,
          isActive: assistant.isActive,
          settings: {
            customGreeting: assistant.settings?.customGreeting,
            theme: assistant.settings?.theme,
            primaryColor: assistant.settings?.primaryColor,
            avatar: assistant.settings?.avatar,
          },
        },
      };
    } catch (error) {
      console.error('❌ Error in getAssistantInfo:', error);
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Ошибка получения информации'
        },
        statusCode,
      );
    }
  }


@Get(':id/collection-info')
async getCollectionInfo(@Param('id') assistantId: string) {
  const assistant = await this.assistantsService.getAssistant(assistantId);
  if (!assistant) {
    return { error: 'Assistant not found' };
  }
  
  try {
    const qdrant = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
    });
    
    // Получаем информацию о коллекции
    const collection = await qdrant.getCollection(assistant.collectionName);
    
    // Получаем примеры документов
    const scroll = await qdrant.scroll(assistant.collectionName, { limit: 3 });
    
    return {
      assistantId,
      collectionName: assistant.collectionName,
      documentsCount: collection.points_count,
      sampleDocuments: scroll.points.map(p => {
        // Исправлена проверка типов
        const payload = p.payload as any;
        const text = payload?.text;
        const title = payload?.title;
        
        return {
          text: typeof text === 'string' ? text.substring(0, 200) : 'No text content',
          title: title || 'No title',
          // Добавим дополнительную отладочную информацию
          chunkIndex: payload?.chunkIndex,
          timestamp: payload?.timestamp
        };
      })
    };
  } catch (error) {
    return {
      assistantId,
      collectionName: assistant.collectionName,
      error: error.message
    };
  }
}


  private extractApiKey(authHeader: string): string | null {
    if (!authHeader) return null;
    const matches = authHeader.match(/(?:Bearer\s+|API-Key\s+)?(ak_[a-f0-9]+)/i);
    return matches ? matches[1] : null;
  }
}

