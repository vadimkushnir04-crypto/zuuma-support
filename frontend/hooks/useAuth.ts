// hooks/useAuth.ts
import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zuuma.ru';

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // ✅ Проверяем авторизацию через cookie
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        credentials: 'include', // 👈 Отправляем cookie
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setIsLoggedIn(true);
          setUserName(data.user.fullName || data.user.email.split("@")[0]);
          setUserEmail(data.user.email);
          setAvatarUrl(data.user.avatarUrl || null);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // ✅ Вызываем logout endpoint для удаления cookie
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setIsLoggedIn(false);
    setUserName("");
    setUserEmail("");
    setAvatarUrl(null);
    window.location.href = "/";
  };

  return { 
    isLoggedIn, 
    userName, 
    userEmail,
    avatarUrl,
    loading,
    logout,
    refetch: checkAuth // ✅ Для обновления данных после изменений
  };
}