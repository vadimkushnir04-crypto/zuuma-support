import type { Metadata } from "next";
import LayoutClient from "./layout-client";
import I18nProvider from "../components/I18nProvider";
import { UmamiScript } from "@/components/UmamiScript";
import '../styles/globals.css';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL('https://zuuma.ru'),
  title: {
    default: "ZUUMA — AI Ассистенты для бизнеса",
    template: "%s | Zuuma",
  },
  description: "Создавайте умных AI-ассистентов для автоматизации поддержки клиентов. Интеграция с Telegram, обучение на ваших данных. От 0₽/месяц.",
  keywords: [
    "AI ассистент", 
    "чат-бот", 
    "автоматизация поддержки", 
    "Telegram бот", 
    "YandexGPT",
    "RAG",
    "векторная база данных",
    "обучение чат-бота",
    "бизнес автоматизация"
  ],
  authors: [{ name: "Zuuma", url: "https://zuuma.ru" }],
  creator: "Zuuma",
  publisher: "Zuuma",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://zuuma.ru",
    siteName: "Zuuma",
    title: "Zuuma — AI Ассистенты для бизнеса",
    description: "Создавайте умных AI-ассистентов за 5 минут. Обучение на ваших документах, интеграция с Telegram.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Zuuma AI Assistants Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zuuma — AI Ассистенты для бизнеса",
    description: "Создавайте умных AI-ассистентов за 5 минут",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://zuuma.ru" />
      </head>
      <body
        style={{
          backgroundColor: '#121212',
          color: '#E0E0E0',
          margin: 0,
          padding: 0,
          minHeight: '100vh',
          fontFamily: 'Inter, sans-serif',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ← Umami в самом начале body */}
        <UmamiScript />
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <I18nProvider>
            <LayoutClient>{children}</LayoutClient>
          </I18nProvider>
        </div>
        <Footer />
      </body>
    </html>
  );
}