'use client';

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import AdminChatWidget from "../components/AdminChatWidget";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const hideSidebar = pathname === "/";
  const { isLoggedIn, userName, logout } = useAuth();

  // 🔥 Добавляем этот эффект:
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('authToken', token);
      // Убираем токен из адресной строки, чтобы он не светился
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [searchParams]);

  return (
    <>
      <Header isLoggedIn={isLoggedIn} userName={userName} onLogout={logout} />
      <div style={{ display: 'flex', paddingTop: '54px' }}>
        {!hideSidebar && <Sidebar />}
        <main
          style={{
            flex: 1,
            marginLeft: hideSidebar ? '0' : '256px',
            padding: '0rem',
            minHeight: 'calc(100vh - 54px)',
          }}
        >
          {children}
        </main>
      </div>
      <AdminChatWidget />
    </>
  );
}
