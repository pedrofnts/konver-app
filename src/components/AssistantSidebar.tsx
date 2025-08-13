import { 
  MessageSquare, 
  Settings, 
  Database, 
  Target, 
  Bot,
  Zap,
  Copy,
  Download,
  TrendingUp
} from "lucide-react";

interface AssistantSidebarProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  assistant?: {
    name: string;
    conversations: number;
    performance: number;
    status?: string;
  };
}

const navigationItems = [
  {
    id: 'test',
    label: 'Test Chat',
    icon: Zap
  },
  {
    id: 'conversations',
    label: 'Conversations',
    icon: MessageSquare
  },
  {
    id: 'settings',
    label: 'Configuration',
    icon: Settings
  },
  {
    id: 'knowledge',
    label: 'Knowledge Base',
    icon: Database
  },
  {
    id: 'feedback',
    label: 'Training & Feedback',
    icon: Target
  }
];

const quickActions = [
  {
    id: 'analytics',
    label: 'View Analytics',
    icon: TrendingUp
  },
  {
    id: 'clone',
    label: 'Clone Assistant',
    icon: Copy
  },
  {
    id: 'export',
    label: 'Export Data',
    icon: Download
  }
];

export default function AssistantSidebar({ 
  activeTab, 
  onTabChange, 
  assistant 
}: AssistantSidebarProps) {
  return (
    <div className="w-80 xl:w-96 konver-assistant-sidebar p-6 space-y-6 md:static fixed left-0 top-16 bottom-0 z-50 overflow-y-auto">
      {/* Container 1: Assistant Overview */}
      {assistant && (
        <div className="konver-glass-card rounded-xl p-5" 
             style={{
               background: 'linear-gradient(135deg, hsla(var(--card), 0.95) 0%, hsla(var(--surface-elevation-1), 0.9) 100%)',
               border: '1px solid hsl(var(--border)/0.3)',
               boxShadow: 'var(--shadow-md)'
             }}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-background animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate text-foreground">{assistant.name}</h3>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary/60" />
                  <span className="text-sm text-muted-foreground">{assistant.conversations} conversations</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-green-600 font-medium">{assistant.performance}% performance</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Container 2: Navigation Items */}
      <div className="konver-glass-card rounded-xl p-5"
           style={{
             background: 'linear-gradient(135deg, hsla(var(--card), 0.95) 0%, hsla(var(--surface-elevation-1), 0.9) 100%)',
             border: '1px solid hsl(var(--border)/0.3)',
             boxShadow: 'var(--shadow-md)'
           }}>
        <nav className="space-y-2">
          {navigationItems.map(item => {
            const Icon = item.icon;
            return (
              <button 
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full h-11 flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === item.id 
                    ? 'bg-gradient-to-r from-primary/15 to-primary/10 text-primary border border-primary/20 shadow-sm transform hover:scale-[1.02]' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:transform hover:scale-[1.02] hover:shadow-sm'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Container 3: Quick Actions */}
      <div className="konver-glass-card rounded-xl p-5"
           style={{
             background: 'linear-gradient(135deg, hsla(var(--card), 0.95) 0%, hsla(var(--surface-elevation-1), 0.9) 100%)',
             border: '1px solid hsl(var(--border)/0.3)',
             boxShadow: 'var(--shadow-md)'
           }}>
        <div className="space-y-2">
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <button 
                key={action.id}
                className="w-full h-11 flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 hover:transform hover:scale-[1.02] hover:shadow-sm"
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}