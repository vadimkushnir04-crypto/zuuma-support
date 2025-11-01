// frontend/app/analytics/page.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ

"use client";
import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  ArrowUp,
  ArrowDown,
  Bot,
  Clock,
  Zap,
  Target,
  History,
  X
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, ResponsiveContainer, Tooltip, Legend 
} from 'recharts';
import AuthGuard from '../../components/AuthGuard';
import { useTokens } from '../../hooks/useTokens';

interface UserStats {
  totalTokens: number;
  usedTokens: number;
  remainingTokens: number;
  plan: string;
  monthlyLimit: number;
}

interface ChartData {
  date: string;
  tokens: number;
  chats: number;
}

interface AssistantData {
  assistant_id: string;
  assistant_name: string;
  requests: number;
  total_tokens: string;
}

interface PeriodStats {
  totalRequests: number;
  totalTokensUsed: number;
  avgTokensPerRequest: number;
  daysInPeriod: number;
  avgTokensPerDay: number;
  daysLeft: number | null;
}

interface Transaction {
  id: string;
  type: string;
  amount: string;
  assistant_id?: string;
  meta?: any;
  created_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zuuma.ru/api';

export default function AnalyticsPage() {
  const { balance, loading, error } = useTokens();
  const [timeRange, setTimeRange] = useState('30d');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ✅ ИСПРАВЛЕНО: Получаем реальные данные
  const userStats: UserStats = balance ? {
    totalTokens: parseInt(balance.total_tokens || '0'),
    usedTokens: parseInt(balance.used_tokens || '0'),
    remainingTokens: parseInt(balance.total_tokens || '0') - parseInt(balance.used_tokens || '0'),
    plan: balance.plan || 'Free',
    monthlyLimit: parseInt(balance.total_tokens || '0'),
  } : {
    totalTokens: 0,
    usedTokens: 0,
    remainingTokens: 0,
    plan: 'Free',
    monthlyLimit: 0,
  };

  // ✅ ИСПРАВЛЕНО: Данные из аналитики с проверками
  const usageData: ChartData[] = analytics?.dailyUsage?.map((d: any) => ({
    date: d.date,
    tokens: parseInt(d.tokens || '0'),
    chats: parseInt(d.chats || '0'),
  })) || [];

  const assistantUsage: AssistantData[] = analytics?.assistantUsage || [];
  const periodStats: PeriodStats | null = analytics?.periodStats || null;

  // ✅ ИСПРАВЛЕНО: Загрузка аналитики с timeRange
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tokens/analytics?range=${timeRange}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки аналитики:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // ✅ НОВОЕ: Загрузка истории транзакций
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tokens/history?limit=50`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // ✅ ИСПРАВЛЕНО: Обновляем при изменении timeRange
  useEffect(() => {
    if (!loading && balance) {
      fetchAnalytics();
    }
  }, [loading, balance, timeRange]); // ← Добавили timeRange в зависимости

  if (loading || loadingAnalytics) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="dashboard">
          <div className="loading-state">Загрузка...</div>
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="dashboard">
          <div className="error-state">Ошибка загрузки данных</div>
        </div>
      </AuthGuard>
    );
  }

  const usagePercentage = userStats.monthlyLimit > 0 
    ? (userStats.usedTokens / userStats.monthlyLimit) * 100 
    : 0;

  return (
    <AuthGuard requireAuth={true}>
      <div className="dashboard">
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            <TrendingUp size={32} />
            Аналитика и управление
          </h1>
          <p className="dashboard-subtitle">
            Полный обзор производительности, активности и качества работы ваших ассистентов
          </p>
        </div>

        {/* ✅ Баланс и лимиты */}
        <div className="balance-section">
          <div className="balance-header">
            <h2 className="balance-title">Баланс токенов</h2>
            <div className="balance-actions">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowHistory(true);
                  fetchHistory();
                }}
              >
                <History size={16} />
                История операций
              </button>
            </div>
          </div>
          <div className="balance-info">
            <div className="balance-item">
              <h3>Использовано в этом месяце</h3>
              <div className="value">{userStats.usedTokens.toLocaleString()}</div>
              <div className="subvalue">из {userStats.monthlyLimit.toLocaleString()} токенов</div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${usagePercentage}%` }}
                ></div>
              </div>
            </div>
            <div className="balance-item">
              <h3>Остаток токенов</h3>
              <div className="value">{userStats.remainingTokens.toLocaleString()}</div>
              <div className="subvalue">Тариф: {userStats.plan}</div>
            </div>
            {/* ❌ УБРАЛИ "Токенов на чат" */}
          </div>
        </div>

        {/* ✅ НОВОЕ: Статистика за период */}
        {periodStats && (
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            <div className="stat-card">
              <div className="stat-icon">
                <Zap size={24} color="var(--accent)" />
              </div>
              <div className="stat-label">Запросов за период</div>
              <div className="stat-value">{periodStats.totalRequests}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Target size={24} color="var(--accent)" />
              </div>
              <div className="stat-label">Средний расход токенов</div>
              <div className="stat-value">{periodStats.avgTokensPerRequest}</div>
              <div className="stat-sublabel">на запрос</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <TrendingUp size={24} color="var(--accent)" />
              </div>
              <div className="stat-label">Токенов в день</div>
              <div className="stat-value">{periodStats.avgTokensPerDay}</div>
              <div className="stat-sublabel">в среднем</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Clock size={24} color={periodStats.daysLeft && periodStats.daysLeft < 7 ? 'red' : 'var(--accent)'} />
              </div>
              <div className="stat-label">Дней до окончания</div>
              <div className="stat-value">
                {periodStats.daysLeft !== null ? periodStats.daysLeft : '∞'}
              </div>
              <div className="stat-sublabel">при текущем темпе</div>
            </div>
          </div>
        )}

        {/* ✅ График использования */}
        <div className="charts-section">
          <div className="chart-card" style={{ gridColumn: 'span 2' }}>
            <div className="chart-header">
              <h3 className="chart-title">Использование токенов и производительность</h3>
              <div className="chart-filters">
                {['7d', '30d', '3m'].map((period) => (
                  <button
                    key={period}
                    className={`filter-btn ${timeRange === period ? 'active' : ''}`}
                    onClick={() => setTimeRange(period)}
                  >
                    {period === '7d' ? '7 дней' : period === '30d' ? '30 дней' : '3 месяца'}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--fg-muted)" />
                <YAxis stroke="var(--fg-muted)" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="tokens"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  name="Токены"
                />
                <Line
                  type="monotone"
                  dataKey="chats"
                  stroke="var(--accent-hover)"
                  strokeWidth={2}
                  name="Запросы"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ✅ ИСПРАВЛЕНО: График по ассистентам */}
        <div className="charts-section">
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Использование ассистентов</h3>
            </div>
            {assistantUsage.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={assistantUsage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis 
                    dataKey="assistant_name" 
                    stroke="var(--fg-muted)"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis stroke="var(--fg-muted)" />
                  <Tooltip />
                  <Bar dataKey="requests" fill="var(--accent)" name="Запросов" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--fg-muted)' }}>
                Нет данных за выбранный период
              </div>
            )}
          </div>
        </div>

        {/* ✅ НОВОЕ: Модальное окно истории транзакций */}
        {showHistory && (
          <div className="modal-overlay" onClick={() => setShowHistory(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }}>
              <div className="modal-header">
                <h2>История операций</h2>
                <button className="modal-close" onClick={() => setShowHistory(false)}>
                  <X size={24} />
                </button>
              </div>
              <div className="modal-body">
                {loadingHistory ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка...</div>
                ) : transactions.length > 0 ? (
                  <table className="transactions-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Дата</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Тип</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Токены</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Ассистент</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.75rem' }}>
                            {new Date(tx.created_at).toLocaleString('ru-RU')}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <span className={`badge ${tx.type === 'consume' ? 'badge-danger' : 'badge-success'}`}>
                              {tx.type === 'consume' ? 'Списание' : 'Пополнение'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>
                            {tx.type === 'consume' ? '-' : '+'}{parseInt(tx.amount || '0').toLocaleString()}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            {tx.meta?.assistant_name || tx.assistant_id?.substring(0, 8) || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--fg-muted)' }}>
                    Нет транзакций
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .stat-icon {
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 0.85rem;
          color: var(--fg-muted);
          font-weight: 500;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: var(--fg-default);
        }

        .stat-sublabel {
          font-size: 0.75rem;
          color: var(--fg-muted);
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: var(--bg-elevated);
          border-radius: 12px;
          border: 1px solid var(--border);
          width: 90%;
          max-width: 800px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border);
        }

        .modal-close {
          background: none;
          border: none;
          color: var(--fg-muted);
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: var(--bg-hover);
          color: var(--fg-default);
        }

        .modal-body {
          padding: 1.5rem;
        }

        .badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .badge-danger {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .badge-success {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        }

        .transactions-table {
          font-size: 0.9rem;
        }

        .btn-secondary {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
      `}</style>
    </AuthGuard>
  );
}