'use client';

import { useState } from 'react';
import AdminGuard from '@/components/AdminGuard';
import { Search, User, Shield, Coins, Calendar, CreditCard, AlertCircle, Check, X, Loader } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  fullName?: string;
  plan: string;
  tokensUsed: number;
  tokensLimit: number;
  createdAt: string;
}

interface SubscriptionData {
  id: string;
  planId: string;
  status: string;
  startedAt: string;
  expiresAt: string;
  autoRenew: boolean;
  paymentMethodId?: string;
  cancelledAt?: string;
}

export default function AdminPage() {
  const [searchEmail, setSearchEmail] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zuuma.ru/api';

  const searchUser = async () => {
    if (!searchEmail) {
      setError('Введите email пользователя');
      return;
    }

    setLoading(true);
    setError('');
    setUserData(null);
    setSubscriptionData(null);

    try {
      // Получаем данные пользователя
      const userRes = await fetch(`${API_BASE_URL}/admin/users/search?email=${encodeURIComponent(searchEmail)}`, {
        credentials: 'include',
      });

      if (!userRes.ok) {
        if (userRes.status === 404) {
          setError('Пользователь не найден');
          return;
        }
        throw new Error('Ошибка поиска пользователя');
      }

      const user = await userRes.json();
      setUserData(user);

      // Получаем данные подписки
      const subRes = await fetch(`${API_BASE_URL}/admin/users/${user.id}/subscription`, {
        credentials: 'include',
      });

      if (subRes.ok) {
        const subscription = await subRes.json();
        setSubscriptionData(subscription);
      }
    } catch (err: any) {
      console.error('Ошибка поиска:', err);
      setError(err.message || 'Ошибка при поиске пользователя');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!userData || !subscriptionData) return;

    if (!confirm(`Вы действительно хотите отменить подписку для ${userData.email}?\n\nПодписка останется активной до конца периода.`)) {
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/subscriptions/${subscriptionData.id}/cancel`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Ошибка отмены подписки');
      }

      const data = await res.json();
      alert(`✅ ${data.message}`);
      
      // Обновляем данные
      await searchUser();
    } catch (err: any) {
      console.error('Ошибка:', err);
      alert('Ошибка при отмене подписки: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRefund = async () => {
    if (!userData || !subscriptionData) return;

    const tokensUsed = userData.tokensUsed || 0;
    
    const confirmMessage = tokensUsed > 0
      ? `⚠️ ВНИМАНИЕ: Пользователь использовал ${tokensUsed.toLocaleString()} токенов!\n\nВы все равно хотите сделать возврат для ${userData.email}?`
      : `Вы действительно хотите сделать возврат средств для ${userData.email}?\n\nПлан будет понижен до Free.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/subscriptions/${subscriptionData.id}/refund`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Ошибка возврата');
      }

      const data = await res.json();
      alert(`✅ ${data.message}`);
      
      // Обновляем данные
      await searchUser();
    } catch (err: any) {
      console.error('Ошибка:', err);
      alert('Ошибка при возврате: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AdminGuard>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>
            <Shield size={32} style={{ marginRight: 12 }} />
            Панель администратора
          </h1>
        </div>

        {/* Поиск пользователя */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Поиск пользователя</h2>
          
          <div style={styles.searchContainer}>
            <input
              type="email"
              placeholder="Введите email пользователя"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchUser()}
              style={styles.searchInput}
            />
            <button 
              onClick={searchUser}
              disabled={loading}
              style={styles.searchButton}
            >
              {loading ? <Loader size={20} className="spin" /> : <Search size={20} />}
              Найти
            </button>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={20} />
              {error}
            </div>
          )}
        </div>

        {/* Информация о пользователе */}
        {userData && (
          <>
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Информация о пользователе</h2>
              
              <div style={styles.userInfoGrid}>
                <div style={styles.infoCard}>
                  <User size={24} style={styles.infoIcon} />
                  <div>
                    <div style={styles.infoLabel}>Email</div>
                    <div style={styles.infoValue}>{userData.email}</div>
                  </div>
                </div>

                <div style={styles.infoCard}>
                  <User size={24} style={styles.infoIcon} />
                  <div>
                    <div style={styles.infoLabel}>Полное имя</div>
                    <div style={styles.infoValue}>{userData.fullName || '—'}</div>
                  </div>
                </div>

                <div style={styles.infoCard}>
                  <Shield size={24} style={styles.infoIcon} />
                  <div>
                    <div style={styles.infoLabel}>Тарифный план</div>
                    <div style={styles.infoValue}>{userData.plan?.toUpperCase() || 'FREE'}</div>
                  </div>
                </div>

                <div style={styles.infoCard}>
                  <Coins size={24} style={styles.infoIcon} />
                  <div>
                    <div style={styles.infoLabel}>Токены</div>
                    <div style={styles.infoValue}>
                      {userData.tokensUsed?.toLocaleString() || 0} / {userData.tokensLimit?.toLocaleString() || 0}
                    </div>
                    <div style={styles.progressBar}>
                      <div 
                        style={{
                          ...styles.progressFill,
                          width: `${Math.min((userData.tokensUsed / userData.tokensLimit) * 100, 100)}%`,
                          backgroundColor: (userData.tokensUsed / userData.tokensLimit) > 0.8 ? '#ff6b6b' : '#4CAF50'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={styles.infoCard}>
                  <Calendar size={24} style={styles.infoIcon} />
                  <div>
                    <div style={styles.infoLabel}>Дата регистрации</div>
                    <div style={styles.infoValue}>
                      {new Date(userData.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Информация о подписке */}
            {subscriptionData && (
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Подписка</h2>
                
                <div style={styles.subscriptionInfo}>
                  <div style={styles.subscriptionRow}>
                    <span style={styles.subscriptionLabel}>Статус:</span>
                    <span style={{
                      ...styles.subscriptionValue,
                      color: subscriptionData.status === 'active' ? '#4CAF50' : '#ff6b6b'
                    }}>
                      {subscriptionData.status === 'active' ? '✅ Активна' : '❌ Неактивна'}
                    </span>
                  </div>

                  <div style={styles.subscriptionRow}>
                    <span style={styles.subscriptionLabel}>Дата начала:</span>
                    <span style={styles.subscriptionValue}>
                      {new Date(subscriptionData.startedAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>

                  <div style={styles.subscriptionRow}>
                    <span style={styles.subscriptionLabel}>Действует до:</span>
                    <span style={styles.subscriptionValue}>
                      {new Date(subscriptionData.expiresAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>

                  <div style={styles.subscriptionRow}>
                    <span style={styles.subscriptionLabel}>Автопродление:</span>
                    <span style={styles.subscriptionValue}>
                      {subscriptionData.autoRenew ? '✅ Включено' : '❌ Отключено'}
                    </span>
                  </div>

                  {subscriptionData.cancelledAt && (
                    <div style={styles.subscriptionRow}>
                      <span style={styles.subscriptionLabel}>Отменена:</span>
                      <span style={styles.subscriptionValue}>
                        {new Date(subscriptionData.cancelledAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Действия с подпиской */}
                <div style={styles.actionsContainer}>
                  {subscriptionData.status === 'active' && !subscriptionData.cancelledAt && (
                    <button
                      onClick={handleCancelSubscription}
                      disabled={processing}
                      style={styles.cancelButton}
                    >
                      {processing ? <Loader size={16} className="spin" /> : <X size={16} />}
                      Отменить подписку
                    </button>
                  )}

                  {subscriptionData.status === 'active' && (
                    <button
                      onClick={handleRefund}
                      disabled={processing}
                      style={styles.refundButton}
                    >
                      {processing ? <Loader size={16} className="spin" /> : <CreditCard size={16} />}
                      Сделать возврат
                    </button>
                  )}
                </div>

                {userData.tokensUsed > 0 && (
                  <div style={styles.warningBox}>
                    <AlertCircle size={20} />
                    <div>
                      <strong>⚠️ Внимание!</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: 14 }}>
                        Пользователь использовал {userData.tokensUsed.toLocaleString()} токенов. 
                        Возврат средств может быть не оправдан.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
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
    display: 'flex',
    alignItems: 'center',
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#E0E0E0',
  },
  section: {
    background: '#1a1a1a',
    padding: '2rem',
    borderRadius: '12px',
    marginBottom: '2rem',
    border: '1px solid #333',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    marginBottom: '1.5rem',
    color: '#E0E0E0',
  },
  searchContainer: {
    display: 'flex',
    gap: '1rem',
  },
  searchInput: {
    flex: 1,
    padding: '1rem',
    background: '#2a2a2a',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#E0E0E0',
    fontSize: '1rem',
  },
  searchButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem 2rem',
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '1rem',
    padding: '1rem',
    background: '#2a1a1a',
    border: '1px solid #ff6b6b',
    borderRadius: '8px',
    color: '#ff6b6b',
  },
  warningBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    marginTop: '1rem',
    padding: '1rem',
    background: '#2a2a1a',
    border: '1px solid #ffa500',
    borderRadius: '8px',
    color: '#ffa500',
  },
  userInfoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1rem',
  },
  infoCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.5rem',
    background: '#2a2a2a',
    borderRadius: '12px',
    border: '1px solid #333',
  },
  infoIcon: {
    color: '#4CAF50',
    flexShrink: 0,
  },
  infoLabel: {
    color: '#999',
    fontSize: '0.875rem',
    marginBottom: '0.25rem',
  },
  infoValue: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#E0E0E0',
  },
  progressBar: {
    width: '100%',
    height: '6px',
    background: '#333',
    borderRadius: '3px',
    marginTop: '0.5rem',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s',
  },
  subscriptionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  subscriptionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '1rem',
    background: '#2a2a2a',
    borderRadius: '8px',
  },
  subscriptionLabel: {
    color: '#999',
    fontSize: '1rem',
  },
  subscriptionValue: {
    color: '#E0E0E0',
    fontSize: '1rem',
    fontWeight: '500',
  },
  actionsContainer: {
    display: 'flex',
    gap: '1rem',
    marginTop: '2rem',
  },
  cancelButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem 2rem',
    background: '#ff6b6b',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
  },
  refundButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem 2rem',
    background: '#ffa500',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
  },
};