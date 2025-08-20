import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { whatsAppService, type CreateWhatsAppInstanceResult, type WhatsAppConnectionStatus } from "@/services/whatsapp";
import { toast } from "sonner";

export interface UseWhatsAppProps {
  botId: string;
  enabled?: boolean;
}

export interface UseWhatsAppResult {
  // Connection status
  status: WhatsAppConnectionStatus;
  isLoading: boolean;
  isConnecting: boolean;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  deleteInstance: () => Promise<void>;
  refreshStatus: () => void;
  
  // QR Code
  qrCode: string | null;
  
  // Error handling
  error: string | null;
}

/**
 * Hook for managing WhatsApp integration for a bot
 */
export function useWhatsApp({ botId, enabled = true }: UseWhatsAppProps): UseWhatsAppResult {
  const queryClient = useQueryClient();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [qrCodeGeneratedAt, setQrCodeGeneratedAt] = useState<Date | null>(null);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);

  // Query for connection status
  const {
    data: status,
    isLoading,
    error: queryError,
    refetch: refreshStatus,
  } = useQuery({
    queryKey: ["whatsapp-status", botId],
    queryFn: () => whatsAppService.getConnectionStatus(botId),
    enabled,
    refetchInterval: (data) => {
      // Refresh more frequently when connecting
      if (data?.status === "connecting") return 3000; // 3 seconds
      if (data?.status === "connected") return 30000; // 30 seconds
      return false; // Don't auto-refresh when disconnected
    },
    staleTime: 1000, // Consider data stale after 1 second
  });

  // Update QR code when status changes
  useEffect(() => {
    if (status?.qrCode) {
      setQrCode(status.qrCode);
      setQrCodeGeneratedAt(new Date());
      setConsecutiveFailures(0); // Reset failures on successful QR code
    } else {
      setQrCode(null);
      setQrCodeGeneratedAt(null);
    }
  }, [status?.qrCode]);

  // Auto-refresh QR code when it expires (20 seconds) and we're connecting
  useEffect(() => {
    if (status?.status === "connecting" && qrCodeGeneratedAt) {
      const interval = setInterval(() => {
        const now = new Date();
        const timeDiff = now.getTime() - qrCodeGeneratedAt.getTime();
        const twentySeconds = 20 * 1000;
        
        // If QR code is older than 20 seconds, try to refresh it
        if (timeDiff > twentySeconds) {
          console.log("QR Code expired, refreshing...");
          refreshQRCode();
        }
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [status?.status, qrCodeGeneratedAt]);

  // Refresh QR Code function
  const refreshQRCode = async () => {
    if (consecutiveFailures >= 3) {
      console.warn("Too many consecutive failures, stopping QR refresh");
      return;
    }

    try {
      console.log("Refreshing QR Code...");
      if (status?.instanceName) {
        const result = await whatsAppService.createOrConnectInstance(botId);
        if (result.success && result.qrCode) {
          setQrCode(result.qrCode);
          setQrCodeGeneratedAt(new Date());
          setConsecutiveFailures(0);
          toast.success("QR Code renovado");
        } else {
          throw new Error(result.error || "Failed to refresh QR code");
        }
      }
    } catch (error) {
      setConsecutiveFailures(prev => prev + 1);
      console.error("Failed to refresh QR code:", error);
      if (consecutiveFailures >= 2) {
        toast.error("Falha ao renovar QR Code. Tente reconectar.");
      }
    }
  };

  // Update error state
  useEffect(() => {
    if (queryError) {
      setError(queryError instanceof Error ? queryError.message : "Erro ao verificar status");
    } else {
      setError(null);
    }
  }, [queryError]);

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      setIsConnecting(true);
      setError(null);
      
      const result = await whatsAppService.createOrConnectInstance(botId);
      
      if (!result.success) {
        throw new Error(result.error || "Erro ao conectar WhatsApp");
      }
      
      return result;
    },
    onSuccess: (result: CreateWhatsAppInstanceResult) => {
      setQrCode(result.qrCode);
      toast.success("QR Code gerado! Escaneie no WhatsApp para conectar.");
      
      // Invalidate and refetch status
      queryClient.invalidateQueries({ queryKey: ["whatsapp-status", botId] });
    },
    onError: (error: Error) => {
      setError(error.message);
      toast.error(`Erro ao gerar QR Code: ${error.message}`);
    },
    onSettled: () => {
      setIsConnecting(false);
    },
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: () => whatsAppService.disconnectInstance(botId),
    onSuccess: (success) => {
      if (success) {
        setQrCode(null);
        toast.success("WhatsApp desconectado com sucesso!");
        queryClient.invalidateQueries({ queryKey: ["whatsapp-status", botId] });
      } else {
        throw new Error("Falha ao desconectar WhatsApp");
      }
    },
    onError: (error: Error) => {
      setError(error.message);
      toast.error(`Erro ao desconectar: ${error.message}`);
    },
  });

  // Delete instance mutation
  const deleteInstanceMutation = useMutation({
    mutationFn: () => whatsAppService.deleteInstance(botId),
    onSuccess: (success) => {
      if (success) {
        setQrCode(null);
        toast.success("Instância WhatsApp removida com sucesso!");
        queryClient.invalidateQueries({ queryKey: ["whatsapp-status", botId] });
      } else {
        throw new Error("Falha ao remover instância WhatsApp");
      }
    },
    onError: (error: Error) => {
      setError(error.message);
      toast.error(`Erro ao remover instância: ${error.message}`);
    },
  });

  return {
    // Status
    status: status || { status: "disconnected" },
    isLoading,
    isConnecting: isConnecting || connectMutation.isPending,
    
    // Actions
    connect: connectMutation.mutateAsync,
    disconnect: disconnectMutation.mutateAsync,
    deleteInstance: deleteInstanceMutation.mutateAsync,
    refreshStatus,
    
    // QR Code
    qrCode,
    
    // Error handling
    error,
  };
}

/**
 * Hook for sending WhatsApp messages
 */
export function useWhatsAppMessaging(botId: string) {
  const [isSending, setIsSending] = useState(false);

  const sendMessage = async (phoneNumber: string, message: string) => {
    setIsSending(true);
    
    try {
      const result = await whatsAppService.sendMessage(botId, phoneNumber, message);
      
      if (!result.success) {
        throw new Error(result.error || "Erro ao enviar mensagem");
      }
      
      toast.success("Mensagem enviada com sucesso!");
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao enviar mensagem";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  return {
    sendMessage,
    isSending,
  };
}

/**
 * Hook for WhatsApp connection statistics
 */
export function useWhatsAppStats() {
  return useQuery({
    queryKey: ["whatsapp-stats"],
    queryFn: async () => {
      // This would fetch aggregated WhatsApp statistics
      // For now, return dummy data
      return {
        totalInstances: 0,
        connectedInstances: 0,
        messagesReceived: 0,
        messagesSent: 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}