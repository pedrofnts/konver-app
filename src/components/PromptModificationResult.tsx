import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  Clock, 
  Copy, 
  RefreshCw,
  AlertCircle,
  Sparkles,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PromptModificationResult {
  id: string;
  originalPrompt: string;
  modifiedPrompt: string;
  changes: string[];
  status: 'processing' | 'completed' | 'failed';
  createdAt: Date;
  modificationGoal: string;
  priority: 'low' | 'medium' | 'high';
}

interface PromptModificationResultProps {
  results: PromptModificationResult[];
  onApplyPrompt: (modifiedPrompt: string) => void;
  onRetryRequest: (resultId: string) => void;
}

export default function PromptModificationResult({ 
  results, 
  onApplyPrompt, 
  onRetryRequest 
}: PromptModificationResultProps) {
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado!",
        description: "Prompt copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o prompt.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (results.length === 0) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60 shadow-xl rounded-2xl">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-purple-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Nenhuma modificação solicitada</h3>
          <p className="text-slate-600">
            Use o assistente de modificação de prompt para solicitar melhorias no seu prompt.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-800">Modificações de Prompt</h3>
        <Badge variant="secondary" className="px-3 py-1">
                            {results.length} {results.length === 1 ? 'solicitação' : 'solicitações'}
        </Badge>
      </div>

      <div className="space-y-4">
        {results.map((result) => (
          <Card key={result.id} className="bg-white/90 backdrop-blur-sm border-slate-200/60 shadow-lg rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-3 text-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-slate-800 truncate max-w-md">
                    {result.modificationGoal}
                  </span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={`px-2 py-1 text-xs font-medium border ${getPriorityColor(result.priority)}`}>
                    {result.priority === 'high' ? 'Alta' : result.priority === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                  <Badge className={`px-2 py-1 text-xs font-medium border ${getStatusColor(result.status)}`}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(result.status)}
                      <span>
                        {result.status === 'processing' ? 'Processando' : 
                         result.status === 'completed' ? 'Concluído' : 'Falhou'}
                      </span>
                    </div>
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                Solicitado em {result.createdAt.toLocaleString('pt-BR')}
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {result.status === 'completed' && (
                <>
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-800">Prompt Modificado:</h4>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {result.modifiedPrompt}
                      </p>
                    </div>
                  </div>

                  {result.changes && result.changes.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h4 className="font-medium text-slate-800">Principais Mudanças:</h4>
                        <ul className="space-y-2">
                          {result.changes.map((change, index) => (
                            <li key={index} className="flex items-start space-x-2 text-sm text-slate-600">
                              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{change}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(result.modifiedPrompt)}
                        className="h-9 px-3 rounded-lg"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar
                      </Button>
                    </div>
                    
                    <Button
                      onClick={() => onApplyPrompt(result.modifiedPrompt)}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white h-9 px-4 rounded-lg shadow-sm"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Aplicar Prompt
                    </Button>
                  </div>
                </>
              )}

              {result.status === 'processing' && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-slate-600">Processando modificação...</span>
                  </div>
                </div>
              )}

              {result.status === 'failed' && (
                <div className="space-y-4">
                  <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <p className="text-sm text-red-700">
                        Ocorreu um erro ao processar sua solicitação. Tente novamente.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => onRetryRequest(result.id)}
                      className="h-9 px-4 rounded-lg border-red-200 text-red-700 hover:bg-red-50"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Tentar Novamente
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 