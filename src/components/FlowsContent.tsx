import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import AssistantStepHeader from "@/components/AssistantStepHeader";
import FlowEditor from "@/components/FlowEditor";
import { useFlows, useToggleFlowStatus, useDeleteFlow } from "@/hooks/useFlows";
import { useToast } from "@/hooks/use-toast";
import { Flow } from "@/types/assistant";
import { 
  GitBranch,
  Plus,
  Settings,
  Play,
  Pause,
  Trash2,
  Copy,
  MoreVertical,
  MessageCircle,
  Building2,
  StopCircle,
  ChevronRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FlowsContentProps {
  assistantId: string;
}

interface FlowCardProps {
  flow: Flow;
  onEdit: (flow: Flow) => void;
  onToggleStatus: (flowId: string, isActive: boolean) => void;
  onDelete: (flowId: string) => void;
  onDuplicate: (flow: Flow) => void;
  loading?: boolean;
}

const FlowCard: React.FC<FlowCardProps> = ({ 
  flow, 
  onEdit, 
  onToggleStatus, 
  onDelete, 
  onDuplicate, 
  loading = false 
}) => {
  const actionsCount = flow.actions?.length || 0;
  const hasWhatsApp = flow.actions?.some(action => action.action_type === 'whatsapp_message');
  const hasKommo = flow.actions?.some(action => action.action_type === 'kommo_field_update');
  const hasStop = flow.actions?.some(action => action.action_type === 'stop_conversation');

  return (
    <div className="konver-glass-card rounded-xl p-4 transition-all duration-200 hover:shadow-lg group cursor-pointer" onClick={() => onEdit(flow)}>
      {/* Header with title and controls */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            flow.is_active 
              ? 'konver-gradient-primary shadow-sm' 
              : 'bg-muted'
          }`}>
            <GitBranch className={`w-4 h-4 ${
              flow.is_active ? 'text-white' : 'text-muted-foreground'
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate text-sm">{flow.name}</h3>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={flow.is_active}
            onCheckedChange={(checked) => onToggleStatus(flow.id, checked)}
            disabled={loading}
            size="sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(flow)}>
                <Settings className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(flow)}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(flow.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Intent Description - more compact */}
      <div className="mb-3">
        <p className="text-xs text-muted-foreground mb-1">Intenção:</p>
        <p className="text-sm text-foreground line-clamp-2 leading-relaxed">"{flow.intent_description}"</p>
      </div>

      {/* Actions Summary - more compact */}
      {actionsCount > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {hasWhatsApp && (
              <Badge variant="secondary" className="text-xs px-2 py-1 bg-green-500/10 text-green-700 border-green-500/20">
                <MessageCircle className="w-3 h-3 mr-1" />
                WhatsApp
              </Badge>
            )}
            {hasKommo && (
              <Badge variant="secondary" className="text-xs px-2 py-1 bg-orange-500/10 text-orange-700 border-orange-500/20">
                <Building2 className="w-3 h-3 mr-1" />
                Kommo
              </Badge>
            )}
            {hasStop && (
              <Badge variant="secondary" className="text-xs px-2 py-1 bg-red-500/10 text-red-700 border-red-500/20">
                <StopCircle className="w-3 h-3 mr-1" />
                Parar
              </Badge>
            )}
          </div>
          
          <span className="text-xs text-muted-foreground">
            {actionsCount} ação{actionsCount > 1 ? 'ões' : ''}
          </span>
        </div>
      )}
      
      {actionsCount === 0 && (
        <div className="text-center py-2">
          <p className="text-xs text-muted-foreground">Nenhuma ação configurada</p>
        </div>
      )}
    </div>
  );
};

export default function FlowsContent({ assistantId }: FlowsContentProps) {
  const { data: flows = [], isLoading, refetch } = useFlows(assistantId);
  const toggleFlowStatusMutation = useToggleFlowStatus();
  const deleteFlowMutation = useDeleteFlow();
  const { toast } = useToast();
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [showFlowEditor, setShowFlowEditor] = useState(false);

  const handleToggleStatus = async (flowId: string, isActive: boolean) => {
    try {
      await toggleFlowStatusMutation.mutateAsync({ flowId, isActive });
      toast({
        title: isActive ? "Fluxo ativado" : "Fluxo desativado",
        description: `O fluxo foi ${isActive ? 'ativado' : 'desativado'} com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do fluxo.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFlow = async (flowId: string) => {
    try {
      await deleteFlowMutation.mutateAsync(flowId);
      toast({
        title: "Fluxo excluído",
        description: "O fluxo foi excluído com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o fluxo.",
        variant: "destructive",
      });
    }
  };

  const handleEditFlow = (flow: Flow) => {
    setSelectedFlow(flow);
    setShowFlowEditor(true);
  };

  const handleDuplicateFlow = (flow: Flow) => {
    // TODO: Implement flow duplication
    toast({
      title: "Em desenvolvimento",
      description: "A funcionalidade de duplicar fluxo será implementada em breve.",
    });
  };

  const handleCreateNewFlow = () => {
    setSelectedFlow(null);
    setShowFlowEditor(true);
  };

  const activeFlowsCount = flows.filter(flow => flow.is_active).length;
  const totalFlowsCount = flows.length;

  return (
    <div className="flex flex-col h-full">
      <AssistantStepHeader
        title="Fluxos"
        description={`Gerencie automações baseadas em intenções (${activeFlowsCount}/${totalFlowsCount} ativos)`}
        icon={<GitBranch className="w-5 h-5 text-white" />}
        compact={true}
        actions={[
          {
            label: "Criar Fluxo",
            icon: <Plus className="w-4 h-4" />,
            onClick: handleCreateNewFlow,
            variant: "default" as const
          }
        ]}
        loading={false}
        className="flex-shrink-0 shadow-none border-0 bg-transparent backdrop-blur-none"
      />

      <div className="flex-1 min-h-0 mt-4">
        <div className="konver-glass-card rounded-2xl h-full flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full konver-scrollbar">
              <div className="p-6">
                {isLoading ? (
                  // Loading skeleton for flows
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="konver-glass-card rounded-xl p-4 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
                            <div className="h-4 bg-muted rounded animate-pulse w-24" />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-5 bg-muted rounded-full animate-pulse" />
                            <div className="w-8 h-8 bg-muted rounded animate-pulse" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 bg-muted rounded animate-pulse w-16" />
                          <div className="h-4 bg-muted rounded animate-pulse w-full" />
                          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            <div className="h-6 bg-muted rounded animate-pulse w-16" />
                            <div className="h-6 bg-muted rounded animate-pulse w-12" />
                          </div>
                          <div className="h-4 bg-muted rounded animate-pulse w-12" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : flows.length === 0 ? (
                  <div className="flex items-center justify-center h-64 text-center">
                    <div className="max-w-sm space-y-4">
                      <div className="konver-gradient-primary w-16 h-16 rounded-xl flex items-center justify-center mx-auto shadow-lg">
                        <GitBranch className="w-8 h-8 text-white" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xl font-semibold konver-text-gradient">
                          Nenhum fluxo configurado
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Crie fluxos automatizados que respondem às intenções dos usuários. 
                          Configure ações como enviar mensagens no WhatsApp, atualizar campos no Kommo, ou parar conversas.
                        </p>
                      </div>
                      <Button
                        onClick={handleCreateNewFlow}
                        className="konver-button-primary shadow-md hover:shadow-lg transition-all duration-200 mt-6"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Primeiro Fluxo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {flows.map((flow) => (
                      <FlowCard
                        key={flow.id}
                        flow={flow}
                        onEdit={handleEditFlow}
                        onToggleStatus={handleToggleStatus}
                        onDelete={handleDeleteFlow}
                        onDuplicate={handleDuplicateFlow}
                        loading={toggleFlowStatusMutation.isPending || deleteFlowMutation.isPending}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Flow Editor Modal */}
      <FlowEditor
        assistantId={assistantId}
        flow={selectedFlow}
        isOpen={showFlowEditor}
        onClose={() => {
          setShowFlowEditor(false);
          setSelectedFlow(null);
        }}
      />
    </div>
  );
}