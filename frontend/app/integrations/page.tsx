"use client";

import React, { useState } from 'react';
import {
  Globe,
  MessageCircle,
  Code2,
  Smartphone,
  Zap,
  Copy,
  ExternalLink,
  Plus,
  Settings,
  Play,
  Pause,
  Trash2,
  Eye,
  X,
  Save,
  TrendingUp,
  Users,
  MessageSquare
} from 'lucide-react';
import { useIntegrations } from '../../hooks/useIntegrations';
import { useAssistants } from '../../hooks/useAssistants';
import ManualBotConnection from '../../components/telegram/ManualBotConnection';
import AuthGuard from '../../components/AuthGuard';
import { Integration as IntegrationType } from '../../lib/api/integrations';

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState('telegram');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationType | null>(null);

  const {
    integrations,
    loading,
    toggleIntegration,
    deleteIntegration,
    refreshIntegrations,
    isProcessing,
  } = useIntegrations();

  const { assistants } = useAssistants();

  const formatIntegrationDate = (int: IntegrationType) => {
    const raw = (int as any).created ?? (int as any).createdAt ?? (int as any).created_at ?? null;
    if (!raw) return 'Дата не указана';
    const d = typeof raw === 'number' ? new Date(raw) : new Date(raw);
    if (isNaN(d.getTime())) return 'Дата не указана';
    return d.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleToggleIntegration = async (id: string) => {
    try {
      await toggleIntegration(id);
    } catch (err) {
      console.error(err);
      alert('Не удалось переключить интеграцию. Посмотри консоль.');
    }
  };

  const handleDeleteIntegration = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту интеграцию?')) return;
    try {
      await deleteIntegration(id);
    } catch (err) {
      console.error(err);
      alert('Не удалось удалить интеграцию. Посмотри консоль.');
    }
  };

  const handleBotCreated = (bot: any) => {
    setShowCreateModal(false);
    refreshIntegrations();
  };

  const openAnalytics = async (integration: IntegrationType) => {
    setSelectedIntegration(integration);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/integrations/${integration.id}/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const analytics = await response.json();
        setSelectedIntegration({ ...integration, ...analytics });
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
    
    setShowAnalyticsModal(true);
  };

  const openSettings = (integration: IntegrationType) => {
    setSelectedIntegration(integration);
    setShowSettingsModal(true);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedIntegration) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;
    const assistantId = formData.get('assistantId') as string;
    const commandsStr = formData.get('commands') as string;
    const commands = commandsStr.split(',').map(c => c.trim()).filter(c => c);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/integrations/${selectedIntegration.id}/settings`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, assistantId, commands })
        }
      );

      if (response.ok) {
        setShowSettingsModal(false);
        refreshIntegrations();
        alert('Настройки успешно сохранены!');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Не удалось сохранить настройки');
    }
  };

  const integrationTypes = [
    {
      id: 'telegram',
      title: 'Telegram Bot',
      description: 'Подключите бота в Telegram вручную',
      icon: <MessageCircle size={24} />,
      color: '#0088cc',
      badge: 'Популярно'
    },
    {
      id: 'widget',
      title: 'Веб-виджет',
      description: 'Встройте чат-бота на ваш сайт',
      icon: <Globe size={24} />,
      color: '#888888'
    },
    {
      id: 'api',
      title: 'REST API',
      description: 'Интегрируйте через API в ваше приложение',
      icon: <Code2 size={24} />,
      color: '#10b981'
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp Business',
      description: 'Подключите к WhatsApp Business API',
      icon: <Smartphone size={24} />,
      color: '#25d366',
      badge: 'Скоро'
    }
  ];

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="dashboard">
          <div className="dashboard-header">
            <h1 className="dashboard-title">
              <Zap size={32} />
              Интеграции
            </h1>
            <p className="dashboard-subtitle">Загрузка...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="dashboard">
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            <Zap size={32} />
            Интеграции
          </h1>
          <p className="dashboard-subtitle">
            Подключите ваших ассистентов к различным платформам и сервисам
          </p>
        </div>

        <div className="integration-types">
          {integrationTypes.map((type) => (
            <div
              key={type.id}
              className={`integration-type ${activeTab === type.id ? 'active' : ''} ${type.badge === 'Скоро' ? 'disabled' : ''}`}
              onClick={() => type.badge !== 'Скоро' && setActiveTab(type.id)}
            >
              <div className="type-icon" style={{ color: type.color }}>
                {type.icon}
              </div>
              <h3>{type.title}</h3>
              <p>{type.description}</p>
              {type.badge && (
                <div className={`type-badge ${type.badge === 'Популярно' ? 'popular' : 'coming-soon'}`}>
                  {type.badge}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="integrations-section">
          <div className="section-header">
            <h2>Активные интеграции</h2>
            <button
              className="btn-primary"
              onClick={() => setShowCreateModal(true)}
              disabled={activeTab === 'whatsapp'}
            >
              <Plus size={16} />
              Создать интеграцию
            </button>
          </div>

          <div className="integrations-list">
            {integrations
              .filter(int => (int.type ?? 'telegram') === activeTab)
              .map((integration) => (
                <div key={integration.id} className="integration-card">
                  <div className="integration-info">
                    <div className="integration-header">
                      <h4>{integration.name}</h4>
                      <div className={`status-badge ${integration.status}`}>
                        {integration.status === 'active' ? 'Активен' :
                          integration.status === 'creating' ? 'Создается...' :
                            integration.status === 'pending' ? 'Настраивается...' : 'Остановлен'}
                      </div>
                    </div>

                    <p>
                      Ассистент: <strong>
                        {integration.assistantName ||
                          (integration as any).assistant?.name ||
                          integration.assistant ||
                          integration.assistantId ||
                          'Не указан'}
                      </strong>
                    </p>

                    {integration.type === 'telegram' && integration.config?.telegramUrl && (
                      <div className="telegram-info-block">
                        <p>Username: @{integration.config.telegramUsername}</p>
                        <p>Команды: {integration.config.commands?.join(', ') || '/start'}</p>
                        <a                                         // ← ДОБАВЬТЕ 
                          href={integration.config.telegramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="telegram-link"
                        >
                          <MessageCircle size={16} />
                          Открыть бота
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    )}

                    <p className="creation-date">
                      Создан: {formatIntegrationDate(integration as IntegrationType)}
                    </p>
                  </div>

                  <div className="integration-actions">
                    {integration.type === 'telegram' && integration.config?.telegramToken && (
                      <button
                        className="btn-icon"
                        title="Скопировать токен"
                        onClick={() => navigator.clipboard.writeText(integration.config!.telegramToken!)}
                      >
                        <Copy size={16} />
                      </button>
                    )}

                    <button 
                      className="btn-icon" 
                      title="Аналитика"
                      onClick={() => openAnalytics(integration)}
                    >
                      <Eye size={16} />
                    </button>

                    <button 
                      className="btn-icon" 
                      title="Настройки"
                      onClick={() => openSettings(integration)}
                    >
                      <Settings size={16} />
                    </button>

                    <button
                      className="btn-icon"
                      onClick={() => handleToggleIntegration(integration.id)}
                      title={integration.status === 'active' ? 'Остановить' : 'Запустить'}
                      disabled={integration.status === 'creating' || isProcessing(integration.id)}
                    >
                      {isProcessing(integration.id) ? <span className="btn-loader" /> :
                        (integration.status === 'active' ? <Pause size={16} /> : <Play size={16} />)}
                    </button>

                    <button
                      className="btn-icon danger"
                      onClick={() => handleDeleteIntegration(integration.id)}
                      title="Удалить"
                      disabled={integration.status === 'creating' || isProcessing(integration.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

            {integrations.filter(int => (int.type ?? 'telegram') === activeTab).length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">
                  {integrationTypes.find(t => t.id === activeTab)?.icon}
                </div>
                <h3>Нет интеграций</h3>
                <p>Создайте свою первую интеграцию типа {integrationTypes.find(t => t.id === activeTab)?.title}</p>
                {activeTab !== 'whatsapp' && (
                  <button
                    className="btn-primary"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <Plus size={16} />
                    Создать интеграцию
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal telegram-modal large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>
                  <MessageCircle size={24} />
                  Подключить Telegram Bot
                </h3>
                <button
                  className="modal-close"
                  onClick={() => setShowCreateModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="modal-content">
                {activeTab === 'telegram' ? (
                  <ManualBotConnection
                    assistants={assistants.filter(a => a.trained)}
                    onBotCreated={handleBotCreated}
                  />
                ) : (
                  <div className="other-integration">
                    <p>Создание интеграции типа "{integrationTypes.find(t => t.id === activeTab)?.title}" пока не реализовано.</p>
                    <p>Эта функциональность будет добавлена в следующих версиях.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showAnalyticsModal && selectedIntegration && (
          <div className="modal-overlay" onClick={() => setShowAnalyticsModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>
                  <Eye size={24} />
                  Аналитика: {selectedIntegration.name}
                </h3>
                <button
                  className="modal-close"
                  onClick={() => setShowAnalyticsModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-content">
                <div className="analytics-stats">
                  <div className="stat-card">
                    <MessageSquare size={32} />
                    <div>
                      <h4>Сообщений</h4>
                      <p className="stat-value">{(selectedIntegration as any).totalMessages || 0}</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <Users size={32} />
                    <div>
                      <h4>Пользователей</h4>
                      <p className="stat-value">{(selectedIntegration as any).totalUsers || 0}</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <TrendingUp size={32} />
                    <div>
                      <h4>Последнее сообщение</h4>
                      <p className="stat-value" style={{ fontSize: '0.9rem' }}>
                        {(selectedIntegration as any).lastMessageAt 
                          ? new Date((selectedIntegration as any).lastMessageAt).toLocaleString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Нет данных'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="analytics-info">
                  <p><strong>Статус:</strong> {selectedIntegration.status === 'active' ? '✅ Активен' : '⏸️ Остановлен'}</p>
                  <p><strong>Создан:</strong> {formatIntegrationDate(selectedIntegration)}</p>
                  {selectedIntegration.config?.telegramUsername && (
                    <p><strong>Username:</strong> @{selectedIntegration.config.telegramUsername}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showSettingsModal && selectedIntegration && (
          <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>
                  <Settings size={24} />
                  Настройки: {selectedIntegration.name}
                </h3>
                <button
                  className="modal-close"
                  onClick={() => setShowSettingsModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveSettings}>
                <div className="modal-content">
                  <div className="form-group">
                    <label>Название интеграции</label>
                    <input 
                      type="text"
                      name="name"
                      defaultValue={selectedIntegration.name}
                      placeholder="Название бота"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Ассистент</label>
                    <select 
                      name="assistantId"
                      defaultValue={selectedIntegration.assistantId || selectedIntegration.assistant}
                      required
                    >
                      {assistants.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>

                  {selectedIntegration.type === 'telegram' && (
                    <>
                      <div className="form-group">
                        <label>Команды бота</label>
                        <input 
                          type="text"
                          name="commands"
                          defaultValue={selectedIntegration.config?.commands?.join(', ') || '/start, /help'}
                          placeholder="/start, /help, /clear"
                        />
                        <small>Команды через запятую</small>
                      </div>

                      <div className="form-group">
                        <label>URL бота</label>
                        <input 
                          type="text" 
                          value={selectedIntegration.config?.telegramUrl || ''}
                          disabled
                          style={{ opacity: 0.6, cursor: 'not-allowed' }}
                        />
                      </div>
                    </>
                  )}

                  <div className="modal-actions">
                    <button 
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowSettingsModal(false)}
                    >
                      Отмена
                    </button>
                    <button 
                      type="submit"
                      className="btn-primary"
                    >
                      <Save size={16} />
                      Сохранить
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}