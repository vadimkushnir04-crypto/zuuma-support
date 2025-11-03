'use client';

import { useState, useEffect } from 'react';
import AdminGuard from '@/components/AdminGuard';

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
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    action: '',
    status: '',
    days: '30',
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zuuma.ru/api';

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filter]);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams({
        limit: '50',
        ...(filter.action && { action: filter.action }),
        ...(filter.status && { status: filter.status }),
      });

      const response = await fetch(`${API_BASE_URL}/audit-logs?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/audit-logs/stats?days=${filter.days}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data.stats || []);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats([]);
    }
  };

  const exportLogs = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`${API_BASE_URL}/audit-logs/export?format=${format}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to export logs');
      }

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
      alert('Ошибка при экспорте логов');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return { color: '#4CAF50', bg: '#1a2a1a' };
      case 'failure':
        return { color: '#ff6b6b', bg: '#2a1a1a' };
      case 'pending':
        return { color: '#ffa500', bg: '#2a2a1a' };
      default:
        return { color: '#999', bg: '#2a2a2a' };
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
      <AdminGuard>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Загрузка логов...</p>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Audit Logs</h1>
            <p style={styles.subtitle}>
              Просмотр и анализ действий пользователей
            </p>
          </div>
        </div>

        {/* Статистика */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h3 style={styles.statLabel}>Всего действий</h3>
            <p style={styles.statValue}>
              {stats.reduce((sum, stat) => sum + parseInt(stat.count), 0)}
            </p>
          </div>

          <div style={styles.statCard}>
            <h3 style={styles.statLabel}>Успешных действий</h3>
            <p style={{ ...styles.statValue, color: '#4CAF50' }}>
              {stats
                .filter(s => s.status === 'success')
                .reduce((sum, stat) => sum + parseInt(stat.count), 0)}
            </p>
          </div>

          <div style={styles.statCard}>
            <h3 style={styles.statLabel}>Ошибок</h3>
            <p style={{ ...styles.statValue, color: '#ff6b6b' }}>
              {stats
                .filter(s => s.status === 'failure')
                .reduce((sum, stat) => sum + parseInt(stat.count), 0)}
            </p>
          </div>
        </div>

        {/* Фильтры */}
        <div style={styles.filtersCard}>
          <div style={styles.filtersGrid}>
            <div>
              <label style={styles.filterLabel}>Действие</label>
              <select
                value={filter.action}
                onChange={(e) => setFilter({ ...filter, action: e.target.value })}
                style={styles.select}
              >
                <option value="">Все действия</option>
                <option value="assistant_created">Assistant Created</option>
                <option value="function_created">Function Created</option>
                <option value="login">Login</option>
                <option value="file_uploaded">File Uploaded</option>
              </select>
            </div>

            <div>
              <label style={styles.filterLabel}>Статус</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                style={styles.select}
              >
                <option value="">Все статусы</option>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label style={styles.filterLabel}>Период</label>
              <select
                value={filter.days}
                onChange={(e) => setFilter({ ...filter, days: e.target.value })}
                style={styles.select}
              >
                <option value="7">Последние 7 дней</option>
                <option value="30">Последние 30 дней</option>
                <option value="90">Последние 90 дней</option>
              </select>
            </div>

            <div style={styles.exportButtons}>
              <button
                onClick={() => exportLogs('json')}
                style={{ ...styles.button, background: '#4CAF50' }}
              >
                Export JSON
              </button>
              <button
                onClick={() => exportLogs('csv')}
                style={{ ...styles.button, background: '#2196F3' }}
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Таблица логов */}
        <div style={styles.tableCard}>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Время</th>
                  <th style={styles.th}>Действие</th>
                  <th style={styles.th}>IP адрес</th>
                  <th style={styles.th}>Статус</th>
                  <th style={styles.th}>Детали</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const statusColors = getStatusColor(log.status);
                  return (
                    <tr key={log.id} style={styles.tr}>
                      <td style={styles.td}>
                        {new Date(log.createdAt).toLocaleString('ru-RU')}
                      </td>
                      <td style={{ ...styles.td, fontWeight: '500' }}>
                        {getActionLabel(log.action)}
                      </td>
                      <td style={{ ...styles.td, color: '#999' }}>
                        {log.ipAddress || 'N/A'}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          color: statusColors.color,
                          background: statusColors.bg,
                        }}>
                          {log.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {log.details && (
                          <details style={{ cursor: 'pointer' }}>
                            <summary style={{ color: '#4CAF50' }}>
                              Показать детали
                            </summary>
                            <pre style={styles.detailsPre}>
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {logs.length === 0 && (
              <div style={styles.emptyState}>
                Нет данных для отображения
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #333',
    borderTop: '4px solid #4CAF50',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '1rem',
    color: '#999',
  },
  header: {
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#E0E0E0',
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: '#999',
    fontSize: '1rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  statCard: {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '1.5rem',
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#999',
    marginBottom: '0.5rem',
    fontWeight: '500',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#E0E0E0',
  },
  filtersCard: {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '2rem',
  },
  filtersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    alignItems: 'end',
  },
  filterLabel: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#E0E0E0',
    marginBottom: '0.5rem',
  },
  select: {
    width: '100%',
    padding: '0.75rem',
    background: '#2a2a2a',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#E0E0E0',
    fontSize: '0.875rem',
  },
  exportButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  button: {
    flex: 1,
    padding: '0.75rem 1rem',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  tableCard: {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '1rem',
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: '500',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #333',
    background: '#0a0a0a',
  },
  tr: {
    borderBottom: '1px solid #333',
  },
  td: {
    padding: '1rem',
    fontSize: '0.875rem',
    color: '#E0E0E0',
  },
  detailsPre: {
    marginTop: '0.5rem',
    fontSize: '0.75rem',
    background: '#0a0a0a',
    padding: '0.75rem',
    borderRadius: '6px',
    overflow: 'auto',
    maxWidth: '400px',
    color: '#999',
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    color: '#999',
    fontSize: '1rem',
  },
};