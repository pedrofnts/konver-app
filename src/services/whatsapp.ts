import { supabase } from "@/integrations/supabase/client";
import { evolutionAPI, type WebhookEvent, type WebhookMessage } from "@/integrations/evolution/api";
import { nanoid } from "nanoid";

export interface CreateWhatsAppInstanceResult {
  instanceName: string;
  qrCode: string;
  success: boolean;
  error?: string;
}

export interface WhatsAppConnectionStatus {
  status: "connecting" | "connected" | "disconnected";
  instanceName?: string;
  phoneNumber?: string;
  profileName?: string;
  qrCode?: string;
}

/**
 * WhatsApp service for managing bot integrations with Evolution API
 */
export class WhatsAppService {
  private static instance: WhatsAppService;

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  /**
   * Create or reconnect WhatsApp instance for a bot
   */
  public async createOrConnectInstance(botId: string): Promise<CreateWhatsAppInstanceResult> {
    try {
      // Get bot data
      const { data: bot, error: botError } = await supabase
        .from("bots")
        .select("*")
        .eq("id", botId)
        .single();

      if (botError || !bot) {
        throw new Error("Bot não encontrado");
      }

      // Check if bot already has an instance
      if (bot.whatsapp_instance) {
        try {
          // Try to get QR code for existing instance
          const response = await evolutionAPI.connectInstance(bot.whatsapp_instance);
          
          // Update bot status
          await this.updateBotWhatsAppStatus(botId, "connecting", response.base64);
          
          return {
            instanceName: bot.whatsapp_instance,
            qrCode: response.base64,
            success: true,
          };
        } catch (error) {
          console.warn("Failed to reconnect existing instance, creating new one:", error);
          // Continue to create new instance
        }
      }

      // Generate unique instance name
      const instanceName = `bot_${nanoid(10)}`;

      // Create new instance
      const response = await evolutionAPI.createInstance(instanceName);
      
      console.log("Evolution API Response:", response);
      console.log("QR Code:", response.qrcode?.base64?.substring(0, 100) + "...");

      // Update bot with instance information
      await this.updateBotWhatsAppData(botId, {
        whatsapp_instance: instanceName,
        whatsapp_status: "connecting",
        whatsapp_qr_code: response.qrcode.base64,
      });

      return {
        instanceName,
        qrCode: response.qrcode.base64,
        success: true,
      };
    } catch (error) {
      console.error("Error creating WhatsApp instance:", error);
      return {
        instanceName: "",
        qrCode: "",
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  /**
   * Get WhatsApp connection status for a bot
   */
  public async getConnectionStatus(botId: string): Promise<WhatsAppConnectionStatus> {
    try {
      const { data: bot, error } = await supabase
        .from("bots")
        .select("whatsapp_instance, whatsapp_status, whatsapp_phone_number, whatsapp_profile_name, whatsapp_qr_code")
        .eq("id", botId)
        .single();

      if (error || !bot) {
        return { status: "disconnected" };
      }

      if (!bot.whatsapp_instance) {
        return { status: "disconnected" };
      }

      // Check real-time status from Evolution API
      try {
        const response = await evolutionAPI.getConnectionState(bot.whatsapp_instance);
        const mappedStatus = evolutionAPI.mapConnectionState(response.instance.state);

        // If connecting and no QR code, try to get a new one
        if (mappedStatus === "connecting" && !bot.whatsapp_qr_code) {
          console.log("Status is connecting but no QR code, fetching new one...");
          try {
            const qrResponse = await evolutionAPI.connectInstance(bot.whatsapp_instance);
            await this.updateBotWhatsAppData(botId, {
              whatsapp_qr_code: qrResponse.base64,
            });
            
            return {
              status: mappedStatus,
              instanceName: bot.whatsapp_instance,
              phoneNumber: bot.whatsapp_phone_number,
              profileName: bot.whatsapp_profile_name,
              qrCode: qrResponse.base64,
            };
          } catch (qrError) {
            console.error("Failed to fetch QR code:", qrError);
          }
        }

        // Update local status if different
        if (mappedStatus !== bot.whatsapp_status) {
          await this.updateBotWhatsAppStatus(botId, mappedStatus);
          
          // Clear QR code if connected or disconnected
          if (mappedStatus !== "connecting") {
            await this.updateBotWhatsAppData(botId, {
              whatsapp_qr_code: null,
            });
          }
        }

        return {
          status: mappedStatus,
          instanceName: bot.whatsapp_instance,
          phoneNumber: bot.whatsapp_phone_number,
          profileName: bot.whatsapp_profile_name,
          qrCode: mappedStatus === "connecting" ? bot.whatsapp_qr_code : undefined,
        };
      } catch (error) {
        console.error("Error checking connection state:", error);
        
        // If Evolution API is unreachable, try to reconnect
        if (bot.whatsapp_status === "connected") {
          await this.updateBotWhatsAppStatus(botId, "disconnected");
        }
        
        return {
          status: "disconnected",
          instanceName: bot.whatsapp_instance,
        };
      }
    } catch (error) {
      console.error("Error getting connection status:", error);
      return { status: "disconnected" };
    }
  }

  /**
   * Disconnect WhatsApp instance for a bot
   */
  public async disconnectInstance(botId: string): Promise<boolean> {
    try {
      const { data: bot, error } = await supabase
        .from("bots")
        .select("whatsapp_instance")
        .eq("id", botId)
        .single();

      if (error || !bot || !bot.whatsapp_instance) {
        return false;
      }

      // Logout from Evolution API
      await evolutionAPI.logoutInstance(bot.whatsapp_instance);

      // Update bot status
      await this.updateBotWhatsAppData(botId, {
        whatsapp_status: "disconnected",
        whatsapp_qr_code: null,
        whatsapp_phone_number: null,
        whatsapp_profile_name: null,
        whatsapp_connected_at: null,
      });

      return true;
    } catch (error) {
      console.error("Error disconnecting WhatsApp instance:", error);
      return false;
    }
  }

  /**
   * Delete WhatsApp instance completely
   */
  public async deleteInstance(botId: string): Promise<boolean> {
    try {
      const { data: bot, error } = await supabase
        .from("bots")
        .select("whatsapp_instance")
        .eq("id", botId)
        .single();

      if (error || !bot || !bot.whatsapp_instance) {
        return false;
      }

      // Delete from Evolution API
      await evolutionAPI.deleteInstance(bot.whatsapp_instance);

      // Clear bot WhatsApp data
      await this.updateBotWhatsAppData(botId, {
        whatsapp_instance: null,
        whatsapp_status: "disconnected",
        whatsapp_qr_code: null,
        whatsapp_phone_number: null,
        whatsapp_profile_name: null,
        whatsapp_connected_at: null,
      });

      return true;
    } catch (error) {
      console.error("Error deleting WhatsApp instance:", error);
      return false;
    }
  }

  /**
   * Send message through WhatsApp
   */
  public async sendMessage(
    botId: string,
    phoneNumber: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { data: bot, error } = await supabase
        .from("bots")
        .select("whatsapp_instance, whatsapp_status")
        .eq("id", botId)
        .single();

      if (error || !bot || !bot.whatsapp_instance) {
        throw new Error("Bot WhatsApp não configurado");
      }

      if (bot.whatsapp_status !== "connected") {
        throw new Error("WhatsApp não está conectado");
      }

      // Format phone number
      const formattedNumber = evolutionAPI.formatPhoneNumber(phoneNumber);

      // Send message
      const response = await evolutionAPI.sendTextMessage(
        bot.whatsapp_instance,
        formattedNumber,
        message
      );

      return {
        success: true,
        messageId: response.key.id,
      };
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao enviar mensagem",
      };
    }
  }

  /**
   * Process incoming webhook message
   */
  public async processWebhookMessage(event: WebhookEvent): Promise<void> {
    try {
      // Log webhook event
      await evolutionAPI.logWebhookEvent(
        event.event,
        event.instance,
        event,
        false
      );

      // Find bot by instance name
      const { data: bot, error: botError } = await supabase
        .from("bots")
        .select("id, user_id")
        .eq("whatsapp_instance", event.instance)
        .single();

      if (botError || !bot) {
        console.warn("Bot not found for instance:", event.instance);
        return;
      }

      // Handle different event types
      switch (event.event) {
        case "messages.upsert":
          await this.handleIncomingMessage(bot.id, bot.user_id, event.data);
          break;
        case "connection.update":
          await this.handleConnectionUpdate(bot.id, event.data);
          break;
        default:
          console.log("Unhandled webhook event:", event.event);
      }
    } catch (error) {
      console.error("Error processing webhook message:", error);
      await evolutionAPI.logWebhookEvent(
        event.event,
        event.instance,
        event,
        false,
        error instanceof Error ? error.message : "Processing error"
      );
    }
  }

  /**
   * Handle incoming WhatsApp message
   */
  private async handleIncomingMessage(
    botId: string,
    userId: string,
    messageData: WebhookMessage
  ): Promise<void> {
    // Skip messages sent by the bot
    if (messageData.key.fromMe) {
      return;
    }

    const phoneNumber = evolutionAPI.extractPhoneNumber(messageData.key.remoteJid);
    const userName = messageData.pushName || phoneNumber;

    // Find or create conversation
    const conversation = await this.findOrCreateConversation(
      botId,
      userName,
      phoneNumber,
      messageData.key.remoteJid
    );

    // Extract message content based on type
    const messageContent = this.extractMessageContent(messageData);
    
    // Save message to database
    const { data: savedMessage, error } = await supabase
      .from("conversation_messages")
      .insert({
        conversation_id: conversation.id,
        message_type: "user",
        content: messageContent.text,
        metadata: {
          whatsapp_message_id: messageData.key.id,
          message_type: messageData.messageType,
          timestamp: messageData.messageTimestamp,
        },
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving message:", error);
      return;
    }

    // Save media information if present
    if (messageContent.media) {
      await supabase.from("whatsapp_message_types").insert({
        conversation_message_id: savedMessage.id,
        message_type: messageContent.media.type,
        media_url: messageContent.media.url,
        media_mime_type: messageContent.media.mimeType,
        media_size: messageContent.media.fileSize,
        media_filename: messageContent.media.filename,
        location_latitude: messageContent.media.latitude,
        location_longitude: messageContent.media.longitude,
        location_name: messageContent.media.locationName,
        contact_name: messageContent.media.contactName,
        contact_phone: messageContent.media.contactPhone,
      });
    }

    // Update conversation last message time
    await supabase
      .from("external_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversation.id);

    // TODO: Process message with AI bot and send response
    // This would integrate with your existing bot processing logic
    console.log("Message received and saved, ready for bot processing");
  }

  /**
   * Handle connection status updates
   */
  private async handleConnectionUpdate(botId: string, data: Record<string, unknown>): Promise<void> {
    const status = data.state;
    const mappedStatus = evolutionAPI.mapConnectionState(status);

    // Update bot status
    await this.updateBotWhatsAppStatus(botId, mappedStatus);

    // If connected, update phone number and profile
    if (mappedStatus === "connected" && data.user) {
      await this.updateBotWhatsAppData(botId, {
        whatsapp_phone_number: evolutionAPI.extractPhoneNumber(data.user.id),
        whatsapp_profile_name: data.user.name,
        whatsapp_connected_at: new Date().toISOString(),
      });
    }
  }

  /**
   * Find or create external conversation
   */
  private async findOrCreateConversation(
    botId: string,
    userName: string,
    phoneNumber: string,
    platformUserId: string
  ) {
    // Try to find existing conversation
    const { data: existing } = await supabase
      .from("external_conversations")
      .select("*")
      .eq("bot_id", botId)
      .eq("phone_number", phoneNumber)
      .eq("platform", "whatsapp")
      .single();

    if (existing) {
      return existing;
    }

    // Create new conversation
    const { data: newConversation, error } = await supabase
      .from("external_conversations")
      .insert({
        bot_id: botId,
        user_name: userName,
        phone_number: phoneNumber,
        platform: "whatsapp",
        platform_user_id: platformUserId,
        status: "active",
        metadata: {
          whatsapp_jid: platformUserId,
        },
      })
      .select()
      .single();

    if (error) {
      throw new Error("Failed to create conversation");
    }

    return newConversation;
  }

  /**
   * Extract message content from webhook data
   */
  private extractMessageContent(messageData: WebhookMessage): {
    text: string;
    media?: {
      type: string;
      url?: string;
      mimeType?: string;
      fileSize?: number;
      filename?: string;
      latitude?: number;
      longitude?: number;
      locationName?: string;
      contactName?: string;
      contactPhone?: string;
    };
  } {
    const message = messageData.message;

    switch (messageData.messageType) {
      case "conversation":
        return { text: message.conversation || "" };

      case "imageMessage":
        return {
          text: message.imageMessage?.caption || "[Imagem]",
          media: {
            type: "image",
            url: message.imageMessage?.url,
            mimeType: message.imageMessage?.mimetype,
            fileSize: message.imageMessage?.fileSize,
          },
        };

      case "audioMessage":
        return {
          text: "[Áudio]",
          media: {
            type: "audio",
            url: message.audioMessage?.url,
            mimeType: message.audioMessage?.mimetype,
            fileSize: message.audioMessage?.fileSize,
          },
        };

      case "videoMessage":
        return {
          text: message.videoMessage?.caption || "[Vídeo]",
          media: {
            type: "video",
            url: message.videoMessage?.url,
            mimeType: message.videoMessage?.mimetype,
            fileSize: message.videoMessage?.fileSize,
          },
        };

      case "documentMessage":
        return {
          text: `[Documento: ${message.documentMessage?.filename || "arquivo"}]`,
          media: {
            type: "document",
            url: message.documentMessage?.url,
            mimeType: message.documentMessage?.mimetype,
            fileSize: message.documentMessage?.fileSize,
            filename: message.documentMessage?.filename,
          },
        };

      case "locationMessage":
        return {
          text: `[Localização: ${message.locationMessage?.name || "coordenadas"}]`,
          media: {
            type: "location",
            latitude: message.locationMessage?.latitude,
            longitude: message.locationMessage?.longitude,
            locationName: message.locationMessage?.name,
          },
        };

      case "contactMessage":
        return {
          text: `[Contato: ${message.contactMessage?.displayName || "contato"}]`,
          media: {
            type: "contact",
            contactName: message.contactMessage?.displayName,
            contactPhone: this.extractPhoneFromVCard(message.contactMessage?.vcard),
          },
        };

      default:
        return { text: "[Mensagem não suportada]" };
    }
  }

  /**
   * Extract phone number from vCard
   */
  private extractPhoneFromVCard(vcard?: string): string | undefined {
    if (!vcard) return undefined;
    const phoneMatch = vcard.match(/TEL[^:]*:([^\r\n]+)/);
    return phoneMatch ? phoneMatch[1].trim() : undefined;
  }

  /**
   * Update bot WhatsApp status
   */
  private async updateBotWhatsAppStatus(
    botId: string,
    status: "connecting" | "connected" | "disconnected",
    qrCode?: string
  ): Promise<void> {
    const updates: any = { whatsapp_status: status };
    
    if (qrCode) {
      updates.whatsapp_qr_code = qrCode;
    }

    if (status === "disconnected") {
      updates.whatsapp_qr_code = null;
    }

    await supabase
      .from("bots")
      .update(updates)
      .eq("id", botId);
  }

  /**
   * Update bot WhatsApp data
   */
  private async updateBotWhatsAppData(
    botId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    await supabase
      .from("bots")
      .update(data)
      .eq("id", botId);
  }
}

// Export singleton instance
export const whatsAppService = WhatsAppService.getInstance();