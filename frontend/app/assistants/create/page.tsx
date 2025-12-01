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
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px',
        borderRadius: '16px',
        color: 'white',
        marginBottom: '30px'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>
          Создать нового ассистента
        </h1>
        <p style={{ opacity: 0.9 }}>
          Настройте AI ассистента и каналы уведомлений о важных событиях
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Основная информация */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px'
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
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px'
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
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

        {/* Настройки уведомлений */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
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
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={20} />
              Настройки уведомлений
            </h3>
            <span style={{ fontSize: '20px' }}>
              {showNotificationSettings ? '▼' : '▶'}
            </span>
          </div>

          {showNotificationSettings && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ 
                background: '#fef3c7', 
                padding: '16px', 
                borderRadius: '8px',
                border: '1px solid #fbbf24'
              }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <AlertTriangle size={20} color="#f59e0b" />
                  <strong>Важно!</strong>
                </div>
                <p style={{ margin: 0, color: '#78350f', lineHeight: '1.6' }}>
                  Настройте уведомления, чтобы получать мгновенные оповещения когда:<br/>
                  • Пользователь просит связаться с оператором<br/>
                  • Заканчиваются токены<br/>
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
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                  Получите Chat ID через бота @userinfobot в Telegram
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
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
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
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '16px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                  Это сообщение увидит пользователь при эскалации к оператору
                </p>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => window.history.back()}
            style={{
              padding: '12px 24px',
              background: 'white',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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

      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        background: '#f1f5f9', 
        borderRadius: '12px' 
      }}>
        <h4 style={{ marginBottom: '12px' }}>📱 Как настроить Telegram уведомления?</h4>
        <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
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