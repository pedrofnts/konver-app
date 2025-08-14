import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bot, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "./useAuth";

export const useBots = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bots', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User must be authenticated');
      
      const { data, error } = await supabase
        .from('bots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Bot[];
    },
    enabled: !!user?.id
  });
};

export const useBot = (botId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bot', botId],
    queryFn: async () => {
      if (!user?.id) throw new Error('User must be authenticated');
      
      const { data, error } = await supabase
        .from('bots')
        .select('*')
        .eq('id', botId)
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data as Bot;
    },
    enabled: !!user?.id && !!botId
  });
};

export const useCreateBot = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (botData: Omit<TablesInsert<'bots'>, 'user_id'>) => {
      if (!user?.id) throw new Error('User must be authenticated');
      
      const { data, error } = await supabase
        .from('bots')
        .insert({
          ...botData,
          user_id: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Bot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots', user?.id] });
    }
  });
};

export const useUpdateBot = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ botId, updates }: { botId: string; updates: TablesUpdate<'bots'> }) => {
      if (!user?.id) throw new Error('User must be authenticated');
      
      const { data, error } = await supabase
        .from('bots')
        .update(updates)
        .eq('id', botId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Bot;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bots', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['bot', data.id] });
    }
  });
};

export const useDeleteBot = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (botId: string) => {
      if (!user?.id) throw new Error('User must be authenticated');
      
      const { error } = await supabase
        .from('bots')
        .delete()
        .eq('id', botId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots', user?.id] });
    }
  });
};

export const useBotStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bot-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User must be authenticated');
      
      const { data, error } = await supabase
        .from('bots')
        .select('status, conversations, performance')
        .eq('user_id', user.id);
      
      if (error) throw error;

      const stats = {
        total: data.length,
        active: data.filter(bot => bot.status === 'active').length,
        inactive: data.filter(bot => bot.status === 'inactive').length,
        archived: data.filter(bot => bot.status === 'archived').length,
        totalConversations: data.reduce((sum, bot) => sum + (bot.conversations || 0), 0),
        averagePerformance: data.length > 0 
          ? data.reduce((sum, bot) => sum + (bot.performance || 0), 0) / data.length 
          : 0
      };

      return stats;
    },
    enabled: !!user?.id
  });
};