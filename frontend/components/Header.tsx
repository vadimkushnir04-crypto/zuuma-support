'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, X } from 'lucide-react';

interface HeaderProps {
  isLoggedIn: boolean;
  userName: string;
  onLogout: () => void;
}

export default function Header({ isLoggedIn, userName, onLogout }: HeaderProps) {
  const router = useRouter();
  const [authModalType, setAuthModalType] = useState<'email' | 'google' | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToDataTransfer, setAgreedToDataTransfer] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // Новое состояние

  // Очистка уведомлений при смене режима
  useEffect(() => {
    setError('');
    setSuccessMessage('');
  }, [authMode]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout();
    router.push('/');
  };

  const handleGoogleLogin = async () => {
    setError('');
    if (!agreedToTerms || !agreedToDataTransfer) return;

    try {
      // Здесь будет редирект на Google OAuth
      window.location.href = '/api/auth/google';
    } catch (err: any) {
      setError(err.message || 'Ошибка входа через Google');
    }
  };

  // Обновлённая функция с новыми фичами
  const handleEmailAuth = async () => {
    setError('');
    setSuccessMessage(''); // Очищаем старые уведомления

    if (!agreedToTerms) return;

    try {
      if (authMode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, fullName }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Ошибка регистрации');

        // Успешная регистрация — показываем уведомление
        setSuccessMessage('Проверьте почту — мы отправили письмо для подтверждения.');
        setAuthMode('login');
        setEmail('');
        setPassword('');
        setFullName('');
        setAgreedToTerms(false);
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Ошибка входа');

        if (data.token) {
          localStorage.setItem('token', data.token);
          setAuthModalType(null);
          window.location.reload();
        }
      }
    } catch (err: any) {
      // Специальная обработка ошибки Google-аккаунта
      if (err.message.includes('Google') || err.message.includes('google')) {
        setError('Этот email зарегистрирован через Google. Используйте вход через Google.');
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        {/* Логотип */}
        <div style={styles.logoContainer} onClick={() => router.push('/')}>
          <img src="/favicon.ico" alt="Zuuma" style={styles.logoIcon} />
          <h1 style={styles.logo}>zuuma</h1>
        </div>

        <nav style={styles.nav}>
          {isLoggedIn ? (
            <>
              <span style={styles.userName}>{userName}</span>
              <button onClick={() => router.push('/assistants')} style={styles.navButton}>
                Мои ассистенты
              </button>
              <button onClick={handleLogout} style={styles.logoutButton}>
                Выйти
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setAuthModalType('email')} style={styles.loginButton}>
                Вход по Email
              </button>
              <button onClick={() => setAuthModalType('google')} style={styles.googleButtonHeader}>
                Вход через Google
              </button>
            </>
          )}
        </nav>
      </div>

      {/* ============================================ */}
      {/* МОДАЛЬНОЕ ОКНО EMAIL */}
      {/* ============================================ */}
      {authModalType === 'email' && (
        <div style={modalStyles.overlay} onClick={() => setAuthModalType(null)}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={modalStyles.closeButton} onClick={() => setAuthModalType(null)}>
              <X size={20} />
            </button>

            <h2 style={modalStyles.title}>
              {authMode === 'login' ? 'Вход по Email' : 'Регистрация по Email'}
            </h2>

            {/* Табы */}
            <div style={modalStyles.tabs}>
              <button
                style={{
                  ...modalStyles.tab,
                  ...(authMode === 'login' ? modalStyles.tabActive : {}),
                }}
                onClick={() => setAuthMode('login')}
              >
                Вход
              </button>
              <button
                style={{
                  ...modalStyles.tab,
                  ...(authMode === 'register' ? modalStyles.tabActive : {}),
                }}
                onClick={() => setAuthMode('register')}
              >
                Регистрация
              </button>
            </div>

            {/* Ошибки и успех */}
            {error && <div style={modalStyles.error}>{error}</div>}
            {successMessage && <div style={modalStyles.successBox}>{successMessage}</div>}

            {/* Согласие */}
            <div style={modalStyles.consents}>
              <label style={modalStyles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  style={modalStyles.checkbox}
                />
                <span style={modalStyles.checkboxText}>
                  Я принимаю{' '}
                  <a href="/terms" target="_blank" style={modalStyles.link}>
                    Пользовательское соглашение
                  </a>
                  {' '}и{' '}
                  <a href="/privacy" target="_blank" style={modalStyles.link}>
                    Политику конфиденциальности
                  </a>
                </span>
              </label>
            </div>

            {/* Форма */}
            <div style={modalStyles.section}>
              {authMode === 'register' && (
                <div style={modalStyles.inputGroup}>
                  <User size={18} style={modalStyles.icon} />
                  <input
                    type="text"
                    placeholder="Полное имя"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={modalStyles.input}
                  />
                </div>
              )}

              <div style={modalStyles.inputGroup}>
                <Mail size={18} style={modalStyles.icon} />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={modalStyles.input}
                />
              </div>

              <div style={modalStyles.inputGroup}>
                <Lock size={18} style={modalStyles.icon} />
                <input
                  type="password"
                  placeholder="Пароль (минимум 8 символов)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  style={modalStyles.input}
                />
              </div>

              <button
                onClick={handleEmailAuth}
                disabled={!agreedToTerms}
                style={{
                  ...modalStyles.submitButton,
                  opacity: !agreedToTerms ? 0.5 : 1,
                  cursor: !agreedToTerms ? 'not-allowed' : 'pointer',
                }}
              >
                {authMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </button>
            </div>

            <p style={modalStyles.hint}>
              {authMode === 'login' ? (
                <>
                  Нет аккаунта?{' '}
                  <button onClick={() => setAuthMode('register')} style={modalStyles.linkButton}>
                    Зарегистрируйтесь
                  </button>
                </>
              ) : (
                <>
                  Уже есть аккаунт?{' '}
                  <button onClick={() => setAuthMode('login')} style={modalStyles.linkButton}>
                    Войдите
                  </button>
                </>
              )}
            </p>

            <div style={modalStyles.alternative}>
              <p>или</p>
              <button
                onClick={() => setAuthModalType('google')}
                style={modalStyles.alternativeButton}
              >
                Войти через Google
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* МОДАЛЬНОЕ ОКНО GOOGLE */}
      {/* ============================================ */}
      {authModalType === 'google' && (
        <div style={modalStyles.overlay} onClick={() => setAuthModalType(null)}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={modalStyles.closeButton} onClick={() => setAuthModalType(null)}>
              <X size={20} />
            </button>

            <h2 style={modalStyles.title}>Вход через Google</h2>

            {error && <div style={modalStyles.error}>{error}</div>}

            <div style={modalStyles.warningBox}>
              <p style={modalStyles.warningText}>
                При входе через Google данные передаются на серверы Google (США)
              </p>
            </div>

            <div style={modalStyles.consents}>
              <label style={modalStyles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  style={modalStyles.checkbox}
                />
                <span style={modalStyles.checkboxText}>
                  Я принимаю{' '}
                  <a href="/terms" target="_blank" style={modalStyles.link}>
                    Пользовательское соглашение
                  </a>
                  {' '}и{' '}
                  <a href="/privacy" target="_blank" style={modalStyles.link}>
                    Политику конфиденциальности
                  </a>
                </span>
              </label>

              <label style={modalStyles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={agreedToDataTransfer}
                  onChange={(e) => setAgreedToDataTransfer(e.target.checked)}
                  style={modalStyles.checkbox}
                />
                <span style={modalStyles.checkboxText}>Согласие на трансграничную передачу данных</span>
              </label>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={!agreedToTerms || !agreedToDataTransfer}
              style={{
                ...modalStyles.googleButton,
                opacity: (!agreedToTerms || !agreedToDataTransfer) ? 0.5 : 1,
                cursor: (!agreedToTerms || !agreedToDataTransfer) ? 'not-allowed' : 'pointer',
                width: '100%',
                marginTop: '20px',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '18px',
                  height: '18px',
                  marginRight: '8px',
                  verticalAlign: 'middle',
                }}
                dangerouslySetInnerHTML={{
                  __html: `
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  `,
                }}
              />
              Продолжить с Google
            </button>

            <div style={modalStyles.alternative}>
              <p>или</p>
              <button onClick={() => setAuthModalType('email')} style={modalStyles.alternativeButton}>
                Войти по Email
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// ============================================
// СТИЛИ
// ============================================

const styles = {
  header: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #e5e7eb',
    position: 'sticky' as const,
    top: 0,
    zIndex: 50,
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '64px',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  logoIcon: {
    width: '32px',
    height: '32px',
    marginRight: '8px',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1f2937',
    margin: 0,
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userName: {
    fontSize: '14px',
    color: '#4b5563',
    marginRight: '16px',
  },
  navButton: {
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  loginButton: {
    padding: '8px 16px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  googleButtonHeader: {
    padding: '8px 16px',
    backgroundColor: '#4285F4',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
};

const modalStyles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    width: '400px',
    maxWidth: '90vw',
    position: 'relative' as const,
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
  },
  closeButton: {
    position: 'absolute' as const,
    top: '12px',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
  },
  title: {
    margin: '0 0 20px 0',
    fontSize: '20px',
    fontWeight: 600,
    textAlign: 'center' as const,
    color: '#1f2937',
  },
  tabs: {
    display: 'flex',
    marginBottom: '20px',
    borderBottom: '1px solid #e5e7eb',
  },
  tab: {
    flex: 1,
    padding: '10px',
    background: 'none',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#6b7280',
  },
  tabActive: {
    color: '#10b981',
    borderBottom: '2px solid #10b981',
    fontWeight: 600,
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fca5a5',
    borderRadius: '6px',
    padding: '10px 12px',
    fontSize: '14px',
    marginBottom: '12px',
    textAlign: 'center' as const,
  },
  // Новое: успех
  successBox: {
    backgroundColor: '#e6ffed',
    color: '#2c662d',
    border: '1px solid #b5e7b5',
    borderRadius: '6px',
    padding: '10px 12px',
    fontSize: '14px',
    marginBottom: '12px',
    textAlign: 'center' as const,
  },
  consents: {
    marginBottom: '16px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    fontSize: '13px',
    color: '#4b5563',
    marginBottom: '8px',
  },
  checkbox: {
    marginRight: '8px',
    marginTop: '2px',
  },
  checkboxText: {
    lineHeight: '1.4',
  },
  link: {
    color: '#10b981',
    textDecoration: 'underline',
  },
  section: {
    marginBottom: '16px',
  },
  inputGroup: {
    position: 'relative' as const,
    marginBottom: '12px',
  },
  icon: {
    position: 'absolute' as const,
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
  },
  input: {
    width: '100%',
    padding: '12px 12px 12px 40px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
  },
  submitButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: '8px',
  },
  hint: {
    textAlign: 'center' as const,
    fontSize: '14px',
    color: '#6b7280',
    margin: '16px 0',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#10b981',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '14px',
  },
  alternative: {
    textAlign: 'center' as const,
    marginTop: '20px',
    color: '#888',
    fontSize: '14px',
  },
  alternativeButton: {
    background: 'transparent',
    border: 'none',
    color: '#4285F4',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '14px',
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '6px',
    padding: '10px',
    marginBottom: '16px',
  },
  warningText: {
    margin: 0,
    fontSize: '13px',
    color: '#92400e',
  },
  googleButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '12px',
    backgroundColor: '#4285F4',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
  },
};