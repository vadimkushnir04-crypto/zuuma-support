'use client';

import { useEffect } from 'react';
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import AdminChatWidget from "../components/AdminChatWidget";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import CookieConsent from "../components/CookieConsent";
import { ErrorBoundary, setupGlobalErrorHandlers } from "@/components/ErrorBoundary";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = pathname === "/";
  const { isLoggedIn, userName, logout } = useAuth();

  // ✅ Настраиваем глобальные обработчики ошибок
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

  return (
    <ErrorBoundary>
      <Header isLoggedIn={isLoggedIn} userName={userName} onLogout={logout} />
      <div style={{ display: 'flex', paddingTop: '54px', flex: 1 }}>
        {!hideSidebar && <Sidebar />}
        <main
          style={{
            flex: 1,
            marginLeft: hideSidebar ? '0' : '256px',
            padding: '0rem',
          }}
        >
          {children}
        </main>
      </div>
      <AdminChatWidget />
      <CookieConsent />
    </ErrorBoundary>
  );
}