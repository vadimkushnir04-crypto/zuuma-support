// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ErrorFormatterInterceptor } from './common/error-formatter.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const isProd = process.env.NODE_ENV === 'production';
  const port = process.env.PORT || 8000;

  // 🔥 Включаем CORS с поддержкой виджета и локальных файлов
  app.enableCors({
    origin: isProd 
      ? ['https://ваш-домен.com'] 
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3000',
          'null', // 🔥 Для локальных HTML файлов (виджет)
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

  // ✅ Лог всех запросов
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
    res.json({ status: 'OK', message: 'NestJS Chat API is running' });
  });

  // ✅ Запускаем сервер
  await app.listen(port);

  console.log('\n🚀 ===================================');
  console.log(`✅ HTTP + WS server started on http://localhost:${port}`);
  console.log(`🌍 CORS режим: ${isProd ? 'PRODUCTION' : 'DEV (localhost:3000 + виджет)'}`);
  console.log('🚀 ===================================\n');
}

bootstrap();