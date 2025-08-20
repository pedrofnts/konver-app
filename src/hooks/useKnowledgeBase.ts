import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeBaseFile } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

export interface UseKnowledgeBaseOptions {
  botId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface KnowledgeFileStats {
  total: number;
  ready: number;
  processing: number;
  error: number;
  totalSize: number;
  uniqueTypes: number;
}

export interface FileUploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
}

export function useKnowledgeBase({ botId, autoRefresh = true, refreshInterval = 5000 }: UseKnowledgeBaseOptions) {
  const [files, setFiles] = useState<KnowledgeBaseFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Map<string, FileUploadProgress>>(new Map());
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout>();

  // Load files from database
  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('knowledge_base_files')
        .select('*')
        .eq('bot_id', botId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
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
  }, [botId, toast]);

  // Upload single file
  const uploadFile = async (file: File): Promise<boolean> => {
    try {
      setUploading(true);
      const uploadId = crypto.randomUUID();
      
      // Add to progress tracking
      setUploadProgress(prev => new Map(prev).set(uploadId, {
        fileName: file.name,
        progress: 0,
        status: 'uploading'
      }));

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error(`Erro de autenticação: ${authError.message}`);
      }
      if (!user) {
        console.error('No user found in session');
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }
      
      console.log('User authenticated:', user.id);

      // Verify bot exists and belongs to user
      const { data: bot, error: botError } = await supabase
        .from('bots')
        .select('id, user_id')
        .eq('id', botId)
        .eq('user_id', user.id)
        .single();

      if (botError || !bot) {
        console.error('Bot verification error:', botError);
        throw new Error('Bot não encontrado ou não pertence ao usuário.');
      }

      console.log('Bot verified:', bot.id);

      // Create a unique filename to prevent conflicts
      const fileId = crypto.randomUUID();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${fileId}.${fileExtension}`;
      const storagePath = fileName;

      // Update progress
      setUploadProgress(prev => new Map(prev).set(uploadId, {
        ...prev.get(uploadId)!,
        progress: 25
      }));

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('knowledge-base')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      // Update progress
      setUploadProgress(prev => new Map(prev).set(uploadId, {
        ...prev.get(uploadId)!,
        progress: 50
      }));

      // Insert file record into database
      const insertData = {
        bot_id: botId,
        user_id: user.id,
        file_name: file.name,
        file_type: file.type || 'application/octet-stream',
        file_size: file.size.toString(),
        storage_path: storagePath,
        status: 'processing',
        chunks_count: 0,
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          fileExtension: fileExtension
        }
      };
      
      console.log('Inserting file record:', insertData);
      
      const { error: dbError } = await supabase
        .from('knowledge_base_files')
        .insert(insertData);

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw new Error(`Erro ao salvar no banco: ${dbError.message}`);
      }

      // Update progress
      setUploadProgress(prev => new Map(prev).set(uploadId, {
        ...prev.get(uploadId)!,
        progress: 100,
        status: 'completed'
      }));

      toast({
        title: "Upload realizado com sucesso",
        description: `${file.name} foi enviado e está sendo processado.`,
      });

      // Remove from progress after a delay
      setTimeout(() => {
        setUploadProgress(prev => {
          const newMap = new Map(prev);
          newMap.delete(uploadId);
          return newMap;
        });
      }, 3000);

      // Refresh files list
      await loadFiles();
      return true;

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erro no upload",
        description: `Não foi possível fazer o upload do arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setUploading(false);
    }
  };

  // Upload multiple files
  const uploadFiles = async (fileList: File[]): Promise<{ successful: number; failed: number }> => {
    let successful = 0;
    let failed = 0;

    for (const file of fileList) {
      const result = await uploadFile(file);
      if (result) {
        successful++;
      } else {
        failed++;
      }
    }

    return { successful, failed };
  };

  // Delete file
  const deleteFile = async (fileId: string): Promise<boolean> => {
    try {
      // Get file info first to delete from storage
      const file = files.find(f => f.id === fileId);
      if (!file) throw new Error('File not found');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('knowledge-base')
        .remove([file.storage_path]);

      if (storageError) {
        console.warn('Storage deletion error:', storageError);
        // Continue with database deletion even if storage fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('knowledge_base_files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      toast({
        title: "Arquivo removido",
        description: "O arquivo foi removido da base de conhecimento.",
      });

      // Update local state
      setFiles(prev => prev.filter(f => f.id !== fileId));
      return true;

    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Erro",
        description: `Não foi possível remover o arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete multiple files
  const deleteFiles = async (fileIds: string[]): Promise<{ successful: number; failed: number }> => {
    let successful = 0;
    let failed = 0;

    for (const fileId of fileIds) {
      const result = await deleteFile(fileId);
      if (result) {
        successful++;
      } else {
        failed++;
      }
    }

    return { successful, failed };
  };

  // Download file
  const downloadFile = async (fileId: string): Promise<boolean> => {
    try {
      const file = files.find(f => f.id === fileId);
      if (!file) throw new Error('Arquivo não encontrado');

      // Download the file using signed URL
      const { data, error } = await supabase.storage
        .from('knowledge-base')
        .download(file.storage_path);

      if (error) throw error;

      // Create blob URL and download
      const blob = new Blob([data], { type: file.file_type });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = file.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download iniciado",
        description: `${file.file_name} está sendo baixado.`,
      });

      return true;

    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Erro no download",
        description: `Não foi possível baixar o arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
      return false;
    }
  };

  // Get file statistics
  const getStats = (): KnowledgeFileStats => {
    const total = files.length;
    const ready = files.filter(f => f.status === 'ready').length;
    const processing = files.filter(f => f.status === 'processing').length;
    const error = files.filter(f => f.status === 'error').length;
    const totalSize = files.reduce((acc, file) => acc + parseInt(file.file_size, 10), 0);
    const uniqueTypes = new Set(files.map(f => f.file_type)).size;

    return { total, ready, processing, error, totalSize, uniqueTypes };
  };

  // Validate files before upload
  const validateFiles = (fileList: FileList | File[]): { valid: File[]; invalid: File[] } => {
    const allowedTypes = ['.txt', '.pdf', '.json', '.md', '.xlsx', '.csv', '.docx', '.doc'];
    const maxSize = 50 * 1024 * 1024; // 50MB
    const fileArray = Array.from(fileList);
    const valid: File[] = [];
    const invalid: File[] = [];

    fileArray.forEach(file => {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const isValidType = allowedTypes.includes(fileExtension);
      const isValidSize = file.size <= maxSize;

      if (isValidType && isValidSize) {
        valid.push(file);
      } else {
        invalid.push(file);
      }
    });

    return { valid, invalid };
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file extension
  const getFileExtension = (fileName: string): string => {
    return fileName.split('.').pop()?.toLowerCase() || 'unknown';
  };

  // Retry processing for failed files
  const retryFile = async (fileId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('knowledge_base_files')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', fileId);

      if (error) throw error;

      toast({
        title: "Reprocessamento iniciado",
        description: "O arquivo será processado novamente.",
      });

      // Refresh files to get updated status
      await loadFiles();
      return true;

    } catch (error) {
      console.error('Error retrying file:', error);
      toast({
        title: "Erro",
        description: `Não foi possível reiniciar o processamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
      return false;
    }
  };

  // Load files on mount and when botId changes
  useEffect(() => {
    if (botId) {
      loadFiles();
    }
  }, [botId, loadFiles]);

  // Auto-refresh files if enabled - only when there are processing files
  useEffect(() => {
    if (!autoRefresh || !botId) return;

    const hasProcessingFiles = files.some(f => f.status === 'processing');
    if (!hasProcessingFiles) return;

    const interval = setInterval(() => {
      loadFiles();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, botId, loadFiles, refreshInterval, files.some(f => f.status === 'processing')]);

  return {
    files,
    loading,
    uploading,
    uploadProgress: Array.from(uploadProgress.values()),
    stats: getStats(),
    uploadFile,
    uploadFiles,
    deleteFile,
    deleteFiles,
    downloadFile,
    validateFiles,
    formatFileSize,
    getFileExtension,
    retryFile,
    refresh: loadFiles
  };
}
