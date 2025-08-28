import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FlowAction, FlowActionType, FlowActionConfig } from "@/types/assistant";
import { useKommoFields, getKommoFieldOptions, formatKommoFieldType } from "@/hooks/useKommoFields";
import { 
  MessageCircle, 
  Building2, 
  StopCircle, 
  Trash2, 
  GripVertical,
  Settings,
  Loader2,
  AlertTriangle
} from "lucide-react";

interface ActionCardProps {
  action: FlowAction;
  sequenceOrder: number;
  onUpdate: (updates: Partial<FlowAction>) => void;
  onDelete: () => void;
  onConfigChange: (config: FlowActionConfig) => void;
  dragHandleProps?: Record<string, unknown>;
  botId: string;
}

const ACTION_TYPE_CONFIG = {
  whatsapp_message: {
    label: 'Enviar Mensagem WhatsApp',
    icon: MessageCircle,
    color: 'bg-green-500/10 text-green-700 border-green-500/20',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
  },
  kommo_field_update: {
    label: 'Atualizar Campo Kommo',
    icon: Building2,
    color: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
  },
  stop_conversation: {
    label: 'Parar Conversa',
    icon: StopCircle,
    color: 'bg-red-500/10 text-red-700 border-red-500/20',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
  }
};

const WhatsAppMessageForm: React.FC<{
  config: FlowActionConfig;
  onConfigChange: (config: FlowActionConfig) => void;
}> = ({ config, onConfigChange }) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone_number">Número do WhatsApp</Label>
        <Input
          id="phone_number"
          placeholder="Ex: 5511999999999 (com código do país)"
          value={config.phone_number || ''}
          onChange={(e) => onConfigChange({ ...config, phone_number: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Número com código do país (55 para Brasil)
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="message">Mensagem</Label>
        <Textarea
          id="message"
          placeholder="Digite a mensagem que será enviada via WhatsApp..."
          value={config.message || ''}
          onChange={(e) => onConfigChange({ ...config, message: e.target.value })}
          rows={3}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          A mensagem será enviada automaticamente quando esta ação for executada
        </p>
      </div>
    </div>
  );
};

const KommoFieldUpdateForm: React.FC<{
  config: FlowActionConfig;
  onConfigChange: (config: FlowActionConfig) => void;
  botId: string;
}> = ({ config, onConfigChange, botId }) => {
  const { filteredFields, isLoading, error } = useKommoFields(botId);
  
  // Find selected field to show its details and options
  const selectedField = filteredFields.find(field => field.id === config.field_id);

  // Handle field selection
  const handleFieldChange = (fieldId: string) => {
    const field = filteredFields.find(f => f.id === parseInt(fieldId));
    onConfigChange({ 
      ...config, 
      field_id: parseInt(fieldId),
      field_name: field?.name, // Keep for backward compatibility
      field_value: '' // Clear value when changing field
    });
  };

  // Handle value change
  const handleValueChange = (value: string) => {
    onConfigChange({ ...config, field_value: value });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Carregando campos do Kommo...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Erro ao carregar campos do Kommo: {error.message}
          </AlertDescription>
        </Alert>
        <p className="text-xs text-muted-foreground">
          Verifique se a integração com o Kommo está configurada corretamente.
        </p>
      </div>
    );
  }

  if (filteredFields.length === 0) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Nenhum campo personalizado disponível no Kommo.
          </AlertDescription>
        </Alert>
        <p className="text-xs text-muted-foreground">
          Campos devem ter is_api_only: true e is_deletable: true para aparecerem aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="field_id">Campo a Atualizar *</Label>
          <Select 
            value={config.field_id?.toString() || ''} 
            onValueChange={handleFieldChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o campo do Kommo" />
            </SelectTrigger>
            <SelectContent>
              {filteredFields.map((field) => (
                <SelectItem key={field.id} value={field.id.toString()}>
                  <div className="flex items-center justify-between w-full">
                    <span>{field.name}</span>
                    <Badge variant="secondary" className="text-xs ml-2">
                      {formatKommoFieldType(field.type)}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedField && (
            <p className="text-xs text-muted-foreground">
              Tipo: {formatKommoFieldType(selectedField.type)} • ID: {selectedField.id}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="field_value">Novo Valor *</Label>
          {selectedField?.type === 'select' ? (
            <Select 
              value={config.field_value || ''} 
              onValueChange={handleValueChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent>
                {getKommoFieldOptions(selectedField).map((option) => (
                  <SelectItem key={option.value} value={option.label}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : selectedField?.type === 'date' || selectedField?.type === 'date_time' ? (
            <Input
              id="field_value"
              type={selectedField.type === 'date_time' ? 'datetime-local' : 'date'}
              value={config.field_value || ''}
              onChange={(e) => handleValueChange(e.target.value)}
            />
          ) : selectedField?.type === 'numeric' ? (
            <Input
              id="field_value"
              type="number"
              placeholder="Digite um número"
              value={config.field_value || ''}
              onChange={(e) => handleValueChange(e.target.value)}
            />
          ) : selectedField?.type === 'checkbox' ? (
            <Select 
              value={config.field_value || ''} 
              onValueChange={handleValueChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Sim</SelectItem>
                <SelectItem value="false">Não</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="field_value"
              placeholder="Digite o valor"
              value={config.field_value || ''}
              onChange={(e) => handleValueChange(e.target.value)}
            />
          )}
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground">
        O campo "{selectedField?.name || 'selecionado'}" será atualizado no CRM Kommo com o valor especificado
      </p>
    </div>
  );
};

const StopConversationForm: React.FC<{
  config: FlowActionConfig;
  onConfigChange: (config: FlowActionConfig) => void;
}> = ({ config, onConfigChange }) => {
  const stopReasons = [
    { value: 'transferred_to_flow', label: 'Transferido para fluxo automatizado' },
    { value: 'conversation_ended', label: 'Conversa finalizada' },
    { value: 'await_human_response', label: 'Aguardar resposta humana' },
    { value: 'user_request', label: 'Solicitação do usuário' },
    { value: 'escalated_to_support', label: 'Escalado para suporte' }
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reason">Motivo da Parada</Label>
        <Select 
          value={config.reason || ''} 
          onValueChange={(value) => onConfigChange({ ...config, reason: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o motivo" />
          </SelectTrigger>
          <SelectContent>
            {stopReasons.map((reason) => (
              <SelectItem key={reason.value} value={reason.value}>
                {reason.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <p className="text-xs text-muted-foreground">
        A conversa será interrompida e o motivo será registrado para controle
      </p>
    </div>
  );
};

export default function ActionCard({
  action,
  sequenceOrder,
  onUpdate,
  onDelete,
  onConfigChange,
  dragHandleProps,
  botId
}: ActionCardProps) {
  const actionConfig = ACTION_TYPE_CONFIG[action.action_type];
  const IconComponent = actionConfig.icon;

  const renderActionForm = () => {
    switch (action.action_type) {
      case 'whatsapp_message':
        return (
          <WhatsAppMessageForm
            config={action.config}
            onConfigChange={onConfigChange}
          />
        );
      case 'kommo_field_update':
        return (
          <KommoFieldUpdateForm
            config={action.config}
            onConfigChange={onConfigChange}
            botId={botId}
          />
        );
      case 'stop_conversation':
        return (
          <StopConversationForm
            config={action.config}
            onConfigChange={onConfigChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`konver-glass-card rounded-xl overflow-hidden transition-all duration-200 ${actionConfig.bgColor}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div 
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={`text-xs ${actionConfig.color}`}>
              <IconComponent className="w-3 h-3 mr-1" />
              {sequenceOrder}
            </Badge>
            <h4 className="font-medium text-sm">{actionConfig.label}</h4>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="w-8 h-8 p-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Configuration Form */}
      <div className="p-4">
        {renderActionForm()}
      </div>
    </div>
  );
}