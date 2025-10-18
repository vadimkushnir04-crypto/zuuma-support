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

  private getAuthToken(): string {
    const token = localStorage.getItem('auth_token') || '';
    if (!token) console.warn('⚠️ auth_token is missing in localStorage');
    return token;
  }

  private getHeaders() {
    const token = this.getAuthToken();
    if (!token) throw new Error('JWT token missing. Please login again.');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async getAuthStatus(): Promise<TelegramAuthStatus> {
    try {
      const response = await fetch(`${API_BASE_URL}/telegram/auth/status`, {
        headers: this.getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to get auth status');
      return await response.json();
    } catch (error) {
      console.error('Error getting Telegram auth status:', error);
      return { isAuthorized: false, userId: '' };
    }
  }

  async sendAuthCode(phone: string): Promise<TelegramAuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/telegram/auth/send-code`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ phone }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async confirmCode(phone: string, code: string): Promise<TelegramAuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/telegram/auth/confirm-code`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ phone, code }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async revokeAuth(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/telegram/auth/revoke`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      return await response.json();
    } catch {
      return { success: false, message: 'Failed to revoke authorization' };
    }
  }

  async connectManualBot(data: ConnectManualBotRequest): Promise<{
    success: boolean;
    integration?: any;
    error?: string;
    message?: string;
  }> {
    console.group('🟡 connectManualBot called');
    console.log('➡️ Input data:', data);
    console.trace('📌 Call stack for connectManualBot');
    console.groupEnd();

    const token = this.getAuthToken();
    if (!token) return { success: false, error: 'JWT token missing. Please login again.' };

    // Отправляем payload без изменений
    const payload: ConnectManualBotRequest = {
      botName: data.botName,
      botToken: data.botToken,
      assistantId: data.assistantId,
      description: data.description,
      creationMethod: 'manual',
    };

    console.log('📤 Sending payload to backend:', JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(`${API_BASE_URL}/telegram/bots/connect-manual`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error('❌ Server responded with error:', result);
        return {
          success: false,
          error: result.error || result.message || 'Failed to connect bot',
        };
      }

      console.log('✅ Server response:', result);
      return result;
    } catch (error) {
      console.error('❌ Request failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Универсальный метод для createTelegramBot (теперь только для manual)
  async createTelegramBot(data: ConnectManualBotRequest) {
    if (data.creationMethod !== 'manual') {
      return { success: false, error: 'Only manual creation method is supported' };
    }
    return this.connectManualBot(data);
  }
}

export const telegramAPI = new TelegramAPI();
