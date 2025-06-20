import React, { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { CardHeader } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Download, Trash2, Database, Loader2 } from "lucide-react";
import { KnowledgeFile } from "@/types/assistant";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";

interface AssistantKnowledgeTabProps {
  knowledgeFiles: KnowledgeFile[];
  addKnowledgeFile: (file: KnowledgeFile) => void;
  removeKnowledgeFile: (index: number) => void;
  botId: string;
}

export default function AssistantKnowledgeTab({
  knowledgeFiles,
  addKnowledgeFile,
  removeKnowledgeFile,
  botId
}: AssistantKnowledgeTabProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState<string>("");
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    setUploadProgress(0);
    setCurrentOperation("Validando arquivo...");

    try {
      // Validate file type and size
      if (!['text/plain', 'application/pdf', 'application/json'].includes(file.type)) {
        throw new Error('Tipo de arquivo não suportado. Por favor, envie arquivos .txt, .pdf ou .json');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Arquivo muito grande. O limite é de 5MB');
      }

      setCurrentOperation("Lendo conteúdo do arquivo...");
      setUploadProgress(20);

      // Read file content
      const content = await file.text();

      // Generate unique file ID
      const file_id = crypto.randomUUID();

      // Create file path with user ID
      const filePath = `${user.id}/${file_id}/${file.name}`;

      setCurrentOperation("Enviando arquivo para o storage...");
      setUploadProgress(40);

      // Upload to Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('knowledge-base')
        .upload(filePath, file);

      if (storageError) {
        throw storageError;
      }

      setCurrentOperation("Processando conteúdo e gerando embeddings...");
      setUploadProgress(60);

      // Process with Edge Function
      const { data: processingData, error: processingError } = await supabase.functions
        .invoke('manage-knowledge-base', {
          body: {
            action: 'upload',
            file_data: {
              content,
              metadata: {
                name: file.name,
                type: file.type,
                size: file.size,
                path: storageData.path,
                user_id: user.id,
                file_id
              }
            },
            file_id
          }
        });

      if (processingError) {
        throw processingError;
      }

      setCurrentOperation("Finalizando...");
      setUploadProgress(90);

      // Add to local state
      const newFile: KnowledgeFile = {
        id: file_id,
        name: file.name,
        type: file.type.split('/')[1],
        size: `${(file.size / 1024).toFixed(1)} KB`,
        path: storageData.path
      };

      // Add to local state
      addKnowledgeFile(newFile);

      // Save changes to database
      const { error: dbError } = await supabase
        .from('bots')
        .update({
          knowledge_base: knowledgeFiles.concat([newFile]) as any
        })
        .eq('id', botId);

      if (dbError) {
        throw dbError;
      }

      setUploadProgress(100);

      toast({
        title: "Arquivo enviado com sucesso",
        description: `O documento foi adicionado à base de conhecimento. ${processingData?.chunks_processed || 0} seções processadas.`,
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

  const handleRemoveFile = async (index: number, file: KnowledgeFile) => {
    if (!user) return;
    
    setIsRemoving(file.id);

    try {
      // Remove from Qdrant via Edge Function
      const { error: processingError } = await supabase.functions
        .invoke('manage-knowledge-base', {
          body: {
            action: 'delete',
            file_id: file.id
          }
        });

      if (processingError) {
        throw processingError;
      }

      // Remove from Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('knowledge-base')
        .remove([`${user.id}/${file.id}/${file.name}`]);

      if (storageError) {
        throw storageError;
      }

      // Remove from local state
      removeKnowledgeFile(index);

      // Update database
      const updatedFiles = knowledgeFiles.filter((_, i) => i !== index);
      const { error: dbError } = await supabase
        .from('bots')
        .update({
          knowledge_base: updatedFiles as any
        })
        .eq('id', botId);

      if (dbError) {
        throw dbError;
      }

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

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60 shadow-xl rounded-2xl">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Base de Conhecimento
            </span>
          </CardTitle>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".txt,.pdf,.json"
            className="hidden"
            disabled={isUploading}
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-11 px-6 rounded-xl shadow-lg"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Fazer Upload
              </>
            )}
          </Button>
        </div>
        {isUploading && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
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
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">Nenhum arquivo carregado</h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Faça upload de documentos para que o assistente tenha acesso a informações específicas
            </p>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-12 px-8 rounded-xl shadow-lg"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Fazer Primeiro Upload
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {knowledgeFiles.map((file, index) => (
              <div key={file.id} className="flex items-center justify-between p-5 border border-slate-200/60 rounded-xl bg-gradient-to-r from-slate-50/50 to-emerald-50/30 hover:shadow-md transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-base">{file.name}</p>
                    <p className="text-sm text-slate-500">{file.type.toUpperCase()} • {file.size}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="h-10 w-10 rounded-xl hover:bg-emerald-100">
                    <Download className="w-4 h-4 text-emerald-600" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRemoveFile(index, file)} 
                    className="h-10 w-10 rounded-xl hover:bg-red-100"
                    disabled={isRemoving === file.id}
                  >
                    {isRemoving === file.id ? (
                      <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-red-500" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 