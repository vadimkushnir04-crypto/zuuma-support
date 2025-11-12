"use client";

import { useState } from "react";
import { ArrowLeft, Copy, CheckCircle, Zap, Globe, Code } from "lucide-react";
import Link from "next/link";

export default function JavaScriptTutorial() {
  const [copiedCode, setCopiedCode] = useState<number | null>(null);

  const copyToClipboard = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(index);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Пример инициализации через fetch (клиентский JS)
  const initExample = `// Инициализация виджета через HTTP-запросы
const chatWidget = {
  apiKey: 'your_api_key_here',
  serverUrl: 'https://zuuma.ru',
};

async function sendMessage(msg, userId) {
  const res = await fetch(\`\${chatWidget.serverUrl}/api/v1/chat\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${chatWidget.apiKey}\`
    },
    body: JSON.stringify({ message: msg, user_id: userId })
  });
  return await res.json();
}

// Использование
sendMessage('Привет, Zuuma!', 'user_123').then(res => console.log(res.response.text));`;

  const reactExample = `import { useState } from 'react';

export default function ChatExample() {
  const [messages, setMessages] = useState([]);

  async function handleSend(text) {
    setMessages(prev => [...prev, { type: 'user', text }]);
    const res = await fetch('https://zuuma.ru/api/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your_api_key_here'
      },
      body: JSON.stringify({ message: text, user_id: 'react_user' })
    });
    const data = await res.json();
    setMessages(prev => [...prev, { type: 'bot', text: data.response.text }]);
  }

  return (
    <div className="chat-box">
      <h3>Zuuma Chat</h3>
      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} className={\`msg \${m.type}\`}>{m.text}</div>
        ))}
      </div>
      <input
        placeholder="Введите сообщение..."
        onKeyDown={(e) => e.key === 'Enter' && handleSend(e.target.value)}
      />
    </div>
  );
}`;

  const nodeJsExample = `// Node.js: серверная интеграция через Express
const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

const CHATBOT_API_KEY = process.env.CHATBOT_API_KEY;
const CHATBOT_BASE_URL = 'https://zuuma.ru/api/v1';

app.post('/api/chat', async (req, res) => {
  const { message, userId } = req.body;
  try {
    const response = await fetch(\`\${CHATBOT_BASE_URL}/chat\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${CHATBOT_API_KEY}\`
      },
      body: JSON.stringify({ message, user_id: userId })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка API' });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));`;

  return (
    <div className="tutorial-page">
      {/* Header */}
      <div className="tutorial-header">
        <div className="tutorial-header-content">
          <Link href="/tutorials" className="tutorial-back-link">
            <ArrowLeft size={20} /> Назад к туториалам
          </Link>

          <div className="tutorial-header-main">
            <div className="tutorial-icon-wrapper">
              <Zap className="tutorial-icon" size={32} />
            </div>
            <div>
              <h1 className="tutorial-title">JavaScript Integration</h1>
              <p className="tutorial-subtitle">
                Прямое подключение к API Zuuma через fetch / HTTP
              </p>

              <div className="beta-warning">
                ⚠️ API находится в <strong>бета-версии</strong>. Возможны ошибки и нестабильная работа.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="tutorial-content">

        {/* Базовая инициализация */}
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Базовая инициализация</h2>
          <p className="tutorial-text">
            Используем fetch для отправки сообщений к API:
          </p>
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">JavaScript</span>
              <button
                onClick={() => copyToClipboard(initExample, 1)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 1 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 1 ? "Скопировано!" : "Копировать"}
              </button>
            </div>
            <pre className="tutorial-code"><code>{initExample}</code></pre>
          </div>
        </div>

        {/* React пример */}
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Пример для React</h2>
          <p className="tutorial-text">
            Использование fetch в React-компоненте для чата:
          </p>
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">React</span>
              <button
                onClick={() => copyToClipboard(reactExample, 2)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 2 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 2 ? "Скопировано!" : "Копировать"}
              </button>
            </div>
            <pre className="tutorial-code"><code>{reactExample}</code></pre>
          </div>
        </div>

        {/* Node.js блок */}
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Серверная интеграция (Node.js)</h2>
          <p className="tutorial-text">
            Для серверной части можно использовать Node.js и Express для проксирования запросов к API:
          </p>
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Node.js</span>
              <button
                onClick={() => copyToClipboard(nodeJsExample, 3)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 3 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 3 ? "Скопировано!" : "Копировать"}
              </button>
            </div>
            <pre className="tutorial-code"><code>{nodeJsExample}</code></pre>
          </div>
        </div>

        {/* Следующие шаги */}
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Что дальше?</h2>
          <div className="tutorial-next-steps">
            <Link href="/tutorials/html-widget" className="tutorial-next-card">
              <Globe size={24} />
              <div>
                <h3>HTML Widget</h3>
                <p>Добавление чата без кода</p>
              </div>
            </Link>

            <Link href="/tutorials/json-config" className="tutorial-next-card">
              <Code size={24} />
              <div>
                <h3>JSON Configuration</h3>
                <p>Централизованная настройка бота</p>
              </div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
