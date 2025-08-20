import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import AssistantStepHeader from "@/components/AssistantStepHeader";
import AssistantStepContent from "@/components/AssistantStepContent";
import { useWhatsApp } from "@/hooks/useWhatsApp";
import { 
  MessageCircle,
  ArrowLeft,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Power,
  PowerOff,
  Trash2,
  Phone,
  Clock,
  Smartphone
} from "lucide-react";

interface WhatsAppConnectionProps {
  botId: string;
  onClose: () => void;
}

export default function WhatsAppConnection({ botId, onClose }: WhatsAppConnectionProps) {
  const {
    status,
    isLoading,
    isConnecting,
    connect,
    disconnect,
    deleteInstance,
    refreshStatus,
    qrCode,
    error
  } = useWhatsApp({ botId });



  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error("Connection failed:", error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Disconnect failed:", error);
    }
  };

  const handleDeleteInstance = async () => {
    if (window.confirm("Tem certeza que deseja remover completamente esta instância WhatsApp? Esta ação não pode ser desfeita.")) {
      try {
        await deleteInstance();
      } catch (error) {
        console.error("Delete failed:", error);
      }
    }
  };


  const getStatusBadge = () => {
    const statusConfig = {
      connected: { label: "Conectado", color: "success" as const, icon: CheckCircle2 },
      connecting: { label: "Conectando...", color: "warning" as const, icon: Clock },
      disconnected: { label: "Desconectado", color: "destructive" as const, icon: AlertTriangle }
    };

    const config = statusConfig[status.status];
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={`border-${config.color}/20 bg-${config.color}/5 text-${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Header actions based on status
  const getHeaderActions = () => {
    const actions = [
      {
        label: "Voltar",
        icon: <ArrowLeft className="w-4 h-4" />,
        onClick: onClose,
        variant: "outline" as const
      }
    ];

    if (status.status === "disconnected") {
      actions.push({
        label: isConnecting ? "Conectando..." : "Conectar WhatsApp",
        icon: isConnecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />,
        onClick: handleConnect,
        disabled: isConnecting,
        variant: "default" as const
      });
    } else if (status.status === "connected") {
      actions.push({
        label: "Desconectar",
        icon: <PowerOff className="w-4 h-4" />,
        onClick: handleDisconnect,
        variant: "outline" as const
      });
    }

    if (status.instanceName) {
      actions.push({
        label: "Remover Instância",
        icon: <Trash2 className="w-4 h-4" />,
        onClick: handleDeleteInstance,
        variant: "destructive" as const
      });
    }

    return actions;
  };

  const headerMetrics = [
    {
      label: "Status",
      value: getStatusBadge(),
      icon: <MessageCircle className="w-4 h-4" />,
      color: "accent" as const
    }
  ];

  if (status.instanceName) {
    headerMetrics.push({
      label: "Instância",
      value: status.instanceName,
      icon: <Smartphone className="w-4 h-4" />,
      color: "primary" as const
    });
  }

  if (status.phoneNumber) {
    headerMetrics.push({
      label: "Telefone",
      value: status.phoneNumber,
      icon: <Phone className="w-4 h-4" />,
      color: "success" as const
    });
  }

  return (
    <div className="flex flex-col h-full">
      <AssistantStepHeader
        title="Conexão WhatsApp"
        description="Gerencie a conexão do seu assistente com o WhatsApp"
        icon={<MessageCircle className="w-5 h-5 text-white" />}
        compact={true}
        actions={getHeaderActions()}
        metrics={headerMetrics}
        loading={isLoading}
        className="flex-shrink-0 shadow-none border-0 bg-transparent backdrop-blur-none"
      />

      <div className="flex-1 min-h-0 mt-4">
        <AssistantStepContent
          loading={isLoading}
          variant="default"
          padding="none"
          className="h-full"
        >
          <ScrollArea className="h-full konver-scrollbar">
            <div className="p-6">
              <div className="space-y-6">
                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive" className="konver-animate-slide-down">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="font-medium">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Connection Status */}
                <div className="konver-surface-elevated rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold">Status da Conexão</h3>
                      <p className="text-sm text-muted-foreground">
                        Estado atual da integração WhatsApp
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshStatus}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          status.status === 'connected' ? 'bg-success animate-pulse' :
                          status.status === 'connecting' ? 'bg-warning animate-pulse' :
                          'bg-destructive'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">Estado da Conexão</p>
                          <p className="text-xs text-muted-foreground">
                            {status.status === 'connected' ? 'WhatsApp conectado e funcionando' :
                             status.status === 'connecting' ? 'Aguardando escaneamento do QR Code' :
                             'WhatsApp não conectado'}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge()}
                    </div>

                    {status.instanceName && (
                      <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl">
                        <div>
                          <p className="text-sm font-medium">Nome da Instância</p>
                          <p className="text-xs text-muted-foreground font-mono">{status.instanceName}</p>
                        </div>
                      </div>
                    )}

                    {status.profileName && (
                      <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl">
                        <div>
                          <p className="text-sm font-medium">Perfil Conectado</p>
                          <p className="text-xs text-muted-foreground">{status.profileName}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Code Section */}
                {status.status === "connecting" && qrCode && (
                  <div className="konver-surface-elevated rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="bg-primary/10 text-primary w-10 h-10 rounded-xl flex items-center justify-center border border-primary/20">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Escaneie o QR Code</h3>
                        <p className="text-sm text-muted-foreground">
                          Abra o WhatsApp e escaneie o código abaixo
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center space-y-4">
                      <div className="bg-white p-4 rounded-xl border-2 border-border/20">
                        <img 
                          src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} 
                          alt="QR Code WhatsApp" 
                          className="w-64 h-64"
                        />
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                          1. Abra o WhatsApp no seu celular
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          2. Toque em "Dispositivos Conectados"
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          3. Escaneie este código QR
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          O QR Code é renovado automaticamente a cada 20 segundos
                        </p>
                      </div>
                    </div>
                  </div>
                )}


                {/* Instructions */}
                {status.status === "disconnected" && !isConnecting && (
                  <div className="konver-card rounded-xl p-6 bg-muted/20 border-muted/20">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium mb-2">Como Conectar</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• <strong>1.</strong> Clique em "Conectar WhatsApp" para gerar um QR Code</li>
                          <li>• <strong>2.</strong> Abra o WhatsApp no seu celular</li>
                          <li>• <strong>3.</strong> Vá em "Dispositivos Conectados" e escaneie o código</li>
                          <li>• <strong>4.</strong> Aguarde a confirmação da conexão</li>
                          <li>• <strong>5.</strong> Sua integração WhatsApp estará pronta para uso</li>
                        </ul>
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