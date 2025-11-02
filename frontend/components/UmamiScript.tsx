'use client';

import Script from 'next/script';

export function UmamiScript() {
  console.log('🔍 UmamiScript loading...'); // Для дебага
  
  return (
    <>
      <Script
        id="umami-script"
        async
        defer
        src="http://158.160.152.103:3002/script.js"
        data-website-id="5724209b-4c15-46cd-bdba-4c5ed02f3e3f"
        data-auto-track="true"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('✅ Umami script loaded!');
        }}
        onError={(e) => {
          console.error('❌ Umami script failed:', e);
        }}
      />
    </>
  );
}