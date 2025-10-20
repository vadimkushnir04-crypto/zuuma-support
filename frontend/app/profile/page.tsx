"use client";
//app/profile/page.tsx
import { useEffect, useState } from "react";
import { User, Save, LogOut, Shield, Coins, Bot, Calendar, Crown, Check, Loader, CreditCard, AlertCircle } from "lucide-react";
import { usePlans } from "../../hooks/usePlans";
import { useTokens } from "../../hooks/useTokens";

interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  plan?: string;
  tokensUsed?: number;
  tokensLimit?: number;
  assistantsLimit?: number;
  createdAt?: string;
}

interface Plan {
  id: string;
  slug: string;
  title: string;
  monthly_tokens: string;
  tokens_per_chat: number;
  price_cents: string;
}

interface Subscription {
  id: string;
  planId: string;
  status: string;
  startedAt: string;
  expiresAt: string;
  canRefund: boolean;
  refundDeadline: string;
}

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'billing'>('profile');

  const { plans, loading: plansLoading } = usePlans();
  const { balance, mutate: mutateBalance } = useTokens();
  
 const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zuuma.ru/api';

  useEffect(() => {
    loadUserProfile();
    loadSubscription();
  }, []);

  // Проверяем success параметр при возврате с оплаты
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_success') === 'true') {
      // ✅ Проверяем что план действительно изменился
      const checkPaymentSuccess = async () => {
        await loadUserProfile();
        await loadSubscription();
        
        // Даем время на обработку webhook (1 секунда)
        setTimeout(async () => {
          await loadUserProfile();
          
          // Проверяем что пользователь не на Free плане
          const token = localStorage.getItem("auth_token");
          const res = await fetch(`${API_BASE_URL}/auth/profile`, {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data.user.plan && data.user.plan !== 'free') {
              alert('✅ Оплата прошла успешно! Ваша подписка активирована.');
            }
          }
          
          // Очищаем параметр
          window.history.replaceState({}, '', '/profile');
        }, 1000);
      };
      
      checkPaymentSuccess();
    }
  }, []);

  const loadUserProfile = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      window.location.href = "/";
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUserProfile(data.user);
        setFullName(data.user.fullName || "");
      } else {
        localStorage.removeItem("auth_token");
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Ошибка загрузки профиля:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubscription = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/payments/subscription`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error("Ошибка загрузки подписки:", error);
    }
  };

  const handlePurchasePlan = async (planSlug: string) => {
    if (planSlug === 'free') {
      alert('Это бесплатный план');
      return;
    }

    const plan = plans?.find((p: Plan) => p.slug === planSlug);
    if (!plan) return;

    const confirmMessage = `Вы собираетесь оплатить план "${plan.title}"\n\n` +
      `Токенов в месяц: ${parseInt(plan.monthly_tokens).toLocaleString()}\n` +
      `Стоимость: ${(parseInt(plan.price_cents) / 100).toLocaleString('ru-RU')} ₽\n\n` +
      `✅ Возврат возможен в течение 7 дней\n\n` +
      `Продолжить?`;

    if (!confirm(confirmMessage)) return;

    setProcessingPayment(true);

    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE_URL}/payments/create`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planSlug }),
      });

      if (res.ok) {
        const data = await res.json();
        
        if (data.confirmationUrl) {
          // Перенаправляем на страницу оплаты ЮКасса
          window.location.href = data.confirmationUrl;
        } else {
          alert('Ошибка: не получен URL для оплаты');
        }
      } else {
        const error = await res.json();
        alert('Ошибка при создании платежа: ' + (error.message || 'Неизвестная ошибка'));
      }
    } catch (error) {
      console.error('Ошибка при оплате:', error);
      alert('Ошибка при оплате. Попробуйте позже.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    const now = new Date();
    const refundDeadline = new Date(subscription.refundDeadline);
    // ✅ НОВАЯ ПРОВЕРКА: canRefund только если токены НЕ использованы
    const canRefund = subscription.canRefund && now <= refundDeadline && tokensUsed === 0;

    const message = canRefund
      ? 'Вы действительно хотите отменить подписку?\n\nВы сможете запросить возврат средств на следующем шаге.'
      : tokensUsed > 0
        ? `Вы действительно хотите отменить подписку?\n\nВозврат средств недоступен, так как вы использовали ${tokensUsed.toLocaleString()} токенов.\nТокены останутся активными до конца периода.`
        : 'Вы действительно хотите отменить подписку?\n\nВозврат средств недоступен, но токены останутся до конца периода.';

    if (!confirm(message)) return;

    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE_URL}/payments/subscription/${subscription.id}/cancel`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        
        if (data.canRefund) {
          if (confirm('Хотите запросить возврат средств сейчас?')) {
            await handleRefundSubscription();
          }
        }
        
        await loadSubscription();
      }
    } catch (error) {
      console.error('Ошибка при отмене подписки:', error);
      alert('Ошибка при отмене подписки');
    }
  };

  const handleRefundSubscription = async () => {
    if (!subscription) return;

    if (!confirm('Вы действительно хотите запросить возврат средств?\n\nВаш план будет понижен до Free.')) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE_URL}/payments/subscription/${subscription.id}/refund`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        alert(`✅ ${data.message}`);
        await loadUserProfile();
        await loadSubscription();
        await mutateBalance();
      } else {
        const error = await res.json();
        alert('Ошибка: ' + (error.message || 'Не удалось выполнить возврат'));
      }
    } catch (error) {
      console.error('Ошибка при возврате:', error);
      alert('Ошибка при возврате средств');
    }
  };

  const handleSave = async () => {
    if (!userProfile) return;
    
    setSaving(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullName }),
      });

      if (res.ok) {
        const data = await res.json();
        setUserProfile(data.user);
        alert("Профиль обновлен!");
      } else {
        alert("Ошибка при обновлении профиля");
      }
    } catch (error) {
      alert("Ошибка при обновлении профиля");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    window.location.href = "/";
  };

  // Преобразуем планы для отображения
  const pricingPlans = plans?.map((plan: Plan) => {
    let features: string[] = [];

    if (plan.slug === 'free') {
      features = [
        `${parseInt(plan.monthly_tokens).toLocaleString()} токенов в месяц`,
        `До ${plan.tokens_per_chat} токенов на чат`,
        '',
        '1 ассистент',
        'Интеграция в веб-виджет'
      ];
    } else if (plan.slug === 'pro') {
      features = [
        `${parseInt(plan.monthly_tokens).toLocaleString()} токенов в месяц`,
        `До ${plan.tokens_per_chat} токенов на чат`,
        'Всё, что в Free, плюс:',
        'До 10 ассистентов',
        'API доступ',
        'Telegram Bot',
        'Расширенная аналитика'
      ];
    } else if (plan.slug === 'max') {
      features = [
        `${parseInt(plan.monthly_tokens).toLocaleString()} токенов в месяц`,
        `До ${plan.tokens_per_chat} токенов на чат`,
        'Всё, что в Pro, плюс:',
        'До 50 ассистентов',
        'Приоритетная поддержка 24/7',
        'Кастомизация',
        'Персональный менеджер'
      ];
    }

    return {
      id: plan.slug,
      name: plan.title,
      price: plan.price_cents === '0' ? '0 ₽' : `${(parseInt(plan.price_cents) / 100).toLocaleString('ru-RU')} ₽`,
      period: plan.price_cents === '0' ? '' : '/месяц',
      popular: plan.slug === 'pro',
      features
    };
  }) || [];

  if (loading || plansLoading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader size={40} className="spin" />
        <p style={styles.loadingText}>Загрузка профиля...</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div style={styles.errorContainer}>
        <p style={styles.errorText}>Ошибка загрузки профиля</p>
        <button onClick={() => window.location.href = "/"} style={styles.backButton}>
          Вернуться на главную
        </button>
      </div>
    );
  }

  const tokensUsed = parseInt(String(userProfile.tokensUsed || 0));
  const tokensLimit = parseInt(String(userProfile.tokensLimit || 0));
  const tokensUsedPercent = Math.min(Math.round((tokensUsed / tokensLimit) * 100), 100);
  
  const assistantsLimit = 
    userProfile?.plan === 'free' ? 1 :
    userProfile?.plan === 'pro' ? 10 :
    userProfile?.plan === 'max' ? 50 : 1;

  const isCurrent = (planSlug: string) => planSlug === (userProfile.plan || 'free');

  return (
    <div style={styles.container}>
      {processingPayment && (
        <div style={styles.processingOverlay}>
          <Loader size={60} className="spin" />
          <p style={{ marginTop: 20, fontSize: 18 }}>Перенаправление на страницу оплаты...</p>
        </div>
      )}

      <div style={styles.header}>
        <h1 style={styles.title}>
          {userProfile.avatarUrl ? (
            <img 
              src={userProfile.avatarUrl} 
              alt="Avatar" 
              style={{ 
                width: 32, 
                height: 32, 
                borderRadius: '50%', 
                marginRight: 12,
                objectFit: 'cover'
              }} 
            />
          ) : (
            <User size={32} style={{ marginRight: 12 }} />
          )}
          Профиль пользователя
        </h1>
        <button onClick={handleLogout} style={styles.logoutButton}>
          <LogOut size={16} />
          Выйти
        </button>
      </div>

      <div style={styles.tabs}>
        <button 
          onClick={() => setActiveTab('profile')}
          style={{
            ...styles.tab,
            ...(activeTab === 'profile' ? styles.activeTab : {})
          }}
        >
          Профиль
        </button>
        <button 
          onClick={() => setActiveTab('billing')}
          style={{
            ...styles.tab,
            ...(activeTab === 'billing' ? styles.activeTab : {})
          }}
        >
          Тарифы и биллинг
        </button>
      </div>

      <div style={styles.content}>
        {activeTab === 'profile' && (
          <>
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Основная информация</h2>
              
              {userProfile.avatarUrl && (
                <div style={styles.field}>
                  <label style={styles.label}>Фото профиля</label>
                  <div style={styles.avatarContainer}>
                    <img 
                      src={userProfile.avatarUrl} 
                      alt="Avatar" 
                      style={styles.avatar}
                    />
                    <span style={styles.avatarText}>Загружено из Google</span>
                  </div>
                </div>
              )}
              
              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  value={userProfile.email}
                  disabled
                  style={styles.inputDisabled}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Полное имя</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Введите ваше имя"
                  style={styles.input}
                />
              </div>

              <button 
                onClick={handleSave} 
                disabled={saving}
                style={styles.saveButton}
              >
                <Save size={16} />
                {saving ? "Сохранение..." : "Сохранить изменения"}
              </button>
            </div>

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Статистика использования</h2>
              
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <Shield size={24} style={styles.statIcon} />
                  <div>
                    <div style={styles.statLabel}>Тарифный план</div>
                    <div style={styles.statValue}>
                      {plans?.find((p: Plan) => p.slug === userProfile.plan)?.title || 'Free'}
                    </div>
                  </div>
                </div>

                <div style={styles.statCard}>
                  <Coins size={24} style={styles.statIcon} />
                  <div>
                    <div style={styles.statLabel}>Токены</div>
                    <div style={styles.statValue}>
                      {tokensUsed.toLocaleString()} / {tokensLimit.toLocaleString()}
                    </div>
                    <div style={styles.progressBar}>
                      <div 
                        style={{
                          ...styles.progressFill,
                          width: `${tokensUsedPercent}%`,
                          backgroundColor: tokensUsedPercent > 80 ? '#ff6b6b' : 'var(--accent)'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div style={styles.statCard}>
                  <Bot size={24} style={styles.statIcon} />
                  <div>
                    <div style={styles.statLabel}>Лимит ассистентов</div>
                    <div style={styles.statValue}>{assistantsLimit}</div>
                  </div>
                </div>

                <div style={styles.statCard}>
                  <Calendar size={24} style={styles.statIcon} />
                  <div>
                    <div style={styles.statLabel}>Дата регистрации</div>
                    <div style={styles.statValue}>
                      {userProfile.createdAt 
                        ? new Date(userProfile.createdAt).toLocaleDateString('ru-RU')
                        : 'Недоступно'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'billing' && (
          <>
            {/* Блок текущей подписки */}
            {subscription && subscription.status === 'active' && (
              <div style={styles.subscriptionAlert}>
                <AlertCircle size={20} />
                <div style={{ flex: 1 }}>
                  <strong>Активная подписка</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: 14, opacity: 0.8 }}>
                    Действует до {new Date(subscription.expiresAt).toLocaleDateString('ru-RU')}
                  </p>
                    {subscription.canRefund && new Date() <= new Date(subscription.refundDeadline) && (
                      <p style={{ margin: '4px 0 0 0', fontSize: 14, color: tokensUsed > 0 ? '#ff6b6b' : '#de8434' }}>
                        {tokensUsed > 0 ? (
                          <>
                            ❌ Возврат недоступен: использовано {tokensUsed.toLocaleString()} токенов
                          </>
                        ) : (
                          <>
                            ✅ Возврат доступен до {new Date(subscription.refundDeadline).toLocaleDateString('ru-RU')}
                          </>
                        )}
                      </p>
                    )}
                </div>
                <div>
                  <button
                    onClick={handleCancelSubscription}
                    style={styles.cancelButton}
                  >
                    Отменить подписку
                  </button>
                </div>
              </div>
            )}

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Тарифные планы</h2>
              <p style={styles.sectionDescription}>
                Выберите тариф, который лучше всего подходит для ваших потребностей.<br/>
                ✅ Возврат возможен в течение 7 дней после оплаты и если токены не были использованы
              </p>
              
              <div style={styles.pricingGrid}>
                {pricingPlans.map((plan: any) => {
                  const isCurrentPlan = isCurrent(plan.id);
                  
                  // Определяем текст кнопки
                  let buttonText = 'Выбрать план';
                  let buttonIcon = <CreditCard size={16} />;
                  
                  if (isCurrentPlan) {
                    buttonText = 'Текущий план';
                    buttonIcon = <Check size={16} />;
                  } else if (plan.id === 'free') {
                    buttonText = 'Перейти на план';
                    buttonIcon = <></>;  // ✅ Пустой фрагмент вместо null
                  } else {
                    buttonText = 'Оплатить';
                    buttonIcon = <CreditCard size={16} />;
                  }
                  
                  return (
                    <div 
                      key={plan.id} 
                      style={{
                        ...styles.pricingCard,
                        ...(plan.popular ? styles.popularCard : {}),
                        ...(isCurrentPlan ? styles.currentCard : {})
                      }}
                    >
                      <div style={{ minHeight: '40px', marginBottom: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {plan.popular && !isCurrentPlan && (
                          <div style={styles.pricingBadge}>
                            <Crown size={16} />
                            Рекомендуем
                          </div>
                        )}
                        {isCurrentPlan && (
                          <div style={styles.currentBadge}>
                            <Check size={16} />
                            Текущий план
                          </div>
                        )}
                      </div>
                      
                      <h3 style={styles.pricingName}>{plan.name}</h3>
                      <div style={styles.pricingPrice}>{plan.price}</div>
                      <div style={styles.pricingPeriod}>{plan.period}</div>
                      
                      <ul style={styles.pricingFeatures}>
                        {plan.features.map((feature: string, index: number) => {
                          if (feature === '') {
                            return <li key={index} style={{ height: '40px' }}></li>;
                          }
                          
                          if (feature.startsWith('Всё, что в')) {
                            return (
                              <li key={index} style={{ ...styles.pricingFeature, listStyle: 'none' }}>
                                <span style={styles.featureDivider}>{feature}</span>
                              </li>
                            );
                          }
                          
                          return (
                            <li key={index} style={styles.pricingFeature}>
                              <Check size={16} style={styles.checkIcon} />
                              {feature}
                            </li>
                          );
                        })}
                      </ul>
                      
                      <button 
                        onClick={() => handlePurchasePlan(plan.id)}
                        disabled={isCurrentPlan || processingPayment}
                        style={{
                          ...styles.pricingButton,
                          ...(isCurrentPlan ? styles.currentPlanButton : {}),
                          ...(plan.popular && !isCurrentPlan ? styles.popularButton : {}),
                          ...(processingPayment ? { opacity: 0.5, cursor: 'not-allowed' } : {})
                        }}
                      >
                        {buttonIcon}
                        {buttonText}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    padding: '40px 20px',
    maxWidth: 1200,
    margin: '0 auto',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    opacity: 0.7,
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
  },
  errorText: {
    fontSize: 18,
    color: '#ff6b6b',
    marginBottom: 20,
  },
  backButton: {
    padding: '10px 20px',
    background: 'var(--accent)',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    color: 'white',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    flexWrap: 'wrap' as const,
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 20px',
    background: 'transparent',
    border: '2px solid var(--border)',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    transition: 'all 0.2s',
  },
  tabs: {
    display: 'flex',
    gap: 8,
    marginBottom: 32,
    borderBottom: '2px solid var(--border)',
  },
  tab: {
    padding: '12px 24px',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontSize: 16,
    transition: 'all 0.2s',
    marginBottom: -2,
  },
  activeTab: {
    borderBottomColor: 'var(--accent)',
    fontWeight: 600,
  },
  content: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 32,
  },
  section: {
    background: 'var(--card-bg)',
    padding: 32,
    borderRadius: 12,
    border: '1px solid var(--border)',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: 24,
  },
  sectionDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 24,
    lineHeight: 1.6,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    display: 'block',
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 8,
    opacity: 0.9,
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    background: 'var(--input-bg)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 14,
  },
  inputDisabled: {
    width: '100%',
    padding: '12px 16px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 14,
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  avatarContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    objectFit: 'cover' as const,
  },
  avatarText: {
    fontSize: 14,
    opacity: 0.7,
  },
  saveButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 24px',
    background: 'var(--accent)',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: 20,
  },
  statCard: {
    display: 'flex',
    gap: 16,
    padding: 20,
    background: 'var(--bg-secondary)',
    borderRadius: 8,
    border: '1px solid var(--border)',
  },
  statIcon: {
    color: 'var(--accent)',
    flexShrink: 0,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 600,
  },
  progressBar: {
    width: '100%',
    height: 6,
    background: 'var(--border)',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  subscriptionAlert: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
    padding: 20,
    background: 'var(--card-bg)',
    border: '2px solid var(--accent)',
    borderRadius: 12,
    marginBottom: 24,
  },
  cancelButton: {
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid #ff6b6b',
    borderRadius: 6,
    cursor: 'pointer',
    color: '#ff6b6b',
    fontSize: 14,
    transition: 'all 0.2s',
  },
  pricingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 24,
  },
  pricingCard: {
    padding: 32,
    background: 'var(--bg-secondary)',
    border: '2px solid var(--border)',
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column' as const,
  },
  popularCard: {
    borderColor: 'var(--accent)',
    boxShadow: '0 0 20px rgba(88, 101, 242, 0.3)',
  },
  currentCard: {
    borderColor: '#de8434',
    background: 'rgba(76, 175, 80, 0.05)',
  },
  pricingBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    background: 'var(--accent)',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    color: 'white',
  },
  currentBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    background: '#de8434',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    color: 'white',
  },
  pricingName: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  pricingPrice: {
    fontSize: 48,
    fontWeight: 700,
    textAlign: 'center' as const,
    color: 'var(--accent)',
  },
  pricingPeriod: {
    fontSize: 14,
    textAlign: 'center' as const,
    opacity: 0.7,
    marginBottom: 24,
    minHeight: 21,
  },
  pricingFeatures: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 24px 0',
    flex: 1,
  },
  pricingFeature: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '8px 0',
    fontSize: 14,
  },
  checkIcon: {
    color: 'var(--accent)',
    flexShrink: 0,
    marginTop: 2,
  },
  featureDivider: {
    display: 'block',
    fontWeight: 600,
    marginTop: 8,
    marginBottom: 4,
    fontSize: 13,
    opacity: 0.8,
  },
  pricingButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '14px 24px',
    background: 'var(--bg-secondary)',
    border: '2px solid var(--border)',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 600,
    transition: 'all 0.2s',
  },
  popularButton: {
    background: 'var(--accent)',
    borderColor: 'var(--accent)',
    color: 'white',
  },
  currentPlanButton: {
    background: 'transparent',
    borderColor: '#de8434',
    color: '#de8434',
    cursor: 'not-allowed',
    opacity: 0.7,
  },
  processingOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    color: 'white',
  },
};