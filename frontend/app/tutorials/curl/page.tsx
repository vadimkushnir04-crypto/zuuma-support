"use client";

import { useState } from "react";
import { ArrowLeft, Copy, CheckCircle, Terminal, Code, Zap } from "lucide-react";
import Link from "next/link";

export default function CurlTutorial() {
  const [copiedCode, setCopiedCode] = useState<number | null>(null);

  const copyToClipboard = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(index);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Примеры запросов
  const basicExample = `curl -X POST https://zuuma.ru/api/v1/chat \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer your_api_key_here" \\
-d '{
  "message": "Привет! Как дела?",
  "user_id": "user_123"
}'`;

  const responseExample = `{
  "success": true,
  "response": {
    "text": "Привет! У меня всё отлично! Чем могу помочь?",
    "session_id": "sess_1234567890",
    "timestamp": "2025-03-15T10:30:00Z"
  }
}`;

  const ragExample = `curl -X POST https://zuuma.ru/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer your_api_key_here" \\
  -d '{
    "message": "Как подключить API?",
    "user_id": "user_123",
    "use_rag": true,
    "rag_params": {
      "categories": ["documentation"],
      "max_chunks": 5,
      "similarity_threshold": 0.7
    }
  }'`;

  const uploadExample = `curl -X POST https://zuuma.ru/api/v1/documents/upload \\
  -H "Authorization: Bearer your_api_key_here" \\
  -F "document=@/path/to/your/document.pdf" \\
  -F "metadata={\\"category\\":\\"docs\\",\\"version\\":\\"1.0\\"}" \\
  -F "chunk_size=1000" \\
  -F "overlap=200"`;

  const sessionExample = `curl -X POST https://zuuma.ru/api/v1/sessions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer your_api_key_here" \\
  -d '{
    "user_id": "user_123",
    "metadata": {
      "platform": "web",
      "version": "1.0"
    }
  }'`;

  const bashScript = `#!/bin/bash

API_KEY="your_api_key_here"
BASE_URL="https://zuuma.ru/api/v1"
USER_ID="bash_user"

send_message() {
    local message="$1"
    local session_id="$2"
    curl -s -X POST "$BASE_URL/chat" \\
        -H "Content-Type: application/json" \\
        -H "Authorization: Bearer $API_KEY" \\
        -d "{
            \\"message\\": \\"$message\\",
            \\"user_id\\": \\"$USER_ID\\",
            \\"session_id\\": \\"$session_id\\"
        }"
}

create_session() {
    curl -s -X POST "$BASE_URL/sessions" \\
        -H "Content-Type: application/json" \\
        -H "Authorization: Bearer $API_KEY" \\
        -d "{
            \\"user_id\\": \\"$USER_ID\\"
        }"
}

echo "Создаем сессию..."
SESSION_RESPONSE=$(create_session)
SESSION_ID=$(echo "$SESSION_RESPONSE" | jq -r '.session_id')
echo "ID сессии: $SESSION_ID"

while true; do
    echo -n "Вы: "
    read user_message
    [[ "$user_message" == "выход" ]] && echo "Пока!" && break
    RESPONSE=$(send_message "$user_message" "$SESSION_ID")
    BOT_MESSAGE=$(echo "$RESPONSE" | jq -r '.response.text')
    echo "Бот: $BOT_MESSAGE"
done`;

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
              <h1 className="tutorial-title">REST API с cURL</h1>
              <p className="tutorial-subtitle">
                Отправляйте HTTP-запросы напрямую к API Zuuma
              </p>

              {/* ⚠️ Beta notice */}
              <div className="beta-warning">
                ⚠️ API находится в <strong>бета-версии</strong>. Возможны ошибки и нестабильная работа.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="tutorial-content">
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Быстрый старт</h2>
          <p className="tutorial-text">
            Все запросы выполняются на <code>https://zuuma.ru/api/v1</code> и требуют
            заголовок авторизации:
          </p>
          <pre className="tutorial-code">
            <code>Authorization: Bearer your_api_key_here</code>
          </pre>
        </div>

        {/* Базовый запрос */}
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Отправка сообщения</h2>
          <p className="tutorial-text">Пример простого запроса к боту:</p>
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Bash</span>
              <button
                onClick={() => copyToClipboard(basicExample, 1)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 1 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 1 ? "Скопировано!" : "Копировать"}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{basicExample}</code>
            </pre>
          </div>

          <p className="tutorial-text">Пример ответа:</p>
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">JSON</span>
              <button
                onClick={() => copyToClipboard(responseExample, 2)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 2 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 2 ? "Скопировано!" : "Копировать"}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{responseExample}</code>
            </pre>
          </div>
        </div>

        {/* RAG */}
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">RAG-запрос</h2>
          <p className="tutorial-text">
            Чтобы бот использовал ваши документы, добавьте параметр <code>use_rag: true</code>:
          </p>
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Bash</span>
              <button
                onClick={() => copyToClipboard(ragExample, 3)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 3 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 3 ? "Скопировано!" : "Копировать"}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{ragExample}</code>
            </pre>
          </div>
        </div>

        {/* Загрузка документов */}
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Загрузка документов</h2>
          <p className="tutorial-text">Добавьте файл в базу знаний вашего бота:</p>
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Bash</span>
              <button
                onClick={() => copyToClipboard(uploadExample, 4)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 4 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 4 ? "Скопировано!" : "Копировать"}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{uploadExample}</code>
            </pre>
          </div>
        </div>

        {/* Сессии */}
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Создание сессии</h2>
          <p className="tutorial-text">
            Используйте этот endpoint для создания новой сессии пользователя:
          </p>
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Bash</span>
              <button
                onClick={() => copyToClipboard(sessionExample, 5)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 5 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 5 ? "Скопировано!" : "Копировать"}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{sessionExample}</code>
            </pre>
          </div>
        </div>

        {/* Bash чат */}
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Пример Bash-бота</h2>
          <p className="tutorial-text">
            Вы можете реализовать консольного ассистента на чистом Bash:
          </p>
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Bash</span>
              <button
                onClick={() => copyToClipboard(bashScript, 6)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 6 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 6 ? "Скопировано!" : "Копировать"}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{bashScript}</code>
            </pre>
          </div>
        </div>

        {/* Таблица эндпоинтов */}
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Основные endpoints</h2>
          <div className="tutorial-table">
            <div className="tutorial-table-row tutorial-table-header">
              <div>Endpoint</div>
              <div>Метод</div>
              <div>Описание</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>/v1/chat</code></div>
              <div>POST</div>
              <div>Отправка сообщения боту</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>/v1/sessions</code></div>
              <div>POST</div>
              <div>Создание новой сессии</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>/v1/documents/upload</code></div>
              <div>POST</div>
              <div>Загрузка документов для RAG</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>/v1/documents</code></div>
              <div>GET</div>
              <div>Список загруженных документов</div>
            </div>
          </div>
        </div>

        {/* Что дальше */}
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Что дальше?</h2>
          <div className="tutorial-next-steps">
            <Link href="/tutorials/python" className="tutorial-next-card">
              <Code size={24} />
              <div>
                <h3>Python SDK</h3>
                <p>Быстрая интеграция через Python</p>
              </div>
            </Link>

            <Link href="/tutorials/nodejs" className="tutorial-next-card">
              <Zap size={24} />
              <div>
                <h3>Node.js SDK</h3>
                <p>Серверная интеграция на JavaScript</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
