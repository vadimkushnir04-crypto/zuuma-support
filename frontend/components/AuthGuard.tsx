// frontend/components/AuthGuard.tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, LogIn } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setIsAuthenticated(false);
        setIsChecking(false);
        return;
      }

      // Проверяем токен через запрос профиля
      const response = await fetch('http://localhost:4000/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('auth_token');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogin = () => {
    router.push('/');
  };

  // Пока проверяем авторизацию
  if (isChecking) {
    return (
      <div className="auth-guard-container">
        <div className="auth-guard-loading">
          <div className="loading-spinner"></div>
          <p>Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  // Если не авторизован и требуется авторизация
  if (!isAuthenticated && requireAuth) {
    return (
      <div className="auth-guard-container">
        <div className="auth-required-card">
          <div className="auth-required-icon">
            <Lock size={64} />
          </div>
          
          <h2 className="auth-required-title">Требуется авторизация</h2>
          
          <p className="auth-required-description">
            Для доступа к этой странице необходимо войти в систему
          </p>
          
          <div className="auth-required-features">
            <div className="feature-item">
              <User size={20} />
              <span>Управление ассистентами</span>
            </div>
            <div className="feature-item">
              <User size={20} />
              <span>API функции и интеграции</span>
            </div>
            <div className="feature-item">
              <User size={20} />
              <span>Аналитика и статистика</span>
            </div>
          </div>

          <button 
            onClick={handleLogin}
            className="auth-required-button"
          >
            <LogIn size={20} />
            Войти в систему
          </button>
          
          <p className="auth-required-hint">
            Нет аккаунта? <a href="/" onClick={handleLogin}>Зарегистрируйтесь</a>
          </p>
        </div>
      </div>
    );
  }

  // Если авторизован или не требуется авторизация
  return <>{children}</>;
}

// Стили для AuthGuard
export const authGuardStyles = `
  .auth-guard-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: var(--bg);
  }

  .auth-guard-loading {
    text-align: center;
    color: var(--fg-muted);
  }

  .auth-guard-loading p {
    margin-top: 20px;
    font-size: 16px;
  }

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .auth-required-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 48px;
    max-width: 480px;
    width: 100%;
    text-align: center;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  }

  .auth-required-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 120px;
    height: 120px;
    margin: 0 auto 24px;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 50%;
    color: var(--fg-muted);
  }

  .auth-required-icon svg {
    width: 64px;
    height: 64px;
  }

  .auth-required-title {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--fg);
  }

  .auth-required-description {
    font-size: 16px;
    color: var(--fg-muted);
    margin-bottom: 32px;
    line-height: 1.6;
  }

  .auth-required-features {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 32px;
    padding: 24px;
    background: var(--bg);
    border-radius: 12px;
    border: 1px solid var(--border);
  }

  .feature-item {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--fg);
    font-size: 14px;
  }

  .feature-item svg {
    color: var(--accent);
    flex-shrink: 0;
  }

  .auth-required-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 32px;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .auth-required-button:hover {
    background: var(--accent-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  .auth-required-hint {
    margin-top: 24px;
    font-size: 14px;
    color: var(--fg-muted);
  }

  .auth-required-hint a {
    color: var(--accent);
    text-decoration: none;
    font-weight: 500;
  }

  .auth-required-hint a:hover {
    text-decoration: underline;
  }
`;