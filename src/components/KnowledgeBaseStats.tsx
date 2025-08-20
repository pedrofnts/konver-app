import React from 'react';
import { Card } from "@/components/ui/card";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle
} from "lucide-react";
import { KnowledgeFileStats } from "@/hooks/useKnowledgeBase";

interface KnowledgeBaseStatsProps {
  stats: KnowledgeFileStats;
  loading?: boolean;
}

export default function KnowledgeBaseStats({ stats, loading = false }: KnowledgeBaseStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 konver-glass-card konver-animate-shimmer">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                <div className="h-3 w-12 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      icon: CheckCircle2,
      label: "Prontos",
      value: stats.ready,
      color: "success",
      bgColor: "bg-success/10", 
      textColor: "text-success"
    },
    {
      icon: Clock,
      label: "Processando",
      value: stats.processing,
      color: "warning",
      bgColor: "bg-warning/10",
      textColor: "text-warning"
    },
    {
      icon: AlertCircle,
      label: "Erros",
      value: stats.error,
      color: "destructive",
      bgColor: "bg-destructive/10",
      textColor: "text-destructive"
    }
  ];

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {statItems.map((item, index) => (
          <Card 
            key={item.label} 
            className="p-4 konver-glass-card konver-hover-subtle konver-animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.bgColor}`}>
                <item.icon className={`w-5 h-5 ${item.textColor}`} />
              </div>
              <div>
                <p className="text-xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>


    </div>
  );
}

// Helper function for file size formatting
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
