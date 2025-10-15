// backend/src/assistants/assistants.types.ts
export interface Assistant {
  id: string;
  name: string;
  description?: string;
  collectionName: string; // Имя коллекции в Qdrant
  apiKey: string; // Уникальный API ключ для этого ассистента
  systemPrompt?: string; // Кастомный системный промпт
  isActive: boolean;
  trained?: boolean; // ✅ новое поле
  settings: AssistantSettings;
  createdAt: Date;
  updatedAt: Date;
  
  // Статистика
  totalQueries?: number;
  lastUsed?: Date;
}

export interface AssistantSettings {
  temperature?: number; // 0-1 для креативности AI
  maxTokens?: number;
  maxHistoryMessages?: number;
  enableToxicityFilter?: boolean;
  allowSmallTalk?: boolean;
  customGreeting?: string;
  fallbackMessage?: string;
  
  // Настройки поиска
  searchLimit?: number; // Количество контекстных документов
  minSearchScore?: number; // Минимальный порог релевантности
  
  // Брендинг
  avatar?: string; // URL аватарки
  primaryColor?: string;
  theme?: 'light' | 'dark' | 'auto';
}

export interface CreateAssistantDto {
  name: string;
  description?: string;
  systemPrompt?: string;
  settings?: {
    temperature?: number;
    maxTokens?: number;
    maxHistoryMessages?: number;
    enableToxicityFilter?: boolean;
    allowSmallTalk?: boolean;
    searchLimit?: number;
    minSearchScore?: number;
    customGreeting?: string;
    fallbackMessage?: string;
    theme?: 'light' | 'dark' | 'auto';
    primaryColor?: string;
    avatar?: string;
  };
}

export interface UpdateAssistantDto {
  name?: string;
  description?: string;
  systemPrompt?: string;
  isActive?: boolean;
  trained?: boolean; // ✅ добавляем сюда
  settings?: Partial<AssistantSettings>;
}

export interface AssistantListResponse {
  assistants: Assistant[];
  total: number;
}

export interface AssistantStatsResponse {
  id: string;
  name: string;
  totalQueries: number;
  totalDocuments: number;
  lastUsed: Date | null;
  isActive: boolean;
  apiKey: string;
}

export interface AssistantChatRequest {
  message: string;
  conversationId?: string;
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface AssistantChatResponse {
  response: string;
  conversationId: string;
  sources: number;
  hasContext: boolean;
  searchResults?: Array<{
    text: string;
    score: number;
    title: string;
  }>;
}