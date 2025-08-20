import { supabase } from "@/integrations/supabase/client";

// Evolution API Configuration
const EVOLUTION_API_URL = import.meta.env.VITE_EVOLUTION_API_URL || "https://wp.annavirtual.com.br";
const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || "d4b06eeb4a5ea8b801d02d991e6bbabb";
const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || "https://your-domain.com/webhook/evolution";

// Evolution API Interfaces
export interface EvolutionInstance {
  instanceName: string;
  instanceId: string;
  integration: string;
  webhookWaBusiness: string | null;
  accessTokenWaBusiness: string;
  status: "connecting" | "connected" | "disconnected";
}

export interface EvolutionQRCode {
  pairingCode: string | null;
  code: string;
  base64: string;
  count: number;
}

export interface EvolutionSettings {
  rejectCall: boolean;
  msgCall: string;
  groupsIgnore: boolean;
  alwaysOnline: boolean;
  readMessages: boolean;
  readStatus: boolean;
  syncFullHistory: boolean;
}

export interface CreateInstanceResponse {
  instance: EvolutionInstance;
  hash: string;
  webhook: Record<string, unknown>;
  websocket: Record<string, unknown>;
  rabbitmq: Record<string, unknown>;
  sqs: Record<string, unknown>;
  settings: EvolutionSettings;
  qrcode: EvolutionQRCode;
}

export interface InstanceQRCodeResponse {
  qrcode: EvolutionQRCode;
}

export interface ConnectionStateResponse {
  instance: {
    instanceName: string;
    state: "connecting" | "open" | "close";
  };
}

export interface ConnectInstanceResponse {
  pairingCode: string | null;
  code: string;
  base64: string;
}

export interface EvolutionInstanceInfo {
  id: string;
  name: string;
  connectionStatus: string;
  ownerJid: string;
  profileName: string;
  profilePicUrl: string;
  integration: string;
}

export interface WebhookMessage {
  key: {
    id: string;
    remoteJid: string;
    fromMe: boolean;
  };
  message: {
    conversation?: string;
    imageMessage?: {
      url: string;
      mimetype: string;
      fileSize: number;
      caption?: string;
    };
    audioMessage?: {
      url: string;
      mimetype: string;
      fileSize: number;
    };
    videoMessage?: {
      url: string;
      mimetype: string;
      fileSize: number;
      caption?: string;
    };
    documentMessage?: {
      url: string;
      mimetype: string;
      fileSize: number;
      filename: string;
    };
    locationMessage?: {
      latitude: number;
      longitude: number;
      name?: string;
    };
    contactMessage?: {
      displayName: string;
      vcard: string;
    };
  };
  messageType: "conversation" | "imageMessage" | "audioMessage" | "videoMessage" | "documentMessage" | "locationMessage" | "contactMessage";
  messageTimestamp: number;
  pushName: string;
  status: string;
}

export interface WebhookEvent {
  event: string;
  instance: string;
  data: {
    key: {
      id: string;
      remoteJid: string;
      fromMe: boolean;
    };
    message: WebhookMessage["message"];
    messageType: WebhookMessage["messageType"];
    messageTimestamp: number;
    pushName: string;
    status: string;
  };
}

/**
 * Evolution API Client for WhatsApp integration
 * Implements singleton pattern for consistent API access
 */
export class EvolutionAPI {
  private static instance: EvolutionAPI;
  private readonly apiUrl: string;
  private readonly apiKey: string;

  private constructor() {
    this.apiUrl = EVOLUTION_API_URL;
    this.apiKey = EVOLUTION_API_KEY;
  }

  /**
   * Get singleton instance of Evolution API
   */
  public static getInstance(): EvolutionAPI {
    if (!EvolutionAPI.instance) {
      EvolutionAPI.instance = new EvolutionAPI();
    }
    return EvolutionAPI.instance;
  }

  /**
   * Base method for making HTTP requests to Evolution API
   */
  private async request<T>(
    endpoint: string,
    method: string = "GET",
    body?: Record<string, unknown>
  ): Promise<T> {
    try {
      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          apikey: this.apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorText;
        } catch {
          errorMessage = errorText;
        }

        throw new Error(`Evolution API Error (${response.status}): ${errorMessage}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Erro desconhecido ao se comunicar com a Evolution API");
    }
  }

  /**
   * Create a new WhatsApp instance
   */
  public async createInstance(instanceName: string): Promise<CreateInstanceResponse> {
    return this.request<CreateInstanceResponse>("/instance/create", "POST", {
      instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
      webhook: {
        url: WEBHOOK_URL,
        byEvents: false,
        base64: true,
        events: [
          "MESSAGES_UPSERT",
          "CONNECTION_UPDATE",
          "CALL",
          "PRESENCE_UPDATE"
        ],
      },
      settings: {
        rejectCall: false,
        msgCall: "Desculpe, não posso atender chamadas no momento.",
        groupsIgnore: true,
        alwaysOnline: true,
        readMessages: false,
        readStatus: false,
        syncFullHistory: false,
      },
    });
  }

  /**
   * Connect to an existing instance
   */
  public async connectInstance(instanceName: string): Promise<ConnectInstanceResponse> {
    return this.request<ConnectInstanceResponse>(`/instance/connect/${instanceName}`);
  }

  /**
   * Get QR code for an instance
   */
  public async getInstanceQRCode(instanceName: string): Promise<InstanceQRCodeResponse> {
    return this.request<InstanceQRCodeResponse>(`/instance/qrcode/${instanceName}`);
  }

  /**
   * Restart instance to get fresh QR code
   */
  public async restartInstance(instanceName: string): Promise<ConnectInstanceResponse> {
    try {
      // First try to restart the instance
      await this.request(`/instance/restart/${instanceName}`, "PUT");
      
      // Wait a bit for the restart to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Then connect to get new QR code
      return this.connectInstance(instanceName);
    } catch (error) {
      console.warn("Restart failed, trying direct connect:", error);
      // If restart fails, try direct connect
      return this.connectInstance(instanceName);
    }
  }

  /**
   * Get connection state of an instance
   */
  public async getConnectionState(instanceName: string): Promise<ConnectionStateResponse> {
    return this.request<ConnectionStateResponse>(`/instance/connectionState/${instanceName}`);
  }

  /**
   * Logout and disconnect an instance
   */
  public async logoutInstance(instanceName: string): Promise<void> {
    return this.request<void>(`/instance/logout/${instanceName}`, "DELETE");
  }

  /**
   * Delete an instance completely
   */
  public async deleteInstance(instanceName: string): Promise<void> {
    return this.request<void>(`/instance/delete/${instanceName}`, "DELETE");
  }

  /**
   * Fetch all instances
   */
  public async fetchInstances(): Promise<EvolutionInstanceInfo[]> {
    return this.request<EvolutionInstanceInfo[]>("/instance/fetchInstances");
  }

  /**
   * Send a text message
   */
  public async sendTextMessage(
    instanceName: string,
    number: string,
    text: string
  ): Promise<{ key: { id: string } }> {
    return this.request(`/message/sendText/${instanceName}`, "POST", {
      number,
      text,
    });
  }

  /**
   * Send media message
   */
  public async sendMediaMessage(
    instanceName: string,
    number: string,
    mediaUrl: string,
    caption?: string,
    mediaType: "image" | "video" | "audio" | "document" = "image"
  ): Promise<{ key: { id: string } }> {
    const endpoint = {
      image: "/message/sendMedia",
      video: "/message/sendMedia", 
      audio: "/message/sendWhatsAppAudio",
      document: "/message/sendMedia"
    }[mediaType];

    return this.request(`${endpoint}/${instanceName}`, "POST", {
      number,
      media: mediaUrl,
      caption,
      mediatype: mediaType,
    });
  }

  /**
   * Map Evolution API connection state to our internal state
   */
  public mapConnectionState(
    state: "connecting" | "open" | "close"
  ): "connecting" | "connected" | "disconnected" {
    const stateMap = {
      connecting: "connecting" as const,
      open: "connected" as const,
      close: "disconnected" as const,
    };
    return stateMap[state];
  }

  /**
   * Extract phone number from WhatsApp JID
   */
  public extractPhoneNumber(jid: string): string {
    return jid.split("@")[0];
  }

  /**
   * Format phone number for WhatsApp
   */
  public formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, "");
    
    // Add country code if not present (assuming Brazil +55)
    if (cleaned.length === 11 && cleaned.startsWith("11")) {
      return `55${cleaned}`;
    }
    if (cleaned.length === 10) {
      return `5511${cleaned}`;
    }
    
    return cleaned;
  }

  /**
   * Log webhook event to database for debugging
   */
  public async logWebhookEvent(
    eventType: string,
    instanceName: string,
    payload: unknown,
    processed: boolean = false,
    errorMessage?: string
  ): Promise<void> {
    try {
      await supabase
        .from("webhook_events")
        .insert({
          event_type: eventType,
          instance_name: instanceName,
          payload: payload as Record<string, unknown>,
          processed,
          error_message: errorMessage,
        });
    } catch (error) {
      console.error("Failed to log webhook event:", error);
    }
  }

  /**
   * Update webhook event as processed
   */
  public async markWebhookEventProcessed(eventId: string): Promise<void> {
    try {
      await supabase
        .from("webhook_events")
        .update({ processed: true })
        .eq("id", eventId);
    } catch (error) {
      console.error("Failed to mark webhook event as processed:", error);
    }
  }
}

// Export singleton instance
export const evolutionAPI = EvolutionAPI.getInstance();