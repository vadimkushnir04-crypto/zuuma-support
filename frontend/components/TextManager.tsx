// frontend/components/TextManager.tsx

import React, { useState, useEffect } from 'react';
import { X, Trash2, FileText, Edit3 } from 'lucide-react';

interface TextItem {
  id: string;
  title: string;
  description?: string;
  chunks: number;
  createdAt?: string;
  preview?: string;
}

interface TextManagerProps {
  assistantId: string;
  onClose: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zuuma.ru/api';

export default function TextManager({ assistantId, onClose }: TextManagerProps) {
  const [texts, setTexts] = useState<TextItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<TextItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editContent, setEditContent] = useState('');
  const [updating, setUpdating] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    loadTexts();
  }, [assistantId]);

  const loadTexts = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/assistants/${assistantId}/texts`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setTexts(data.texts || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки текстов:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTextContent = async (textId: string) => {
    setLoadingContent(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/assistants/${assistantId}/texts/${textId}/content`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setEditContent(data.data.text);
      } else {
        alert('Ошибка загрузки текста');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка загрузки текста');
    } finally {
      setLoadingContent(false);
    }
  };

  const deleteText = async (textId: string, title: string) => {
    if (!confirm(`Удалить текст "${title}"?`)) return;

    setDeleting(textId);
    try {
      const response = await fetch(
        `${API_BASE_URL}/assistants/${assistantId}/texts/${textId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (response.ok) {
        setTexts(texts.filter(t => t.id !== textId));
      } else {
        alert('Ошибка удаления');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка удаления');
    } finally {
      setDeleting(null);
    }
  };

  const updateText = async () => {
    if (!editingText || !editTitle.trim() || !editContent.trim()) return;

    setUpdating(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/assistants/${assistantId}/texts/${editingText.id}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editTitle.trim(),
            description: editDescription.trim(),
            text: editContent.trim(),
          }),
        }
      );

      if (response.ok) {
        await loadTexts();
        setEditingText(null);
      } else {
        alert('Ошибка обновления');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка обновления');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="text-manager-overlay">
      <div className="text-manager-modal">
        <div className="modal-header">
          <h2>📝 Загруженные тексты</h2>
          <button onClick={onClose} className="close-btn">
            <X size={24} />
          </button>
        </div>

        <div className="modal-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Загрузка текстов...</p>
            </div>
          ) : texts.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} />
              <p>Тексты не загружены</p>
            </div>
          ) : (
            <div className="texts-list">
              {texts.map((text) => (
                <div key={text.id} className="text-card">
                  <div className="text-icon">
                    <FileText size={32} />
                  </div>

                  <div className="text-info">
                    <h3 className="text-title">{text.title}</h3>
                    {text.description && (
                      <p className="text-description">{text.description}</p>
                    )}
                    {text.preview && (
                      <p className="text-preview">{text.preview}...</p>
                    )}
                    <div className="text-meta">
                      <span>{text.chunks} фрагментов</span>
                      {text.createdAt && (
                        <span>{new Date(text.createdAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-actions">
                    <button
                      onClick={async () => {
                        setEditingText(text);
                        setEditTitle(text.title);
                        setEditDescription(text.description || '');
                        await loadTextContent(text.id);
                      }}
                      className="action-btn edit-btn"
                      title="Редактировать"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => deleteText(text.id, text.title)}
                      disabled={deleting === text.id}
                      className="action-btn delete-btn"
                      title="Удалить"
                    >
                      {deleting === text.id ? (
                        <div className="mini-spinner" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editingText && (
        <div className="edit-overlay" onClick={() => setEditingText(null)}>
          <div className="edit-modal large" onClick={(e) => e.stopPropagation()}>
            <div className="edit-header">
              <h3>✏️ Редактировать текст</h3>
              <button onClick={() => setEditingText(null)} className="close-btn">
                <X size={20} />
              </button>
            </div>
            
            <div className="edit-content">
              <div className="form-group">
                <label>Название *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Описание</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label>Содержимое *</label>
                {loadingContent ? (
                  <div className="loading-content">
                    <div className="spinner" />
                    <p>Загрузка содержимого...</p>
                  </div>
                ) : (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={12}
                    className="content-textarea"
                    placeholder="Содержимое текста..."
                  />
                )}
              </div>

              <div className="edit-actions">
                <button 
                  onClick={() => setEditingText(null)} 
                  className="cancel-btn" 
                  disabled={updating}
                >
                  Отмена
                </button>
                <button 
                  onClick={updateText} 
                  disabled={!editTitle.trim() || !editContent.trim() || updating || loadingContent} 
                  className="save-btn"
                >
                  {updating ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`     
        .texts-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .text-card {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: #222;
          border: 1px solid #333;
          border-radius: 8px;
        }
        
        .text-icon {
          color: #667eea;
          flex-shrink: 0;
        }
        
        .text-info {
          flex: 1;
        }
        
        .text-title {
          margin: 0 0 8px 0;
          font-size: 1rem;
          color: #fff;
        }
        
        .text-description {
          margin: 0 0 8px 0;
          font-size: 0.85rem;
          color: #999;
        }
        
        .text-preview {
          margin: 0 0 8px 0;
          font-size: 0.75rem;
          color: #666;
          font-style: italic;
        }
        
        .text-meta {
          display: flex;
          gap: 16px;
          font-size: 0.75rem;
          color: #666;
        }
        
        .text-actions {
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #333;
          background: #222;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #fff;
        }

        .close-btn {
          background: #2a2a2a;
          border: 1px solid #444;
          cursor: pointer;
          color: #aaa;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #333;
          color: #fff;
          border-color: #555;
        }

        .modal-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: #1a1a1a;
        }

        .loading-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #666;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #333;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .empty-state svg {
          color: #444;
          margin-bottom: 16px;
        }

        .action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          background: #2a2a2a;
          border: 1px solid #333;
          border-radius: 4px;
          cursor: pointer;
          color: #aaa;
          text-decoration: none;
          transition: all 0.2s;
        }

        .action-btn:hover:not(:disabled) {
          background: #333;
          border-color: #444;
        }

        .view-btn:hover {
          color: #667eea;
          border-color: #667eea;
        }

        .download-btn:hover {
          color: #10b981;
          border-color: #10b981;
        }

        .delete-btn:hover:not(:disabled) {
          color: #ef4444;
          border-color: #ef4444;
        }

        .action-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .mini-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid #444;
          border-top-color: #ef4444;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @media (max-width: 768px) {
          .files-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          }
        }

        .edit-modal.large {
          max-width: 700px;
        }

        .content-textarea {
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.85rem;
          line-height: 1.6;
        }

        .loading-content {
          padding: 40px;
          text-align: center;
          color: #666;
        }

      `}</style>
    </div>
  );
}