import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Zap, 
  MessageSquare, 
  Plus, 
  Eye, 
  Clock,
  Settings,
  Sliders,
  Activity,
  BarChart3,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Save,
  Edit,
  History,
  TrendingUp,
  Brain,
  Filter,
  Target,
  Layers,
  RefreshCw,
  ChevronRight,
  MoreVertical
} from "lucide-react";

interface PromptVersion {
  id: string;
  content: string;
  version: number;
  created_at: string;
  is_active: boolean;
  performance_score?: number;
}

interface Assistant {
  id: string;
  name: string;
  description: string;
  temperature: number;
  active: boolean;
  prompts: {
    principal: PromptVersion[];
    triagem: PromptVersion[];
    think: PromptVersion[];
  };
}

interface SettingsContentProps {
  assistant: Assistant;
  updateAssistant: (updates: Partial<Assistant>) => void;
  onCreatePromptVersion?: (type: 'principal' | 'triagem' | 'think') => void;
  onActivatePromptVersion?: (type: 'principal' | 'triagem' | 'think', versionId: string) => void;
}

export default function SettingsContent({ 
  assistant, 
  updateAssistant, 
  onCreatePromptVersion,
  onActivatePromptVersion 
}: SettingsContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('basic');
  const [savingField, setSavingField] = useState<string | null>(null);
  const getActivePrompt = (type: 'principal' | 'triagem' | 'think') => {
    return assistant.prompts[type].find(p => p.is_active);
  };

  const getPromptStats = (type: 'principal' | 'triagem' | 'think') => {
    const prompts = assistant.prompts[type];
    const activePrompt = getActivePrompt(type);
    return {
      total: prompts.length,
      active: activePrompt,
      performance: activePrompt?.performance_score || 0
    };
  };

  const handleCreatePrompt = (type: 'principal' | 'triagem' | 'think') => {
    if (onCreatePromptVersion) {
      onCreatePromptVersion(type);
    }
  };

  const getPromptTypeIcon = (type: string) => {
    switch (type) {
      case 'principal': return <MessageSquare className="w-4 h-4" />;
      case 'triagem': return <Zap className="w-4 h-4" />;
      case 'think': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getPromptTypeTitle = (type: string) => {
    switch (type) {
      case 'principal': return 'Prompt Principal';
      case 'triagem': return 'Prompt de Triagem';
      case 'think': return 'Prompt de Pensamento';
      default: return type;
    }
  };

  const getPromptTypeDescription = (type: string) => {
    switch (type) {
      case 'principal': return 'Define a personalidade e comportamento principal do assistente';
      case 'triagem': return 'Usado para classificar e direcionar conversas iniciais';
      case 'think': return 'Prompt interno para processamento e raciocínio do assistente';
      default: return '';
    }
  };

  const handleFieldUpdate = async (field: string, value: any) => {
    setSavingField(field);
    try {
      updateAssistant({ [field]: value });
      // Simulate save delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 800));
    } finally {
      setSavingField(null);
    }
  };

  const getAssistantStats = () => {
    const totalPrompts = Object.values(assistant.prompts).flat().length;
    const activePrompts = Object.values(assistant.prompts).filter(prompts => 
      prompts.some(p => p.is_active)
    ).length;
    const averagePerformance = Math.round(
      Object.values(assistant.prompts)
        .flat()
        .filter(p => p.is_active && p.performance_score)
        .reduce((sum, p) => sum + (p.performance_score || 0), 0) / 
      Math.max(1, Object.values(assistant.prompts).flat().filter(p => p.is_active).length)
    );
    const lastUpdate = Math.max(
      ...Object.values(assistant.prompts).flat().map(p => new Date(p.created_at).getTime())
    );
    
    return { totalPrompts, activePrompts, averagePerformance, lastUpdate };
  };

  const stats = getAssistantStats();

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <div className="konver-tab-content-flex">
      {/* Enhanced Stats Header */}
      <div className="konver-glass-card rounded-2xl p-6 mb-6 konver-animate-fade-in">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="konver-gradient-primary w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold konver-text-gradient">{stats.totalPrompts}</div>
            <div className="text-sm text-muted-foreground">Total Prompts</div>
          </div>
          <div className="text-center">
            <div className="bg-success/10 text-success w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-success/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-2xl font-bold text-success">{stats.activePrompts}</div>
            <div className="text-sm text-muted-foreground">Ativos</div>
          </div>
          <div className="text-center">
            <div className="bg-accent/10 text-accent w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-accent/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="text-2xl font-bold text-accent">{stats.averagePerformance}%</div>
            <div className="text-sm text-muted-foreground">Performance</div>
          </div>
          <div className="text-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 border ${assistant.active ? 'konver-gradient-accent text-white shadow-lg' : 'bg-muted/50 text-muted-foreground border-muted'}`}>
              <Activity className="w-6 h-6" />
            </div>
            <div className={`text-2xl font-bold ${assistant.active ? 'text-accent' : 'text-muted-foreground'}`}>
              {assistant.active ? 'ON' : 'OFF'}
            </div>
            <div className="text-sm text-muted-foreground">Status</div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 konver-scrollbar">
        <div className="space-y-6 pr-4">
          {/* Basic Settings Section */}
          <div className="konver-glass-card rounded-2xl overflow-hidden konver-animate-slide-left">
            <div 
              className="p-6 border-b border-border/50 cursor-pointer konver-hover-subtle"
              onClick={() => toggleSection('basic')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="konver-gradient-primary w-10 h-10 rounded-xl flex items-center justify-center shadow-md">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Configurações Básicas</h3>
                    <p className="text-sm text-muted-foreground">Nome, descrição e configurações principais</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${expandedSection === 'basic' ? 'rotate-90' : ''}`} />
              </div>
            </div>
            
            {expandedSection === 'basic' && (
              <div className="p-6 konver-animate-in">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="konver-card p-6 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="assistantName" className="text-base font-semibold flex items-center space-x-2">
                          <Brain className="w-4 h-4 text-primary" />
                          <span>Nome do Assistente</span>
                        </Label>
                        {savingField === 'name' && (
                          <div className="flex items-center space-x-2 text-sm text-accent">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Salvando...</span>
                          </div>
                        )}
                      </div>
                      <Input
                        id="assistantName"
                        value={assistant.name}
                        onChange={(e) => handleFieldUpdate('name', e.target.value)}
                        className="h-12 rounded-xl border-border/50 bg-background/50 backdrop-blur-sm focus:bg-background transition-all duration-200 konver-focus"
                        placeholder="Digite um nome para seu assistente..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Um nome único e descritivo que identifique seu assistente
                      </p>
                    </div>

                    <div className="konver-card p-6 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="description" className="text-base font-semibold flex items-center space-x-2">
                          <Edit className="w-4 h-4 text-primary" />
                          <span>Descrição</span>
                        </Label>
                        {savingField === 'description' && (
                          <div className="flex items-center space-x-2 text-sm text-accent">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Salvando...</span>
                          </div>
                        )}
                      </div>
                      <Textarea
                        id="description"
                        value={assistant.description}
                        onChange={(e) => handleFieldUpdate('description', e.target.value)}
                        className="min-h-[120px] rounded-xl border-border/50 bg-background/50 backdrop-blur-sm focus:bg-background transition-all duration-200 konver-focus resize-none"
                        placeholder="Descreva o propósito, personalidade e capacidades do seu assistente..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Uma descrição clara ajudará usuários a entenderem o propósito do assistente
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="konver-card p-6 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold flex items-center space-x-2">
                          <Sliders className="w-4 h-4 text-primary" />
                          <span>Temperatura: {assistant.temperature}</span>
                        </Label>
                        {savingField === 'temperature' && (
                          <div className="flex items-center space-x-2 text-sm text-accent">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Salvando...</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        <Slider
                          value={[assistant.temperature]}
                          onValueChange={(value) => handleFieldUpdate('temperature', value[0])}
                          max={2}
                          min={0}
                          step={0.1}
                          className="py-4"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <Target className="w-3 h-3" />
                            <span>Conservador (0)</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Criativo (2)</span>
                          </span>
                        </div>
                        <div className={`p-3 rounded-xl border ${assistant.temperature <= 0.5 ? 'bg-blue-50/50 border-blue-200/50 text-blue-700' : assistant.temperature <= 1.2 ? 'bg-yellow-50/50 border-yellow-200/50 text-yellow-700' : 'bg-purple-50/50 border-purple-200/50 text-purple-700'}`}>
                          <p className="text-xs font-medium">
                            {assistant.temperature <= 0.5 ? '🎯 Modo Conservador - Respostas precisas e consistentes' : 
                             assistant.temperature <= 1.2 ? '⚖️ Modo Balanceado - Equilíbrio entre precisão e criatividade' :
                             '🎨 Modo Criativo - Respostas mais variadas e inovadoras'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="konver-card p-6 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${assistant.active ? 'konver-gradient-accent shadow-lg' : 'bg-muted/50 border border-muted'}`}>
                            <Activity className={`w-6 h-6 ${assistant.active ? 'text-white' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <Label htmlFor="assistantStatus" className="text-base font-semibold">
                              Status do Assistente
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              {assistant.active ? 'Assistente ativo e disponível para conversas' : 'Assistente desativado - não responderá mensagens'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {savingField === 'active' && (
                            <div className="flex items-center space-x-2 text-sm text-accent">
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Salvando...</span>
                            </div>
                          )}
                          <Switch
                            id="assistantStatus"
                            checked={assistant.active}
                            onCheckedChange={(checked) => handleFieldUpdate('active', checked)}
                            className="data-[state=checked]:bg-accent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Prompt Management Section */}
          <div className="konver-glass-card rounded-2xl overflow-hidden konver-animate-slide-right">
            <div 
              className="p-6 border-b border-border/50 cursor-pointer konver-hover-subtle"
              onClick={() => toggleSection('prompts')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="konver-gradient-accent w-10 h-10 rounded-xl flex items-center justify-center shadow-md">
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Sistema de Prompts</h3>
                    <p className="text-sm text-muted-foreground">Gerencie versões e tipos de prompts do assistente</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary">{stats.totalPrompts}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-success">{stats.activePrompts}</div>
                      <div className="text-xs text-muted-foreground">Ativos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-accent">{stats.averagePerformance}%</div>
                      <div className="text-xs text-muted-foreground">Performance</div>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${expandedSection === 'prompts' ? 'rotate-90' : ''}`} />
                </div>
              </div>
            </div>
            
            {expandedSection === 'prompts' && (
              <div className="p-6 konver-animate-in">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {(['principal', 'triagem', 'think'] as const).map((promptType, index) => {
                    const stats = getPromptStats(promptType);
                    const gradientClasses = {
                      principal: 'konver-gradient-primary',
                      triagem: 'konver-gradient-accent',
                      think: 'konver-gradient-secondary'
                    };
                    
                    return (
                      <div 
                        key={promptType} 
                        className="konver-card-interactive rounded-2xl overflow-hidden konver-animate-in group"
                        style={{ animationDelay: `${index * 150}ms` }}
                      >
                        <div className="p-6 space-y-4">
                          {/* Enhanced Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${gradientClasses[promptType]}`}>
                                <div className="text-white">{getPromptTypeIcon(promptType)}</div>
                              </div>
                              <div>
                                <h4 className="font-semibold text-base">
                                  {getPromptTypeTitle(promptType)}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {stats.total} versão{stats.total !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleCreatePrompt(promptType)}
                              size="sm"
                              className="konver-button-primary h-9 w-9 p-0 rounded-xl shadow-md"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Enhanced Content */}
                          {stats.active ? (
                            <div className="space-y-4">
                              {/* Status and Performance */}
                              <div className="flex items-center justify-between">
                                <Badge className="bg-success/10 text-success border-success/20 px-3 py-1 rounded-full font-medium">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  v{stats.active.version} Ativo
                                </Badge>
                                {stats.performance > 0 && (
                                  <div className="flex items-center space-x-1 text-sm text-accent">
                                    <BarChart3 className="w-3 h-3" />
                                    <span>{stats.performance}%</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Content Preview */}
                              <div className="konver-card p-4 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/30">
                                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                                  {stats.active.content.substring(0, 150)}
                                  {stats.active.content.length > 150 && '...'}
                                </p>
                              </div>

                              {/* Actions and Metadata */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>{new Date(stats.active.created_at).toLocaleDateString('pt-BR')}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs konver-hover-subtle rounded-lg">
                                    <Eye className="w-3 h-3 mr-1" />
                                    <span>Ver</span>
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs konver-hover-subtle rounded-lg">
                                    <History className="w-3 h-3 mr-1" />
                                    <span>Versões</span>
                                  </Button>
                                </div>
                              </div>

                              {/* Enhanced Performance Bar */}
                              {stats.performance > 0 && (
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Performance Geral</span>
                                    <span className="font-medium text-accent">{stats.performance}%</span>
                                  </div>
                                  <div className="relative">
                                    <Progress value={stats.performance} className="h-2 rounded-full" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full animate-pulse" />
                                  </div>
                                  <div className="text-xs text-muted-foreground text-center">
                                    {stats.performance >= 80 ? '🚀 Excelente' : stats.performance >= 60 ? '👍 Bom' : stats.performance >= 40 ? '⚠️ Regular' : '🔧 Precisa melhorar'}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <div className="konver-gradient-muted w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <FileText className="w-8 h-8 text-white" />
                              </div>
                              <h4 className="font-medium text-base mb-2">Nenhum prompt ativo</h4>
                              <p className="text-sm text-muted-foreground mb-4">Crie a primeira versão para começar</p>
                              <Button 
                                onClick={() => handleCreatePrompt(promptType)}
                                className="konver-button-primary"
                                size="sm"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Criar Primeiro Prompt
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Enhanced Description */}
                        <div className="konver-card p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10">
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {getPromptTypeDescription(promptType)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Section */}
          <div className="konver-glass-card rounded-2xl p-6 konver-animate-fade-in" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="konver-gradient-secondary w-10 h-10 rounded-xl flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Ações Rápidas</h3>
                  <p className="text-sm text-muted-foreground">Operações comuns para otimização</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                className="konver-button-secondary h-auto p-4 flex-col space-y-2 rounded-2xl"
                onClick={() => {}}
              >
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-medium">Analisar Performance</span>
                <span className="text-xs text-muted-foreground">Revisar métricas e otimizações</span>
              </Button>
              
              <Button 
                className="konver-button-secondary h-auto p-4 flex-col space-y-2 rounded-2xl"
                onClick={() => {}}
              >
                <History className="w-5 h-5" />
                <span className="text-sm font-medium">Backup & Restore</span>
                <span className="text-xs text-muted-foreground">Gerenciar versões e backups</span>
              </Button>
              
              <Button 
                className="konver-button-secondary h-auto p-4 flex-col space-y-2 rounded-2xl"
                onClick={() => {}}
              >
                <RefreshCw className="w-5 h-5" />
                <span className="text-sm font-medium">Reset Settings</span>
                <span className="text-xs text-muted-foreground">Restaurar configurações padrão</span>
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
