import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, Settings, User } from "lucide-react";
import PromptManager from "./PromptManager";
import { PromptVersionSummary } from "@/integrations/supabase/types";

interface AssistantSettingsTabProps {
  botId: string;
  assistantName: string;
  setAssistantName: (name: string) => void;
  assistantDescription: string;
  setAssistantDescription: (description: string) => void;
  temperature: number[];
  setTemperature: (temperature: number[]) => void;
  assistantStatus: string;
  setAssistantStatus: (status: string) => void;
  personaObjective: string;
  setPersonaObjective: (objective: string) => void;
  personaPersonality: string;
  setPersonaPersonality: (personality: string) => void;
  personaStyle: string;
  setPersonaStyle: (style: string) => void;
  personaTargetAudience: string;
  setPersonaTargetAudience: (audience: string) => void;
  saveSettings: () => Promise<void>;
  saving: boolean;
}

export default function AssistantSettingsTab({
  botId,
  assistantName,
  setAssistantName,
  assistantDescription,
  setAssistantDescription,
  temperature,
  setTemperature,
  assistantStatus,
  setAssistantStatus,
  personaObjective,
  setPersonaObjective,
  personaPersonality,
  setPersonaPersonality,
  personaStyle,
  setPersonaStyle,
  personaTargetAudience,
  setPersonaTargetAudience,
  saveSettings,
  saving
}: AssistantSettingsTabProps) {
  return (
    <div className="space-y-8">
      <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60 shadow-xl rounded-2xl">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-3 text-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Configurações do Assistente
              </span>
            </CardTitle>
            <Button 
              onClick={saveSettings} 
              disabled={saving}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white h-11 px-6 rounded-xl shadow-lg"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-base font-medium text-slate-700">Nome do Assistente</Label>
                <Input
                  id="name"
                  value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)}
                  placeholder="Nome do assistente"
                  className="mt-2 h-12 rounded-xl border-slate-200/80 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-base font-medium text-slate-700">Descrição</Label>
                <Textarea
                  id="description"
                  value={assistantDescription}
                  onChange={(e) => setAssistantDescription(e.target.value)}
                  placeholder="Descreva o propósito do assistente"
                  rows={3}
                  className="mt-2 rounded-xl border-slate-200/80 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="temperature" className="text-base font-medium text-slate-700">
                  Temperatura: {temperature[0]}
                </Label>
                <Slider
                  id="temperature"
                  value={temperature}
                  onValueChange={setTemperature}
                  min={0}
                  max={2}
                  step={0.1}
                  className="mt-3"
                />
                <p className="text-sm text-slate-500 mt-2">
                  Controla a criatividade das respostas (0 = mais conservador, 2 = mais criativo)
                </p>
              </div>

              <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                <Label htmlFor="status" className="text-base font-medium text-purple-700">Status do Assistente</Label>
                <Switch
                  id="status"
                  checked={assistantStatus === 'Ativo'}
                  onCheckedChange={(checked) => setAssistantStatus(checked ? 'Ativo' : 'Inativo')}
                />
              </div>
            </div>
          </div>

          <Separator className="bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          {/* Sistema de Prompts Versionado */}
          <div>
            <Label className="text-base font-medium text-slate-700 mb-4 block">Sistema de Prompts</Label>
            <PromptManager 
              botId={botId}
              onPromptsUpdate={(prompts: PromptVersionSummary) => {
                // Callback opcional para quando os prompts são atualizados
                console.log('Prompts updated:', prompts);
              }}
            />
            <p className="text-sm text-slate-500 mt-3">
              Gerencie diferentes versões dos prompts principal e de triagem do seu assistente
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Seção "Persona do Assistente" - Comentada temporariamente */}
      {/* 
      <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60 shadow-xl rounded-2xl">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Persona do Assistente
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="personaTargetAudience" className="text-base font-medium text-slate-700">Público-alvo</Label>
            <Input
              id="personaTargetAudience"
              value={personaTargetAudience}
              onChange={(e) => setPersonaTargetAudience(e.target.value)}
              placeholder="Público-alvo"
              className="mt-2 h-12 rounded-xl border-slate-200/80 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
            />
          </div>

          <div>
            <Label htmlFor="personaObjective" className="text-base font-medium text-slate-700">Objetivo</Label>
            <Textarea
              id="personaObjective"
              value={personaObjective}
              onChange={(e) => setPersonaObjective(e.target.value)}
              placeholder="Objetivo principal"
              rows={3}
              className="mt-2 rounded-xl border-slate-200/80 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
            />
          </div>

          <div>
            <Label htmlFor="personaPersonality" className="text-base font-medium text-slate-700">Personalidade</Label>
            <Textarea
              id="personaPersonality"
              value={personaPersonality}
              onChange={(e) => setPersonaPersonality(e.target.value)}
              placeholder="Características de personalidade"
              rows={3}
              className="mt-2 rounded-xl border-slate-200/80 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
            />
          </div>

          <div>
            <Label htmlFor="personaStyle" className="text-base font-medium text-slate-700">Estilo</Label>
            <Textarea
              id="personaStyle"
              value={personaStyle}
              onChange={(e) => setPersonaStyle(e.target.value)}
              placeholder="Estilo de comunicação"
              rows={3}
              className="mt-2 rounded-xl border-slate-200/80 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
            />
          </div>
        </CardContent>
      </Card>
      */}
    </div>
  );
} 