"use client";

import { useState } from "react";
import { ArrowLeft, Copy, CheckCircle, Settings, FileText } from "lucide-react";
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
  "baseURL": "https://zuuma.ru/api/v1/chat",
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
  "baseURL": "\${CHATBOT_BASE_URL:-https://zuuma.ru/api/v1/chat}",
  "environment": "\${NODE_ENV:-development}",
  "chatConfig": {
    "temperature": 0.8,
    "maxTokens": 2500,
    "systemPrompt": "Ты профессиональный ассистент компании TechCorp.",
    "greeting": "Добро пожаловать! Чем могу помочь?",
    "fallbackResponse": "Извините, не понял вопрос."
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

with open('chatbot-config.json', 'r', encoding='utf-8') as f:
    config = json.load(f)

bot = ChatBot(
    api_key=config['apiKey'],
    base_url=config['baseURL'],
    timeout=config['timeout'],
    retries=config['retries']
)

if config['ragConfig']['enabled']:
    bot.configure_rag(
        max_chunks=config['ragConfig']['maxChunks'],
        similarity_threshold=config['ragConfig']['similarityThreshold'],
        categories=config['ragConfig']['categories']
    )

response = bot.send_message(
    message="Привет!",
    temperature=config['chatConfig']['temperature'],
    max_tokens=config['chatConfig']['maxTokens']
)

print(response.text)`;

  const nodeUsage = `const fs = require('fs');
const { ChatBot } = require('chatbot-sdk-js');

function loadConfig(configPath) {
    let configText = fs.readFileSync(configPath, 'utf8');
    configText = configText.replace(/\\$\\{([^}]+)\\}/g, (match, varName) => {
        const [name, defaultValue] = varName.split(':-');
        return process.env[name] || defaultValue || '';
    });
    return JSON.parse(configText);
}

const config = loadConfig('./chatbot-config.json');

const bot = new ChatBot({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    timeout: config.timeout,
    retries: config.retries
});

async function sendConfiguredMessage(message, userId) {
    try {
        const response = await bot.sendMessage({
            text: message,
            userId,
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

      {/* Beta notice */}
      <div className="tutorial-beta-notice">
        ⚠️ API подключения и JSON конфигурация находятся в бета-версии. Возможны ошибки и нестабильная работа.
      </div>

      {/* Content */}
      <div className="tutorial-content">
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Зачем нужна JSON конфигурация?</h2>
          <p className="tutorial-text">
            JSON конфигурация позволяет централизованно управлять настройками чат-бота, легко переключаться между окружениями (dev, staging, production) и изменять параметры без изменения кода.
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
              <button onClick={() => copyToClipboard(basicConfig, 1)} className="tutorial-copy-btn">
                {copiedCode === 1 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 1 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code"><code>{basicConfig}</code></pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Расширенная конфигурация</h2>
          <p className="tutorial-text">
            Полная конфигурация с переменными окружения и дополнительными параметрами:
          </p>
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">JSON</span>
              <button onClick={() => copyToClipboard(advancedConfig, 2)} className="tutorial-copy-btn">
                {copiedCode === 2 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 2 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code"><code>{advancedConfig}</code></pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Использование в Python</h2>
          <p className="tutorial-text">
            Применение конфигурации в Python:
          </p>
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Python</span>
              <button onClick={() => copyToClipboard(pythonUsage, 3)} className="tutorial-copy-btn">
                {copiedCode === 3 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 3 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code"><code>{pythonUsage}</code></pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Использование в Node.js</h2>
          <p className="tutorial-text">
            Применение конфигурации в Node.js:
          </p>
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">JavaScript</span>
              <button onClick={() => copyToClipboard(nodeUsage, 4)} className="tutorial-copy-btn">
                {copiedCode === 4 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 4 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code"><code>{nodeUsage}</code></pre>
          </div>
        </div>
      </div>
    </div>
  );
}
