'use client';

import '../styles/globals.css';
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import I18nProvider from "../components/I18nProvider";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = pathname === "/";

  return (
    <html lang="ru">
      <body
        style={{
          backgroundColor: '#121212',
          color: '#E0E0E0',
          margin: 0,
          padding: 0,
          minHeight: '100vh',
          fontFamily: 'Inter, sans-serif',
          '--header-left': hideSidebar ? '0px' : '256px', // Set custom property for header
        } as React.CSSProperties} // Type assertion to include custom properties
      >
        <I18nProvider>
          <Header />
          <div style={{ display: 'flex', paddingTop: '54px' /* Match header height */ }}>
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
        </I18nProvider>
      </body>
    </html>
  );
}