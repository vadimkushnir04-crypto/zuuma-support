'use client';
import { useEffect, useState } from 'react';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('Подтверждение email...');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setStatus('error');
      setMessage('Отсутствует токен подтверждения.');
      return;
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage('✅ Email успешно подтверждён! Теперь можно войти.');
        } else {
          throw new Error(data.error || 'Ошибка подтверждения.');
        }
      })
      .catch((err) => {
        setStatus('error');
        setMessage('❌ ' + err.message);
      });
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8f8f8',
      color: '#333',
      flexDirection: 'column',
      textAlign: 'center',
      padding: '20px',
    }}>
      <h2>{message}</h2>
      {status === 'success' && (
        <a href="/" style={{ color: '#4CAF50', textDecoration: 'underline' }}>
          Вернуться на главную
        </a>
      )}
    </div>
  );
}
