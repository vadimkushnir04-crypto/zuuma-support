"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Copy,
  CheckCircle,
  Brain,
  AlertTriangle,
  TrendingDown,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";

export default function EfficientTrainingTutorial() {
  const [copiedCode, setCopiedCode] = useState<number | null>(null);
  const [showDoc, setShowDoc] = useState(false);

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

  const badExample = `Вопрос клиента: "Какая у вас цена на доставку?"
❌ ПЛОХОЙ ответ (расточительный):
"Здравствуйте! ..."`

  const goodExample = `✅ ХОРОШИЙ ответ (экономный):
"Доставка по городу - 300₽, за город - от 500₽.
При заказе от 3000₽ доставка бесплатно.
Нужна доставка?"`

  const trainingDoc = `# Правила ответов ассистента
## Стиль общения
- Отвечай кратко и по делу
- Избегай длинных приветствий
- Не повторяй вопрос клиента
- Убирай лишнюю вежливость
...
ВАЖНО: Каждый символ стоит денег. Будь максимально эффективным!`;

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
              <Brain className="tutorial-icon" size={32} />
            </div>
            <div>
              <h1 className="tutorial-title">
                Эффективное обучение AI-ассистента (оптимизация токенов)
              </h1>
              <p className="tutorial-subtitle">
                Как сделать вашего бота умнее, быстрее и экономнее
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="tutorial-content">
        {/* Почему важно */}
        <div className="tutorial-section" id="why-it-matters">
          <h2 className="tutorial-section-title">Почему это важно?</h2>
          <div className="tutorial-warning-box">
            <TrendingDown size={24} />
            <div>
              <strong>Проблема: избыточные ответы = большие расходы</strong>
              <p>
                LLM-модели тарифицируются по токенам. Длинный ответ может стоить
                в <strong>10–20 раз дороже</strong> короткого.
              </p>
            </div>
          </div>

          <div className="tutorial-stats-grid">
            <div className="tutorial-stat-card">
              <div className="tutorial-stat-value">10–20x</div>
              <div className="tutorial-stat-label">Экономия токенов</div>
            </div>
            <div className="tutorial-stat-card">
              <div className="tutorial-stat-value">80%</div>
              <div className="tutorial-stat-label">Снижение затрат</div>
            </div>
            <div className="tutorial-stat-card">
              <div className="tutorial-stat-value">2–3x</div>
              <div className="tutorial-stat-label">Быстрее ответы</div>
            </div>
          </div>
        </div>

        {/* Примеры */}
        <div className="tutorial-section" id="examples">
          <h2 className="tutorial-section-title">Сравнение подходов</h2>

          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Плохой пример</span>
              <button
                onClick={() => copyToClipboard(badExample, 1)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 1 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 1 ? "Скопировано!" : "Копировать"}
              </button>
            </div>
            <pre className="tutorial-code" style={{ fontSize: "13px" }}>
              <code>{badExample}</code>
            </pre>
          </div>

          <div className="tutorial-code-block" style={{ marginTop: "20px" }}>
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Хороший пример</span>
              <button
                onClick={() => copyToClipboard(goodExample, 2)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 2 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 2 ? "Скопировано!" : "Копировать"}
              </button>
            </div>
            <pre className="tutorial-code" style={{ fontSize: "13px" }}>
              <code>{goodExample}</code>
            </pre>
          </div>
        </div>

        {/* Документ */}
        <div className="tutorial-section" id="training-doc">
          <h2 className="tutorial-section-title">Документ для обучения</h2>
          <p className="tutorial-text">
            Создайте документ с правилами и загрузите его в раздел{" "}
            <Link href="/assistants/education" className="tutorial-link">
              Обучение ассистента
            </Link>.
          </p>

          <button
            className="tutorial-toggle-btn"
            onClick={() => setShowDoc(!showDoc)}
            style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}
          >
            {showDoc ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showDoc ? "Скрыть документ" : "Показать документ"}
          </button>

          {showDoc && (
            <div className="tutorial-code-block">
              <div className="tutorial-code-header">
                <span className="tutorial-code-language">Markdown</span>
                <button
                  onClick={() => copyToClipboard(trainingDoc, 3)}
                  className="tutorial-copy-btn"
                >
                  {copiedCode === 3 ? <CheckCircle size={16} /> : <Copy size={16} />}
                  {copiedCode === 3 ? "Скопировано!" : "Копировать"}
                </button>
              </div>
              <pre className="tutorial-code" style={{ fontSize: "12px", maxHeight: "400px", overflow: "auto", wordBreak: "break-word" }}>
                <code>{trainingDoc}</code>
              </pre>
            </div>
          )}
        </div>

          <div className="tutorial-code-block" style={{ marginTop: '20px' }}>
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Хороший пример</span>
              <button 
                onClick={() => copyToClipboard(goodExample, 2)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 2 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 2 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code" style={{ fontSize: '13px' }}>
              <code>{goodExample}</code>
            </pre>
          </div>
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Основные принципы экономного бота</h2>
          <div className="tutorial-principles-grid">
            <div className="tutorial-principle-card">
              <Sparkles size={24} className="principle-icon" />
              <h3>Краткость</h3>
              <p>Один вопрос - один короткий ответ. Без воды и лишних слов.</p>
            </div>

            <div className="tutorial-principle-card">
              <CheckCircle size={24} className="principle-icon" />
              <h3>Конкретика</h3>
              <p>Факты, цифры, действия. Никаких общих фраз и философии.</p>
            </div>

            <div className="tutorial-principle-card">
              <TrendingDown size={24} className="principle-icon" />
              <h3>Минимум вежливости</h3>
              <p>Уберите "Здравствуйте", "Благодарим", "Всего доброго" - это лишнее.</p>
            </div>

            <div className="tutorial-principle-card">
              <Brain size={24} className="principle-icon" />
              <h3>Умные вопросы</h3>
              <p>Вместо объяснений - задайте уточняющий вопрос.</p>
            </div>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Чек-лист эффективного обучения</h2>
          <div className="tutorial-checklist">
            <label className="tutorial-checklist-item">
              <input type="checkbox" />
              <span>Создан документ с правилами стиля общения</span>
            </label>
            <label className="tutorial-checklist-item">
              <input type="checkbox" />
              <span>Добавлены примеры ХОРОШИХ кратких ответов</span>
            </label>
            <label className="tutorial-checklist-item">
              <input type="checkbox" />
              <span>Добавлены примеры ПЛОХИХ длинных ответов</span>
            </label>
            <label className="tutorial-checklist-item">
              <input type="checkbox" />
              <span>Указаны ограничения по длине ответа</span>
            </label>
            <label className="tutorial-checklist-item">
              <input type="checkbox" />
              <span>Протестирован бот на реальных вопросах</span>
            </label>
            <label className="tutorial-checklist-item">
              <input type="checkbox" />
              <span>Проверена экономия токенов (сравните до/после)</span>
            </label>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Измерение результатов</h2>
          <div className="tutorial-metrics-box">
            <h3>Как понять, что обучение сработало?</h3>
            <ul>
              <li><strong>Средняя длина ответа:</strong> должна быть 100-300 символов</li>
              <li><strong>Количество токенов:</strong> снижение на 60-80%</li>
              <li><strong>Скорость ответа:</strong> в 2-3 раза быстрее</li>
              <li><strong>Удовлетворенность клиентов:</strong> не должна упасть</li>
            </ul>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Частые ошибки</h2>
          <div className="tutorial-errors-grid">
            <div className="tutorial-error-card">
              <AlertTriangle size={20} />
              <div>
                <strong>Слишком сухо</strong>
                <p>Баланс важен. Бот должен быть кратким, но не грубым.</p>
              </div>
            </div>

            <div className="tutorial-error-card">
              <AlertTriangle size={20} />
              <div>
                <strong>Нет примеров</strong>
                <p>LLM лучше учится на примерах, чем на правилах.</p>
              </div>
            </div>

            <div className="tutorial-error-card">
              <AlertTriangle size={20} />
              <div>
                <strong>Противоречия</strong>
                <p>Убедитесь, что все документы обучения согласованы.</p>
              </div>
            </div>

            <div className="tutorial-error-card">
              <AlertTriangle size={20} />
              <div>
                <strong>Не тестируете</strong>
                <p>Всегда проверяйте изменения на реальных диалогах.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Что дальше?</h2>
          <div className="tutorial-next-steps">
            <Link href="/assistants/education" className="tutorial-next-card">
              <Brain size={24} />
              <div>
                <h3>Обучить ассистента</h3>
                <p>Загрузите документы для обучения вашего бота</p>
              </div>
            </Link>
            
            <Link href="/tutorials/api-functions" className="tutorial-next-card">
              <Sparkles size={24} />
              <div>
                <h3>API Функции</h3>
                <p>Добавьте функции для расширения возможностей</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>


  );
}