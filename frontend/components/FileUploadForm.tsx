// frontend/components/FileUploadForm.tsx
"use client";
import React, { useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { Upload, FileText, X, AlertTriangle } from "lucide-react";
import { SelectedAssistantContext } from "./UploadTextForm";

import { FolderOpen } from 'lucide-react';
import FileManager from './FileManager';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zuuma.ru/api';

  export default function FileUploadForm() {
    const { t } = useTranslation('uploadForm');
    const { selectedAssistantId } = useContext(SelectedAssistantContext);

    const [showFileManager, setShowFileManager] = useState(false);
    
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      // Проверка размера (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setMessage("❌ Файл слишком большой. Максимум 10MB");
        return;
      }

      // Проверка типа
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'text/plain'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setMessage("❌ Поддерживаются только PDF, изображения (PNG, JPG) и текстовые файлы");
        return;
      }

      setFile(selectedFile);
      setMessage("");
    };


    const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAssistantId) {
      setMessage("❌ Выберите ассистента");
      return;
    }

    if (!file) {
      setMessage("❌ Выберите файл для загрузки");
      return;
    }

    if (!title.trim()) {
      setMessage("❌ Укажите название файла - это важно для поиска!");
      return;
    }

    setLoading(true);
    setMessage("⏳ Загрузка файла...");
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setMessage("❌ Требуется авторизация");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      if (description.trim()) {
        formData.append('description', description.trim());
      }

      const res = await fetch(
        `${API_BASE_URL}/assistants/${selectedAssistantId}/upload-file`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData,
        }
      );

      if (res.ok) {
        const result = await res.json();
        setMessage(`✅ ${result.data.message}`);
        
        setFile(null);
        setTitle("");
        setDescription("");

        await fetch(`${API_BASE_URL}/assistants/${selectedAssistantId}`, {
          method: "PATCH",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ trained: true }),
        });

      } else if (res.status === 401) {
        setMessage("❌ Сессия истекла. Войдите снова.");
      } else {
        const error = await res.text();
        setMessage("❌ Ошибка загрузки: " + error);
      }
    } catch (err) {
      setMessage("❌ Ошибка сети: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setMessage("");
  };

  return (
    <form onSubmit={handleUpload} className="file-upload-form">
      {/* Выбор файла */}
      <div className="file-input-wrapper">
        <label className="file-input-label">
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.txt"
            onChange={handleFileSelect}
            disabled={!selectedAssistantId}
            style={{ display: 'none' }}
          />
          <div className={`file-input-button ${!selectedAssistantId ? 'disabled' : ''}`}>
            <Upload size={20} />
            {file ? 'Изменить файл' : 'Выбрать файл'}
          </div>
        </label>
        
        {file && (
          <div className="file-selected">
            <FileText size={18} />
            <div className="file-info">
              <span className="file-name">{file.name}</span>
              <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="clear-btn"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="file-manager-section">
        <button
          type="button"
          onClick={() => setShowFileManager(true)}
          disabled={!selectedAssistantId}
          className="manage-files-btn"
        >
          <FolderOpen size={18} />
          Управление файлами
          {!selectedAssistantId && (
            <span className="tooltip">Сначала выберите ассистента</span>
          )}
        </button>
      </div>

      {showFileManager && selectedAssistantId && (
        <FileManager
          assistantId={selectedAssistantId}
          onClose={() => setShowFileManager(false)}
        />
      )}

      {/* ⚠️ ПРЕДУПРЕЖДЕНИЕ О КОНФИДЕНЦИАЛЬНОСТИ */}
      {file && (
        <div className="privacy-warning">
          <div className="warning-header">
            <AlertTriangle size={18} />
            <strong>Важно!</strong>
          </div>
          <div className="warning-text">
            AI-ассистент <strong>может отправлять загруженные файлы пользователям</strong> при ответе на вопросы.
            <br/>
            <br/>
            📌 <strong>Конфиденциальная информация</strong> (внутренние документы, правила отказа клиенту в чем-то и тд.) 
            должна добавляться <strong>только через форму "Текст"</strong>, а не файлом.
          </div>
        </div>
      )}

      {/* Поля только если файл выбран */}
      {file && (
        <>
          <div className="form-group">
            <label className="field-label">
              Название файла <span className="required">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Логотип пиццерии, Прайс-лист товаров, Инструкция по применению..."
              required
              autoFocus
              className="title-input"
            />
            <div className="field-hint">
              <strong>💡 Как правильно назвать:</strong><br/>
              • <strong>Хорошо:</strong> "Логотип пиццерии", "Прайс-лист 2025", "Схема подключения"<br/>
              • <strong>Плохо:</strong> "Без названия.jpg", "IMG_1234.png", "Скриншот"<br/>
              <br/>
              <em>Понятное название помогает боту правильно находить и отправлять файл</em>
            </div>
          </div>

          <div className="form-group">
            <label className="field-label">Описание (опционально)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Дополнительная информация о содержимом файла..."
              rows={2}
              className="description-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !selectedAssistantId || !title.trim()}
            className="upload-btn"
          >
            {loading ? "⏳ Загрузка..." : "📤 Загрузить файл"}
          </button>
        </>
      )}

      {/* Подсказка о форматах */}
      {!file && (
        <div className="formats-hint">
          <strong>Поддерживаемые форматы:</strong>
          <ul>
            <li>📄 PDF документы</li>
            <li>🖼️ Изображения (PNG, JPG)</li>
            <li>📝 Текстовые файлы (TXT)</li>
          </ul>
          <div className="format-note">
            📌 Максимальный размер: 10 МБ
          </div>
        </div>
      )}

      {message && (
        <div className={`message ${
          message.startsWith("✅") ? "success" : 
          message.startsWith("⏳") ? "loading" : 
          "error"
        }`}>
          {message.startsWith("⏳") && <span className="loading-spinner" />}
          {message}
        </div>
      )}

      <style jsx>{`
        .file-upload-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .file-input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .file-input-label {
          cursor: pointer;
        }

        .file-input-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          background: var(--bg-elevated);
          border: 2px dashed var(--border-color);
          border-radius: 8px;
          color: var(--fg-default);
          font-weight: 500;
          transition: all 0.2s;
        }

        .file-input-button:hover:not(.disabled) {
          border-color: var(--primary-color);
          background: var(--bg-hover);
        }

        .file-input-button.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .file-selected {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          border-radius: 8px;
        }

        .file-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .file-name {
          color: var(--fg-default);
          font-weight: 500;
          word-break: break-word;
        }

        .file-size {
          color: var(--fg-muted);
          font-size: 0.875rem;
        }

        .clear-btn {
          background: var(--danger-color);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.25rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: opacity 0.2s;
          flex-shrink: 0;
        }

        .clear-btn:hover {
          opacity: 0.8;
        }

        .privacy-warning {
          padding: 1rem;
          background: #fff3cd;
          border: 2px solid #ff9800;
          border-left: 4px solid #ff9800;
          border-radius: 8px;
          color: #856404;
        }

        .warning-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          color: #ff9800;
        }

        .warning-header strong {
          color: #ff9800;
          font-size: 0.95rem;
        }

        .warning-text {
          font-size: 0.85rem;
          line-height: 1.6;
        }

        .warning-text strong {
          color: #856404;
          font-weight: 700;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .field-label {
          font-weight: 600;
          color: var(--fg-default);
          font-size: 0.95rem;
        }

        .required {
          color: var(--danger-color);
          font-weight: 700;
        }

        .title-input,
        .description-input {
          padding: 0.75rem;
          border: 2px solid var(--border-color);
          border-radius: 6px;
          background: var(--bg-default);
          color: var(--fg-default);
          font-family: inherit;
          font-size: 0.95rem;
          transition: border-color 0.2s;
        }

        .title-input:focus,
        .description-input:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        .title-input::placeholder {
          color: var(--fg-muted);
          font-size: 0.9rem;
        }

        .field-hint {
          font-size: 0.75rem;
          line-height: 1.4;
          color: var(--fg-muted);
          padding: 0.75rem;
          background: var(--bg-elevated);
          border-radius: 6px;
          border-left: 3px solid var(--primary-color);
        }

        .field-hint strong {
          color: var(--fg-default);
        }

        .field-hint em {
          color: var(--fg-subtle);
          font-size: 0.7rem;
        }

        .upload-btn {
          padding: 0.875rem 1.5rem;
          background: var(--primary-color);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .upload-btn:hover:not(:disabled) {
          opacity: 0.9;
        }

        .upload-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .formats-hint {
          padding: 1rem;
          background: var(--bg-elevated);
          border-radius: 8px;
          font-size: 0.875rem;
        }

        .formats-hint strong {
          color: var(--fg-default);
          display: block;
          margin-bottom: 0.5rem;
        }

        .formats-hint ul {
          list-style: none;
          padding: 0;
          margin: 0 0 0.5rem 0;
          color: var(--fg-muted);
        }

        .formats-hint li {
          padding: 0.25rem 0;
        }

        .format-note {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: var(--bg-default);
          border-radius: 4px;
          font-size: 0.8rem;
          color: var(--fg-muted);
        }

        .message {
          padding: 0.875rem;
          border-radius: 8px;
          font-size: 0.875rem;
          line-height: 1.4;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .message.loading {
          background: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        }

        .loading-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid #0c5460;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .file-manager-section {
          margin-bottom: 1.5rem;
        }

        .manage-files-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .manage-files-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .manage-files-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #cbd5e1;
        }

        .manage-files-btn:disabled:hover .tooltip {
          opacity: 1;
          transform: translateY(0);
        }

        .tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(-8px);
          background: #1f2937;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: all 0.2s;
          margin-bottom: 8px;
        }

        .tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 6px solid transparent;
          border-top-color: #1f2937;
        }

      `}</style>
    </form>
  );
}