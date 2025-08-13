import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface KonverCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  status?: string;
  badge?: string;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'feature' | 'interactive' | 'glass' | 'stats';
  glow?: boolean;
}

const statusConfig: Record<string, { badge: string; indicator: string }> = {
  active: {
    badge: 'konver-status-success border text-xs font-medium px-2 py-1 rounded-md',
    indicator: 'bg-success shadow-sm animate-pulse'
  },
  inactive: {
    badge: 'bg-muted/20 text-muted-foreground border-muted/30 text-xs font-medium px-2 py-1 rounded-md',
    indicator: 'bg-muted-foreground/50'
  },
  pending: {
    badge: 'konver-status-warning border text-xs font-medium px-2 py-1 rounded-md',
    indicator: 'bg-warning shadow-sm animate-pulse'
  },
  error: {
    badge: 'konver-status-error border text-xs font-medium px-2 py-1 rounded-md',
    indicator: 'bg-destructive shadow-sm animate-pulse'
  }
};

const getStatusConfig = (status: string) => {
  return statusConfig[status] || {
    badge: 'bg-muted/10 text-muted-foreground border-muted/20',
    indicator: 'bg-muted-foreground'
  };
};

export default function KonverCard({
  title,
  description,
  children,
  status,
  badge,
  className,
  hover = false,
  onClick,
  variant = 'default',
  glow = false
}: KonverCardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'feature':
        return 'konver-card-feature';
      case 'interactive':
        return 'konver-card-interactive';
      case 'glass':
        return 'konver-card-glass';
      case 'stats':
        return 'konver-card-stats';
      default:
        return 'konver-card';
    }
  };

  const cardClasses = cn(
    getVariantClasses(),
    hover && !variant.includes('interactive') && "konver-hover cursor-pointer",
    onClick && "cursor-pointer",
    glow && "konver-animate-pulse-glow",
    className
  );

  return (
    <Card className={cardClasses} onClick={onClick}>
      {(title || description || status || badge) && (
        <CardHeader className="pb-4 relative">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              {title && (
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-3 group">
                  {status && (
                    <div className={cn("h-3 w-3 rounded-full", getStatusConfig(status).indicator)} />
                  )}
                  <span className="group-hover:konver-text-gradient transition-all duration-300">
                    {title}
                  </span>
                </CardTitle>
              )}
              {description && (
                <CardDescription className="text-sm text-muted-foreground/90 leading-relaxed">
                  {description}
                </CardDescription>
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {badge && (
                <Badge variant="outline" className="text-xs font-medium px-2 py-1 rounded-lg border-border/50 bg-muted/30">
                  {badge}
                </Badge>
              )}
              {status && (
                <div className={cn(getStatusConfig(status).badge)}>
                  {status}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent className={cn(title || description ? "pt-0" : "")}>
        {children}
      </CardContent>
    </Card>
  );
}