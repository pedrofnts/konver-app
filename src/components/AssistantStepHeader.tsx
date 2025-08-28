import React, { memo } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from 'lucide-react';

interface StepAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  className?: string;
}

interface StepMetric {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  color?: 'primary' | 'accent' | 'success' | 'warning' | 'destructive';
}

interface StepStatus {
  label: string;
  value: string;
  type: 'online' | 'offline' | 'success' | 'warning' | 'error' | 'info';
}

interface AssistantStepHeaderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  actions?: StepAction[];
  metrics?: StepMetric[];
  status?: StepStatus[];
  loading?: boolean;
  className?: string;
  compact?: boolean;
}

const MetricCard = memo<{ metric: StepMetric }>(({ metric }) => {
  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'primary': return 'konver-gradient-primary text-white';
      case 'accent': return 'bg-accent/10 text-accent border border-accent/20';
      case 'success': return 'bg-success/10 text-success border border-success/20';
      case 'warning': return 'bg-warning/10 text-warning border border-warning/20';
      case 'destructive': return 'bg-destructive/10 text-destructive border border-destructive/20';
      default: return 'konver-gradient-primary text-white';
    }
  };

  return (
    <div className="text-center konver-animate-fade-in">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg ${getColorClasses(metric.color)}`}>
        {metric.icon}
      </div>
      <div className={`text-2xl font-bold ${metric.color === 'primary' || !metric.color ? 'konver-text-gradient' : `text-${metric.color}`}`}>
        {metric.value}
      </div>
      <div className="text-sm text-muted-foreground">{metric.label}</div>
    </div>
  );
});

MetricCard.displayName = 'MetricCard';

const ActionButton = memo<{ action: StepAction }>(({ action }) => {
  const getVariantClasses = () => {
    switch (action.variant) {
      case 'default': return 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md';
      case 'secondary': return 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'; 
      case 'outline': return 'border border-input bg-background hover:bg-accent hover:text-accent-foreground';
      case 'destructive': return 'bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm';
      case 'ghost': return 'hover:bg-accent hover:text-accent-foreground';
      default: return 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md';
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={action.onClick}
      disabled={action.disabled || action.loading}
      className={`${getVariantClasses()} font-medium transition-all duration-200 ${action.className || ''}`}
    >
      {action.loading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : (
        <span className="mr-2">{action.icon}</span>
      )}
      {action.label}
    </Button>
  );
});

ActionButton.displayName = 'ActionButton';

const StatusBadge = memo<{ status: StepStatus }>(({ status }) => {
  const getStatusClasses = () => {
    switch (status.type) {
      case 'online': return 'bg-success/10 text-success border-success/20';
      case 'offline': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'success': return 'bg-success/10 text-success border-success/20';
      case 'warning': return 'bg-warning/10 text-warning border-warning/20';
      case 'error': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'info': return 'bg-accent/10 text-accent border-accent/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={`px-3 py-2 rounded-xl border ${getStatusClasses()}`}
    >
      <span className="text-sm font-medium">
        {status.label}: {status.value}
      </span>
    </Badge>
  );
});

StatusBadge.displayName = 'StatusBadge';

export default memo<AssistantStepHeaderProps>(function AssistantStepHeader({
  title,
  description,
  icon,
  actions = [],
  metrics = [],
  status = [],
  loading = false,
  className = "",
  compact = false
}) {
  if (loading) {
    return (
      <div className={`konver-glass-card rounded-2xl p-6 konver-animate-fade-in ${className}`}>
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center space-y-3">
                <div className="w-12 h-12 bg-muted rounded-2xl animate-pulse mx-auto" />
                <div className="h-6 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse w-3/4 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Check if we should use clean styling (for components that override with their own container)
  const isCleanVariant = className.includes('shadow-none') || className.includes('bg-transparent');
  
  const headerClass = compact 
    ? (isCleanVariant 
        ? `rounded-xl p-4 konver-animate-fade-in ${className}` 
        : `konver-glass-card rounded-xl p-4 konver-animate-fade-in ${className}`)
    : (isCleanVariant 
        ? `rounded-2xl p-6 konver-animate-fade-in ${className}` 
        : `konver-glass-card rounded-2xl p-6 konver-animate-fade-in ${className}`);

  const titleSectionClass = compact ? "flex items-center justify-between" : "flex items-start justify-between mb-6";
  const iconClass = compact ? "w-8 h-8 rounded-xl" : "w-12 h-12 rounded-2xl";
  const titleClass = compact ? "text-lg font-bold konver-text-gradient" : "text-2xl font-bold konver-text-gradient";
  const descriptionClass = compact ? "text-sm text-muted-foreground" : "text-muted-foreground mt-1";
  const spacingClass = compact ? "space-x-3" : "space-x-4";

  return (
    <header className={headerClass}>
      {/* Title Section */}
      <div className={titleSectionClass}>
        <div className={`flex items-center ${spacingClass}`}>
          <div className={`konver-gradient-primary ${iconClass} flex items-center justify-center shadow-lg`}>
            {icon}
          </div>
          <div>
            <h1 className={titleClass}>{title}</h1>
            <p className={descriptionClass}>{description}</p>
          </div>
        </div>
        
        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex items-center gap-2">
            {actions.map((action, index) => (
              <ActionButton key={`action-${index}`} action={action} />
            ))}
          </div>
        )}
      </div>

      {/* Status Badges - Hidden in compact mode */}
      {!compact && status.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {status.map((stat, index) => (
            <StatusBadge key={`status-${index}`} status={stat} />
          ))}
        </div>
      )}
      
      {/* Metrics Grid - Hidden in compact mode */}
      {!compact && metrics.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <MetricCard key={`metric-${index}`} metric={metric} />
          ))}
        </div>
      )}
    </header>
  );
});