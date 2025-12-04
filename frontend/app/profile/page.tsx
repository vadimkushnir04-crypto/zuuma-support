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
  price_cents: string;
}

interface TokenPackage {
  id: string;
  planId: string;
  status: string;
  startedAt: string;
  expiresAt: string;
  tokensUsed: number;
  tokensLimit: number;
  tokensRemaining: number;
}

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [tokenPackage, setTokenPackage] = useState<TokenPackage | null>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'billing'>('profile');
  
  // Кастомная покупка
  const [customPacks, setCustomPacks] = useState(1);
  const customTokens = customPacks * 100000;
  const customPrice = customPacks * 99;

  const { plans, loading: plansLoading } = usePlans();
  const { balance, mutate: mutateBalance } = useTokens();
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zuuma.ru/api';

  useEffect(() => {
    loadUserProfile();
    loadTokenPackage();
  }, []);

  // Проверяем success параметр при возврате с оплаты
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_success') === 'true') {
      const checkPaymentSuccess = async () => {
        await loadUserProfile();
        await loadTokenPackage();
        
        setTimeout(async () => {
          await loadUserProfile();
          
          const res = await fetch(`${API_BASE_URL}/auth/profile`, {
            credentials: 'include',
            headers: {
              "Content-Type": "application/json",
            },
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data.user.tokens_limit > 100000) {
              alert('✅ Оплата прошла успешно! Токены зачислены на ваш аккаунт.');
            }
          }
          
          window.history.replaceState({}, '', '/profile');
        }, 1000);
      };
      
      checkPaymentSuccess();
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUserProfile(data.user);
        setFullName(data.user.fullName || "");
      } else {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Ошибка загрузки профиля:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTokenPackage = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/subscription`, {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setTokenPackage(data.subscription);
      }
    } catch (error) {
      console.error("Ошибка загрузки пакета токенов:", error);
    }
  };

  const handlePurchasePlan = async (planSlug: string) => {
    if (planSlug === 'free') {
      alert('Это бесплатный стартовый план');
      return;
    }

    const plan = plans?.find((p: Plan) => p.slug === planSlug);
    if (!plan) return;

    const confirmMessage = `Вы собираетесь купить пакет "${plan.title}"\n\n` +
      `Токенов: ${parseInt(plan.monthly_tokens).toLocaleString()}\n` +
      `Срок действия: 30 дней\n` +
      `Стоимость: ${(parseInt(plan.price_cents) / 100).toLocaleString('ru-RU')} ₽\n\n` +
      `Продолжить?`;

    if (!confirm(confirmMessage)) return;

    setProcessingPayment(true);

    try {
      const res = await fetch(`${API_BASE_URL}/payments/create`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planSlug }),
      });

      if (res.ok) {
        const data = await res.json();
        
        if (data.confirmationUrl) {
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

  const handleCustomPurchase = async () => {
    if (customPacks < 1) {
      alert('Минимальная покупка: 1 пакет (100 000 токенов)');
      return;
    }

    const confirmMessage = `Вы собираетесь купить кастомный пакет\n\n` +
      `Токенов: ${customTokens.toLocaleString()}\n` +
      `Срок действия: 30 дней\n` +
      `Стоимость: ${customPrice.toLocaleString('ru-RU')} ₽\n\n` +
      `Продолжить?`;

    if (!confirm(confirmMessage)) return;

    setProcessingPayment(true);

    try {
      const res = await fetch(`${API_BASE_URL}/payments/create`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          planSlug: 'custom',
          customTokens: customTokens 
        }),
      });

      if (res.ok) {
        const data = await res.json();
        
        if (data.confirmationUrl) {
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

  const handleSave = async () => {
    if (!userProfile) return;
    
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        credentials: 'include',
        headers: {
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
    window.location.href = "/";
  };

  // Преобразуем планы для отображения
  const pricingPlans = plans?.map((plan: Plan) => {
    let features: string[] = [];

    if (plan.slug === 'free') {
      features = [
        `${parseInt(plan.monthly_tokens).toLocaleString()} токенов стартовый баланс`,
        '1 ассистент',
        'Интеграция в веб-виджет',
        'Интеграция в Telegram Bot',
      ];
    } else if (plan.slug === 'basic') {
      features = [
        `${parseInt(plan.monthly_tokens).toLocaleString()} токенов на 30 дней`,
        'До 10 ассистентов',
      ];
    } else if (plan.slug === 'business') {
      features = [
        `${parseInt(plan.monthly_tokens).toLocaleString()} токенов на 30 дней`,
        'До 50 ассистентов',
        'Скидка ~10% за объём',
      ];
    } else if (plan.slug === 'enterprise') {
      features = [
        `${parseInt(plan.monthly_tokens).toLocaleString()} токенов на 30 дней`,
        'До 100 ассистентов',
        'Скидка ~20% за объём',
      ];
    }

    return {
      id: plan.slug,
      name: plan.title,
      price: plan.price_cents === '0' ? 'Бесплатно' : `${(parseInt(plan.price_cents) / 100).toLocaleString('ru-RU')} ₽`,
      period: plan.price_cents === '0' ? '' : 'разовая покупка',
      popular: plan.slug === 'business',
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
  
  const assistantsLimit = userProfile?.assistantsLimit || 1;

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
          Покупка токенов
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
                    {tokenPackage && (
                      <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>
                        Действует до {new Date(tokenPackage.expiresAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    )}
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
            {tokenPackage && tokenPackage.status === 'active' && (
              <div style={styles.tokenPackageAlert}>
                <AlertCircle size={20} />
                <div style={{ flex: 1 }}>
                  <strong>✅ Активный пакет токенов</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: 14, opacity: 0.8 }}>
                    Действует до {new Date(tokenPackage.expiresAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: 13, opacity: 0.6 }}>
                    После истечения срока токены сгорят. Вы сможете купить новый пакет в любой момент.
                  </p>
                </div>
              </div>
            )}

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Готовые пакеты токенов</h2>
        <p style={styles.sectionDescription}>
          Выберите пакет, который лучше всего подходит для ваших потребностей. Токены действуют 30 дней.
        </p>

        <div style={styles.pricingGrid}>
          {pricingPlans
            .filter((p: any) => p.id !== 'free' && p.id !== 'custom')
            .map((plan: any) => (
              <div
                key={plan.id}
                style={{
                  ...styles.pricingCard,
                  ...(plan.popular ? styles.popularCard : {})
                }}
              >
                {/* Бейдж “Рекомендуем” */}
                <div
                  style={{
                    minHeight: '40px',
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  {plan.popular && (
                    <div style={styles.pricingBadge}>
                      <Crown size={16} />
                      Рекомендуем
                    </div>
                  )}
                </div>

                {/* Название, цена, период */}
                <h3 style={styles.pricingName}>{plan.name}</h3>
                <div style={styles.pricingPrice}>{plan.price}</div>
                <div style={styles.pricingPeriod}>{plan.period}</div>

                {/* Фичи */}
                <ul style={styles.pricingFeatures}>
                  {plan.features.map((feature: string, index: number) => (
                    <li key={index} style={styles.pricingFeature}>
                      <Check size={16} style={styles.checkIcon} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Кнопка покупки */}
                <button
                  onClick={() => handlePurchasePlan(plan.id)}
                  disabled={processingPayment}
                  style={{
                    ...styles.pricingButton,
                    ...(plan.popular ? styles.popularButton : {}),
                    ...(processingPayment ? { opacity: 0.5, cursor: 'not-allowed' } : {})
                  }}
                >
                  <CreditCard size={16} />
                  Купить пакет
                </button>
              </div>
            ))}
        </div>
      </div>


            {/* Кастомная покупка */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>💎 Кастомная покупка</h2>
              <p style={styles.sectionDescription}>
                Купите нужное количество токенов. Цена: 99 ₽ за 100 000 токенов. Минимум: 1 пакет.
              </p>
              
              <div style={styles.customPurchaseControls}>
                <div style={styles.customInputGroup}>
                  <label style={styles.customLabel}>Количество пакетов по 100k:</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={customPacks}
                    onChange={(e) => setCustomPacks(Math.max(1, parseInt(e.target.value) || 1))}
                    style={styles.customInput}
                  />
                </div>
                
                <div style={styles.customCalculation}>
                  <div style={styles.customCalcItem}>
                    <span style={styles.customCalcLabel}>Токенов:</span>
                    <strong style={styles.customCalcValue}>{customTokens.toLocaleString()}</strong>
                  </div>
                  <div style={styles.customCalcItem}>
                    <span style={styles.customCalcLabel}>Сумма:</span>
                    <strong style={styles.customCalcValue}>{customPrice} ₽</strong>
                  </div>
                </div>
                
                <button
                  onClick={handleCustomPurchase}
                  disabled={customPacks < 1 || processingPayment}
                  style={{
                    ...styles.customPurchaseButton,
                    ...(processingPayment || customPacks < 1 ? { opacity: 0.5, cursor: 'not-allowed' } : {})
                  }}
                >
                  <CreditCard size={16} />
                  Купить токены
                </button>
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
    padding: '40px 20px',
    margin: '0px 15px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
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
  tokenPackageAlert: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
    padding: 20,
    background: 'var(--card-bg)',
    border: '2px solid var(--accent)',
    borderRadius: 12,
    marginBottom: 24,
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
  customPurchaseControls: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
  },
  customInputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  customLabel: {
    fontSize: 14,
    fontWeight: 500,
    opacity: 0.9,
  },
  customInput: {
    padding: '12px 16px',
    background: 'var(--input-bg)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 16,
    maxWidth: 300,
    color: 'var(--fg-default)', // ✅ Белый цвет текста
  },
  customCalculation: {
    display: 'flex',
    gap: 40,
    padding: 20,
    background: 'var(--bg-secondary)',
    borderRadius: 8,
    border: '1px solid var(--border)',
  },
  customCalcItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  customCalcLabel: {
    fontSize: 13,
    opacity: 0.7,
  },
  customCalcValue: {
    fontSize: 24,
    fontWeight: 600,
    color: 'var(--accent)',
  },
  customPurchaseButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '14px 24px',
    background: 'var(--accent)',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 600,
    transition: 'all 0.2s',
    maxWidth: 300,
  },
}