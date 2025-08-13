import React, { useRef, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { CardHeader } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Download, Trash2, Database, Loader2, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/integrations/supabase/types";

type KnowledgeBaseFile = Tables<"knowledge_base_files">;

interface AssistantKnowledgeTabProps {
  botId: string;
}

export default function AssistantKnowledgeTab({
  botId
}: AssistantKnowledgeTabProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState<string>("");
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeBaseFile[]>([]);
  const [loading, setLoading] = useState(true);

  // Load knowledge base files from database
  const loadKnowledgeFiles = async () => {
    if (!user || !botId) return;
    
    try {
      const { data, error } = await supabase
        .from('knowledge_base_files')
        .select('*')
        .eq('bot_id', botId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setKnowledgeFiles(data || []);
    } catch (error) {
      console.error('Error loading knowledge files:', error);
      toast({
        title: "Erro ao carregar arquivos",
        description: "Não foi possível carregar os arquivos da base de conhecimento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKnowledgeFiles();
  }, [user, botId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    setUploadProgress(0);
    setCurrentOperation("Validando arquivo...");

    try {
      // Validate file type and size
      if (!['text/plain', 'application/pdf', 'application/json', 'text/markdown', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'application/vnd.ms-excel'].includes(file.type)) {
        throw new Error('Tipo de arquivo não suportado. Por favor, envie arquivos .txt, .pdf, .json, .md, .xlsx ou .csv');
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Arquivo muito grande. O limite é de 10MB');
      }

      setCurrentOperation("Enviando arquivo para o storage...");
      setUploadProgress(30);

      // Generate unique file ID
      const file_id = crypto.randomUUID();

      // Create file path with user ID and bot ID
      const filePath = `${user.id}/${botId}/${file_id}/${file.name}`;

      // Upload to Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('knowledge-base')
        .upload(filePath, file);

      if (storageError) {
        throw storageError;
      }

      setCurrentOperation("Adicionando arquivo à base de conhecimento...");
      setUploadProgress(70);

      // Add file to knowledge_base_files table with in_progress status
      const { data: fileData, error: dbError } = await supabase
        .from('knowledge_base_files')
        .insert({
          id: file_id,
          bot_id: botId,
          user_id: user.id,
          file_name: file.name,
          file_type: file.type.split('/')[1] || 'unknown',
          file_size: `${(file.size / 1024).toFixed(1)} KB`,
          storage_path: storageData.path,
          chunks_count: 0,
          status: 'in_progress',
          metadata: {
            original_size: file.size,
            mime_type: file.type,
            uploaded_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      setCurrentOperation("Finalizando...");
      setUploadProgress(100);

      // Reload files from database
      await loadKnowledgeFiles();

      toast({
        title: "Arquivo enviado com sucesso",
        description: "O documento foi adicionado à base de conhecimento e será processado em breve pelo N8N.",
      });

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erro ao enviar arquivo",
        description: error instanceof Error ? error.message : "Erro desconhecido ao enviar arquivo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentOperation("");
      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = async (file: KnowledgeBaseFile) => {
    if (!user) return;
    
    setIsRemoving(file.id);

    try {
      // Remove from Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('knowledge-base')
        .remove([file.storage_path]);

      if (storageError) {
        console.warn('Error removing from storage:', storageError);
      }

      // Remove from database
      const { error: dbError } = await supabase
        .from('knowledge_base_files')
        .delete()
        .eq('id', file.id)
        .eq('user_id', user.id);

      if (dbError) {
        throw dbError;
      }

      // Reload files
      await loadKnowledgeFiles();

      toast({
        title: "Arquivo removido",
        description: "O documento foi removido da base de conhecimento",
      });

    } catch (error) {
      console.error('Error removing file:', error);
      toast({
        title: "Erro ao remover arquivo",
        description: error instanceof Error ? error.message : "Erro desconhecido ao remover arquivo",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Processando
          </Badge>
        );
      case 'ready':
        return (
          <Badge variant="default" className="flex items-center gap-1 konver-status-success">
            <CheckCircle className="w-3 h-3" />
            Pronto
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Erro
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="konver-animate-in">
        <div className="konver-card-feature">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center space-x-3 text-xl">
              <div className="w-10 h-10 konver-gradient-primary rounded-xl flex items-center justify-center shadow-md konver-animate-float">
                <Database className="w-5 h-5 text-white" />
              </div>
              <span className="konver-text-gradient">
                Knowledge Base
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </div>
      </div>
    );
  }

  return (
    <div className="konver-animate-in">
      <div className="konver-card-feature">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-3 text-xl">
              <div className="w-10 h-10 konver-gradient-primary rounded-xl flex items-center justify-center shadow-md konver-animate-float">
                <Database className="w-5 h-5 text-white" />
              </div>
              <span className="konver-text-gradient">
                Knowledge Base
              </span>
            </CardTitle>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.pdf,.json,.md,.xlsx,.csv"
              className="hidden"
              disabled={isUploading}
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              className="konver-button-primary h-11 px-6 rounded-xl"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </>
              )}
            </Button>
          </div>
        {isUploading && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{currentOperation}</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {knowledgeFiles.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 konver-gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl konver-animate-float">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">No files uploaded</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
              Upload documents to give your assistant access to specific information. 
              Supports .txt, .pdf, .json, .md, .xlsx and .csv files.
              Files will be automatically processed by N8N.
            </p>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              className="konver-button-primary h-12 px-8 rounded-xl"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload First File
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {knowledgeFiles.map((file) => (
              <div key={file.id} className="konver-card-interactive p-5 border border-border rounded-xl bg-gradient-to-r from-background/50 to-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 konver-gradient-primary rounded-xl flex items-center justify-center shadow-md">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-base">{file.file_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">
                          {file.file_type.toUpperCase()} • {file.file_size}
                        </p>
                        {getStatusBadge(file.status)}
                      </div>
                      {file.chunks_count > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {file.chunks_count} sections processed
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveFile(file)} 
                      className="h-10 w-10 rounded-xl konver-hover-subtle hover:bg-destructive/10"
                      disabled={isRemoving === file.id}
                    >
                      {isRemoving === file.id ? (
                        <Loader2 className="w-4 h-4 text-destructive animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </div>
  </div>
);
} 