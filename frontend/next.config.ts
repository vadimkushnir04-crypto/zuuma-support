import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ru', 'es', 'zh'],
    localeDetection: false, // отключаем автоопределение языка
  },
  eslint: {
    ignoreDuringBuilds: true, // ⚡ игнорировать ESLint ошибки при сборке
  },
};

export default nextConfig;
