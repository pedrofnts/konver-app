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

  // Simplified component - just the essential upload functionality
  // Drag and drop is now handled by the parent component
  
  return (
    <>
      {/* Upload Progress - Only show when actually uploading */}
      {(uploading || uploadProgress.length > 0) && (
        <div className="space-y-3">
          {uploadProgress.map((progress, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate flex-1 mr-4">{progress.fileName}</p>
                <div className="text-right">
                  <p className="text-sm font-medium">{progress.progress}%</p>
                  <p className="text-xs text-muted-foreground capitalize">{progress.status}</p>
                </div>
              </div>
              <Progress value={progress.progress} className="h-2" />
              {progress.status === 'error' && (
                <div className="flex items-center space-x-2 text-destructive text-xs">
                  <AlertCircle className="w-4 h-4" />
                  <span>Falha no upload</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Area - Simplified */}
      {showUploadArea && (
        <div
          className="border-2 border-dashed border-muted/50 rounded-xl p-6 text-center transition-all duration-200 cursor-pointer hover:border-primary/50 hover:bg-primary/5"
          onClick={triggerFileUpload}
        >
          <div className="space-y-3">
            <div className="w-12 h-12 konver-gradient-accent rounded-xl flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-medium text-sm mb-1">
                Clique para enviar arquivos ou arraste aqui
              </p>
              <p className="text-xs text-muted-foreground">
                .txt, .pdf, .json, .md, .xlsx, .csv, .docx, .doc • Máx 50MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Button (for header action) */}
      {!showUploadArea && (
        <Button 
          onClick={triggerFileUpload}
          disabled={uploading}
          className="konver-button-primary"
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
    </>
  );
}
