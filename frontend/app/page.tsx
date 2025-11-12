import type { Metadata } from "next";
import Link from "next/link";
import { Bot, Upload, Zap, TrendingUp, Clock, Shield } from "lucide-react";
import Script from "next/script";
import VideoSection from "@/components/VideoSection";

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
        {/* Hero Section */}
        <section className="business-hero">
          <div className="business-hero-content">
            <h1 className="business-hero-title">
              Замените чат менеджера на <span className="gradient-text">AI-ассистента</span>
            </h1>
            
            <p className="business-hero-subtitle">
              Загрузите информацию о продукте, как для нового сотрудника. 
              Ассистент сам научится отвечать клиентам в Telegram или на сайте
            </p>

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
                <div className="step-icon-wrapper step-icon-create">
                  <Bot className="w-8 h-8" />
                </div>
                <h3 className="step-title">Создайте ассистента</h3>
                <p className="step-description">
                  Настройте, как ваш AI-помощник будет общаться с клиентами — профессионально, 
                  дружелюбно или в вашем уникальном стиле.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">2</div>
                <div className="step-icon-wrapper step-icon-upload">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="step-title">Обучите загрузив данные</h3>
                <p className="step-description">
                  Загрузите прайс-листы, инструкции, FAQ — всю информацию, которую нужно знать вашему ассистенту. 
                  Система автоматически обработает данные.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">3</div>
                <div className="step-icon-wrapper step-icon-integrate">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="step-title">Интегрируйте в Telegram или на сайт</h3>
                <p className="step-description">
                  Подключите ассистента к Telegram-боту или добавьте виджет на свой сайт. 
                  Готово — ваши клиенты получают мгновенные ответы 24/7.
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
                <div className="benefit-icon benefit-icon-scale">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="benefit-title">Масштабируемость</h3>
                <p className="benefit-text">
                  Один ассистент обслуживает хоть 10, хоть 10 000 клиентов одновременно без потери качества.
                </p>
              </div>

              <div className="benefit-card">
                <div className="benefit-icon benefit-icon-time">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="benefit-title">Работа 24/7</h3>
                <p className="benefit-text">
                  Ваш ассистент не спит и не уходит на обед. Клиенты получают ответы в любое время суток.
                </p>
              </div>

              <div className="benefit-card">
                <div className="benefit-icon benefit-icon-security">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="benefit-title">Безопасность данных</h3>
                <p className="benefit-text">
                  Все данные хранятся на серверах в России. Полное соответствие 152-ФЗ о персональных данных.
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

        {/* Video Tutorial Section - Client Component */}
        <VideoSection />

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