"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Copy,
  CheckCircle,
  Zap,
  AlertCircle,
  Code,
  Database,
  Settings,
  Cloud,
  Shield,
  Brain,
} from "lucide-react";
import Link from "next/link";

export default function ApiFunctionsTutorial() {
  const [copiedCode, setCopiedCode] = useState<number | null>(null);

  const copyToClipboard = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedCode(index);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const exampleFunction = `{
  "name": "Получить погоду",
  "description": "Возвращает текущую погоду для указанного города",
  "endpoint_url": "https://api.openweathermap.org/data/2.5/weather?q={city}&appid={apiKey}&units=metric&lang=ru",
  "method": "GET",
  "headers": {
    "Content-Type": "application/json"
  },
  "parameters": [
    {
      "name": "city",
      "type": "string",
      "required": true,
      "description": "Название города для получения погоды",
      "defaultValue": "Moscow",
      "testValue": "London"
    }
  ]
}`;

  const dbFunction = `{
  "name": "Получить баланс клиента",
  "description": "Возвращает текущий баланс пользователя из внутренней базы данных",
  "endpoint_url": "https://api.company.com/db/user-balance?userId={userId}",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer {apiKey}"
  },
  "parameters": [
    {
      "name": "userId",
      "type": "string",
      "required": true,
      "description": "Уникальный идентификатор пользователя в БД"
    }
  ]
}`;

  const howAiUsesIt = `// Пример работы ИИ
Пользователь: "Сколько у меня сейчас на счету?"
🤖 AI анализирует описание функций и понимает,
что нужно вызвать функцию "Получить баланс клиента"
и автоматически подставляет userId из контекста.

// Результат:
AI → вызывает API: https://api.company.com/db/user-balance?userId=42
AI ← получает JSON: { "balance": 15300 }
AI → отвечает пользователю: "Ваш баланс — 15 300 рублей."`;

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
              <Zap className="tutorial-icon" size={32} />
            </div>
            <div>
              <h1 className="tutorial-title">
                API Функции — подключение внешних систем
              </h1>
              <p className="tutorial-subtitle">
                Научите вашего ассистента вызывать реальные API и получать
                данные из внешних источников
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="tutorial-content">
        <div className="tutorial-section" id="intro">
          <h2 className="tutorial-section-title">Что такое API функции?</h2>
          <p className="tutorial-text">
            API функции позволяют ассистенту взаимодействовать с внешними
            системами, базами данных и сервисами. Это делает его не просто
            чат-ботом, а полноценным <strong>оператором данных</strong>.
          </p>

          <div className="tutorial-info-box">
            <AlertCircle size={20} />
            <div>
              <strong>Важно:</strong> LLM сама решает, когда вызывать функцию,
              анализируя контекст диалога. Вы лишь описываете функцию и её
              параметры.
            </div>
          </div>
        </div>

        <div className="tutorial-section" id="weather">
          <h2 className="tutorial-section-title">Пример: Подключение к внешнему API</h2>
          <p className="tutorial-text">
            Допустим, вы хотите, чтобы бот умел сообщать актуальную погоду.
            Для этого создайте API функцию со структурой ниже:
          </p>

          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">JSON</span>
              <button
                onClick={() => copyToClipboard(exampleFunction, 1)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 1 ? (
                  <CheckCircle size={16} />
                ) : (
                  <Copy size={16} />
                )}
                {copiedCode === 1 ? "Скопировано!" : "Копировать"}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{exampleFunction}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section" id="db">
          <h2 className="tutorial-section-title">Пример: Запрос к базе данных клиента</h2>
          <p className="tutorial-text">
            API функции можно подключать не только к открытым API, но и к вашим
            внутренним сервисам — например, к CRM или MySQL-базе клиента через
            внутренний REST-эндпоинт.
          </p>

          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">JSON</span>
              <button
                onClick={() => copyToClipboard(dbFunction, 2)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 2 ? (
                  <CheckCircle size={16} />
                ) : (
                  <Copy size={16} />
                )}
                {copiedCode === 2 ? "Скопировано!" : "Копировать"}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{dbFunction}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section" id="ai-use">
          <h2 className="tutorial-section-title">Как ассистент вызывает функции</h2>
          <p className="tutorial-text">
            После создания функции, ассистент сможет автоматически использовать
            её при общении с пользователем:
          </p>

          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">LLM логика</span>
              <button
                onClick={() => copyToClipboard(howAiUsesIt, 3)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 3 ? (
                  <CheckCircle size={16} />
                ) : (
                  <Copy size={16} />
                )}
                {copiedCode === 3 ? "Скопировано!" : "Копировать"}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{howAiUsesIt}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section" id="table">
          <h2 className="tutorial-section-title">Структура API функции</h2>
          <div className="tutorial-table">
            <div className="tutorial-table-row tutorial-table-header">
              <div>Поле</div>
              <div>Описание</div>
              <div>Пример</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>name</code></div>
              <div>Имя функции</div>
              <div>Получить погоду</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>description</code></div>
              <div>Краткое описание действия функции</div>
              <div>Возвращает температуру и описание погоды</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>endpoint_url</code></div>
              <div>Адрес API с параметрами</div>
              <div>https://api.site.com/data/{'{param}'}</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>parameters</code></div>
              <div>Список входных параметров</div>
              <div>city, userId, token</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>headers</code></div>
              <div>HTTP заголовки (включая авторизацию)</div>
              <div>{'{"Authorization": "Bearer ..."}'}</div>
            </div>
          </div>
        </div>

        <div className="tutorial-section" id="security">
          <h2 className="tutorial-section-title">Безопасность</h2>
          <div className="tutorial-info-box">
            <Shield size={20} />
            <div>
              <strong>Не передавайте ключи в URL!</strong>
              Используйте заголовки или защищённые proxy-эндпоинты для
              авторизации.
            </div>
          </div>
          <p className="tutorial-text">
            Пример безопасного подхода — скрывать API ключи в заголовках:
          </p>
          <pre className="tutorial-code">
            <code>
              {`"headers": { "Authorization": "Bearer {apiKey}" }`}
            </code>
          </pre>
        </div>

        <div className="tutorial-section" id="next">
          <h2 className="tutorial-section-title">Что дальше?</h2>
          <div className="tutorial-next-steps">
            <Link href="/assistants/functions" className="tutorial-next-card">
              <Settings size={24} />
              <div>
                <h3>Создать API функцию</h3>
                <p>Откройте конструктор функций и добавьте свой API</p>
              </div>
            </Link>

            <Link href="/tutorials/efficient-training" className="tutorial-next-card">
              <Brain size={24} />
              <div>
                <h3>Эффективное обучение</h3>
                <p>Узнайте, как научить ассистента использовать функции осмысленно</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
