import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface DashboardStats {
  activeAssistants: number;
  totalConversations: number;
  activeUsers: number;
  averagePerformance: number;
  newAssistantsThisWeek: number;
  conversationsLast30Days: number;
  currentlyOnline: number;
}

export const useDashboardStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async (): Promise<DashboardStats> => {
      if (!user?.id) throw new Error('User must be authenticated');
      
      // Get bot stats
      const { data: bots, error: botsError } = await supabase
        .from('bots')
        .select('status, conversations, performance, created_at')
        .eq('user_id', user.id);
      
      if (botsError) throw botsError;

      // Get conversation stats
      const { data: conversations, error: conversationsError } = await supabase
        .from('external_conversations')
        .select(`
          status,
          created_at,
          last_message_at,
          bots!inner(user_id)
        `)
        .eq('bots.user_id', user.id);
      
      if (conversationsError) throw conversationsError;

      // Calculate dates
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Calculate stats
      const activeAssistants = bots.filter(bot => bot.status === 'active').length;
      const totalConversations = conversations.length;
      
      // For "active users", we'll count unique conversations with recent activity
      const activeUsers = conversations.filter(conv => 
        conv.status === 'active' && 
        conv.last_message_at && 
        new Date(conv.last_message_at) >= oneHourAgo
      ).length;

      // Calculate average performance
      const performanceValues = bots
        .filter(bot => bot.performance !== null && bot.performance !== undefined)
        .map(bot => bot.performance as number);
      
      const averagePerformance = performanceValues.length > 0 
        ? performanceValues.reduce((sum, perf) => sum + perf, 0) / performanceValues.length 
        : 0;

      // New assistants this week
      const newAssistantsThisWeek = bots.filter(bot => 
        bot.created_at && new Date(bot.created_at) >= sevenDaysAgo
      ).length;

      // Conversations in last 30 days
      const conversationsLast30Days = conversations.filter(conv =>
        conv.created_at && new Date(conv.created_at) >= thirtyDaysAgo
      ).length;

      // Currently online (conversations with activity in last hour)
      const currentlyOnline = conversations.filter(conv =>
        conv.last_message_at && new Date(conv.last_message_at) >= oneHourAgo
      ).length;

      return {
        activeAssistants,
        totalConversations,
        activeUsers,
        averagePerformance,
        newAssistantsThisWeek,
        conversationsLast30Days,
        currentlyOnline
      };
    },
    enabled: !!user?.id
  });
};