import React, { useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import AssistantStepHeader from "@/components/AssistantStepHeader";
import KnowledgeBaseStats from "./KnowledgeBaseStats";
import KnowledgeBaseFilters, { SortField, SortDirection } from "./KnowledgeBaseFilters";
import KnowledgeBaseUpload from "./KnowledgeBaseUpload";
import KnowledgeBaseFileList from "./KnowledgeBaseFileList";
import KnowledgeBaseEmpty from "./KnowledgeBaseEmpty";
import { 
  Upload,
  Database,
  Trash2
} from "lucide-react";
import { useKnowledgeBase } from "@/hooks/useKnowledgeBase";
import { KnowledgeBaseFile } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

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
  const [searchFocused, setSearchFocused] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewFile, setPreviewFile] = useState<KnowledgeBaseFile | null>(null);

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

  // Header configuration
  const headerActions = [
    {
      label: "Enviar Arquivos",
      icon: <Upload className="w-4 h-4" />,
      onClick: () => document.getElementById('file-input')?.click(),
      disabled: uploading,
      variant: "default" as const
    },
    ...(selectedFiles.size > 0 ? [
      {
        label: `Excluir Selecionados (${selectedFiles.size})`,
        icon: <Trash2 className="w-4 h-4" />,
        onClick: handleBulkDelete,
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

  if (knowledgeFiles.length === 0 && !loading && !uploading) {
    return (
      <div className="flex flex-col h-full">
        <AssistantStepHeader
          title="Base de Conhecimento"
          description="Envie e organize fontes de conhecimento para seu assistente"
          icon={<Database className="w-5 h-5 text-white" />}
          compact={true}
          actions={[
            {
              label: "Enviar Arquivos",
              icon: <Upload className="w-4 h-4" />,
              onClick: () => document.getElementById('file-input')?.click(),
              variant: "default" as const
            }
          ]}
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
        loading={uploading}
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
              <div className="p-6 space-y-6">
                {/* Stats */}
                <KnowledgeBaseStats 
                  stats={stats}
                  loading={loading}
                />

                {/* Upload Progress Only */}
                <KnowledgeBaseUpload
                  onFileUpload={handleFileUpload}
                  uploading={uploading}
                  uploadProgress={uploadProgress}
                  dragActive={dragActive}
                  setDragActive={setDragActive}
                  showUploadArea={false}
                />

                {/* Filters */}
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
                  searchFocused={searchFocused}
                  onSearchFocus={setSearchFocused}
                />

                {/* File List */}
                <KnowledgeBaseFileList
                  files={filteredAndSortedFiles}
                  loading={loading}
                  selectedFiles={selectedFiles}
                  onFileSelect={toggleFileSelection}
                  onPreviewFile={setPreviewFile}
                  onDownloadFile={downloadFile}
                  onDeleteFile={handleDelete}
                  onRetryFile={handleRetryFile}
                  onBulkDelete={handleBulkDelete}
                  onClearSelection={clearSelection}
                  emptyState={emptyState}
                />

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
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}