import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import ActionCard from "@/components/ActionCard";
import { useToast } from "@/hooks/use-toast";
import { 
  useCreateFlow, 
  useUpdateFlow, 
  useCreateFlowAction, 
  useUpdateFlowAction,
  useDeleteFlowAction,
  useReorderFlowActions
} from "@/hooks/useFlows";
import { 
  Flow, 
  FlowAction, 
  FlowActionType, 
  FlowActionConfig, 
  CreateFlowData,
  UpdateFlowData,
  CreateFlowActionData
} from "@/types/assistant";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  X, 
  Save, 
  Plus, 
  GitBranch, 
  MessageCircle, 
  Building2, 
  StopCircle,
  Loader2
} from "lucide-react";

interface FlowEditorProps {
  assistantId: string;
  flow?: Flow | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

interface SortableActionCardProps {
  action: FlowAction;
  sequenceOrder: number;
  onUpdate: (updates: Partial<FlowAction>) => void;
  onDelete: () => void;
  onConfigChange: (config: FlowActionConfig) => void;
  botId: string;
}

const SortableActionCard: React.FC<SortableActionCardProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.action.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ActionCard
        {...props}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

export default function FlowEditor({ assistantId, flow, isOpen, onClose, onSave }: FlowEditorProps) {
  const { toast } = useToast();
  const createFlowMutation = useCreateFlow();
  const updateFlowMutation = useUpdateFlow();
  const createFlowActionMutation = useCreateFlowAction();
  const updateFlowActionMutation = useUpdateFlowAction();
  const deleteFlowActionMutation = useDeleteFlowAction();
  const reorderFlowActionsMutation = useReorderFlowActions();

  // Form states
  const [name, setName] = useState('');
  const [intentDescription, setIntentDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [actions, setActions] = useState<FlowAction[]>([]);
  const [originalActions, setOriginalActions] = useState<FlowAction[]>([]);

  // UI states
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize form with existing flow data
  useEffect(() => {
    if (flow) {
      setName(flow.name);
      setIntentDescription(flow.intent_description);
      setIsActive(flow.is_active);
      setActions(flow.actions || []);
      setOriginalActions(flow.actions || []);
    } else {
      // Reset form for new flow
      setName('');
      setIntentDescription('');
      setIsActive(true);
      setActions([]);
      setOriginalActions([]);
      setCurrentStep(1);
    }
  }, [flow, isOpen]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = actions.findIndex(action => action.id === active.id);
      const newIndex = actions.findIndex(action => action.id === over.id);
      
      const newActions = arrayMove(actions, oldIndex, newIndex);
      
      // Update sequence orders
      const updatedActions = newActions.map((action, index) => ({
        ...action,
        sequence_order: index + 1
      }));
      
      setActions(updatedActions);
    }
  };

  const addAction = (actionType: FlowActionType) => {
    const newAction: FlowAction = {
      id: `temp-${Date.now()}`, // Temporary ID
      flow_id: flow?.id || '',
      action_type: actionType,
      sequence_order: actions.length + 1,
      config: {},
      created_at: new Date().toISOString(),
    };

    setActions([...actions, newAction]);
  };

  const updateAction = (actionId: string, updates: Partial<FlowAction>) => {
    setActions(actions.map(action => 
      action.id === actionId ? { ...action, ...updates } : action
    ));
  };

  const updateActionConfig = (actionId: string, config: FlowActionConfig) => {
    updateAction(actionId, { config });
  };

  const deleteAction = (actionId: string) => {
    setActions(actions.filter(action => action.id !== actionId));
    // Reorder remaining actions
    const remainingActions = actions.filter(action => action.id !== actionId);
    const reorderedActions = remainingActions.map((action, index) => ({
      ...action,
      sequence_order: index + 1
    }));
    setActions(reorderedActions);
  };

  const validateStep1 = () => {
    return name.trim() && intentDescription.trim();
  };

  const validateStep2 = () => {
    if (actions.length === 0) return false;
    
    return actions.every(action => {
      switch (action.action_type) {
        case 'whatsapp_message':
          return action.config.message?.trim() && action.config.phone_number?.trim();
        case 'kommo_field_update':
          // Accept both new field_id and legacy field_name for backward compatibility
          const hasValidField = action.config.field_id || action.config.field_name;
          return hasValidField && action.config.field_value?.trim();
        case 'stop_conversation':
          return action.config.reason;
        default:
          return false;
      }
    });
  };

  const getDeletedActions = () => {
    return originalActions.filter(originalAction => 
      !originalAction.id.startsWith('temp-') && 
      !actions.some(currentAction => currentAction.id === originalAction.id)
    );
  };

  const handleSave = async () => {
    if (!validateStep1() || !validateStep2()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      let savedFlow: Flow;

      if (flow) {
        // Update existing flow
        const updateData: UpdateFlowData = {
          name,
          intent_description: intentDescription,
          is_active: isActive,
        };
        
        savedFlow = await updateFlowMutation.mutateAsync({
          flowId: flow.id,
          updates: updateData
        });
      } else {
        // Create new flow
        const createData: CreateFlowData = {
          bot_id: assistantId,
          name,
          intent_description: intentDescription,
          is_active: isActive,
        };
        
        savedFlow = await createFlowMutation.mutateAsync(createData);
      }

      // Handle actions (create, update, delete as needed)
      const actionOperations = [];

      // Process deleted actions first
      const deletedActions = getDeletedActions();
      for (const deletedAction of deletedActions) {
        actionOperations.push(deleteFlowActionMutation.mutateAsync(deletedAction.id));
      }

      // Process current actions (create new ones, update existing)
      for (const action of actions) {
        if (action.id.startsWith('temp-')) {
          // Create new action
          const actionData: CreateFlowActionData = {
            flow_id: savedFlow.id,
            action_type: action.action_type,
            sequence_order: action.sequence_order,
            config: action.config,
          };
          
          actionOperations.push(createFlowActionMutation.mutateAsync(actionData));
        } else {
          // Update existing action
          actionOperations.push(updateFlowActionMutation.mutateAsync({
            actionId: action.id,
            updates: {
              sequence_order: action.sequence_order,
              config: action.config,
            }
          }));
        }
      }

      // Wait for all action operations to complete
      await Promise.all(actionOperations);

      toast({
        title: flow ? "Fluxo atualizado" : "Fluxo criado",
        description: `O fluxo "${name}" foi ${flow ? 'atualizado' : 'criado'} com sucesso.`,
      });

      // React Query invalidations from mutations handle the refetch automatically
      if (onSave) {
        onSave();
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving flow:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o fluxo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 konver-gradient-primary rounded-lg flex items-center justify-center shadow-sm">
              <GitBranch className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {flow ? 'Editar Fluxo' : 'Criar Novo Fluxo'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Configure automações baseadas em intenções do usuário
              </p>
            </div>
          </div>
          
          <Button variant="ghost" onClick={onClose} className="w-8 h-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Steps Navigation */}
        <div className="px-4 py-3 bg-muted/10 border-b border-border/30">
          <div className="flex items-center justify-center gap-8">
            <Button
              variant={currentStep === 1 ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-2 text-sm"
            >
              <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                currentStep === 1 
                  ? 'bg-primary text-white' 
                  : 'bg-muted text-muted-foreground'
              }`}>1</span>
              Configurações
            </Button>
            <div className="h-px bg-border flex-1 max-w-24" />
            <Button
              variant={currentStep === 2 ? "default" : "ghost"}
              size="sm"
              onClick={() => validateStep1() && setCurrentStep(2)}
              disabled={!validateStep1()}
              className="flex items-center gap-2 text-sm"
            >
              <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                currentStep === 2 
                  ? 'bg-primary text-white' 
                  : validateStep1() 
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-muted/50 text-muted-foreground/50'
              }`}>2</span>
              Ações
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {currentStep === 1 ? (
            <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Fluxo *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Agendamento de Consulta"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="intentDescription">Intenção Detectada *</Label>
                  <Textarea
                    id="intentDescription"
                    placeholder="Ex: quando o usuário manifesta interesse em agendar uma consulta"
                    value={intentDescription}
                    onChange={(e) => setIntentDescription(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Descreva quando este fluxo deve ser ativado
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="isActive">Fluxo ativo</Label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Add Action Buttons */}
                <div className="space-y-3">
                  <h3 className="text-base font-medium">Ações do Fluxo</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addAction('whatsapp_message')}
                      className="flex items-center gap-2 text-xs"
                    >
                      <MessageCircle className="w-3 h-3" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addAction('kommo_field_update')}
                      className="flex items-center gap-2 text-xs"
                    >
                      <Building2 className="w-3 h-3" />
                      Kommo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addAction('stop_conversation')}
                      className="flex items-center gap-2 text-xs"
                    >
                      <StopCircle className="w-3 h-3" />
                      Parar Conversa
                    </Button>
                  </div>
                </div>

                {/* Actions List */}
                {actions.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <GitBranch className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Nenhuma ação configurada ainda.</p>
                    <p className="text-xs">Clique nos botões acima para adicionar ações.</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[350px]">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={actions.map(a => a.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3 pr-2">
                          {actions.map((action, index) => (
                            <SortableActionCard
                              key={action.id}
                              action={action}
                              sequenceOrder={index + 1}
                              onUpdate={(updates) => updateAction(action.id, updates)}
                              onDelete={() => deleteAction(action.id)}
                              onConfigChange={(config) => updateActionConfig(action.id, config)}
                              botId={assistantId}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </ScrollArea>
                )}
              </div>
            )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border/50 bg-muted/5">
          <div className="text-xs text-muted-foreground">
            {currentStep === 1 ? 'Passo 1 de 2' : 'Passo 2 de 2'}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            
            {currentStep === 1 ? (
              <Button
                size="sm"
                onClick={() => setCurrentStep(2)}
                disabled={!validateStep1()}
              >
                Próximo
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(1)}
                >
                  Voltar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!validateStep2() || isSaving}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3 mr-2" />
                      {flow ? 'Atualizar' : 'Criar'}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}