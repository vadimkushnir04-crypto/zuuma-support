"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserIcon, Settings, Menu, X, Mail, Lock, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface UserInfo {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  plan?: string;
}

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { t } = useTranslation("common");
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  
  // Модальное окно входа/регистрации
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Форма
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToDataTransfer, setAgreedToDataTransfer] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = "https://zuuma.ru/api";
  const isHomePage = pathname === "/";

  useEffect(() => {
    setMounted(true);

    const token = searchParams.get("token");
    const userParam = searchParams.get("user");

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem("auth_token", token);
        setUserInfo(user);
        window.history.replaceState({}, document.title, "/assistants");
        router.replace("/assistants");
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    } else {
      loadUserInfo();
    }
  }, [searchParams, router]);

  const loadUserInfo = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const userData = await res.json();
        setUserInfo(userData.user);
      } else {
        localStorage.removeItem("auth_token");
        setUserInfo(null);
      }
    } catch (error) {
      console.error("Ошибка загрузки данных пользователя:", error);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    document.body.classList.toggle("sidebar-open");
  };

  const handleGoogleLogin = () => {
    if (!agreedToTerms) {
      setError('Вы должны принять условия использования');
      return;
    }
    if (!agreedToDataTransfer) {
      setError('Для входа через Google требуется согласие на передачу данных');
      return;
    }
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!agreedToTerms) {
      setError('Вы должны принять условия использования');
      return;
    }

    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const body = authMode === 'register' 
        ? { email, password, fullName }
        : { email, password };

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('auth_token', data.token);
        setUserInfo(data.user);
        setAuthModalOpen(false);
        router.push('/assistants');
      } else {
        setError(data.error || 'Ошибка аутентификации');
      }
    } catch (err) {
      setError('Ошибка сети. Попробуйте снова.');
    }
  };

  const handleProfileClick = () => {
    if (userInfo) {
      router.push("/profile");
    } else {
      setAuthModalOpen(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setUserInfo(null);
    setProfileOpen(false);
    router.push("/");
  };

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setError('');
    setEmail('');
    setPassword('');
    setFullName('');
    setAgreedToTerms(false);
    setAgreedToDataTransfer(false);
  };

  return (
    <>
      <header 
        className="header"
        style={{
          paddingLeft: isHomePage ? "16px" : "276px",
          transition: "padding-left 0.3s ease",
        }}
      >
        <div className="header-left">
          <button
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link
            href="/"
            className="logo flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:text-purple-500"
          >
            <Image
              src="/favicon.ico"
              alt="Zuuma Logo"
              width={22}
              height={22}
              className="transition-transform duration-300 hover:scale-125 hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] animate-pulse-slow"
            />
            <span className="font-semibold text-lg tracking-tight">zuuma</span>
          </Link>
        </div>

        <div className="header-right">
          <LanguageSwitcher />

          <button className="icon-button" title="Настройки">
            <Settings size={20} color="#E0E0E0" />
          </button>

          <div className="profile-container">
            <div
              className="profile-info"
              onClick={handleProfileClick}
              style={{ cursor: "pointer" }}
            >
              {userInfo?.avatarUrl ? (
                <img
                  src={userInfo.avatarUrl}
                  alt="Avatar"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    marginRight: 8,
                    objectFit: "cover",
                  }}
                />
              ) : (
                <UserIcon size={16} style={{ marginRight: 8 }} />
              )}
              <div>
                <div className="profile-name">
                  {userInfo ? userInfo.fullName || "Пользователь" : "Гость"}
                </div>
                <div className="profile-email">
                  {userInfo ? userInfo.email : "Нажмите для входа"}
                </div>
              </div>
            </div>

            {profileOpen && userInfo && (
              <div className="profile-dropdown">
                <div className="dropdown-divider"></div>
                <button
                  onClick={() => router.push("/profile")}
                  className="login-button"
                >
                  Профиль
                </button>
                <button onClick={handleLogout} className="login-button">
                  Выйти
                </button>
              </div>
            )}
          </div>
        </div>

        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={toggleSidebar}></div>
        )}
      </header>

      {/* Модальное окно входа/регистрации */}
      {authModalOpen && (
        <div style={modalStyles.overlay} onClick={() => setAuthModalOpen(false)}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <button 
              style={modalStyles.closeButton}
              onClick={() => setAuthModalOpen(false)}
            >
              <X size={20} />
            </button>

            <h2 style={modalStyles.title}>
              {authMode === 'login' ? 'Вход в Zuuma' : 'Регистрация в Zuuma'}
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

            {/* Форма Email/Password */}
            <div style={modalStyles.section}>
              <h3 style={modalStyles.sectionTitle}>
                ✅ Рекомендуем: данные остаются в РФ
              </h3>

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

              <button onClick={handleEmailAuth} style={modalStyles.submitButton}>
                {authMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </button>
            </div>

            {/* Divider */}
            <div style={modalStyles.divider}>
              <span style={modalStyles.dividerLine}></span>
              <span style={modalStyles.dividerText}>или</span>
              <span style={modalStyles.dividerLine}></span>
            </div>

            {/* Google OAuth */}
            <div style={modalStyles.section}>
              <h3 style={modalStyles.sectionTitle}>Вход через Google</h3>
              
              <div style={modalStyles.warningBox}>
                <p style={modalStyles.warningText}>
                  ⚠️ При входе через Google данные передаются на серверы Google (США)
                </p>
              </div>

              <button 
                onClick={handleGoogleLogin}
                disabled={!agreedToTerms || !agreedToDataTransfer}
                style={{
                  ...modalStyles.googleButton,
                  opacity: (!agreedToTerms || !agreedToDataTransfer) ? 0.5 : 1,
                  cursor: (!agreedToTerms || !agreedToDataTransfer) ? 'not-allowed' : 'pointer',
                }}
              >
                {/* Google Icon - используем inline SVG без тега svg */}
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
                Войти через Google
              </button>
            </div>

            {/* Согласия (УПРОЩЕННЫЕ) */}
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
                  Согласие на трансграничную передачу данных (только для Google)
                </span>
              </label>
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
          </div>
        </div>
      )}
    </>
  );
}

const modalStyles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#1E1E1E',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    border: '1px solid #333',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    color: '#999',
    cursor: 'pointer',
    padding: '4px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '24px',
    color: '#E0E0E0',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '1px solid #333',
  },
  tab: {
    flex: 1,
    padding: '12px',
    background: 'none',
    border: 'none',
    color: '#999',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'all 0.2s',
  },
  tabActive: {
    color: '#4CAF50',
    borderBottom: '2px solid #4CAF50',
  },
  error: {
    backgroundColor: '#2A1515',
    border: '1px solid #ff6b6b',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px',
    color: '#ff6b6b',
    fontSize: '14px',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#4CAF50',
  },
  inputGroup: {
    position: 'relative',
    marginBottom: '12px',
  },
  icon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#999',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '12px 12px 12px 40px',
    backgroundColor: '#2A2A2A',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#E0E0E0',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  submitButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#4CAF50',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '20px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#333',
  },
  dividerText: {
    padding: '0 12px',
    color: '#666',
    fontSize: '13px',
  },
  googleButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#fff',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  warningBox: {
    backgroundColor: '#2A1A1A',
    border: '1px solid #ff9800',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '12px',
  },
  warningText: {
    fontSize: '12px',
    color: '#ccc',
    margin: 0,
    lineHeight: '1.5',
  },
  consents: {
    marginTop: '20px',
    padding: '16px',
    backgroundColor: '#2A2A2A',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    cursor: 'pointer',
  },
  checkbox: {
    marginTop: '3px',
    cursor: 'pointer',
    minWidth: '16px',
  },
  checkboxText: {
    fontSize: '12px',
    color: '#ccc',
    lineHeight: '1.5',
  },
  link: {
    color: '#4CAF50',
    textDecoration: 'none',
  },
  hint: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '13px',
    color: '#999',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#4CAF50',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: 0,
    font: 'inherit',
  },
};