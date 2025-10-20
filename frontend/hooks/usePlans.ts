import useSWR from 'swr';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://zuuma.ru/api";

// Запасные тарифы на случай, если API не работает
const FALLBACK_PLANS = [
  {
    id: 'free',
    slug: 'free',
    title: 'Free',
    monthly_tokens: '100000',
    tokens_per_chat: 5000,
    price_cents: '0',
  },
  {
    id: 'pro',
    slug: 'pro',
    title: 'Pro',
    monthly_tokens: '1500000',
    tokens_per_chat: 10000,
    price_cents: '149900',
  },
  {
    id: 'max',
    slug: 'max',
    title: 'Max',
    monthly_tokens: '5000000',
    tokens_per_chat: 20000,
    price_cents: '499000',
  },
];

const fetcher = async (url: string) => {
  console.log('🔍 Fetching plans from:', `${API_BASE_URL}${url}`);
  
  const token = localStorage.getItem('auth_token');
  
  try {
    const res = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Response status:', res.status);
    
    if (!res.ok) {
      console.warn('⚠️ Plans API failed, using fallback');
      return FALLBACK_PLANS;
    }
    
    const data = await res.json();
    
    // Если API вернул пустой массив, используем fallback
    if (!data || (Array.isArray(data) && data.length === 0)) {
      console.warn('⚠️ Empty plans from API, using fallback');
      return FALLBACK_PLANS;
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching plans:', error);
    return FALLBACK_PLANS;
  }
};

export function usePlans() {
  // ✅ ИСПРАВЛЕНО: убрали /api/ из пути
  const { data, error, mutate } = useSWR('/tokens/plans', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  
  return { 
    plans: data || FALLBACK_PLANS,
    loading: !data && !error, 
    error, 
    mutate 
  };
}

export async function changePlan(planSlug: string) {
  const token = localStorage.getItem('auth_token');
  // ✅ ИСПРАВЛЕНО: убрали /api/ из пути
  const res = await fetch(`${API_BASE_URL}/tokens/change-plan`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ planSlug })
  });
  
  if (!res.ok) throw new Error('Failed to change plan');
  return res.json();
}