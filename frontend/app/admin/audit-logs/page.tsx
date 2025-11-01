'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface AuditLog {
  id: string;
  action: string;
  ipAddress: string;
  status: 'success' | 'failure' | 'pending';
  createdAt: string;
  details: any;
  metadata: any;
}

interface Stats {
  action: string;
  count: string;
  status: string;
}

export default function AuditLogsPage() {
  const { isLoggedIn } = useAuth(); // ← Изменить на isLoggedIn
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats[]>([]);
  const [dailyActivity, setDailyActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    action: '',
    status: '',
    days: '30',
  });

  useEffect(() => {
    if (isLoggedIn) { // ← Изменить на isLoggedIn
      fetchLogs();
      fetchStats();
      fetchDailyActivity();
    }
  }, [isLoggedIn, filter]); // ← Изменить на isLoggedIn

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams({
        limit: '50',
        ...(filter.action && { action: filter.action }),
        ...(filter.status && { status: filter.status }),
      });

      const response = await fetch(`/api/audit-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/audit-logs/stats?days=${filter.days}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      setStats(data.stats || []);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchDailyActivity = async () => {
    try {
      const response = await fetch(`/api/audit-logs/daily?days=${filter.days}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      setDailyActivity(data.activity || []);
    } catch (error) {
      console.error('Failed to fetch daily activity:', error);
    }
  };

  const exportLogs = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/audit-logs/export?format=${format}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'failure':
        return 'text-red-600 bg-red-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getActionLabel = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Audit Logs
        </h1>
        <p className="text-gray-600">
          Просмотр и анализ действий пользователей
        </p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Всего действий
          </h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats.reduce((sum, stat) => sum + parseInt(stat.count), 0)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Успешных действий
          </h3>
          <p className="text-3xl font-bold text-green-600">
            {stats
              .filter(s => s.status === 'success')
              .reduce((sum, stat) => sum + parseInt(stat.count), 0)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Ошибок
          </h3>
          <p className="text-3xl font-bold text-red-600">
            {stats
              .filter(s => s.status === 'failure')
              .reduce((sum, stat) => sum + parseInt(stat.count), 0)}
          </p>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Действие
            </label>
            <select
              value={filter.action}
              onChange={(e) => setFilter({ ...filter, action: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Все действия</option>
              <option value="assistant_created">Assistant Created</option>
              <option value="function_created">Function Created</option>
              <option value="login">Login</option>
              <option value="file_uploaded">File Uploaded</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Статус
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Все статусы</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Период
            </label>
            <select
              value={filter.days}
              onChange={(e) => setFilter({ ...filter, days: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="7">Последние 7 дней</option>
              <option value="30">Последние 30 дней</option>
              <option value="90">Последние 90 дней</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => exportLogs('json')}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
            >
              Export JSON
            </button>
            <button
              onClick={() => exportLogs('csv')}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Таблица логов */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Время
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действие
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP адрес
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Детали
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(log.createdAt).toLocaleString('ru-RU')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {getActionLabel(log.action)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.ipAddress || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(log.status)}`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {log.details && (
                    <details className="cursor-pointer">
                      <summary className="text-blue-600 hover:text-blue-800">
                        Показать детали
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-w-md">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {logs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Нет данных для отображения
          </div>
        )}
      </div>
    </div>
  );
}