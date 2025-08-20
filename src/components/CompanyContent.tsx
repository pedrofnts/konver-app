import { useState, useEffect } from 'react';
import { Building2, Globe, Instagram, Clock, MapPin, Save, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import AssistantStepHeader from "./AssistantStepHeader";
import AssistantStepContent from "./AssistantStepContent";

interface CompanyInfo {
  name: string;
  address: string;
  website: string;
  instagram: string;
  businessHours: string;
}

interface CompanyContentProps {
  assistantId: string;
  companyInfo?: {
    company_name?: string | null;
    company_address?: string | null;
    company_website?: string | null;
    company_instagram?: string | null;
    company_business_hours?: string | null;
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
  const [formData, setFormData] = useState<CompanyInfo>({
    name: '',
    address: '',
    website: '',
    instagram: '',
    businessHours: ''
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Initialize form with existing data
  useEffect(() => {
    if (companyInfo) {
      setFormData({
        name: companyInfo.company_name || '',
        address: companyInfo.company_address || '',
        website: companyInfo.company_website || '',
        instagram: companyInfo.company_instagram || '',
        businessHours: companyInfo.company_business_hours || ''
      });
    }
  }, [companyInfo]);

  const handleInputChange = (field: keyof CompanyInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!onSave) return;

    setSaving(true);
    try {
      await onSave(formData);
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
    let formatted = value.replace('@', '');
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
                  onChange={(e) => handleInputChange('name', e.target.value)}
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
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  onBlur={(e) => handleInputChange('website', formatWebsite(e.target.value))}
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
                  onChange={(e) => handleInputChange('address', e.target.value)}
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
                    onChange={(e) => handleInputChange('instagram', formatInstagramHandle(e.target.value))}
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
                  onChange={(e) => handleInputChange('businessHours', e.target.value)}
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
                      onClick={() => handleInputChange('businessHours', example.hours)}
                    >
                      <div className="font-medium text-sm text-foreground mb-1">{example.title}</div>
                      <div className="text-xs text-muted-foreground whitespace-pre-line">{example.hours}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Information Usage */}
          <Card className="konver-card p-6 bg-muted/20 border-muted/30">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center">
                <Info className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-foreground mb-2">Como essas informações são usadas</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Nome da Empresa:</strong> Usado nas apresentações e assinaturas do assistente</li>
                  <li>• <strong>Endereço:</strong> Fornecido quando clientes perguntam sobre localização</li>
                  <li>• <strong>Website:</strong> Compartilhado para mais informações sobre produtos/serviços</li>
                  <li>• <strong>Instagram:</strong> Usado para divulgar redes sociais e conteúdo visual</li>
                  <li>• <strong>Horário:</strong> Informa clientes sobre disponibilidade de atendimento</li>
                </ul>
              </div>
            </div>
          </Card>

        </div>
      </AssistantStepContent>
    </div>
  );
}
