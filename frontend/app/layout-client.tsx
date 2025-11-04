'use client';

import { useEffect } from 'react';
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
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
      {/* Обёртка для flex: 1, чтобы контент занимал всё доступное пространство */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header isLoggedIn={isLoggedIn} userName={userName} onLogout={logout} />
        <div style={{ display: 'flex', paddingTop: '54px', flex: 1 }}>
          {!hideSidebar && <Sidebar />}
          <main
            style={{
              flex: 1,
              marginLeft: hideSidebar ? '0' : '256px',
              padding: '0rem',
              minHeight: 0, // ✅ Важно для корректного overflow
            }}
          >
            {children}
          </main>
        </div>
      </div>
      <CookieConsent />
    </ErrorBoundary>
  );
}