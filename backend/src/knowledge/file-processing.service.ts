// backend/src/knowledge/file-processing.service.ts
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as PDFParser from 'pdf-parse';
import Tesseract from 'tesseract.js';
import { DocumentMetadata, FileUploadResult } from './knowledge.types';

@Injectable()
export class FileProcessingService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    // Создаем папку uploads если её нет
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Определяет тип файла по MIME или расширению
   */
  getFileType(mimeType: string, filename: string): DocumentMetadata['fileType'] {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('word')) return 'doc';
    
    const ext = path.extname(filename).toLowerCase();
    if (['.md', '.markdown'].includes(ext)) return 'markdown';
    
    return 'text';
  }

  /**
   * Сохраняет файл на диск
   */
  async saveFile(file: Express.Multer.File, assistantId: string): Promise<string> {
    const assistantDir = path.join(this.uploadDir, assistantId);
    if (!fs.existsSync(assistantDir)) {
      fs.mkdirSync(assistantDir, { recursive: true });
    }

    const uniqueName = `${uuidv4()}-${file.originalname}`;
    const filePath = path.join(assistantDir, uniqueName);
    
    fs.writeFileSync(filePath, file.buffer);
    
    // Возвращаем относительный путь
    return path.relative(process.cwd(), filePath);
  }

  /**
   * Извлекает текст из PDF
   */
  async extractTextFromPDF(buffer: Buffer): Promise<{ text: string; pages: number }> {
    try {
      const data = await PDFParser(buffer);
      return {
        text: data.text,
        pages: data.numpages
      };
    } catch (error) {
      console.error('❌ PDF parsing error:', error);
      throw new Error('Не удалось извлечь текст из PDF');
    }
  }

  /**
   * Извлекает текст из изображения (OCR)
   */
  async extractTextFromImage(buffer: Buffer): Promise<string> {
    try {
      const { data: { text } } = await Tesseract.recognize(buffer, 'rus+eng', {
        logger: m => console.log(m)
      });
      return text;
    } catch (error) {
      console.error('❌ OCR error:', error);
      throw new Error('Не удалось распознать текст на изображении');
    }
  }

  /**
   * Обрабатывает файл и извлекает текст
   */
  async processFile(
    file: Express.Multer.File,
    fileType: DocumentMetadata['fileType']
  ): Promise<{ text: string; pageCount?: number }> {
    switch (fileType) {
      case 'pdf':
        const pdfResult = await this.extractTextFromPDF(file.buffer);
        return { text: pdfResult.text, pageCount: pdfResult.pages };

      case 'image':
        const imageText = await this.extractTextFromImage(file.buffer);
        return { text: imageText };

      case 'text':
      case 'markdown':
        return { text: file.buffer.toString('utf-8') };

      default:
        throw new Error(`Неподдерживаемый тип файла: ${fileType}`);
    }
  }

  /**
   * Создает метаданные для чанка
   */
  createChunkMetadata(
    chunk: string,
    chunkIndex: number,
    fileInfo: {
      title: string;
      description?: string;
      fileType: DocumentMetadata['fileType'];
      filePath: string;
      mimeType: string;
      fileSize: number;
      pageCount?: number;
    },
    assistantId: string,
    collectionName: string
  ): Omit<DocumentMetadata, 'text'> {
    return {
      title: fileInfo.title,
      description: fileInfo.description,
      fileType: fileInfo.fileType,
      mimeType: fileInfo.mimeType,
      filePath: fileInfo.filePath,
      fileUrl: `/api/files/${assistantId}/${path.basename(fileInfo.filePath)}`,
      fileSize: fileInfo.fileSize,
      chunkIndex,
      totalChunks: undefined, // Установим позже
      collectionName,
      assistantId,
      source: 'file_upload',
      timestamp: new Date().toISOString(),
      language: 'ru', // Можно определять автоматически
      tags: []
    };
  }

  /**
   * Разбивает текст PDF по страницам
   */
  splitPDFByPages(text: string, pageCount: number): string[] {
    // Простая эвристика: делим текст на равные части
    const avgCharsPerPage = Math.ceil(text.length / pageCount);
    const pages: string[] = [];
    
    for (let i = 0; i < pageCount; i++) {
      const start = i * avgCharsPerPage;
      const end = start + avgCharsPerPage;
      pages.push(text.substring(start, end));
    }
    
    return pages;
  }

  /**
   * Получает URL для доступа к файлу
   */
  getFileUrl(filePath: string, assistantId: string): string {
    const filename = path.basename(filePath);
    return `/api/files/${assistantId}/${filename}`;
  }

  /**
   * Удаляет файл с диска
   */
  async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`🗑️ Deleted file: ${filePath}`);
    }
  }

  /**
   * Получает информацию о файле
   */
  getFileInfo(filePath: string): { exists: boolean; size?: number } {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      return { exists: false };
    }
    
    const stats = fs.statSync(fullPath);
    return { exists: true, size: stats.size };
  }
}