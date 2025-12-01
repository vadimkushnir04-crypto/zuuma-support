"use client";

import React, { useState } from 'react';
import { Plus, Bell, MessageSquare, Mail, AlertTriangle } from 'lucide-react';

export default function CreateAssistantWithNotifications() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    systemPrompt: "",
    notificationTelegramChatId: "",
    notificationEmail: "",
    escalationAutoReply: "Ваш запрос передан специалисту. Мы свяжемся с вами в ближайшее время.",
  });

  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submit:', formData);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', color: "#E0E0E0" }}>
      
      {/* Заголовок */}
      <div style={{
        background: '#111111',
        padding: '40px',
        borderRadius: '16px',
        color: '#E0E0E0',
        border: "1px solid #333",
        marginBottom: '30px'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>
          Создать нового ассистента
        </h1>
        <p style={{ opacity: 0.8 }}>
          Настройте AI ассистента и каналы уведомлений о важных событиях
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Основная информация */}
        <div style={{
          background: '#111111',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #333',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#E0E0E0' }}>
            <MessageSquare size={20} />
            Основная информация
          </h3>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Название ассистента *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ассистент поддержки"
              style={{
                width: '100%',
                padding: '12px',
                background: '#333333',
                border: '1px solid #444',
                borderRadius: '8px',
                fontSize: '16px',
                color: '#E0E0E0'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Описание
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Помогает клиентам с вопросами"
              style={{
                width: '100%',
                padding: '12px',
                background: '#333333',
                border: '1px solid #444',
                borderRadius: '8px',
                fontSize: '16px',
                color: '#E0E0E0'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Системный промпт
            </label>
            <textarea
              value={formData.systemPrompt}
              onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
              placeholder="Вы - профессиональный консультант..."
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                background: '#333333',
                border: '1px solid #444',
                borderRadius: '8px',
                fontSize: '16px',
                resize: 'vertical',
                color: '#E0E0E0',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

        {/* Настройки уведомлений */}
        <div style={{
          background: '#111111',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #333',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <div
            onClick={() => setShowNotificationSettings(!showNotificationSettings)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              marginBottom: showNotificationSettings ? '20px' : '0'
            }}
          >
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E0E0E0' }}>
              <Bell size={20} />
              Настройки уведомлений
            </h3>
            <span style={{ fontSize: '20px', color: "#E0E0E0" }}>
              {showNotificationSettings ? '▼' : '▶'}
            </span>
          </div>

          {showNotificationSettings && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              <div style={{
                background: '#2a2a2a',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #444'
              }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <AlertTriangle size={20} color="#aaaaaa" />
                  <strong style={{ color: '#E0E0E0' }}>Важно!</strong>
                </div>
                <p style={{ margin: 0, color: '#B0B0B0', lineHeight: '1.6' }}>
                  Настройте уведомления, чтобы получать мгновенные оповещения когда:<br />
                  • Пользователь просит связаться с оператором<br />
                  • Заканчиваются токены<br />
                  • Происходит критическая ошибка
                </p>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={16} />
                    Telegram Chat ID для уведомлений
                  </div>
                </label>
                <input
                  type="text"
                  value={formData.notificationTelegramChatId}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    notificationTelegramChatId: e.target.value
                  }))}
                  placeholder="123456789"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#333333',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    fontSize: '16px',
                    color: "#E0E0E0"
                  }}
                />
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#888888' }}>
                  Получите Chat ID через бота @userinfobot
                </p>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={16} />
                    Email для уведомлений
                  </div>
                </label>
                <input
                  type="email"
                  value={formData.notificationEmail}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    notificationEmail: e.target.value
                  }))}
                  placeholder="manager@company.com"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#333333',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    fontSize: '16px',
                    color: "#E0E0E0"
                  }}
                />
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#888888' }}>
                  На этот email будут приходить важные уведомления
                </p>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  Сообщение при передаче оператору
                </label>
                <textarea
                  value={formData.escalationAutoReply}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    escalationAutoReply: e.target.value
                  }))}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#333333',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    fontSize: '16px',
                    resize: 'vertical',
                    color: "#E0E0E0",
                    fontFamily: 'inherit'
                  }}
                />
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#888888' }}>
                  Это сообщение увидит пользователь при эскалации к оператору
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Кнопки */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => window.history.back()}
            style={{
              padding: '12px 24px',
              background: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              color: "#E0E0E0"
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '12px 24px',
              background: '#444444',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={20} />
            Создать ассистента
          </button>
        </div>
      </div>

      {/* Блок с инструкцией Telegram */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        background: '#111111',
        borderRadius: '12px',
        border: '1px solid #333',
        color: "#E0E0E0"
      }}>
        <h4 style={{ marginBottom: '12px' }}>📱 Как настроить Telegram уведомления?</h4>
        <ol style={{
          margin: 0,
          paddingLeft: '20px',
          lineHeight: '1.8',
          color: '#B0B0B0'
        }}>
          <li>Откройте бота <strong>@userinfobot</strong> в Telegram</li>
          <li>Отправьте ему любое сообщение</li>
          <li>Скопируйте ваш <strong>Chat ID</strong> из ответа</li>
          <li>Вставьте Chat ID в поле выше</li>
          <li>Готово! Вы будете получать мгновенные уведомления</li>
        </ol>
      </div>

    </div>
  );
}
