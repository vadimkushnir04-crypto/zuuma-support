'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

export function UmamiScript() {
  const [config, setConfig] = useState<{ id?: string; url?: string }>({});

  useEffect(() => {
    // Читаем из process.env на клиенте
    setConfig({
      id: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
      url: process.env.NEXT_PUBLIC_UMAMI_URL,
    });
  }, []);

  if (!config.id || !config.url) return null;

  return (
    <Script
      async
      defer
      src={`${config.url}/script.js`}
      data-website-id={config.id}
      data-auto-track="true"
      strategy="afterInteractive"
    />
  );
}