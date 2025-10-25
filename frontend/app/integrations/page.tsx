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
  MessageSquare,
  FileCode,
  Terminal,
  Book,
  ChevronRight,
  Check
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
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string>('');

  const {
    integrations,
    loading,
    toggleIntegration,
    deleteIntegration,
    refreshIntegrations,
    isProcessing,
  } = useIntegrations();

  const { assistants } = useAssistants();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zuuma.ru/api';

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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/integrations/${integration.id}/analytics`,
        {
          credentials: 'include', // ✅ используем cookie
        }
      );

      if (response.ok) {
        const analytics = await response.json();
        setSelectedIntegration({ ...integration, ...analytics });
      } else {
        throw new Error(`Ошибка загрузки аналитики: ${response.status}`);
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
    const commands = commandsStr
      .split(',')
      .map(c => c.trim())
      .filter(c => c);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/integrations/${selectedIntegration.id}/settings`,
        {
          method: 'PUT',
          credentials: 'include', // ✅ используем cookie
          headers: {
            'Content-Type': 'application/json', // оставляем для JSON
          },
          body: JSON.stringify({ name, assistantId, commands }),
        }
      );

      if (response.ok) {
        setShowSettingsModal(false);
        refreshIntegrations();
        alert('Настройки успешно сохранены!');
      } else {
        const txt = await response.text();
        throw new Error(txt || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Не удалось сохранить настройки');
    }
  };

  const openDocs = (type: string) => {
    setSelectedDocs(type);
    setShowDocsModal(true);
  };

  const copyCode = (code: string, type: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(type);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const getCodeExample = (lang: string, apiKey: string = 'YOUR_API_KEY') => {
    const examples: Record<string, string> = {
      javascript: `// JavaScript (Browser)
const API_URL = '${API_BASE_URL}';
const API_KEY = '${apiKey}';

async function sendMessage(message, conversationId = null) {
  const response = await fetch(\`\${API_URL}/chat\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${API_KEY}\`
    },
    body: JSON.stringify({
      message: message,
      conversationId: conversationId
    })
  });
  
  const data = await response.json();
  return data;
}

// Использование
const result = await sendMessage('Привет!');
console.log(result);`,

      nodejs: `// Node.js
const axios = require('axios');

const API_URL = '${API_BASE_URL}';
const API_KEY = '${apiKey}';

class ChatAssistant {
  async sendMessage(message, conversationId = null) {
    try {
      const response = await axios.post(\`\${API_URL}/chat\`, {
        message,
        conversationId
      }, {
        headers: {
          'Authorization': \`Bearer \${API_KEY}\`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Chat API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getAssistantInfo() {
    const response = await axios.get(\`\${API_URL}/chat/info\`, {
      headers: { 'Authorization': \`Bearer \${API_KEY}\` }
    });
    return response.data;
  }
}

// Использование
const assistant = new ChatAssistant();
const result = await assistant.sendMessage('Привет!');
console.log(result);`,

      python: `# Python
import requests
import json

API_URL = '${API_BASE_URL}'
API_KEY = '${apiKey}'

class ChatAssistant:
    def __init__(self):
        self.api_url = API_URL
        self.headers = {
            'Authorization': f'Bearer {API_KEY}',
            'Content-Type': 'application/json'
        }
    
    def send_message(self, message, conversation_id=None):
        """Отправить сообщение ассистенту"""
        url = f'{self.api_url}/chat'
        payload = {
            'message': message,
            'conversationId': conversation_id
        }
        
        try:
            response = requests.post(url, headers=self.headers, json=payload)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f'Error: {e}')
            return None
    
    def get_assistant_info(self):
        """Получить информацию об ассистенте"""
        url = f'{self.api_url}/chat/info'
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

# Использование
assistant = ChatAssistant()
result = assistant.send_message('Привет!')
print(result)`,

      curl: `# cURL примеры

# Отправить сообщение
curl -X POST "${API_BASE_URL}/chat" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Привет!",
    "conversationId": null
  }'

# Получить информацию об ассистенте
curl -X GET "${API_BASE_URL}/chat/info" \\
  -H "Authorization: Bearer ${apiKey}"

# Получить историю разговора
curl -X GET "${API_BASE_URL}/chat/history/CONVERSATION_ID" \\
  -H "Authorization: Bearer ${apiKey}"`
    };

    return examples[lang] || '';
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
      id: 'api',
      title: 'REST API',
      description: 'Интегрируйте через API в ваше приложение',
      icon: <Code2 size={24} />,
      color: '#10b981',
      badge: null
    },
    {
      id: 'widget',
      title: 'Веб-виджет',
      description: 'Встройте чат-бота на ваш сайт',
      icon: <Globe size={24} />,
      color: '#888888',
      badge: null
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

  const apiDocumentation = [
    {
      id: 'javascript',
      title: 'JavaScript',
      description: 'Для браузерных приложений и веб-сайтов',
      icon: <FileCode size={32} />,
      color: '#f7df1e',
      difficulty: 'Легко'
    },
    {
      id: 'nodejs',
      title: 'Node.js',
      description: 'Серверная интеграция для Node.js приложений',
      icon: <Terminal size={32} />,
      color: '#68a063',
      difficulty: 'Средне'
    },
    {
      id: 'python',
      title: 'Python',
      description: 'Для Python приложений и скриптов',
      icon: <Code2 size={32} />,
      color: '#3776ab',
      difficulty: 'Легко'
    },
    {
      id: 'curl',
      title: 'cURL',
      description: 'Тестирование API из командной строки',
      icon: <Terminal size={32} />,
      color: '#073642',
      difficulty: 'Легко'
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

        {/* TELEGRAM TAB */}
        {activeTab === 'telegram' && (
          <div className="integrations-section">
            <div className="section-header">
              <h2>Активные интеграции</h2>
              <button
                className="btn-primary"
                onClick={() => setShowCreateModal(true)}
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
                          <a
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
                    <MessageCircle size={48} />
                  </div>
                  <h3>Нет интеграций</h3>
                  <p>Создайте свою первую интеграцию Telegram Bot</p>
                  <button
                    className="btn-primary"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <Plus size={16} />
                    Создать интеграцию
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* API TAB */}
        {activeTab === 'api' && (
          <>
            {/* Модальное окно выбора языка - сразу показываем при входе на таб */}
            <div className="modal-overlay active">
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 className="modal-title">
                    📚 Выберите язык программирования
                  </h3>
                  <button
                    className="modal-close"
                    onClick={() => setActiveTab('telegram')}
                  >
                    ×
                  </button>
                </div>

                <div className="modal-body">
                  <p className="section-description">
                    Мы подготовили примеры интеграции для популярных языков программирования.
                    Выберите нужный язык, чтобы посмотреть готовые примеры кода и инструкции.
                  </p>

                  <div className="language-grid">
                    {apiDocumentation.map((doc) => (
                      <div
                        key={doc.id}
                        className="language-card"
                        style={{ '--accent-color': doc.color } as React.CSSProperties}
                        onClick={() => openDocs(doc.id)}
                      >
                        <div className="language-icon" style={{ background: doc.color }}>
                          {doc.id === 'javascript' ? 'JS' :
                          doc.id === 'nodejs' ? '⚡' :
                          doc.id === 'python' ? '🐍' : '💻'}
                        </div>
                        <div className="language-name">{doc.title}</div>
                        <div className="language-description">{doc.description}</div>
                        <span className="difficulty-badge">{doc.difficulty}</span>
                      </div>
                    ))}
                  </div>

                  {/* Info Block */}
                  <div className="info-block">
                    <h4>
                      📖 Основная информация
                    </h4>
                    <div className="info-item">
                      <strong>Base URL:</strong>
                      <code>{API_BASE_URL}</code>
                    </div>
                    <div className="info-item">
                      <strong>Аутентификация:</strong> Bearer Token (API ключ вашего ассистента)
                    </div>
                    <div className="info-item">
                      <strong>Content-Type:</strong> application/json
                    </div>
                  </div>

                  <div className="info-block" style={{ marginTop: 20 }}>
                    <h4>
                      🔌 Основные эндпоинты
                    </h4>
                    <ul className="endpoints-list">
                      <li>
                        <code>POST /chat</code>
                        <span>— Отправить сообщение ассистенту</span>
                      </li>
                      <li>
                        <code>GET /chat/info</code>
                        <span>— Получить информацию об ассистенте</span>
                      </li>
                      <li>
                        <code>GET /chat/history/:id</code>
                        <span>— Получить историю разговора</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* WIDGET TAB */}
        {activeTab === 'widget' && (
          <div className="integrations-section">
            <div className="empty-state">
              <div className="empty-icon">
                <Globe size={48} />
              </div>
              <h3>Веб-виджет</h3>
              <p>
                HTML код виджета доступен на странице каждого ассистента.
                <br />
                Перейдите в раздел "Ассистенты" и откройте секцию "Код для интеграции".
              </p>
              <a href="/assistants" className="btn-primary">
                Перейти к ассистентам
                <ChevronRight size={16} />
              </a>
            </div>
          </div>
        )}

        {/* WHATSAPP TAB */}
        {activeTab === 'whatsapp' && (
          <div className="integrations-section">
            <div className="empty-state">
              <div className="empty-icon">
                <Smartphone size={48} />
              </div>
              <h3>WhatsApp Business</h3>
              <p>Интеграция с WhatsApp Business API скоро будет доступна</p>
            </div>
          </div>
        )}

        {/* MODAL: Create Telegram Bot */}
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

              <div className="modal-content-integration">
                <ManualBotConnection
                  assistants={assistants.filter(a => a.trained)}
                  onBotCreated={handleBotCreated}
                />
              </div>
            </div>
          </div>
        )}

        {/* MODAL: API Documentation */}
        {showDocsModal && (
          <div className="modal-overlay" onClick={() => setShowDocsModal(false)}>
            <div className="modal docs-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>
                  {apiDocumentation.find(d => d.id === selectedDocs)?.title} - Примеры кода
                </h3>
                <button
                  className="modal-close"
                  onClick={() => setShowDocsModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-content">
                <div className="docs-tip">
                  💡 <strong>Важно:</strong> Замените <code>YOUR_API_KEY</code> на API ключ вашего ассистента
                </div>

                <div className="code-section">
                  <div className="code-header">
                    <h4>Пример кода:</h4>
                    <button
                      className={`btn-copy ${copiedCode === selectedDocs ? 'copied' : ''}`}
                      onClick={() => copyCode(getCodeExample(selectedDocs), selectedDocs)}
                    >
                      {copiedCode === selectedDocs ? (
                        <>
                          <Check size={16} />
                          Скопировано!
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          Копировать код
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="code-block">
                    <code>{getCodeExample(selectedDocs)}</code>
                  </pre>
                </div>

                <div className="params-section">
                  <h4>Параметры запроса:</h4>
                  <table className="params-table">
                    <thead>
                      <tr>
                        <th>Параметр</th>
                        <th>Тип</th>
                        <th>Описание</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>message</code></td>
                        <td>string</td>
                        <td>Текст сообщения пользователя</td>
                      </tr>
                      <tr>
                        <td><code>conversationId</code></td>
                        <td>string | null</td>
                        <td>ID разговора для продолжения диалога</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="response-section">
                  <h4>Ответ сервера:</h4>
                  <pre className="code-block">
                    <code>{`{
  "response": "Ответ ассистента",
  "conversationId": "conv_abc123",
  "timestamp": "2025-10-21T12:00:00Z"
}`}</code>
                  </pre>
                </div>

                {(selectedDocs === 'nodejs' || selectedDocs === 'python') && (
                  <div className="install-section">
                    <h4>📦 Установка зависимостей:</h4>
                    <code className="install-command">
                      {selectedDocs === 'nodejs' ? 'npm install axios' : 'pip install requests'}
                    </code>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Analytics */}
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

              <div className="modal-content-integration">
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

        {/* MODAL: Settings */}
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
                <div className="modal-content-integration">
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