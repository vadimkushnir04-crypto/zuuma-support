'use client';

import AdminGuard from '@/components/AdminGuard';
import { AlertCircle, ExternalLink } from 'lucide-react';

export default function AuditLogsPage() {
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

        {/* Информационное сообщение */}
        <div style={styles.infoCard}>
          <AlertCircle size={48} style={{ color: '#4CAF50', marginBottom: '1rem' }} />
          
          <h2 style={styles.infoTitle}>
            Логи доступны через Grafana + Loki
          </h2>
          
          <p style={styles.infoText}>
            Для просмотра логов и аналитики используйте:
          </p>

          <div style={styles.linksContainer}>
            <a 
              href="https://grafana.zuuma.ru" 
              target="_blank" 
              rel="noopener noreferrer"
              style={styles.linkButton}
            >
              <ExternalLink size={20} />
              Открыть Grafana
            </a>

            <a 
              href="https://umami.zuuma.ru" 
              target="_blank" 
              rel="noopener noreferrer"
              style={styles.linkButtonSecondary}
            >
              <ExternalLink size={20} />
              Открыть Umami Analytics
            </a>
          </div>

          <div style={styles.featuresGrid}>
            <div style={styles.featureCard}>
              <h3 style={styles.featureTitle}>📊 Grafana</h3>
              <ul style={styles.featureList}>
                <li>Логи приложения (Loki)</li>
                <li>Метрики производительности</li>
                <li>Мониторинг ошибок</li>
                <li>Алерты и уведомления</li>
              </ul>
            </div>

            <div style={styles.featureCard}>
              <h3 style={styles.featureTitle}>📈 Umami</h3>
              <ul style={styles.featureList}>
                <li>Статистика посещений</li>
                <li>Поведение пользователей</li>
                <li>Конверсии</li>
                <li>География пользователей</li>
              </ul>
            </div>
          </div>

          <div style={styles.noteBox}>
            <p style={styles.noteText}>
              💡 <strong>Примечание:</strong> Для реализации встроенного просмотра логов 
              на этой странице требуется создание эндпоинтов <code>/api/audit-logs</code> на бэкенде.
              Однако, Grafana + Loki предоставляют более мощный функционал для анализа логов.
            </p>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
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
  infoCard: {
    background: '#1a1a1a',
    border: '2px solid #4CAF50',
    borderRadius: '16px',
    padding: '3rem',
    textAlign: 'center' as const,
  },
  infoTitle: {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    color: '#E0E0E0',
    marginBottom: '1rem',
  },
  infoText: {
    fontSize: '1.1rem',
    color: '#999',
    marginBottom: '2rem',
  },
  linksContainer: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginBottom: '3rem',
    flexWrap: 'wrap' as const,
  },
  linkButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem 2rem',
    background: '#4CAF50',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'background 0.2s',
    cursor: 'pointer',
  },
  linkButtonSecondary: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem 2rem',
    background: '#2a2a2a',
    color: 'white',
    textDecoration: 'none',
    border: '1px solid #4CAF50',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'background 0.2s',
    cursor: 'pointer',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
    marginTop: '2rem',
    textAlign: 'left' as const,
  },
  featureCard: {
    background: '#2a2a2a',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid #333',
  },
  featureTitle: {
    fontSize: '1.25rem',
    marginBottom: '1rem',
    color: '#E0E0E0',
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    color: '#999',
  },
  noteBox: {
    background: '#2a2a1a',
    border: '1px solid #4a4a2a',
    borderRadius: '8px',
    padding: '1.5rem',
    marginTop: '2rem',
    textAlign: 'left' as const,
  },
  noteText: {
    color: '#ccc',
    fontSize: '0.9rem',
    margin: 0,
    lineHeight: 1.6,
  },
};