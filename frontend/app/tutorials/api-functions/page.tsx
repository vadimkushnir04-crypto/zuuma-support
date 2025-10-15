"use client";

import { useState } from "react";
import { ArrowLeft, Copy, CheckCircle, Zap, AlertCircle, Code, Settings } from "lucide-react";
import Link from "next/link";

export default function ApiFunctionsTutorial() {
  const [copiedCode, setCopiedCode] = useState<number | null>(null);

  const copyToClipboard = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(index);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const exampleFunction = `{
  "name": "Получить погоду",
  "description": "Получает текущую погоду для указанного города",
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

  const exampleCode2 = `// Параметры функции:
// 1. name - имя параметра, которое будет использоваться в URL
// 2. type - тип данных (string, number, boolean)
// 3. required - обязательный параметр или нет
// 4. description - описание для LLM, чтобы он понимал когда использовать
// 5. defaultValue - значение по умолчанию для LLM
// 6. testValue - значение для ручного тестирования функции`;

  const exampleCode3 = `// Пример использования параметров в URL:
// До: https://api.example.com/users/{userId}/orders/{orderId}
// После: https://api.example.com/users/12345/orders/67890

// LLM автоматически заменит {userId} и {orderId} на реальные значения
// из контекста диалога с пользователем`;

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
              <h1 className="tutorial-title">Создание API Функций</h1>
              <p className="tutorial-subtitle">
                Подключайте внешние API к вашим ассистентам
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="tutorial-content">
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Что такое API функции?</h2>
          <p className="tutorial-text">
            API функции позволяют вашему ассистенту взаимодействовать с внешними сервисами и API. 
            Это значит, что бот может получать актуальные данные, совершать действия и интегрироваться 
            с любыми внешними системами - от погоды до CRM и баз данных.
          </p>
          <div className="tutorial-info-box">
            <AlertCircle size={20} />
            <div>
              <strong>Важно!</strong> LLM автоматически определяет, когда нужно вызвать функцию, 
              на основе описания функции и параметров. Чем точнее описание, тем лучше работает ассистент.
            </div>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Структура API функции</h2>
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">JSON</span>
              <button 
                onClick={() => copyToClipboard(exampleFunction, 1)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 1 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 1 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{exampleFunction}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Параметры функции</h2>
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">JavaScript</span>
              <button 
                onClick={() => copyToClipboard(exampleCode2, 2)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 2 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 2 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{exampleCode2}</code>
            </pre>
          </div>

          <div className="tutorial-table">
            <div className="tutorial-table-row tutorial-table-header">
              <div>Поле</div>
              <div>Описание</div>
              <div>Использование</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>name</code></div>
              <div>Имя параметра</div>
              <div>Используется в URL как {'{name}'}</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>type</code></div>
              <div>Тип данных</div>
              <div>string, number, boolean</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>description</code></div>
              <div>Описание для LLM</div>
              <div>Помогает LLM понять, когда использовать параметр</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>defaultValue</code></div>
              <div>Значение по умолчанию</div>
              <div>Используется LLM, если значение не указано</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>testValue</code></div>
              <div>Тестовое значение</div>
              <div>Используется только при ручном тестировании</div>
            </div>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Подстановка параметров в URL</h2>
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Example</span>
              <button 
                onClick={() => copyToClipboard(exampleCode3, 3)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 3 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 3 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{exampleCode3}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Пошаговая инструкция</h2>
          <div className="tutorial-steps">
            <div className="tutorial-step">
              <div className="tutorial-step-number">1</div>
              <div className="tutorial-step-content">
                <h3>Создайте функцию</h3>
                <p>Перейдите в раздел "API Функции" и нажмите "Создать функцию"</p>
              </div>
            </div>
            
            <div className="tutorial-step">
              <div className="tutorial-step-number">2</div>
              <div className="tutorial-step-content">
                <h3>Заполните основные данные</h3>
                <p>Укажите название, описание, URL эндпоинта и HTTP метод</p>
              </div>
            </div>
            
            <div className="tutorial-step">
              <div className="tutorial-step-number">3</div>
              <div className="tutorial-step-content">
                <h3>Добавьте параметры</h3>
                <p>Создайте параметры, которые будут использоваться в запросе. Укажите тестовые значения для проверки</p>
              </div>
            </div>

            <div className="tutorial-step">
              <div className="tutorial-step-number">4</div>
              <div className="tutorial-step-content">
                <h3>Протестируйте функцию</h3>
                <p>Используйте кнопку "Тестировать" с тестовыми значениями параметров</p>
              </div>
            </div>

            <div className="tutorial-step">
              <div className="tutorial-step-number">5</div>
              <div className="tutorial-step-content">
                <h3>Назначьте ботам</h3>
                <p>Назначьте функцию одному или нескольким ассистентам</p>
              </div>
            </div>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Примеры использования</h2>
          
          <div className="tutorial-example-card">
            <h3>Проверка погоды</h3>
            <p>Бот может отвечать на вопросы о погоде, вызывая API OpenWeatherMap</p>
            <div className="tutorial-example-tags">
              <span className="tutorial-tag">GET</span>
              <span className="tutorial-tag">Публичное API</span>
            </div>
          </div>

          <div className="tutorial-example-card">
            <h3>Проверка статуса заказа</h3>
            <p>Интеграция с вашей CRM для получения информации о заказах клиента</p>
            <div className="tutorial-example-tags">
              <span className="tutorial-tag">POST</span>
              <span className="tutorial-tag">Приватное API</span>
              <span className="tutorial-tag">Авторизация</span>
            </div>
          </div>

          <div className="tutorial-example-card">
            <h3>Создание тикета</h3>
            <p>Автоматическое создание заявок в вашей системе поддержки</p>
            <div className="tutorial-example-tags">
              <span className="tutorial-tag">POST</span>
              <span className="tutorial-tag">Webhook</span>
            </div>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Лучшие практики</h2>
          <div className="tutorial-best-practices">
            <div className="tutorial-practice-item">
              <CheckCircle size={20} className="practice-icon" />
              <div>
                <strong>Подробные описания</strong>
                <p>Чем точнее описание функции и параметров, тем лучше LLM понимает, когда их использовать</p>
              </div>
            </div>

            <div className="tutorial-practice-item">
              <CheckCircle size={20} className="practice-icon" />
              <div>
                <strong>Тестовые значения</strong>
                <p>Всегда указывайте тестовые значения для удобной проверки работы функции</p>
              </div>
            </div>

            <div className="tutorial-practice-item">
              <CheckCircle size={20} className="practice-icon" />
              <div>
                <strong>Безопасность</strong>
                <p>Храните API ключи в заголовках, не передавайте их в URL параметрах</p>
              </div>
            </div>

            <div className="tutorial-practice-item">
              <CheckCircle size={20} className="practice-icon" />
              <div>
                <strong>Обработка ошибок</strong>
                <p>Убедитесь, что ваш API возвращает понятные сообщения об ошибках</p>
              </div>
            </div>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Что дальше?</h2>
          <div className="tutorial-next-steps">
            <Link href="/assistants/functions" className="tutorial-next-card">
              <Zap size={24} />
              <div>
                <h3>Создать API функцию</h3>
                <p>Перейти к созданию вашей первой функции</p>
              </div>
            </Link>
            
            <Link href="/tutorials/rag-training" className="tutorial-next-card">
              <Code size={24} />
              <div>
                <h3>Обучение ассистента</h3>
                <p>Узнайте, как обучить бота работать с функциями</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}