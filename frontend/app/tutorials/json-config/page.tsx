"use client";

import { useState } from "react";
import { ArrowLeft, Copy, CheckCircle, Settings, FileText, BookOpen, Zap } from "lucide-react";
import Link from "next/link";

export default function JsonConfigTutorial() {
  const [copiedCode, setCopiedCode] = useState<number | null>(null);

  const copyToClipboard = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(index);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const basicConfig = `{
  "apiKey": "your_api_key_here",
  "baseURL": "https://zuuma.ru/api//chat/ask",
  "timeout": 30000,
  "retries": 3,
  "chatConfig": {
    "temperature": 0.7,
    "maxTokens": 2000,
    "systemPrompt": "Ты полезный ассистент, который помогает пользователям."
  },
  "ragConfig": {
    "enabled": true,
    "maxChunks": 5,
    "similarityThreshold": 0.7,
    "categories": ["documentation", "faq"]
  }
}`;

  const advancedConfig = `{
  "apiKey": "\${CHATBOT_API_KEY}",
  "baseURL": "\${CHATBOT_BASE_URL:-https://zuuma.ru/api//chat/ask}",
  "environment": "\${NODE_ENV:-development}",
  
  "chatConfig": {
    "temperature": 0.8,
    "maxTokens": 2500,
    "systemPrompt": "Ты профессиональный ассистент компании TechCorp. Отвечай дружелюбно и по делу.",
    "greeting": "Добро пожаловать! Я ассистент TechCorp. Чем могу помочь?",
    "fallbackResponse": "Извините, я не понял ваш вопрос. Можете переформулировать?"
  },
  
  "ragConfig": {
    "enabled": true,
    "maxChunks": 7,
    "similarityThreshold": 0.75,
    "categories": ["documentation", "policies", "faq"],
    "metadataFilters": {
      "department": ["support", "sales"],
      "language": "ru"
    }
  },
  
  "sessionConfig": {
    "ttl": 3600,
    "maxHistory": 50,
    "persistHistory": true
  },
  
  "securityConfig": {
    "rateLimiting": {
      "maxRequests": 100,
      "windowMs": 60000
    },
    "allowedOrigins": ["https://mysite.com", "https://app.mysite.com"],
    "apiKeyRequired": true
  },
  
  "loggingConfig": {
    "level": "info",
    "logRequests": true,
    "logResponses": false,
    "logErrors": true
  }
}`;

  const pythonUsage = `import json
from chatbot_sdk import ChatBot

# Загружаем конфигурацию
with open('chatbot-config.json', 'r', encoding='utf-8') as f:
    config = json.load(f)

# Инициализируем бота с конфигурацией
bot = ChatBot(
    api_key=config['apiKey'],
    base_url=config['baseURL'],
    timeout=config['timeout'],
    retries=config['retries']
)

# Настраиваем RAG, если включен
if config['ragConfig']['enabled']:
    bot.configure_rag(
        max_chunks=config['ragConfig']['maxChunks'],
        similarity_threshold=config['ragConfig']['similarityThreshold'],
        categories=config['ragConfig']['categories']
    )

# Отправляем сообщение с настройками из конфигурации
response = bot.send_message(
    message="Привет!",
    temperature=config['chatConfig']['temperature'],
    max_tokens=config['chatConfig']['maxTokens']
)

print(response.text)`;

  const nodeUsage = `const fs = require('fs');
const { ChatBot } = require('chatbot-sdk-js');

// Загружаем и парсим конфигурацию с поддержкой переменных окружения
function loadConfig(configPath) {
    let configText = fs.readFileSync(configPath, 'utf8');
    
    // Заменяем переменные окружения
    configText = configText.replace(/\\$\\{([^}]+)\\}/g, (match, varName) => {
        const [name, defaultValue] = varName.split(':-');
        return process.env[name] || defaultValue || '';
    });
    
    return JSON.parse(configText);
}

// Загружаем конфигурацию
const config = loadConfig('./chatbot-config.json');

// Создаем бота
const bot = new ChatBot({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    timeout: config.timeout,
    retries: config.retries
});

// Функция для отправки сообщения с конфигурацией
async function sendConfiguredMessage(message, userId) {
    try {
        const response = await bot.sendMessage({
            text: message,
            userId: userId,
            useRag: config.ragConfig.enabled,
            ragParams: config.ragConfig.enabled ? {
                maxChunks: config.ragConfig.maxChunks,
                similarityThreshold: config.ragConfig.similarityThreshold,
                categories: config.ragConfig.categories
            } : undefined,
            chatParams: {
                temperature: config.chatConfig.temperature,
                maxTokens: config.chatConfig.maxTokens,
                systemPrompt: config.chatConfig.systemPrompt
            }
        });
        
        return response;
    } catch (error) {
        console.error('Error:', error);
        return { text: config.chatConfig.fallbackResponse };
    }
}

module.exports = { sendConfiguredMessage, config };`;

  const deploymentConfig = `{
  "environments": {
    "development": {
      "apiKey": "dev_api_key_here",
      "baseURL": "https://dev-zuuma.ru/api//chat/ask",
      "chatConfig": {
        "temperature": 0.9,
        "debug": true
      },
      "loggingConfig": {
        "level": "debug",
        "logRequests": true,
        "logResponses": true
      }
    },
    
    "staging": {
      "apiKey": "STAGING_API_KEY_FROM_ENV",
      "baseURL": "https://staging-zuuma.ru/api//chat/ask",
      "chatConfig": {
        "temperature": 0.8
      },
      "securityConfig": {
        "rateLimiting": {
          "maxRequests": 50,
          "windowMs": 60000
        }
      }
    },
    
    "production": {
      "apiKey": "PRODUCTION_API_KEY_FROM_ENV",
      "baseURL": "https://zuuma.ru/api//chat/ask",
      "chatConfig": {
        "temperature": 0.7,
        "systemPrompt": "Ты профессиональный ассистент. Всегда проверяй факты."
      },
      "securityConfig": {
        "rateLimiting": {
          "maxRequests": 200,
          "windowMs": 60000
        },
        "allowedOrigins": ["https://mycompany.com"]
      },
      "loggingConfig": {
        "level": "error",
        "logRequests": false,
        "logResponses": false
      }
    }
  }
}`;

  const configValidator = `const Joi = require('joi');

// Схема валидации конфигурации
const configSchema = Joi.object({
    apiKey: Joi.string().required(),
    baseURL: Joi.string().uri().required(),
    timeout: Joi.number().integer().min(1000).max(120000).default(30000),
    retries: Joi.number().integer().min(0).max(10).default(3),
    
    chatConfig: Joi.object({
        temperature: Joi.number().min(0).max(2).default(0.7),
        maxTokens: Joi.number().integer().min(1).max(8000).default(2000),
        systemPrompt: Joi.string().default('Ты полезный ассистент.'),
        greeting: Joi.string().optional(),
        fallbackResponse: Joi.string().default('Извините, произошла ошибка.')
    }).default(),
    
    ragConfig: Joi.object({
        enabled: Joi.boolean().default(false),
        maxChunks: Joi.number().integer().min(1).max(20).default(5),
        similarityThreshold: Joi.number().min(0).max(1).default(0.7),
        categories: Joi.array().items(Joi.string()).default([]),
        metadataFilters: Joi.object().pattern(Joi.string(), Joi.any()).default({})
    }).default(),
    
    securityConfig: Joi.object({
        rateLimiting: Joi.object({
            maxRequests: Joi.number().integer().min(1).default(100),
            windowMs: Joi.number().integer().min(1000).default(60000)
        }).default(),
        allowedOrigins: Joi.array().items(Joi.string()).default(['*']),
        apiKeyRequired: Joi.boolean().default(true)
    }).default()
});

// Функция валидации конфигурации
function validateConfig(config) {
    const { error, value } = configSchema.validate(config, {
        allowUnknown: true,
        stripUnknown: true
    });
    
    if (error) {
        throw new Error('Ошибка конфигурации: ' + error.message);
    }
    
    return value;
}

module.exports = { validateConfig };`;

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
              <Settings className="tutorial-icon" size={32} />
            </div>
            <div>
              <h1 className="tutorial-title">JSON Configuration</h1>
              <p className="tutorial-subtitle">
                Универсальная настройка чат-бота через конфигурационные файлы
              </p>
            </div>
          </div>
          
        </div>
      </div>

      {/* Content */}
      <div className="tutorial-content">
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Зачем нужна JSON конфигурация?</h2>
          <p className="tutorial-text">
            JSON конфигурация позволяет централизованно управлять настройками чат-бота, 
            легко переключаться между окружениями (dev, staging, production) и изменять 
            параметры без изменения кода.
          </p>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Базовая конфигурация</h2>
          <p className="tutorial-text">
            Создайте файл <code>chatbot-config.json</code> с базовыми настройками:
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">JSON</span>
              <button 
                onClick={() => copyToClipboard(basicConfig, 1)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 1 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 1 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{basicConfig}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Расширенная конфигурация</h2>
          <p className="tutorial-text">
            Полная конфигурация с поддержкой переменных окружения и дополнительными настройками:
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">JSON</span>
              <button 
                onClick={() => copyToClipboard(advancedConfig, 2)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 2 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 2 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{advancedConfig}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Использование в Python</h2>
          <p className="tutorial-text">
            Загрузка и применение конфигурации в Python приложении:
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Python</span>
              <button 
                onClick={() => copyToClipboard(pythonUsage, 3)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 3 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 3 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{pythonUsage}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Использование в Node.js</h2>
          <p className="tutorial-text">
            Загрузка конфигурации с поддержкой переменных окружения в Node.js:
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">JavaScript</span>
              <button 
                onClick={() => copyToClipboard(nodeUsage, 4)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 4 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 4 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{nodeUsage}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Конфигурация для разных окружений</h2>
          <p className="tutorial-text">
            Создайте отдельные конфигурации для разработки, тестирования и продакшена:
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">JSON</span>
              <button 
                onClick={() => copyToClipboard(deploymentConfig, 5)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 5 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 5 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{deploymentConfig}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Валидация конфигурации</h2>
          <p className="tutorial-text">
            Пример валидации конфигурации с использованием Joi (Node.js):
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">JavaScript</span>
              <button 
                onClick={() => copyToClipboard(configValidator, 6)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 6 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 6 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{configValidator}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Основные секции конфигурации</h2>
          <div className="tutorial-table">
            <div className="tutorial-table-row tutorial-table-header">
              <div>Секция</div>
              <div>Назначение</div>
              <div>Ключевые параметры</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>chatConfig</code></div>
              <div>Настройки генерации ответов</div>
              <div>temperature, maxTokens, systemPrompt</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>ragConfig</code></div>
              <div>Настройки поиска по документам</div>
              <div>enabled, maxChunks, categories</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>securityConfig</code></div>
              <div>Безопасность и ограничения</div>
              <div>rateLimiting, allowedOrigins</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>sessionConfig</code></div>
              <div>Управление сессиями</div>
              <div>ttl, maxHistory, persistHistory</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>loggingConfig</code></div>
              <div>Настройки логирования</div>
              <div>level, logRequests, logErrors</div>
            </div>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Лучшие практики</h2>
          <div className="tutorial-steps">
            <div className="tutorial-step">
              <div className="tutorial-step-number">🔒</div>
              <div className="tutorial-step-content">
                <h3>Не храните секреты в конфигурации</h3>
                <p>Используйте переменные окружения для API ключей и других секретов.</p>
              </div>
            </div>
            
            <div className="tutorial-step">
              <div className="tutorial-step-number">🏗️</div>
              <div className="tutorial-step-content">
                <h3>Валидируйте конфигурацию</h3>
                <p>Всегда проверяйте корректность конфигурации при загрузке приложения.</p>
              </div>
            </div>
            
            <div className="tutorial-step">
              <div className="tutorial-step-number">📁</div>
              <div className="tutorial-step-content">
                <h3>Используйте разные файлы для окружений</h3>
                <p>Создавайте отдельные конфигурации: config.dev.json, config.prod.json</p>
              </div>
            </div>
            
            <div className="tutorial-step">
              <div className="tutorial-step-number">📝</div>
              <div className="tutorial-step-content">
                <h3>Документируйте параметры</h3>
                <p>Добавляйте комментарии и примеры для всех параметров конфигурации.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Что дальше?</h2>
          <div className="tutorial-next-steps">
            <Link href="/tutorials/python" className="tutorial-next-card">
              <FileText size={24} />
              <div>
                <h3>Python SDK</h3>
                <p>Применение конфигурации в Python</p>
              </div>
            </Link>
            
            <Link href="/tutorials/nodejs" className="tutorial-next-card">
              <Settings size={24} />
              <div>
                <h3>Node.js Integration</h3>
                <p>Использование конфигурации в Node.js</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}