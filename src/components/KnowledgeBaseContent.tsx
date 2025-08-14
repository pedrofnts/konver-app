import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import AssistantStepHeader from "@/components/AssistantStepHeader";
import AssistantStepContent from "@/components/AssistantStepContent";
import { 
  FileText, 
  Upload, 
  Trash2, 
  Download, 
  AlertCircle,
  Search,
  Filter,
  Files,
  HardDrive,
  CheckCircle2,
  Clock,
  X,
  RefreshCw,
  Eye,
  Calendar,
  Layers,
  Sparkles,
  Plus,
  FileImage,
  FileSpreadsheet,
  FileCode,
  Archive,
  MoreHorizontal,
  ArrowUpDown,
  Database
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface KnowledgeFile {
  id: string;
  name: string;
  size: number;
  type: string;
  upload_date: string;
  status: 'processing' | 'ready' | 'error';
  url?: string;
  file_extension?: string;
  content_preview?: string;
}

interface KnowledgeBaseContentProps {
  assistantId: string;
  onUpload?: () => void;
}

type SortField = 'name' | 'size' | 'upload_date' | 'status';
type SortDirection = 'asc' | 'desc';

export default function KnowledgeBaseContent({ assistantId, onUpload }: KnowledgeBaseContentProps) {
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('upload_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewFile, setPreviewFile] = useState<KnowledgeFile | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const loadKnowledgeFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('knowledge_files')
        .select('*')
        .eq('assistant_id', assistantId)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      const processedFiles = (data || []).map(file => ({
        ...file,
        file_extension: file.name.split('.').pop()?.toLowerCase() || 'unknown'
      }));
      setKnowledgeFiles(processedFiles);
    } catch (error) {
      console.error('Error loading knowledge files:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar arquivos da base de conhecimento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKnowledgeFiles();
  }, [assistantId]);

  const validateFiles = (files: FileList | File[]): { valid: File[], invalid: File[] } => {
    const allowedTypes = ['.txt', '.pdf', '.json', '.md', '.xlsx', '.csv'];
    const maxSize = 50 * 1024 * 1024; // 50MB
    const fileArray = Array.from(files);
    const valid: File[] = [];
    const invalid: File[] = [];

    fileArray.forEach(file => {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedTypes.includes(fileExtension)) {
        invalid.push(file);
      } else if (file.size > maxSize) {
        invalid.push(file);
      } else {
        valid.push(file);
      }
    });

    return { valid, invalid };
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const { valid, invalid } = validateFiles(files);

    if (invalid.length > 0) {
      toast({
        title: "Arquivos inválidos",
        description: `${invalid.length} arquivo(s) foram rejeitados. Apenas .txt, .pdf, .json, .md, .xlsx e .csv até 50MB são permitidos.`,
        variant: "destructive",
      });
    }

    if (valid.length === 0) return;

    if (valid.length === 1) {
      await uploadSingleFile(valid[0]);
    } else {
      await uploadMultipleFiles(valid);
    }
  };

  const uploadSingleFile = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const fileData = new FormData();
      fileData.append('file', file);
      fileData.append('assistantId', assistantId);

      const { data, error } = await supabase.functions.invoke('upload-knowledge-file', {
        body: fileData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) throw error;

      toast({
        title: "Upload realizado com sucesso",
        description: `${file.name} foi enviado e está sendo processado.`,
      });

      loadKnowledgeFiles();
      if (onUpload) onUpload();

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer o upload do arquivo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const uploadMultipleFiles = async (files: File[]) => {
    setBulkUploading(true);
    setUploadQueue(files);
    
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress((i / files.length) * 100);
      
      try {
        const fileData = new FormData();
        fileData.append('file', file);
        fileData.append('assistantId', assistantId);

        const { data, error } = await supabase.functions.invoke('upload-knowledge-file', {
          body: fileData
        });

        if (error) throw error;
        successful++;
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        failed++;
      }
    }

    setUploadProgress(100);
    
    toast({
      title: successful > 0 ? "Upload concluído" : "Erro no upload",
      description: `${successful} arquivo(s) enviado(s) com sucesso${failed > 0 ? `, ${failed} falharam` : ''}.`,
      variant: failed > 0 && successful === 0 ? "destructive" : "default",
    });

    setBulkUploading(false);
    setUploadQueue([]);
    setUploadProgress(0);
    loadKnowledgeFiles();
    if (onUpload) onUpload();
  };

  const handleDelete = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from('knowledge_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      setKnowledgeFiles(prev => prev.filter(file => file.id !== fileId));
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
      
      toast({
        title: "Arquivo removido",
        description: "O arquivo foi removido da base de conhecimento.",
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o arquivo.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;
    
    try {
      const { error } = await supabase
        .from('knowledge_files')
        .delete()
        .in('id', Array.from(selectedFiles));

      if (error) throw error;

      setKnowledgeFiles(prev => prev.filter(file => !selectedFiles.has(file.id)));
      setSelectedFiles(new Set());
      
      toast({
        title: "Arquivos removidos",
        description: `${selectedFiles.size} arquivo(s) removido(s) da base de conhecimento.`,
      });
    } catch (error) {
      console.error('Error deleting files:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover os arquivos.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (extension: string) => {
    switch (extension) {
      case 'pdf': return FileText;
      case 'txt': case 'md': return FileText;
      case 'json': return FileCode;
      case 'xlsx': case 'csv': return FileSpreadsheet;
      case 'jpg': case 'jpeg': case 'png': case 'gif': return FileImage;
      default: return Files;
    }
  };

  const getFileTypeColor = (extension: string) => {
    switch (extension) {
      case 'pdf': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'txt': case 'md': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'json': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'xlsx': case 'csv': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'jpg': case 'jpeg': case 'png': case 'gif': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ready': 
        return {
          color: 'konver-status-success',
          icon: CheckCircle2,
          label: 'Pronto',
          description: 'Arquivo processado'
        };
      case 'processing': 
        return {
          color: 'konver-status-warning',
          icon: Clock,
          label: 'Processando',
          description: 'Sendo processado'
        };
      case 'error': 
        return {
          color: 'konver-status-error',
          icon: AlertCircle,
          label: 'Erro',
          description: 'Erro no processamento'
        };
      default: 
        return {
          color: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
          icon: AlertCircle,
          label: 'Indefinido',
          description: 'Status não definido'
        };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-success/10 text-success border-success/20';
      case 'processing': return 'bg-warning/10 text-warning border-warning/20';
      case 'error': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ready': return 'Pronto';
      case 'processing': return 'Processando';
      case 'error': return 'Erro';
      default: return 'Indefinido';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Drag and Drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, []);

  // Filtering and Sorting
  const filteredAndSortedFiles = knowledgeFiles
    .filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || file.status === statusFilter;
      const matchesType = typeFilter === 'all' || file.file_extension === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'upload_date':
          comparison = new Date(a.upload_date).getTime() - new Date(b.upload_date).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
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

  const getFileStats = () => {
    const total = knowledgeFiles.length;
    const ready = knowledgeFiles.filter(f => f.status === 'ready').length;
    const processing = knowledgeFiles.filter(f => f.status === 'processing').length;
    const error = knowledgeFiles.filter(f => f.status === 'error').length;
    const totalSize = knowledgeFiles.reduce((acc, file) => acc + file.size, 0);
    const uniqueTypes = new Set(knowledgeFiles.map(f => f.file_extension)).size;
    return { total, ready, processing, error, totalSize, uniqueTypes };
  };

  const stats = getFileStats();

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const fileDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - fileDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d`;
    return fileDate.toLocaleDateString('pt-BR');
  };

  const getFileIconComponent = (extension: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      pdf: <FileText className="w-6 h-6 text-white" />,
      txt: <FileText className="w-6 h-6 text-white" />,
      md: <FileText className="w-6 h-6 text-white" />,
      json: <FileCode className="w-6 h-6 text-white" />,
      xlsx: <FileSpreadsheet className="w-6 h-6 text-white" />,
      csv: <FileSpreadsheet className="w-6 h-6 text-white" />,
      unknown: <FileText className="w-6 h-6" />
    };
    return iconMap[extension] || iconMap.unknown;
  };

  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      ready: <CheckCircle2 className="w-3 h-3 mr-1" />,
      processing: <Clock className="w-3 h-3 mr-1 konver-animate-spin" />,
      error: <AlertCircle className="w-3 h-3 mr-1" />
    };
    return iconMap[status] || null;
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

  const handleBulkDeleteFiles = async () => {
    if (selectedFiles.size === 0) return;
    
    const filesToDelete = Array.from(selectedFiles);
    try {
      await Promise.all(filesToDelete.map(fileId => handleDelete(fileId)));
      setSelectedFiles(new Set());
      toast({
        title: "Files deleted",
        description: `${filesToDelete.length} file(s) were successfully deleted.`,
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Some files could not be deleted.",
        variant: "destructive",
      });
    }
  };

  const handleRetryFile = async (fileId: string) => {
    // In a real implementation, this would retry the processing
    toast({
      title: "Retry initiated",
      description: "File processing will be retried.",
    });
  };

  const FileSkeleton = () => (
    <div className="p-4 space-y-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="konver-card p-4 konver-animate-shimmer">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3">
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
              <Skeleton className="h-6 w-16" />
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Header configuration
  const headerActions = [
    {
      label: "Upload Files",
      icon: <Upload className="w-4 h-4" />,
      onClick: triggerFileUpload,
      disabled: uploading || bulkUploading,
      variant: "default" as const
    },
    ...(selectedFiles.size > 0 ? [
      {
        label: `Delete Selected (${selectedFiles.size})`,
        icon: <Trash2 className="w-4 h-4" />,
        onClick: handleBulkDeleteFiles,
        variant: "destructive" as const
      }
    ] : [])
  ];

  const headerMetrics = [
    {
      label: "Total Files",
      value: stats.total.toString(),
      icon: <Files className="w-4 h-4" />,
      color: "primary" as const
    },
    {
      label: "Ready",
      value: stats.ready.toString(),
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: "success" as const
    },
    {
      label: "Total Size",
      value: formatFileSize(stats.totalSize),
      icon: <HardDrive className="w-4 h-4" />,
      color: "accent" as const
    }
  ];

  if (knowledgeFiles.length === 0 && !loading && !uploading) {
    return (
      <div className="flex flex-col h-full">
        <AssistantStepHeader
          title="Knowledge Base"
          description="Upload and organize knowledge sources for your assistant"
          icon={<Database className="w-5 h-5 text-white" />}
          compact={true}
          actions={[
            {
              label: "Upload Files",
              icon: <Upload className="w-4 h-4" />,
              onClick: triggerFileUpload,
              variant: "default" as const
            }
          ]}
          className="flex-shrink-0 shadow-none border-0 bg-transparent backdrop-blur-none"
        />
        
        <div className="flex-1 min-h-0 mt-4">
          <div className="konver-glass-card rounded-2xl h-full flex items-center justify-center">
            <div className="text-center space-y-6 p-8">
              <div className="konver-gradient-primary w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                <Database className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold konver-text-gradient">No files uploaded</h3>
                <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Upload documents to give your assistant access to specific information. Supports .txt, .pdf, .json, .md, .xlsx and .csv files.
                </p>
              </div>
              <Button onClick={triggerFileUpload} className="konver-button-primary">
                <Upload className="w-4 h-4 mr-2" />
                Upload First File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                accept=".txt,.pdf,.json,.md,.xlsx,.csv"
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <AssistantStepHeader
        title="Knowledge Base"
        description="Upload and organize knowledge sources for your assistant"
        icon={<Database className="w-5 h-5 text-white" />}
        compact={true}
        actions={headerActions}
        metrics={headerMetrics}
        loading={uploading || bulkUploading}
        className="flex-shrink-0 shadow-none border-0 bg-transparent backdrop-blur-none"
      />

      <div className="flex-1 min-h-0 mt-4">
        <div className="konver-glass-card rounded-2xl h-full flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full konver-scrollbar">
              <div className="p-6 space-y-6">
              <div className="space-y-6">

            {/* Upload Progress */}
            {(uploading || bulkUploading) && (
              <div className="konver-glass-card p-4 konver-animate-slide-down">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 konver-gradient-accent rounded-lg flex items-center justify-center">
                      <Upload className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Uploading files...</p>
                      <p className="text-xs text-muted-foreground">
                        {bulkUploading ? `${uploadQueue.length} files in queue` : 'Single file upload'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{uploadProgress}%</p>
                    <p className="text-xs text-muted-foreground">Complete</p>
                  </div>
                </div>
                <Progress value={uploadProgress} className="h-2 konver-animate-pulse" />
              </div>
            )}

            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${
                    searchFocused ? 'text-primary konver-animate-glow-pulse' : 'text-muted-foreground'
                  }`} />
                  <Input
                    placeholder="Search files by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    className="pl-10 konver-input-focus"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0">
                  {['all', 'ready', 'processing', 'error'].map((status) => {
                    const count = status === 'all' ? stats.total : stats[status as keyof typeof stats] as number;
                    return (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                          statusFilter === status
                            ? 'konver-gradient-primary text-white shadow-lg konver-animate-bounce'
                            : 'bg-muted/50 text-muted-foreground konver-hover-subtle'
                        }`}
                      >
                        {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {(searchTerm || statusFilter !== 'all' || selectedFiles.size > 0) && (
                <div className="flex items-center justify-between py-2">
                  <p className="text-sm text-muted-foreground">
                    {searchTerm && `Search: "${searchTerm}" • `}
                    {statusFilter !== 'all' && `Status: ${statusFilter} • `}
                    Showing {filteredAndSortedFiles.length} of {knowledgeFiles.length} files
                  </p>
                  {(searchTerm || statusFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                      }}
                      className="text-xs text-primary konver-hover-subtle px-2 py-1 rounded"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Drag & Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 ${
                dragActive
                  ? 'border-primary bg-primary/5 konver-animate-pulse'
                  : 'border-border konver-hover-subtle'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                  handleFileUpload(files);
                }
              }}
              onClick={triggerFileUpload}
            >
              <div className="space-y-3">
                <div className="w-16 h-16 konver-gradient-accent rounded-2xl flex items-center justify-center mx-auto shadow-lg konver-animate-float">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm mb-1">
                    Drag & drop files here or <span className="text-primary underline cursor-pointer">browse</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports: .txt, .pdf, .json, .md, .xlsx, .csv • Max 50MB each
                  </p>
                </div>
              </div>
            </div>

            {/* Files List */}
            {loading ? (
              <FileSkeleton />
            ) : filteredAndSortedFiles.length === 0 ? (
              <div className="text-center py-12 konver-glass-card">
                <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium mb-2">No files found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Upload your first file to get started'}
                </p>
                {(searchTerm || statusFilter !== 'all') && (
                  <Button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredAndSortedFiles.map((file, index) => (
              <div
                key={file.id}
                className="konver-glass-card p-4 konver-hover-subtle konver-animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={selectedFiles.has(file.id)}
                      onCheckedChange={() => toggleFileSelection(file.id)}
                      className="mr-3"
                    />
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                      file.status === 'ready' ? 'konver-gradient-primary' :
                      file.status === 'processing' ? 'bg-warning/20 text-warning' :
                      'bg-destructive/20 text-destructive'
                    }`}>
                      {getFileIconComponent(file.file_extension || 'unknown')}
                    </div>
                  </div>
                  
                  <Badge className={`text-xs konver-animate-bounce ${getStatusColor(file.status)}`}>
                    {getStatusIcon(file.status)}
                    {getStatusLabel(file.status)}
                  </Badge>
                </div>
                
                <div className="mb-3">
                  <h4 className="font-medium text-sm truncate mb-1" title={file.name}>
                    {file.name}
                  </h4>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>{file.file_extension?.toUpperCase()}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(file.upload_date)}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {file.status === 'ready' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewFile(file)}
                          className="konver-hover-subtle"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {file.url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(file.url, '_blank')}
                            className="konver-hover-subtle"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </>
                    )}
                    {file.status === 'processing' && (
                      <div className="flex items-center space-x-2 text-warning">
                        <Clock className="w-4 h-4 konver-animate-spin" />
                        <span className="text-xs">Processing...</span>
                      </div>
                    )}
                    {file.status === 'error' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRetryFile(file.id)}
                        className="text-warning hover:text-warning konver-hover-subtle"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(file.id)}
                    className="text-destructive hover:text-destructive konver-hover-subtle"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                {file.status === 'error' && (
                  <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive flex items-center konver-animate-bounce">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Processing failed. Click retry to try again.
                  </div>
                )}
              </div>
                  ))}
                </div>

                {/* Bulk Actions */}
                {selectedFiles.size > 0 && (
                  <div className="p-3 konver-glass-card border-t konver-animate-slide-up">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {selectedFiles.size} file{selectedFiles.size > 1 ? 's' : ''} selected
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedFiles(new Set())}
                        >
                          Clear Selection
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleBulkDeleteFiles}
                          className="konver-button-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete Selected
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              accept=".txt,.pdf,.json,.md,.xlsx,.csv"
              className="hidden"
            />
              </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}

