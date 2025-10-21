"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TrendingUp,
  PlusCircle,
  Bot,
  Lightbulb,
  Zap,
  GraduationCap,
  Settings,
  User,
  Headphones,
  FileText,
  LifeBuoy
} from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

export default function Sidebar() {
  const { t } = useTranslation("sidebar");
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/assistants") {
      return pathname === "/assistants";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const menuItems = [
    // Ассистенты
    {
      title: t("myAssistants"),
      icon: <Bot size={20} />,
      href: "/assistants",
    },
    {
      title: t("createAssistant"),
      icon: <PlusCircle size={20} />,
      href: "/assistants/create",
    },
    {
      title: t("trainAssistant"),
      icon: <GraduationCap size={20} />,
      href: "/assistants/education",
    },
    {
      title: t("apiFunctions"),
      icon: <Zap size={20} />,
      href: "/assistants/functions",
    },

    // Интеграции
    {
      title: "Интеграции",
      icon: <Settings size={20} />,
      href: "/integrations",
    },

    // Поддержка в чате человеком
    {
      title: "Поддержка",
      icon: <Headphones size={20} />,
      href: "/support",
    },

        // Главная аналитическая панель
    {
      title: "Аналитика",
      icon: <TrendingUp size={20} />,
      href: "/analytics",
    },

    // Обучение и документация
    {
      title: t("tutorials"),
      icon: <Lightbulb size={20} />,
      href: "/tutorials",
    },

    // ссылка на страницу оферты
    {
      title: "Условия и политика",
      icon: <FileText size={20} />,
      href: "/offer",
    },

    {
      title: "Получить помощь",
      icon: <LifeBuoy size={20} />,
      href: "/help",
    },
  ];

  return (
    <aside className="sidebar">
      <ul>
        {menuItems.map((item) => (
          <li key={item.href} className="sidebar-item">
            <Link
              href={item.href}
              className={`sidebar-link ${isActive(item.href) ? "active" : ""}`}
            >
              {item.icon} {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}