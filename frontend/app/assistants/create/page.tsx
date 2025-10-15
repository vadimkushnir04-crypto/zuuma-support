// app/assistants/create/page.tsx

"use client";
import React, { useState, useEffect } from "react";
import { Plus, Bot, Loader2, Sparkles, Zap, Users, ArrowLeft, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import AuthGuard from '../../../components/AuthGuard';

export default function CreateAssistantPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
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

      const res = await fetch(`http://localhost:4000/assistants`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error("Ошибка загрузки ассистентов");
      const data = await res.json();
      setAssistants(data.data.assistants || []);
    } catch (err) {
      setError("Не удалось загрузить ассистентов. Проверьте сервер.");
    } finally {
      setLoadingAssistants(false);
    }
  };

  useEffect(() => {
    loadAssistants();
  }, []);

  const demoOptions = [
    {
      title: "Банковский консультант",
      description: "Помогает с услугами банка, кредитами и картами",
      icon: "💰",
      color: "from-green-500 to-green-600"
    },
    {
      title: "HR-ассистент", 
      description: "Отвечает на вопросы сотрудников о политиках компании",
      icon: "👥",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Техподдержка",
      description: "Решает технические вопросы и проблемы пользователей",
      icon: "🔧",
      color: "from-purple-500 to-purple-600"
    }
  ];

  return (
   <AuthGuard requireAuth={true}>
    <div className="create-page">
      {notification && (
        <div className={`notification ${notification.type === "success" ? "notification-success" : "notification-error"}`}>
          {notification.message}
        </div>
      )}

      {/* Creation Options */}
      <div className="creation-section">
        <div className="creation-grid">
          {/* Create from scratch */}
          <div className="creation-card featured">
            <div className="creation-card-header">
              <div className="creation-icon custom">
                <Plus className="w-8 h-8" />
              </div>
            </div>
            
            <div className="creation-content">
              <h3 className="creation-title">Создать с нуля</h3>
              <p className="creation-description">
                Полная кастомизация: настройте личность, поведение и специализацию 
                ассистента под ваши конкретные задачи
              </p>
              
              <div className="creation-features">
                <div className="feature-item">
                  <CheckCircle className="w-4 h-4" />
                  <span>Любая специализация</span>
                </div>
                <div className="feature-item">
                  <CheckCircle className="w-4 h-4" />
                  <span>Настройка личности</span>
                </div>
                <div className="feature-item">
                  <CheckCircle className="w-4 h-4" />
                  <span>Гибкие промпты</span>
                </div>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="creation-button primary"
              >
                <Plus className="w-5 h-5" />
                Начать создание
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Assistants */}
      <div className="assistants-section">
        <div className="section-header">
          <h2 className="section-title">Ваши ассистенты</h2>
          <p className="section-subtitle">
            {assistants.length > 0 
              ? `У вас ${assistants.length} ${assistants.length === 1 ? 'ассистент' : 'ассистентов'}`
              : 'Пока нет созданных ассистентов'
            }
          </p>
        </div>

        <div className="assistants-display">
          {loadingAssistants ? (
            <div className="loading-state">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span>Загрузка ассистентов...</span>
            </div>
          ) : error ? (
            <div className="error-state">
              <span>{error}</span>
            </div>
          ) : assistants.length === 0 ? (
            <div className="empty-state">
              <Users className="w-12 h-12" />
              <h3>Нет ассистентов</h3>
              <p>Создайте своего первого ассистента, чтобы начать работу</p>
            </div>
          ) : (
            <div className="assistants-grid">
              {assistants.map((assistant) => (
                <div
                  key={assistant.id}
                  onClick={() => router.push("/assistants")}
                  className="assistant-card"
                >
                  <div className="assistant-icon">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="assistant-name">{assistant.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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

      // ✅ ИЗМЕНЕНО: убрали companyId из body
      const response = await fetch("http://localhost:4000/assistants", {
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
    <>
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">
            <Plus className="w-5 h-5" />
            Создать нового ассистента
          </h2>
          <p className="modal-description">
            Настройте AI ассистента для конкретного направления бизнеса
          </p>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
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

          <div className="form-field">
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

          <div className="form-field">
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
            <p className="form-help-text">
              Определяет личность и стиль общения ассистента
            </p>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="btn-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Создание...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Создать ассистента
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};