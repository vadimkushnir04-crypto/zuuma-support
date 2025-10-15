"use client";

import { useState } from "react";
import { ArrowLeft, Copy, CheckCircle, Code, Terminal, Zap, BookOpen } from "lucide-react";
import Link from "next/link";

export default function PythonTutorial() {
  const [copiedCode, setCopiedCode] = useState<number | null>(null);

  const copyToClipboard = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(index);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const installCode = `pip install chatbot-sdk`;

  const basicExample = `from chatbot_sdk import ChatBot

# Инициализация бота
bot = ChatBot(api_key="your_api_key_here")

# Отправка сообщения
response = bot.send_message("Привет! Как дела?")
print(response.text)`;

  const advancedExample = `from chatbot_sdk import ChatBot, Session
import asyncio

class MyChatBot:
    def __init__(self, api_key):
        self.bot = ChatBot(
            api_key=api_key,
            timeout=30,
            max_retries=3
        )
    
    async def chat_session(self, user_id):
        # Создаем сессию для пользователя
        session = Session(user_id=user_id)
        
        while True:
            user_input = input("Вы: ")
            if user_input.lower() == 'выход':
                break
                
            try:
                response = await self.bot.send_message_async(
                    message=user_input,
                    session=session,
                    context={"user_id": user_id}
                )
                print(f"Бот: {response.text}")
                
            except Exception as e:
                print(f"Ошибка: {e}")

# Использование
async def main():
    bot = MyChatBot("your_api_key_here")
    await bot.chat_session("user_123")

asyncio.run(main())`;

  const flaskExample = `from flask import Flask, request, jsonify
from chatbot_sdk import ChatBot

app = Flask(__name__)
bot = ChatBot(api_key="your_api_key_here")

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    message = data.get('message')
    user_id = data.get('user_id', 'anonymous')
    
    try:
        response = bot.send_message(
            message=message,
            user_id=user_id
        )
        
        return jsonify({
            'success': True,
            'response': response.text,
            'session_id': response.session_id
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True)`;

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
              <Code className="tutorial-icon" size={32} />
            </div>
            <div>
              <h1 className="tutorial-title">Python SDK</h1>
              <p className="tutorial-subtitle">
                Интеграция чат-бота в Python приложения
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
            Python SDK предоставляет удобный интерфейс для работы с API чат-бота. 
            Поддерживает синхронные и асинхронные запросы, управление сессиями и обработку ошибок.
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
            Простой пример отправки сообщения боту и получения ответа:
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Python</span>
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
          <h2 className="tutorial-section-title">Продвинутый пример с сессиями</h2>
          <p className="tutorial-text">
            Пример создания чат-бота с поддержкой сессий и асинхронных запросов:
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Python</span>
              <button 
                onClick={() => copyToClipboard(advancedExample, 3)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 3 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 3 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{advancedExample}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Интеграция с Flask</h2>
          <p className="tutorial-text">
            Создание веб-API для чат-бота с использованием Flask:
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Python</span>
              <button 
                onClick={() => copyToClipboard(flaskExample, 4)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 4 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 4 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{flaskExample}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Основные методы SDK</h2>
          <div className="tutorial-table">
            <div className="tutorial-table-row tutorial-table-header">
              <div>Метод</div>
              <div>Описание</div>
              <div>Параметры</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>send_message()</code></div>
              <div>Отправка сообщения боту</div>
              <div>message, user_id, context</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>send_message_async()</code></div>
              <div>Асинхронная отправка</div>
              <div>message, session, context</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>create_session()</code></div>
              <div>Создание новой сессии</div>
              <div>user_id, metadata</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>get_history()</code></div>
              <div>История сообщений</div>
              <div>session_id, limit</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>upload_document()</code></div>
              <div>Загрузка документа для RAG</div>
              <div>file_path, metadata</div>
            </div>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Обработка ошибок</h2>
          <div className="tutorial-steps">
            <div className="tutorial-step">
              <div className="tutorial-step-number">1</div>
              <div className="tutorial-step-content">
                <h3>APIError</h3>
                <p>Ошибки API (неверный ключ, лимиты запросов)</p>
              </div>
            </div>
            
            <div className="tutorial-step">
              <div className="tutorial-step-number">2</div>
              <div className="tutorial-step-content">
                <h3>NetworkError</h3>
                <p>Проблемы с сетевым соединением</p>
              </div>
            </div>
            
            <div className="tutorial-step">
              <div className="tutorial-step-number">3</div>
              <div className="tutorial-step-content">
                <h3>TimeoutError</h3>
                <p>Превышение времени ожидания ответа</p>
              </div>
            </div>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Что дальше?</h2>
          <div className="tutorial-next-steps">
            <Link href="/tutorials/nodejs" className="tutorial-next-card">
              <Terminal size={24} />
              <div>
                <h3>Node.js Integration</h3>
                <p>Серверная интеграция для JavaScript</p>
              </div>
            </Link>
            
            <Link href="/tutorials/rag-training" className="tutorial-next-card">
              <Zap size={24} />
              <div>
                <h3>Обучение RAG</h3>
                <p>Как загрузить знания и обучить бота</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}