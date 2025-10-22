// frontend/sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Трассировка производительности
  tracesSampleRate: 0.1, // 10% запросов отслеживаются
  
  // Окружение
  environment: process.env.NODE_ENV,
  
  // Фильтрация чувствительных данных
  beforeSend(event, hint) {
    // Удаляем куки и токены
    if (event.request) {
      delete event.request.cookies;
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['Authorization'];
      }
    }
    
    // Фильтруем пароли из данных
    if (event.extra) {
      const sanitized = JSON.stringify(event.extra).replace(
        /"password"\s*:\s*"[^"]*"/g,
        '"password":"[FILTERED]"'
      );
      event.extra = JSON.parse(sanitized);
    }
    
    return event;
  },
  
  // Игнорируем определенные ошибки
  ignoreErrors: [
    // Игнорируем ошибки браузерных расширений
    'Non-Error promise rejection captured',
    'ResizeObserver loop limit exceeded',
    // Игнорируем сетевые ошибки (они не от нас)
    'NetworkError',
    'Failed to fetch',
  ],
  
  // Интеграции
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Session Replay (записывает сессии с ошибками)
  replaysSessionSampleRate: 0.1, // 10% сессий
  replaysOnErrorSampleRate: 1.0, // 100% сессий с ошибками
});