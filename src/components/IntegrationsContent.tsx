import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import AssistantStepHeader from "@/components/AssistantStepHeader";
import IntegrationCard from "@/components/IntegrationCard";
import WhatsAppIntegration from "@/components/WhatsAppIntegration";
import WhatsAppConnection from "@/components/WhatsAppConnection";
import KommoIntegration from "@/components/KommoIntegration";
import { useIntegrations } from "@/hooks/useIntegrations";
import { useBot } from "@/hooks/useBots";
import { Integration, KommoConfig, WhatsAppConfig } from "@/integrations/supabase/types";
import { 
  Puzzle,
  Plus,
  Settings,
  CheckCircle2,
  RefreshCw,
  MessageCircle,
  Phone,
  Webhook,
  ActivitySquare
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

interface IntegrationsContentProps {
  assistantId: string;
}

export default function IntegrationsContent({ assistantId }: IntegrationsContentProps) {
  const { integrations: dbIntegrations, isLoading, refetch } = useIntegrations(assistantId);
  const { data: bot, isLoading: botLoading } = useBot(assistantId);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationUIData | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Convert database integrations to UI data
  const integrations = useMemo(() => {
    // Don't render integrations until we have data loaded
    if (isLoading || botLoading) {
      return [];
    }

    const uiIntegrations: IntegrationUIData[] = [];

    // WhatsApp integration - use bot whatsapp_status as primary source
    const whatsappDb = dbIntegrations.find(i => i.provider === 'whatsapp');
    
    // Use bot's whatsapp_status as the source of truth
    const getBotWhatsAppStatus = () => {
      const botWithWhatsApp = bot as any;
      if (!botWithWhatsApp?.whatsapp_status) return 'disconnected';
      
      switch (botWithWhatsApp.whatsapp_status) {
        case 'connected':
          return 'connected';
        case 'connecting':
          return 'pending';
        case 'disconnected':
        default:
          return 'disconnected';
      }
    };
    
    const whatsappCardStatus = getBotWhatsAppStatus();
    const whatsappCardColor: 'primary' | 'accent' | 'success' | 'warning' | 'destructive' = 
      whatsappCardStatus === 'connected' ? 'success' : 
      whatsappCardStatus === 'pending' ? 'warning' : 
      'warning';
    
    uiIntegrations.push({
      id: whatsappDb?.id || 'whatsapp-new',
      name: 'WhatsApp',
      platform: 'whatsapp',
      status: whatsappCardStatus,
      description: 'Integração com WhatsApp para atendimento automatizado',
      icon: <MessageCircle className="w-5 h-5" />,
      color: whatsappCardColor,
      config: {
        ...(whatsappDb?.config as Record<string, unknown>),
        // Include bot WhatsApp data for reference
        whatsapp_instance: (bot as any)?.whatsapp_instance,
        whatsapp_phone_number: (bot as any)?.whatsapp_phone_number,
        whatsapp_profile_name: (bot as any)?.whatsapp_profile_name,
      }
    });

    // Kommo integration - use database status only
    const kommoDb = dbIntegrations.find(i => i.provider === 'kommo');
    uiIntegrations.push({
      id: kommoDb?.id || 'kommo-new',
      name: 'Kommo CRM',
      platform: 'kommo',
      status: kommoDb?.enabled ? 'connected' : 'disconnected',
      description: 'Sincronização de leads e conversas com o sistema Kommo CRM',
      icon: <ActivitySquare className="w-5 h-5" />,
      color: kommoDb?.enabled ? 'success' : 'warning',
      config: kommoDb?.config as any
    });

    return uiIntegrations;
  }, [dbIntegrations, bot, isLoading, botLoading]);

  const handleRefresh = async () => {
    await refetch();
  };


  const handleConfigureIntegration = (integration: IntegrationUIData) => {
    setSelectedIntegration(integration);
  };

  const handleCloseConfig = () => {
    setSelectedIntegration(null);
  };

  const handleSaveIntegration = async (updatedIntegration: IntegrationUIData) => {
    // Refresh data from database
    await refetch();
    setSelectedIntegration(null);
  };


  // Header configuration
  const headerActions: never[] = [];



  // Empty state configuration
  const emptyStateConfig = {
    icon: <Puzzle className="w-10 h-10" />,
    title: "Nenhuma Integração Configurada",
    description: "Configure suas primeiras integrações para conectar o assistente com plataformas externas como WhatsApp e CRM.",
    action: {
      label: "Adicionar Primeira Integração",
      onClick: () => setShowAddModal(true),
      icon: <Plus className="w-4 h-4" />
    }
  };

  // Render integration configuration modal
  if (selectedIntegration) {
    if (selectedIntegration.platform === 'whatsapp') {
      return (
        <WhatsAppConnection
          botId={assistantId}
          onClose={handleCloseConfig}
        />
      );
    } else if (selectedIntegration.platform === 'kommo') {
      return (
        <KommoIntegration
          integration={selectedIntegration}
          onSave={handleSaveIntegration}
          onClose={handleCloseConfig}
          botId={assistantId}
        />
      );
    }
  }

  return (
    <div className="flex flex-col h-full">
      <AssistantStepHeader
        title="Integrações"
        description="Gerencie conexões com plataformas externas e APIs"
        icon={<Puzzle className="w-5 h-5 text-white" />}
        compact={true}
        actions={headerActions}
        loading={false}
        className="flex-shrink-0 shadow-none border-0 bg-transparent backdrop-blur-none"
      />

      <div className="flex-1 min-h-0 mt-4">
        <div className="konver-glass-card rounded-2xl h-full flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full konver-scrollbar">
              <div className="p-6">
              {isLoading ? (
                // Loading skeleton for integrations
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2].map((i) => (
                      <div key={i} className="konver-glass-card rounded-2xl p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-xl bg-muted animate-pulse" />
                            <div className="space-y-2">
                              <div className="h-4 bg-muted rounded animate-pulse w-24" />
                              <div className="h-3 bg-muted rounded animate-pulse w-16" />
                            </div>
                          </div>
                          <div className="w-6 h-6 bg-muted rounded-full animate-pulse" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 bg-muted rounded animate-pulse w-full" />
                          <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="h-6 bg-muted rounded animate-pulse w-20" />
                        </div>
                        <div className="h-9 bg-muted rounded animate-pulse" />
                      </div>
                    ))}
                  </div>

                </div>
              ) : integrations.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-center">
                  <div className="max-w-sm space-y-4">
                    <div className="konver-gradient-primary w-12 h-12 rounded-xl flex items-center justify-center mx-auto shadow-lg">
                      <Puzzle className="w-6 h-6 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold konver-text-gradient">Nenhuma Integração Configurada</h3>
                      <p className="text-sm text-muted-foreground">
                        Conecte seu assistente com WhatsApp e Kommo para expandir seu alcance.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* All Integrations */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {integrations.map(integration => (
                      <IntegrationCard
                        key={integration.id}
                        integration={integration}
                        onConfigure={handleConfigureIntegration}
                        loading={false}
                      />
                    ))}
                  </div>

                </div>
              )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}