'use client';
import { useEffect, useState } from 'react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // показываем баннер только если пользователь не принимал cookie
    if (!localStorage.getItem('cookieConsent')) {
      setVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#1f1f1f',
        color: '#fff',
        padding: '16px 24px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        maxWidth: '90%',
        fontSize: '14px',
        lineHeight: '1.4',
      }}
    >
      <span>
        Мы используем cookie для авторизации и улучшения работы сайта.
      </span>
      <button
        onClick={acceptCookies}
        style={{
          background: '#4ade80',
          border: 'none',
          borderRadius: '6px',
          color: '#000',
          padding: '6px 14px',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Принять
      </button>
    </div>
  );
}
