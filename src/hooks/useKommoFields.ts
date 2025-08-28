import { useQuery } from '@tanstack/react-query';
import { useIntegrations } from '@/hooks/useIntegrations';
import { KommoFieldsResponse, KommoCustomField } from '@/types/assistant';
import { KommoConfig } from '@/integrations/supabase/types';

interface UseKommoFieldsReturn {
  fields: KommoCustomField[];
  filteredFields: KommoCustomField[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useKommoFields(botId: string): UseKommoFieldsReturn {
  const { integrations } = useIntegrations(botId);
  
  // Get Kommo integration config
  const kommoIntegration = integrations.find(i => i.provider === 'kommo' && i.enabled);
  const kommoConfig = kommoIntegration?.config as KommoConfig | undefined;
  
  const { data: fieldsData, isLoading, error, refetch } = useQuery<{ fields: KommoCustomField[] }>({
    queryKey: ['kommo-fields', kommoConfig?.url, kommoConfig?.token],
    queryFn: async () => {
      if (!kommoConfig?.url || !kommoConfig?.token) {
        throw new Error('Kommo integration not configured');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kommo-custom-fields`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          url: kommoConfig.url,
          token: kommoConfig.token
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch Kommo fields');
      }

      return { fields: result.data.fields };
    },
    enabled: Boolean(kommoConfig?.url && kommoConfig?.token),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Extract fields from response (already filtered by the edge function)
  const fields = fieldsData?.fields || [];
  const filteredFields = fields; // Fields are already filtered by the edge function

  return {
    fields,
    filteredFields,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

// Helper function to get field options for select fields
export function getKommoFieldOptions(field: KommoCustomField): Array<{ value: string; label: string }> {
  if (field.type !== 'select' || !field.enums) {
    return [];
  }

  return field.enums
    .sort((a, b) => a.sort - b.sort)
    .map(enumItem => ({
      value: enumItem.id.toString(),
      label: enumItem.value,
    }));
}

// Helper function to format field type for display
export function formatKommoFieldType(type: KommoCustomField['type']): string {
  const typeMap: Record<KommoCustomField['type'], string> = {
    text: 'Texto',
    select: 'Seleção',
    date: 'Data',
    date_time: 'Data e Hora',
    tracking_data: 'Dados de Rastreamento',
    file: 'Arquivo',
    checkbox: 'Checkbox',
    numeric: 'Numérico',
  };

  return typeMap[type] || type;
}