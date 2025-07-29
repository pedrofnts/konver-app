import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Save, 
  History, 
  Plus, 
  RotateCcw, 
  Eye, 
  CheckCircle, 
  Clock,
  GitBranch,
  Zap,
  Shield,
  Brain,
  ChevronDown,
  ChevronUp,
  Maximize2,
  FileText,
  Calendar,
  Tag
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { PromptVersion, PromptType, CreatePromptVersionRequest, PromptVersionSummary } from "@/integrations/supabase/types";

interface PromptManagerProps {
  botId: string;
  onPromptsUpdate?: (prompts: PromptVersionSummary) => void;
}

export default function PromptManager({ botId, onPromptsUpdate }: PromptManagerProps) {
  const [prompts, setPrompts] = useState<PromptVersionSummary>({
    principal: { active: null, versions: [] },
    triagem: { active: null, versions: [] },
    think: { active: null, versions: [] }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados para novos prompts
  const [newPromptContent, setNewPromptContent] = useState('');
  const [newPromptDescription, setNewPromptDescription] = useState('');
  const [activePromptType, setActivePromptType] = useState<PromptType>('principal');
  const [showNewPromptDialog, setShowNewPromptDialog] = useState(false);
  
  // Estados para visualização expandida
  const [expandedPrompts, setExpandedPrompts] = useState<{[key in PromptType]: boolean}>({
    principal: false,
    triagem: false,
    think: false
  });
  
  // Estado para modal de preview
  const [previewPrompt, setPreviewPrompt] = useState<{ type: PromptType; version: PromptVersion } | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPrompts = async () => {
    if (!botId || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('bot_id', botId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Organizar por tipo e fazer type casting
      const principalVersions = data.filter(p => p.prompt_type === 'principal') as PromptVersion[];
      const triagemVersions = data.filter(p => p.prompt_type === 'triagem') as PromptVersion[];
      const thinkVersions = data.filter(p => p.prompt_type === 'think') as PromptVersion[];

      const promptSummary: PromptVersionSummary = {
        principal: {
          active: principalVersions.find(p => p.is_active) || null,
          versions: principalVersions
        },
        triagem: {
          active: triagemVersions.find(p => p.is_active) || null,
          versions: triagemVersions
        },
        think: {
          active: thinkVersions.find(p => p.is_active) || null,
          versions: thinkVersions
        }
      };

      setPrompts(promptSummary);
      onPromptsUpdate?.(promptSummary);
    } catch (error) {
      console.error('Error fetching prompts:', error);
      toast({
        title: "Erro ao carregar prompts",
        description: "Não foi possível carregar o histórico de prompts.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, [botId, user]);

  const createNewPrompt = async () => {
    if (!newPromptContent.trim() || !user) return;
    
    setSaving(true);
    
    try {
      // Agora com o constraint correto, podemos inserir diretamente como ativa
      // O trigger ensure_single_active_prompt vai desativar automaticamente as outras
      const { error: insertError } = await supabase
        .from('prompt_versions')
        .insert({
          bot_id: botId,
          user_id: user.id,
          prompt_type: activePromptType,
          content: newPromptContent.trim(),
          description: newPromptDescription.trim() || undefined,
          is_active: true, // O trigger vai gerenciar a unicidade
          version_number: 1 // Será substituído pelo trigger
        });

      if (insertError) throw insertError;

      toast({
        title: "Prompt criado",
        description: `Nova versão do prompt ${activePromptType} foi criada e ativada.`,
      });

      setNewPromptContent('');
      setNewPromptDescription('');
      setShowNewPromptDialog(false);
      await fetchPrompts();
    } catch (error) {
      console.error('Error creating prompt:', error);
      toast({
        title: "Erro ao criar prompt",
        description: "Não foi possível criar a nova versão do prompt.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const activatePromptVersion = async (versionId: string, promptType: PromptType) => {
    if (!user) return;
    
    setSaving(true);
    
    try {
      // Primeiro, desativamos a versão ativa atual do mesmo tipo
      const { error: deactivateError } = await supabase
        .from('prompt_versions')
        .update({ is_active: false })
        .eq('bot_id', botId)
        .eq('user_id', user.id)
        .eq('prompt_type', promptType)
        .eq('is_active', true);

      // Não vamos falhar se não houver versão ativa para desativar
      if (deactivateError && deactivateError.code !== 'PGRST116') {
        throw deactivateError;
      }

      // Agora ativamos a versão selecionada
      const { error: activateError } = await supabase
        .from('prompt_versions')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', versionId)
        .eq('user_id', user.id);

      if (activateError) throw activateError;

      toast({
        title: "Prompt ativado",
        description: `A versão selecionada do prompt ${promptType} foi ativada.`,
      });

      await fetchPrompts();
    } catch (error) {
      console.error('Error activating prompt:', error);
      toast({
        title: "Erro ao ativar prompt",
        description: "Não foi possível ativar a versão selecionada.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const togglePromptExpansion = (type: PromptType) => {
    setExpandedPrompts(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const renderPromptCard = (type: PromptType) => {
    const promptData = prompts[type];
    const Icon = type === 'principal' ? Zap : type === 'triagem' ? Shield : Brain;
    const color = type === 'principal' ? 'blue' : type === 'triagem' ? 'green' : 'purple';
    const title = type === 'principal' ? 'Prompt Principal' : type === 'triagem' ? 'Prompt de Triagem' : 'Prompt de Pensamento';
    const isExpanded = expandedPrompts[type];
    
    return (
      <Card className="bg-white/95 backdrop-blur-sm border-slate-200/80 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <CardTitle className="flex items-center space-x-3 text-lg">
              <div className={`w-10 h-10 bg-gradient-to-br ${color === 'blue' ? 'from-blue-500 to-indigo-500' : color === 'green' ? 'from-green-500 to-emerald-500' : 'from-purple-500 to-violet-500'} rounded-xl flex items-center justify-center shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <span className={`bg-gradient-to-r ${color === 'blue' ? 'from-blue-600 to-indigo-600' : color === 'green' ? 'from-green-600 to-emerald-600' : 'from-purple-600 to-violet-600'} bg-clip-text text-transparent font-semibold`}>
                  {title}
                </span>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={promptData.active ? 'default' : 'secondary'} className="text-xs">
                    {promptData.versions.length} {promptData.versions.length === 1 ? 'versão' : 'versões'}
                  </Badge>
                  {promptData.active && (
                    <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Ativo
                    </Badge>
                  )}
                </div>
              </div>
            </CardTitle>
            
            <div className="flex flex-col items-end space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActivePromptType(type);
                  setShowNewPromptDialog(true);
                }}
                className="h-8 px-3 bg-white hover:bg-slate-50"
              >
                <Plus className="w-4 h-4 mr-1" />
                Nova
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Prompt Ativo */}
          {promptData.active ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-slate-700 flex items-center">
                  <FileText className="w-4 h-4 mr-1 text-slate-500" />
                  Versão Ativa (v{promptData.active.version_number})
                </Label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewPrompt({ type, version: promptData.active! })}
                    className="h-6 px-2 text-xs"
                  >
                    <Maximize2 className="w-3 h-3 mr-1" />
                    Ver Completo
                  </Button>
                  <span className="text-xs text-slate-500 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(promptData.active.created_at)}
                  </span>
                </div>
              </div>
              
              {promptData.active.description && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                  <p className="text-xs text-blue-700 flex items-center">
                    <Tag className="w-3 h-3 mr-1" />
                    {promptData.active.description}
                  </p>
                </div>
              )}
              
              <Collapsible open={isExpanded} onOpenChange={() => togglePromptExpansion(type)}>
                <div className="bg-slate-50/80 rounded-lg border border-slate-200">
                  <div className="p-3">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between h-auto p-0 hover:bg-transparent">
                        <p className="text-sm text-slate-700 text-left flex-1 whitespace-pre-wrap font-mono leading-relaxed">
                          {isExpanded ? promptData.active.content : truncateText(promptData.active.content, 150)}
                        </p>
                        <div className="ml-2 flex-shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  
                  <CollapsibleContent>
                    <div className="px-3 pb-3">
                      <Separator className="mb-3" />
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{promptData.active.content.length} caracteres</span>
                        <span>{promptData.active.content.split('\n').length} linhas</span>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
                <History className="w-6 h-6 opacity-50" />
              </div>
              <p className="text-sm font-medium">Nenhum prompt ativo</p>
              <p className="text-xs text-slate-400 mt-1">Crie a primeira versão para começar</p>
            </div>
          )}
          
          {/* Histórico de Versões */}
          {promptData.versions.length > 0 && (
            <div className="space-y-3">
              <Separator />
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full h-9 bg-slate-50 hover:bg-slate-100 border border-slate-200">
                    <History className="w-4 h-4 mr-2" />
                    <span className="flex-1 text-left">
                      Gerenciar Histórico
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      {promptData.versions.length}
                    </Badge>
                  </Button>
                </DialogTrigger>
                
                <DialogContent className="max-w-6xl max-h-[90vh] w-[95vw]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2 text-xl">
                      <Icon className={`w-6 h-6 ${color === 'blue' ? 'text-blue-600' : color === 'green' ? 'text-green-600' : 'text-purple-600'}`} />
                      <span>Histórico de Versões - {title}</span>
                    </DialogTitle>
                  </DialogHeader>
                  
                  <ScrollArea className="max-h-[70vh] pr-4">
                    <div className="space-y-4">
                      {promptData.versions.map((version, index) => (
                        <Card key={version.id} className={`${version.is_active ? 'ring-2 ring-blue-500 bg-blue-50/30' : 'bg-white'} transition-all`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2">
                                  <Badge variant={version.is_active ? 'default' : 'secondary'} className="font-medium">
                                    v{version.version_number}
                                  </Badge>
                                  {version.is_active && (
                                    <Badge variant="outline" className="text-green-600 border-green-200">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Ativo
                                    </Badge>
                                  )}
                                  {index === 0 && !version.is_active && (
                                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                                      <Clock className="w-3 h-3 mr-1" />
                                      Mais Recente
                                    </Badge>
                                  )}
                                </div>
                                
                                {version.description && (
                                  <div className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-600 flex items-center">
                                    <Tag className="w-3 h-3 mr-1" />
                                    {version.description}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <span className="text-xs text-slate-500 flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {formatDate(version.created_at)}
                                </span>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPreviewPrompt({ type, version })}
                                  className="h-7 px-2 text-xs"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Preview
                                </Button>
                                
                                {!version.is_active && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                                        <RotateCcw className="w-3 h-3 mr-1" />
                                        Restaurar
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Restaurar Versão {version.version_number}</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tem certeza que deseja ativar a versão {version.version_number} do {title.toLowerCase()}? 
                                          A versão atual será automaticamente desativada.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => activatePromptVersion(version.id, type)}
                                          disabled={saving}
                                          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                                        >
                                          {saving ? 'Restaurando...' : 'Restaurar'}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent>
                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-500 font-medium">Conteúdo do Prompt</span>
                                <div className="flex items-center space-x-3 text-xs text-slate-400">
                                  <span>{version.content.length} caracteres</span>
                                  <span>{version.content.split('\n').length} linhas</span>
                                </div>
                              </div>
                              <div className="max-h-32 overflow-hidden relative">
                                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                                  {truncateText(version.content, 300)}
                                </pre>
                                {version.content.length > 300 && (
                                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-50 to-transparent flex items-end justify-center">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setPreviewPrompt({ type, version })}
                                      className="h-6 px-2 text-xs bg-white border border-slate-200"
                                    >
                                      Ver mais...
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60 shadow-xl rounded-2xl">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
            <span className="text-slate-600">Carregando prompts...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cards dos Prompts - Layout melhorado */}
      <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-2 gap-6">
        {renderPromptCard('principal')}
        {renderPromptCard('triagem')}
        {renderPromptCard('think')}
      </div>

      {/* Dialog para criar novo prompt */}
      <Dialog open={showNewPromptDialog} onOpenChange={setShowNewPromptDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-xl">
              <GitBranch className="w-6 h-6" />
              <span>
                Nova Versão - {activePromptType === 'principal' ? 'Prompt Principal' : activePromptType === 'triagem' ? 'Prompt de Triagem' : 'Prompt de Pensamento'}
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="description" className="text-base font-medium">Descrição (opcional)</Label>
              <Input
                id="description"
                value={newPromptDescription}
                onChange={(e) => setNewPromptDescription(e.target.value)}
                placeholder="Ex: Ajustado para ser mais técnico, melhorado contexto inicial..."
                className="mt-2 h-10"
              />
              <p className="text-xs text-slate-500 mt-1">Adicione uma descrição para identificar facilmente esta versão</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content" className="text-base font-medium">Conteúdo do Prompt</Label>
              <Textarea
                id="content"
                value={newPromptContent}
                onChange={(e) => setNewPromptContent(e.target.value)}
                placeholder="Digite o conteúdo completo do novo prompt aqui..."
                rows={16}
                className="font-mono text-sm leading-relaxed resize-none"
              />
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{newPromptContent.length} caracteres</span>
                <span>{newPromptContent.split('\n').length} linhas</span>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => setShowNewPromptDialog(false)} className="px-6">
              Cancelar
            </Button>
            <Button 
              onClick={createNewPrompt} 
              disabled={!newPromptContent.trim() || saving}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 px-6"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? 'Criando...' : 'Criar e Ativar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para preview completo do prompt */}
      <Dialog open={!!previewPrompt} onOpenChange={() => setPreviewPrompt(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] w-[95vw] flex flex-col">
          {previewPrompt && (
            <>
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="flex items-center space-x-2 text-xl">
                  {previewPrompt.type === 'principal' ? <Zap className="w-6 h-6 text-blue-600" /> : 
                   previewPrompt.type === 'triagem' ? <Shield className="w-6 h-6 text-green-600" /> : 
                   <Brain className="w-6 h-6 text-purple-600" />}
                  <span>
                    {previewPrompt.type === 'principal' ? 'Prompt Principal' : 
                     previewPrompt.type === 'triagem' ? 'Prompt de Triagem' : 
                     'Prompt de Pensamento'} - Versão {previewPrompt.version.version_number}
                  </span>
                  {previewPrompt.version.is_active && (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Ativo
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>
              
              <div className="flex flex-col space-y-4 flex-1 min-h-0">
                <div className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 p-3 rounded-lg flex-shrink-0">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(previewPrompt.version.created_at)}
                    </span>
                    {previewPrompt.version.description && (
                      <span className="flex items-center">
                        <Tag className="w-4 h-4 mr-1" />
                        {previewPrompt.version.description}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <span>{previewPrompt.version.content.length} caracteres</span>
                    <span>{previewPrompt.version.content.split('\n').length} linhas</span>
                  </div>
                </div>
                
                <div className="flex-1 min-h-0 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                  <ScrollArea className="h-full p-6">
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                      {previewPrompt.version.content}
                    </pre>
                  </ScrollArea>
                </div>
              </div>
              
              <DialogFooter>
                {!previewPrompt.version.is_active && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Ativar Esta Versão
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Ativar Versão {previewPrompt.version.version_number}</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja ativar esta versão? A versão atual será automaticamente desativada.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            activatePromptVersion(previewPrompt.version.id, previewPrompt.type);
                            setPreviewPrompt(null);
                          }}
                          disabled={saving}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Ativar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button variant="outline" onClick={() => setPreviewPrompt(null)}>
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 