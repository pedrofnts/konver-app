import React, { memo } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Settings,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  platform: 'whatsapp' | 'kommo';
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  description: string;
  icon: React.ReactNode;
  color: 'primary' | 'accent' | 'success' | 'warning' | 'destructive';
  config?: Record<string, unknown>;
}

interface IntegrationCardProps {
  integration: Integration;
  onConfigure: (integration: Integration) => void;
  loading?: boolean;
}

const StatusIcon = memo<{ status: Integration['status'] }>(({ status }) => {
  switch (status) {
    case 'connected':
      return <CheckCircle2 className="w-4 h-4 text-success" />;
    case 'disconnected':
      return <XCircle className="w-4 h-4 text-muted-foreground" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-destructive" />;
    case 'pending':
      return <Loader2 className="w-4 h-4 text-warning animate-spin" />;
    default:
      return <XCircle className="w-4 h-4 text-muted-foreground" />;
  }
});

StatusIcon.displayName = 'StatusIcon';

const StatusBadge = memo<{ status: Integration['status'] }>(({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return { 
          label: 'Conectado', 
          className: 'bg-success/10 text-success border-success/20' 
        };
      case 'disconnected':
        return { 
          label: 'Desconectado', 
          className: 'bg-muted/10 text-muted-foreground border-muted/20' 
        };
      case 'error':
        return { 
          label: 'Erro', 
          className: 'bg-destructive/10 text-destructive border-destructive/20' 
        };
      case 'pending':
        return { 
          label: 'Conectando...', 
          className: 'bg-warning/10 text-warning border-warning/20' 
        };
      default:
        return { 
          label: 'Desconhecido', 
          className: 'bg-muted/10 text-muted-foreground border-muted/20' 
        };
    }
  };

  const config = getStatusConfig();
  
  return (
    <Badge 
      variant="outline" 
      className={`px-2 py-1 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </Badge>
  );
});

StatusBadge.displayName = 'StatusBadge';

export default memo<IntegrationCardProps>(function IntegrationCard({ 
  integration, 
  onConfigure,
  loading = false 
}) {
  const handleConfigure = () => {
    if (!loading) {
      onConfigure(integration);
    }
  };

  const getConnectedAccountName = () => {
    if (integration.platform === 'kommo' && integration.config) {
      return (integration.config as any)?.accountName;
    }
    if (integration.platform === 'whatsapp' && integration.config) {
      return (integration.config as any)?.businessName;
    }
    return null;
  };

  const getIconColorClass = () => {
    switch (integration.color) {
      case 'success':
        return 'bg-success/10 text-success border-success/20';
      case 'warning':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'destructive':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'accent':
        return 'bg-accent/10 text-accent border-accent/20';
      default:
        return 'konver-gradient-primary text-white';
    }
  };

  const getActionButton = () => {
    const isConnected = integration.status === 'connected';
    
    return (
      <Button
        onClick={handleConfigure}
        disabled={loading}
        variant={isConnected ? "outline" : "default"}
        className={`w-full h-9 text-sm font-medium transition-all duration-200 ${
          isConnected 
            ? 'konver-hover-subtle' 
            : 'konver-gradient-primary hover:opacity-90'
        }`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Settings className="w-4 h-4 mr-2" />
            {isConnected ? 'Configurar' : 'Conectar'}
          </>
        )}
      </Button>
    );
  };

  return (
    <div className="konver-glass-card rounded-2xl p-6 konver-animate-fade-in hover:shadow-lg transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${getIconColorClass()}`}>
            {integration.icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base text-foreground truncate">
              {integration.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {integration.platform.charAt(0).toUpperCase() + integration.platform.slice(1)}
            </p>
          </div>
        </div>
        
        <StatusIcon status={integration.status} />
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-6 line-clamp-2 leading-relaxed">
        {integration.description}
      </p>

      {/* Status */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col space-y-1">
          <StatusBadge status={integration.status} />
          {getConnectedAccountName() && integration.status === 'connected' && integration.platform !== 'kommo' && (
            <div className="text-xs text-muted-foreground/70 truncate max-w-[200px]">
              {getConnectedAccountName()}
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      {getActionButton()}
    </div>
  );
});