//useTokens
import useSWR from 'swr';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface TokenBalance {
  total_tokens: string;
  used_tokens: string;
  plan?: string;
}

const fetcher = async (url: string) => {
  const token = localStorage.getItem('auth_token');
  
  console.log('🔍 Token exists:', !!token);
  
  const res = await fetch(`${API_URL}${url}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
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
  const { data, error, mutate } = useSWR('/api/tokens', fetcher, { 
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