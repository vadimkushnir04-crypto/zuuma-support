'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function VerifyLoginPage() {
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('Подтверждаем вход...');
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Отсутствует токен подтверждения.');
      return;
    }

    fetch('/api/auth/verify-login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage('Вход подтверждён! Перенаправляем...');
          setTimeout(() => {
            window.location.href = '/assistants';
          }, 2000);
        } else {
          throw new Error(data.error || 'Ошибка подтверждения входа.');
        }
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message);
      });
  }, [searchParams]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {status === 'pending' && <div style={styles.spinner}></div>}
        {status === 'success' && <div style={styles.successIcon}>✓</div>}
        {status === 'error' && <div style={styles.errorIcon}>✕</div>}
        
        <h2 style={styles.title}>
          {status === 'success' ? 'Успешно!' : status === 'error' ? 'Ошибка' : 'Проверка...'}
        </h2>
        <p style={styles.message}>{message}</p>
      </div>
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
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #444444',
    borderTop: '4px solid #888888',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 24px',
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
    margin: '0 auto 24px',
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
    margin: '0 auto 24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: '12px',
    color: '#E0E0E0',
  },
  message: {
    fontSize: '16px',
    color: '#B0B0B0',
    lineHeight: '1.6',
  },
};