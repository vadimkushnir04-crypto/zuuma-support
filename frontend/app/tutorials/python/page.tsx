"use client";

import { useState } from "react";
import { ArrowLeft, Copy, CheckCircle, Code, Terminal, Zap } from "lucide-react";
import Link from "next/link";

export default function PythonTutorial() {
  const [copiedCode, setCopiedCode] = useState<number | null>(null);

  const copyToClipboard = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(index);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // 🔹 Синхронный пример через requests
  const syncExample = `import requests

API_KEY = "your_api_key_here"
SERVER_URL = "https://zuuma.ru/api/v1/chat"

def send_message(message, user_id="python_user"):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    data = {"message": message, "user_id": user_id}
    res = requests.post(SERVER_URL, json=data, headers=headers)
    return res.json()

resp = send_message("Привет, Zuuma!")
print(resp["response"]["text"])`;

  // 🔹 Асинхронный пример через httpx
  const asyncExample = `import httpx
import asyncio

API_KEY = "your_api_key_here"
SERVER_URL = "https://zuuma.ru/api/v1/chat"

async def send_message_async(message, user_id="python_user"):
    async with httpx.AsyncClient() as client:
        res = await client.post(
            SERVER_URL,
            json={"message": message, "user_id": user_id},
            headers={"Authorization": f"Bearer {API_KEY}"}
        )
        return res.json()

resp = asyncio.run(send_message_async("Привет, Zuuma!"))
print(resp["response"]["text"])`;

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
              <Code className="tutorial-icon" size={32} />
            </div>
            <div>
              <h1 className="tutorial-title">Python Integration</h1>
              <p className="tutorial-subtitle">
                Прямое подключение к API Zuuma через HTTP-запросы
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

        {/* Установка */}
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Установка</h2>
          <p className="tutorial-text">
            Для работы с API используйте библиотеку <code>requests</code> (синхронно) или <code>httpx</code> (асинхронно):
          </p>
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Bash</span>
              <button
                onClick={() => copyToClipboard("pip install requests httpx", 1)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 1 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 1 ? "Скопировано!" : "Копировать"}
              </button>
            </div>
            <pre className="tutorial-code"><code>pip install requests httpx</code></pre>
          </div>
        </div>

        {/* Синхронный пример */}
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Синхронный пример</h2>
          <p className="tutorial-text">Отправка сообщения через requests:</p>
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Python</span>
              <button
                onClick={() => copyToClipboard(syncExample, 2)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 2 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 2 ? "Скопировано!" : "Копировать"}
              </button>
            </div>
            <pre className="tutorial-code"><code>{syncExample}</code></pre>
          </div>
        </div>

        {/* Асинхронный пример */}
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Асинхронный пример</h2>
          <p className="tutorial-text">Отправка сообщения через httpx с async/await:</p>
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Python</span>
              <button
                onClick={() => copyToClipboard(asyncExample, 3)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 3 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 3 ? "Скопировано!" : "Копировать"}
              </button>
            </div>
            <pre className="tutorial-code"><code>{asyncExample}</code></pre>
          </div>
        </div>

        {/* Что дальше */}
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Что дальше?</h2>
          <div className="tutorial-next-steps">
            <Link href="/tutorials/nodejs" className="tutorial-next-card">
              <Terminal size={24} />
              <div>
                <h3>Node.js Integration</h3>
                <p>Серверная интеграция с API</p>
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
