import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ErrorFormatterInterceptor } from './common/error-formatter.interceptor';
import cookieParser from 'cookie-parser';
import { CustomLogger, setupGlobalErrorHandlers } from './common/custom-logger.service';
import { AuditLogInterceptor } from './common/audit-log.interceptor';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const logger = new CustomLogger('Bootstrap');

  try {
    // ✅ Проверяем /app/uploads перед запуском
    const uploadsDir = path.join(process.cwd(), 'uploads');
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log(`📁 Created uploads directory: ${uploadsDir}`);
      }

      // Проверяем права доступа
      fs.accessSync(uploadsDir, fs.constants.W_OK);
      console.log(`✅ Uploads directory is writable: ${uploadsDir}`);
    } catch (err) {
      console.error(`❌ Cannot access or create uploads directory: ${uploadsDir}`);
      console.error(err);
    }

    const app = await NestFactory.create(AppModule, {
      cors: true,
      logger,
    });

    setupGlobalErrorHandlers(logger);

    const auditLogInterceptor = app.get(AuditLogInterceptor);
    app.useGlobalInterceptors(auditLogInterceptor);

    app.setGlobalPrefix('api');

    const isProd = process.env.NODE_ENV === 'production';
    const port = process.env.PORT || 8000;

    // ✅ cookie-parser первым
    app.use(cookieParser());

    // ✅ Увеличиваем таймаут для загрузки файлов
    app.use((req, res, next) => {
      if (req.path.includes('/upload-file')) {
        req.setTimeout(120000);
        res.setTimeout(120000);
      }
      next();
    });

    // ✅ CORS
    app.enableCors({
      origin: isProd
        ? ['https://zuuma.ru', 'https://www.zuuma.ru']
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    });

    // ✅ Валидация и интерцепторы
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
      })
    );
    app.useGlobalInterceptors(new ErrorFormatterInterceptor());

    // ✅ Логирование запросов
    app.use((req, res, next) => {
      console.log(`\n📥 ${req.method} ${req.url}`);
      console.log('Headers:', {
        'content-type': req.headers['content-type'],
        'authorization': req.headers['authorization'] ? 'Bearer ***' : 'none',
      });
      console.log('Cookies:', req.cookies ? Object.keys(req.cookies) : 'none');
      next();
    });

    // ✅ Health check
    app.getHttpAdapter().get('/health', (req, res) => {
      res.json({
        status: 'OK',
        message: 'NestJS Chat API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      });
    });

    // ✅ Глобальный обработчик ошибок
    app.use((err: any, req: any, res: any, next: any) => {
      console.error('❌ Unhandled error:', err);
      res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    });

    // ✅ Запускаем сервер
    await app.listen(port, '0.0.0.0');

    console.log('\n🚀 ===================================');
    console.log(`✅ Backend running on http://0.0.0.0:${port}`);
    console.log(`🔗 API available at http://localhost:${port}/api`);
    console.log(`🌍 CORS: ${isProd ? 'PRODUCTION (zuuma.ru)' : 'DEV (localhost)'}`);
    console.log(`🔌 WebSocket endpoint: ws://localhost:${port}/socket.io`);
    console.log(`📊 Audit Logs: ✅ ENABLED`);
    console.log(`🍪 Cookies: ✅ ENABLED`);
    console.log('🚀 ===================================\n');

  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();

// ✅ Обработка необработанных отклонений промисов
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// ✅ Обработка необработанных исключений
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  setTimeout(() => process.exit(1), 1000);
});
