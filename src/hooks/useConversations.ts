import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  ExternalConversation, 
  ConversationMessage, 
  ConversationWithMessages,
  TablesInsert, 
  TablesUpdate 
} from "@/integrations/supabase/types";
import { useAuth } from "./useAuth";

export const useConversations = (botId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversations', user?.id, botId],
    queryFn: async () => {
      if (!user?.id) throw new Error('User must be authenticated');
      
      let query = supabase
        .from('external_conversations')
        .select(`
          *,
          bots!inner(
            id,
            name,
            user_id
          )
        `)
        .eq('bots.user_id', user.id)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (botId) {
        query = query.eq('bot_id', botId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as ExternalConversation[];
    },
    enabled: !!user?.id
  });
};

export const useConversation = (conversationId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (!user?.id) throw new Error('User must be authenticated');
      
      const { data, error } = await supabase
        .from('external_conversations')
        .select(`
          *,
          bots!inner(
            id,
            name,
            user_id
          )
        `)
        .eq('id', conversationId)
        .eq('bots.user_id', user.id)
        .single();
      
      if (error) throw error;
      return data as ExternalConversation;
    },
    enabled: !!user?.id && !!conversationId
  });
};

export const useConversationWithMessages = (conversationId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversation-with-messages', conversationId],
    queryFn: async () => {
      if (!user?.id) throw new Error('User must be authenticated');
      
      // Get conversation with bot info
      const { data: conversation, error: convError } = await supabase
        .from('external_conversations')
        .select(`
          *,
          bots!inner(
            id,
            name,
            user_id
          )
        `)
        .eq('id', conversationId)
        .eq('bots.user_id', user.id)
        .single();
      
      if (convError) throw convError;

      // Get messages for this conversation
      const { data: messages, error: msgError } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (msgError) throw msgError;

      const result: ConversationWithMessages = {
        ...conversation,
        messages: messages as ConversationMessage[]
      };

      return result;
    },
    enabled: !!user?.id && !!conversationId
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (conversationData: Omit<TablesInsert<'external_conversations'>, 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('User must be authenticated');
      
      const { data, error } = await supabase
        .from('external_conversations')
        .insert(conversationData)
        .select()
        .single();
      
      if (error) throw error;
      return data as ExternalConversation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id, data.bot_id] });
    }
  });
};

export const useCreateMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageData: Omit<TablesInsert<'conversation_messages'>, 'created_at'>) => {
      const { data, error } = await supabase
        .from('conversation_messages')
        .insert(messageData)
        .select()
        .single();
      
      if (error) throw error;
      return data as ConversationMessage;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversation-with-messages', data.conversation_id] });
      
      // Update last_message_at in conversation
      supabase
        .from('external_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', data.conversation_id)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          queryClient.invalidateQueries({ queryKey: ['conversation', data.conversation_id] });
        });
    }
  });
};

export const useUpdateConversation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ conversationId, updates }: { 
      conversationId: string; 
      updates: TablesUpdate<'external_conversations'> 
    }) => {
      if (!user?.id) throw new Error('User must be authenticated');
      
      const { data, error } = await supabase
        .from('external_conversations')
        .update(updates)
        .eq('id', conversationId)
        .select(`
          *,
          bots!inner(
            id,
            name,
            user_id
          )
        `)
        .eq('bots.user_id', user.id)
        .single();
      
      if (error) throw error;
      return data as ExternalConversation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', data.id] });
    }
  });
};

export const useConversationStats = (botId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversation-stats', user?.id, botId],
    queryFn: async () => {
      if (!user?.id) throw new Error('User must be authenticated');
      
      let query = supabase
        .from('external_conversations')
        .select(`
          status,
          created_at,
          bots!inner(user_id)
        `)
        .eq('bots.user_id', user.id);

      if (botId) {
        query = query.eq('bot_id', botId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const stats = {
        total: data.length,
        active: data.filter(conv => conv.status === 'active').length,
        archived: data.filter(conv => conv.status === 'archived').length,
        blocked: data.filter(conv => conv.status === 'blocked').length,
        last7Days: data.filter(conv => 
          new Date(conv.created_at!) >= sevenDaysAgo
        ).length,
        last30Days: data.filter(conv => 
          new Date(conv.created_at!) >= thirtyDaysAgo
        ).length,
      };

      return stats;
    },
    enabled: !!user?.id
  });
};