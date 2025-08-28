import { useState } from 'react';
import { Building2, Globe, Instagram, Clock, MapPin, Save, Info, Users, Stethoscope } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import AssistantStepHeader from "./AssistantStepHeader";
import AssistantStepContent from "./AssistantStepContent";

interface CompanyInfo {
  name: string;
  address: string;
  website: string;
  instagram: string;
  businessHours: string;
  professionals: string;
  procedures: string;
}

interface CompanyContentProps {
  assistantId: string;
  companyInfo?: {
    company_name?: string | null;
    company_address?: string | null;
    company_website?: string | null;
    company_instagram?: string | null;
    company_business_hours?: string | null;
    company_professionals?: string | null;
    company_procedures?: string | null;
  };
  onSave?: (companyInfo: CompanyInfo) => Promise<void>;
}

const businessHoursExamples = [
  {
    title: "Comercial Tradicional",
    hours: "Segunda a Sexta: 9:00-18:00\nSábado: 9:00-12:00\nDomingo: Fechado"
  },
  {
    title: "Atendimento Estendido",
    hours: "Segunda a Sexta: 8:00-20:00\nSábado: 9:00-17:00\nDomingo: 10:00-16:00"
  },
  {
    title: "24 Horas (Fins de Semana)",
    hours: "Segunda a Sexta: 9:00-18:00\nSábado e Domingo: 24 horas"
  }
];

export default function CompanyContent({ assistantId, companyInfo, onSave }: CompanyContentProps) {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Use form persistence hook
  const {
    formData,
    updateField,
    hasUnsavedChanges,
    markAsSaved,
    resetForm,
    isDirty
  } = useFormPersistence<CompanyInfo>({
    storageKey: `company-info-${assistantId}`,
    initialData: {
      name: '',
      address: '',
      website: '',
      instagram: '',
      businessHours: '',
      professionals: '',
      procedures: ''
    },
    serverData: companyInfo ? {
      name: companyInfo.company_name || '',
      address: companyInfo.company_address || '',
      website: companyInfo.company_website || '',
      instagram: companyInfo.company_instagram || '',
      businessHours: companyInfo.company_business_hours || '',
      professionals: companyInfo.company_professionals || '',
      procedures: companyInfo.company_procedures || ''
    } : undefined
  });


  // Remove the handleInputChange function as we'll use updateField directly

  const handleSave = async () => {
    if (!onSave) return;

    setSaving(true);
    try {
      await onSave(formData);
      markAsSaved(); // Clear unsaved changes and persistence
      toast({
        title: "Informações salvas",
        description: "As informações da empresa foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Error saving company info:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as informações da empresa.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = formData.name.trim().length > 0;

  const formatInstagramHandle = (value: string) => {
    // Remove @ if user adds it
    const formatted = value.replace('@', '');
    return formatted;
  };

  const formatWebsite = (value: string) => {
    // Add https:// if user doesn't include protocol
    if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
      return `https://${value}`;
    }
    return value;
  };

  return (
    <div className="h-full flex flex-col">
      <AssistantStepHeader
        title="Configuração da Empresa"
        description="Configure as informações da sua empresa para personalizar o atendimento"
        icon={<Building2 className="w-6 h-6 text-white" />}
        actions={[
          {
            label: saving ? "Salvando..." : "Salvar Informações",
            onClick: handleSave,
            disabled: !isFormValid || saving,
            variant: "primary",
            icon: <Save className="w-4 h-4" />
          }
        ]}
        compact
      />

      <AssistantStepContent
        padding="lg"
        className="flex-1 overflow-y-auto"
        scrollable={true}
      >
        <div className="space-y-8 max-w-4xl">
          
          {/* Basic Company Information */}
          <Card className="konver-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 konver-gradient-primary rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Informações Básicas</h3>
                <p className="text-sm text-muted-foreground">Dados principais da sua empresa</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="company-name" className="text-sm font-medium">
                  Nome da Empresa *
                </Label>
                <Input
                  id="company-name"
                  placeholder="ex: Minha Empresa Ltda"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="konver-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-website" className="text-sm font-medium flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Website
                </Label>
                <Input
                  id="company-website"
                  placeholder="ex: www.minhaempresa.com.br"
                  value={formData.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  onBlur={(e) => updateField('website', formatWebsite(e.target.value))}
                  className="konver-input"
                />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="company-address" className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Endereço
                </Label>
                <Textarea
                  id="company-address"
                  placeholder="ex: Rua das Flores, 123 - Centro - São Paulo, SP - CEP: 01234-567"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="konver-input resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-instagram" className="text-sm font-medium flex items-center gap-2">
                  <Instagram className="w-4 h-4" />
                  Instagram
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                    @
                  </span>
                  <Input
                    id="company-instagram"
                    placeholder="minhaempresa"
                    value={formData.instagram}
                    onChange={(e) => updateField('instagram', formatInstagramHandle(e.target.value))}
                    className="konver-input pl-8"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Business Hours */}
          <Card className="konver-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 konver-gradient-accent rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Horário de Funcionamento</h3>
                <p className="text-sm text-muted-foreground">Configure quando sua empresa atende clientes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-2">
                <Label htmlFor="business-hours" className="text-sm font-medium">
                  Horários de Atendimento
                </Label>
                <Textarea
                  id="business-hours"
                  placeholder="ex: Segunda a Sexta: 9:00-18:00&#10;Sábado: 9:00-12:00&#10;Domingo: Fechado"
                  value={formData.businessHours}
                  onChange={(e) => updateField('businessHours', e.target.value)}
                  className="konver-input resize-none"
                  rows={6}
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="w-3 h-3" />
                  <span>Use uma linha por dia da semana para melhor clareza</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">Exemplos Rápidos</h4>
                <div className="space-y-3">
                  {businessHoursExamples.map((example, index) => (
                    <div 
                      key={index}
                      className="p-3 rounded-lg border border-border/50 hover:border-primary/30 cursor-pointer transition-colors"
                      onClick={() => updateField('businessHours', example.hours)}
                    >
                      <div className="font-medium text-sm text-foreground mb-1">{example.title}</div>
                      <div className="text-xs text-muted-foreground whitespace-pre-line">{example.hours}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Profissionais */}
          <Card className="konver-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 konver-gradient-primary rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Profissionais</h3>
                <p className="text-sm text-muted-foreground">Informações sobre os profissionais da empresa</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="professionals" className="text-sm font-medium">
                Profissionais
              </Label>
              <Textarea
                id="professionals"
                placeholder="ex: Dr. João Silva - CRM 12345 - Cardiologista&#10;Dra. Maria Santos - CRM 67890 - Dermatologista&#10;Dr. Pedro Costa - CRO 11111 - Ortodontista"
                value={formData.professionals}
                onChange={(e) => updateField('professionals', e.target.value)}
                className="konver-input resize-none"
                rows={6}
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="w-3 h-3" />
                <span>Liste um profissional por linha com nome, registro profissional e especialidade</span>
              </div>
            </div>
          </Card>

          {/* Procedimentos Realizados */}
          <Card className="konver-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 konver-gradient-accent rounded-xl flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Procedimentos Realizados</h3>
                <p className="text-sm text-muted-foreground">Lista dos procedimentos e serviços oferecidos</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="procedures" className="text-sm font-medium">
                Procedimentos e Serviços
              </Label>
              <Textarea
                id="procedures"
                placeholder="ex: Consulta Cardiológica&#10;Eletrocardiograma&#10;Teste Ergométrico&#10;Ecocardiograma&#10;Holter 24h&#10;Consulta de Retorno"
                value={formData.procedures}
                onChange={(e) => updateField('procedures', e.target.value)}
                className="konver-input resize-none"
                rows={8}
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="w-3 h-3" />
                <span>Liste um procedimento por linha para melhor organização</span>
              </div>
            </div>
          </Card>

        </div>
      </AssistantStepContent>
    </div>
  );
}
