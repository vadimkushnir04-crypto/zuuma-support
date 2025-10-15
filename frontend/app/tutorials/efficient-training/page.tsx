"use client";

import { useState } from "react";
import { ArrowLeft, Copy, CheckCircle, Brain, AlertTriangle, TrendingDown, Sparkles } from "lucide-react";
import Link from "next/link";

export default function EfficientTrainingTutorial() {
  const [copiedCode, setCopiedCode] = useState<number | null>(null);

  const copyToClipboard = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(index);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const badExample = `Вопрос клиента: "Какая у вас цена на доставку?"

❌ ПЛОХОЙ ответ (расточительный):
"Здравствуйте! Благодарим вас за обращение к нам. Мы очень рады помочь вам с вопросом о стоимости доставки. Наша компания предлагает различные варианты доставки, и цена зависит от нескольких факторов. 

Во-первых, стоимость зависит от вашего местоположения. Если вы находитесь в пределах города, доставка будет стоить 300 рублей. Если же вы находитесь за городом, стоимость может варьироваться от 500 до 1000 рублей в зависимости от расстояния.

Во-вторых, стоимость также зависит от веса вашего заказа. Для заказов весом до 5 кг стоимость стандартная, как я указал выше. Для более тяжелых заказов может быть дополнительная плата.

Также хочу отметить, что при заказе на сумму более 3000 рублей доставка по городу бесплатная! Это отличная возможность сэкономить.

Если у вас есть какие-либо дополнительные вопросы о доставке или о наших услугах в целом, пожалуйста, не стесняйтесь спрашивать. Мы всегда рады помочь!"

Проблемы:
- Слишком много воды и вежливости
- Избыточная детализация без запроса
- 1247 символов вместо 200-300`;

  const goodExample = `✅ ХОРОШИЙ ответ (экономный):
"Доставка по городу - 300₽, за город - от 500₽.
При заказе от 3000₽ доставка бесплатно.
Нужна доставка?"

Преимущества:
- Краткий и по делу
- Вся ключевая информация
- Только 89 символов
- Экономия токенов в 14 раз!`;

  const trainingDoc = `# Правила ответов ассистента

## Стиль общения
- Отвечай кратко и по делу
- Избегай длинных приветствий
- Не повторяй вопрос клиента
- Убирай лишнюю вежливость

## Структура ответа
1. Сразу к сути вопроса
2. Конкретные факты
3. Вопрос для уточнения (если нужно)

## Примеры ХОРОШИХ ответов
Вопрос: "Когда доставка?"
Ответ: "Доставка завтра с 10 до 18. Удобное время?"

Вопрос: "Есть скидки?"
Ответ: "Да, 10% на первый заказ. Промокод: FIRST10"

Вопрос: "Как оплатить?"
Ответ: "Карта, наличные или Сбербанк Онлайн. Что удобнее?"

## Чего ИЗБЕГАТЬ
❌ "Здравствуйте! Благодарим за обращение..."
❌ "Давайте я подробно расскажу обо всех наших..."
❌ "Если у вас есть дополнительные вопросы..."
❌ Повторение информации
❌ Лишние извинения

## Длина ответа
- Простой вопрос: 1-2 предложения (50-150 символов)
- Средний вопрос: 2-3 предложения (150-300 символов)
- Сложный вопрос: не более 500 символов

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
              <h1 className="tutorial-title">Эффективное обучение ассистента</h1>
              <p className="tutorial-subtitle">
                Как сделать бота экономным и эффективным
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="tutorial-content">
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Почему это важно?</h2>
          <div className="tutorial-warning-box">
            <TrendingDown size={24} />
            <div>
              <strong>Проблема: избыточные ответы = большие расходы</strong>
              <p>LLM модели тарифицируются по токенам. Один длинный ответ может стоить в 10-20 раз дороже короткого. При тысячах запросов в день разница огромная!</p>
            </div>
          </div>

          <div className="tutorial-stats-grid">
            <div className="tutorial-stat-card">
              <div className="tutorial-stat-value">10-20x</div>
              <div className="tutorial-stat-label">Экономия токенов</div>
            </div>
            <div className="tutorial-stat-card">
              <div className="tutorial-stat-value">80%</div>
              <div className="tutorial-stat-label">Снижение затрат</div>
            </div>
            <div className="tutorial-stat-card">
              <div className="tutorial-stat-value">2-3x</div>
              <div className="tutorial-stat-label">Быстрее ответы</div>
            </div>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Сравнение подходов</h2>
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Плохой пример</span>
              <button 
                onClick={() => copyToClipboard(badExample, 1)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 1 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 1 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code" style={{ fontSize: '13px' }}>
              <code>{badExample}</code>
            </pre>
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
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Документ для обучения</h2>
          <p className="tutorial-text">
            Создайте документ с правилами и загрузите его в раздел "Обучение ассистента". 
            Это будет базовое знание бота о том, как отвечать клиентам.
          </p>
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Markdown</span>
              <button 
                onClick={() => copyToClipboard(trainingDoc, 3)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 3 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 3 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code" style={{ fontSize: '12px', maxHeight: '400px', overflow: 'auto' }}>
              <code>{trainingDoc}</code>
            </pre>
          </div>
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