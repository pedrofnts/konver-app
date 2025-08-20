# Documentação - Integração com Evolution API

## Visão Geral

Esta documentação detalha como implementar a integração com a Evolution API para criação e gerenciamento de instâncias WhatsApp, incluindo geração de QR codes, monitoramento de status e controle de conexões.

## Estrutura da Integração

### 1. Configuração Base

#### Arquivo: `src/integrations/evolution/api.ts`

```typescript
// Configurações da Evolution API
const EVOLUTION_API_URL = "https://wp.annavirtual.com.br";
const EVOLUTION_API_KEY = "d4b06eeb4a5ea8b801d02d991e6bbabb";
const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL;

// Interfaces TypeScript
interface EvolutionInstance {
  instanceName: string;
  instanceId: string;
  integration: string;
  webhookWaBusiness: string | null;
  accessTokenWaBusiness: string;
  status: "connecting" | "connected" | "disconnected";
}

interface EvolutionQRCode {
  pairingCode: string | null;
  code: string;
  base64: string;
  count: number;
}

interface CreateInstanceResponse {
  instance: EvolutionInstance;
  hash: string;
  webhook: Record<string, unknown>;
  websocket: Record<string, unknown>;
  rabbitmq: Record<string, unknown>;
  sqs: Record<string, unknown>;
  settings: EvolutionSettings;
  qrcode: EvolutionQRCode;
}

interface InstanceQRCodeResponse {
  qrcode: EvolutionQRCode;
}

interface ConnectionStateResponse {
  instance: {
    instanceName: string;
    state: "connecting" | "open" | "close";
  };
}

interface ConnectInstanceResponse {
  pairingCode: string | null;
  code: string;
  base64: string;
}
```

### 2. Classe Principal da Evolution API

```typescript
export class EvolutionAPI {
  private static instance: EvolutionAPI;
  private readonly apiUrl: string;
  private readonly apiKey: string;

  private constructor() {
    this.apiUrl = EVOLUTION_API_URL;
    this.apiKey = EVOLUTION_API_KEY;
  }

  // Singleton Pattern
  public static getInstance(): EvolutionAPI {
    if (!EvolutionAPI.instance) {
      EvolutionAPI.instance = new EvolutionAPI();
    }
    return EvolutionAPI.instance;
  }

  // Método base para requisições HTTP
  private async request<T>(
    endpoint: string,
    method: string = "GET",
    body?: Record<string, unknown>
  ): Promise<T> {
    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        apikey: this.apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || "Erro ao se comunicar com a Evolution API"
      );
    }

    return response.json();
  }
}

// Exporta uma instância única da API
export const evolutionAPI = EvolutionAPI.getInstance();
```

### 3. Métodos de Gestão de Instâncias

#### 3.1 Criar Nova Instância

```typescript
public async createInstance(
  instanceName: string
): Promise<CreateInstanceResponse> {
  return this.request<CreateInstanceResponse>("/instance/create", "POST", {
    instanceName,
    qrcode: true,
    integration: "WHATSAPP-BAILEYS", // Integração com WhatsApp
    webhook: {
      url: WEBHOOK_URL,
      byEvents: false,
      base64: true,
      events: ["MESSAGES_UPSERT"], // Eventos que serão enviados
    },
  });
}
```

**Uso:**
```typescript
const response = await evolutionAPI.createInstance("minha_instancia_123");
console.log("QR Code:", response.qrcode.base64);
console.log("Status:", response.instance.status);
```

#### 3.2 Conectar Instância Existente

```typescript
public async connectInstance(
  instanceName: string
): Promise<ConnectInstanceResponse> {
  return this.request<ConnectInstanceResponse>(
    `/instance/connect/${instanceName}`
  );
}
```

**Uso:**
```typescript
const response = await evolutionAPI.connectInstance("minha_instancia_123");
console.log("QR Code para reconexão:", response.base64);
```

#### 3.3 Obter QR Code de uma Instância

```typescript
public async getInstanceQRCode(
  instanceName: string
): Promise<InstanceQRCodeResponse> {
  return this.request<InstanceQRCodeResponse>(
    `/instance/qrcode/${instanceName}`
  );
}
```

#### 3.4 Verificar Status da Conexão

```typescript
public async getConnectionState(
  instanceName: string
): Promise<ConnectionStateResponse> {
  return this.request<ConnectionStateResponse>(
    `/instance/connectionState/${instanceName}`
  );
}

// Mapeamento de estados
public mapConnectionState(
  state: "connecting" | "open" | "close"
): "connecting" | "connected" | "disconnected" {
  return {
    connecting: "connecting",
    open: "connected",
    close: "disconnected",
  }[state];
}
```

#### 3.5 Desconectar Instância

```typescript
public async logoutInstance(instanceName: string): Promise<void> {
  return this.request<void>(`/instance/logout/${instanceName}`, "DELETE");
}
```

#### 3.6 Listar Todas as Instâncias

```typescript
interface EvolutionInstanceInfo {
  id: string;
  name: string;
  connectionStatus: string;
  ownerJid: string;
  profileName: string;
  profilePicUrl: string;
  integration: string;
}

public async fetchInstances(): Promise<EvolutionInstanceInfo[]> {
  return this.request<EvolutionInstanceInfo[]>("/instance/fetchInstances");
}
```

### 4. Serviço de Assistentes (Integração)

#### Arquivo: `src/services/assistant.ts`

```typescript
import { evolutionAPI } from "@/integrations/evolution/api";
import { nanoid } from "nanoid";

interface CreateInstanceResult {
  instanceName: string;
  qrCode: string;
}

export class AssistantService {
  private static instance: AssistantService;
  
  public static getInstance(): AssistantService {
    if (!AssistantService.instance) {
      AssistantService.instance = new AssistantService();
    }
    return AssistantService.instance;
  }

  public async createWhatsAppInstance(
    assistantId: string
  ): Promise<CreateInstanceResult | null> {
    try {
      const assistant = await this.getAssistant(assistantId);
      if (!assistant) {
        throw new Error("Assistant não encontrado");
      }

      // Se já existe instância, apenas reconecta
      if (assistant.instance) {
        const response = await evolutionAPI.connectInstance(assistant.instance);
        return {
          instanceName: assistant.instance,
          qrCode: response.base64,
        };
      }

      // Gera nome único para a instância
      const instanceName = `assistant_${nanoid(10)}`;

      // Cria nova instância
      const response = await evolutionAPI.createInstance(instanceName);

      // Atualiza assistente com o nome da instância
      const updatedAssistant = await this.updateAssistant(assistantId, {
        instance: instanceName,
      });

      if (!updatedAssistant) {
        throw new Error("Erro ao atualizar assistant com a instância");
      }

      return {
        instanceName,
        qrCode: response.qrcode.base64,
      };
    } catch (error) {
      console.error("Erro ao criar instância do WhatsApp:", error);
      return null;
    }
  }
}

export const assistantService = AssistantService.getInstance();
```

### 5. Interface de Usuário (React)

#### Arquivo: `src/pages/WhatsAppConnection.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { evolutionAPI } from '@/integrations/evolution/api';
import { assistantService } from '@/services/assistant';

const WhatsAppConnection = () => {
  const { id } = useParams();
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);

  // Busca dados do assistente
  const { data: assistant, isLoading } = useQuery({
    queryKey: ['assistant', id],
    queryFn: async () => {
      if (!id) return null;
      return assistantService.getAssistant(id);
    },
  });

  // Verifica o status da conexão periodicamente
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkConnectionState = async () => {
      if (assistant?.instance) {
        try {
          const response = await evolutionAPI.getConnectionState(assistant.instance);
          const mappedState = evolutionAPI.mapConnectionState(response.instance.state);
          setStatus(mappedState);
        } catch (error) {
          console.error('Erro ao verificar status da conexão:', error);
          setStatus('disconnected');
        }
      }
    };

    // Verifica imediatamente e depois a cada 5 segundos
    checkConnectionState();
    interval = setInterval(checkConnectionState, 5000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [assistant?.instance]);

  // Busca o QR Code quando necessário
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchQRCode = async () => {
      if (status === 'connecting' && assistant?.instance) {
        try {
          const response = await evolutionAPI.connectInstance(assistant.instance);
          setQrCode(response.base64);
        } catch (error) {
          console.error('Erro ao buscar QR code:', error);
        }
      }
    };

    if (status === 'connecting' && assistant?.instance) {
      fetchQRCode();
      interval = setInterval(fetchQRCode, 5000);
    } else {
      setQrCode(null);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [status, assistant?.instance]);

  // Gerar QR Code para nova conexão
  const handleGenerateQR = async () => {
    if (!id) return;

    try {
      setStatus('connecting');
      const result = await assistantService.createWhatsAppInstance(id);
      
      if (!result) {
        throw new Error('Erro ao criar instância do WhatsApp');
      }

      setQrCode(result.qrCode);
    } catch (error) {
      console.error('Erro ao gerar QR code:', error);
      setStatus('disconnected');
    }
  };

  // Reconectar instância existente
  const handleReconnect = async () => {
    if (!id || !assistant?.instance) return;

    try {
      setStatus('connecting');
      const response = await evolutionAPI.connectInstance(assistant.instance);
      setQrCode(response.base64);
    } catch (error) {
      console.error('Erro ao reconectar:', error);
      setStatus('disconnected');
    }
  };

  // Desconectar WhatsApp
  const handleLogout = async () => {
    if (!id || !assistant?.instance) return;

    try {
      await evolutionAPI.logoutInstance(assistant.instance);
      setStatus('disconnected');
      setQrCode(null);
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="p-6">
      <h1>Conexão WhatsApp</h1>
      
      {/* Status da Conexão */}
      <div className="mb-4">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          status === 'connected' ? 'bg-green-100 text-green-800' :
          status === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {status === 'connected' ? 'Conectado' :
           status === 'connecting' ? 'Conectando...' :
           'Desconectado'}
        </span>
      </div>

      {/* QR Code */}
      {qrCode && status === 'connecting' && (
        <div className="mb-4">
          <h3>Escaneie o QR Code no WhatsApp:</h3>
          <img src={`data:image/png;base64,${qrCode}`} alt="QR Code WhatsApp" />
        </div>
      )}

      {/* Botões de Ação */}
      <div className="space-x-2">
        {status === 'disconnected' && !assistant?.instance && (
          <button onClick={handleGenerateQR} className="btn-primary">
            Conectar WhatsApp
          </button>
        )}
        
        {status === 'disconnected' && assistant?.instance && (
          <button onClick={handleReconnect} className="btn-secondary">
            Reconectar
          </button>
        )}
        
        {status === 'connected' && (
          <button onClick={handleLogout} className="btn-danger">
            Desconectar
          </button>
        )}
      </div>
    </div>
  );
};

export default WhatsAppConnection;
```

### 6. Configurações de Ambiente

#### Arquivo: `.env`

```env
# Evolution API Configuration
VITE_WEBHOOK_URL=https://your-domain.com/webhook/evolution

# Opcional: URLs customizadas
VITE_EVOLUTION_API_URL=https://wp.annavirtual.com.br
VITE_EVOLUTION_API_KEY=your_api_key
```

### 7. Schema do Banco de Dados

#### Tabela `assistants`:

```sql
ALTER TABLE assistants 
ADD COLUMN IF NOT EXISTS instance TEXT;

COMMENT ON COLUMN assistants.instance IS 'Nome da instância WhatsApp na Evolution API';
```

### 8. Exemplo de Uso Completo

```typescript
// 1. Criar instância para um assistente
const result = await assistantService.createWhatsAppInstance("assistant-123");

if (result) {
  console.log("Instância criada:", result.instanceName);
  console.log("QR Code:", result.qrCode);
}

// 2. Monitorar status
const checkStatus = async (instanceName: string) => {
  const response = await evolutionAPI.getConnectionState(instanceName);
  const status = evolutionAPI.mapConnectionState(response.instance.state);
  console.log("Status atual:", status);
};

// 3. Reconectar se necessário
if (status === 'disconnected') {
  const reconnect = await evolutionAPI.connectInstance(instanceName);
  console.log("Novo QR Code:", reconnect.base64);
}

// 4. Listar todas as instâncias
const instances = await evolutionAPI.fetchInstances();
console.log("Instâncias ativas:", instances);
```

### 9. Tratamento de Erros

```typescript
try {
  const response = await evolutionAPI.createInstance(instanceName);
  // Sucesso
} catch (error) {
  if (error.message.includes("Instance already exists")) {
    // Instância já existe, tentar conectar
    const connectResponse = await evolutionAPI.connectInstance(instanceName);
  } else if (error.message.includes("Invalid API key")) {
    // Chave de API inválida
    console.error("Verifique sua chave de API");
  } else {
    // Outros erros
    console.error("Erro desconhecido:", error.message);
  }
}
```

### 10. Boas Práticas

1. **Nomes únicos**: Use `nanoid()` ou UUID para gerar nomes de instância únicos
2. **Polling inteligente**: Verifique status apenas quando necessário (a cada 5-10 segundos)
3. **Cleanup**: Sempre limpe intervalos e timeouts no `useEffect`
4. **Error handling**: Implemente tratamento robusto de erros
5. **Estado local**: Mantenha status da conexão em estado local para UI responsiva
6. **Singleton**: Use padrão singleton para a classe EvolutionAPI

### 11. Limitações e Considerações

- **Rate limits**: A Evolution API pode ter limites de requisições
- **Timeouts**: QR Codes expiram, implemente renovação automática
- **Múltiplas instâncias**: Cada assistente deve ter sua própria instância
- **Reconexão**: Dispositivos podem desconectar, implemente reconexão automática
- **Cleanup**: Remova instâncias não utilizadas periodicamente

Esta documentação fornece uma base completa para implementar a integração com Evolution API, permitindo criar, gerenciar e monitorar instâncias WhatsApp de forma robusta e escalável.
