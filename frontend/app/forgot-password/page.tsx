'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Введите корректный email-адрес');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка отправки письма');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.title}>Письмо отправлено!</h2>
          <p style={styles.text}>
            Если аккаунт с таким email существует, мы отправили инструкции по сбросу пароля.
          </p>
          <p style={styles.text}>Проверьте входящие (и папку "Спам").</p>
          <button onClick={() => router.push('/')} style={styles.button}>
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Забыли пароль?</h2>
        <p style={styles.text}>
          Введите email вашего аккаунта. Мы отправим вам ссылку для сброса пароля.
        </p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
            autoFocus
          />

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Отправка...' : 'Отправить письмо'}
          </button>
        </form>

        <div style={styles.backLink}>
          <button
            onClick={() => router.push('/')}
            style={styles.link}
          >
            ← Вернуться на главную
          </button>
        </div>
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
  title: {
    fontSize: '28px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#E0E0E0',
  },
  text: {
    fontSize: '16px',
    color: '#B0B0B0',
    marginBottom: '16px',
    lineHeight: '1.6',
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
    padding: '12px 16px',
    background: '#1a1a1a',
    border: '1px solid #444444',
    borderRadius: '8px',
    color: '#E0E0E0',
    fontSize: '14px',
    outline: 'none',
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
    transition: 'background 0.2s',
  },
  backLink: {
    marginTop: '24px',
  },
  link: {
    background: 'none',
    border: 'none',
    color: '#888888',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '4px',
  },
};