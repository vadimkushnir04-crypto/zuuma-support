// frontend/hooks/useTelegramAuth.ts
import { useState, useEffect } from 'react';
import { telegramAPI, TelegramAuthStatus } from '../lib/api/telegram';

export function useTelegramAuth() {
  const [authStatus, setAuthStatus] = useState<TelegramAuthStatus>({
    isAuthorized: false,
    userId: ''
  });
  const [loading, setLoading] = useState(true);

  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      const status = await telegramAPI.getAuthStatus();
      setAuthStatus(status);
    } catch (error) {
      console.error('Error checking Telegram auth:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const sendAuthCode = async (phone: string) => {
    const result = await telegramAPI.sendAuthCode(phone);
    return result;
  };

  const confirmCode = async (phone: string, code: string) => {
    const result = await telegramAPI.confirmCode(phone, code);
    if (result.success) {
      setAuthStatus({ isAuthorized: true, userId: authStatus.userId });
    }
    return result;
  };

  const revokeAuth = async () => {
    const result = await telegramAPI.revokeAuth();
    if (result.success) {
      setAuthStatus({ isAuthorized: false, userId: '' });
    }
    return result;
  };

  return {
    ...authStatus,
    loading,
    sendAuthCode,
    confirmCode,
    revokeAuth,
    refresh: checkAuthStatus
  };
}