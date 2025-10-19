"use client";

import { useEffect, useState } from "react";
import { UserIcon, Brain, Settings, Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import { useRouter, useSearchParams } from "next/navigation";

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
  const { t } = useTranslation("common");
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const API_BASE_URL = "https://zuuma.ru/api";

  useEffect(() => {
    setMounted(true);
    
    // Проверяем, вернулся ли пользователь из Google OAuth
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    
    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem("auth_token", token);
        setUserInfo(user);
        
        // ✅ Очищаем URL от параметров (убираем токен из истории)
        window.history.replaceState({}, document.title, '/assistants');
        router.replace('/assistants');
      } catch (error) {
        console.error('Error parsing user data:', error);
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
          "Authorization": `Bearer ${token}`,
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
    // Редирект на бэкенд для Google OAuth
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const handleProfileClick = () => {
    if (userInfo) {
      router.push("/profile");
    } else {
      setProfileOpen(!profileOpen);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setUserInfo(null);
    setProfileOpen(false);
    router.push("/");
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <a href="/" className="logo">
          zuuma
        </a>
        {mounted && (
          <div className="header-nav">
            <span className="current-section">AI Assistant Platform</span>
          </div>
        )}
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
                  borderRadius: '50%', 
                  marginRight: 8,
                  objectFit: 'cover'
                }} 
              />
            ) : (
              <UserIcon size={16} style={{ marginRight: 8 }} />
            )}
            <div>
              <div className="profile-name">
                {userInfo ? (userInfo.fullName || "Пользователь") : "Гость"}
              </div>
              <div className="profile-email">
                {userInfo ? userInfo.email : "user@example.com"}
              </div>
            </div>
          </div>

          {profileOpen && !userInfo && (
            <div className="profile-dropdown">
              <div className="dropdown-divider"></div>
              <button
                onClick={handleGoogleLogin}
                className="google-login-button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 24px',
                  backgroundColor: 'white',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                  <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                  <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                  <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
                </svg>
                Войти через Google
              </button>
            </div>
          )}

          {profileOpen && userInfo && (
            <div className="profile-dropdown">
              <div className="dropdown-divider"></div>
              <button
                onClick={() => router.push("/profile")}
                className="login-button"
              >
                Профиль
              </button>
              <button
                onClick={handleLogout}
                className="login-button"
              >
                Выйти
              </button>
            </div>
          )}
        </div>
      </div>

      {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
    </header>
  );
}