'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  status: string;
  errorMessage?: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState({
    action: '',
    limit: 50,
    offset: 0,
  });

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filter]);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        limit: filter.limit.toString(),
        offset: filter.offset.toString(),
        ...(filter.action && { action: filter.action }),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/audit-logs?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch logs');

      const data = await response.json();
      setLogs(data.logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/audit-logs/stats?days=30`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const exportLogs = async (format: 'json' | 'csv') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/audit-logs/export?format=${format}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to export logs');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${Date.now()}.${format}`;
      a.click();
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('created')) return '#4CAF50';
    if (action.includes('deleted')) return '#f44336';
    if (action.includes('updated')) return '#FF9800';
    if (action.includes('executed')) return '#2196F3';
    return '#9E9E9E';
  };

  const getStatusColor = (status: string) => {
    return status === 'success' ? '#4CAF50' : '#f44336';
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Загрузка логов...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '30px' }}>
        📊 Audit Logs
      </h1>

      {/* Статистика */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px',
          }}
        >
          {Object.entries(stats).map(([action, count]: any) => (
            <div
              key={action}
              style={{
                background: '#1E1E1E',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #333',
              }}
            >
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                {action.replace(/_/g, ' ').toUpperCase()}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{count}</div>
            </div>
          ))}
        </div>
      )}

      {/* Фильтры */}
      <div
        style={{
          background: '#1E1E1E',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          gap: '15px',
          alignItems: 'center',
        }}
      >
        <select
          value={filter.action}
          onChange={(e) => setFilter({ ...filter, action: e.target.value })}
          style={{
            padding: '10px',
            background: '#2A2A2A',
            border: '1px solid #444',
            borderRadius: '6px',
            color: '#E0E0E0',
          }}
        >
          <option value="">Все действия</option>
          <option value="function_executed">Function Executed</option>
          <option value="function_created">Function Created</option>
          <option value="function_updated">Function Updated</option>
          <option value="function_deleted">Function Deleted</option>
          <option value="assistant_created">Assistant Created</option>
          <option value="login">Login</option>
        </select>

        <button
          onClick={() => exportLogs('csv')}
          style={{
            padding: '10px 20px',
            background: '#4CAF50',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          📥 Export CSV
        </button>

        <button
          onClick={() => exportLogs('json')}
          style={{
            padding: '10px 20px',
            background: '#2196F3',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          📥 Export JSON
        </button>
      </div>

      {/* Таблица логов */}
      <div
        style={{
          background: '#1E1E1E',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#2A2A2A' }}>
              <th style={{ padding: '15px', textAlign: 'left' }}>Дата</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Действие</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Статус</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>IP</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Детали</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                style={{ borderBottom: '1px solid #333' }}
              >
                <td style={{ padding: '15px' }}>
                  {new Date(log.createdAt).toLocaleString('ru-RU')}
                </td>
                <td style={{ padding: '15px' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: getActionColor(log.action),
                      fontSize: '12px',
                    }}
                  >
                    {log.action}
                  </span>
                </td>
                <td style={{ padding: '15px' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: getStatusColor(log.status),
                      fontSize: '12px',
                    }}
                  >
                    {log.status}
                  </span>
                </td>
                <td style={{ padding: '15px', fontSize: '12px', color: '#888' }}>
                  {log.ipAddress}
                </td>
                <td style={{ padding: '15px', fontSize: '12px', color: '#888' }}>
                  {log.details && (
                    <details>
                      <summary style={{ cursor: 'pointer' }}>Показать</summary>
                      <pre
                        style={{
                          marginTop: '10px',
                          padding: '10px',
                          background: '#0D0D0D',
                          borderRadius: '4px',
                          fontSize: '11px',
                          overflow: 'auto',
                        }}
                      >
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      <div
        style={{
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => setFilter({ ...filter, offset: Math.max(0, filter.offset - filter.limit) })}
          disabled={filter.offset === 0}
          style={{
            padding: '10px 20px',
            background: filter.offset === 0 ? '#333' : '#4CAF50',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            cursor: filter.offset === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          ← Назад
        </button>

        <span>
          Записи {filter.offset + 1} - {filter.offset + logs.length}
        </span>

        <button
          onClick={() => setFilter({ ...filter, offset: filter.offset + filter.limit })}
          disabled={logs.length < filter.limit}
          style={{
            padding: '10px 20px',
            background: logs.length < filter.limit ? '#333' : '#4CAF50',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            cursor: logs.length < filter.limit ? 'not-allowed' : 'pointer',
          }}
        >
          Вперед →
        </button>
      </div>
    </div>
  );
}