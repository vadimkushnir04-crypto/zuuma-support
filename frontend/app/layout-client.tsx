'use client';

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import AdminChatWidget from "../components/AdminChatWidget";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import CookieConsent from "../components/CookieConsent";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const hideSidebar = pathname === "/";
  const { isLoggedIn, userName, logout } = useAuth();

  return (
    <>
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
    </>
  );
}