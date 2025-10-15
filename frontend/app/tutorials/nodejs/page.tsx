"use client";

import { useState } from "react";
import { ArrowLeft, Copy, CheckCircle, Terminal, Server, Zap, BookOpen } from "lucide-react";
import Link from "next/link";

export default function NodeJsTutorial() {
  const [copiedCode, setCopiedCode] = useState<number | null>(null);

  const copyToClipboard = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(index);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const installCode = `npm install chatbot-sdk-js`;

  const basicExample = `const { ChatBot } = require('chatbot-sdk-js');

// Инициализация бота
const bot = new ChatBot({
    apiKey: 'your_api_key_here',
    timeout: 30000,
    retries: 3
});

// Отправка сообщения
async function sendMessage() {
    try {
        const response = await bot.sendMessage('Привет! Как дела?');
        console.log('Ответ бота:', response.text);
        console.log('ID сессии:', response.sessionId);
    } catch (error) {
        console.error('Ошибка:', error.message);
    }
}

sendMessage();`;

  const expressExample = `const express = require('express');
const { ChatBot, Session } = require('chatbot-sdk-js');
const cors = require('cors');

const app = express();
const port = 3000;

// Инициализация бота
const bot = new ChatBot({
    apiKey: process.env.CHATBOT_API_KEY,
    baseURL: 'https://api.yourplatform.com/v1'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Хранилище сессий (в продакшене используйте Redis)
const sessions = new Map();

// API endpoint для чата
app.post('/api/chat', async (req, res) => {
    try {
        const { message, userId = 'anonymous' } = req.body;
        
        // Получаем или создаем сессию
        let session = sessions.get(userId);
        if (!session) {
            session = new Session(userId);
            sessions.set(userId, session);
        }
        
        // Отправляем сообщение
        const response = await bot.sendMessage({
            text: message,
            session: session,
            context: {
                userId,
                timestamp: new Date().toISOString()
            }
        });
        
        res.json({
            success: true,
            response: response.text,
            sessionId: response.sessionId,
            sources: response.sources || []
        });
        
    } catch (error) {
        console.error('Chat API error:', error);
        res.status(500).json({
            success: false,
            error: 'Не удалось обработать сообщение'
        });
    }
});

// Endpoint для истории сообщений
app.get('/api/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const session = sessions.get(userId);
        
        if (!session) {
            return res.json({ messages: [] });
        }
        
        const history = await bot.getHistory(session.id);
        res.json({ messages: history });
        
    } catch (error) {
        res.status(500).json({ error: 'Ошибка получения истории' });
    }
});

app.listen(port, () => {
    console.log(\`Сервер запущен на http://localhost:\${port}\`);
});`;

  const websocketExample = `const WebSocket = require('ws');
const { ChatBot } = require('chatbot-sdk-js');

const wss = new WebSocket.Server({ port: 8080 });
const bot = new ChatBot({ apiKey: process.env.CHATBOT_API_KEY });

// Хранилище соединений
const connections = new Map();

wss.on('connection', (ws) => {
    const connectionId = Math.random().toString(36).substr(2, 9);
    connections.set(connectionId, ws);
    
    console.log(\`Новое соединение: \${connectionId}\`);
    
    // Приветственное сообщение
    ws.send(JSON.stringify({
        type: 'connected',
        connectionId,
        message: 'Соединение установлено'
    }));
    
    ws.on('message', async (data) => {
        try {
            const { message, userId } = JSON.parse(data);
            
            // Показываем, что бот печатает
            ws.send(JSON.stringify({
                type: 'typing',
                isTyping: true
            }));
            
            // Получаем ответ от бота
            const response = await bot.sendMessage({
                text: message,
                userId: userId || connectionId
            });
            
            // Отправляем ответ
            ws.send(JSON.stringify({
                type: 'typing',
                isTyping: false
            }));
            
            ws.send(JSON.stringify({
                type: 'message',
                text: response.text,
                timestamp: new Date().toISOString(),
                sources: response.sources
            }));
            
        } catch (error) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Произошла ошибка при обработке сообщения'
            }));
        }
    });
    
    ws.on('close', () => {
        connections.delete(connectionId);
        console.log(\`Соединение закрыто: \${connectionId}\`);
    });
});

console.log('WebSocket сервер запущен на порту 8080');`;

  const middlewareExample = `// middleware/chatbot.js
const { ChatBot } = require('chatbot-sdk-js');

class ChatBotMiddleware {
    constructor(options = {}) {
        this.bot = new ChatBot(options);
        this.rateLimiter = new Map();
    }
    
    // Rate limiting
    checkRateLimit(userId, maxRequests = 10, windowMs = 60000) {
        const now = Date.now();
        const userRequests = this.rateLimiter.get(userId) || [];
        
        // Удаляем старые запросы
        const validRequests = userRequests.filter(
            time => now - time < windowMs
        );
        
        if (validRequests.length >= maxRequests) {
            return false;
        }
        
        validRequests.push(now);
        this.rateLimiter.set(userId, validRequests);
        return true;
    }
    
    // Express middleware
    middleware() {
        return async (req, res, next) => {
            const userId = req.body.userId || req.ip;
            
            // Проверяем лимиты
            if (!this.checkRateLimit(userId)) {
                return res.status(429).json({
                    error: 'Слишком много запросов'
                });
            }
            
            // Добавляем бота в request
            req.chatBot = this.bot;
            next();
        };
    }
}

module.exports = ChatBotMiddleware;

// Использование в Express
const ChatBotMiddleware = require('./middleware/chatbot');

const chatMiddleware = new ChatBotMiddleware({
    apiKey: process.env.CHATBOT_API_KEY
});

app.use('/api/chat', chatMiddleware.middleware());`;

  return (
    <div className="tutorial-page">
      {/* Header */}
      <div className="tutorial-header">
        <div className="tutorial-header-content">
          <Link href="/tutorials" className="tutorial-back-link">
            <ArrowLeft size={20} />
            Назад к туториалам
          </Link>
          
          <div className="tutorial-header-main">
            <div className="tutorial-icon-wrapper">
              <Terminal className="tutorial-icon" size={32} />
            </div>
            <div>
              <h1 className="tutorial-title">Node.js Integration</h1>
              <p className="tutorial-subtitle">
                Серверная интеграция чат-бота в Node.js приложения
              </p>
            </div>
          </div>
          
        </div>
      </div>

      {/* Content */}
      <div className="tutorial-content">
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Установка SDK</h2>
          <p className="tutorial-text">
            Node.js SDK предоставляет полнофункциональный интерфейс для интеграции чат-бота 
            в серверные приложения. Поддерживает Express.js, WebSocket и другие популярные фреймворки.
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Bash</span>
              <button 
                onClick={() => copyToClipboard(installCode, 1)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 1 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 1 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{installCode}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Базовое использование</h2>
          <p className="tutorial-text">
            Простой пример отправки сообщения и получения ответа:
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">JavaScript</span>
              <button 
                onClick={() => copyToClipboard(basicExample, 2)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 2 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 2 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{basicExample}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Express.js API</h2>
          <p className="tutorial-text">
            Создание RESTful API для чат-бота с использованием Express.js:
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">JavaScript</span>
              <button 
                onClick={() => copyToClipboard(expressExample, 3)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 3 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 3 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{expressExample}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">WebSocket интеграция</h2>
          <p className="tutorial-text">
            Реализация чата в реальном времени через WebSocket:
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">JavaScript</span>
              <button 
                onClick={() => copyToClipboard(websocketExample, 4)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 4 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 4 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{websocketExample}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Middleware для Express</h2>
          <p className="tutorial-text">
            Создание переиспользуемого middleware с защитой от спама:
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">JavaScript</span>
              <button 
                onClick={() => copyToClipboard(middlewareExample, 5)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 5 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 5 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{middlewareExample}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Переменные окружения</h2>
          <p className="tutorial-text">
            Создайте файл <code>.env</code> для безопасного хранения настроек:
          </p>
          <div className="tutorial-table">
            <div className="tutorial-table-row tutorial-table-header">
              <div>Переменная</div>
              <div>Описание</div>
              <div>Пример</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>CHATBOT_API_KEY</code></div>
              <div>API ключ вашего бота</div>
              <div>cb_1234567890abcdef</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>CHATBOT_BASE_URL</code></div>
              <div>Базовый URL API</div>
              <div>https://api.yourplatform.com/v1</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>NODE_ENV</code></div>
              <div>Окружение</div>
              <div>development, production</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>PORT</code></div>
              <div>Порт сервера</div>
              <div>3000</div>
            </div>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Что дальше?</h2>
          <div className="tutorial-next-steps">
            <Link href="/tutorials/javascript" className="tutorial-next-card">
              <Server size={24} />
              <div>
                <h3>JavaScript SDK</h3>
                <p>Клиентская интеграция для веб-приложений</p>
              </div>
            </Link>
            
            <Link href="/tutorials/curl" className="tutorial-next-card">
              <Terminal size={24} />
              <div>
                <h3>REST API с cURL</h3>
                <p>Прямая работа с API без SDK</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}