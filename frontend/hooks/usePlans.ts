import useSWR from 'swr';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const fetcher = async (url: string) => {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`${API_URL}${url}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export function usePlans() {
  const { data, error, mutate } = useSWR('/api/tokens/plans', fetcher);
  
  return { 
    plans: data,
    loading: !data && !error, 
    error, 
    mutate 
  };
}

export async function changePlan(planSlug: string) {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`${API_URL}/api/tokens/change-plan`, {
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