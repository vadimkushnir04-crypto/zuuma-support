// src/knowledge/knowledge.controller.ts
import { Controller, Post, Body, Get, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { 
  SearchResult, 
  KnowledgeUploadResult, 
  GenerateAnswerResult, 
  KnowledgeStats,
  DocumentSearchResult 
} from './knowledge.types';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post('upload-text')
  async uploadText(
    @Body() body: { 
      text: string; 
      companyId: string; 
      title?: string; 
    }
  ): Promise<KnowledgeUploadResult> {
    try {
      const { text, companyId, title } = body;

      if (!text || !companyId) {
        throw new HttpException('Текст и companyId обязательны', HttpStatus.BAD_REQUEST);
      }

      return await this.knowledgeService.uploadText(text, companyId, title);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('search')
  async search(
    @Body() body: { 
      query: string; 
      companyId: string; 
      limit?: number; 
    }
  ): Promise<{ results: SearchResult[] }> {
    try {
      const { query, companyId, limit } = body;

      if (!query || !companyId) {
        throw new HttpException('Query и companyId обязательны', HttpStatus.BAD_REQUEST);
      }

      const results = await this.knowledgeService.search(query, companyId, limit);
      return { results };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('stats/:companyId')
  async getStats(
    @Param('companyId') companyId: string
  ): Promise<KnowledgeStats> {
    try {
      return await this.knowledgeService.getKnowledgeStats(companyId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':companyId')
  async deleteKnowledge(
    @Param('companyId') companyId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      return await this.knowledgeService.deleteCompanyKnowledge(companyId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('search-by-title')
  async searchByTitle(
    @Body() body: { 
      title: string; 
      companyId: string; 
    }
  ): Promise<DocumentSearchResult[]> {
    try {
      const { title, companyId } = body;

      if (!title || !companyId) {
        throw new HttpException('Title и companyId обязательны', HttpStatus.BAD_REQUEST);
      }

      return await this.knowledgeService.searchByTitle(title, companyId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('health-check')
  async healthCheck(): Promise<{ 
    knowledgeService: boolean; 
    embeddingsService: boolean; 
  }> {
    try {
      // Проверяем доступность сервиса эмбеддингов
      const embeddings = this.knowledgeService['embeddings'];
      const embeddingsHealthy = await embeddings.healthCheck();
      
      return {
        knowledgeService: true,
        embeddingsService: embeddingsHealthy,
      };
    } catch (error) {
      return {
        knowledgeService: false,
        embeddingsService: false,
      };
    }
  }
}


