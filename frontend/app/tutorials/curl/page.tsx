"use client";

import { useState } from "react";
import { ArrowLeft, Copy, CheckCircle, Terminal, Code, BookOpen, Zap } from "lucide-react";
import Link from "next/link";

export default function CurlTutorial() {
  const [copiedCode, setCopiedCode] = useState<number | null>(null);

  const copyToClipboard = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(index);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const basicExample = `curl -X POST https://api.yourplatform.com/v1/chat \\
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
    "timestamp": "2024-03-15T10:30:00Z",
    "sources": []
  }
}`;

  const ragExample = `curl -X POST https://api.yourplatform.com/v1/chat \\
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

  const uploadExample = `curl -X POST https://api.yourplatform.com/v1/documents/upload \\
  -H "Authorization: Bearer your_api_key_here" \\
  -F "document=@/path/to/your/document.pdf" \\
  -F "metadata={\"category\":\"documentation\",\"version\":\"1.0\"}" \\
  -F "chunk_size=1000" \\
  -F "overlap=200"`;

  const historyExample = `curl -X GET "https://api.yourplatform.com/v1/sessions/sess_1234567890/history?limit=10" \\
  -H "Authorization: Bearer your_api_key_here"`;

  const sessionExample = `curl -X POST https://api.yourplatform.com/v1/sessions \\
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

# Настройки
API_KEY="your_api_key_here"
BASE_URL="https://api.yourplatform.com/v1"
USER_ID="bash_user"

# Функция для отправки сообщения
send_message() {
    local message="$1"
    local session_id="$2"
    
    curl -s -X POST "$BASE_URL/chat" \\
        -H "Content-Type: application/json" \\
        -H "Authorization: Bearer $API_KEY" \\
        -d "{
            \"message\": \"$message\",
            \"user_id\": \"$USER_ID\",
            \"session_id\": \"$session_id\"
        }"
}

# Функция для создания сессии
create_session() {
    curl -s -X POST "$BASE_URL/sessions" \\
        -H "Content-Type: application/json" \\
        -H "Authorization: Bearer $API_KEY" \\
        -d "{
            \"user_id\": \"$USER_ID\"
        }"
}

# Создаем сессию
echo "Создаем новую сессию..."
SESSION_RESPONSE=$(create_session)
SESSION_ID=$(echo "$SESSION_RESPONSE" | jq -r '.session_id')

echo "ID сессии: $SESSION_ID"
echo ""

# Основной цикл чата
while true; do
    echo -n "Вы: "
    read user_message
    
    if [ "$user_message" = "выход" ]; then
        echo "До свидания!"
        break
    fi
    
    echo "Бот печатает..."
    
    # Отправляем сообщение
    RESPONSE=$(send_message "$user_message" "$SESSION_ID")
    BOT_MESSAGE=$(echo "$RESPONSE" | jq -r '.response.text')
    
    echo "Бот: $BOT_MESSAGE"
    echo ""
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
                Прямая работа с API чат-бота через HTTP-запросы
              </p>
            </div>
          </div>
          
        </div>
      </div>

      {/* Content */}
      <div className="tutorial-content">
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Что такое cURL?</h2>
          <p className="tutorial-text">
            cURL — это инструмент командной строки для выполнения HTTP-запросов. 
            Он идеально подходит для тестирования API, автоматизации и интеграции 
            с системами, где нет готовых SDK.
          </p>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Базовый запрос</h2>
          <p className="tutorial-text">
            Простейший пример отправки сообщения боту:
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Bash</span>
              <button 
                onClick={() => copyToClipboard(basicExample, 1)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 1 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 1 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{basicExample}</code>
            </pre>
          </div>
          
          <p className="tutorial-text">
            <strong>Ответ от сервера:</strong>
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">JSON</span>
              <button 
                onClick={() => copyToClipboard(responseExample, 2)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 2 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 2 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{responseExample}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Запрос с использованием RAG</h2>
          <p className="tutorial-text">
            Как отправить запрос с поиском по загруженным документам:
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Bash</span>
              <button 
                onClick={() => copyToClipboard(ragExample, 3)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 3 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 3 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{ragExample}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Загрузка документов</h2>
          <p className="tutorial-text">
            Загрузка файлов для обучения RAG системы:
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Bash</span>
              <button 
                onClick={() => copyToClipboard(uploadExample, 4)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 4 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 4 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{uploadExample}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Работа с сессиями</h2>
          <p className="tutorial-text">
            Создание новой сессии для пользователя:
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Bash</span>
              <button 
                onClick={() => copyToClipboard(sessionExample, 5)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 5 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 5 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{sessionExample}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">История сообщений</h2>
          <p className="tutorial-text">
            Получение истории сообщений из сессии:
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Bash</span>
              <button 
                onClick={() => copyToClipboard(historyExample, 6)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 6 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 6 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{historyExample}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Bash скрипт для чата</h2>
          <p className="tutorial-text">
            Полноценный интерактивный чат-бот на Bash:
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Bash</span>
              <button 
                onClick={() => copyToClipboard(bashScript, 7)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 7 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 7 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{bashScript}</code>
            </pre>
          </div>
        </div>

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
              <div><code>/v1/sessions/&#123;id&#125;/history</code></div>
              <div>GET</div>
              <div>История сообщений сессии</div>
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

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Что дальше?</h2>
          <div className="tutorial-next-steps">
            <Link href="/tutorials/python" className="tutorial-next-card">
              <Code size={24} />
              <div>
                <h3>Python SDK</h3>
                <p>Удобная работа через Python SDK</p>
              </div>
            </Link>
            
            <Link href="/tutorials/nodejs" className="tutorial-next-card">
              <Terminal size={24} />
              <div>
                <h3>Node.js Integration</h3>
                <p>Серверная интеграция для JavaScript</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}