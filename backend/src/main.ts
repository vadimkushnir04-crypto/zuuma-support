// backend/src/main.ts
// ⚠️ ВАЖНО: Sentry должен быть импортирован ПЕРВЫМ (если используете)
import * as Sentry from '@sentry/node';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ErrorFormatterInterceptor } from './common/error-formatter.interceptor';

async function bootstrap() {
  try {
    // Инициализируем Sentry если есть DSN
    if (process.env.SENTRY_DSN) {
      await import('sentry.server.config.js');
    }

    const app = await NestFactory.create(AppModule, {
      cors: true,
    });

    app.setGlobalPrefix('api');

    const isProd = process.env.NODE_ENV === 'production';
    const port = process.env.PORT || 8000;

    // ✅ CORS с правильными доменами
    app.enableCors({
      origin: isProd 
        ? [
            'https://zuuma.ru',
            'https://www.zuuma.ru',
          ]
        : [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            'null', // Для локальных HTML файлов (виджет)
          ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    });

    // ✅ Глобальные пайпы и интерцепторы
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
      next();
    });

    // ✅ Health Check endpoint
    app.getHttpAdapter().get('/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        message: 'NestJS Chat API is running',
        timestamp: new Date().toISOString(),
        sentry: !!process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
      });
    });

    // ✅ Глобальный обработчик ошибок
    app.use((err: any, req: any, res: any, next: any) => {
      console.error('❌ Unhandled error:', err);
      
      // Отправляем в Sentry если настроен
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(err);
      }
      
      // Возвращаем клиенту
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
    console.log(`🛡️  Sentry: ${process.env.SENTRY_DSN ? '✅ ENABLED' : '⏸️  DISABLED (добавьте SENTRY_DSN в .env)'}`);
    console.log(`📊 Audit Logs: ✅ ENABLED`);
    console.log('🚀 ===================================\n');

  } catch (error) {
    console.error('❌ Failed to start application:', error);
    
    // Отправляем критическую ошибку в Sentry
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error);
      await Sentry.close(2000);
    }
    
    process.exit(1);
  }
}

bootstrap();

// ✅ Обработка необработанных отклонений промисов
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(reason);
  }
});

// ✅ Обработка необработанных исключений
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error);
  }
  
  // Даем Sentry время отправить событие
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});