// frontend/components/telegram/ManualBotConnection.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { ExternalLink, Copy, CheckCircle, AlertTriangle, Link } from 'lucide-react';
import { telegramAPI } from '../../lib/api/telegram';
import { ConnectManualBotRequest } from '@/lib/api/telegram';

interface Assistant {
  id: string;
  name: string;
  description: string;
  trained?: boolean;
  trainingData?: string;
}

interface ManualBotConnectionProps {
  assistants: Assistant[];
  onBotCreated: (bot: any) => void;
}

export default function ManualBotConnection({ assistants, onBotCreated }: ManualBotConnectionProps) {
  const [selectedAssistant, setSelectedAssistant] = useState('');
  const [botName, setBotName] = useState('');
  const [botToken, setBotToken] = useState('');
  const [botDescription, setBotDescription] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [tokenValidation, setTokenValidation] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');

  // Автоматический выбор ассистента, если он один
  useEffect(() => {
    if (assistants.length === 1 && !selectedAssistant) {
      setSelectedAssistant(assistants[0].id);
      console.log('🟢 Auto-selected assistant:', assistants[0].id);
    }
  }, [assistants, selectedAssistant]);

  const instructions = [
    {
      step: 1,
      title: "Откройте @BotFather в Telegram",
      description: "Найдите официального BotFather в Telegram",
      action: (
        <a 
          href="https://t.me/botfather" 
          target="_blank" 
          rel="noopener noreferrer"
          className="instruction-link"
        >
          <ExternalLink size={16} />
          Открыть @BotFather
        </a>
      )
    },
    {
      step: 2,
      title: "Создайте нового бота",
      description: "Отправьте команду /newbot и следуйте инструкциям",
      action: (
        <button 
          className="copy-command"
          onClick={() => {
            navigator.clipboard.writeText('/newbot');
            alert('Скопировано!');
          }}
        >
          <Copy size={16} />
          /newbot
        </button>
      )
    },
    {
      step: 3,
      title: "Получите токен бота",
      description: "BotFather выдаст токен вида: 1234567890:AAH...",
      action: null
    },
    {
      step: 4,
      title: "Вставьте токен ниже",
      description: "Мы подключим бота к вашему ассистенту",
      action: null
    }
  ];

  const validateToken = (token: string) => {
    if (!token || token.length < 10) {
      setTokenValidation('idle');
      return;
    }

    setTokenValidation('validating');
    
    setTimeout(() => {
      const tokenRegex = /^\d+:[\w-]{35,45}$/;
      if (tokenRegex.test(token)) {
        setTokenValidation('valid');
      } else {
        setTokenValidation('invalid');
      }
    }, 500);
  };

  const handleTokenChange = (value: string) => {
    setBotToken(value);
    setError('');
    validateToken(value);
  };

  const handleConnectBot = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setIsConnecting(true);

    if (!selectedAssistant) {
      setError('⚠️ Пожалуйста, выберите ассистента.');
      setIsConnecting(false);
      return;
    }

    const payload: ConnectManualBotRequest = {
      botName,
      botToken,
      description: botDescription,
      assistantId: selectedAssistant,
      creationMethod: 'manual',
    };

    console.log('📤 Sending payload to backend:', payload);

    try {
      // ✅ telegramAPI.connectManualBot должен использовать fetch с credentials: 'include'
      const result = await telegramAPI.connectManualBot(payload);

      if (result.success && result.integration) {
        console.log('✅ Bot created:', result);
        onBotCreated(result.integration); // обновление в родителе
      } else {
        throw new Error(result.error || 'Ошибка подключения бота');
      }
    } catch (err) {
      console.error('❌ Error connecting bot:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setIsConnecting(false);
    }
  };


  return (
    <div className="manual-bot-connection">
      <div className="connection-header">
        <h4>Подключение готового бота</h4>
        <p>Создайте бота через @BotFather и подключите к нашей платформе</p>
      </div>

      <div className="instructions-section">
        <h5>Пошаговая инструкция:</h5>
        <div className="instructions-list">
          {instructions.map((instruction) => (
            <div key={instruction.step} className="instruction-item">
              <div className="instruction-number">{instruction.step}</div>
              <div className="instruction-content">
                <h6>{instruction.title}</h6>
                <p>{instruction.description}</p>
                {instruction.action && <div className="instruction-action">{instruction.action}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleConnectBot}>
        <div className="form-group">
          <label>Выберите обученного ассистента *</label>
          <div className="assistants-grid">
            {assistants.map((assistant) => (
              <div
                key={assistant.id}
                className={`assistant-card ${selectedAssistant === assistant.id ? 'assistant-card-selected' : ''}`}
                onClick={() => {
                  setSelectedAssistant(assistant.id);
                  console.log('👉 Selected assistantId clicked:', assistant.id);
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="assistant-info">
                  <h5>{assistant.name}</h5>
                  <p>{assistant.description || 'Нет описания'}</p>
                  {assistant.trainingData && <small>{assistant.trainingData}</small>}
                </div>
                {assistant.trained !== false && (
                  <div className="assistant-status trained">
                    <CheckCircle size={16} />
                    Готов
                  </div>
                )}
              </div>
            ))}
          </div>
          {assistants.length === 0 && (
            <p style={{ color: '#666', fontStyle: 'italic' }}>
              Нет доступных ассистентов. Создайте ассистента перед подключением бота.
            </p>
          )}
        </div>

        <div className="form-group">
          <label>Токен бота *</label>
          <div className="token-input-group">
            <input
              type="text"
              value={botToken}
              onChange={(e) => handleTokenChange(e.target.value)}
              placeholder="1234567890:AAH_your_bot_token_here"
              className={`form-input token-input ${tokenValidation !== 'idle' ? tokenValidation : ''}`}
              required
            />
            <div className="token-validation">
              {tokenValidation === 'validating' && <div className="validation-spinner">Проверка...</div>}
              {tokenValidation === 'valid' && (
                <div className="validation-success">
                  <CheckCircle size={16} color="#10b981" />
                  Токен корректен
                </div>
              )}
              {tokenValidation === 'invalid' && (
                <div className="validation-error">
                  <AlertTriangle size={16} color="#ef4444" />
                  Неверный формат токена
                </div>
              )}
            </div>
          </div>
          <small>Токен должен иметь вид: 1234567890:AAH...</small>
        </div>

        <div className="form-group">
          <label>Название интеграции *</label>
          <input
            type="text"
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            placeholder="Например: Мой Support Bot"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label>Описание (необязательно)</label>
          <textarea
            value={botDescription}
            onChange={(e) => setBotDescription(e.target.value)}
            placeholder="Краткое описание назначения этого бота"
            className="form-textarea"
            rows={3}
          />
        </div>

        {selectedAssistant && botName && tokenValidation === 'valid' && (
          <div className="bot-preview">
            <h5>Готов к подключению:</h5>
            <div className="preview-card">
              <div className="preview-info">
                <strong>{botName}</strong>
                <p>Ассистент: {assistants.find(a => a.id === selectedAssistant)?.name}</p>
                <p>Assistant ID: {selectedAssistant}</p>
                <small>Токен: {botToken.substring(0, 15)}...</small>
              </div>
              <Link size={24} />
            </div>
          </div>
        )}

        <button
          type="submit"
          className="btn-primary connect-bot-btn"
          disabled={!selectedAssistant || !botName || !botToken || tokenValidation !== 'valid' || isConnecting}
        >
          {isConnecting ? (
            <>
              <div className="spinner" />
              Подключение...
            </>
          ) : (
            <>
              <Link size={20} />
              Подключить бота
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="error-message" style={{
          padding: '12px',
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px',
          color: '#c00',
          marginBottom: '16px'
        }}>
          ❌ {error}
        </div>
      )}

      <div className="help-section">
        <h5>Нужна помощь?</h5>
        <div className="help-links">
          <a
            href="https://core.telegram.org/bots#creating-a-new-bot"
            target="_blank" 
            rel="noopener noreferrer"
            className="help-link"
          >
            <ExternalLink size={16} />
            Официальная документация
          </a>
        </div>
      </div>
    </div>
  );
}