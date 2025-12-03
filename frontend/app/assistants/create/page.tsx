"use client";

import React, { useState } from "react";
import { Plus, Bell, MessageSquare, Mail, AlertTriangle } from "lucide-react";

export default function CreateAssistantPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    systemPrompt: "",
    notificationTelegramChatId: "",
    notificationEmail: "",
    escalationAutoReply:
      "Ваш запрос передан специалисту. Мы свяжемся с вами в ближайшее время.",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name) {
      alert("Введите название ассистента");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        systemPrompt: formData.systemPrompt,
        settings: {
          notificationTelegramChatId:
            formData.notificationTelegramChatId || null,
          notificationEmail: formData.notificationEmail || null,
          escalationAutoReply: formData.escalationAutoReply,
        },
      };

      const res = await fetch("/assistants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Ошибка создания ассистента");
        return;
      }

      // переход на страницу ассистента
      window.location.href = `/assistants/${data.data.id}`;
    } catch (e) {
      console.error("Create assistant error:", e);
      alert("Ошибка подключения к серверу");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "20px", color: "#E0E0E0" }}>
      {/* Заголовок */}
      <div
        style={{
          background: "#111111",
          padding: "30px",
          borderRadius: "16px",
          border: "1px solid #333",
          marginBottom: "20px",
        }}
      >
        <h1 style={{ fontSize: "1.8rem", marginBottom: "6px" }}>
          Создать нового ассистента
        </h1>
        <p style={{ opacity: 0.8 }}>
          Настройте AI ассистента и каналы уведомлений о важных событиях
        </p>
      </div>

      {/* Форма */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Основная информация */}
        <div
          style={{
            background: "#111111",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #333",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          }}
        >
          <h3
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "12px",
              color: "#E0E0E0",
            }}
          >
            <MessageSquare size={18} />
            Основная информация
          </h3>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>
              Название ассистента *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ассистент поддержки"
              style={{
                width: "100%",
                padding: "10px",
                background: "#333",
                border: "1px solid #444",
                borderRadius: "8px",
                fontSize: "15px",
                color: "#E0E0E0",
              }}
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>
              Описание
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Помогает клиентам с вопросами"
              style={{
                width: "100%",
                padding: "10px",
                background: "#333",
                border: "1px solid #444",
                borderRadius: "8px",
                fontSize: "15px",
                color: "#E0E0E0",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>
              Системный промпт
            </label>
            <textarea
              value={formData.systemPrompt}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, systemPrompt: e.target.value }))
              }
              placeholder="Вы - профессиональный консультант..."
              rows={3}
              style={{
                width: "100%",
                padding: "10px",
                background: "#333",
                border: "1px solid #444",
                borderRadius: "8px",
                fontSize: "15px",
                color: "#E0E0E0",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>

        {/* Настройки уведомлений */}
        <div
          style={{
            background: "#111111",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #333",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          }}
        >
          <h3
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "12px",
              color: "#E0E0E0",
            }}
          >
            <Bell size={18} />
            Настройки уведомлений
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Важное уведомление */}
            <div
              style={{
                background: "#2a2a2a",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #444",
              }}
            >
              <div style={{ display: "flex", gap: "6px", marginBottom: "6px", alignItems: "center" }}>
                <AlertTriangle size={18} color="#aaaaaa" />
                <strong style={{ color: "#E0E0E0" }}>Важно!</strong>
              </div>
              <p style={{ margin: 0, color: "#B0B0B0", lineHeight: "1.5" }}>
                Настройте уведомления, чтобы получать мгновенные оповещения когда:
                • Пользователь просит связаться с оператором
                • Заканчиваются токены
                • Происходит критическая ошибка
              </p>
            </div>

            {/* Telegram Chat ID */}
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <MessageSquare size={14} />
                  Telegram Chat ID
                </div>
              </label>
              <input
                type="text"
                value={formData.notificationTelegramChatId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    notificationTelegramChatId: e.target.value,
                  }))
                }
                placeholder="123456789"
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#333",
                  border: "1px solid #444",
                  borderRadius: "8px",
                  fontSize: "15px",
                  color: "#E0E0E0",
                }}
              />
              <p style={{ marginTop: "4px", fontSize: "13px", color: "#888888" }}>
                Получите Chat ID через бота @zuumanotificationbot
              </p>
            </div>

            {/* Email */}
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Mail size={14} />
                  Email для уведомлений
                </div>
              </label>
              <input
                type="email"
                value={formData.notificationEmail}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    notificationEmail: e.target.value,
                  }))
                }
                placeholder="manager@company.com"
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#333",
                  border: "1px solid #444",
                  borderRadius: "8px",
                  fontSize: "15px",
                  color: "#E0E0E0",
                }}
              />
              <p style={{ marginTop: "4px", fontSize: "13px", color: "#888888" }}>
                На этот email будут приходить важные уведомления
              </p>
            </div>

            {/* Escalation message */}
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>
                Сообщение при передаче оператору
              </label>
              <textarea
                value={formData.escalationAutoReply}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, escalationAutoReply: e.target.value }))
                }
                rows={2}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#333",
                  border: "1px solid #444",
                  borderRadius: "8px",
                  fontSize: "15px",
                  color: "#E0E0E0",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
              <p style={{ marginTop: "4px", fontSize: "13px", color: "#888888" }}>
                Это сообщение увидит пользователь при эскалации к оператору
              </p>
            </div>
          </div>
        </div>

        {/* Кнопка Создать ассистента */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: "12px 24px",
              background: loading ? "#333" : "#444",
              borderRadius: "8px",
              color: "white",
              fontSize: "16px",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Plus size={18} />
            {loading ? "Создание..." : "Создать ассистента"}
          </button>
        </div>
      </div>
    </div>
  );
}
