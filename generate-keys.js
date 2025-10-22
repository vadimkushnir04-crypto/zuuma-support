// Сохраните этот файл как generate-keys.js
// Запустите: node generate-keys.js

const crypto = require('crypto');

console.log('\n🔑 СГЕНЕРИРОВАННЫЕ КЛЮЧИ:\n');
console.log('Скопируйте их в ваш .env файл:\n');

console.log('# Umami Analytics');
console.log(`UMAMI_SECRET=${crypto.randomBytes(32).toString('hex')}`);

console.log('\n# Grafana');
console.log(`GRAFANA_PASSWORD=${crypto.randomBytes(16).toString('base64')}`);

console.log('\n# Sentry (получите на https://sentry.io после регистрации)');
console.log('SENTRY_DSN=https://...@sentry.io/your-project-id');
console.log('NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/your-project-id');

console.log('\n# Umami Website ID (получите после создания сайта в Umami)');
console.log('NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id');

console.log('\n✅ Готово! Скопируйте эти строки в .env файл\n');