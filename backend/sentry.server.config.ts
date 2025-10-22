// backend/sentry.server.config.ts
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Трассировка производительности
  tracesSampleRate: 0.1, // 10% запросов
  
  // Профилирование (опционально)
  profilesSampleRate: 0.1, // 10% профилируются
  
  // Окружение
  environment: process.env.NODE_ENV,
  
  // Фильтрация данных
  beforeSend(event, hint) {
    // Удаляем чувствительные данные
    if (event.request) {
      delete event.request.cookies;
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
    }
    
    // Фильтруем пароли и токены
    if (event.extra) {
      const sanitized = JSON.stringify(event.extra)
        .replace(/"password"\s*:\s*"[^"]*"/g, '"password":"[FILTERED]"')
        .replace(/"token"\s*:\s*"[^"]*"/g, '"token":"[FILTERED]"')
        .replace(/"apiKey"\s*:\s*"[^"]*"/g, '"apiKey":"[FILTERED]"');
      event.extra = JSON.parse(sanitized);
    }
    
    return event;
  },
  
  // Игнорируем определенные ошибки
  ignoreErrors: [
    'ECONNREFUSED',
    'ENOTFOUND',
    'getaddrinfo',
  ],
  
  // Интеграции
  integrations: [
    nodeProfilingIntegration(),
  ],
});