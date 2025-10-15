// app/assistants/page.tsx
"use client";
import AuthGuard from '../../components/AuthGuard';
import React, { useEffect, useState } from "react";
import { Code } from "lucide-react";
import {
  Bot,
  Settings,
  Trash2,
  RefreshCw,
  Copy,
  Eye,
  FileText,
  BarChart3,
  Zap  
} from "lucide-react";

/**
 * Типы данных
 */
interface Assistant {
  id: string;
  name: string;
  description?: string;
  apiKey: string;
  isActive: boolean;
  totalQueries?: number;
  lastUsed?: string;
  settings: {
    customGreeting?: string;
    theme?: "light" | "dark" | "auto";
    primaryColor?: string;
    
    // Новые поля поведения
    allowVPN?: boolean;
    allowCompetitorPrices?: boolean;
    allowProfanity?: boolean;
    allowPersonalAdvice?: boolean;
    mood?: 'energetic' | 'cheerful' | 'calm' | 'formal';
    useEmojis?: boolean;
    maxResponseLength?: 'short' | 'medium' | 'long';
    customSystemPrompt?: string;
    
    // Поддержка старых полей (для обратной совместимости)
    temperature?: number;
    maxTokens?: number;
    maxHistoryMessages?: number;
    enableToxicityFilter?: boolean;
    allowSmallTalk?: boolean;
    searchLimit?: number;
    minSearchScore?: number;
    fallbackMessage?: string;
    humanImitation?: any;
  };
  createdAt: string;
}

interface AssistantStats {
  id: string;
  name?: string;
  totalQueries: number;
  totalDocuments: number;
  lastUsed: string | null;
  isActive: boolean;
  apiKey?: string;
}

// Добавляем интерфейс для функций ассистента
interface AssistantFunction {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

type Language = "widget" | "javascript" | "nodejs" | "python" | "curl" | "json";

interface Notification {
  type: "success" | "error";
  message: string;
}

/**
 * Главная страница ассистентов
 */
export default function AssistantsPage() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [stats, setStats] = useState<AssistantStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<Notification | null>(null);
  
  // Добавляем состояние для функций ассистентов
  const [assistantFunctions, setAssistantFunctions] = useState<Record<string, AssistantFunction[]>>({});

  useEffect(() => {
    loadAssistants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAssistants = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      
      const [assistantsResponse, statsResponse] = await Promise.all([
        fetch(`http://localhost:4000/assistants`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        // ✅ ИЗМЕНЕНО: убрали companyId
        fetch(`http://localhost:4000/assistants/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
      ]);


      const assistantsData = await assistantsResponse.json();
      const statsData = await statsResponse.json();

      const assistantsList = Array.isArray(assistantsData?.data?.assistants) ? assistantsData.data.assistants : [];
      setAssistants(assistantsList);
      setStats(Array.isArray(statsData?.data) ? statsData.data : []);
      
      await loadAssistantsFunctions(assistantsList);
    } catch (err) {
      console.error("Ошибка загрузки ассистентов:", err);
      setError("Не удалось загрузить ассистентов. Проверьте соединение с сервером.");
    } finally {
      setLoading(false);
    }
  };

  // Загружаем функции для всех ассистентов
  const loadAssistantsFunctions = async (assistantsList: Assistant[]) => {
    try {
      const functionsPromises = assistantsList.map(async (assistant) => {
        try {
          const response = await fetch(`http://localhost:4000/assistants/${assistant.id}/functions`);
          const data = await response.json();
          return {
            assistantId: assistant.id,
            functions: Array.isArray(data.data) ? data.data : []
          };
        } catch (error) {
          console.error(`Ошибка загрузки функций для ассистента ${assistant.id}:`, error);
          return {
            assistantId: assistant.id,
            functions: []
          };
        }
      });

      const functionsResults = await Promise.all(functionsPromises);
      const functionsMap: Record<string, AssistantFunction[]> = {};
      
      functionsResults.forEach(({ assistantId, functions }) => {
        functionsMap[assistantId] = functions;
      });
      
      setAssistantFunctions(functionsMap);
    } catch (error) {
      console.error("Ошибка загрузки функций ассистентов:", error);
    }
  };

  const showNotification = (type: Notification["type"], message: string) => {
    setNotification({ type, message });
    window.setTimeout(() => setNotification(null), 5000);
  };

  const deleteAssistant = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить ассистента? Это действие необратимо.")) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`http://localhost:4000/assistants/${id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await loadAssistants();
        showNotification("success", "Ассистент удален");
      } else {
        throw new Error("Ошибка удаления");
      }
    } catch (error) {
      console.error("Ошибка удаления ассистента:", error);
      showNotification("error", "Не удалось удалить ассистента");
    }
  };

const regenerateApiKey = async (id: string) => {
  if (!confirm("Вы уверены? Старый API ключ перестанет работать.")) return;
  try {
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(`http://localhost:4000/assistants/${id}/regenerate-key`, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (response.ok) {
      await loadAssistants();
      showNotification("success", "API ключ обновлен");
    } else {
      throw new Error("Ошибка обновления");
    }
  } catch (error) {
    console.error("Ошибка регенерации API ключа:", error);
    showNotification("error", "Не удалось обновить API ключ");
  }
};

  const copyToClipboard = async (text: string, codeType?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification("success", `${codeType ?? "Текст"} скопирован`);
    } catch (err) {
      console.error("Ошибка копирования:", err);
      showNotification("error", "Ошибка копирования");
    }
  };

  const toggleApiKeyVisibility = (assistantId: string) => {
    setShowApiKey((prev) => ({ ...prev, [assistantId]: !prev[assistantId] }));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleString("ru-RU", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getStatsForAssistant = (assistantId: string) => stats.find((s) => s.id === assistantId);

  const handleSelectAssistant = (assistant: Assistant) => {
    setSelectedAssistant(assistant);
  };

  // UI: loading / error
  if (loading) {
    return (
      <div className="assistants-loading-container p-6">
        <div className="assistants-loading-content">
          <div className="assistants-loading-spinner" />
          <div className="assistants-loading-text">Загрузка ассистентов...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
    <div className="assistants-page-container">
      {/* Notification */}
      {notification && (
        <div className={`assistants-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="assistants-header-card">
        <h1 className="assistants-page-title">Мои ассистенты</h1>
        <p className="assistants-page-description">
          Управляйте своими AI ассистентами, настраивайте их и получайте API ключи для интеграции
        </p>
        <div className="assistants-header-actions">
          <a href="/assistants/create" className="assistants-header-btn assistants-btn-primary">
            <Bot size={20} />
            Создать ассистента
          </a>
          <a href="/assistants/education" className="assistants-header-btn assistants-btn-secondary">
            <BarChart3 size={20} />
            Обучить ассистента
          </a>
        </div>
      </div>

      {/* Main content - теперь только список ассистентов */}
      <div className="assistants-main-content" style={{ marginTop: 20 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          {assistants.length === 0 ? (
            <div className="assistants-empty-card">
              <div className="assistants-empty-icon">
                <Bot size={64} style={{ color: "var(--fg-muted)" }} />
              </div>
              <h3 className="assistants-empty-title">У вас пока нет ассистентов</h3>
              <p className="assistants-empty-description">
                Создайте своего первого AI ассистента для автоматизации поддержки клиентов
              </p>
              <a href="/assistants/create" className="assistants-empty-btn">
                <Bot size={20} />
                Создать ассистента
              </a>
            </div>
          ) : (
            <div className="assistants-cards-container">
              {assistants.map((assistant) => {
                const assistantStats = getStatsForAssistant(assistant.id);
                const isApiKeyVisible = !!showApiKey[assistant.id];
                const functions = assistantFunctions[assistant.id] || [];

                return (
                  <div key={assistant.id} style={{ marginBottom: 12 }}>
                    <AssistantCard
                      assistant={assistant}
                      stats={assistantStats}
                      functions={functions}
                      isApiKeyVisible={isApiKeyVisible}
                      onToggleApiKey={() => toggleApiKeyVisibility(assistant.id)}
                      onCopyApiKey={() => copyToClipboard(assistant.apiKey, "API ключ")}
                      onEdit={() => handleSelectAssistant(assistant)}
                      onDelete={() => deleteAssistant(assistant.id)}
                      onRegenerateKey={() => regenerateApiKey(assistant.id)}
                      onFunctions={() => window.location.href = `/assistants/functions?from=${assistant.id}`}
                      formatDate={formatDate}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Settings modal */}
      {selectedAssistant && (
        <AssistantSettingsModal
          assistant={selectedAssistant}
          onClose={() => setSelectedAssistant(null)}
          onSuccess={(msg) => {
            loadAssistants();
            showNotification("success", msg);
            setSelectedAssistant(null);
          }}
        />
      )}
    </div>
  </AuthGuard>
  );
  }

/**
 * Пропсы для AssistantCard
 */
interface AssistantCardProps {
  assistant: Assistant;
  stats?: AssistantStats | undefined;
  functions: AssistantFunction[];
  isApiKeyVisible: boolean;
  onToggleApiKey: () => void;
  onCopyApiKey: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRegenerateKey: () => void;
  onFunctions: () => void; 
  formatDate: (date?: string) => string;
}

/**
 * Карточка ассистента с полной интеграцией
 */
const AssistantCard: React.FC<AssistantCardProps> = ({
  assistant,
  stats,
  functions,
  isApiKeyVisible,
  onToggleApiKey,
  onCopyApiKey,
  onEdit,
  onDelete,
  onRegenerateKey,
  onFunctions,
  formatDate,
}) => {
  // Локальное состояние для выбора языка в интеграции
  const [selectedLanguage, setSelectedLanguage] = useState<"widget" | "javascript" | "nodejs" | "python" | "curl" | "json">("widget");

  // Функция для получения кода интеграции
  const getIntegrationCode = (lang: string, assistant: Assistant): string => {
    const apiExamples = {
  widget: `<!-- Добавьте этот код перед закрывающим тегом </body> -->
  <script>
    window.chatConfig = {
      apiKey: '${assistant.apiKey}',
      serverUrl: 'http://localhost:4000',
      theme: '${assistant.settings?.theme || "light"}',
      assistantName: '${assistant.name}',
      customGreeting: '${assistant.settings?.customGreeting || "Здравствуйте! Чем могу помочь?"}',
      primaryColor: '${assistant.settings?.primaryColor || "#667eea"}',
      assistantId: '${assistant.id}'
    };
  </script>
  <script src="http://localhost:3000/chat-widget.js"></script>`,

      javascript: `// JavaScript (browser)
async function initChatWidget() {
  // Загружаем виджет
  const script = document.createElement('script');
  script.src = 'http://localhost:3000/chat-widget.js';
  
  // Конфигурация
  window.chatConfig = {
      apiKey: '${assistant.apiKey}',
      serverUrl: 'http://localhost:4000',
      theme: '${assistant.settings?.theme || "light"}',
      assistantName: '${assistant.name}',
      customGreeting: '${assistant.settings?.customGreeting || "Здравствуйте! Чем могу помочь?"}',
      assistantId: '${assistant.id}'
  };
  
  document.head.appendChild(script);
}

// Вызов API напрямую
async function sendMessage(message, conversationId = null) {
  const response = await fetch('http://localhost:4000/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ${assistant.apiKey}'
    },
    body: JSON.stringify({
      message: message,
      conversationId: conversationId
    })
  });
  
  const data = await response.json();
  return data;
}`,

      nodejs: `// Node.js
const axios = require('axios');

class ChatAssistant {
  constructor() {
    this.apiKey = '${assistant.apiKey}';
    this.baseURL = 'http://localhost:4000';
  }

  async sendMessage(message, conversationId = null) {
    try {
      const response = await axios.post(\`\${this.baseURL}/chat\`, {
        message,
        conversationId
      }, {
        headers: {
          'Authorization': \`Bearer \${this.apiKey}\`,
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
    const response = await axios.get(\`\${this.baseURL}/chat/info\`, {
      headers: { 'Authorization': \`Bearer \${this.apiKey}\` }
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

class ChatAssistant:
    def __init__(self):
        self.api_key = '${assistant.apiKey}'
        self.base_url = 'http://localhost:4000'
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
    
    def send_message(self, message, conversation_id=None):
        """Отправить сообщение ассистенту"""
        url = f'{self.base_url}/chat'
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
        url = f'{self.base_url}/chat/info'
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

# Использование
assistant = ChatAssistant()
result = assistant.send_message('Привет!')
print(result)`,

      curl: `# cURL примеры

# Отправить сообщение
curl -X POST "http://localhost:4000/chat" \\
  -H "Authorization: Bearer ${assistant.apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Привет!",
    "conversationId": null
  }'

# Получить информацию об ассистенте
curl -X GET "http://localhost:4000/chat/info" \\
  -H "Authorization: Bearer ${assistant.apiKey}"

# Получить историю разговора
curl -X GET "http://localhost:4000/chat/history/CONVERSATION_ID" \\
  -H "Authorization: Bearer ${assistant.apiKey}"`,

      json: `{
  "apiKey": "${assistant.apiKey}",
  "serverUrl": "http://localhost:4000",
  "assistantConfig": {
    "name": "${assistant.name}",
    "description": "${assistant.description || ''}",
    "isActive": ${assistant.isActive},
    "theme": "${assistant.settings?.theme || 'light'}",
    "customGreeting": "${assistant.settings?.customGreeting || 'Здравствуйте! Чем могу помочь?'}",
    "primaryColor": "${assistant.settings?.primaryColor || '#667eea'}"
  },
  "endpoints": {
    "chat": "http://localhost:4000/chat",
    "info": "http://localhost:4000/chat/info",
    "history": "http://localhost:4000/chat/history/{conversationId}"
  },
  "widgetScript": "http://localhost:3000/chat-widget.js"
}`
    };

    return apiExamples[lang as keyof typeof apiExamples] || apiExamples.widget;
  };

  // Функция для получения подсказок
  const getHelpText = (lang: string): string => {
    const helpTexts = {
      widget: "Вставьте код перед закрывающим тегом </body> на вашем сайте. Виджет автоматически появится в правом нижнем углу.",
      javascript: "Используйте для интеграции в браузерные приложения. Можете загрузить виджет или вызывать API напрямую.",
      nodejs: "Серверное решение для Node.js приложений. Установите axios: npm install axios",
      python: "Для Python приложений. Установите requests: pip install requests",
      curl: "Для тестирования API из командной строки или создания собственных HTTP-клиентов.",
      json: "Конфигурационный файл с настройками ассистента для использования в любых приложениях."
    };

    return helpTexts[lang as keyof typeof helpTexts] || helpTexts.widget;
  };

  // Функция для создания тестового HTML файла
  const createTestHtml = (assistant: Assistant): string => {
    return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Тест чат-бота - ${assistant.name}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #f8fafc;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #1f2937;
            margin-bottom: 8px;
        }
        .subtitle {
            color: #6b7280;
            margin-bottom: 32px;
        }
        .info-card {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 24px;
        }
        .status {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 14px;
            margin-top: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Тестовая страница для ассистента "${assistant.name}"</h1>
        <p class="subtitle">Чат-бот должен появиться в правом нижнем углу страницы</p>
        
        <div class="info-card">
            <h3>Информация об ассистенте:</h3>
            <p><strong>Название:</strong> ${assistant.name}</p>
            <p><strong>Описание:</strong> ${assistant.description || 'Не указано'}</p>
            <p><strong>API ключ:</strong> ${assistant.apiKey.substring(0, 12)}...</p>
            <p><strong>Тема:</strong> ${assistant.settings?.theme || 'light'}</p>
            <div class="status">Ассистент ${assistant.isActive ? 'активен' : 'неактивен'}</div>
        </div>
        
        <div class="info-card">
            <h3>Инструкции:</h3>
            <ol>
                <li>Убедитесь, что сервер запущен на порту 4000</li>
                <li>Виджет должен загрузиться автоматически</li>
                <li>Нажмите на кнопку чата в правом нижнем углу</li>
                <li>Начните диалог с ассистентом</li>
            </ol>
        </div>
    </div>

    <!-- Код интеграции чат-бота -->
    <script>
      window.chatConfig = {
        apiKey: '${assistant.apiKey}',
        serverUrl: 'http://localhost:4000',
        theme: '${assistant.settings?.theme || 'light'}',
        assistantName: '${assistant.name}',
        customGreeting: '${assistant.settings?.customGreeting || 'Здравствуйте! Чем могу помочь?'}',
        primaryColor: '${assistant.settings?.primaryColor || '#667eea'}'
      };
    </script>
    <script src="http://localhost:3000/chat-widget.js"></script>
</body>
</html>`;
  };

  // Функция копирования с уведомлением (локальная версия)
  const copyToClipboard = async (text: string, codeType?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log(`${codeType || "Код"} скопирован в буфер обмена`);
    } catch (err) {
      console.error("Ошибка копирования:", err);
    }
  };

  const activeFunctions = functions.filter(f => f.is_active);

  return (
    <div className="assistant-card" style={{ border: "2px solid #444444", borderRadius: 15, padding: 20 }}>
      <div className="assistant-card-header" style={{ display: "flex", justifyContent: "space-between", gap: 20 }}>
        <div className="assistant-card-info" style={{ display: "flex", gap: 12 }}>
          <div className="assistant-card-icon" style={{ display: "flex", alignItems: "center" }}>
            <Bot size={28} />
          </div>
          <div>
            <h3 className="assistant-card-name" style={{ margin: 0 }}>{assistant.name}</h3>
            {assistant.description && <p className="assistant-card-desc" style={{ margin: "4px 0 0 0", color: "#6b7280" }}>{assistant.description}</p>}
            <div className="assistant-card-meta" style={{ marginTop: 8, fontSize: 12, color: "#6b7280", display: "flex", gap: 12, alignItems: "center" }}>
              <span>Создан: {formatDate(assistant.createdAt)}</span>
              {stats?.lastUsed && <span>Последнее использование: {formatDate(stats.lastUsed ?? undefined)}</span>}
              <span className={`assistant-card-status ${assistant.isActive ? "active" : "inactive"}`} style={{ 
                padding: "2px 6px", 
                borderRadius: "4px",
                fontSize: "10px",
                fontWeight: 600,
                backgroundColor: assistant.isActive ? "#10b981" : "#6b7280",
                color: "white"
              }}>
                {assistant.isActive ? "Активен" : "Отключен"}
              </span>
              {/* Индикатор API функций */}
              {activeFunctions.length > 0 && (
                <span 
                  style={{ 
                    padding: "2px 6px", 
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: 600,
                    backgroundColor: "#f59e0b",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    gap: "2px"
                  }}
                  title={`API функции: ${activeFunctions.map(f => f.name).join(', ')}`}
                >
                  <Zap size={10} />
                  {activeFunctions.length} API
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="assistant-card-actions" style={{ display: "flex", gap: 6 }}>
          <button onClick={onEdit} className="assistant-btn" title="Настройки">
            <Settings size={16} />
          </button>
          <button 
            onClick={onFunctions}
            className="assistant-btn" 
            title="API Функции"
            style={{
              backgroundColor: activeFunctions.length > 0 ? "#f59e0b" : undefined
            }}
          >
            <Zap size={16} />
          </button>
          <button onClick={onRegenerateKey} className="assistant-btn" title="Обновить ключ">
            <RefreshCw size={16} />
          </button>
          <button onClick={onDelete} className="assistant-btn delete" title="Удалить">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {stats && (
        <div className="assistant-stats" style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <div className="assistant-stat" style={{ textAlign: "center" }}>
            <div className="assistant-stat-value" style={{ fontWeight: 600 }}>{stats.totalQueries}</div>
            <div className="assistant-stat-title" style={{ fontSize: 12 }}>Запросов</div>
          </div>
          <div className="assistant-stat" style={{ textAlign: "center" }}>
            <div className="assistant-stat-value" style={{ fontWeight: 600 }}>{stats.totalDocuments}</div>
            <div className="assistant-stat-title" style={{ fontSize: 12 }}>Документов</div>
          </div>
          <div className="assistant-stat" style={{ textAlign: "center" }}>
            <div className="assistant-stat-value" style={{ fontWeight: 600 }}>{activeFunctions.length}</div>
            <div className="assistant-stat-title" style={{ fontSize: 12 }}>API функций</div>
          </div>
          <div className="assistant-stat" style={{ textAlign: "center" }}>
            <div className="assistant-stat-value" style={{ fontWeight: 600 }}>{assistant.isActive ? "Online" : "Offline"}</div>
            <div className="assistant-stat-title" style={{ fontSize: 12 }}>Статус</div>
          </div>
        </div>
      )}

      {/* API key block */}
      <div className="api-key-block" style={{ marginTop: 12 }}>
        <div className="api-key-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label className="api-key-label" style={{ fontSize: 12 }}>API ключ</label>
          <button onClick={onToggleApiKey} className="api-key-toggle" style={{ background: "none", border: "none", cursor: "pointer" }}>
            <Eye size={14} /> {isApiKeyVisible ? "Скрыть" : "Показать"}
          </button>
        </div>
        <div className="api-key-row" style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <input
            type="text"
            value={isApiKeyVisible ? assistant.apiKey : "••••••••••••••••"}
            readOnly
            className="api-key-input"
            style={{ flex: 1, padding: "6px 8px", borderRadius: 6, border: "1px solid #444444" }}
          />
          <button onClick={onCopyApiKey} className="api-key-copy" title="Копировать">
            <Copy size={16} />
          </button>
        </div>
        <p className="api-key-hint" style={{ marginTop: 8, fontSize: 12, color: "#E0E0E0" }}>
          Используйте этот ключ для интеграции ассистента на вашем сайте
        </p>
      </div>

      {/* Integration code */}
      <details className="integration-details" style={{ marginTop: 12 }}>
        <summary className="integration-summary" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <FileText size={14} /> Код для интеграции на сайт
        </summary>
        <div className="integration-code-block" style={{ marginTop: 8 }}>
          {/* Language selector */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, display: "block", marginBottom: 6, color: "#E0E0E0" }}>
              Выберите язык программирования:
            </label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["widget", "javascript", "nodejs", "python", "curl", "json"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedLanguage(lang);
                  }}
                  className={`lang-btn ${selectedLanguage === lang ? "active" : ""}`}
                  style={{
                    padding: "4px 8px",
                    fontSize: "12px",
                    borderRadius: 4,
                    border: selectedLanguage === lang ? "1px solid #667eea" : "1px solid #444444",
                    background: selectedLanguage === lang ? "#667eea" : "transparent",
                    color: selectedLanguage === lang ? "#fff" : "#E0E0E0",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {lang === "widget" ? "HTML Widget" : 
                   lang === "json" ? "JSON Config" : 
                   lang.charAt(0).toUpperCase() + lang.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Code display */}
          <pre style={{ 
            whiteSpace: "pre-wrap", 
            padding: 12, 
            borderRadius: 6, 
            background: "#121212", 
            border: "1px solid #444444",
            fontSize: "12px",
            lineHeight: "1.4",
            maxHeight: "300px",
            overflow: "auto"
          }}>
            <code style={{ color: "#E0E0E0" }}>
              {getIntegrationCode(selectedLanguage, assistant)}
            </code>
          </pre>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                copyToClipboard(getIntegrationCode(selectedLanguage, assistant), `${selectedLanguage} код`);
              }}
              className="integration-copy-btn"
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                borderRadius: 4,
                border: "1px solid #444444",
                background: "#333",
                color: "#E0E0E0",
                cursor: "pointer"
              }}
            >
              <Copy size={12} style={{ marginRight: 4 }} />
              Копировать код
            </button>
            
            {selectedLanguage === "widget" && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const testHtml = createTestHtml(assistant);
                  const blob = new Blob([testHtml], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `test-widget-${assistant.name.toLowerCase().replace(/\s+/g, '-')}.html`;
                  a.click();
                  URL.revokeObjectURL(url);
                  copyToClipboard("", "Тестовый файл скачан");
                }}
                className="integration-copy-btn"
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  borderRadius: 4,
                  border: "1px solid #10b981",
                  background: "#10b981",
                  color: "#fff",
                  cursor: "pointer"
                }}
              >
                Скачать тест HTML
              </button>
            )}
          </div>

          {/* Helpful info */}
          <div style={{ 
            marginTop: 12, 
            padding: 8, 
            background: "rgba(16, 185, 129, 0.1)", 
            border: "1px solid rgba(16, 185, 129, 0.3)", 
            borderRadius: 4,
            fontSize: "11px",
            color: "#10b981"
          }}>
            {getHelpText(selectedLanguage)}
          </div>
        </div>
      </details>
    </div>
  );
};


/**
 * Модал настроек ассистента
 */
const AssistantSettingsModal: React.FC<{
  assistant: Assistant;
  onClose: () => void;
  onSuccess: (message: string) => void;
}> = ({ assistant, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: assistant.name,
    description: assistant.description || "",
    isActive: assistant.isActive,
    customGreeting: assistant.settings?.customGreeting || "",
    primaryColor: assistant.settings?.primaryColor || "#667eea",
    
    allowVPN: assistant.settings?.allowVPN ?? false,
    allowCompetitorPrices: assistant.settings?.allowCompetitorPrices ?? false,
    allowProfanity: assistant.settings?.allowProfanity ?? false,
    allowPersonalAdvice: assistant.settings?.allowPersonalAdvice ?? true,
    mood: assistant.settings?.mood || 'cheerful',
    useEmojis: assistant.settings?.useEmojis ?? true,
    maxResponseLength: assistant.settings?.maxResponseLength || 'medium',
    customPromptText: assistant.settings?.customSystemPrompt || '',
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const toggle = (key: string) => {
    setFormData(prev => {
      const currentValue = prev[key as keyof typeof prev];
      if (typeof currentValue === 'boolean') {
        return { ...prev, [key]: !currentValue };
      }
      return prev;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      
      // Автоматически добавляем {contextText} если его нет
      let finalCustomPrompt = formData.customPromptText.trim();
      if (finalCustomPrompt && !finalCustomPrompt.includes('{contextText}')) {
        finalCustomPrompt = `${finalCustomPrompt}

КОНТЕКСТ:
{contextText}

Отвечай на основе предоставленного контекста.`;
      }
      
      const response = await fetch(`http://localhost:4000/assistants/${assistant.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          isActive: formData.isActive,
          settings: {
            customGreeting: formData.customGreeting,
            primaryColor: formData.primaryColor,
            allowVPN: formData.allowVPN,
            allowCompetitorPrices: formData.allowCompetitorPrices,
            allowProfanity: formData.allowProfanity,
            allowPersonalAdvice: formData.allowPersonalAdvice,
            mood: formData.mood,
            useEmojis: formData.useEmojis,
            maxResponseLength: formData.maxResponseLength,
            customSystemPrompt: finalCustomPrompt || '',
          },
        }),
      });

      if (response.ok) {
        onSuccess("Настройки сохранены");
        onClose();
      } else {
        const txt = await response.text();
        throw new Error(txt || "Ошибка обновления");
      }
    } catch (error) {
      console.error("Ошибка:", error);
      alert("Не удалось сохранить изменения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{
        position: "fixed", 
        inset: 0, 
        background: "rgba(0,0,0,0.6)", 
        display: "flex",
        alignItems: "center", 
        justifyContent: "center", 
        zIndex: 1000,
        overflowY: "auto"
      }}
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          width: "90%",
          maxWidth: 800, 
          background: "#1a1a1a", 
          borderRadius: 12, 
          padding: 24,
          maxHeight: "90vh",
          overflowY: "auto"
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
            <Settings size={20} /> Настройки ассистента
          </h2>
          <p style={{ margin: "8px 0 0 0", color: "#888", fontSize: 14 }}>
            Настройте поведение и внешний вид ассистента
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Базовые настройки */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>
                Название
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                style={{ 
                  width: "100%", 
                  padding: 10, 
                  borderRadius: 6, 
                  border: "1px solid #333",
                  background: "#2a2a2a",
                  color: "white"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>
                Статус
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  style={{ width: 18, height: 18 }}
                />
                <span>Ассистент активен</span>
              </label>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>
                Описание
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                style={{ 
                  width: "100%", 
                  padding: 10, 
                  borderRadius: 6, 
                  border: "1px solid #333",
                  background: "#2a2a2a",
                  color: "white"
                }}
              />
            </div>
          </div>

          {/* Тон общения */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", marginBottom: 10, fontSize: 14, fontWeight: 600 }}>
              Тон общения
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {[
                { value: 'energetic', label: 'Энергичный', color: '#ff6b35' },
                { value: 'cheerful', label: 'Дружелюбный', color: '#7cb342' },
                { value: 'calm', label: 'Спокойный', color: '#26c6da' },
                { value: 'formal', label: 'Формальный', color: '#5e35b1' }
              ].map(mood => (
                <button
                  key={mood.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, mood: mood.value as any }))}
                  style={{
                    padding: 16,
                    borderRadius: 8,
                    border: formData.mood === mood.value ? `2px solid ${mood.color}` : "1px solid #333",
                    background: formData.mood === mood.value ? `${mood.color}20` : "#2a2a2a",
                    color: formData.mood === mood.value ? mood.color : "#888",
                    cursor: "pointer",
                    fontWeight: formData.mood === mood.value ? "bold" : "normal",
                    transition: "all 0.2s"
                  }}
                >
                  {mood.label}
                </button>
              ))}
            </div>
          </div>

          {/* Разрешённые темы */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", marginBottom: 10, fontSize: 14, fontWeight: 600 }}>
              Разрешённые темы
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { key: 'allowVPN' as const, label: 'VPN советы' },
                { key: 'allowCompetitorPrices' as const, label: 'Информация о конкурентах' },
                { key: 'allowProfanity' as const, label: 'Неформальный язык' },
                { key: 'allowPersonalAdvice' as const, label: 'Личные советы' }
              ].map(topic => {
                const isActive = formData[topic.key] as boolean;
                return (
                  <button
                    key={topic.key}
                    type="button"
                    onClick={() => toggle(topic.key)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 20,
                      border: "none",
                      background: isActive ? "#667eea" : "#2a2a2a",
                      color: isActive ? "white" : "#888",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontWeight: isActive ? "500" : "normal",
                      textDecoration: isActive ? "none" : "line-through",
                      opacity: isActive ? 1 : 0.6
                    }}
                  >
                    {topic.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Дополнительные настройки */}
          <div style={{ marginBottom: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>
                Длина ответов
              </label>
              <select
                value={formData.maxResponseLength}
                onChange={(e) => setFormData(prev => ({ ...prev, maxResponseLength: e.target.value as any }))}
                style={{ 
                  width: "100%", 
                  padding: 10, 
                  borderRadius: 6, 
                  border: "1px solid #333",
                  background: "#2a2a2a",
                  color: "white"
                }}
              >
                <option value="short">Короткие (1-2 предложения)</option>
                <option value="medium">Средние (3-4 абзаца)</option>
                <option value="long">Подробные</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>
                Использование эмодзи
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.useEmojis}
                  onChange={(e) => setFormData(prev => ({ ...prev, useEmojis: e.target.checked }))}
                  style={{ width: 18, height: 18 }}
                />
                <span>Разрешить эмодзи</span>
              </label>
            </div>
          </div>

          {/* Расширенные настройки */}
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #333" }}>
            <button 
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 8, 
                color: "#667eea",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                fontSize: 14
              }}
            >
              <Code size={16} />
              {showAdvanced ? "Скрыть" : "Показать"} расширенные настройки
            </button>
            
            {showAdvanced && (
              <div style={{ marginTop: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>
                  Кастомные инструкции для ассистента
                </label>
                <textarea
                  value={formData.customPromptText}
                  onChange={(e) => setFormData(prev => ({ ...prev, customPromptText: e.target.value }))}
                  placeholder="Например: Ты работаешь в интернет-магазине. Будь максимально полезным и всегда предлагай альтернативы..."
                  style={{ 
                    width: "100%", 
                    padding: 12, 
                    borderRadius: 6, 
                    border: "1px solid #333",
                    background: "#2a2a2a",
                    color: "white",
                    minHeight: 120,
                    fontFamily: "inherit",
                    fontSize: 13,
                    resize: "vertical"
                  }}
                />
                <p style={{ fontSize: 11, color: "#888", marginTop: 6, lineHeight: "1.4" }}>
                  💡 <strong>Советы:</strong> Опишите роль ассистента, стиль общения и специфические правила. 
                  Система автоматически добавит контекст из базы знаний.
                </p>
              </div>
            )}
          </div>

          {/* Кнопки */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{ 
                padding: "10px 20px", 
                borderRadius: 6,
                border: "1px solid #333",
                background: "transparent",
                color: "#888",
                cursor: "pointer"
              }}
            >
              Отмена
            </button>
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                padding: "10px 20px", 
                borderRadius: 6,
                border: "none",
                background: loading ? "#555" : "#667eea",
                color: "white",
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};