// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ErrorFormatterInterceptor } from './common/error-formatter.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true, // Включаем базовый CORS для NestJS
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
    });
  });

  // ✅ Запускаем сервер
  await app.listen(port, '0.0.0.0'); // Слушаем на всех интерфейсах

  console.log('\n🚀 ===================================');
  console.log(`✅ Backend running on http://0.0.0.0:${port}`);
  console.log(`🔗 API available at http://localhost:${port}/api`);
  console.log(`🌍 CORS: ${isProd ? 'PRODUCTION (zuuma.ru)' : 'DEV (localhost)'}`);
  console.log(`🔌 WebSocket endpoint: ws://localhost:${port}/socket.io`);
  console.log('🚀 ===================================\n');
}

bootstrap();