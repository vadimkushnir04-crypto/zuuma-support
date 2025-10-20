import type { Metadata } from "next";
import LayoutClient from "./layout-client";
import I18nProvider from "../components/I18nProvider";
import '../styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: "ZUUMA — AI Ассистенты для бизнеса",
    template: "%s | ZUUMA",
  },
  description: "Создавайте умных AI-ассистентов для автоматизации поддержки клиентов. Интеграция с Telegram, обучение на ваших данных.",
  keywords: ["AI ассистент", "чат-бот", "автоматизация поддержки", "Telegram бот", "YandexGPT"],
  authors: [{ name: "ZUUMA" }],
  creator: "ZUUMA",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://zuuma.ru",
    siteName: "zuuma",
    title: "zuuma — AI Ассистенты для бизнеса",
    description: "Создавайте умных AI-ассистентов за 5 минут",
    images: [
      {
        url: "https://zuuma.ru/og-image.png",
        width: 1200,
        height: 630,
        alt: "ZUUMA AI Assistants",
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        style={{
          backgroundColor: '#121212',
          color: '#E0E0E0',
          margin: 0,
          padding: 0,
          minHeight: '100vh',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <I18nProvider>
          <LayoutClient>{children}</LayoutClient>
        </I18nProvider>
      </body>
    </html>
  );
}