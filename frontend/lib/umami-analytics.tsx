'use client';

import Script from 'next/script';

interface UmamiAnalyticsProps {
  websiteId: string;
  src?: string;
}

/**
 * Umami Analytics Component
 * Self-hosted, privacy-focused analytics
 */
export function UmamiAnalytics({
  websiteId,
  src,
}: UmamiAnalyticsProps) {
  return (
    <Script
      async
      defer
      src={src}
      data-website-id={websiteId}
      data-auto-track="true"
      strategy="afterInteractive"
    />
  );
}

/**
 * Umami Event Tracker
 * Для отслеживания кастомных событий
 */
export const umami = {
  track: (eventName: string, eventData?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.umami) {
      window.umami.track(eventName, eventData);
    }
  },

  // Предопределенные события
  events: {
    // Действия с ассистентами
    assistantCreated: (assistantId?: string) => 
      umami.track('assistant-created', { assistantId }),
    
    assistantUpdated: (assistantId: string) => 
      umami.track('assistant-updated', { assistantId }),
    
    assistantDeleted: (assistantId: string) => 
      umami.track('assistant-deleted', { assistantId }),

    // Действия с функциями
    functionCreated: (functionName: string) => 
      umami.track('function-created', { functionName }),
    
    functionExecuted: (functionName: string, duration?: number) => 
      umami.track('function-executed', { functionName, duration }),

    // Действия с файлами
    fileUploaded: (fileType: string, fileSize: number) => 
      umami.track('file-uploaded', { fileType, fileSize }),
    
    fileDeleted: () => 
      umami.track('file-deleted'),

    // Действия в чате
    chatMessageSent: (assistantId: string, messageLength: number) => 
      umami.track('chat-message-sent', { assistantId, messageLength }),
    
    chatSessionStarted: (assistantId: string) => 
      umami.track('chat-session-started', { assistantId }),

    // Действия с подпиской
    subscriptionViewed: (plan: string) => 
      umami.track('subscription-viewed', { plan }),
    
    subscriptionUpgraded: (fromPlan: string, toPlan: string) => 
      umami.track('subscription-upgraded', { fromPlan, toPlan }),
    
    paymentInitiated: (plan: string, amount: number) => 
      umami.track('payment-initiated', { plan, amount }),
    
    paymentCompleted: (plan: string, amount: number) => 
      umami.track('payment-completed', { plan, amount }),
    
    paymentFailed: (plan: string, error: string) => 
      umami.track('payment-failed', { plan, error }),

    // Интеграции
    integrationConnected: (integration: string) => 
      umami.track('integration-connected', { integration }),
    
    integrationDisconnected: (integration: string) => 
      umami.track('integration-disconnected', { integration }),

    // Telegram
    telegramBotCreated: () => 
      umami.track('telegram-bot-created'),
    
    telegramBotConnected: (botId: string) => 
      umami.track('telegram-bot-connected', { botId }),

    // Пользовательские действия
    buttonClick: (buttonName: string, location?: string) => 
      umami.track('button-click', { buttonName, location }),
    
    formSubmit: (formName: string, success: boolean) => 
      umami.track('form-submit', { formName, success }),
    
    modalOpen: (modalName: string) => 
      umami.track('modal-open', { modalName }),
    
    modalClose: (modalName: string) => 
      umami.track('modal-close', { modalName }),
    
    searchPerformed: (query: string, resultsCount: number) => 
      umami.track('search-performed', { query, resultsCount }),

    // Авторизация
    registration: (method: string) => 
      umami.track('registration', { method }),
    
    login: (method: string) => 
      umami.track('login', { method }),
    
    logout: () => 
      umami.track('logout'),

    // Ошибки (для отслеживания в аналитике)
    error: (errorType: string, errorMessage: string, page?: string) => 
      umami.track('error', { errorType, errorMessage, page }),
  },
};

// TypeScript декларации
declare global {
  interface Window {
    umami?: {
      track: (event: string, eventData?: Record<string, any>) => void;
    };
  }
}

/**
 * React Hook для Umami
 */
export function useUmami() {
  return umami;
}