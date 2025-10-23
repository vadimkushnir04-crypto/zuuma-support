'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, User, Mail, Lock } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  
  // ✅ ИЗМЕНЕНО: теперь два типа модальных окон
  const [authModalType, setAuthModalType] = useState<'email' | 'google' | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Поля формы
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  
  // Согласия
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToDataTransfer, setAgreedToDataTransfer] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      setIsLoggedIn(true);
      try {
        const userData = JSON.parse(user);
        setUserName(userData.fullName || userData.email);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  // Email/Password вход
  const handleEmailAuth = async () => {
    if (!agreedToTerms) {
      setError('Пожалуйста, примите условия использования');
      return;
    }

    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = authMode === 'register' 
        ? { email, password, fullName }
        : { email, password };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setIsLoggedIn(true);
        setUserName(data.user.fullName || data.user.email);
        setAuthModalType(null);
        router.push('/assistants');
      } else {
        setError(data.error || 'Ошибка авторизации');
      }
    } catch (err) {
      setError('Внутренняя ошибка сервера. Попробуйте позже.');
    }
  };

  // Google вход
  const handleGoogleLogin = () => {
    if (!agreedToTerms || !agreedToDataTransfer) {
      setError('Пожалуйста, дайте все необходимые согласия');
      return;
    }
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    router.push('/');
  };

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <h1 style={styles.logo} onClick={() => router.push('/')}>
          ZUUMA
        </h1>

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
              <button 
                onClick={() => setAuthModalType('email')}
                style={styles.loginButton}
              >
                📧 Вход по Email
              </button>
              <button 
                onClick={() => setAuthModalType('google')}
                style={styles.googleButton}
              >
                🔵 Вход через Google
              </button>
            </>
          )}
        </nav>
      </div>

      {/* ============================================ */}
      {/* МОДАЛЬНОЕ ОКНО ДЛЯ EMAIL/PASSWORD           */}
      {/* ============================================ */}
      {authModalType === 'email' && (
        <div style={modalStyles.overlay} onClick={() => setAuthModalType(null)}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <button 
              style={modalStyles.closeButton}
              onClick={() => setAuthModalType(null)}
            >
              <X size={20} />
            </button>

            <h2 style={modalStyles.title}>
              {authMode === 'login' ? 'Вход по Email' : 'Регистрация по Email'}
            </h2>

            {/* Переключатель Login/Register */}
            <div style={modalStyles.tabs}>
              <button
                style={{
                  ...modalStyles.tab,
                  ...(authMode === 'login' ? modalStyles.tabActive : {})
                }}
                onClick={() => setAuthMode('login')}
              >
                Вход
              </button>
              <button
                style={{
                  ...modalStyles.tab,
                  ...(authMode === 'register' ? modalStyles.tabActive : {})
                }}
                onClick={() => setAuthMode('register')}
              >
                Регистрация
              </button>
            </div>

            {error && (
              <div style={modalStyles.error}>
                {error}
              </div>
            )}

            {/* Согласие */}
            <div style={modalStyles.consents}>
              <label style={modalStyles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  required
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
                  <button 
                    onClick={() => setAuthMode('register')}
                    style={modalStyles.linkButton}
                  >
                    Зарегистрируйтесь
                  </button>
                </>
              ) : (
                <>
                  Уже есть аккаунт?{' '}
                  <button 
                    onClick={() => setAuthMode('login')}
                    style={modalStyles.linkButton}
                  >
                    Войдите
                  </button>
                </>
              )}
            </p>

            {/* Альтернатива */}
            <div style={{ textAlign: 'center', marginTop: '20px', color: '#888', fontSize: '14px' }}>
              <p>или</p>
              <button 
                onClick={() => setAuthModalType('google')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#4285F4',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '14px',
                }}
              >
                Войти через Google
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* МОДАЛЬНОЕ ОКНО ДЛЯ GOOGLE                   */}
      {/* ============================================ */}
      {authModalType === 'google' && (
        <div style={modalStyles.overlay} onClick={() => setAuthModalType(null)}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <button 
              style={modalStyles.closeButton}
              onClick={() => setAuthModalType(null)}
            >
              <X size={20} />
            </button>

            <h2 style={modalStyles.title}>Вход через Google</h2>

            {error && (
              <div style={modalStyles.error}>
                {error}
              </div>
            )}

            <div style={modalStyles.warningBox}>
              <p style={modalStyles.warningText}>
                ⚠️ При входе через Google данные передаются на серверы Google (США)
              </p>
            </div>

            {/* Согласия */}
            <div style={modalStyles.consents}>
              <label style={modalStyles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  required
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
                <span style={modalStyles.checkboxText}>
                  Согласие на трансграничную передачу данных
                </span>
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
              <span style={{ 
                display: 'inline-block', 
                width: '18px', 
                height: '18px', 
                marginRight: '8px',
                verticalAlign: 'middle'
              }} dangerouslySetInnerHTML={{ __html: `
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              `}} />
              Продолжить с Google
            </button>

            {/* Альтернатива */}
            <div style={{ textAlign: 'center', marginTop: '20px', color: '#888', fontSize: '14px' }}>
              <p>или</p>
              <button 
                onClick={() => setAuthModalType('email')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#4CAF50',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '14px',
                }}
              >
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
    background: '#1E1E1E',
    padding: '20px 0',
    borderBottom: '1px solid #333',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#4CAF50',
    cursor: 'pointer',
    margin: 0,
  },
  nav: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
  },
  userName: {
    color: '#E0E0E0',
    marginRight: '10px',
  },
  navButton: {
    padding: '10px 20px',
    background: '#2A2A2A',
    border: 'none',
    borderRadius: '6px',
    color: '#E0E0E0',
    cursor: 'pointer',
    fontSize: '14px',
  },
  loginButton: {
    padding: '10px 20px',
    background: '#4CAF50',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  googleButton: {
    padding: '10px 20px',
    background: '#4285F4',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  logoutButton: {
    padding: '10px 20px',
    background: '#f44336',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
};

const modalStyles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#1E1E1E',
    padding: '30px',
    borderRadius: '12px',
    maxWidth: '450px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    position: 'relative' as const,
  },
  closeButton: {
    position: 'absolute' as const,
    top: '15px',
    right: '15px',
    background: 'transparent',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    padding: '5px',
  },
  title: {
    fontSize: '24px',
    marginBottom: '20px',
    color: '#E0E0E0',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  tab: {
    flex: 1,
    padding: '10px',
    background: '#2A2A2A',
    border: 'none',
    borderRadius: '6px',
    color: '#888',
    cursor: 'pointer',
    fontSize: '14px',
  },
  tabActive: {
    background: '#4CAF50',
    color: 'white',
  },
  error: {
    background: '#f443364d',
    color: '#f44336',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '15px',
    fontSize: '14px',
  },
  section: {
    marginBottom: '20px',
  },
  inputGroup: {
    position: 'relative' as const,
    marginBottom: '15px',
  },
  icon: {
    position: 'absolute' as const,
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#888',
  },
  input: {
    width: '100%',
    padding: '12px 12px 12px 40px',
    background: '#2A2A2A',
    border: '1px solid #444',
    borderRadius: '6px',
    color: '#E0E0E0',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  },
  submitButton: {
    width: '100%',
    padding: '12px',
    background: '#4CAF50',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    fontSize: '16px',
    fontWeight: '500' as const,
    cursor: 'pointer',
    marginTop: '10px',
  },
  consents: {
    marginBottom: '20px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    marginBottom: '12px',
    cursor: 'pointer',
  },
  checkbox: {
    marginTop: '3px',
    cursor: 'pointer',
  },
  checkboxText: {
    fontSize: '13px',
    color: '#B0B0B0',
    lineHeight: '1.5',
  },
  link: {
    color: '#4CAF50',
    textDecoration: 'none',
  },
  warningBox: {
    background: '#ff98004d',
    border: '1px solid #ff9800',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '20px',
  },
  warningText: {
    fontSize: '13px',
    color: '#ffb74d',
    margin: 0,
    lineHeight: '1.5',
  },
  hint: {
    textAlign: 'center' as const,
    color: '#888',
    fontSize: '14px',
    marginTop: '15px',
  },
  linkButton: {
    background: 'transparent',
    border: 'none',
    color: '#4CAF50',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '14px',
  },
  googleButton: {
    padding: '12px',
    background: '#4285F4',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    fontSize: '16px',
    fontWeight: '500' as const,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};