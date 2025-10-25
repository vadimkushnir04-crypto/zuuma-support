// frontend/hooks/useTokens.ts
import useSWR from 'swr';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://zuuma.ru/api";

interface TokenBalance {
  total_tokens: string;
  used_tokens: string;
  plan?: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    credentials: 'include',  // ✅ Добавьте: отправляет куки
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  console.log('📡 Response status:', res.status);
  
  if (!res.ok) {
    const error = await res.text();
    console.error('❌ Fetch error:', error);
    throw new Error('Failed to fetch');
  }
  return res.json();
};

export function useTokens() {
  const { data, error, mutate } = useSWR('/tokens', fetcher, { 
    refreshInterval: 15000,
    revalidateOnFocus: false
  });
  
  return { 
    balance: data?.balance as TokenBalance | undefined,
    loading: !data && !error, 
    error, 
    mutate 
  };
}