// frontend/components/UploadTextForm.tsx
"use client";
import React, { useEffect, useState, useContext, createContext } from "react";
import { useTranslation } from "react-i18next";
import TextManager from './TextManager';
import { FileText } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zuuma.ru/api';

// ===== КОНТЕКСТ ДЛЯ ВЫБРАННОГО АССИСТЕНТА =====

interface SelectedAssistantContextType {
  selectedAssistantId: string | null;
  setSelectedAssistantId: (id: string | null) => void;
}

// ✅ Правильный экспорт контекста
export const SelectedAssistantContext = createContext<SelectedAssistantContextType>({
  selectedAssistantId: null,
  setSelectedAssistantId: () => {},
});

// ===== ПРОВАЙДЕР КОНТЕКСТА =====

export function AssistantsProvider({ children }: { children: React.ReactNode }) {
  const [selectedAssistantId, setSelectedAssistantId] = useState<string | null>(null);

  return (
    <SelectedAssistantContext.Provider value={{ selectedAssistantId, setSelectedAssistantId }}>
      {children}
    </SelectedAssistantContext.Provider>
  );
}

// ===== КОМПОНЕНТ UPLOADTEXTFORM =====

export default function UploadTextForm() {
  const { t } = useTranslation('uploadForm');
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [showTextManager, setShowTextManager] = useState(false);

  const { selectedAssistantId } = useContext(SelectedAssistantContext);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAssistantId) {
      setMessage("❌ " + t('errors.selectAssistant'));
      return;
    }

    if (!text.trim()) {
      setMessage("❌ " + t('errors.enterText'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/assistants/${selectedAssistantId}/upload`, {
        method: "POST",
        credentials: "include", // ✅ Отправляем cookie
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.trim(),
          title: title.trim() || t('defaultTitle'),
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setMessage(`✅ ${result.message}`);
        setText("");
        setTitle("");

        // ✅ Обновляем статус обучения ассистента
        await fetch(`${API_BASE_URL}/assistants/${selectedAssistantId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { 
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ trained: true }),
        });

      } else if (res.status === 401) {
        setMessage("❌ Сессия истекла. Пожалуйста, войдите снова.");
      } else {
        const error = await res.text();
        setMessage("❌ " + t('errors.uploadError') + ": " + error);
      }
    } catch (err) {
      setMessage("❌ " + t('errors.networkError') + ": " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} className="upload-form">
      {!selectedAssistantId && (
        <div className="form-group">
          <div className="alert-warning">
            ⚠️ {t('warnings.selectFirst')}
          </div>
        </div>
      )}

      {/* ✅ КНОПКА УПРАВЛЕНИЯ ТЕКСТАМИ - ЗДЕСЬ */}
      <div className="text-manager-section">
        <button
          type="button"
          onClick={() => setShowTextManager(true)}
          disabled={!selectedAssistantId}
          className="manage-texts-btn"
        >
          <FileText size={18} />
          Управление текстами
          {!selectedAssistantId && (
            <span className="tooltip">Сначала выберите ассистента</span>
          )}
        </button>
      </div>

      {showTextManager && selectedAssistantId && (
        <TextManager
          assistantId={selectedAssistantId}
          onClose={() => setShowTextManager(false)}
        />
      )}

      <div className="form-group">
        <label>{t('fields.title')}</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('placeholders.title')}
          disabled={!selectedAssistantId}
        />
      </div>

      <div className="form-group textarea-group">
        <label>{t('fields.content')} *</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('placeholders.content')}
          required
          disabled={!selectedAssistantId}
        />
        <button
          type="submit"
          disabled={loading || !selectedAssistantId}
          className={!selectedAssistantId ? "disabled" : ""}
        >
          {loading ? t('buttons.uploading') : t('buttons.upload')}
        </button>
      </div>

      {message && (
        <div className={`message ${message.startsWith("✅") ? "success" : "error"}`}>
          {message}
        </div>
      )}
    </form>
  );
}

// ===== КОМПОНЕНТ ASSISTANTSDROPDOWN =====

export function AssistantsDropdown() {
  const { t } = useTranslation('uploadForm');
  const [assistants, setAssistants] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { selectedAssistantId, setSelectedAssistantId } = useContext(SelectedAssistantContext);

  useEffect(() => {
    fetch(`${API_BASE_URL}/assistants`, {
      credentials: "include", // ✅ куки автоматически подставятся
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
          }
          throw new Error(t('errors.loadAssistants'));
        }
        return res.json();
      })
      .then(data => {
        const assistantsList = data.data.assistants || [];
        setAssistants(assistantsList);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || t('errors.connectionError'));
        setLoading(false);
      });
  }, [t]);

  if (loading) return (
    <div className="assistants-dropdown">
      <div className="dropdown-loader">{t('loading.assistants')}</div>
    </div>
  );

  if (error) return (
    <div className="assistants-dropdown">
      <div className="dropdown-loader error">{error}</div>
    </div>
  );

  return (
    <div className="assistants-dropdown">
      <label className="assistants-dropdown-label">
        {t('dropdown.label')}
      </label>
      <select
        className="assistants-dropdown-select"
        value={selectedAssistantId || ""}
        onChange={e => setSelectedAssistantId(e.target.value)}
      >
        <option value="" disabled hidden>
          {t('dropdown.placeholder')}
        </option>
        {assistants.map(a => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>

      {selectedAssistantId && (
        <div className="selected-assistant-info">
          ✅ {t('dropdown.selected')}: {assistants.find(a => a.id === selectedAssistantId)?.name}
        </div>
      )}
    </div>
  );
}