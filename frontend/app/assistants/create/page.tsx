"use client";

import React, { useState, useEffect } from "react";
import { Plus, Bot, Loader2, CheckCircle, Users, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import AuthGuard from '../../../components/AuthGuard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://zuuma.ru/api";

export default function CreateAssistantPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [assistants, setAssistants] = useState<{ id: string; name: string }[]>([]);
  const [loadingAssistants, setLoadingAssistants] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadAssistants = async () => {
    setLoadingAssistants(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setError('Требуется авторизация');
        setLoadingAssistants(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/assistants`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error("Ошибка загрузки ассистентов");
      const data = await res.json();
      setAssistants(data.data.assistants || []);
    } catch (err) {
      setError("Не удалось загрузить ассистентов");
    } finally {
      setLoadingAssistants(false);
    }
  };

  useEffect(() => {
    loadAssistants();
  }, []);

  return (
    <AuthGuard requireAuth={true}>
    <div className="new-design-system">
      <div className="page-container">
        <div className="page-content">
          {/* Notification */}
          {notification && (
            <div className={`notification ${notification.type === "success" ? "notification-success" : "notification-error"}`}>
              {notification.message}
            </div>
          )}

          {/* Page Header */}
          <div className="page-header">
            <div className="page-header-content">
              <div>
                <h1 className="page-title">Создать ассистента</h1>
                <p className="page-subtitle">
                  Настройте AI ассистента под конкретные задачи вашего бизнеса
                </p>
              </div>
            </div>
          </div>

          {/* Create Section */}
          <div className="grid grid-cols-1" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-secondary) 100%)' }}>
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '80px',
                  height: '80px',
                  background: 'var(--accent-light)',
                  borderRadius: 'var(--radius-xl)',
                  margin: '20px'
                }}>
                  <Sparkles size={40} color="var(--accent)" />
                </div>
                
                <h2 style={{ fontSize: '1.5rem', margin: '10px' }}>
                  Создать с нуля
                </h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  Полная кастомизация: настройте личность, поведение и специализацию 
                  ассистента под ваши конкретные задачи
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary btn-lg"
                >
                  <Plus size={20} />
                  Начать создание
                </button>
              </div>
            </div>
          </div>

          {/* Existing Assistants */}
          <div style={{ marginTop: 'var(--space-3xl)' }}>
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <h2 style={{ fontSize: '1.5rem', margin: '20px' }}>
                Ваши ассистенты
              </h2>
              <p style={{ color: 'var(--text-secondary)', margin: '20px' }}>
                {assistants.length > 0 
                  ? `У вас ${assistants.length} ${assistants.length === 1 ? 'ассистент' : 'ассистентов'}`
                  : 'Пока нет созданных ассистентов'
                }
              </p>
            </div>

            {loadingAssistants ? (
              <div className="loading">
                <div className="spinner"></div>
                <span style={{ marginLeft: 'var(--space-md)' }}>Загрузка ассистентов...</span>
              </div>
            ) : error ? (
              <div className="empty-state">
                <span style={{ color: 'var(--error)' }}>{error}</span>
              </div>
            ) : assistants.length === 0 ? (
              <div className="empty-state">
                <Users size={48} />
                <h3>Нет ассистентов</h3>
                <p>Создайте своего первого ассистента, чтобы начать работу</p>
              </div>
            ) : (
              <div className="grid grid-cols-3">
                {assistants.map((assistant) => (
                  <div
                    key={assistant.id}
                    onClick={() => router.push("/assistants")}
                    className="card"
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="flex items-center gap-md">
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--accent-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Bot size={24} color="var(--accent)" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4>{assistant.name}</h4>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <CreateAssistantModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={(message) => {
              showNotification("success", message);
              setShowCreateModal(false);
              loadAssistants();
            }}
          />
        )}
      </div>
    </div>
    </AuthGuard>
  );
}

// Modal Component
const CreateAssistantModal = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (message: string) => void;
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    systemPrompt: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        alert("Требуется авторизация");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/assistants`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        onSuccess(result.message || "Ассистент создан успешно");
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ошибка создания ассистента");
      }
    } catch (error) {
      console.error("Ошибка создания ассистента:", error);
      alert(error instanceof Error ? error.message : "Ошибка создания ассистента");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-design-system">
    <>
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-container">
        <div className="modal-header">
          <div className="flex items-center gap-md">
            <Plus size={24} />
            <div>
              <h2 className="modal-title">Создать нового ассистента</h2>
              <p className="modal-description">
                Настройте AI ассистента для конкретного направления бизнеса
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Название ассистента *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="form-input"
                placeholder="Банковский помощник"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Описание</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="form-input"
                placeholder="Помогает клиентам с банковскими услугами"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Системный промпт</label>
              <textarea
                value={formData.systemPrompt}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    systemPrompt: e.target.value,
                  }))
                }
                className="form-textarea"
                placeholder="Вы - профессиональный консультант банка. Отвечайте вежливо и помогайте клиентам..."
              />
              <span className="form-help-text">
                Определяет личность и стиль общения ассистента
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="btn btn-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="spinner" size={16} />
                  Создание...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Создать ассистента
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  </div>
  );
};