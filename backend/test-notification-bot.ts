// backend/test-notification-bot.ts
// Запустить: npx ts-node test-notification-bot.ts

import TelegramBot from 'node-telegram-bot-api';

const NOTIFICATION_BOT_TOKEN = process.env.NOTIFICATION_BOT_TOKEN || '';

console.log('🤖 Testing notification bot...');
console.log('Token:', NOTIFICATION_BOT_TOKEN.substring(0, 10) + '...');

const bot = new TelegramBot(NOTIFICATION_BOT_TOKEN, { polling: true });

// Проверка подключения
bot.getMe().then(info => {
  console.log('✅ Bot connected:', {
    id: info.id,
    username: info.username,
    name: info.first_name
  });
}).catch(error => {
  console.error('❌ Failed to connect:', error.message);
  process.exit(1);
});

// Обработчик /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from?.username || 'Unknown';
  
  console.log('📱 /start from:', {
    chatId,
    username,
    firstName: msg.from?.first_name
  });

  const response = `
🤖 Привет! Я notification бот.

📋 Ваш Chat ID: \`${chatId}\`

Используйте этот Chat ID для настройки уведомлений в вашем ассистенте.

Как настроить:
1. Скопируйте Chat ID выше
2. Откройте https://zuuma.ru/assistants/create
3. Вставьте Chat ID в поле "Telegram Chat ID"
4. Сохраните настройки

Теперь вы будете получать уведомления о эскалациях!
  `.trim();

  bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
});

// Обработчик любых сообщений
bot.on('message', (msg) => {
  if (msg.text?.startsWith('/')) return; // Пропускаем команды
  
  const chatId = msg.chat.id;
  console.log('💬 Message from:', chatId, ':', msg.text);
  
  bot.sendMessage(
    chatId,
    `Получил ваше сообщение!\n\nВаш Chat ID: \`${chatId}\``,
    { parse_mode: 'Markdown' }
  );
});

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.message);
});

console.log('✅ Bot is running. Send /start to get your Chat ID');
console.log('Press Ctrl+C to stop');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping bot...');
  bot.stopPolling();
  process.exit(0);
});
