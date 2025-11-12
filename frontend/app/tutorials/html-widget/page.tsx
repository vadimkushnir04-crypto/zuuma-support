"use client";

import { useState } from "react";
import { ArrowLeft, Copy, CheckCircle, Code, Zap, Globe } from "lucide-react";
import Link from "next/link";

export default function HtmlWidgetTutorial() {
  const [copiedCode, setCopiedCode] = useState<number | null>(null);

  const copyToClipboard = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(index);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // === Пример полного HTML-файла ===
  const codeExample1 = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>AI ассистент на сайте</title>
</head>
<body>
  <h1>Добро пожаловать!</h1>

  <!-- Конфигурация чата -->
  <script>
    window.chatConfig = {
      apiKey: 'YOUR_API_KEY', // 🔑 обязательный параметр
      serverUrl: 'https://zuuma.ru/api',
      theme: 'dark',
      assistantName: 'AI Agent',
      customGreeting: 'Привет! Чем могу помочь?',
      primaryColor: '#de8434',
      accentColor: '#1A1A2E',
      autoOpen: false,
      alwaysVisible: true,
      hideUntilUsed: false,
    };
  </script>

  <!-- Подключение виджета -->
  <script src="https://zuuma.ru/chat-widget.js"></script>
</body>
</html>`;

  // === Пример только конфигурации ===
  const codeExample2 = `window.chatConfig = {
  apiKey: 'YOUR_API_KEY',
  serverUrl: 'https://zuuma.ru/api',
  theme: 'light', // варианты: light | dark
  assistantName: 'Support Bot',
  customGreeting: 'Здравствуйте! Чем могу помочь?',
  primaryColor: '#ff914d',
  accentColor: '#1A1A2E',
  autoOpen: true, // автоматически открывать чат
  alwaysVisible: true, // показывать иконку чата постоянно
  hideUntilUsed: false, // скрывать до первого использования
};`;

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
                Добавьте чат-ассистента на любой сайт с помощью одной строки кода
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="tutorial-content">
        {/* Что такое HTML Widget */}
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Что такое HTML Widget?</h2>
          <p className="tutorial-text">
            HTML Widget — это самый простой способ встроить чат-ассистента Zuuma
            на ваш сайт. Просто добавьте скрипт и настройте внешний вид с помощью параметров.
            Инициализация выполняется автоматически — без вызова функций.
          </p>
        </div>

        {/* Быстрый старт */}
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Быстрый старт</h2>

          <div className="tutorial-steps">
            <div className="tutorial-step">
              <div className="tutorial-step-number">1</div>
              <div className="tutorial-step-content">
                <h3>Получите API ключ</h3>
                <p>
                  Войдите в ваш личный кабинет на{" "}
                  <a href="https://zuuma.ru" target="_blank" className="tutorial-link">
                    zuuma.ru
                  </a>{" "}
                  и скопируйте API ключ вашего ассистента.
                </p>
              </div>
            </div>

            <div className="tutorial-step">
              <div className="tutorial-step-number">2</div>
              <div className="tutorial-step-content">
                <h3>Добавьте код на сайт</h3>
                <p>
                  Вставьте конфигурацию и подключите скрипт <code>chat-widget.js</code>{" "}
                  перед закрывающим тегом <code>&lt;/body&gt;</code>.
                </p>
              </div>
            </div>

            <div className="tutorial-step">
              <div className="tutorial-step-number">3</div>
              <div className="tutorial-step-content">
                <h3>Настройте внешний вид</h3>
                <p>
                  Измените тему, имя ассистента, цвета и поведение под ваш бренд.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Пример кода */}
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Пример полного HTML-файла</h2>

          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">HTML</span>
              <button
                onClick={() => copyToClipboard(codeExample1, 1)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 1 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 1 ? "Скопировано!" : "Копировать"}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{codeExample1}</code>
            </pre>
          </div>
        </div>

        {/* Настройка */}
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Настройка конфигурации</h2>
          <p className="tutorial-text">
            Настройки передаются через объект <code>window.chatConfig</code> до подключения
            скрипта. После этого виджет автоматически загрузится и подключится к вашему ассистенту.
          </p>

          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">JavaScript</span>
              <button
                onClick={() => copyToClipboard(codeExample2, 2)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 2 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 2 ? "Скопировано!" : "Копировать"}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{codeExample2}</code>
            </pre>
          </div>
        </div>

        {/* Таблица параметров */}
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
              <div>API ключ вашего ассистента (обязательный)</div>
            </div>

            <div className="tutorial-table-row">
              <div><code>serverUrl</code></div>
              <div>string</div>
              <div>URL сервера API. По умолчанию: <code>https://zuuma.ru/api</code></div>
            </div>

            <div className="tutorial-table-row">
              <div><code>theme</code></div>
              <div>string</div>
              <div>Тема оформления: <code>light</code> или <code>dark</code></div>
            </div>

            <div className="tutorial-table-row">
              <div><code>assistantName</code></div>
              <div>string</div>
              <div>Имя, отображаемое в заголовке окна чата</div>
            </div>

            <div className="tutorial-table-row">
              <div><code>customGreeting</code></div>
              <div>string</div>
              <div>Приветственное сообщение при открытии</div>
            </div>

            <div className="tutorial-table-row">
              <div><code>primaryColor</code></div>
              <div>string</div>
              <div>Основной цвет (например, кнопки отправки)</div>
            </div>

            <div className="tutorial-table-row">
              <div><code>accentColor</code></div>
              <div>string</div>
              <div>Акцентный цвет интерфейса</div>
            </div>

            <div className="tutorial-table-row">
              <div><code>autoOpen</code></div>
              <div>boolean</div>
              <div>Автоматически открывать чат при загрузке страницы</div>
            </div>

            <div className="tutorial-table-row">
              <div><code>alwaysVisible</code></div>
              <div>boolean</div>
              <div>Показывать кнопку чата всегда, даже при закрытом окне</div>
            </div>

            <div className="tutorial-table-row">
              <div><code>hideUntilUsed</code></div>
              <div>boolean</div>
              <div>Скрывать кнопку до первого открытия пользователем</div>
            </div>
          </div>
        </div>

        {/* Что дальше */}
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Что дальше?</h2>
          <div className="tutorial-next-steps">
            <Link href="/tutorials/javascript" className="tutorial-next-card">
              <Zap size={24} />
              <div>
                <h3>JavaScript SDK</h3>
                <p>Используйте API чата напрямую из вашего кода</p>
              </div>
            </Link>

            <Link href="/tutorials/rag-training" className="tutorial-next-card">
              <Globe size={24} />
              <div>
                <h3>Обучение бота</h3>
                <p>Загрузите документы и обучите вашего ассистента</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
