// frontend/lib/api/integrations.ts
import { telegramAPI } from './telegram';

export interface CreateTelegramBotRequest {
  botName: string;
  botToken: string;
  description?: string;
  assistantId: string;
  creationMethod: 'manual';
}

export interface Integration {
  id: string;
  name: string;
  type: 'widget' | 'telegram' | 'api' | 'whatsapp';
  assistant?: string;        // ID ассистента
  assistantName?: string;    // Имя ассистента
  assistantId?: string;      // Альтернативное поле для ID
  status: 'active' | 'inactive' | 'pending' | 'creating';
  created?: string;          // ISO string (нормализованное поле)
  // дополнительные возможные поля от бэкенда
  createdAt?: string;
  created_at?: string;
  config?: {
    telegramToken?: string;
    telegramUsername?: string;
    telegramUrl?: string;
    webhookUrl?: string;
    commands?: string[];
  };
}

export interface Assistant {
  id: string;
  name: string;
  description: string;
  trained: boolean;
  trainingData: string;
}

export interface ToggleIntegrationResponse {
  success: boolean;
  integration?: Integration;
  message?: string;
}

export interface DeleteIntegrationResponse {
  success: boolean;
  message?: string;
}

class IntegrationsAPI {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  private getAuthToken(): string {
    try {
      return localStorage.getItem('auth_token') || '';
    } catch {
      return '';
    }
  }

  private normalizeIntegration(item: any): Integration {
    if (!item) return item;
    const createdRaw = item.created ?? item.createdAt ?? item.created_at ?? item.createdOn ?? item.created_on ?? null;
    let createdIso: string | undefined = undefined;
    if (createdRaw) {
      const d = typeof createdRaw === 'number' ? new Date(createdRaw) : new Date(createdRaw);
      if (!isNaN(d.getTime())) createdIso = d.toISOString();
    }
    return {
      id: item.id ?? item._id ?? item.integrationId ?? '',
      name: item.name ?? item.title ?? 'Без имени',
      type: item.type ?? item.integrationType ?? 'telegram',
      assistant: item.assistant ?? item.assistantId ?? item.assistant?.id,
      assistantName: item.assistantName ?? item.assistant?.name ?? undefined,
      assistantId: item.assistantId ?? item.assistant?.id ?? undefined,
      status: item.status ?? 'inactive',
      created: createdIso ?? (typeof item.created === 'string' ? item.created : undefined),
      createdAt: item.createdAt,
      created_at: item.created_at,
      config: item.config ?? item.settings ?? {},
    };
  }

  async createTelegramBot(data: CreateTelegramBotRequest): Promise<{
    success: boolean;
    integration?: Integration;
    error?: string;
  }> {
    try {
      if (data.creationMethod !== 'manual') {
        return { success: false, error: 'Only manual creation method is supported' };
      }

      if (!data.botToken) {
        return { success: false, error: 'botToken is required for manual bot' };
      }

      const manualData = {
        botName: data.botName,
        botToken: data.botToken,
        description: data.description,
        assistantId: data.assistantId,
        creationMethod: 'manual' as const,
      };

      const res = await telegramAPI.connectManualBot(manualData);
      // если telegramAPI вернул integration — нормализуем его
      if (res?.success && res.integration) {
        return { success: true, integration: this.normalizeIntegration(res.integration) };
      }
      return res;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getAllIntegrations(): Promise<Integration[]> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations`, {
        headers: { 'Authorization': `Bearer ${this.getAuthToken()}` },
      });

      if (!response.ok) {
        console.error('getAllIntegrations: response not ok', response.status);
        throw new Error('Failed to fetch integrations');
      }

      const json = await response.json();

      // Поддерживаем разные форматы ответа:
      // { data: [...] } | { integrations: [...] } | [ ... ] | { data: { integrations: [...] } }
      let list: any[] = [];
      if (Array.isArray(json)) list = json;
      else if (Array.isArray(json.data)) list = json.data;
      else if (Array.isArray(json.integrations)) list = json.integrations;
      else if (Array.isArray(json.items)) list = json.items;
      else if (Array.isArray(json.data?.integrations)) list = json.data.integrations;
      else list = [];

      return list.map(i => this.normalizeIntegration(i));
    } catch (error) {
      console.error('Error fetching integrations:', error);
      return [];
    }
  }

  async toggleIntegration(id: string): Promise<ToggleIntegrationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/${id}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const txt = await response.text();
        console.error('toggleIntegration: bad response', response.status, txt);
        throw new Error('Failed to toggle integration');
      }

      const json = await response.json();
      // Попробуем извлечь нормализованную интеграцию
      const rawIntegration = json.integration ?? json.data ?? json.data?.integration ?? json;
      const normalized = rawIntegration ? this.normalizeIntegration(rawIntegration) : undefined;

      return {
        success: !!(json.success ?? true),
        integration: normalized,
        message: json.message,
      };
    } catch (error) {
      console.error('Error toggling integration:', error);
      throw error;
    }
  }

  async deleteIntegration(id: string): Promise<DeleteIntegrationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const txt = await response.text();
        console.error('deleteIntegration: bad response', response.status, txt);
        throw new Error('Failed to delete integration');
      }

      const json = await response.json();
      return {
        success: !!(json.success ?? true),
        message: json.message,
      };
    } catch (error) {
      console.error('Error deleting integration:', error);
      throw error;
    }
  }

  async fetchAssistants(): Promise<Assistant[]> {
    try {
      const token = this.getAuthToken();

      if (!token) {
        console.error('No auth token');
        return [];
      }

      const response = await fetch(`${this.baseUrl}/assistants`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch assistants');
      }

      const data = await response.json();
      const assistantsList = Array.isArray(data?.data?.assistants) ? data.data.assistants : (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));

      return assistantsList.map((a: any) => ({
        id: a.id,
        name: a.name,
        description: a.description || '',
        trained: a.trained || false,
        trainingData: a.trainingData || '',
      }));
    } catch (error) {
      console.error('Error fetching assistants:', error);
      return [];
    }
  }

  async getAssistants(): Promise<Assistant[]> {
    return this.fetchAssistants();
  }
}

export const integrationsAPI = new IntegrationsAPI();

export async function fetchAssistants(): Promise<Assistant[]> {
  return integrationsAPI.fetchAssistants();
}
