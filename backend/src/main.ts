// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ErrorFormatterInterceptor } from './common/error-formatter.interceptor';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  try {
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
        environment: process.env.NODE_ENV,
      });
    });

    // ✅ Глобальный обработчик ошибок
    app.use((err: any, req: any, res: any, next: any) => {
      console.error('❌ Unhandled error:', err);
      
      // Возвращаем клиенту
      res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    });

    app.use(cookieParser());

    // ✅ Запускаем сервер
    await app.listen(port, '0.0.0.0');

    console.log('\n🚀 ===================================');
    console.log(`✅ Backend running on http://0.0.0.0:${port}`);
    console.log(`🔗 API available at http://localhost:${port}/api`);
    console.log(`🌍 CORS: ${isProd ? 'PRODUCTION (zuuma.ru)' : 'DEV (localhost)'}`);
    console.log(`🔌 WebSocket endpoint: ws://localhost:${port}/socket.io`);
    console.log(`📊 Audit Logs: ✅ ENABLED`);
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
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});