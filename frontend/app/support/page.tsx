'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react';

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
        console.warn('Нет токена – пользователь не авторизован');
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
      case 'high': return 'var(--error)';
      case 'medium': return 'var(--warning)';
      case 'low': return 'var(--success)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      ai: { 
        label: 'AI', 
        class: 'badge-info',
        icon: MessageSquare 
      },
      pending_human: { 
        label: 'Ожидает', 
        class: 'badge-warning',
        icon: Clock 
      },
      human_active: { 
        label: 'Активен', 
        class: 'badge-success',
        icon: CheckCircle 
      },
      resolved: { 
        label: 'Решен', 
        class: 'badge',
        icon: CheckCircle 
      },
    };
    
    return configs[status as keyof typeof configs] || configs.ai;
  };

  const filterButtons = [
    { key: 'all', label: 'Все' },
    { key: 'pending', label: 'Ожидают' },
    { key: 'active', label: 'Активные' },
    { key: 'resolved', label: 'Решенные' }
  ];

  return (
  <div className="new-design-system">
    <div className="page-container">
      <div className="page-content">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Поддержка</h1>
            <p className="page-subtitle">
              Управление чатами и эскалацией на живых операторов
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 mb-xl">
          <div className="card">
            <div className="flex items-center gap-md">
              <MessageSquare size={24} color="var(--info)" />
              <div>
                <div className="text-small text-muted">Всего чатов</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: 'var(--space-xs)' }}>
                  {sessions.length}
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center gap-md">
              <Clock size={24} color="var(--warning)" />
              <div>
                <div className="text-small text-muted">Ожидают</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: 'var(--space-xs)' }}>
                  {sessions.filter(s => s.status === 'pending_human').length}
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center gap-md">
              <CheckCircle size={24} color="var(--success)" />
              <div>
                <div className="text-small text-muted">Активные</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: 'var(--space-xs)' }}>
                  {sessions.filter(s => s.status === 'human_active').length}
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center gap-md">
              <AlertCircle size={24} color="var(--accent)" />
              <div>
                <div className="text-small text-muted">Решенные</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: 'var(--space-xs)' }}>
                  {sessions.filter(s => s.status === 'resolved').length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-xl">
          <div className="flex gap-md">
            {filterButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key as any)}
                className={filter === btn.key ? 'btn btn-primary' : 'btn btn-outline'}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Sessions List */}
        <div className="card">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <span style={{ marginLeft: 'var(--space-md)' }}>Загрузка...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="empty-state">
              <MessageSquare size={48} />
              <h3>Нет чатов для отображения</h3>
              <p>Чаты появятся здесь, когда пользователи обратятся в поддержку</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {sessions.map((session) => {
                const statusConfig = getStatusConfig(session.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <div
                    key={session.id}
                    className="card card-elevated"
                    style={{ 
                      cursor: 'pointer',
                      transition: 'all var(--transition)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow)';
                    }}
                    onClick={() => router.push(`/support/chat/${session.id}`)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-lg" style={{ flex: 1 }}>
                        {/* Status Badge */}
                        <div className={`badge ${statusConfig.class}`}>
                          <StatusIcon size={14} />
                          {statusConfig.label}
                        </div>

                        {/* Integration Type */}
                        <span className="badge">
                          {session.integrationType}
                        </span>

                        {/* Urgency Badge */}
                        {session.escalationUrgency && (
                          <span 
                            className="badge"
                            style={{ 
                              color: getUrgencyColor(session.escalationUrgency),
                              borderColor: getUrgencyColor(session.escalationUrgency)
                            }}
                          >
                            {session.escalationUrgency.toUpperCase()}
                          </span>
                        )}

                        {/* User Info */}
                        <div style={{ flex: 1 }}>
                          <div className="text-small text-muted">
                            User: {session.userIdentifier.slice(0, 30)}
                          </div>
                          {session.escalationReason && (
                            <div className="text-small" style={{ marginTop: 'var(--space-xs)' }}>
                              <span style={{ fontWeight: 500 }}>Причина:</span> {session.escalationReason}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Date & Action */}
                      <div className="flex items-center gap-lg">
                        <span className="text-small text-muted">
                          {new Date(session.createdAt).toLocaleString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/support/chat/${session.id}`);
                          }}
                          className="btn btn-primary btn-sm"
                        >
                          Открыть
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}