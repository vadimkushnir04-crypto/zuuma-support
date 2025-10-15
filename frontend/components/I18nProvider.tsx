// components/I18nProvider.tsx
"use client";
import { useEffect, useState } from 'react';
import '../lib/i18n';

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ждем инициализации i18n
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return <div>Loading translations...</div>;
  }

  return <>{children}</>;
}