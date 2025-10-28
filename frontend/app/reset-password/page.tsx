'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!token) {
      setError('Отсутствует токен сброса пароля.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка сброса пароля');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Ошибка</h2>
          <p>Отсутствует токен сброса пароля.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✓</div>
          <h2>Пароль изменён!</h2>
          <p>Перенаправляем на страницу входа...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Сброс пароля</h2>
        <p>Введите новый пароль для вашего аккаунта.</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="password"
            placeholder="Новый пароль (минимум 8 символов)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Подтвердите пароль"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={styles.input}
          />

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Сброс...' : 'Сбросить пароль'}
          </button>
        </form>
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
  error: {
    padding: '12px',
    background: '#ef4444',
    color: 'white',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    marginTop: '24px',
  },
  input: {
    padding: '12px',
    background: '#1a1a1a',
    border: '1px solid #444444',
    borderRadius: '8px',
    color: '#E0E0E0',
    fontSize: '14px',
  },
  button: {
    padding: '12px',
    background: '#888888',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};