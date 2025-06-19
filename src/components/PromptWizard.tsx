import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Wand2, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  Lightbulb,
  Target,
  MessageSquare,
  Sparkles,
  Brain,
  Edit3
} from "lucide-react";

interface PromptWizardProps {
  currentPrompt: string;
  onSubmitRequest: (request: PromptModificationRequest) => void;
  isSubmitting?: boolean;
}

export interface PromptModificationRequest {
  currentPrompt: string;
  modificationGoal: string;
  specificChanges: string;
  tonestyle: string;
  targetAudience: string;
  additionalRequirements: string;
  exampleScenario: string;
  priority: 'low' | 'medium' | 'high';
}

export default function PromptWizard({ currentPrompt, onSubmitRequest, isSubmitting = false }: PromptWizardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Form states
  const [modificationGoal, setModificationGoal] = useState('');
  const [specificChanges, setSpecificChanges] = useState('');
  const [tonestyle, setTonestyle] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  const [exampleScenario, setExampleScenario] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const resetForm = () => {
    setModificationGoal('');
    setSpecificChanges('');
    setTonestyle('');
    setTargetAudience('');
    setAdditionalRequirements('');
    setExampleScenario('');
    setPriority('medium');
    setCurrentStep(1);
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const request: PromptModificationRequest = {
      currentPrompt,
      modificationGoal,
      specificChanges,
      tonestyle,
      targetAudience,
      additionalRequirements,
      exampleScenario,
      priority
    };
    
    onSubmitRequest(request);
    handleClose();
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return modificationGoal.trim().length > 0;
      case 2:
        return specificChanges.trim().length > 0;
      case 3:
        return tonestyle.trim().length > 0 && targetAudience.trim().length > 0;
      case 4:
        return true; // Review step is always valid
      default:
        return false;
    }
  };

  const getStepIcon = (step: number) => {
    const icons = [Target, Edit3, MessageSquare, CheckCircle];
    const IconComponent = icons[step - 1];
    return <IconComponent className="w-5 h-5" />;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800">Qual é o objetivo da modificação?</h3>
              <p className="text-slate-600">Descreva claramente o que você gostaria de alcançar com as mudanças no prompt.</p>
            </div>

            <div className="space-y-4">
              <Label htmlFor="goal" className="text-base font-medium text-slate-700">Objetivo Principal</Label>
              <Textarea
                id="goal"
                value={modificationGoal}
                onChange={(e) => setModificationGoal(e.target.value)}
                placeholder="Ex: Tornar o assistente mais técnico e focado em desenvolvimento de software..."
                rows={4}
                className="rounded-xl border-slate-200/80 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
              />
              
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary" className="cursor-pointer hover:bg-purple-100" 
                       onClick={() => setModificationGoal("Tornar mais conversacional e amigável")}>
                  Mais conversacional
                </Badge>
                <Badge variant="secondary" className="cursor-pointer hover:bg-purple-100"
                       onClick={() => setModificationGoal("Aumentar expertise técnica e precisão")}>
                  Mais técnico
                </Badge>
                <Badge variant="secondary" className="cursor-pointer hover:bg-purple-100"
                       onClick={() => setModificationGoal("Focar em criatividade e brainstorming")}>
                  Mais criativo
                </Badge>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto">
                <Edit3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800">Quais mudanças específicas?</h3>
              <p className="text-slate-600">Detalhe as modificações específicas que você deseja implementar.</p>
            </div>

            <div className="space-y-4">
              <Label htmlFor="changes" className="text-base font-medium text-slate-700">Mudanças Específicas</Label>
              <Textarea
                id="changes"
                value={specificChanges}
                onChange={(e) => setSpecificChanges(e.target.value)}
                placeholder="Ex: Adicionar mais exemplos práticos, remover linguagem muito formal, incluir perguntas de follow-up..."
                rows={4}
                className="rounded-xl border-slate-200/80 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
              />

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-start space-x-3">
                  <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">Dicas para mudanças específicas:</h4>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1">
                      <li>• Mencione comportamentos específicos que quer adicionar/remover</li>
                      <li>• Descreva o formato de resposta desejado</li>
                      <li>• Indique se há informações que devem ser sempre incluídas</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800">Tom e Público-alvo</h3>
              <p className="text-slate-600">Defina o estilo de comunicação e quem é o público-alvo.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label htmlFor="tone" className="text-base font-medium text-slate-700">Tom e Estilo</Label>
                <Textarea
                  id="tone"
                  value={tonestyle}
                  onChange={(e) => setTonestyle(e.target.value)}
                  placeholder="Ex: Profissional mas acessível, uso de exemplos práticos..."
                  rows={3}
                  className="rounded-xl border-slate-200/80 focus:border-green-400 focus:ring-2 focus:ring-green-400/20"
                />
              </div>

              <div className="space-y-4">
                <Label htmlFor="audience" className="text-base font-medium text-slate-700">Público-alvo</Label>
                <Textarea
                  id="audience"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Ex: Desenvolvedores iniciantes, estudantes de programação..."
                  rows={3}
                  className="rounded-xl border-slate-200/80 focus:border-green-400 focus:ring-2 focus:ring-green-400/20"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label htmlFor="example" className="text-base font-medium text-slate-700">Cenário de Exemplo (Opcional)</Label>
              <Textarea
                id="example"
                value={exampleScenario}
                onChange={(e) => setExampleScenario(e.target.value)}
                placeholder="Descreva uma situação típica onde o assistente seria usado..."
                rows={3}
                className="rounded-xl border-slate-200/80 focus:border-green-400 focus:ring-2 focus:ring-green-400/20"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800">Revisão Final</h3>
              <p className="text-slate-600">Confirme os detalhes da sua solicitação de modificação.</p>
            </div>

            <div className="space-y-6">
              <Card className="bg-slate-50 border-slate-200">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h4 className="font-medium text-slate-800 mb-2">Objetivo:</h4>
                    <p className="text-slate-600 text-sm">{modificationGoal}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium text-slate-800 mb-2">Mudanças Específicas:</h4>
                    <p className="text-slate-600 text-sm">{specificChanges}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-slate-800 mb-2">Tom/Estilo:</h4>
                      <p className="text-slate-600 text-sm">{tonestyle}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800 mb-2">Público-alvo:</h4>
                      <p className="text-slate-600 text-sm">{targetAudience}</p>
                    </div>
                  </div>

                  {exampleScenario && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium text-slate-800 mb-2">Cenário de Exemplo:</h4>
                        <p className="text-slate-600 text-sm">{exampleScenario}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Label htmlFor="requirements" className="text-base font-medium text-slate-700">Requisitos Adicionais (Opcional)</Label>
                <Textarea
                  id="requirements"
                  value={additionalRequirements}
                  onChange={(e) => setAdditionalRequirements(e.target.value)}
                  placeholder="Alguma instrução especial ou requisito adicional..."
                  rows={3}
                  className="rounded-xl border-slate-200/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                />
              </div>

              <div>
                <Label className="text-base font-medium text-slate-700 mb-3 block">Prioridade</Label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={priority === 'low' ? 'default' : 'outline'}
                    onClick={() => setPriority('low')}
                    className="flex-1"
                  >
                    Baixa
                  </Button>
                  <Button
                    type="button"
                    variant={priority === 'medium' ? 'default' : 'outline'}
                    onClick={() => setPriority('medium')}
                    className="flex-1"
                  >
                    Média
                  </Button>
                  <Button
                    type="button"
                    variant={priority === 'high' ? 'default' : 'outline'}
                    onClick={() => setPriority('high')}
                    className="flex-1"
                  >
                    Alta
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:from-purple-100 hover:to-pink-100 text-purple-700 h-11 px-6 rounded-xl shadow-sm"
        >
          <Wand2 className="w-4 h-4 mr-2" />
          Modificar Prompt com IA
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center space-x-3 text-2xl">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Assistente de Modificação de Prompt
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {Array.from({ length: totalSteps }).map((_, index) => {
              const stepNumber = index + 1;
              const isActive = stepNumber === currentStep;
              const isCompleted = stepNumber < currentStep;
              
              return (
                <div key={stepNumber} className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
                    ${isActive 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                      : isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-slate-200 text-slate-600'
                    }
                  `}>
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : getStepIcon(stepNumber)}
                  </div>
                  {stepNumber < totalSteps && (
                    <div className={`
                      w-16 h-1 mx-2 transition-all
                      ${stepNumber < currentStep ? 'bg-green-500' : 'bg-slate-200'}
                    `} />
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="text-center">
            <p className="text-sm text-slate-600">
              Passo {currentStep} de {totalSteps}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="h-11 px-6 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="h-11 px-6 rounded-xl"
            >
              Cancelar
            </Button>
            
            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!isStepValid(currentStep)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white h-11 px-6 rounded-xl shadow-lg"
              >
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white h-11 px-6 rounded-xl shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Prompt Modificado
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 