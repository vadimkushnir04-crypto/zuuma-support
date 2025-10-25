'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, X } from 'lucide-react';

export default function Header({ isLoggedIn: externalLoggedIn, userName: externalName, onLogout }: any) {
  const router = useRouter();
  
  const [isLoggedIn, setIsLoggedIn] = useState(externalLoggedIn || false);
  const [userName, setUserName] = useState(externalName || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // ✅ Добавлено
  
  const [authModalType, setAuthModalType] = useState<'email' | 'google' | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToDataTransfer, setAgreedToDataTransfer] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // ✅ Проверка авторизации при загрузке
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/profile', {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && data.user) {
        setIsLoggedIn(true);
        setUserName(data.user.fullName || data.user.email);
        setAvatarUrl(data.user.avatarUrl || null); // ✅ Сохраняем аватарку
      } else {
        setIsLoggedIn(false);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    setError('');
    setSuccessMessage('');
  }, [authMode]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.error('Logout error:', e);
    }

    setIsLoggedIn(false);
    setUserName('');
    setAvatarUrl(null);
    onLogout?.();
    router.push('/');
  };

  const handleGoogleLogin = async () => {
    setError('');
    if (!agreedToTerms || !agreedToDataTransfer) {
      setError('Примите все условия для продолжения');
      return;
    }
    window.location.href = '/api/auth/google';
  };

  const handleEmailAuth = async () => {
    setError('');
    setSuccessMessage('');

    if (!agreedToTerms) {
      setError('Примите условия для продолжения');
      return;
    }

    try {
      if (authMode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password, fullName }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Ошибка регистрации');
        }

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
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Ошибка входа');
        }

        setAuthModalType(null);
        await checkAuth();
        router.push('/assistants');
      }
    } catch (err: any) {
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
        <div style={styles.logoContainer} onClick={() => router.push('/')}>
          <img src="/favicon.ico" alt="Zuuma" style={styles.logoIcon} />
          <h1 style={styles.logo}>zuuma</h1>
        </div>

        <nav style={styles.nav}>
          {isLoggedIn ? (
            <>
              {/* ✅ Аватарка и имя с переходом в профиль */}
              <div 
                style={styles.profileSection} 
                onClick={() => router.push('/profile')}
                title="Перейти в профиль"
              >
                {avatarUrl && (
                  <img 
                    src={avatarUrl} 
                    alt={userName} 
                    style={styles.avatar}
                  />
                )}
                <span style={styles.userName}>{userName}</span>
              </div>
              
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

      {/* Модальные окна остаются без изменений */}
      {authModalType === 'email' && (
        <div style={modalStyles.overlay} onClick={() => setAuthModalType(null)}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={modalStyles.closeButton} onClick={() => setAuthModalType(null)}>
              <X size={20} />
            </button>

            <h2 style={modalStyles.title}>
              {authMode === 'login' ? 'Вход по Email' : 'Регистрация по Email'}
            </h2>

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

            {error && <div style={modalStyles.error}>{error}</div>}
            {successMessage && <div style={modalStyles.successBox}>{successMessage}</div>}

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

// ✅ ТЕМНЫЙ ДИЗАЙН Header
const styles = {
  header: {
    background: '#111111', // ✅ Темный фон
    borderBottom: '1px solid #444444',
    padding: '16px 0',
    position: 'sticky' as const,
    top: 0,
    zIndex: 1000,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  logoIcon: {
    width: '32px',
    height: '32px',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#E0E0E0', // ✅ Светлый текст
    margin: 0,
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  // ✅ Секция профиля с аватаркой
  profileSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: '#1a1a1a',
    border: '1px solid #444444',
  } as React.CSSProperties,
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
    border: '2px solid #888888',
  },
  userName: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#E0E0E0',
  },
  navButton: {
    padding: '10px 20px',
    background: '#1a1a1a',
    color: '#E0E0E0',
    border: '1px solid #444444',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  logoutButton: {
    padding: '10px 20px',
    background: '#333333',
    color: '#E0E0E0',
    border: '1px solid #555555',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  loginButton: {
    padding: '10px 20px',
    background: '#888888',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  googleButtonHeader: {
    padding: '10px 20px',
    background: '#1a1a1a',
    color: '#E0E0E0',
    border: '1px solid #444444',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

const modalStyles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  modal: {
    background: '#111111',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '440px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    border: '1px solid #444444',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
  },
  closeButton: {
    position: 'absolute' as const,
    top: '16px',
    right: '16px',
    background: 'transparent',
    border: 'none',
    color: '#B0B0B0',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '4px',
    transition: 'all 0.2s',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '24px',
    color: '#E0E0E0',
    textAlign: 'center' as const,
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    padding: '4px',
    background: '#0a0a0a',
    borderRadius: '8px',
  },
  tab: {
    flex: 1,
    padding: '10px',
    background: 'transparent',
    color: '#B0B0B0',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabActive: {
    background: '#888888',
    color: 'white',
  },
  error: {
    padding: '12px',
    background: '#ff4444',
    color: 'white',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    textAlign: 'center' as const,
  },
  successBox: {
    padding: '12px',
    background: '#10b981',
    color: 'white',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    textAlign: 'center' as const,
  },
  consents: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    marginBottom: '24px',
  },
  checkboxLabel: {
    display: 'flex',
    gap: '8px',
    fontSize: '13px',
    color: '#B0B0B0',
    cursor: 'pointer',
  },
  checkbox: {
    marginTop: '2px',
    cursor: 'pointer',
  },
  checkboxText: {
    lineHeight: '1.5',
  },
  link: {
    color: '#888888',
    textDecoration: 'underline',
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  inputGroup: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    position: 'absolute' as const,
    left: '14px',
    color: '#666666',
  },
  input: {
    width: '100%',
    padding: '12px 12px 12px 44px',
    background: '#0a0a0a',
    border: '1px solid #444444',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#E0E0E0',
    outline: 'none',
  },
  submitButton: {
    padding: '12px',
    background: '#888888',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  hint: {
    textAlign: 'center' as const,
    fontSize: '14px',
    color: '#B0B0B0',
    marginTop: '16px',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#888888',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontSize: '14px',
  },
  alternative: {
    marginTop: '24px',
    textAlign: 'center' as const,
    color: '#666666',
    fontSize: '14px',
  },
  alternativeButton: {
    width: '100%',
    marginTop: '12px',
    padding: '12px',
    background: '#1a1a1a',
    color: '#E0E0E0',
    border: '1px solid #444444',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  warningBox: {
    padding: '12px',
    background: '#ff9800',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  warningText: {
    fontSize: '13px',
    color: 'white',
    margin: 0,
    textAlign: 'center' as const,
  },
  googleButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    background: 'white',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};