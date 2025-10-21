'use client';

// frontend/app/support/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ChatSession {
  id: string;
  assistantId: string;
  status: 'ai' | 'pending_human' | 'human_active' | 'resolved';
  escalationReason?: string;
  escalationUrgency?: 'low' | 'medium' | 'high';
  escalatedAt?: string;
  integrationType: string;
  userIdentifier: string;
  createdAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zuuma.ru/api';

export default function SupportPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'resolved'>('pending');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadSessions();
  }, [filter]);

  const loadSessions = async () => {
    try {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        console.warn('⛔ Нет токена — пользователь не авторизован');
        setLoading(false);
        return;
      }

      const statusFilter = filter === 'all' ? '' : `&status=${filter === 'pending' ? 'pending_human' : filter === 'active' ? 'human_active' : 'resolved'}`;
      
      const response = await fetch(
        `${API_BASE_URL}/support/chats?${statusFilter}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to load sessions');

      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      ai: 'bg-blue-100 text-blue-800',
      pending_human: 'bg-yellow-100 text-yellow-800',
      human_active: 'bg-green-100 text-green-800',
      resolved: 'bg-gray-100 text-gray-800',
    };
    
    const labels = {
      ai: 'AI',
      pending_human: 'Ожидает',
      human_active: 'Активен',
      resolved: 'Решен',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="dashboard">
      <div className="max-w-7xl mx-auto">
        <div className="dashboard-header">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Поддержка</h1>
          <p className="text-gray-600">
            Управление чатами и эскалацией на живых операторов, здесь вы можете вступить в переписку с вашим клиентом в экстренной ситуации
          </p>
        </div>

        {/* Фильтры */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2">
            {['all', 'pending', 'active', 'resolved'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === f
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f === 'all' && 'Все'}
                {f === 'pending' && 'Ожидают'}
                {f === 'active' && 'Активные'}
                {f === 'resolved' && 'Решенные'}
              </button>
            ))}
          </div>
        </div>

        {/* Список чатов */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Загрузка...</div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Нет чатов для отображения
            </div>
          ) : (
            <div className="divide-y">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 hover:bg-gray-50 transition flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(session.status)}
                      <span className="text-sm text-gray-500">
                        {session.integrationType}
                      </span>
                      {session.escalationUrgency && (
                        <span
                          className={`text-sm font-semibold ${getUrgencyColor(
                            session.escalationUrgency
                          )}`}
                        >
                          {session.escalationUrgency.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(session.createdAt).toLocaleString('ru-RU')}
                    </span>
                  </div>

                  {session.escalationReason && (
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Причина:</span>{' '}
                      {session.escalationReason}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex gap-4">
                      <span>ID: {session.id.slice(0, 8)}...</span>
                      <span>User: {session.userIdentifier.slice(0, 20)}</span>
                    </div>
                    <button
                      onClick={() => router.push(`/support/chat/${session.id}`)}
                      className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition"
                    >
                      Перейти к чату
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}