import type { Metadata } from "next";
import Link from "next/link";
import { Bot, Upload, Zap, CheckCircle, TrendingUp, Clock, Shield } from "lucide-react";
import Script from "next/script";
import '../styles/business-home.css'

export const metadata: Metadata = {
  title: "Главная",
  description: "AI-ассистенты для вашего бизнеса. Превратите свои документы в интеллектуальных помощников. Бесплатный тариф, интеграция с Telegram.",
  openGraph: {
    title: "Zuuma — AI Ассистенты для бизнеса",
    description: "Создайте AI-ассистента за 5 минут. Обучение на ваших документах.",
  },
  other: {
    'yandex-verification': 'e1f34ea762753642'
  }
};

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Zuuma",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "RUB",
      "description": "Бесплатный тариф доступен"
    },
    "description": "Платформа для создания AI-ассистентов для автоматизации поддержки клиентов. Интеграция с Telegram, обучение на ваших данных.",
    "operatingSystem": "Web",
    "url": "https://zuuma.ru",
    "provider": {
      "@type": "Organization",
      "name": "Zuuma",
      "url": "https://zuuma.ru"
    },
    "featureList": [
      "Создание AI-ассистентов",
      "Обучение на документах",
      "Интеграция с Telegram",
      "Веб-виджет для сайта",
      "RAG (Retrieval-Augmented Generation)",
      "Поддержка YandexGPT"
    ]
  };

  return (
    <>
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="business-home">
        {/* Hero Section - Увеличен и акцентирован */}
        <section className="business-hero">
          <div className="business-hero-content">
            <div className="business-badge">
              ⚡ Запуск за 5 минут
            </div>
            
            <h1 className="business-hero-title">
              Замените чат менеджера на <span className="gradient-text">AI-ассистента</span>
            </h1>
            
            <p className="business-hero-subtitle">
              Загрузите информацию о продукте, как для нового сотрудника. 
              Ассистент сам научится отвечать клиентам в Telegram, на сайте.
            </p>

            <div className="business-hero-stats">
              <div className="stat-item">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Работа без выходных</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-number">10x</div>
                <div className="stat-label">Быстрее ответы</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-number">0₽</div>
                <div className="stat-label">Можно начать с бесплатного тарифа</div>
              </div>
            </div>

            <div className="business-hero-actions">
              <Link href="/assistants/create" className="btn-primary-large">
                <Bot className="w-6 h-6" />
                Создать ассистента бесплатно
              </Link>
            </div>
          </div>
        </section>

        {/* How it works - Упрощенно для бизнесменов */}
        <section className="business-steps">
          <div className="container">
            <h2 className="section-title">Как это работает</h2>
            <p className="section-subtitle">
              Три простых шага от идеи до работающего ассистента
            </p>

            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">1</div>
                <div className="step-icon-wrapper step-icon-upload">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="step-title">Загрузите знания</h3>
                <p className="step-description">
                  Добавьте тексты, прайс-листы, инструкции — всё, что обычно объясняете новому сотруднику. 
                  Система сама всё обработает.
                </p>
              </div>

              <div className="step-arrow">→</div>

              <div className="step-card">
                <div className="step-number">2</div>
                <div className="step-icon-wrapper step-icon-ai">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="step-title">AI учится</h3>
                <p className="step-description">
                  Искусственный интеллект изучает вашу информацию и готовится отвечать на вопросы клиентов 
                  точно и по делу.
                </p>
              </div>

              <div className="step-arrow">→</div>

              <div className="step-card">
                <div className="step-number">3</div>
                <div className="step-icon-wrapper step-icon-integrate">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="step-title">Интегрируйте</h3>
                <p className="step-description">
                  Добавьте ассистента в Telegram-бот, на сайт или подключите через API. 
                  Готово — клиенты получают ответы мгновенно.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits - Что получает бизнес */}
        <section className="business-benefits">
          <div className="container">
            <h2 className="section-title">Что это даст вашему бизнесу</h2>
            
            <div className="benefits-grid">
              <div className="benefit-card">
                <div className="benefit-icon benefit-icon-cost">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="benefit-title">Экономия на поддержке</h3>
                <p className="benefit-text">
                  Ассистент обрабатывает рутинные вопросы. Менеджеры занимаются только сложными кейсами.
                </p>
              </div>

              <div className="benefit-card">
                <div className="benefit-icon benefit-icon-time">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="benefit-title">Ответы за секунды</h3>
                <p className="benefit-text">
                  Клиенты не ждут. Получают точные ответы мгновенно, даже ночью и в выходные.
                </p>
              </div>

              <div className="benefit-card">
                <div className="benefit-icon benefit-icon-scale">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="benefit-title">Масштабируемость</h3>
                <p className="benefit-text">
                  Один ассистент обслуживает хоть 10, хоть 10 000 клиентов одновременно без потери качества.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases - Примеры использования */}
        <section className="business-usecases">
          <div className="container">
            <h2 className="section-title">Где применяется</h2>
            
            <div className="usecases-grid">
              <div className="usecase-card">
                <div className="usecase-emoji">🛍️</div>
                <h3 className="usecase-title">Интернет-магазин</h3>
                <p className="usecase-text">
                  Ассистент помогает выбрать товар, отвечает на вопросы о доставке и оплате, 
                  проверяет наличие на складе.
                </p>
              </div>

              <div className="usecase-card">
                <div className="usecase-emoji">🏢</div>
                <h3 className="usecase-title">B2B компания</h3>
                <p className="usecase-text">
                  Отвечает партнёрам про условия сотрудничества, прайсы, технические характеристики продукции.
                </p>
              </div>

              <div className="usecase-card">
                <div className="usecase-emoji">🎓</div>
                <h3 className="usecase-title">Онлайн-школа</h3>
                <p className="usecase-text">
                  Консультирует студентов по расписанию, программе курсов, отвечает на частые вопросы об обучении.
                </p>
              </div>

              <div className="usecase-card">
                <div className="usecase-emoji">🏥</div>
                <h3 className="usecase-title">Клиника</h3>
                <p className="usecase-text">
                  Информирует о врачах, услугах и ценах, помогает записаться на приём, отвечает про подготовку к процедурам.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="business-cta">
          <div className="cta-card">
            <h2 className="cta-title">Попробуйте прямо сейчас</h2>
            <p className="cta-subtitle">
              Создайте своего первого AI-ассистента за 5 минут. 
              Бесплатно, без карты, без обязательств.
            </p>
            <Link href="/assistants/create" className="btn-primary-large">
              <Bot className="w-6 h-6" />
              Начать бесплатно
            </Link>
            <p className="cta-note">
              Уже есть аккаунт? <Link href="/assistants" className="cta-link">Войти →</Link>
            </p>
          </div>
        </section>
      </div>
    </>
  );
}