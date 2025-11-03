'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
}

// ✅ Список email адресов администраторов
const ADMIN_EMAILS = [
  'delovol.acount@gmail.com',
  // Добавьте сюда другие email админов при необходимости
];

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://zuuma.ru/api'}/auth/profile`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        // Пользователь не авторизован
        router.push('/');
        return;
      }

      const data = await res.json();
      const userEmail = data.user?.email;

      // Проверяем, является ли пользователь администратором
      if (!userEmail || !ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
        // Не админ - перенаправляем на главную
        alert('❌ Доступ запрещен. Эта страница доступна только администраторам.');
        router.push('/');
        return;
      }

      // Пользователь - администратор
      setIsAdmin(true);
    } catch (error) {
      console.error('Ошибка проверки прав:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1rem'
      }}>
        <Loader size={40} className="spin" />
        <p style={{ color: '#999' }}>Проверка прав доступа...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Страница не отобразится, т.к. произошел редирект
  }

  return <>{children}</>;
}