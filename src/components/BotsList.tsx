import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bot, 
  Settings, 
  MessageSquare, 
  MoreVertical, 
  Power, 
  Pause, 
  Plus, 
  Activity, 
  TrendingUp, 
  Eye, 
  Play, 
  Calendar 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import KonverCard from "@/components/KonverCard";

type BotData = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  conversations: number;
  performance: number;
  created_at: string;
};

interface BotsListProps {
  searchQuery?: string;
}

export default function BotsList({ searchQuery = '' }: BotsListProps) {
  const [bots, setBots] = useState<BotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchBots();
    }
  }, [user]);

  const fetchBots = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('bots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBots(data || []);
    } catch (error) {
      console.error('Error fetching bots:', error);
      toast({
        title: "Error",
        description: "Failed to fetch assistants",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleBotStatus = async (botId: string, currentStatus: string) => {
    setUpdatingStatus(botId);
    
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from('bots')
        .update({ status: newStatus })
        .eq('id', botId);

      if (error) throw error;

      setBots(prev => prev.map(bot => 
        bot.id === botId ? { ...bot, status: newStatus } : bot
      ));

      toast({
        title: "Success",
        description: `Assistant ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error updating bot status:', error);
      toast({
        title: "Error",
        description: "Failed to update assistant status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredBots = bots.filter(bot =>
    bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bot.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <KonverCard key={i}>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-5 w-3/4" />
              </div>
              <Skeleton className="h-4 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-12" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
            </div>
          </KonverCard>
        ))}
      </div>
    );
  }

  if (filteredBots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary shadow-lg mb-6">
          <Bot className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-2xl font-semibold mb-3 text-foreground">
          {searchQuery ? 'No assistants found' : 'Ready to create your first assistant?'}
        </h3>
        <p className="text-base text-muted-foreground/90 mb-8 max-w-md leading-relaxed">
          {searchQuery 
            ? `No assistants match "${searchQuery}". Try a different search term or create a new assistant.`
            : 'Transform your workflow with intelligent AI assistants. Create powerful conversational experiences in minutes.'
          }
        </p>
        <div className="flex gap-3">
          {!searchQuery && (
            <Button 
              onClick={() => navigate('/assistant/new')}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Assistant
            </Button>
          )}
          {searchQuery && (
            <Button 
              onClick={() => navigate('/assistant/new')}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Assistant
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {filteredBots.map((bot, index) => (
        <KonverCard
          key={bot.id}
          title={bot.name}
          description={bot.description || "No description provided"}
          status={bot.status}
          hover
          onClick={() => navigate(`/assistant/${bot.id}`)}
          className="group"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="space-y-5">
            {/* Enhanced Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 group/stat">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-primary/10 group-hover/stat:bg-primary/20 transition-colors">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Conversations</span>
                </div>
                <p className="text-xl font-bold text-foreground transition-all duration-300">
                  {bot.conversations.toLocaleString()}
                </p>
              </div>
              
              <div className="space-y-2 group/stat">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-accent/10 group-hover/stat:bg-accent/20 transition-colors">
                    <TrendingUp className="h-4 w-4 text-accent" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Performance</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-foreground transition-all duration-300">
                    {bot.performance}%
                  </p>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    bot.performance >= 95 ? "bg-green-500 animate-pulse" :
                    bot.performance >= 80 ? "bg-yellow-500" : "bg-red-500"
                  )}></div>
                </div>
              </div>
            </div>

            {/* Enhanced Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-muted/30">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  Created {new Date(bot.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/assistant/${bot.id}?tab=test`);
                  }}
                  className="h-8 w-8 p-0 hover:bg-accent/10"
                >
                  <Play className="h-4 w-4 text-muted-foreground group-hover/play:text-accent transition-colors" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                      className="h-8 w-8 p-0 hover:bg-accent/10"
                    >
                      <MoreVertical className="h-4 w-4 text-muted-foreground group-hover/menu:text-primary transition-colors" />
                    </Button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent align="end" className="bg-card border border-border shadow-lg">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/assistant/${bot.id}?tab=settings`);
                      }}
                      className="hover:bg-accent/10 cursor-pointer"
                    >
                      <Settings className="mr-3 h-4 w-4 text-primary" />
                      <span className="font-medium">Settings</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/assistant/${bot.id}?tab=conversations`);
                      }}
                      className="hover:bg-accent/10 cursor-pointer"
                    >
                      <Eye className="mr-3 h-4 w-4 text-accent" />
                      <span className="font-medium">View Conversations</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBotStatus(bot.id, bot.status);
                      }}
                      disabled={updatingStatus === bot.id}
                      className="hover:bg-accent/10 cursor-pointer"
                    >
                      {bot.status === 'active' ? (
                        <>
                          <Pause className="mr-3 h-4 w-4 text-warning" />
                          <span className="font-medium">Deactivate</span>
                        </>
                      ) : (
                        <>
                          <Power className="mr-3 h-4 w-4 text-success" />
                          <span className="font-medium">Activate</span>
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </KonverCard>
      ))}
    </div>
  );
}