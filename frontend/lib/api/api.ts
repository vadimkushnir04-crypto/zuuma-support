// frontend/lib/api.ts
// ✅ Универсальная функция для API запросов с cookies

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zuuma.ru/api';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    credentials: 'include', // ✅ Всегда отправляем cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ✅ Примеры использования:
export const api = {
  // Профиль
  getProfile: () => apiFetch('/api/auth/profile'),
  updateProfile: (data: any) => apiFetch('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  // Ассистенты
  getAssistants: () => apiFetch('/api/assistants'),
  getAssistantStats: () => apiFetch('/api/assistants/stats'),
  
  // Функции
  getGlobalFunctions: () => apiFetch('/api/functions/global'),
  getFunctionStats: () => apiFetch('/api/functions/usage-stats'),
  
  // Токены
  getTokensAnalytics: () => apiFetch('/api/tokens/analytics'),
};