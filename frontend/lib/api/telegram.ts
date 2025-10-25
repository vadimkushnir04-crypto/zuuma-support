// frontend/lib/api/telegram.ts

export interface TelegramAuthStatus {
  isAuthorized: boolean;
  userId: string;
}

export interface TelegramAuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  sessionId?: string;
}

// Ручное подключение бота
export interface ConnectManualBotRequest {
  botName: string;
  botToken: string; // ⚠️ Используем botToken, чтобы совпадало с бэкендом
  description?: string;
  assistantId: string;
  creationMethod: 'manual';
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://zuuma.ru/api";

class TelegramAPI {
  // ✅ Универсальный метод запросов с куками
  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: 'include', // ✅ автоматически подставляет cookie
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error(`❌ Ошибка запроса [${response.status}]:`, data);
      throw new Error(data.error || data.message || `Ошибка ${response.status}`);
    }

    return data;
  }

  // =========================
  // 📡 TELEGRAM AUTH ROUTES
  // =========================

  async getAuthStatus(): Promise<TelegramAuthStatus> {
    try {
      return await this.request('/telegram/auth/status');
    } catch (error) {
      console.error('Error getting Telegram auth status:', error);
      return { isAuthorized: false, userId: '' };
    }
  }

  async sendAuthCode(phone: string): Promise<TelegramAuthResponse> {
    try {
      return await this.request('/telegram/auth/send-code', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async confirmCode(phone: string, code: string): Promise<TelegramAuthResponse> {
    try {
      return await this.request('/telegram/auth/confirm-code', {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      });
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async revokeAuth(): Promise<{ success: boolean; message?: string }> {
    try {
      return await this.request('/telegram/auth/revoke', {
        method: 'POST',
      });
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  // =========================
  // 🤖 BOT CONNECTION
  // =========================

  async connectManualBot(
    data: ConnectManualBotRequest
  ): Promise<{
    success: boolean;
    integration?: any;
    error?: string;
    message?: string;
  }> {
    console.group('🟡 connectManualBot called');
    console.log('➡️ Input data:', data);
    console.trace('📌 Call stack for connectManualBot');
    console.groupEnd();

    try {
      const result = await this.request('/telegram/bots/connect-manual', {
        method: 'POST',
        body: JSON.stringify({
          botName: data.botName,
          botToken: data.botToken,
          assistantId: data.assistantId,
          description: data.description,
          creationMethod: 'manual',
        }),
      });

      console.log('✅ Server response:', result);
      return result;
    } catch (error) {
      console.error('❌ Request failed:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Универсальный метод (оставляем для совместимости)
  async createTelegramBot(data: ConnectManualBotRequest) {
    if (data.creationMethod !== 'manual') {
      return { success: false, error: 'Only manual creation method is supported' };
    }
    return this.connectManualBot(data);
  }
}

export const telegramAPI = new TelegramAPI();
