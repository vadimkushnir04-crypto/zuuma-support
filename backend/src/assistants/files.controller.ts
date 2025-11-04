// backend/src/assistants/files.controller.ts

import { 
  Controller, 
  Get, 
  Delete, 
  Post,
  Param, 
  UseGuards, 
  Req,
  UseInterceptors,
  UploadedFile,
  Body,
  Res,
  StreamableFile,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { QdrantClient } from '@qdrant/js-client-rest';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import type { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { KnowledgeService } from '../knowledge/knowledge.service';

// ============================================
// 📁 КОНТРОЛЛЕР ДЛЯ УПРАВЛЕНИЯ ФАЙЛАМИ
// ============================================

@Controller('assistants/:assistantId')
@UseGuards(JwtAuthGuard)
export class FilesController {
  private qdrant: QdrantClient;

  constructor(
    private readonly knowledgeService: KnowledgeService,
  ) {
    this.qdrant = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
    });
  }

  /**
   * Удалить файл
   * DELETE /assistants/:assistantId/files/:fileId
   */
  @Delete('files/:fileId')
  async deleteFile(
    @Param('assistantId') assistantId: string,
    @Param('fileId') fileId: string,
    @Req() req: any
  ) {
    try {
      console.log(`🗑️ Deleting file: ${fileId} from assistant: ${assistantId}`);
      
      const collectionName = `assistant_${assistantId}`;
      
      const scrollResult = await this.qdrant.scroll(collectionName, {
        filter: {
          must: [
            {
              key: 'fileUrl',
              match: { text: fileId }
            }
          ]
        },
        limit: 1000,
        with_payload: true,
      });

      if (scrollResult.points.length === 0) {
        return {
          success: false,
          error: 'Файл не найден',
        };
      }

      const firstPoint = scrollResult.points[0].payload as any;
      const filePath = firstPoint.filePath;

      const pointIds = scrollResult.points.map(p => p.id);
      
      await this.qdrant.delete(collectionName, {
        points: pointIds,
        wait: true,
      });

      console.log(`✅ Deleted ${pointIds.length} chunks from Qdrant`);

      if (filePath) {
        try {
          const fullPath = path.join(process.cwd(), filePath);
          await fsPromises.unlink(fullPath);
          console.log(`✅ Deleted file from disk: ${fullPath}`);
        } catch (fsError) {
          console.warn(`⚠️ Could not delete file from disk:`, fsError.message);
        }
      }

      return {
        success: true,
        message: 'Файл успешно удален',
        deletedChunks: pointIds.length,
      };

    } catch (error) {
      console.error('❌ Error deleting file:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Загрузить файл
   * POST /assistants/:assistantId/upload-file
   */
  @Post('upload-file')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB максимум
      },
    })
  )
  async uploadFile(
    @Param('assistantId') assistantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
    @Body('description') description?: string,
    @Req() req?: any,
  ) {
    try {
      if (!file) {
        throw new HttpException('Файл не загружен', HttpStatus.BAD_REQUEST);
      }

      const fileSizeMB = file.size / (1024 * 1024);
      console.log(`📤 File size: ${fileSizeMB.toFixed(2)}MB`);

      if (fileSizeMB > 5) {
        throw new HttpException(
          'Файл слишком большой. Максимум 5MB',
          HttpStatus.BAD_REQUEST
        );
      }

      if (fileSizeMB > 2) {
        console.warn(`⚠️ Large file: ${fileSizeMB.toFixed(2)}MB`);
      }

      const collectionName = `assistant_${assistantId}`;
      
      const result = await this.knowledgeService.uploadFile(
        file,
        collectionName,
        title,
        description,
        assistantId,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Upload error:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        error.message || 'Ошибка загрузки файла',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} // ← ЭТА СКОБКА ЗАКРЫВАЕТ FilesController

// ============================================
// 📤 КОНТРОЛЛЕР ДЛЯ РАЗДАЧИ ФАЙЛОВ
// ============================================

@Controller('api/files')
export class FileServeController {
  /**
   * Раздача файлов по URL
   * GET /api/files/:assistantId/:filename
   */
  @Get(':assistantId/:filename')
  async serveFile(
    @Param('assistantId') assistantId: string,
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      console.log(`📥 GET /api/files/${assistantId}/${filename}`);

      const decodedFilename = decodeURIComponent(filename);
      
      const filePath = path.join(
        process.cwd(),
        'uploads',
        assistantId,
        decodedFilename
      );

      console.log(`📥 Requesting file: ${filePath}`);

      if (!existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        throw new HttpException('Файл не найден', HttpStatus.NOT_FOUND);
      }

      const ext = path.extname(decodedFilename).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.txt': 'text/plain',
        '.pdf': 'application/pdf',
        '.json': 'application/json',
      };

      const contentType = mimeTypes[ext] || 'application/octet-stream';

      res.set({
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(decodedFilename)}"`,
        'Cache-Control': 'public, max-age=31536000',
      });

      console.log(`✅ Serving file: ${decodedFilename} (${contentType})`);

      const fileStream = createReadStream(filePath);
      
      return new StreamableFile(fileStream);

    } catch (error) {
      console.error('❌ Error serving file:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Ошибка при получении файла',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}