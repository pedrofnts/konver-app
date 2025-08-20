import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AssistantStepHeader from "@/components/AssistantStepHeader";
import AssistantStepContent from "@/components/AssistantStepContent";
import { useIntegrations } from "@/hooks/useIntegrations";
import { KommoConfig } from "@/integrations/supabase/types";
import { 
  ActivitySquare,
  ArrowLeft,
  Save,
  TestTube,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Shield,
  Settings,
  Edit
} from "lucide-react";

interface IntegrationUIData {
  id: string;
  name: string;
  platform: 'whatsapp' | 'kommo';
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  description: string;
  icon: React.ReactNode;
  color: 'primary' | 'accent' | 'success' | 'warning' | 'destructive';
  config?: Record<string, unknown>;
}

interface KommoIntegrationProps {
  integration: IntegrationUIData;
  onSave: (integration: IntegrationUIData) => void;
  onClose: () => void;
}

export default function KommoIntegration({ integration, onSave, onClose }: KommoIntegrationProps) {
  const { createOrUpdateIntegration } = useIntegrations();
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state - initialize with all config data from integration
  const [config, setConfig] = useState<KommoConfig>(() => {
    const integrationConfig = integration.config as KommoConfig;
    return {
      url: integrationConfig?.url || '',
      token: integrationConfig?.token || '',
      accountName: integrationConfig?.accountName || '',
      accountId: integrationConfig?.accountId || '',
      subdomain: integrationConfig?.subdomain || '',
      connectedAt: integrationConfig?.connectedAt || ''
    };
  });

  // Check if integration is connected (has account name from initial data or current config)
  const isConnected = integration.status === 'connected' && (
    config.accountName || 
    (integration.config as KommoConfig)?.accountName
  );

  // Update config when integration prop changes
  useEffect(() => {
    const integrationConfig = integration.config as KommoConfig;
    if (integrationConfig) {
      setConfig({
        url: integrationConfig.url || '',
        token: integrationConfig.token || '',
        accountName: integrationConfig.accountName || '',
        accountId: integrationConfig.accountId || '',
        subdomain: integrationConfig.subdomain || '',
        connectedAt: integrationConfig.connectedAt || ''
      });
    }
  }, [integration.config]);

  const handleInputChange = (field: string, value: unknown) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setTestResult(null);
    setTestMessage('');
    
    try {
      // Verificar a conta antes de salvar
      if (config.url && config.token) {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-kommo-connection`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            url: config.url,
            token: config.token
          })
        });

        const result = await response.json();
        
        if (!result.success) {
          setTestResult('error');
          setTestMessage(result.error || 'Credenciais inválidas. Não foi possível salvar.');
          return;
        }

        // Atualizar config com informações da conta se o teste foi bem-sucedido
        const updatedConfig = {
          ...config,
          accountName: result.data.accountName,
          accountId: result.data.accountId,
          subdomain: result.data.subdomain,
          connectedAt: new Date().toISOString()
        };

        // Atualizar o estado local para refletir as mudanças imediatamente
        setConfig(updatedConfig);
        
        await createOrUpdateIntegration('kommo', updatedConfig, true);
        
        const updatedIntegration: IntegrationUIData = {
          ...integration,
          config: updatedConfig,
          status: 'connected'
        };
        
        setTestResult('success');
        setTestMessage(`Conectado com sucesso à ${result.data.accountName}`);
        setIsEditing(false); // Exit edit mode after successful save
        onSave(updatedIntegration);
      } else {
        setTestResult('error');
        setTestMessage('URL e token são obrigatórios');
      }
    } catch (error) {
      console.error('Error saving Kommo integration:', error);
      setTestResult('error');
      setTestMessage('Erro ao salvar integração');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    setTestMessage('');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-kommo-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          url: config.url,
          token: config.token
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setTestResult('success');
        setTestMessage(result.data?.message || 'Conexão testada com sucesso!');
        console.log('Kommo connection test successful:', result.data);
        
        // Update config with account information
        if (result.data) {
          setConfig(prev => ({
            ...prev,
            accountName: result.data.accountName,
            accountId: result.data.accountId,
            subdomain: result.data.subdomain,
            connectedAt: new Date().toISOString()
          }));
        }
      } else {
        setTestResult('error');
        setTestMessage(result.error || 'Falha no teste de conexão');
        console.error('Kommo connection test failed:', result.error);
      }
    } catch (error) {
      console.error('Error testing Kommo connection:', error);
      setTestResult('error');
      setTestMessage('Erro de rede ao testar a conexão');
    } finally {
      setIsTesting(false);
    }
  };


  // Header configuration
  const headerActions = isConnected && !isEditing ? [
    {
      label: "Voltar",
      icon: <ArrowLeft className="w-4 h-4" />,
      onClick: onClose,
      variant: "outline" as const
    },
    {
      label: "Editar",
      icon: <Settings className="w-4 h-4" />,
      onClick: () => setIsEditing(true),
      variant: "outline" as const
    }
  ] : [
    {
      label: "Voltar",
      icon: <ArrowLeft className="w-4 h-4" />,
      onClick: () => isEditing ? setIsEditing(false) : onClose,
      variant: "outline" as const
    },
    {
      label: isTesting ? "Testando..." : "Testar Conexão",
      icon: isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />,
      onClick: handleTest,
      disabled: isSaving || isTesting || !config.url || !config.token,
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
      icon: <ActivitySquare className="w-4 h-4" />,
      color: integration.status === 'connected' ? "success" : "warning" as const
    },
    ...(config.accountName ? [{
      label: "Conta",
      value: config.accountName,
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: "success" as const
    }] : [])
  ];

  return (
    <div className="flex flex-col h-full">
      <AssistantStepHeader
        title={config.accountName ? `Kommo - ${config.accountName}` : "Kommo CRM Integration"}
        description="Configure a sincronização com o sistema Kommo CRM"
        icon={<ActivitySquare className="w-5 h-5 text-white" />}
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
                      {testMessage || (testResult === 'success' 
                        ? 'Conexão testada com sucesso! Sua integração Kommo está funcionando corretamente.'
                        : 'Falha no teste de conexão. Verifique suas credenciais e configurações.'
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Connected Account View */}
                {isConnected && !isEditing && (
                  <div className="konver-surface-elevated rounded-2xl p-6 border-success/20 bg-success/5">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="bg-success/10 text-success w-12 h-12 rounded-xl flex items-center justify-center border border-success/20">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-success">Conectado</h3>
                          <p className="text-sm text-muted-foreground">Integração ativa e funcionando</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-2"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Configurar</span>
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                        <div className="text-xs text-muted-foreground mb-2">Conta Conectada</div>
                        <div className="font-semibold text-lg">{config.accountName}</div>
                      </div>
                      
                      {config.subdomain && (
                        <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                          <div className="text-xs text-muted-foreground mb-2">Subdomínio</div>
                          <div className="font-medium">{config.subdomain}</div>
                        </div>
                      )}
                      
                      {config.accountId && (
                        <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                          <div className="text-xs text-muted-foreground mb-2">ID da Conta</div>
                          <div className="font-medium">#{config.accountId}</div>
                        </div>
                      )}
                      
                      {config.connectedAt && (
                        <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                          <div className="text-xs text-muted-foreground mb-2">Conectado em</div>
                          <div className="font-medium">
                            {new Date(config.connectedAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* API Configuration */}
                {(!isConnected || isEditing) && (
                <div className="konver-surface-elevated rounded-2xl p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="bg-warning/10 text-warning w-10 h-10 rounded-xl flex items-center justify-center border border-warning/20">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Configuração da API</h3>
                      <p className="text-sm text-muted-foreground">Credenciais de acesso ao Kommo CRM</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="url" className="text-sm font-medium">
                        URL do Kommo *
                      </Label>
                      <Input
                        id="url"
                        value={config.url}
                        onChange={(e) => handleInputChange('url', e.target.value)}
                        placeholder="https://minhaempresa.kommo.com"
                        className="konver-focus"
                      />
                      <p className="text-xs text-muted-foreground">
                        URL completa da sua instância do Kommo CRM
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="token" className="text-sm font-medium">
                        Token de Acesso *
                      </Label>
                      <Input
                        id="token"
                        type="password"
                        value={config.token}
                        onChange={(e) => handleInputChange('token', e.target.value)}
                        placeholder="kommo_access_token_here"
                        className="konver-focus"
                      />
                      <p className="text-xs text-muted-foreground">
                        Token de autenticação para acesso à API do Kommo
                      </p>
                    </div>
                  </div>
                </div>
                )}

                {/* Setup Instructions */}
                {(!isConnected || isEditing) && (
                <div className="konver-card rounded-xl p-6 bg-muted/20 border-muted/20">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium mb-2">Instruções de Configuração</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• <strong>1.</strong> Acesse as configurações da sua conta Kommo</li>
                        <li>• <strong>2.</strong> Obtenha sua URL da instância do Kommo</li>
                        <li>• <strong>3.</strong> Gere ou obtenha seu token de acesso da API</li>
                        <li>• <strong>4.</strong> Configure as permissões necessárias para o token</li>
                        <li>• <strong>5.</strong> Teste a conexão antes de salvar</li>
                      </ul>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 text-xs"
                        onClick={() => window.open('https://www.kommo.com/support/developers/', '_blank')}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Ver Documentação
                      </Button>
                    </div>
                  </div>
                </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </AssistantStepContent>
      </div>
    </div>
  );
}