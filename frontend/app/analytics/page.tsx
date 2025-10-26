"use client";
import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CreditCard,
  Users,
  MessageSquare,
  ArrowUp,
  ArrowDown,
  Minus,
  Plus,
  Bot,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Zap,
  Target,
  AlertCircle,
  Settings
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AuthGuard from '../../components/AuthGuard';
import TopUpModal from '../../components/TopUpModal';
import { useTokens } from '../../hooks/useTokens';

// Типы для данных
interface UserStats {
  totalTokens: number;
  usedTokens: number;
  remainingTokens: number;
  plan: string;
  monthlyLimit: number;
  tokensPerChat: number;
  totalChats: number;
  activeAssistants: number;
}

interface ChartData {
  date: string;
  tokens: number;
  chats: number;
  requests?: number;
  responses?: number;
  avgTime?: number;
}


interface AssistantData {
  name: string;
  requests: number;
  success: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zuuma.ru';

export default function AnalyticsPage() {
  const { balance, loading, error, mutate } = useTokens();
  const [timeRange, setTimeRange] = useState('30d');
  const [analytics, setAnalytics] = useState<any>(null);


  
  // Получаем реальные данные из баланса
  const userStats: UserStats = balance ? {
    totalTokens: parseInt(balance.total_tokens || '0'),
    usedTokens: parseInt(balance.used_tokens || '0'),
    remainingTokens: parseInt(balance.total_tokens || '0') - parseInt(balance.used_tokens || '0'),
    plan: balance.plan || 'Free',  // ← Исправлено: берем план из balance
    monthlyLimit: parseInt(balance.total_tokens || '0'),
    tokensPerChat: 1000,
    totalChats: 0,
    activeAssistants: 0
  } : {
    totalTokens: 0,
    usedTokens: 0,
    remainingTokens: 0,
    plan: 'JustTry',
    monthlyLimit: 0,
    tokensPerChat: 1000,
    totalChats: 0,
    activeAssistants: 0
  };


  const usageData: ChartData[] = analytics?.dailyUsage?.map((d: any) => ({
    date: d.date,
    tokens: parseInt(d.tokens || '0'),
    chats: parseInt(d.chats || '0'),
    requests: parseInt(d.chats || '0'),
    responses: parseInt(d.chats || '0'),
    avgTime: 1.2
  })) || [];

  const assistantUsage: AssistantData[] = analytics?.assistantUsage?.map((a: any) => ({
    name: a.assistant_id?.substring(0, 8) || 'Unknown',
    requests: parseInt(a.requests || '0'),
    success: 95.0
  })) || [];


  useEffect(() => {
    const fetchAnalytics = async () => {
      try {

        const res = await fetch(`${API_BASE_URL}/api/tokens/analytics`, {
          method: 'GET',
            credentials: 'include', // 👈 ДОБАВЬТЕ ЭТО
            headers: {
              'Content-Type': 'application/json'
            }
        });
        
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error('Ошибка загрузки аналитики:', error);
      }
    };

    if (!loading && balance) {
      fetchAnalytics();
    }
  }, [loading, balance]);

  if (loading) {
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


        {/* Баланс и лимиты */}
        <div className="balance-section">
          <div className="balance-header">
            <h2 className="balance-title">Баланс токенов</h2>
            <div className="balance-actions">
              <button className="btn-secondary">
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
            <div className="balance-item">
              <h3>Токенов на чат</h3>
              <div className="value">{userStats.tokensPerChat}</div>
              <div className="subvalue">Лимит на один чат</div>
            </div>
          </div>
        </div>

        {/* Главные графики */}
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
                <Line
                  type="monotone"
                  dataKey="tokens"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  name="Токены"
                />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="var(--accent-hover)"
                  strokeWidth={2}
                  name="Запросы"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Графики по ассистентам и активности */}
        <div className="charts-section">
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Использование ассистентов</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={assistantUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--fg-muted)" />
                <YAxis stroke="var(--fg-muted)" />
                <Bar dataKey="requests" fill="var(--accent)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}