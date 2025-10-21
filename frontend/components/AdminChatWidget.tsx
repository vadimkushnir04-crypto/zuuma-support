"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function AdminChatWidget() {
  const pathname = usePathname();
  
  // Не показываем виджет на главной странице и странице помощи
  const hideWidget = pathname === '/' || pathname === '/help';

  useEffect(() => {
    if (hideWidget || typeof window === 'undefined') return;

    // Загружаем виджет поддержки для админов
    (window as any).chatConfig = {
      assistantId: '73486773-bc62-4be6-9e64-c72816baab6f', // ← ID твоего support-ассистента
      serverUrl: 'https://zuuma.ru/api',
      theme: 'dark',
      assistantName: 'Поддержка',
      customGreeting: 'Здравствуйте, вам нужна помощь?',
      primaryColor: '#de8434',
      accentColor: '#1A1A2E'
    };

    const script = document.createElement('script');
    script.src = 'https://zuuma.ru/chat-widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      (window as any).ChatWidgetLoaded = false;
      const container = document.querySelector('.chat-widget-container');
      if (container) container.remove();
    };
  }, [hideWidget]);

  return null;
}