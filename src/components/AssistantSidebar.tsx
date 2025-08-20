import { 
  MessageSquare, 
  Settings, 
  Database, 
  Target, 
  Bot,
  Zap,
  Copy,
  Download,
  TrendingUp,
  MoreHorizontal,
  Plug,
  Building2
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
  isNewBot?: boolean;
}

const navigationItems = [
  {
    id: 'test',
    label: 'Chat',
    icon: Zap
  },
  {
    id: 'conversations',
    label: 'Conversas',
    icon: MessageSquare
  },
  {
    id: 'settings',
    label: 'Configuração',
    icon: Settings
  },
  {
    id: 'company',
    label: 'Empresa',
    icon: Building2
  },
  {
    id: 'integrations',
    label: 'Integrações',
    icon: Plug
  },
  {
    id: 'knowledge',
    label: 'Base de Conhecimento',
    icon: Database
  },
  {
    id: 'feedback',
    label: 'Treinamento e Feedback',
    icon: Target
  }
];

const quickActions = [
  {
    id: 'analytics',
    label: 'Ver Análises',
    icon: TrendingUp
  },
  {
    id: 'clone',
    label: 'Clonar Assistente',
    icon: Copy
  },
  {
    id: 'export',
    label: 'Exportar Dados',
    icon: Download
  }
];

export default function AssistantSidebar({ 
  activeTab, 
  onTabChange, 
  assistant,
  isNewBot = false 
}: AssistantSidebarProps) {
  
  // Filter navigation items based on whether it's a new bot
  const availableNavItems = navigationItems.filter(item => {
    if (isNewBot) {
      // Only show settings and company tabs for new bots
      return item.id === 'settings' || item.id === 'company';
    }
    return true;
  });
  return (
    <div className="w-72 konver-assistant-sidebar p-4 space-y-4 md:static fixed left-0 top-14 bottom-0 z-50 overflow-y-auto">
      {/* Assistant Overview - Compact Version */}
      {assistant && (
        <div className="konver-glass-card rounded-lg p-4 transition-all duration-300 hover:shadow-lg" 
             style={{
               background: 'linear-gradient(135deg, hsla(var(--card), 0.98) 0%, hsla(var(--surface-elevation-1), 0.95) 100%)',
               border: '1px solid hsl(var(--border)/0.2)',
               boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.05)',
               backdropFilter: 'blur(12px) saturate(120%)'
             }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border border-background" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate text-foreground">{assistant.name}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-muted-foreground">{assistant.conversations} chats</span>
                <span className="text-xs text-green-600 font-medium">{assistant.performance}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation - More Compact Design */}
      <div className="konver-glass-card rounded-lg p-3 transition-all duration-300"
           style={{
             background: 'linear-gradient(135deg, hsla(var(--card), 0.98) 0%, hsla(var(--surface-elevation-1), 0.95) 100%)',
             border: '1px solid hsl(var(--border)/0.2)',
             boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.05)',
             backdropFilter: 'blur(12px) saturate(120%)'
           }}>
        <nav className="space-y-1">
          {availableNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button 
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`konver-assistant-nav-btn w-full h-9 flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-all duration-200 transform hover:scale-[1.02] ${
                  isActive 
                    ? 'active text-primary' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Quick Actions - Horizontal Layout for Compactness */}
      <div className="konver-glass-card rounded-lg p-3 transition-all duration-300"
           style={{
             background: 'linear-gradient(135deg, hsla(var(--card), 0.98) 0%, hsla(var(--surface-elevation-1), 0.95) 100%)',
             border: '1px solid hsl(var(--border)/0.2)',
             boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.05)',
             backdropFilter: 'blur(12px) saturate(120%)'
           }}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ações Rápidas</span>
          <MoreHorizontal className="w-4 h-4 text-muted-foreground/60" />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <button 
                key={action.id}
                className="group flex flex-col items-center gap-1 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-all duration-200 transform hover:scale-105"
                title={action.label}
              >
                <Icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-150" />
                <span className="text-xs font-medium leading-none">{action.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}