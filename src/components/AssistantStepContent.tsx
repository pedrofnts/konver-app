import React, { memo, useMemo } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmptyStateConfig {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

interface LoadingStateConfig {
  title?: string;
  description?: string;
}

interface ErrorStateConfig {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

interface AssistantStepContentProps {
  children: React.ReactNode;
  
  // Layout options
  variant?: 'default' | 'chat' | 'grid' | 'compact';
  scrollable?: boolean;
  fullHeight?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  
  // State management
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  
  // State configurations
  loadingState?: LoadingStateConfig;
  errorState?: ErrorStateConfig;
  emptyState?: EmptyStateConfig;
  
  // Styling
  className?: string;
  contentClassName?: string;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
}

const LoadingSpinner = memo<{ config?: LoadingStateConfig }>(({ config }) => (
  <div className="konver-tab-loading">
    <div className="flex flex-col items-center gap-4">
      <div className="konver-gradient-primary w-16 h-16 rounded-3xl flex items-center justify-center shadow-xl konver-animate-float">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {config?.title || 'Carregando...'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {config?.description || 'Por favor, aguarde enquanto carregamos o conteúdo.'}
        </p>
      </div>
    </div>
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

const ErrorDisplay = memo<{ error: string; config?: ErrorStateConfig }>(({ error, config }) => (
  <div className="konver-tab-empty">
    <div className="konver-tab-empty-icon bg-destructive/10 text-destructive">
      <AlertCircle className="w-10 h-10" />
    </div>
    <h3 className="konver-tab-empty-title">
      {config?.title || 'Algo deu errado'}
    </h3>
    <p className="konver-tab-empty-description">
      {config?.description || error}
    </p>
    {config?.onRetry && (
      <Button 
        onClick={config.onRetry} 
        className="konver-button-primary mt-4"
      >
        {config.retryLabel || 'Tentar Novamente'}
      </Button>
    )}
  </div>
));

ErrorDisplay.displayName = 'ErrorDisplay';

const EmptyDisplay = memo<{ config: EmptyStateConfig }>(({ config }) => (
  <div className="konver-tab-empty">
    <div className="konver-tab-empty-icon konver-gradient-primary text-white">
      {config.icon}
    </div>
    <h3 className="konver-tab-empty-title">{config.title}</h3>
    <p className="konver-tab-empty-description">{config.description}</p>
    {config.action && (
      <Button 
        onClick={config.action.onClick} 
        className="konver-button-primary mt-4"
      >
        {config.action.icon && <span className="mr-2">{config.action.icon}</span>}
        {config.action.label}
      </Button>
    )}
  </div>
));

EmptyDisplay.displayName = 'EmptyDisplay';

export default memo<AssistantStepContentProps>(function AssistantStepContent({
  children,
  variant = 'default',
  scrollable = true,
  fullHeight = true,
  padding = 'md',
  loading = false,
  error = null,
  empty = false,
  loadingState,
  errorState,
  emptyState,
  className = "",
  contentClassName = "",
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy
}) {
  // Container classes based on variant
  const containerClasses = useMemo(() => {
    const baseClasses = 'konver-assistant-step-content';
    const heightClasses = fullHeight ? 'flex-1 min-h-0' : 'h-auto';
    const variantClasses = {
      default: 'konver-glass-card rounded-2xl overflow-hidden',
      chat: 'konver-glass-card rounded-2xl overflow-hidden',
      grid: 'space-y-6',
      compact: 'konver-card rounded-xl overflow-hidden'
    };
    
    return `${baseClasses} ${heightClasses} ${variantClasses[variant]} konver-animate-slide-up ${className}`;
  }, [variant, fullHeight, className]);

  // Content wrapper classes
  const contentWrapperClasses = useMemo(() => {
    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };
    
    // For chat variant, we don't want default padding as it manages its own
    const finalPadding = variant === 'chat' ? 'none' : padding;
    const layoutClasses = scrollable ? 'flex-1 overflow-hidden' : 'flex-1';
    
    return `${layoutClasses} ${paddingClasses[finalPadding]}`;
  }, [scrollable, padding, variant]);

  // Content classes
  const contentClasses = useMemo(() => {
    if (variant === 'grid') {
      return 'space-y-6';
    }
    
    if (scrollable) {
      return `flex-1 ${contentClassName}`;
    }
    
    return `flex-1 flex flex-col ${contentClassName}`;
  }, [variant, scrollable, contentClassName]);

  // Determine what to render
  const renderContent = useMemo(() => {
    if (loading) {
      return <LoadingSpinner config={loadingState} />;
    }
    
    if (error) {
      return <ErrorDisplay error={error} config={errorState} />;
    }
    
    if (empty && emptyState) {
      return <EmptyDisplay config={emptyState} />;
    }
    
    return children;
  }, [loading, error, empty, children, loadingState, errorState, emptyState]);

  // For grid variant, render without wrapper
  if (variant === 'grid') {
    return (
      <main 
        className={containerClasses}
        data-variant={variant}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        role="main"
      >
        {error && (
          <Alert variant="destructive" className="mb-6 konver-animate-shake">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        )}
        
        <div className={contentClasses}>
          {renderContent}
        </div>
      </main>
    );
  }

  return (
    <main 
      className={containerClasses}
      data-variant={variant}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      role="main"
    >
      {error && !loading && (
        <div className="p-6 border-b border-border/50">
          <Alert variant="destructive" className="konver-animate-shake">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        </div>
      )}
      
      <div className={`flex flex-col ${contentWrapperClasses}`}>
        {scrollable && !loading && !error ? (
          <ScrollArea className={contentClasses}>
            {renderContent}
          </ScrollArea>
        ) : (
          <div className={contentClasses}>
            {renderContent}
          </div>
        )}
      </div>
    </main>
  );
});