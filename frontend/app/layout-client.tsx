'use client';

import '../styles/globals.css';
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import I18nProvider from "../components/I18nProvider";
import { usePathname } from "next/navigation";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = pathname === "/";

  return (
    <div>
      <Header />
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
    </div>
  );
}