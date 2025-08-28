import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { 
  Flow, 
  FlowAction, 
  CreateFlowData, 
  UpdateFlowData, 
  CreateFlowActionData 
} from "@/types/assistant";

// Hook para listar flows de um bot específico
export const useFlows = (botId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['flows', botId, user?.id],
    queryFn: async () => {
      if (!user?.id || !botId) throw new Error('User and botId must be provided');
      
      const { data, error } = await supabase
        .from('flows')
        .select(`
          *,
          flow_actions (
            id,
            action_type,
            sequence_order,
            config,
            created_at
          )
        `)
        .eq('bot_id', botId)
        .eq('user_id', user.id)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to match our Flow interface with actions
      const flows = data?.map(flow => ({
        ...flow,
        actions: flow.flow_actions?.sort((a, b) => a.sequence_order - b.sequence_order)
      })) as Flow[];
      
      return flows;
    },
    enabled: !!user?.id && !!botId
  });
};

// Hook para obter um flow específico
export const useFlow = (flowId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['flow', flowId],
    queryFn: async () => {
      if (!user?.id || !flowId) throw new Error('User and flowId must be provided');
      
      const { data, error } = await supabase
        .from('flows')
        .select(`
          *,
          flow_actions (
            id,
            action_type,
            sequence_order,
            config,
            created_at
          )
        `)
        .eq('id', flowId)
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      
      // Transform data with sorted actions
      const flow = {
        ...data,
        actions: data.flow_actions?.sort((a, b) => a.sequence_order - b.sequence_order)
      } as Flow;
      
      return flow;
    },
    enabled: !!user?.id && !!flowId
  });
};

// Hook para criar um novo flow
export const useCreateFlow = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (flowData: CreateFlowData) => {
      if (!user?.id) throw new Error('User must be authenticated');
      
      const { data, error } = await supabase
        .from('flows')
        .insert({
          ...flowData,
          user_id: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Flow;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['flows', data.bot_id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['flow', data.id] });
    }
  });
};

// Hook para atualizar um flow
export const useUpdateFlow = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ flowId, updates }: { flowId: string; updates: UpdateFlowData }) => {
      if (!user?.id) throw new Error('User must be authenticated');
      
      const { data, error } = await supabase
        .from('flows')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', flowId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Flow;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['flows', data.bot_id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['flow', data.id] });
    }
  });
};

// Hook para deletar um flow
export const useDeleteFlow = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (flowId: string) => {
      if (!user?.id) throw new Error('User must be authenticated');
      
      const { error } = await supabase
        .from('flows')
        .delete()
        .eq('id', flowId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: (_, flowId) => {
      // Invalidate all flow queries - we need to be broader here since we don't have botId
      queryClient.invalidateQueries({ queryKey: ['flows'] });
      queryClient.invalidateQueries({ queryKey: ['flow', flowId] });
    }
  });
};

// Hook para toggle do status ativo/inativo
export const useToggleFlowStatus = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ flowId, isActive }: { flowId: string; isActive: boolean }) => {
      if (!user?.id) throw new Error('User must be authenticated');
      
      const { data, error } = await supabase
        .from('flows')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', flowId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Flow;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['flows', data.bot_id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['flow', data.id] });
    }
  });
};

// Hook para criar uma ação de fluxo
export const useCreateFlowAction = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (actionData: CreateFlowActionData) => {
      if (!user?.id) throw new Error('User must be authenticated');
      
      const { data, error } = await supabase
        .from('flow_actions')
        .insert(actionData)
        .select()
        .single();
      
      if (error) throw error;
      return data as FlowAction;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['flow', data.flow_id] });
      // Invalidate flows list query - need to be broad since we don't have botId in the action
      queryClient.invalidateQueries({ queryKey: ['flows'] });
    }
  });
};

// Hook para atualizar uma ação de fluxo
export const useUpdateFlowAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ actionId, updates }: { actionId: string; updates: Partial<FlowAction> }) => {
      const { data, error } = await supabase
        .from('flow_actions')
        .update(updates)
        .eq('id', actionId)
        .select()
        .single();
      
      if (error) throw error;
      return data as FlowAction;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['flow', data.flow_id] });
      queryClient.invalidateQueries({ queryKey: ['flows'] });
    }
  });
};

// Hook para deletar uma ação de fluxo
export const useDeleteFlowAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (actionId: string) => {
      const { error } = await supabase
        .from('flow_actions')
        .delete()
        .eq('id', actionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all related queries - broad invalidation since we don't have specific IDs
      queryClient.invalidateQueries({ queryKey: ['flows'] });
      queryClient.invalidateQueries({ queryKey: ['flow'] });
    }
  });
};

// Hook para reordenar ações de um fluxo
export const useReorderFlowActions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ flowId, actions }: { flowId: string; actions: { id: string; sequence_order: number }[] }) => {
      const updates = actions.map(action => 
        supabase
          .from('flow_actions')
          .update({ sequence_order: action.sequence_order })
          .eq('id', action.id)
      );
      
      const results = await Promise.all(updates);
      
      // Check if any update failed
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw errors[0].error;
      }
      
      return flowId;
    },
    onSuccess: (flowId) => {
      queryClient.invalidateQueries({ queryKey: ['flow', flowId] });
      queryClient.invalidateQueries({ queryKey: ['flows'] });
    }
  });
};