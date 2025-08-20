import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AssistantStepHeader from "@/components/AssistantStepHeader";
import AssistantStepContent from "@/components/AssistantStepContent";
import { 
  Settings,
  Save,
  MessageSquare,
  Thermometer,
  Power,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders
} from "lucide-react";

interface PromptVersion {
  id: string;
  content: string;
  version: number;
  created_at: string;
  is_active: boolean;
  performance_score?: number;
}

interface Assistant {
  id: string;
  name: string;
  description: string;
  temperature: number;
  active: boolean;
  prompts: {
    principal: PromptVersion[];
    triagem: PromptVersion[];
    think: PromptVersion[];
  };
}

interface SettingsContentProps {
  assistant: Assistant;
  updateAssistant: (updates: Partial<Assistant>) => void;
  onCreatePromptVersion?: (type: 'principal' | 'triagem' | 'think') => void;
  onActivatePromptVersion?: (type: 'principal' | 'triagem' | 'think', versionId: string) => void;
  onSave?: (localValues?: { name: string; description: string; temperature: number }) => void;
}

export default function SettingsContent({ 
  assistant, 
  updateAssistant,
  onCreatePromptVersion,
  onActivatePromptVersion,
  onSave
}: SettingsContentProps) {
  const [localName, setLocalName] = useState(assistant.name);
  const [localDescription, setLocalDescription] = useState(assistant.description);
  const [localTemperature, setLocalTemperature] = useState([assistant.temperature]);
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state when assistant prop changes
  useEffect(() => {
    console.log('🔵 SettingsContent useEffect triggered');
    console.log('🔵 Assistant prop changed:', { 
      name: assistant.name, 
      description: assistant.description, 
      temperature: assistant.temperature 
    });
    console.log('🔵 Previous local state:', { localName, localDescription, localTemperature });
    
    setLocalName(assistant.name);
    setLocalDescription(assistant.description);
    setLocalTemperature([assistant.temperature]);
    
    console.log('🔵 Local state updated to match assistant prop');
  }, [assistant.name, assistant.description, assistant.temperature]);

  const handleSave = async () => {
    console.log('🔵 SettingsContent.handleSave called');
    console.log('🔵 Local states:', { localName, localDescription, localTemperature });
    console.log('🔵 Assistant prop:', assistant);
    
    setIsSaving(true);
    
    // Update local states first
    const updateData = {
      name: localName,
      description: localDescription,
      temperature: localTemperature[0]
    };
    console.log('🔵 Calling updateAssistant with:', updateData);
    updateAssistant(updateData);
    
    // Call the actual save function if provided, passing the local values directly
    if (onSave) {
      try {
        console.log('🔵 Calling onSave function with local values...');
        await onSave(updateData); // Pass local values to onSave
        console.log('🔵 onSave completed successfully');
      } catch (error) {
        console.error('🔴 Error saving:', error);
      }
    } else {
      console.log('🟡 No onSave function provided, using fallback');
      // Fallback simulation for when onSave is not provided
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setIsSaving(false);
    console.log('🔵 SettingsContent.handleSave completed');
  };

  const handleReset = () => {
    setLocalName(assistant.name);
    setLocalDescription(assistant.description);
    setLocalTemperature([assistant.temperature]);
  };

  // Get active prompt count
  const activePrompts = Object.values(assistant.prompts).filter(
    versions => versions.some(v => v.is_active)
  ).length;

  // Header configuration
  const headerActions = [
    {
      label: isSaving ? "Salvando..." : "Salvar Alterações",
      icon: isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />,
      onClick: handleSave,
      disabled: isSaving,
      variant: "default" as const
    },
    {
      label: "Resetar",
      icon: <RefreshCw className="w-4 h-4" />,
      onClick: handleReset,
      disabled: isSaving,
      variant: "outline" as const
    }
  ];

  const headerMetrics = [
    {
      label: "Temperature",
      value: localTemperature[0].toFixed(1),
      icon: <Thermometer className="w-4 h-4" />,
      color: "accent" as const
    },
    {
      label: "Status",
      value: assistant.active ? "Ativo" : "Inativo",
      icon: <Power className="w-4 h-4" />,
      color: assistant.active ? "success" : "warning" as const
    },
    {
      label: "Prompts Ativos",
      value: `${activePrompts}/3`,
      icon: <MessageSquare className="w-4 h-4" />,
      color: "primary" as const
    }
  ];

  const getPromptTypeName = (type: string) => {
    switch (type) {
      case 'principal': return 'Principal';
      case 'triagem': return 'Triagem';
      case 'think': return 'Think';
      default: return type;
    }
  };

  const getActiveVersion = (versions: PromptVersion[]) => {
    return versions.find(v => v.is_active);
  };

  return (
    <div className="flex flex-col h-full">
      <AssistantStepHeader
        title="Assistant Settings"
        description="Configure your assistant's basic settings and behavior"
        icon={<Settings className="w-5 h-5 text-white" />}
        compact={true}
        actions={headerActions}
        metrics={headerMetrics}
        loading={isSaving}
        className="flex-shrink-0 shadow-none border-0 bg-transparent backdrop-blur-none"
      />

      <div className="flex-1 min-h-0 mt-4">
        <div className="konver-glass-card rounded-2xl h-full flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full konver-scrollbar">
              <div className="p-6 space-y-6">
              <div className="space-y-8">
                {/* Basic Information */}
                <div className="konver-surface-elevated rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="konver-gradient-primary w-10 h-10 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Informações Básicas</h3>
                  <p className="text-sm text-muted-foreground">Configure nome e descrição do assistente</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Nome do Assistente</Label>
                    <Input
                      id="name"
                      value={localName}
                      onChange={(e) => setLocalName(e.target.value)}
                      placeholder="Digite o nome do assistente"
                      className="konver-focus"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                    <div className="flex items-center space-x-2 h-10">
                      <Switch
                        id="status"
                        checked={assistant.active}
                        onCheckedChange={(checked) => updateAssistant({ active: checked })}
                      />
                      <span className={`text-sm font-medium ${assistant.active ? 'text-success' : 'text-muted-foreground'}`}>
                        {assistant.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">Descrição</Label>
                  <Textarea
                    id="description"
                    value={localDescription}
                    onChange={(e) => setLocalDescription(e.target.value)}
                    placeholder="Descreva a funcionalidade e propósito do assistente"
                    rows={3}
                    className="konver-focus resize-none"
                  />
                </div>
              </div>
            </div>

                {/* Behavior Settings */}
                <div className="konver-surface-elevated rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-accent/10 text-accent w-10 h-10 rounded-xl flex items-center justify-center border border-accent/20">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Configurações de Comportamento</h3>
                  <p className="text-sm text-muted-foreground">Ajuste a criatividade e temperatura das respostas</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="temperature" className="text-sm font-medium">Temperature</Label>
                    <Badge variant="outline" className="bg-accent/5 text-accent border-accent/20">
                      {localTemperature[0].toFixed(1)}
                    </Badge>
                  </div>
                  <Slider
                    id="temperature"
                    min={0}
                    max={2}
                    step={0.1}
                    value={localTemperature}
                    onValueChange={setLocalTemperature}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Mais Conservador</span>
                    <span>Mais Criativo</span>
                  </div>
                </div>
              </div>
            </div>

                {/* Active Prompts Overview */}
                <div className="konver-surface-elevated rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-success/10 text-success w-10 h-10 rounded-xl flex items-center justify-center border border-success/20">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Prompts Ativos</h3>
                  <p className="text-sm text-muted-foreground">Versões ativas dos diferentes tipos de prompts</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(assistant.prompts).map(([type, versions]) => {
                  const activeVersion = getActiveVersion(versions);
                  const hasActive = !!activeVersion;

                  return (
                    <div key={type} className="border border-border/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            hasActive ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted-foreground'
                          }`}>
                            {hasActive ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                          </div>
                          <span className="font-medium text-sm">{getPromptTypeName(type)}</span>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={hasActive 
                            ? 'bg-success/5 text-success border-success/20' 
                            : 'bg-muted/5 text-muted-foreground border-muted/20'
                          }
                        >
                          {hasActive ? `v${activeVersion.version}` : 'Não configurado'}
                        </Badge>
                      </div>

                      {hasActive && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {activeVersion.content.substring(0, 100)}...
                          </p>
                          <div className="text-xs text-muted-foreground">
                            Criado: {new Date(activeVersion.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-4">
                        <span className="text-xs text-muted-foreground">
                          {versions.length} versões
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onCreatePromptVersion?.(type as any)}
                          className="text-xs h-7"
                        >
                          {hasActive ? 'Editar' : 'Configurar'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {activePrompts < 3 && (
                <div className="mt-4 p-4 border border-warning/20 rounded-xl bg-warning/5">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-warning">Configuração Incompleta</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Configure todos os tipos de prompts para otimizar o desempenho do assistente.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

                {/* Help Section */}
                <div className="konver-card rounded-xl p-6 bg-muted/20 border-muted/20">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-2">Dicas de Configuração</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>Temperature baixa (0.0-0.3)</strong>: Respostas mais consistentes e previsíveis</li>
                    <li>• <strong>Temperature média (0.4-0.7)</strong>: Equilíbrio entre criatividade e consistência</li>
                    <li>• <strong>Temperature alta (0.8-2.0)</strong>: Respostas mais criativas e variadas</li>
                  </ul>
                </div>
              </div>
            </div>
              </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}