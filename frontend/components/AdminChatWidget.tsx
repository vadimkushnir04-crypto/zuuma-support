'use client';

import { useEffect } from 'react';

export default function AdminChatWidget() {
  useEffect(() => {
    // Проверяем, что скрипт еще не загружен
    if (document.getElementById('zuuma-chat-widget-script')) {
      return;
    }

    // Настройка конфигурации виджета
    (window as any).chatConfig = {
      assistantId: process.env.NEXT_PUBLIC_SUPPORT_ASSISTANT_ID,
      serverUrl: process.env.NEXT_PUBLIC_API_URL || 'https://zuuma.ru/api',
      theme: 'dark',
      assistantName: 'Поддержка Zuuma',
      customGreeting: 'Здравствуйте! Чем могу помочь?',
      primaryColor: '#de8434',
      accentColor: '#1A1A2E'
    };

    // Загружаем скрипт виджета
    const script = document.createElement('script');
    script.id = 'zuuma-chat-widget-script';
    script.src = '/chat-widget.js';
    script.async = true;
    
    script.onload = () => {
      console.log('✅ Chat widget script loaded successfully');
    };
    
    script.onerror = () => {
      console.error('❌ Failed to load chat widget script');
    };

    document.body.appendChild(script);

    // Cleanup при размонтировании
    return () => {
      // Удаляем виджет при размонтировании компонента
      const widgetContainer = document.getElementById('zuuma-chat-widget');
      if (widgetContainer) {
        widgetContainer.remove();
      }
      
      const widgetScript = document.getElementById('zuuma-chat-widget-script');
      if (widgetScript) {
        widgetScript.remove();
      }
      
      // Очищаем флаг загрузки
      delete (window as any).ChatWidgetLoaded;
    };
  }, []);

  // Компонент не рендерит ничего - виджет создается скриптом
  return null;
}