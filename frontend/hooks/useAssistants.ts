// hooks/useAssistants.ts
import { useState, useEffect } from 'react';
import { integrationsAPI } from '../lib/api/integrations';

export function useAssistants() {
  const [assistants, setAssistants] = useState<Array<{
    id: string;
    name: string;
    description: string;
    trained: boolean;
    trainingData: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssistants = async () => {
      try {
        const data = await integrationsAPI.getAssistants();
        setAssistants(data);
      } catch (error) {
        console.error('Error fetching assistants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssistants();
  }, []);

  return { assistants, loading };
}