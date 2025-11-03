"use client";

import { useEffect } from "react";
import { LifeBuoy, MessageCircle, Mail, FileText, Book } from "lucide-react";
import Link from "next/link";

export default function HelpPage() {
useEffect(() => {
  // Загружаем виджет поддержки
    if (typeof window !== 'undefined') {
      // Проверяем, не загружен ли уже виджет
      if ((window as any).ChatWidgetLoaded) {
        // Если виджет уже загружен, просто открываем его
        setTimeout(() => {
          if ((window as any).ChatWidget) {
            (window as any).ChatWidget.open();
          }
        }, 100);
        return;
      }

      (window as any).chatConfig = {
        assistantId: '73486773-bc62-4be6-9e64-c72816baab6f',
        serverUrl: 'https://zuuma.ru/api',
        theme: 'light',
        assistantName: 'Служба поддержки zuuma.ru',
        customGreeting: 'Здравствуйте! Я помогу вам разобраться с платформой. Задайте ваш вопрос.',
        primaryColor: '#10b981'
      };

      const script = document.createElement('script');
      script.src = 'https://zuuma.ru/chat-widget.js';
      script.async = true;
      document.body.appendChild(script);

      // Ждем полной инициализации виджета
      const checkWidgetReady = setInterval(() => {
        if ((window as any).ChatWidget && (window as any).ChatWidgetLoaded) {
          clearInterval(checkWidgetReady);
          // Открываем чат после инициализации
          setTimeout(() => {
            (window as any).ChatWidget.open();
          }, 200);
        }
      }, 100); // Проверяем каждые 100ms

      // Очистка через 10 секунд, если виджет не загрузился
      const timeout = setTimeout(() => {
        clearInterval(checkWidgetReady);
      }, 10000);

      return () => {
        clearInterval(checkWidgetReady);
        clearTimeout(timeout);
        // НЕ удаляем скрипт и НЕ сбрасываем ChatWidgetLoaded
        // чтобы виджет работал при возврате на страницу
      };
    }
  }, []);

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <LifeBuoy size={40} style={{ color: '#10b981' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>Центр помощи</h1>
            <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '16px' }}>
              Мы готовы помочь вам в любое время
            </p>
          </div>
        </div>
      </div>

      {/* Способы связи */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '24px',
        marginBottom: '48px'
      }}>
        <div style={{ 
          padding: '24px', 
          border: '1px solid #e5e7eb', 
          borderRadius: '12px',
          background: '#2a2a2a'
        }}>
          <MessageCircle size={32} style={{ color: '#10b981', marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>Чат с поддержкой</h3>
          <p style={{ color: '#666', marginBottom: '16px' }}>
            Задайте вопрос нашему AI-ассистенту или свяжитесь с оператором
          </p>
          <button 
            onClick={async () => {
              // ✅ Ждем готовности виджета
              if ((window as any).ChatWidgetReady) {
                await (window as any).ChatWidgetReady;
              }
              if ((window as any).ChatWidget) {
                (window as any).ChatWidget.open();
              }
            }}
            style={{
              padding: '10px 20px',
              background: '#2a2a2a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Открыть чат
          </button>
        </div>

        <div style={{ 
          padding: '24px', 
          border: '1px solid #e5e7eb', 
          borderRadius: '12px',
          background: '#2a2a2a'
        }}>
          <FileText size={32} style={{ color: '#3b82f6', marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>База знаний</h3>
          <p style={{ color: '#666', marginBottom: '16px' }}>
            Инструкции и руководства по использованию платформы
          </p>
          <Link 
            href="/tutorials"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              background: '#2a2a2a',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Перейти к туториалам
          </Link>
        </div>

        <div style={{ 
          padding: '24px', 
          border: '1px solid #e5e7eb', 
          borderRadius: '12px',
          background: '#2a2a2a'
        }}>
          <Mail size={32} style={{ color: '#8b5cf6', marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>Email поддержка</h3>
          <p style={{ color: '#666', marginBottom: '16px' }}>
            Напишите нам на почту, мы ответим в течение 24 часов
          </p>
          <a 
            href="mailto:delovoi.acount@gmail.com"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              background: '#2a2a2a',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            delovoi.acount@gmail.com
          </a>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ marginTop: '48px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Частые вопросы</h2>
        
        <details style={{ 
          padding: '16px', 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px',
          marginBottom: '12px',
          background: '#2a2a2a',
          cursor: 'pointer'
        }}>
          <summary style={{ fontWeight: '600', fontSize: '16px' }}>
            Как создать первого ассистента?
          </summary>
          <p style={{ marginTop: '12px', color: '#666', lineHeight: '1.6' }}>
            Перейдите в раздел <Link href="/assistants/create" style={{ color: '#3b82f6' }}>"Создать ассистента"</Link>, 
            заполните базовые настройки (имя, системный промпт) и обучите бота на ваших документах в разделе "Обучение".
          </p>
        </details>

        <details style={{ 
          padding: '16px', 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px',
          marginBottom: '12px',
          background: '#2a2a2a',
          cursor: 'pointer'
        }}>
          <summary style={{ fontWeight: '600', fontSize: '16px' }}>
            Как интегрировать бота на сайт?
          </summary>
          <p style={{ marginTop: '12px', color: '#666', lineHeight: '1.6' }}>
            Перейдите на страницу <Link href="/assistants" style={{ color: '#3b82f6' }}>ваших ассистентов</Link>, 
            нажмите "Код для интеграции" под карточкой нужного бота и скопируйте HTML код. 
            Вставьте его перед закрывающим тегом &lt;/body&gt; на вашем сайте.
          </p>
        </details>

        <details style={{ 
          padding: '16px', 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px',
          marginBottom: '12px',
          background: '#2a2a2a',
          cursor: 'pointer'
        }}>
          <summary style={{ fontWeight: '600', fontSize: '16px' }}>
            Как подключить Telegram бота?
          </summary>
          <p style={{ marginTop: '12px', color: '#666', lineHeight: '1.6' }}>
            Перейдите в раздел <Link href="/integrations" style={{ color: '#3b82f6' }}>"Интеграции"</Link>, 
            выберите Telegram, создайте бота через @BotFather и введите токен в форму подключения.
          </p>
        </details>

        <details style={{ 
          padding: '16px', 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px',
          marginBottom: '12px',
          background: '#2a2a2a',
          cursor: 'pointer'
        }}>
          <summary style={{ fontWeight: '600', fontSize: '16px' }}>
            Как обучить бота на моих документах?
          </summary>
          <p style={{ marginTop: '12px', color: '#666', lineHeight: '1.6' }}>
            Перейдите в <Link href="/assistants/education" style={{ color: '#3b82f6' }}>"Обучение ассистента"</Link>, 
            загрузите файлы (PDF, DOCX, TXT) или введите текст вручную. Система автоматически обработает документы для RAG.
          </p>
        </details>

        <details style={{ 
          padding: '16px', 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px',
          background: '#2a2a2a',
          cursor: 'pointer'
        }}>
          <summary style={{ fontWeight: '600', fontSize: '16px' }}>
            Сколько стоит использование платформы?
          </summary>
          <p style={{ marginTop: '12px', color: '#666', lineHeight: '1.6' }}>
            У каждого пользователя есть 100 000 бесплатных токенов. После их использования можно пополнить баланс. 
            Подробнее о тарификации смотрите в разделе <Link href="/profile" style={{ color: '#3b82f6' }}>профиля</Link>.
          </p>
        </details>
      </div>

      {/* Дополнительные ресурсы */}
      <div style={{ 
        marginTop: '48px', 
        padding: '24px', 
        background: '#f9fafb', 
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <Book size={40} style={{ color: '#3b82f6', margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Нужна дополнительная помощь?</h3>
        <p style={{ color: '#666', marginBottom: '16px' }}>
          Изучите наши подробные туториалы и документацию
        </p>
        <Link 
          href="/tutorials"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#3b82f6',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          Открыть документацию
        </Link>
      </div>
    </div>
  );
}