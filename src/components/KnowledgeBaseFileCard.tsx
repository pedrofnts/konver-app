import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { 
  FileText,
  FileCode, 
  FileSpreadsheet,
  FileImage,
  Files,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Download,
  Trash2,
  RefreshCw
} from "lucide-react";
import { KnowledgeBaseFile } from "@/integrations/supabase/types";

interface KnowledgeBaseFileCardProps {
  file: KnowledgeBaseFile;
  selected: boolean;
  onSelect: (fileId: string) => void;
  onPreview?: (file: KnowledgeBaseFile) => void;
  onDownload: (fileId: string) => void;
  onDelete: (fileId: string) => void;
  onRetry?: (fileId: string) => void;
  animationDelay?: number;
}

export default function KnowledgeBaseFileCard({
  file,
  selected,
  onSelect,
  onPreview,
  onDownload,
  onDelete,
  onRetry,
  animationDelay = 0
}: KnowledgeBaseFileCardProps) {

  const getFileExtension = (fileName: string): string => {
    return fileName.split('.').pop()?.toLowerCase() || 'unknown';
  };

  const getFileIcon = (extension: string) => {
    switch (extension) {
      case 'pdf': return FileText;
      case 'txt': case 'md': return FileText;
      case 'json': return FileCode;
      case 'xlsx': case 'csv': return FileSpreadsheet;
      case 'docx': case 'doc': return FileText;
      case 'jpg': case 'jpeg': case 'png': case 'gif': return FileImage;
      default: return Files;
    }
  };

  const getFileIconComponent = (extension: string) => {
    const IconComponent = getFileIcon(extension);
    return <IconComponent className="w-6 h-6 text-white" />;
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ready': 
        return {
          color: 'bg-success/10 text-success border-success/20',
          icon: CheckCircle2,
          label: 'Pronto'
        };
      case 'processing': 
        return {
          color: 'bg-warning/10 text-warning border-warning/20',
          icon: Clock,
          label: 'Processando'
        };
      case 'error': 
        return {
          color: 'bg-destructive/10 text-destructive border-destructive/20',
          icon: AlertCircle,
          label: 'Erro'
        };
      default: 
        return {
          color: 'bg-muted/10 text-muted-foreground border-muted/20',
          icon: AlertCircle,
          label: 'Indefinido'
        };
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const fileDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - fileDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d`;
    return fileDate.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
  };

  const statusConfig = getStatusConfig(file.status || 'unknown');
  const extension = getFileExtension(file.file_name);

  return (
    <Card
      className="p-4 konver-glass-card konver-hover-subtle konver-animate-slide-up"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onSelect(file.id)}
            className="mt-1"
          />
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
            file.status === 'ready' ? 'konver-gradient-primary' :
            file.status === 'processing' ? 'bg-warning/20' :
            'bg-destructive/20'
          }`}>
            {getFileIconComponent(extension)}
          </div>
        </div>
        
        <Badge className={`text-xs konver-animate-bounce ${statusConfig.color}`}>
          <statusConfig.icon className="w-3 h-3 mr-1" />
          {statusConfig.label}
        </Badge>
      </div>
      
      <div className="mb-3">
        <h4 className="font-medium text-sm truncate mb-1" title={file.file_name}>
          {file.file_name}
        </h4>
        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
          <span>{formatFileSize(parseInt(file.file_size, 10))}</span>
          <span>•</span>
          <span>{extension.toUpperCase()}</span>
          <span>•</span>
          <span>{formatTimeAgo(file.created_at || '')}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {file.status === 'ready' && (
            <>
              {onPreview && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPreview(file)}
                  className="konver-hover-subtle h-8 w-8 p-0"
                  title="Preview file"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDownload(file.id)}
                className="konver-hover-subtle h-8 w-8 p-0"
                title="Download file"
              >
                <Download className="w-4 h-4" />
              </Button>
            </>
          )}
          {file.status === 'processing' && (
            <div className="flex items-center space-x-2 text-warning">
              <Clock className="w-4 h-4 konver-animate-spin" />
                                      <span className="text-xs">Processando...</span>
            </div>
          )}
          {file.status === 'error' && onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRetry(file.id)}
              className="text-warning hover:text-warning konver-hover-subtle h-8 w-8 p-0"
              title="Retry processing"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(file.id)}
          className="text-destructive hover:text-destructive konver-hover-subtle h-8 w-8 p-0"
          title="Delete file"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      {file.status === 'error' && (
        <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive flex items-center konver-animate-bounce">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>Falha no processamento. Clique em tentar novamente.</span>
        </div>
      )}
      
      {file.chunks_count > 0 && file.status === 'ready' && (
        <div className="mt-3 text-xs text-muted-foreground">
          {file.chunks_count} fragmentos processados
        </div>
      )}
    </Card>
  );
}
