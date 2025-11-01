'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Error Boundary для отлова ошибок React
 * Альтернатива Sentry - логирует в ваш backend
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Логируем в консоль (для development)
    console.error('Error caught by boundary:', error, errorInfo);

    // Сохраняем в state
    this.setState({
      error,
      errorInfo,
    });

    // Отправляем на backend для логирования
    this.logErrorToBackend(error, errorInfo);

    // Вызываем callback если есть
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Логируем в Umami (если используете)
    if (typeof window !== 'undefined' && window.umami) {
      window.umami.track('react-error', {
        error: error.message,
        stack: error.stack?.substring(0, 500),
        componentStack: errorInfo.componentStack?.substring(0, 500),
      });
    }
  }

  private async logErrorToBackend(error: Error, errorInfo: ErrorInfo) {
    try {
      const token = localStorage.getItem('token');
      
      await fetch('/api/errors/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          type: 'react_error',
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      // Не падаем, если не получилось отправить
      console.error('Failed to log error to backend:', err);
    }
  }

  render() {
    if (this.state.hasError) {
      // Показываем fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Что-то пошло не так
            </h1>
            
            <p className="text-center text-gray-600 mb-6">
              Произошла ошибка при отображении страницы. Мы уже знаем о проблеме и работаем над её исправлением.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 bg-gray-50 rounded p-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                  Детали ошибки (только в development)
                </summary>
                <div className="text-xs text-gray-600 space-y-2">
                  <div>
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  <div>
                    <strong>Stack:</strong>
                    <pre className="mt-1 overflow-auto bg-white p-2 rounded text-xs">
                      {this.state.error.stack}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 overflow-auto bg-white p-2 rounded text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined, errorInfo: undefined });
                  window.location.reload();
                }}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Перезагрузить страницу
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                На главную
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Global Error Handler для необработанных ошибок
 */
export function setupGlobalErrorHandlers() {
  if (typeof window === 'undefined') return;

  // Глобальные ошибки JavaScript
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    logErrorToBackend({
      type: 'global_error',
      message: event.message,
      stack: event.error?.stack,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });

    // Логируем в Umami
    if (window.umami) {
      window.umami.track('global-error', {
        message: event.message,
        filename: event.filename,
      });
    }
  });

  // Unhandled Promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled rejection:', event.reason);
    
    logErrorToBackend({
      type: 'unhandled_rejection',
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
    });

    // Логируем в Umami
    if (window.umami) {
      window.umami.track('unhandled-rejection', {
        reason: String(event.reason),
      });
    }
  });
}

/**
 * Хелпер для отправки ошибок на backend
 */
async function logErrorToBackend(errorData: any) {
  try {
    const token = localStorage.getItem('token');
    
    await fetch('/api/errors/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        ...errorData,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error('Failed to log error to backend:', err);
  }
}

/**
 * Hook для ручного логирования ошибок
 */
export function useErrorLogger() {
  const logError = (error: Error, context?: string) => {
    console.error('Error:', error);
    
    logErrorToBackend({
      type: 'manual_error',
      message: error.message,
      stack: error.stack,
      context,
    });

    if (window.umami) {
      window.umami.track('manual-error', {
        message: error.message,
        context,
      });
    }
  };

  return { logError };
}

/**
 * HOC для обёртки компонентов в Error Boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
) {
  return function ComponentWithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// TypeScript декларации
declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, any>) => void;
    };
  }
}