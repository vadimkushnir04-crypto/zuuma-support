import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ru', 'es', 'zh'],
    localeDetection: false, // отключаем автоопределение языка
  },
};

export default nextConfig;