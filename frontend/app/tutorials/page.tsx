//frontend/app/tutorials/page.tsx
"use client";

import { useState } from "react";
import { Search, Book, Code, Brain, Settings, Zap, Terminal, FileText, Sparkles, TrendingDown } from "lucide-react";
import Link from "next/link";

const tutorials = [
  /*{
    id: "rag-training",
    title: "Как обучать ассистентов (RAG)",
    description: "Загрузка документов, настройка знаний и лучшие практики обучения ассистентов с использованием технологии RAG.",
    link: "/tutorials/rag-training",
    category: "AI / RAG",
    icon: Brain,
    gradient: "from-purple-500 to-pink-500",
    level: "Средний",
    time: "15 мин"
  },*/
  {
    id: "efficient-training",
    title: "Эффективное обучение бота",
    description: "Как обучить ассистента отвечать кратко и экономно, снизив расход токенов на 80%.",
    link: "/tutorials/efficient-training",
    category: "AI / RAG",
    icon: TrendingDown,
    gradient: "from-green-500 to-teal-500",
    level: "Средний",
    time: "10 мин"
  },
  {
    id: "api-functions",
    title: "Создание API Функций",
    description: "Подключение внешних API к ассистентам для получения данных и выполнения действий.",
    link: "/tutorials/api-functions",
    category: "API",
    icon: Zap,
    gradient: "from-orange-500 to-red-500",
    level: "Средний",
    time: "12 мин"
  },
  {
    id: "html-widget",
    title: "HTML Widget",
    description: "Простое встраивание ассистента через HTML-виджет в ваш сайт без программирования.",
    link: "/tutorials/html-widget",
    category: "Интеграция",
    icon: Code,
    gradient: "from-blue-500 to-cyan-500",
    level: "Новичок",
    time: "5 мин"
  },
  {
    id: "javascript",
    title: "JavaScript SDK",
    description: "Полноценная интеграция ассистента через JavaScript SDK с расширенными возможностями.",
    link: "/tutorials/javascript",
    category: "Интеграция",
    icon: Sparkles,
    gradient: "from-yellow-500 to-orange-500",
    level: "Средний",
    time: "12 мин"
  },
  {
    id: "python",
    title: "Python SDK",
    description: "Подключение ассистента в Python приложениях с использованием официального SDK.",
    link: "/tutorials/python",
    category: "Интеграция",
    icon: Code,
    gradient: "from-indigo-500 to-purple-500",
    level: "Средний",
    time: "18 мин"
  },
  {
    id: "curl",
    title: "REST API с cURL",
    description: "Прямая работа с API ассистента через HTTP-запросы и примеры команд cURL.",
    link: "/tutorials/curl",
    category: "API",
    icon: Terminal,
    gradient: "from-red-500 to-pink-500",
    level: "Продвинутый",
    time: "10 мин"
  },
  {
    id: "json-config",
    title: "JSON Configuration",
    description: "Универсальная настройка ассистента через конфигурационный файл для любых платформ.",
    link: "/tutorials/json-config",
    category: "Конфигурация",
    icon: Settings,
    gradient: "from-teal-500 to-blue-500",
    level: "Средний",
    time: "8 мин"
  },
];

const categoryColors: Record<string, string> = {
  "AI / RAG": "bg-purple-100 text-purple-700 border-purple-200",
  "Интеграция": "bg-blue-100 text-blue-700 border-blue-200",
  "API": "bg-red-100 text-red-700 border-red-200",
  "Конфигурация": "bg-teal-100 text-teal-700 border-teal-200",
};

const levelColors: Record<string, string> = {
  "Новичок": "bg-green-100 text-green-700",
  "Средний": "bg-yellow-100 text-yellow-700", 
  "Продвинутый": "bg-red-100 text-red-700",
};

export default function TutorialsPage() {
  const [search, setSearch] = useState("");

  const filtered = tutorials.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="tutorials-container">
      
      {/* Header */}
      <div className="page-header-t">
        <div className="page-header-content">
          <div className="page-title-section">
            <div>
              <h1>Документы</h1>
              <p>Создавайте функции один раз и используйте для любых ботов</p>

              {/* Beta warning */}
            <div className="beta-warning">
              ⚠️ API и SDK находятся в <strong>бета-версии</strong>. Некоторые функции могут работать некорректно или выдавать ошибки.
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Search Section */}
      <div className="tutorials-search-section">
        <div className="tutorials-search-wrapper">
          <Search className="tutorials-search-icon" size={20} />
          <input
            type="text"
            placeholder="Поиск по туториалам..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="tutorials-search-input"
          />
        </div>
      </div>

      {/* Tutorials Grid */}
      <div className="tutorials-grid">
        {filtered.map((tutorial, index) => {
          const IconComponent = tutorial.icon;
          return (
            <Link
              key={tutorial.id}
              href={tutorial.link}
              className="tutorials-card-link"
            >
              <div className="tutorials-card">
                {/* Card Header */}
                <div className={`tutorials-card-header bg-gradient-to-br ${tutorial.gradient}`}>
                  <div className="tutorials-card-icon">
                    <IconComponent size={24} />
                  </div>
                  <div className="tutorials-card-time">
                    {tutorial.time}
                  </div>
                </div>

                {/* Card Content */}
                <div className="tutorials-card-content">
                  <div className="tutorials-card-badges">
                    <span className={`tutorials-category-badge ${categoryColors[tutorial.category]}`}>
                      {tutorial.category}
                    </span>
                    <span className={`tutorials-level-badge ${levelColors[tutorial.level]}`}>
                      {tutorial.level}
                    </span>
                  </div>
                  
                  <h3 className="tutorials-card-title">
                    {tutorial.title}
                  </h3>
                  
                  <p className="tutorials-card-description">
                    {tutorial.description}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="tutorials-card-footer">
                  <span className="tutorials-card-cta">
                    Читать гайд →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* No Results */}
      {filtered.length === 0 && (
        <div className="tutorials-no-results">
          <div className="tutorials-no-results-icon">🔍</div>
          <h3 className="tutorials-no-results-title">Туториалы не найдены</h3>
          <p className="tutorials-no-results-text">
            Попробуйте изменить запрос или очистить фильтры
          </p>
        </div>
      )}
    </div>
  );
}