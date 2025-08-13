import { ReactNode } from 'react';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatItem {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
}

interface KonverStatsProps {
  stats: StatItem[];
  className?: string;
}

export default function KonverStats({ stats, className }: KonverStatsProps) {
  const getIconBackground = (index: number) => {
    const backgrounds = [
      'konver-gradient-primary',
      'konver-gradient-accent', 
      'konver-gradient-warm',
      'konver-gradient-success'
    ];
    return backgrounds[index % backgrounds.length];
  };

  return (
    <div className={cn("grid gap-6 md:grid-cols-2 lg:grid-cols-4", className)}>
      {stats.map((stat, index) => (
        <Card key={index} className="konver-card-stats konver-hover-subtle group overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="space-y-3 flex-1">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </p>
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-bold text-foreground group-hover:konver-text-gradient transition-all duration-300">
                  {stat.value}
                </p>
                {stat.trend && (
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-all duration-300",
                    stat.trend.isPositive 
                      ? "bg-success/15 text-success border border-success/20" 
                      : "bg-destructive/15 text-destructive border border-destructive/20"
                  )}>
                    <span className={cn(
                      "w-1 h-1 rounded-full",
                      stat.trend.isPositive ? "bg-success" : "bg-destructive"
                    )}></span>
                    {stat.trend.isPositive ? "+" : ""}{stat.trend.value}%
                  </div>
                )}
              </div>
              {stat.description && (
                <p className="text-sm text-muted-foreground/80 font-medium">
                  {stat.description}
                </p>
              )}
            </div>
            
            {stat.icon && (
              <div className={cn(
                "flex h-14 w-14 items-center justify-center rounded-xl shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
                getIconBackground(index)
              )}>
                <div className="text-white drop-shadow-sm">
                  {stat.icon}
                </div>
              </div>
            )}
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -top-2 -right-2 w-20 h-20 rounded-full opacity-5 group-hover:opacity-10 transition-opacity duration-300"
               style={{ background: `var(--gradient-${index % 2 === 0 ? 'primary' : 'accent'})` }}>
          </div>
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-5 group-hover:opacity-10 transition-opacity duration-300"
               style={{ background: `var(--gradient-${index % 2 === 0 ? 'accent' : 'primary'})` }}>
          </div>
        </Card>
      ))}
    </div>
  );
}