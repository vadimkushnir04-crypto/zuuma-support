// backend/src/assistants/files.controller.ts - ИСПРАВЛЕННАЯ ВЕРСИЯ

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
import { createReadStream, existsSync, readdirSync } from 'fs';
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
                match: { text: `uploads/${assistantId}/${fileId}` }  // Реконструируем полный путь
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
        console.error('Upload error details:', error.stack);
        throw new HttpException(
          { success: false, error: error.message || 'Ошибка загрузки файла' },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
  }

  /**
   * ✅ ИСПРАВЛЕНО: Получить список файлов
   * GET /assistants/:assistantId/files
   */
  @Get('files')
  async getFiles(@Param('assistantId') assistantId: string) {
    try {
      console.log(`📁 Getting files for assistant: ${assistantId}`);
      
      const collectionName = `assistant_${assistantId}`;
      
      const scrollResult = await this.qdrant.scroll(collectionName, {
        limit: 1000,
        with_payload: true,
        with_vector: false,
      });

      // Группируем по fileUrl
      const filesMap = new Map();
      
      for (const point of scrollResult.points) {
        const payload = point.payload as any;
        
        // Только файлы (с fileUrl)
        if (!payload.fileUrl) continue;
        
        const fileUrl = payload.fileUrl;
        
        if (!filesMap.has(fileUrl)) {
          // ✅ ИСПРАВЛЕНО: Берем полное имя файла из payload
          const fullFilename = path.basename(fileUrl);
          
          filesMap.set(fileUrl, {
            id: path.basename(fileUrl),  // Только basename для id
            title: payload.title || 'Без названия',
            description: payload.description || '',
            fileUrl: `/api/files/${assistantId}/${encodeURIComponent(path.basename(fileUrl))}`,  // С encodeURIComponent
            fileType: payload.fileType || 'unknown',
            fileSize: payload.fileSize || 0,
            mimeType: payload.mimeType || '',
            chunks: 1,
            createdAt: payload.timestamp || payload.createdAt,
          });
          
          console.log(`📎 File mapped: ${fullFilename}`);
        } else {
          filesMap.get(fileUrl).chunks += 1;
        }
      }

      const files = Array.from(filesMap.values())
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      console.log(`✅ Found ${files.length} files`);
      
      return {
        success: true,
        files,
        total: files.length,
      };

    } catch (error) {
      console.error('❌ Error getting files:', error);
      return {
        success: false,
        files: [],
        error: error.message,
      };
    }
  }
} // ← ЭТО СКОБКА ЗАКРЫВАЕТ FilesController

// ============================================
// 📤 КОНТРОЛЛЕР ДЛЯ РАЗДАЧИ ФАЙЛОВ
// ============================================

@Controller('api/files')
export class FileServeController {
  /**
   * ✅ ИСПРАВЛЕНО: Раздача файлов по URL с улучшенным поиском
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

      // ✅ Декодируем имя файла (может быть URL-encoded)
      const decodedFilename = decodeURIComponent(filename).normalize('NFC');
      console.log(`📝 Decoded filename: ${decodedFilename}`);
      
      const uploadsDir = path.join(process.cwd(), 'uploads', assistantId);
      
      // ✅ УЛУЧШЕНИЕ: Проверяем существование директории
      if (!existsSync(uploadsDir)) {
        console.error(`❌ Directory not found: ${uploadsDir}`);
        throw new HttpException('Директория файлов не найдена', HttpStatus.NOT_FOUND);
      }

      // ✅ УЛУЧШЕНИЕ: Ищем файл с учетом разных вариантов имени
      let foundFile: string | null = null;
      
      // Вариант 1: Точное совпадение
      const exactPath = path.join(uploadsDir, decodedFilename);
      if (existsSync(exactPath)) {
        foundFile = exactPath;
        console.log(`✅ Found file (exact match): ${decodedFilename}`);
      } else {
        // Вариант 2: Ищем среди всех файлов в директории
        console.log(`⚠️ Exact file not found, searching in directory...`);
        
        try {
          const filesInDir = readdirSync(uploadsDir);
          console.log(`📂 Files in directory (${filesInDir.length}):`, filesInDir);
          
          // Ищем файл по окончанию (UUID-filename)
          const matchingFile = filesInDir.find(f => {
            const fileWithoutUuid = f.replace(/^[a-f0-9-]{36}-/, '');
            const searchWithoutUuid = decodedFilename.replace(/^[a-f0-9-]{36}-/, '');
            return f === decodedFilename || 
                  f.endsWith(searchWithoutUuid) ||
                  fileWithoutUuid === searchWithoutUuid;
          });
          
          if (matchingFile) {
            foundFile = path.join(uploadsDir, matchingFile);
            console.log(`✅ Found file (fuzzy match): ${matchingFile}`);
          }
        } catch (readDirError) {
          console.error(`❌ Error reading directory:`, readDirError);
        }
      }

      if (!foundFile) {
        console.error(`❌ File not found: ${decodedFilename}`);
        console.error(`❌ Searched in: ${uploadsDir}`);
        throw new HttpException('Файл не найден', HttpStatus.NOT_FOUND);
      }

      // ✅ Определяем MIME type
      const ext = path.extname(decodedFilename).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.txt': 'text/plain; charset=utf-8',
        '.pdf': 'application/pdf',
        '.json': 'application/json',
      };

      const contentType = mimeTypes[ext] || 'application/octet-stream';

      res.set({
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(decodedFilename)}"`,
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*', // ✅ Разрешаем CORS
      });

      console.log(`✅ Serving file: ${path.basename(foundFile)} (${contentType})`);

      const fileStream = createReadStream(foundFile);
      
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