import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Integration, IntegrationInsert, IntegrationUpdate, KommoConfig, WhatsAppConfig } from '@/integrations/supabase/types';

export interface IntegrationUIData {
  id: string;
  name: string;
  platform: 'whatsapp' | 'kommo';
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  description: string;
  icon: React.ReactNode;
  color: 'primary' | 'accent' | 'success' | 'warning' | 'destructive';
  config?: Record<string, unknown>;
}

export function useIntegrations(botId?: string) {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchIntegrations = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id);

      // If botId is provided, filter by bot_id
      if (botId) {
        query = query.eq('bot_id', botId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createOrUpdateIntegration = async (provider: string, config: KommoConfig | WhatsAppConfig, enabled = false, targetBotId?: string) => {
    if (!user?.id) throw new Error('User not authenticated');
    if (!targetBotId && !botId) throw new Error('Bot ID is required for integration');

    const effectiveBotId = targetBotId || botId;

    try {
      const { data: existingIntegration } = await supabase
        .from('integrations')
        .select('*')
        .eq('bot_id', effectiveBotId)
        .eq('provider', provider)
        .single();

      if (existingIntegration) {
        // Update existing integration
        const { data, error } = await supabase
          .from('integrations')
          .update({
            config: config as any,
            enabled,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingIntegration.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new integration
        const { data, error } = await supabase
          .from('integrations')
          .insert({
            user_id: user.id,
            bot_id: effectiveBotId,
            provider,
            config: config as any,
            enabled
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error creating/updating integration:', error);
      throw error;
    }
  };

  const deleteIntegration = async (id: string) => {
    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchIntegrations(); // Refresh the list
    } catch (error) {
      console.error('Error deleting integration:', error);
      throw error;
    }
  };

  const toggleIntegration = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('integrations')
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await fetchIntegrations(); // Refresh the list
    } catch (error) {
      console.error('Error toggling integration:', error);
      throw error;
    }
  };

  const getIntegrationByProvider = (provider: string): Integration | null => {
    return integrations.find(integration => integration.provider === provider) || null;
  };

  useEffect(() => {
    if (user?.id) {
      fetchIntegrations();
    }
  }, [user?.id, botId]);

  return {
    integrations,
    isLoading,
    fetchIntegrations,
    createOrUpdateIntegration,
    deleteIntegration,
    toggleIntegration,
    getIntegrationByProvider,
    refetch: fetchIntegrations
  };
}