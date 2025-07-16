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
  Shield
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
    triagem: { active: null, versions: [] }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados para novos prompts
  const [newPromptContent, setNewPromptContent] = useState('');
  const [newPromptDescription, setNewPromptDescription] = useState('');
  const [activePromptType, setActivePromptType] = useState<PromptType>('principal');
  const [showNewPromptDialog, setShowNewPromptDialog] = useState(false);
  
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

      const promptSummary: PromptVersionSummary = {
        principal: {
          active: principalVersions.find(p => p.is_active) || null,
          versions: principalVersions
        },
        triagem: {
          active: triagemVersions.find(p => p.is_active) || null,
          versions: triagemVersions
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

  const renderPromptCard = (type: PromptType) => {
    const promptData = prompts[type];
    const Icon = type === 'principal' ? Zap : Shield;
    const color = type === 'principal' ? 'blue' : 'green';
    const title = type === 'principal' ? 'Prompt Principal' : 'Prompt de Triagem';
    
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60 shadow-xl rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-3 text-lg">
              <div className={`w-10 h-10 bg-gradient-to-br ${color === 'blue' ? 'from-blue-500 to-indigo-500' : 'from-green-500 to-emerald-500'} rounded-xl flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className={`bg-gradient-to-r ${color === 'blue' ? 'from-blue-600 to-indigo-600' : 'from-green-600 to-emerald-600'} bg-clip-text text-transparent`}>
                {title}
              </span>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <Badge variant={promptData.active ? 'default' : 'secondary'}>
                {promptData.versions.length} {promptData.versions.length === 1 ? 'versão' : 'versões'}
              </Badge>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActivePromptType(type);
                  setShowNewPromptDialog(true);
                }}
                className="h-8 px-3"
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
                  <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                  Versão Ativa (v{promptData.active.version_number})
                </Label>
                <span className="text-xs text-slate-500">
                  {formatDate(promptData.active.created_at)}
                </span>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-3 border">
                <p className="text-sm text-slate-700 line-clamp-3">
                  {promptData.active.content}
                </p>
                {promptData.active.description && (
                  <p className="text-xs text-slate-500 mt-2 italic">
                    {promptData.active.description}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500">
              <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum prompt ativo</p>
              <p className="text-xs">Crie a primeira versão</p>
            </div>
          )}
          
          {/* Histórico de Versões */}
          {promptData.versions.length > 1 && (
            <div className="space-y-3">
              <Separator />
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full h-8">
                    <History className="w-4 h-4 mr-2" />
                    Ver Histórico ({promptData.versions.length - 1} {promptData.versions.length - 1 === 1 ? 'versão anterior' : 'versões anteriores'})
                  </Button>
                </DialogTrigger>
                
                <DialogContent className="max-w-4xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Histórico - {title}</DialogTitle>
                  </DialogHeader>
                  
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {promptData.versions.map((version) => (
                        <Card key={version.id} className={`${version.is_active ? 'ring-2 ring-blue-500' : ''}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Badge variant={version.is_active ? 'default' : 'secondary'}>
                                  v{version.version_number}
                                </Badge>
                                {version.is_active && (
                                  <Badge variant="outline" className="text-green-600 border-green-200">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Ativo
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-slate-500">
                                  {formatDate(version.created_at)}
                                </span>
                                
                                {!version.is_active && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        <RotateCcw className="w-4 h-4 mr-1" />
                                        Restaurar
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Restaurar Versão</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tem certeza que deseja ativar a versão {version.version_number} do {title.toLowerCase()}? 
                                          A versão atual será desativada.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => activatePromptVersion(version.id, type)}
                                          disabled={saving}
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
                            {version.description && (
                              <p className="text-sm text-slate-600 mb-2 italic">
                                {version.description}
                              </p>
                            )}
                            
                            <div className="bg-slate-50 rounded-lg p-3 border">
                              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
                                {version.content}
                              </pre>
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
    <div className="space-y-6">
      {/* Cards dos Prompts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderPromptCard('principal')}
        {renderPromptCard('triagem')}
      </div>

      {/* Dialog para criar novo prompt */}
      <Dialog open={showNewPromptDialog} onOpenChange={setShowNewPromptDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <GitBranch className="w-5 h-5" />
              <span>
                Nova Versão - {activePromptType === 'principal' ? 'Prompt Principal' : 'Prompt de Triagem'}
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Input
                id="description"
                value={newPromptDescription}
                onChange={(e) => setNewPromptDescription(e.target.value)}
                placeholder="Ex: Ajustado para ser mais técnico..."
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="content">Conteúdo do Prompt</Label>
              <Textarea
                id="content"
                value={newPromptContent}
                onChange={(e) => setNewPromptContent(e.target.value)}
                placeholder="Digite o conteúdo do novo prompt..."
                rows={12}
                className="mt-1 font-mono text-sm"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPromptDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={createNewPrompt} 
              disabled={!newPromptContent.trim() || saving}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
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
    </div>
  );
} 