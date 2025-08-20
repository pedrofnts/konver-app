import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Database,
  Upload,
  FileText,
  FolderOpen,
  Sparkles
} from "lucide-react";

interface KnowledgeBaseEmptyProps {
  onUpload: () => void;
  loading?: boolean;
  variant?: 'initial' | 'no-results' | 'error';
  title?: string;
  description?: string;
}

export default function KnowledgeBaseEmpty({
  onUpload,
  loading = false,
  variant = 'initial',
  title,
  description
}: KnowledgeBaseEmptyProps) {

  const getEmptyStateConfig = () => {
    switch (variant) {
      case 'no-results':
        return {
          icon: FolderOpen,
          title: title || 'Nenhum arquivo corresponde à sua busca',
          description: description || 'Tente ajustar os termos de busca ou filtros para encontrar o que procura.',
          buttonText: 'Limpar Filtros',
          showUploadButton: false,
          gradient: 'konver-gradient-accent'
        };
      case 'error':
        return {
          icon: Database,
          title: title || 'Não foi possível carregar os arquivos',
          description: description || 'Houve um erro ao carregar os arquivos da base de conhecimento. Tente novamente.',
          buttonText: 'Tentar Novamente',
          showUploadButton: false,
          gradient: 'bg-destructive'
        };
      case 'initial':
      default:
        return {
          icon: Database,
          title: title || 'Nenhum arquivo enviado ainda',
          description: description || 'Carregue documentos para dar ao seu assistente acesso a informações específicas. Suporta arquivos .txt, .pdf, .json, .md, .xlsx, .csv, .docx e .doc.',
          buttonText: 'Enviar Primeiro Arquivo',
          showUploadButton: true,
          gradient: 'konver-gradient-primary'
        };
    }
  };

  const config = getEmptyStateConfig();

  if (loading) {
    return (
      <Card className="konver-glass-card rounded-2xl h-full flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <div className="w-20 h-20 konver-gradient-primary rounded-3xl flex items-center justify-center mx-auto shadow-xl konver-animate-pulse">
            <Database className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-3">
            <div className="h-6 bg-muted rounded w-48 mx-auto animate-pulse" />
            <div className="h-4 bg-muted rounded w-64 mx-auto animate-pulse" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="konver-glass-card rounded-2xl h-full flex items-center justify-center">
      <div className="text-center space-y-6 p-8 max-w-md">
        <div className={`w-20 h-20 ${config.gradient} rounded-3xl flex items-center justify-center mx-auto shadow-xl konver-animate-float`}>
          <config.icon className="w-10 h-10 text-white" />
        </div>
        
        <div className="space-y-3">
          <h3 className="text-xl font-bold konver-text-gradient">
            {config.title}
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            {config.description}
          </p>
        </div>

        <div className="space-y-3">
          {config.showUploadButton && (
            <Button 
              onClick={onUpload} 
              className="konver-button-primary"
              size="lg"
            >
              <Upload className="w-4 h-4 mr-2" />
              {config.buttonText}
            </Button>
          )}
          
          {variant === 'initial' && (
            <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <FileText className="w-3 h-3" />
                <span>Documentos</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Processamento IA</span>
              </div>
              <span>•</span>
              <span>Máx 50MB</span>
            </div>
          )}
        </div>

        {variant === 'initial' && (
          <div className="mt-6 p-4 bg-primary/5 border border-primary/10 rounded-xl text-sm text-muted-foreground">
            <p className="font-medium text-primary mb-1">Dica:</p>
            <p>Carregue vários arquivos de uma vez selecionando todos ou usando arrastar e soltar. Seu assistente irá processá-los automaticamente.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
