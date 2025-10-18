// app/assistants/education/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Bot, FileText, Upload } from "lucide-react";
import UploadTextForm, { AssistantsDropdown, SelectedAssistantContext } from "../../../components/UploadTextForm";
import FileUploadForm from "../../../components/FileUploadForm";
import Chat from "../../../components/Chat";
import AuthGuard from '../../../components/AuthGuard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://zuuma.ru/api";

// ========================
// Провайдер контекста для выбранного ассистента
// ========================
function AssistantsProvider({ children }: { children: React.ReactNode }) {
  const [selectedAssistantId, setSelectedAssistantId] = useState<string | null>(null);

  return (
    <SelectedAssistantContext.Provider value={{ selectedAssistantId, setSelectedAssistantId }}>
      {children}
    </SelectedAssistantContext.Provider>
  );
}

// ========================
// Пустое состояние, если нет ассистентов
// ========================
function EmptyState() {
  const { t } = useTranslation('homepage');
  return (
    <AuthGuard requireAuth={true}>
      <div className="empty-state-container">
        <div className="empty-state-card">
          <div className="empty-state-icon">
            <Bot size={64} style={{ color: 'var(--fg-muted)' }} />
          </div>

          <h3 className="empty-state-title">
            {t('emptyState.title')}
          </h3>

          <p className="empty-state-description">
            {t('emptyState.description')}
          </p>

          <a href="/assistants/create" className="empty-state-button">
            <Bot size={20} />
            {t('emptyState.createButton')}
          </a>
        </div>
      </div>
    </AuthGuard>
  );
}

// ========================
// Главная страница
// ========================
export default function Home() {
  const { t } = useTranslation(['homepage', 'common']);
  const [assistants, setAssistants] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTestingOpen, setIsTestingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text'); // ← Состояние для вкладок

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      console.error('No auth token');
      setLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/assistants`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.ok ? res.json() : Promise.reject("Ошибка загрузки"))
      .then(data => {
        const assistantsList = data.data.assistants || [];
        setAssistants(assistantsList);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          {t('common:loading')}
        </div>
      </div>
    );
  }

  if (assistants.length === 0) {
    return <EmptyState />;
  }

  return (
    <AuthGuard requireAuth={true}>
      <AssistantsProvider>
        <div className="home-container">
          <div className="left-column">
            {/* Загрузка обучающего материала */}
            <section className="card">
              <h2 className="card-title">{t('uploadSection.title')}</h2>
              
              {/* Выбор ассистента */}
              <AssistantsDropdown />

              {/* Вкладки: Текст / Файл */}
              <div className="upload-tabs">
                <button
                  className={`tab-button ${activeTab === 'text' ? 'active' : ''}`}
                  onClick={() => setActiveTab('text')}
                >
                  <FileText size={18} />
                  Текст
                </button>
                <button
                  className={`tab-button ${activeTab === 'file' ? 'active' : ''}`}
                  onClick={() => setActiveTab('file')}
                >
                  <Upload size={18} />
                  Файл
                </button>
              </div>

              {/* Контент вкладок */}
              <div className="tab-content">
                {activeTab === 'text' && <UploadTextForm />}
                {activeTab === 'file' && <FileUploadForm />}
              </div>
            </section>

            {/* Инструкция по тестированию */}
            <section className="card">
              <h3 
                className="card-subtitle accordion-toggle" 
                onClick={() => setIsTestingOpen(!isTestingOpen)}
              >
                {t('testingSection.title')}
                <span className={`accordion-icon ${isTestingOpen ? 'open' : ''}`}>▼</span>
              </h3>
              <div className={`accordion-content ${isTestingOpen ? 'open' : ''}`}>
                <ol className="instruction-list">
                  <li>{t('testingSection.steps.1')}</li>
                  <li>{t('testingSection.steps.2')}</li>
                  <li>{t('testingSection.steps.3')}</li>
                  <li>{t('testingSection.steps.4')}</li>
                  <li>{t('testingSection.steps.5')}</li>
                </ol>
                <div className="example-box">
                  <strong>{t('testingSection.example.label')}</strong> {t('testingSection.example.text')}
                </div>
              </div>
            </section>
          </div>

          {/* Чат */}
          <section className="card chat-section">
            <h2 className="card-title">{t('chat.title')}</h2>
            <div className="chat-container">
              <Chat />
            </div>
          </section>
        </div>

        {/* Стили для вкладок */}
        <style jsx>{`
          .upload-tabs {
            display: flex;
            gap: 0.5rem;
            margin: 1rem 0;
            border-bottom: 2px solid var(--border-color);
          }

          .tab-button {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            background: transparent;
            border: none;
            border-bottom: 3px solid transparent;
            color: var(--fg-muted);
            font-size: 0.95rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-bottom: -2px;
          }

          .tab-button:hover {
            color: var(--fg-default);
            background: var(--bg-hover);
          }

          .tab-button.active {
            color: var(--primary-color);
            border-bottom-color: var(--primary-color);
          }

          .tab-content {
            margin-top: 1.5rem;
          }
        `}</style>
      </AssistantsProvider>
    </AuthGuard>
  );
}