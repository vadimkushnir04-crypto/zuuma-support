'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('Подтверждение email...');
  const router = useRouter();

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Отсутствует токен подтверждения.');
      return;
    }

    // ✅ Отправляем токен для подтверждения
    fetch('/api/auth/verify-email', {
      method: 'POST',
      credentials: 'include', // Для получения JWT cookie
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage('Email успешно подтверждён! Входим в аккаунт...');
          
          // ✅ Автоматический вход и редирект через 4 секунды
          setTimeout(() => {
            router.push('/assistants');
          }, 4000); // Увеличено с 2 до 4 секунд
        } else {
          throw new Error(data.error || 'Ошибка подтверждения.');
        }
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message);
      });
  }, [router]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Иконка статуса */}
        <div style={styles.iconContainer}>
          {status === 'pending' && (
            <div style={styles.spinner}></div>
          )}
          {status === 'success' && (
            <div style={styles.successIcon}>✓</div>
          )}
          {status === 'error' && (
            <div style={styles.errorIcon}>✕</div>
          )}
        </div>

        {/* Сообщение */}
        <h2 style={styles.title}>
          {status === 'pending' && 'Проверяем токен...'}
          {status === 'success' && 'Успешно!'}
          {status === 'error' && 'Ошибка'}
        </h2>

        <p style={styles.message}>{message}</p>

        {/* Прогресс-бар для успешного подтверждения */}
        {status === 'success' && (
          <div style={styles.progressContainer}>
            <div style={styles.progressBar}></div>
          </div>
        )}

        {/* Кнопки действий */}
        {status === 'success' && (
          <button 
            onClick={() => router.push('/assistants')}
            style={styles.button}
          >
            Перейти к ассистентам
          </button>
        )}

        {status === 'error' && (
          <div style={styles.actions}>
            <button 
              onClick={() => router.push('/')}
              style={styles.button}
            >
              Вернуться на главную
            </button>
            <a 
              href="mailto:vadim.kushnir.04@gmail.com"
              style={styles.link}
            >
              Связаться с поддержкой
            </a>
          </div>
        )}
      </div>

      {/* CSS для анимаций */}
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a0a',
    padding: '20px',
  },
  card: {
    background: '#111111',
    border: '1px solid #444444',
    borderRadius: '16px',
    padding: '48px',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center' as const,
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80px',
    height: '80px',
    margin: '0 auto 24px',
    borderRadius: '50%',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #444444',
    borderTop: '4px solid #888888',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  successIcon: {
    width: '80px',
    height: '80px',
    background: '#10b981',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    color: 'white',
    fontWeight: 'bold' as const,
  },
  errorIcon: {
    width: '80px',
    height: '80px',
    background: '#ef4444',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    color: 'white',
    fontWeight: 'bold' as const,
  },
  title: {
    fontSize: '28px',
    fontWeight: 600,
    marginBottom: '12px',
    color: '#E0E0E0',
  },
  message: {
    fontSize: '16px',
    color: '#B0B0B0',
    marginBottom: '32px',
    lineHeight: '1.6',
  },
  progressContainer: {
    width: '100%',
    height: '4px',
    background: '#444444',
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '24px',
  },
  progressBar: {
    height: '100%',
    background: '#888888',
    animation: 'progress 4s linear', // 4 секунды до редиректа
  },
  button: {
    padding: '12px 32px',
    background: '#888888',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  link: {
    color: '#888888',
    textDecoration: 'none',
    fontSize: '14px',
  },
};