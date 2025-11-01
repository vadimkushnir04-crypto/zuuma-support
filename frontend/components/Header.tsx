'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, X } from 'lucide-react';

export default function Header({ isLoggedIn: externalLoggedIn, userName: externalName, onLogout }: any) {
  const router = useRouter();
  
  const [isLoggedIn, setIsLoggedIn] = useState(externalLoggedIn || false);
  const [userName, setUserName] = useState(externalName || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [showResendButton, setShowResendButton] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  
  const [authModalType, setAuthModalType] = useState<'email' | 'google' | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
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
      
      if (res.status === 401) {
        // Токен истёк или недействителен
        setIsLoggedIn(false);
        return;
      }

      const data = await res.json();
      if (data.success && data.user) {
        setIsLoggedIn(true);
        setUserName(data.user.fullName || data.user.email);
        setAvatarUrl(data.user.avatarUrl || null);
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
    setShowResendButton(false);
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
    
    // ✅ ФИКС: Для Google OAuth не требуем галочки заранее
    // Yandex/Google сами покажут согласие
    window.location.href = '/api/auth/google';
  };

  const handleEmailAuth = async () => {
    setError('');
    setSuccessMessage('');
    setShowResendButton(false);

    // ✅ Проверка email формата
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Введите корректный email-адрес');
      return;
    }

    // ✅ Проверка пароля
    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }

    try {
      if (authMode === 'register') {
        // ✅ РЕГИСТРАЦИЯ
        if (!agreedToTerms) {
          setError('Примите условия для регистрации');
          return;
        }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password, fullName }),
        });

        const data = await res.json();

        if (!res.ok) {
          // Показываем кнопку повторной отправки если это проблема с email
          if (data.emailError || data.message?.includes('письмо')) {
            setShowResendButton(true);
            setResendEmail(email);
          }
          throw new Error(data.message || data.error || 'Ошибка регистрации');
        }

        // ✅ Проверяем requiresVerification
        if (data.requiresVerification) {
          setSuccessMessage('✅ Регистрация успешна! Проверьте почту — мы отправили письмо с подтверждением.');
          setShowResendButton(true);
          setResendEmail(email);
        } else {
          setSuccessMessage('✅ Проверьте почту для подтверждения.');
        }

        } else if (authMode === 'login') {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
          });

          const data = await res.json();

          if (!res.ok) {
            if (data.requiresVerification) {
              setError('⚠️ Подтвердите email перед входом.');
              setShowResendButton(true);
              setResendEmail(data.email || email);
              return;
            }

            if (data.hasGoogleAccount || data.provider === 'google') {
              setError('Этот email через Google. Используйте вход через Google.');
              return;
            }

            throw new Error(data.error || data.message || 'Ошибка входа');
          }

          // ✅ Если requiresLoginVerification - ТОЛЬКО показываем сообщение
          if (data.requiresLoginVerification) {
            setSuccessMessage('📧 Письмо для входа отправлено! Проверьте почту (включая Спам).');
            return; // ← ВАЖНО: return БЕЗ редиректа!
          }

        }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: resendEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        // ✅ Специальная обработка rate limit
        if (data.error?.includes('Слишком много') || data.error?.includes('много запросов')) {
          throw new Error('⚠️ Слишком много попыток. Подождите немного.');
        }
        
        throw new Error(data.error || data.message || 'Ошибка отправки письма');
      }

      setSuccessMessage('✅ Письмо отправлено! Проверьте почту (включая Спам).');
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка. Попробуйте позже.');
    } finally {
      setResendLoading(false);
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
                Вход
              </button>
              <button onClick={() => setAuthModalType('google')} style={styles.googleButtonHeader}>
                Вход через Google
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Email Auth Modal */}
      {authModalType === 'email' && (
        <div style={modalStyles.overlay} onClick={() => setAuthModalType(null)}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={modalStyles.closeButton} onClick={() => setAuthModalType(null)}>
              <X size={20} />
            </button>

            <h2 style={modalStyles.title}>
              {authMode === 'login' ? 'Вход' : 'Регистрация'}
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

            {/* ✅ Ошибки и успех */}
            {error && <div style={modalStyles.error}>{error}</div>}
            {successMessage && (
              <>
                <div style={modalStyles.successBox}>{successMessage}</div>
                {/* ✅ ДОБАВЬ ЭТО: */}
                <div style={modalStyles.infoBox}>
                  <p style={modalStyles.infoText}>
                    💡 Письмо может прийти с задержкой до 2-3 минут. Проверьте папку "Спам".
                  </p>
                </div>
              </>
            )}

            {/* ✅ Кнопка повторной отправки */}
            {showResendButton && (
              <div style={modalStyles.resendSection}>
                <p style={modalStyles.resendText}>
                  Не получили письмо?
                </p>
                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  style={{
                    ...modalStyles.resendButton,
                    opacity: resendLoading ? 0.5 : 1,
                    cursor: resendLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {resendLoading ? 'Отправка...' : 'Отправить повторно'}
                </button>
              </div>
            )}

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

              {/* ✅ ФИКС: Галочка ПЕРЕД кнопкой, только для регистрации */}
              {authMode === 'register' && (
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
              )}

              <button
                onClick={handleEmailAuth}
                disabled={authMode === 'register' && !agreedToTerms}
                style={{
                  ...modalStyles.submitButton,
                  opacity: (authMode === 'register' && !agreedToTerms) ? 0.5 : 1,
                  cursor: (authMode === 'register' && !agreedToTerms) ? 'not-allowed' : 'pointer',
                }}
              >
                {authMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </button>

              {/* ✅ Забыли пароль? */}
              {authMode === 'login' && (
                <div style={modalStyles.forgotPasswordContainer}>
                  <button
                    onClick={() => {
                      setAuthModalType(null);
                      router.push('/forgot-password');
                    }}
                    style={modalStyles.forgotPasswordLink}
                  >
                    Забыли пароль?
                  </button>
                </div>
              )}

            </div>

            <div style={modalStyles.alternative}>
              или
            </div>

            <button
              onClick={handleGoogleLogin}
              style={modalStyles.alternativeButton}
            >
              Продолжить с Google
            </button>
          </div>
        </div>
      )}

      {/* ✅ ФИКС: Упрощённое Google Auth Modal */}
      {authModalType === 'google' && (
        <div style={modalStyles.overlay} onClick={() => setAuthModalType(null)}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={modalStyles.closeButton} onClick={() => setAuthModalType(null)}>
              <X size={20} />
            </button>

            <h2 style={modalStyles.title}>Вход через Google</h2>

            {error && <div style={modalStyles.error}>{error}</div>}

            {/* ✅ Информация о согласии */}
            <div style={modalStyles.infoBox}>
              <p style={modalStyles.infoText}>
                При входе через Google вы автоматически соглашаетесь с{' '}
                <a href="/terms" target="_blank" style={modalStyles.link}>
                  Пользовательским соглашением
                </a>
                {' '}и{' '}
                <a href="/privacy" target="_blank" style={modalStyles.link}>
                  Политикой конфиденциальности
                </a>.
              </p>
              <p style={modalStyles.infoText}>
                Google запросит ваше согласие на передачу данных.
              </p>
            </div>

            {/* ✅ ФИКС: Убрали все галочки, просто кнопка */}
            <button
              onClick={handleGoogleLogin}
              style={modalStyles.googleButton}
            >
              Войти через Google
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

const styles = {
  header: {
    width: '100%',
    height: '54px',
    background: '#1a1a1a',
    borderBottom: '1px solid #444444',
    position: 'fixed' as const,
    top: 0,
    left: 0,
    zIndex: 1000,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    padding: '0 24px',
    maxWidth: '1400px',
    margin: '0 auto',
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
    color: '#E0E0E0',
    margin: 0,
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  profileSection: {
    padding: '3px 5px',
    background: '#1a1a1a',
    color: '#E0E0E0',
    border: '1px solid #444444',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
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
    position: 'relative' as const,
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
    marginBottom: '16px',
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
  infoBox: {
    background: '#1a1a1a',
    border: '1px solid #444444',
    borderRadius: '8px',
    padding: '12px',
    marginTop: '12px',
    marginBottom: '16px',
  },
  infoText: {
    fontSize: '13px',
    color: '#B0B0B0',
    margin: '0 0 8px 0',
    lineHeight: '1.5',
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
    width: '100%',
  },
  resendSection: {
    marginTop: '16px',
    marginBottom: '16px',
    padding: '12px',
    background: '#1a1a1a',
    borderRadius: '8px',
    textAlign: 'center' as const,
    border: '1px solid #444444',
  },
  resendText: {
    fontSize: '14px',
    color: '#B0B0B0',
    marginBottom: '8px',
  },
  resendButton: {
    padding: '8px 16px',
    background: '#888888',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

    forgotPasswordContainer: {
    marginTop: '12px',
    textAlign: 'center' as const,
  },
  forgotPasswordLink: {
    background: 'none',
    border: 'none',
    color: '#888888',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '4px',
  },
};