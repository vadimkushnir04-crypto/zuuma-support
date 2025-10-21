"use client";

import { useState } from "react";
import { ArrowLeft, Copy, CheckCircle, Code, Globe, Zap, BookOpen } from "lucide-react";
import Link from "next/link";

export default function HtmlWidgetTutorial() {
  const [copiedCode, setCopiedCode] = useState<number | null>(null);

  const copyToClipboard = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(index);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExample1 = `<!DOCTYPE html>
<html>
<head>
    <title>Мой сайт с ассистентом</title>
</head>
<body>
    <h1>Добро пожаловать на сайт!</h1>
    
    <!-- Виджет ассистента -->
    <script src="https://zuuma.ru/chat-widget.js"></script>
    <script>
        ChatWidget.init({
            apiKey: 'your_api_key_here',
            theme: 'light',
            position: 'bottom-right'
        });
    </script>
</body>
</html>`;

  const codeExample2 = `<script>
ChatWidget.init({
    apiKey: 'your_api_key_here',
    theme: 'dark', // light, dark, auto
    position: 'bottom-right', // bottom-left, bottom-right
    greeting: 'Привет! Как дела?',
    placeholder: 'Введите ваше сообщение...',
    width: '400px',
    height: '600px'
});
</script>`;

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
              <h1 className="tutorial-title">HTML Widget Integration</h1>
              <p className="tutorial-subtitle">
                Простое встраивание чат-бота на ваш сайт
              </p>
            </div>
          </div>
          
        </div>
      </div>

      {/* Content */}
      <div className="tutorial-content">
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Что такое HTML Widget?</h2>
          <p className="tutorial-text">
            HTML Widget — это самый простой способ добавить чат-бота на ваш сайт. 
            Всего несколько строк кода, и ваши посетители смогут общаться с ассистентом 
            прямо на странице.
          </p>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Быстрый старт</h2>
          <div className="tutorial-steps">
            <div className="tutorial-step">
              <div className="tutorial-step-number">1</div>
              <div className="tutorial-step-content">
                <h3>Получите API ключ</h3>
                <p>Войдите в личный кабинет и скопируйте API ключ вашего бота</p>
              </div>
            </div>
            
            <div className="tutorial-step">
              <div className="tutorial-step-number">2</div>
              <div className="tutorial-step-content">
                <h3>Добавьте скрипт на сайт</h3>
                <p>Вставьте код виджета перед закрывающим тегом &lt;/body&gt;</p>
              </div>
            </div>
            
            <div className="tutorial-step">
              <div className="tutorial-step-number">3</div>
              <div className="tutorial-step-content">
                <h3>Настройте внешний вид</h3>
                <p>Измените тему, положение и другие параметры виджета</p>
              </div>
            </div>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Пример кода</h2>
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">HTML</span>
              <button 
                onClick={() => copyToClipboard(codeExample1, 1)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 1 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 1 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{codeExample1}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Настройка виджета</h2>
          <p className="tutorial-text">
            Вы можете настроить внешний вид и поведение виджета через параметры конфигурации:
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">JavaScript</span>
              <button 
                onClick={() => copyToClipboard(codeExample2, 2)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 2 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 2 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{codeExample2}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Параметры конфигурации</h2>
          <div className="tutorial-table">
            <div className="tutorial-table-row tutorial-table-header">
              <div>Параметр</div>
              <div>Тип</div>
              <div>Описание</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>apiKey</code></div>
              <div>string</div>
              <div>API ключ вашего бота (обязательный)</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>theme</code></div>
              <div>string</div>
              <div>Тема оформления: light, dark, auto</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>position</code></div>
              <div>string</div>
              <div>Позиция: bottom-right, bottom-left</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>greeting</code></div>
              <div>string</div>
              <div>Приветственное сообщение</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>placeholder</code></div>
              <div>string</div>
              <div>Текст в поле ввода</div>
            </div>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Что дальше?</h2>
          <div className="tutorial-next-steps">
            <Link href="/tutorials/javascript" className="tutorial-next-card">
              <Zap size={24} />
              <div>
                <h3>JavaScript SDK</h3>
                <p>Расширенная интеграция с больше возможностей</p>
              </div>
            </Link>
            
            <Link href="/tutorials/rag-training" className="tutorial-next-card">
              <Globe size={24} />
              <div>
                <h3>Обучение бота</h3>
                <p>Как загрузить знания и настроить RAG</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}