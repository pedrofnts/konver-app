import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/hooks/useProfiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import KonverLayout from "@/components/KonverLayout";
import { User, Mail, Calendar, Save, Edit2, X } from "lucide-react";

export default function Profile() {
  const { user, profile: authProfile } = useAuth();
  const { data: profile, isLoading, error } = useProfile(user?.id);
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
  });

  const currentProfile = profile || authProfile;

  const handleEdit = () => {
    setFormData({
      full_name: currentProfile?.full_name || "",
      email: currentProfile?.email || "",
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      full_name: "",
      email: "",
    });
  };

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      await updateProfile.mutateAsync({
        userId: user.id,
        updates: {
          full_name: formData.full_name,
          email: formData.email,
        },
      });

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <KonverLayout title="Perfil" subtitle="Gerencie suas informações pessoais">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </KonverLayout>
    );
  }

  if (error) {
    return (
      <KonverLayout title="Perfil" subtitle="Gerencie suas informações pessoais">
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">
              Erro ao carregar informações do perfil
            </p>
          </CardContent>
        </Card>
      </KonverLayout>
    );
  }

  const getInitials = (name: string, email: string) => {
    if (name && name.trim()) {
      return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    }
    return email?.charAt(0).toUpperCase() || 'U';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <KonverLayout 
      title="Perfil" 
      subtitle="Gerencie suas informações pessoais"
      breadcrumbs={[
        { label: "Perfil" }
      ]}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Avatar e Informações Básicas */}
        <Card className="konver-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 shadow-lg">
                  <AvatarImage src={currentProfile?.avatar_url || ""} />
                  <AvatarFallback className="bg-primary text-white text-lg font-semibold">
                    {getInitials(currentProfile?.full_name || "", currentProfile?.email || "")}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <CardTitle className="text-xl">
                    {currentProfile?.full_name || "Nome não informado"}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {currentProfile?.email}
                  </CardDescription>
                  <Badge variant="secondary" className="w-fit">
                    <User className="h-3 w-3 mr-1" />
                    Usuário Ativo
                  </Badge>
                </div>
              </div>
              
              {!isEditing && (
                <Button onClick={handleEdit} variant="outline" size="sm">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Informações Pessoais */}
        <Card className="konver-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Atualize suas informações de perfil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Digite seu nome completo"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Digite seu email"
                  />
                </div>

                <Separator />

                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={handleSave} 
                    disabled={updateProfile.isPending}
                    className="flex-1"
                  >
                    {updateProfile.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar Alterações
                  </Button>
                  
                  <Button 
                    onClick={handleCancel} 
                    variant="outline"
                    disabled={updateProfile.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Nome Completo</Label>
                    <p className="font-medium">
                      {currentProfile?.full_name || "Não informado"}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">
                      {currentProfile?.email || "Não informado"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações da Conta */}
        <Card className="konver-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Informações da Conta
            </CardTitle>
            <CardDescription>
              Detalhes sobre sua conta no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-muted-foreground">ID do Usuário</Label>
                <p className="font-mono text-sm bg-muted px-3 py-2 rounded-lg">
                  {user?.id}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-muted-foreground">Conta criada em</Label>
                <p className="font-medium">
                  {currentProfile?.created_at ? formatDate(currentProfile.created_at) : "Não disponível"}
                </p>
              </div>
              
              {currentProfile?.updated_at && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Última atualização</Label>
                  <p className="font-medium">
                    {formatDate(currentProfile.updated_at)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </KonverLayout>
  );
}