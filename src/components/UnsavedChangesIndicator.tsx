import React from 'react';
import { Badge } from "@/components/ui/badge";
import { CircleDot, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnsavedChangesIndicatorProps {
  hasChanges: boolean;
  variant?: 'badge' | 'inline' | 'card';
  className?: string;
  showIcon?: boolean;
}

export default function UnsavedChangesIndicator({ 
  hasChanges, 
  variant = 'badge', 
  className,
  showIcon = true 
}: UnsavedChangesIndicatorProps) {
  const icon = hasChanges ? <CircleDot className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />;
  const text = hasChanges ? "Mudanças não salvas" : "Tudo salvo";
  const colorClass = hasChanges ? "text-warning" : "text-success";
  const bgClass = hasChanges ? "bg-warning/5 border-warning/20" : "bg-success/5 border-success/20";

  if (variant === 'badge') {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          bgClass,
          colorClass,
          "animate-pulse duration-1000",
          hasChanges ? "animate-pulse" : "",
          className
        )}
      >
        {showIcon && icon}
        {showIcon && <span className="ml-1">{text}</span>}
        {!showIcon && text}
      </Badge>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn(
        "flex items-center gap-2 text-sm font-medium",
        colorClass,
        hasChanges ? "animate-pulse" : "",
        className
      )}>
        {showIcon && icon}
        <span>{text}</span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg border",
        bgClass,
        hasChanges ? "animate-pulse border-warning/30" : "border-success/30",
        className
      )}>
        {showIcon && (
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            hasChanges ? "bg-warning/10" : "bg-success/10"
          )}>
            {hasChanges ? (
              <AlertTriangle className="w-4 h-4 text-warning" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-success" />
            )}
          </div>
        )}
        <div>
          <div className={cn("text-sm font-medium", colorClass)}>
            {text}
          </div>
          <div className="text-xs text-muted-foreground">
            {hasChanges 
              ? "Lembre-se de salvar suas alterações"
              : "Todas as alterações foram salvas"
            }
          </div>
        </div>
      </div>
    );
  }

  return null;
}