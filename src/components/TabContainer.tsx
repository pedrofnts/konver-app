import React, { memo, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

// Enhanced type definitions
interface TabAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
  'aria-label'?: string;
}

interface TabMetric {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

type TabVariant = 'default' | 'feature' | 'glass' | 'stats';
type TabState = 'idle' | 'loading' | 'error' | 'empty';

interface TabContainerProps {
  // Core props
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  
  // Enhanced props
  actions?: TabAction[];
  metrics?: TabMetric[];
  variant?: TabVariant;
  state?: TabState;
  className?: string;
  
  // Loading and error states
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  
  // Layout options
  scrollable?: boolean;
  fullHeight?: boolean;
  
  // Custom styling
  headerClassName?: string;
  contentClassName?: string;
}

// Memoized action button component for performance
const ActionButton = memo<{ action: TabAction; index: number }>(({ action, index }) => {
  const buttonVariant = useMemo(() => {
    switch (action.variant) {
      case 'default': return 'konver-button-primary';
      case 'secondary': return 'konver-button-secondary';
      case 'ghost': return 'konver-button-ghost';
      case 'outline': return 'konver-button-secondary';
      case 'destructive': return 'konver-button-primary bg-destructive hover:bg-destructive/90';
      default: return 'konver-button-secondary';
    }
  }, [action.variant]);

  return (
    <Button
      key={index}
      variant={action.variant || "secondary"}
      size="sm"
      onClick={action.onClick}
      disabled={action.disabled || action.loading}
      className={`${buttonVariant} konver-hover-subtle konver-focus transition-all duration-200 ${action.className || ''}`}
      aria-label={action['aria-label'] || action.label}
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

// Metric display component
const MetricDisplay = memo<{ metric: TabMetric }>(({ metric }) => {
  const trendClass = useMemo(() => {
    switch (metric.trend) {
      case 'up': return 'text-success';
      case 'down': return 'text-destructive';
      case 'neutral': return 'text-muted-foreground';
      default: return 'text-foreground';
    }
  }, [metric.trend]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/50 border border-border/30 konver-hover-subtle">
      {metric.icon && (
        <div className="w-4 h-4 text-muted-foreground">
          {metric.icon}
        </div>
      )}
      <div className="flex flex-col">
        <span className={`text-lg font-semibold ${trendClass}`}>
          {metric.value}
        </span>
        <span className="text-xs text-muted-foreground">
          {metric.label}
        </span>
      </div>
    </div>
  );
});

MetricDisplay.displayName = 'MetricDisplay';

// Loading state component
const LoadingState = memo(() => (
  <div className="konver-tab-loading">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="konver-tab-loading-spinner" />
      <p className="text-sm text-muted-foreground">Loading content...</p>
    </div>
  </div>
));

LoadingState.displayName = 'LoadingState';

// Error state component
const ErrorState = memo<{ error: string; onRetry?: () => void }>(({ error, onRetry }) => (
  <div className="konver-tab-empty">
    <div className="konver-tab-empty-icon bg-destructive/10 text-destructive">
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <h3 className="konver-tab-empty-title">Something went wrong</h3>
    <p className="konver-tab-empty-description">{error}</p>
    {onRetry && (
      <Button 
        onClick={onRetry} 
        className="konver-button-primary"
        aria-label="Retry loading content"
      >
        Try Again
      </Button>
    )}
  </div>
));

ErrorState.displayName = 'ErrorState';

// Main TabContainer component
export default memo<TabContainerProps>(function TabContainer({
  title,
  description,
  icon,
  children,
  actions = [],
  metrics = [],
  variant = 'default',
  state = 'idle',
  className = "",
  loading = false,
  error = null,
  onRetry,
  scrollable = true,
  fullHeight = true,
  headerClassName = "",
  contentClassName = "",
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy
}) {
  // Compute container classes based on variant
  const containerClasses = useMemo(() => {
    const baseClasses = 'konver-animate-in';
    const variantClasses = {
      default: 'konver-assistant-container konver-card-feature',
      feature: 'konver-assistant-container konver-card-feature konver-glow',
      glass: 'konver-assistant-container konver-glass-card',
      stats: 'konver-assistant-container konver-card-stats'
    };
    
    return `${baseClasses} ${variantClasses[variant]} ${!fullHeight ? 'h-auto' : ''} ${className}`;
  }, [variant, fullHeight, className]);

  // Compute content classes
  const contentClasses = useMemo(() => {
    const baseClasses = scrollable 
      ? 'konver-tab-content-scrollable'
      : 'konver-tab-content-flex p-6';
    
    return `${baseClasses} ${contentClassName}`;
  }, [scrollable, contentClassName]);

  // Determine what to render based on state
  const renderContent = useMemo(() => {
    if (loading || state === 'loading') {
      return <LoadingState />;
    }
    
    if (error || state === 'error') {
      return <ErrorState error={error || 'An error occurred'} onRetry={onRetry} />;
    }
    
    if (state === 'empty') {
      return (
        <div className="konver-tab-empty">
          <div className="konver-tab-empty-icon">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="konver-tab-empty-title">No content available</h3>
          <p className="konver-tab-empty-description">
            There's nothing to show here yet. Content will appear when available.
          </p>
        </div>
      );
    }
    
    return children;
  }, [loading, state, error, onRetry, children]);

  return (
    <section 
      className={containerClasses}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      role="tabpanel"
    >
      {/* Enhanced Header */}
      <header className={`konver-tab-header ${headerClassName}`}>
        <div className="konver-tab-title">
          <div className="konver-tab-title-icon" role="img" aria-hidden="true">
            {icon}
          </div>
          <div className="konver-tab-title-content">
            <h2 id={`${title.toLowerCase().replace(/\s+/g, '-')}-title`}>
              {title}
            </h2>
            <p id={`${title.toLowerCase().replace(/\s+/g, '-')}-description`}>
              {description}
            </p>
          </div>
        </div>
        
        {/* Metrics Display */}
        {metrics.length > 0 && (
          <div className="hidden lg:flex items-center gap-3" role="group" aria-label="Metrics">
            {metrics.map((metric, index) => (
              <MetricDisplay key={`metric-${index}`} metric={metric} />
            ))}
          </div>
        )}
        
        {/* Action Buttons */}
        {actions.length > 0 && (
          <div className="konver-tab-actions" role="group" aria-label="Actions">
            {actions.map((action, index) => (
              <ActionButton key={`action-${index}`} action={action} index={index} />
            ))}
          </div>
        )}
      </header>
      
      {/* Mobile Metrics Display */}
      {metrics.length > 0 && (
        <div className="lg:hidden px-6 py-3 border-b border-border/50 bg-card/30">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {metrics.map((metric, index) => (
              <MetricDisplay key={`mobile-metric-${index}`} metric={metric} />
            ))}
          </div>
        </div>
      )}
      
      {/* Content Area */}
      <main className="konver-tab-content">
        <div className={contentClasses}>
          {renderContent}
        </div>
      </main>
    </section>
  );
});

