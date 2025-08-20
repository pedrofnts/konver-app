import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import KnowledgeBaseFileCard from "./KnowledgeBaseFileCard";
import { 
  FileText,
  Trash2,
  X
} from "lucide-react";
import { KnowledgeBaseFile } from "@/integrations/supabase/types";

interface KnowledgeBaseFileListProps {
  files: KnowledgeBaseFile[];
  loading: boolean;
  selectedFiles: Set<string>;
  onFileSelect: (fileId: string) => void;
  onPreviewFile?: (file: KnowledgeBaseFile) => void;
  onDownloadFile: (fileId: string) => void;
  onDeleteFile: (fileId: string) => void;
  onRetryFile?: (fileId: string) => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  emptyState?: React.ReactNode;
}

export default function KnowledgeBaseFileList({
  files,
  loading,
  selectedFiles,
  onFileSelect,
  onPreviewFile,
  onDownloadFile,
  onDeleteFile,
  onRetryFile,
  onBulkDelete,
  onClearSelection,
  emptyState
}: KnowledgeBaseFileListProps) {

  // Loading skeleton
  const FileSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-4 konver-glass-card konver-animate-shimmer">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <div className="flex space-x-4">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  // Empty state when no files match filters
  const DefaultEmptyState = () => (
    <Card className="text-center py-12 konver-glass-card">
      <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <FileText className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-medium mb-2">Nenhum arquivo encontrado</h3>
                    <p className="text-muted-foreground mb-4">
                Tente ajustar sua busca ou filtros
              </p>
    </Card>
  );

  if (loading) {
    return <FileSkeleton />;
  }

  if (files.length === 0) {
    return emptyState || <DefaultEmptyState />;
  }

  return (
    <div className="space-y-4">
      {/* Files Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {files.map((file, index) => (
          <KnowledgeBaseFileCard
            key={file.id}
            file={file}
            selected={selectedFiles.has(file.id)}
            onSelect={onFileSelect}
            onPreview={onPreviewFile}
            onDownload={onDownloadFile}
            onDelete={onDeleteFile}
            onRetry={onRetryFile}
            animationDelay={index * 50}
          />
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedFiles.size > 0 && (
        <Card className="p-3 konver-glass-card border-t konver-animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="text-sm">
                {selectedFiles.size} arquivo{selectedFiles.size > 1 ? 's' : ''} selecionado{selectedFiles.size > 1 ? 's' : ''}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Ações em lote disponíveis
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearSelection}
                className="h-8"
              >
                <X className="w-4 h-4 mr-1" />
                Limpar Seleção
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={onBulkDelete}
                className="konver-button-destructive h-8"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Excluir Selecionados
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
