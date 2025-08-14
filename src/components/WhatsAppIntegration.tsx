import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AssistantStepHeader from "@/components/AssistantStepHeader";
import AssistantStepContent from "@/components/AssistantStepContent";
import { 
  MessageCircle,
  ArrowLeft,
  Save,
  TestTube,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  RefreshCw,
  Shield,
  Webhook,
  Phone
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  platform: 'whatsapp' | 'kommo' | 'telegram' | 'facebook' | 'webhook';
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  enabled: boolean;
  description: string;
  icon: React.ReactNode;
  color: 'primary' | 'accent' | 'success' | 'warning' | 'destructive';
  lastActivity?: string;
  messagesCount?: number;
  config?: Record<string, unknown>;
}

interface WhatsAppIntegrationProps {
  integration: Integration;
  onSave: (integration: Integration) => void;
  onClose: () => void;
}

export default function WhatsAppIntegration({ integration, onSave, onClose }: WhatsAppIntegrationProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  
  // Form state
  const [config, setConfig] = useState({
    phoneNumber: integration.config?.phoneNumber || '',
    businessName: integration.config?.businessName || '',
    webhookUrl: integration.config?.webhookUrl || 'https://api.empresa.com/webhook/whatsapp',
    accessToken: integration.config?.accessToken || '',
    verifyToken: integration.config?.verifyToken || '',
    businessAccountId: integration.config?.businessAccountId || '',
    enableAutoReply: integration.config?.enableAutoReply ?? true,
    businessHours: integration.config?.businessHours ?? true,
    welcomeMessage: integration.config?.welcomeMessage || 'Olá! Como posso ajudá-lo hoje?'
  });

  const handleInputChange = (field: string, value: unknown) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const updatedIntegration: Integration = {
      ...integration,
      config,
      status: 'connected',
      enabled: true
    };
    
    onSave(updatedIntegration);
    setIsSaving(false);
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    // Simulate test API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock random test result
    const isSuccess = Math.random() > 0.3;
    setTestResult(isSuccess ? 'success' : 'error');
    setIsTesting(false);
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(config.webhookUrl);
  };

  const generateVerifyToken = () => {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    handleInputChange('verifyToken', token);
  };

  // Header configuration
  const headerActions = [
    {
      label: "Voltar",
      icon: <ArrowLeft className="w-4 h-4" />,
      onClick: onClose,
      variant: "outline" as const
    },
    {
      label: isTesting ? "Testando..." : "Testar Conexão",
      icon: isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />,
      onClick: handleTest,
      disabled: isSaving || isTesting || !config.accessToken,
      variant: "outline" as const
    },
    {
      label: isSaving ? "Salvando..." : "Salvar Configuração",
      icon: isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />,
      onClick: handleSave,
      disabled: isSaving || isTesting,
      variant: "default" as const
    }
  ];

  const headerMetrics = [
    {
      label: "Status",
      value: integration.status === 'connected' ? 'Conectado' : 'Configurando',
      icon: <MessageCircle className="w-4 h-4" />,
      color: integration.status === 'connected' ? "success" : "warning" as const
    },
    {
      label: "Mensagens",
      value: integration.messagesCount?.toLocaleString() || '0',
      icon: <Phone className="w-4 h-4" />,
      color: "accent" as const
    }
  ];

  return (
    <div className="flex flex-col h-full">
      <AssistantStepHeader
        title="WhatsApp Business Integration"
        description="Configure sua conexão com a API oficial do WhatsApp Business"
        icon={<MessageCircle className="w-5 h-5 text-white" />}
        compact={true}
        actions={headerActions}
        metrics={headerMetrics}
        loading={isSaving}
        className="flex-shrink-0 shadow-none border-0 bg-transparent backdrop-blur-none"
      />

      <div className="flex-1 min-h-0 mt-4">
        <AssistantStepContent
          loading={false}
          variant="default"
          padding="none"
          className="h-full"
        >
          <ScrollArea className="h-full konver-scrollbar">
            <div className="p-6">
              <div className="space-y-6">
                {/* Test Result Alert */}
                {testResult && (
                  <Alert 
                    variant={testResult === 'success' ? 'default' : 'destructive'}
                    className={`konver-animate-slide-down ${
                      testResult === 'success' ? 'border-success/20 bg-success/5' : ''
                    }`}
                  >
                    {testResult === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <AlertDescription className="font-medium">
                      {testResult === 'success' 
                        ? 'Conexão testada com sucesso! Sua integração WhatsApp está funcionando corretamente.'
                        : 'Falha no teste de conexão. Verifique suas credenciais e tente novamente.'
                      }
                    </AlertDescription>
                  </Alert>
                )}

                {/* API Configuration */}
                <div className="konver-surface-elevated rounded-2xl p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="bg-success/10 text-success w-10 h-10 rounded-xl flex items-center justify-center border border-success/20">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Configuração da API</h3>
                      <p className="text-sm text-muted-foreground">Credenciais do WhatsApp Business API</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="business-account-id" className="text-sm font-medium">
                          Business Account ID *
                        </Label>
                        <Input
                          id="business-account-id"
                          value={config.businessAccountId}
                          onChange={(e) => handleInputChange('businessAccountId', e.target.value)}
                          placeholder="123456789012345"
                          className="konver-focus"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone-number" className="text-sm font-medium">
                          Número de Telefone *
                        </Label>
                        <Input
                          id="phone-number"
                          value={config.phoneNumber}
                          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                          placeholder="+55 11 99999-9999"
                          className="konver-focus"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="access-token" className="text-sm font-medium">
                        Access Token *
                      </Label>
                      <Input
                        id="access-token"
                        type="password"
                        value={config.accessToken}
                        onChange={(e) => handleInputChange('accessToken', e.target.value)}
                        placeholder="EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="konver-focus"
                      />
                      <p className="text-xs text-muted-foreground">
                        Token de acesso permanente da API do WhatsApp Business
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="business-name" className="text-sm font-medium">
                        Nome do Negócio
                      </Label>
                      <Input
                        id="business-name"
                        value={config.businessName}
                        onChange={(e) => handleInputChange('businessName', e.target.value)}
                        placeholder="Minha Empresa"
                        className="konver-focus"
                      />
                    </div>
                  </div>
                </div>

                {/* Webhook Configuration */}
                <div className="konver-surface-elevated rounded-2xl p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="bg-accent/10 text-accent w-10 h-10 rounded-xl flex items-center justify-center border border-accent/20">
                      <Webhook className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Configuração do Webhook</h3>
                      <p className="text-sm text-muted-foreground">Endpoint para receber mensagens</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="webhook-url" className="text-sm font-medium">
                        URL do Webhook *
                      </Label>
                      <div className="flex space-x-2">
                        <Input
                          id="webhook-url"
                          value={config.webhookUrl}
                          onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
                          placeholder="https://sua-api.com/webhook/whatsapp"
                          className="konver-focus flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyWebhook}
                          className="px-3"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="verify-token" className="text-sm font-medium">
                          Verify Token *
                        </Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={generateVerifyToken}
                          className="text-xs"
                        >
                          Gerar Token
                        </Button>
                      </div>
                      <Input
                        id="verify-token"
                        value={config.verifyToken}
                        onChange={(e) => handleInputChange('verifyToken', e.target.value)}
                        placeholder="Token de verificação"
                        className="konver-focus"
                      />
                      <p className="text-xs text-muted-foreground">
                        Token usado para verificar a autenticidade do webhook
                      </p>
                    </div>
                  </div>
                </div>

                {/* Behavior Settings */}
                <div className="konver-surface-elevated rounded-2xl p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="bg-primary/10 text-primary w-10 h-10 rounded-xl flex items-center justify-center border border-primary/20">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Configurações de Comportamento</h3>
                      <p className="text-sm text-muted-foreground">Como o assistente responde no WhatsApp</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl">
                        <div>
                          <h4 className="text-sm font-medium">Resposta Automática</h4>
                          <p className="text-xs text-muted-foreground">Responder automaticamente às mensagens recebidas</p>
                        </div>
                        <Switch
                          checked={config.enableAutoReply}
                          onCheckedChange={(checked) => handleInputChange('enableAutoReply', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl">
                        <div>
                          <h4 className="text-sm font-medium">Horário Comercial</h4>
                          <p className="text-xs text-muted-foreground">Respeitar horário comercial para respostas</p>
                        </div>
                        <Switch
                          checked={config.businessHours}
                          onCheckedChange={(checked) => handleInputChange('businessHours', checked)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="welcome-message" className="text-sm font-medium">
                        Mensagem de Boas-vindas
                      </Label>
                      <Textarea
                        id="welcome-message"
                        value={config.welcomeMessage}
                        onChange={(e) => handleInputChange('welcomeMessage', e.target.value)}
                        placeholder="Digite a mensagem de boas-vindas..."
                        rows={3}
                        className="konver-focus resize-none"
                      />
                      <p className="text-xs text-muted-foreground">
                        Mensagem enviada automaticamente para novos contatos
                      </p>
                    </div>
                  </div>
                </div>

                {/* Setup Instructions */}
                <div className="konver-card rounded-xl p-6 bg-muted/20 border-muted/20">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium mb-2">Instruções de Configuração</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• <strong>1.</strong> Crie uma conta no Meta for Developers e configure o WhatsApp Business API</li>
                        <li>• <strong>2.</strong> Obtenha o Business Account ID e Access Token permanente</li>
                        <li>• <strong>3.</strong> Configure o webhook URL no painel do Meta Business</li>
                        <li>• <strong>4.</strong> Use o Verify Token gerado para verificar o webhook</li>
                        <li>• <strong>5.</strong> Teste a conexão antes de ativar</li>
                      </ul>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 text-xs"
                        onClick={() => window.open('https://developers.facebook.com/docs/whatsapp', '_blank')}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Ver Documentação
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </AssistantStepContent>
      </div>
    </div>
  );
}