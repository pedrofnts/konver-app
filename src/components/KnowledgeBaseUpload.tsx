import React, { useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { 
  Upload, 
  FileText,
  X,
  AlertCircle
} from "lucide-react";
import { FileUploadProgress } from "@/hooks/useKnowledgeBase";

interface KnowledgeBaseUploadProps {
  // Upload functions
  onFileUpload: (files: FileList | File[]) => void;
  
  // Upload state
  uploading: boolean;
  uploadProgress: FileUploadProgress[];
  
  // Drag and drop state
  dragActive: boolean;
  setDragActive: (active: boolean) => void;
  
  // Show upload area
  showUploadArea?: boolean;
  compact?: boolean;
}

export default function KnowledgeBaseUpload({
  onFileUpload,
  uploading,
  uploadProgress,
  dragActive,
  setDragActive,
  showUploadArea = true,
  compact = false
}: KnowledgeBaseUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  }, [setDragActive]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files);
    }
  }, [onFileUpload, setDragActive]);

  return (
    <div className="space-y-6">
      {/* Upload Progress */}
      {(uploading || uploadProgress.length > 0) && (
        <Card className="p-4 konver-glass-card konver-animate-slide-down">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 konver-gradient-accent rounded-lg flex items-center justify-center">
                  <Upload className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm">Enviando arquivos...</p>
                  <p className="text-xs text-muted-foreground">
                    {uploadProgress.length > 1 ? `${uploadProgress.length} arquivos na fila` : 'Upload único'}
                  </p>
                </div>
              </div>
            </div>
            
            {uploadProgress.map((progress, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate flex-1 mr-4">{progress.fileName}</p>
                  <div className="text-right">
                    <p className="text-sm font-medium">{progress.progress}%</p>
                    <p className="text-xs text-muted-foreground capitalize">{progress.status}</p>
                  </div>
                </div>
                <Progress value={progress.progress} className="h-2 konver-animate-pulse" />
                {progress.status === 'error' && (
                  <div className="flex items-center space-x-2 text-destructive text-xs">
                    <AlertCircle className="w-4 h-4" />
                    <span>Falha no upload</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Upload Area */}
      {showUploadArea && (
        <div
          className={`border-2 border-dashed rounded-2xl text-center transition-all duration-200 cursor-pointer ${
            compact ? 'p-4' : 'p-6'
          } ${
            dragActive
              ? 'border-primary bg-primary/5 konver-animate-pulse'
              : 'border-border konver-hover-subtle'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileUpload}
        >
          <div className={`space-y-3 ${compact ? 'space-y-2' : ''}`}>
            <div className={`konver-gradient-accent rounded-2xl flex items-center justify-center mx-auto shadow-lg konver-animate-float ${
              compact ? 'w-12 h-12' : 'w-16 h-16'
            }`}>
              <Upload className={`text-white ${compact ? 'w-6 h-6' : 'w-8 h-8'}`} />
            </div>
            <div>
              <p className={`font-medium mb-1 ${compact ? 'text-xs' : 'text-sm'}`}>
                Arraste arquivos aqui ou <span className="text-primary underline cursor-pointer">navegue</span>
              </p>
              <p className={`text-muted-foreground ${compact ? 'text-xs' : 'text-xs'}`}>
                Suporta: .txt, .pdf, .json, .md, .xlsx, .csv, .docx, .doc • Máx 50MB cada
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Button (for cases without upload area) */}
      {!showUploadArea && (
        <Button 
          onClick={triggerFileUpload}
          disabled={uploading}
          className="konver-button-primary w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Enviando...' : 'Enviar Arquivos'}
        </Button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => e.target.files && onFileUpload(e.target.files)}
        accept=".txt,.pdf,.json,.md,.xlsx,.csv,.docx,.doc"
        className="hidden"
      />
    </div>
  );
}
