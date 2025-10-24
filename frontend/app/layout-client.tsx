'use client';

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import AdminChatWidget from "../components/AdminChatWidget"; // ← ДОБАВЬ
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = pathname === "/";
  const { isLoggedIn, userName, logout } = useAuth();

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
      <AdminChatWidget /> {/* ← ДОБАВЬ ЭТУ СТРОКУ */}
    </>
  );
}