import React, { useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import AssistantStepHeader from "@/components/AssistantStepHeader";
import KnowledgeBaseFilters, { SortField, SortDirection } from "./KnowledgeBaseFilters";
import KnowledgeBaseFileList from "./KnowledgeBaseFileList";
import KnowledgeBaseEmpty from "./KnowledgeBaseEmpty";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Upload,
  Database,
  Trash2,
  Filter,
  X
} from "lucide-react";
import { useKnowledgeBase } from "@/hooks/useKnowledgeBase";
import { KnowledgeBaseFile } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface KnowledgeBaseContentProps {
  assistantId: string;
  onUpload?: () => void;
}

export default function KnowledgeBaseContent({ assistantId, onUpload }: KnowledgeBaseContentProps) {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [dragActive, setDragActive] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showHeaderDeleteDialog, setShowHeaderDeleteDialog] = useState(false);

  const { toast } = useToast();

  // Knowledge base hook
  const {
    files: knowledgeFiles,
    loading,
    uploading,
    uploadProgress,
    stats,
    uploadFile,
    uploadFiles,
    deleteFile,
    deleteFiles,
    downloadFile,
    validateFiles,
    getFileExtension,
    retryFile,
    refresh
  } = useKnowledgeBase({ botId: assistantId, autoRefresh: false });

  // Handle file upload with validation
  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const { valid, invalid } = validateFiles(files);

    if (invalid.length > 0) {
      toast({
        title: "Arquivos inválidos",
        description: `${invalid.length} arquivo(s) foram rejeitados. Apenas arquivos .txt, .pdf, .json, .md, .xlsx, .csv, .docx e .doc até 50MB são permitidos.`,
        variant: "destructive",
      });
    }

    if (valid.length === 0) return;

    if (valid.length === 1) {
      await uploadFile(valid[0]);
    } else {
      const result = await uploadFiles(valid);
      toast({
        title: result.successful > 0 ? "Upload concluído" : "Erro no upload",
        description: `${result.successful} arquivo(s) enviado(s) com sucesso${result.failed > 0 ? `, ${result.failed} falharam` : ''}.`,
        variant: result.failed > 0 && result.successful === 0 ? "destructive" : "default",
      });
    }

    if (onUpload) onUpload();
  };

  // Handle individual file deletion
  const handleDelete = async (fileId: string) => {
    const success = await deleteFile(fileId);
    if (success) {
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  // Handle bulk file deletion
  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;
    
    const result = await deleteFiles(Array.from(selectedFiles));
    setSelectedFiles(new Set());
    
    toast({
      title: result.successful > 0 ? "Arquivos removidos" : "Erro",
      description: `${result.successful} arquivo(s) removido(s)${result.failed > 0 ? `, ${result.failed} falharam` : ''}.`,
      variant: result.failed > 0 && result.successful === 0 ? "destructive" : "default",
    });
  };

  // Handle bulk file download
  const handleBulkDownload = async () => {
    if (selectedFiles.size === 0) return;
    
    const selectedFileIds = Array.from(selectedFiles);
    const selectedFilesToDownload = knowledgeFiles.filter(f => 
      selectedFileIds.includes(f.id)
    );
    
    if (selectedFilesToDownload.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Não há arquivos válidos para download na seleção.",
        variant: "destructive",
      });
      return;
    }

    let successful = 0;
    let failed = 0;

    // Download each file sequentially to avoid overwhelming the browser
    for (const file of selectedFilesToDownload) {
      try {
        const success = await downloadFile(file.id);
        if (success) {
          successful++;
        } else {
          failed++;
        }
        // Small delay between downloads to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        failed++;
        console.error(`Error downloading file ${file.file_name}:`, error);
      }
    }

    toast({
      title: successful > 0 ? "Download iniciado" : "Erro no download",
      description: `${successful} arquivo(s) baixado(s)${failed > 0 ? `, ${failed} falharam` : ''}.`,
      variant: failed > 0 && successful === 0 ? "destructive" : "default",
    });

    // Clear selection after download
    setSelectedFiles(new Set());
  };

  // Filtering and Sorting
  const getAvailableTypes = (): string[] => {
    const types = new Set(knowledgeFiles.map(file => getFileExtension(file.file_name)));
    return Array.from(types).filter(type => type !== 'unknown');
  };

  const filteredAndSortedFiles = knowledgeFiles
    .filter(file => {
      const matchesSearch = file.file_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || file.status === statusFilter;
      const fileExtension = getFileExtension(file.file_name);
      const matchesType = typeFilter === 'all' || fileExtension === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'file_name':
          comparison = a.file_name.localeCompare(b.file_name);
          break;
        case 'file_size':
          comparison = parseInt(a.file_size, 10) - parseInt(b.file_size, 10);
          break;
        case 'created_at':
          comparison = new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const clearSelection = () => {
    setSelectedFiles(new Set());
  };

  const handleRetryFile = async (fileId: string) => {
    await retryFile(fileId);
  };

  // Get file counts for quick status display
  const getStatusCounts = () => {
    const total = knowledgeFiles.length;
    const ready = knowledgeFiles.filter(f => f.status === 'ready').length;
    const processing = knowledgeFiles.filter(f => f.status === 'processing').length;
    const error = knowledgeFiles.filter(f => f.status === 'error').length;
    return { total, ready, processing, error };
  };

  const statusCounts = getStatusCounts();

  // Check if any filters are active
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || typeFilter !== 'all';

  // Header configuration
  const headerActions = [
    {
      label: "Enviar Arquivos",
      icon: <Upload className="w-4 h-4" />,
      onClick: () => document.getElementById('file-input')?.click(),
      disabled: uploading,
      variant: "default" as const
    },
    ...(knowledgeFiles.length > 0 ? [
      {
        label: showFilters ? "Ocultar Filtros" : "Filtros",
        icon: <Filter className="w-4 h-4" />,
        onClick: () => setShowFilters(!showFilters),
        variant: "outline" as const
      }
    ] : []),
    ...(selectedFiles.size > 0 ? [
      {
        label: `Excluir (${selectedFiles.size})`,
        icon: <Trash2 className="w-4 h-4" />,
        onClick: () => setShowHeaderDeleteDialog(true),
        variant: "destructive" as const
      }
    ] : [])
  ];

  // Handle empty state based on context
  const getEmptyState = () => {
    if (knowledgeFiles.length === 0) {
      return (
        <KnowledgeBaseEmpty
          onUpload={() => document.getElementById('file-input')?.click()}
          loading={loading}
          variant="initial"
        />
      );
    }

    if (filteredAndSortedFiles.length === 0) {
      return (
        <KnowledgeBaseEmpty
          onUpload={() => {
            setSearchTerm('');
            setStatusFilter('all');
            setTypeFilter('all');
          }}
          variant="no-results"
          title="Nenhum arquivo corresponde aos filtros"
          description="Tente ajustar os termos de busca ou filtros para encontrar o que procura."
        />
      );
    }

    return null;
  };

  const emptyState = getEmptyState();

  // Upload progress component
  const renderUploadProgress = () => {
    if (!uploading && uploadProgress.length === 0) return null;

    return (
      <div className="mb-4 p-4 konver-glass-card rounded-xl konver-animate-slide-down">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 konver-gradient-accent rounded-lg flex items-center justify-center">
              <Upload className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-medium text-sm">Enviando arquivos...</p>
              <p className="text-xs text-muted-foreground">
                {uploadProgress.length > 1 ? `${uploadProgress.length} arquivos` : 'Upload único'}
              </p>
            </div>
          </div>
          
          {uploadProgress.map((progress, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate flex-1 mr-4">{progress.fileName}</p>
                <p className="text-sm font-medium">{progress.progress}%</p>
              </div>
              <Progress value={progress.progress} className="h-2" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Status summary bar
  const renderStatusSummary = () => {
    if (knowledgeFiles.length === 0) return null;

    return (
      <div className="flex items-center justify-between p-4 konver-glass-card rounded-xl mb-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              Total: {statusCounts.total}
            </Badge>
            {statusCounts.ready > 0 && (
              <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                Prontos: {statusCounts.ready}
              </Badge>
            )}
            {statusCounts.processing > 0 && (
              <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
                Processando: {statusCounts.processing}
              </Badge>
            )}
            {statusCounts.error > 0 && (
              <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                Erros: {statusCounts.error}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {filteredAndSortedFiles.length !== knowledgeFiles.length && (
            <span className="text-sm text-muted-foreground">
              {filteredAndSortedFiles.length} de {knowledgeFiles.length}
            </span>
          )}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setTypeFilter('all');
              }}
              className="h-8 text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Early return for empty state
  if (knowledgeFiles.length === 0 && !loading && !uploading) {
    return (
      <div className="flex flex-col h-full">
        <AssistantStepHeader
          title="Base de Conhecimento"
          description="Envie e organize fontes de conhecimento para seu assistente"
          icon={<Database className="w-5 h-5 text-white" />}
          compact={true}
          actions={headerActions}
          className="flex-shrink-0 shadow-none border-0 bg-transparent backdrop-blur-none"
        />
        
        <div className="flex-1 min-h-0 mt-4">
          {emptyState}
          <input
            id="file-input"
            type="file"
            multiple
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            accept=".txt,.pdf,.json,.md,.xlsx,.csv,.docx,.doc"
            className="hidden"
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col h-full"
      onDragEnter={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setDragActive(false);
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFileUpload(e.dataTransfer.files);
        }
      }}
    >
      <AssistantStepHeader
        title="Base de Conhecimento"
        description="Envie e organize fontes de conhecimento para seu assistente"
        icon={<Database className="w-5 h-5 text-white" />}
        compact={true}
        actions={headerActions}
        loading={false}
        className="flex-shrink-0 shadow-none border-0 bg-transparent backdrop-blur-none"
      />

      <div className="flex-1 min-h-0 mt-4">
        <div className={`konver-glass-card rounded-2xl h-full flex flex-col overflow-hidden transition-all duration-200 relative ${
          dragActive ? 'ring-2 ring-primary ring-opacity-50 bg-primary/5' : ''
        }`}>
          {dragActive && (
            <div className="absolute inset-0 z-50 bg-primary/10 border-2 border-dashed border-primary rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <div className="text-center">
                <div className="w-16 h-16 konver-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 konver-animate-bounce">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg font-medium text-primary">Solte os arquivos aqui</p>
                <p className="text-sm text-muted-foreground">Para fazer upload na base de conhecimento</p>
              </div>
            </div>
          )}
          
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full konver-scrollbar">
              <div className="p-6 space-y-4">
                {/* Upload Progress */}
                {renderUploadProgress()}

                {/* Status Summary */}
                {renderStatusSummary()}

                {/* Filters - Collapsible */}
                {showFilters && (
                  <div className="konver-animate-slide-down">
                    <KnowledgeBaseFilters
                      searchTerm={searchTerm}
                      onSearchChange={setSearchTerm}
                      statusFilter={statusFilter}
                      onStatusFilterChange={setStatusFilter}
                      typeFilter={typeFilter}
                      onTypeFilterChange={setTypeFilter}
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSortChange={toggleSort}
                      stats={stats}
                      filteredCount={filteredAndSortedFiles.length}
                      totalCount={knowledgeFiles.length}
                      availableTypes={getAvailableTypes()}
                      searchFocused={false}
                      onSearchFocus={() => {}}
                    />
                  </div>
                )}

                {/* File List */}
                <KnowledgeBaseFileList
                  files={filteredAndSortedFiles}
                  loading={loading}
                  selectedFiles={selectedFiles}
                  onFileSelect={toggleFileSelection}
                  onPreviewFile={() => {}}
                  onDownloadFile={downloadFile}
                  onDeleteFile={handleDelete}
                  onRetryFile={handleRetryFile}
                  onBulkDelete={handleBulkDelete}
                  onBulkDownload={handleBulkDownload}
                  onClearSelection={clearSelection}
                  emptyState={emptyState}
                />
              </div>
            </ScrollArea>
          </div>

          {/* Hidden file input */}
          <input
            id="file-input"
            type="file"
            multiple
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            accept=".txt,.pdf,.json,.md,.xlsx,.csv,.docx,.doc"
            className="hidden"
          />
        </div>
      </div>

      <AlertDialog open={showHeaderDeleteDialog} onOpenChange={setShowHeaderDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão em lote</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedFiles.size} arquivo{selectedFiles.size > 1 ? 's' : ''} selecionado{selectedFiles.size > 1 ? 's' : ''}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleBulkDelete();
                setShowHeaderDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir {selectedFiles.size} arquivo{selectedFiles.size > 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}