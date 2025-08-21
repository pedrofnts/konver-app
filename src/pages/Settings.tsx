import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/hooks/useProfiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import KonverLayout from "@/components/KonverLayout";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Key, 
  Database,
  AlertTriangle,
  Save
} from "lucide-react";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState({
    email: true,
  });
  
  const [apiKey, setApiKey] = useState("");
  const [isEditingApiKey, setIsEditingApiKey] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  useEffect(() => {
    if (profile?.openai_api_key && isEditingApiKey) {
      setApiKey(profile.openai_api_key);
    }
  }, [profile, isEditingApiKey]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Sessão encerrada",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao encerrar sessão. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleNotificationChange = (type: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [type]: value }));
    toast({
      title: "Configuração atualizada",
      description: `Notificações por ${type === 'email' ? 'email' : 'desktop'} ${value ? 'ativadas' : 'desativadas'}.`,
    });
  };

  const handleSaveApiKey = async () => {
    if (!user?.id) return;

    try {
      await updateProfile.mutateAsync({
        userId: user.id,
        updates: {
          openai_api_key: apiKey,
        },
      });

      toast({
        title: "API Key salva",
        description: "Sua chave da OpenAI foi salva com sucesso.",
      });
      
      setIsEditingApiKey(false);
    } catch (error) {
      console.error("Erro ao salvar API Key:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a API Key. Tente novamente.",
        variant: "destructive",
      });
    }
  };


  return (
    <KonverLayout 
      title="Configurações" 
      subtitle="Personalize sua experiência no konver"
      breadcrumbs={[
        { label: "Configurações" }
      ]}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Configuração da API Key OpenAI */}
        <Card className="konver-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Key da OpenAI
            </CardTitle>
            <CardDescription>
              Configure sua chave de API para conectar com os serviços da OpenAI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditingApiKey ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apikey">Chave da API OpenAI</Label>
                  <Input
                    id="apikey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Sua API Key será armazenada de forma segura e criptografada
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveApiKey} 
                    disabled={updateProfile.isPending || !apiKey.trim()}
                    className="flex-1"
                  >
                    {updateProfile.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar API Key
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      setIsEditingApiKey(false);
                      setApiKey("");
                    }} 
                    variant="outline"
                    disabled={updateProfile.isPending}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Status da API Key</Label>
                  <p className="text-sm text-muted-foreground">
                    {profile?.openai_api_key ? 
                      "API Key configurada" : 
                      "Nenhuma API Key configurada"
                    }
                  </p>
                </div>
                <Button 
                  onClick={() => setIsEditingApiKey(true)}
                  variant="outline"
                  size="sm"
                >
                  {profile?.openai_api_key ? "Alterar" : "Configurar"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configurações de Notificação */}
        <Card className="konver-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure como você deseja receber notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">
                  Receba atualizações importantes por email
                </p>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(value) => handleNotificationChange('email', value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Sistema */}
        <Card className="konver-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Sistema
            </CardTitle>
            <CardDescription>
              Configurações avançadas do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Salvamento Automático</Label>
                <p className="text-sm text-muted-foreground">
                  Salvar alterações automaticamente
                </p>
              </div>
              <Switch
                checked={autoSave}
                onCheckedChange={setAutoSave}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Analytics e Métricas</Label>
                <p className="text-sm text-muted-foreground">
                  Coletar dados de uso para melhorar o sistema
                </p>
              </div>
              <Switch
                checked={analyticsEnabled}
                onCheckedChange={setAnalyticsEnabled}
              />
            </div>
            
            <Separator />
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Database className="h-4 w-4" />
                <span>Versão do Sistema: v1.0.0</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zona de Perigo */}
        <Card className="konver-card border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Zona de Perigo
            </CardTitle>
            <CardDescription>
              Ações irreversíveis que afetam sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Encerrar Sessão</Label>
                <p className="text-sm text-muted-foreground">
                  Desconectar de todas as sessões ativas
                </p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleSignOut}
              >
                Sair da Conta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </KonverLayout>
  );
}