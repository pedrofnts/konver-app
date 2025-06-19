import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Wand2, 
  X, 
  Send, 
  Bot, 
  User, 
  Minimize2,
  Maximize2,
  Sparkles,
  Copy,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

interface FloatingPromptAssistantProps {
  currentPrompt: string;
  onApplyPrompt: (newPrompt: string) => void;
  assistantName?: string;
}

export default function FloatingPromptAssistant({ 
  currentPrompt, 
  onApplyPrompt, 
  assistantName = "Assistente de Prompts" 
}: FloatingPromptAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState('initial');
  const [collectedInfo, setCollectedInfo] = useState({
    goal: '',
    changes: '',
    tone: '',
    audience: '',
    examples: ''
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Mensagem inicial do assistant
      setTimeout(() => {
        addAssistantMessage(
          `Olá! 👋 Sou o ${assistantName} e estou aqui para te ajudar a melhorar o prompt do seu assistente.\n\nVi que seu prompt atual é:\n"${currentPrompt.substring(0, 100)}${currentPrompt.length > 100 ? '...' : ''}"\n\nO que você gostaria de modificar nele? Pode me explicar com suas próprias palavras o que não está funcionando bem ou o que você gostaria de melhorar.`
        );
      }, 1000);
    }
    
    // Auto-focus no input quando abre e não está minimizado
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 1500);
    }
  }, [isOpen, isMinimized]);

  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
  };

  const addAssistantMessage = (content: string, delay = 1500) => {
    setIsTyping(true);
    setTimeout(() => {
      const newMessage: Message = {
        id: Date.now().toString(),
        content,
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
      setIsTyping(false);
    }, delay);
  };

  const generateResponse = (userMessage: string) => {
    const message = userMessage.toLowerCase();
    
    switch (currentStep) {
      case 'initial':
        // Analisando a primeira resposta do usuário
        setCollectedInfo(prev => ({ ...prev, goal: userMessage }));
        
        if (message.includes('mais técnico') || message.includes('técnico')) {
          setCurrentStep('technical');
          addAssistantMessage(
            "Entendi! Você quer tornar o assistente mais técnico. 🔧\n\nMe conte mais sobre isso:\n- Em que área técnica específica? (programação, engenharia, ciência, etc.)\n- Que tipo de linguagem técnica deveria usar?\n- Precisa incluir termos específicos ou jargões?"
          );
        } else if (message.includes('conversacional') || message.includes('amigável') || message.includes('informal')) {
          setCurrentStep('conversational');
          addAssistantMessage(
            "Ótimo! Vamos deixar o assistente mais conversacional e amigável. 😄\n\nMe ajude a entender melhor:\n- Que tipo de tom você imagina? (casual, acolhedor, brincalhão?)\n- Deve usar gírias ou manter mais formal?\n- Quer que ele faça mais perguntas de follow-up?"
          );
        } else if (message.includes('criativo') || message.includes('criatividade')) {
          setCurrentStep('creative');
          addAssistantMessage(
            "Perfeito! Vamos estimular a criatividade do assistente. ✨\n\nMe fale mais:\n- Que tipo de criatividade? (brainstorming, escrita criativa, soluções inovadoras?)\n- Deve ser mais ousado nas sugestões?\n- Precisa incluir exemplos criativos nas respostas?"
          );
        } else {
          setCurrentStep('general');
          addAssistantMessage(
            "Entendi sua necessidade! 👍\n\nPara eu te ajudar melhor, me conte:\n- Qual é o público-alvo do seu assistente?\n- Que tipo de respostas você espera dele?\n- Há alguma situação específica onde ele não está funcionando bem?"
          );
        }
        break;
        
      case 'technical':
      case 'conversational':
      case 'creative':
      case 'general':
        setCollectedInfo(prev => ({ ...prev, changes: userMessage }));
        setCurrentStep('audience');
        addAssistantMessage(
          "Excelente! Já tenho uma boa visão do que você quer. 🎯\n\nAgora me fale sobre o público:\n- Quem são as pessoas que mais vão interagir com este assistente?\n- Qual o nível de conhecimento delas no assunto?\n- Há algum contexto específico de uso?"
        );
        break;
        
      case 'audience':
        setCollectedInfo(prev => ({ ...prev, audience: userMessage }));
        setCurrentStep('examples');
        addAssistantMessage(
          "Perfeito! 👌\n\nPara finalizar, você pode me dar um exemplo de como gostaria que o assistente respondesse em uma situação típica? Ou alguma referência de tom/estilo que você admira?\n\n(Isso me ajuda a capturar melhor o que você tem em mente)"
        );
        break;
        
      case 'examples':
        setCollectedInfo(prev => ({ ...prev, examples: userMessage }));
        setCurrentStep('generating');
        addAssistantMessage(
          "Perfeito! 🎉 Tenho todas as informações que preciso.\n\nVou gerar uma nova versão do seu prompt baseada em tudo que você me contou. Isso vai levar alguns segundos...",
          1000
        );
        
        // Simula geração do prompt
        setTimeout(() => {
          const newPrompt = generateNewPrompt();
          setCurrentStep('result');
          addAssistantMessage(
            `Pronto! Aqui está sua nova versão do prompt:\n\n---\n\n${newPrompt}\n\n---\n\nO que você acha? Ficou mais próximo do que você imaginava? Posso fazer ajustes se necessário! 🔧`,
            3000
          );
        }, 3000);
        break;
        
      case 'result':
        if (message.includes('bom') || message.includes('ótimo') || message.includes('perfeito') || message.includes('gostei')) {
          addAssistantMessage(
            "Que bom que você gostou! 😊\n\nVou aplicar este novo prompt para você. Depois de aplicar, você pode testá-lo e ver como o assistente se comporta.\n\nSe precisar de mais ajustes, é só me chamar novamente!"
          );
          
          // Aplicar o prompt
          setTimeout(() => {
            const newPrompt = generateNewPrompt();
            onApplyPrompt(newPrompt);
            toast({
              title: "Prompt Aplicado!",
              description: "O novo prompt foi aplicado ao seu assistente.",
            });
          }, 2000);
        } else {
          addAssistantMessage(
            "Sem problemas! Vamos ajustar. 🔧\n\nMe diga o que você gostaria de modificar nesta versão. Posso:\n- Ajustar o tom\n- Mudar o nível de formalidade\n- Adicionar/remover elementos específicos\n- Focar em aspectos diferentes\n\nO que você tem em mente?"
          );
          setCurrentStep('refining');
        }
        break;
        
      case 'refining':
        addAssistantMessage(
          "Entendi! Vou fazer esses ajustes agora... ⚡",
          1000
        );
        
        setTimeout(() => {
          const refinedPrompt = generateRefinedPrompt(userMessage);
          addAssistantMessage(
            `Aqui está a versão ajustada:\n\n---\n\n${refinedPrompt}\n\n---\n\nAgora ficou melhor? 🎯`,
            2500
          );
          setCurrentStep('result');
        }, 2500);
        break;
        
      default:
        addAssistantMessage(
          "Desculpe, acho que me perdi na conversa. 😅 Pode me explicar novamente o que você gostaria de modificar no prompt?"
        );
        setCurrentStep('initial');
    }
  };

  const generateNewPrompt = () => {
    const { goal, changes, audience, examples } = collectedInfo;
    
    // Simulação de geração de prompt baseado nas informações coletadas
    let newPrompt = "Você é um assistente de IA ";
    
    if (goal.toLowerCase().includes('técnico')) {
      newPrompt += "especializado e técnico, com profundo conhecimento em sua área de atuação. ";
    } else if (goal.toLowerCase().includes('conversacional')) {
      newPrompt += "conversacional e amigável, que se comunica de forma natural e acolhedora. ";
    } else if (goal.toLowerCase().includes('criativo')) {
      newPrompt += "criativo e inovador, que pensa fora da caixa e oferece soluções originais. ";
    }
    
    newPrompt += "Suas principais características são:\n\n";
    
    // Adiciona características baseadas no que foi coletado
    if (audience.toLowerCase().includes('iniciante')) {
      newPrompt += "- Explique conceitos de forma simples e didática\n";
      newPrompt += "- Use analogias e exemplos práticos\n";
      newPrompt += "- Seja paciente e encorajador\n";
    } else if (audience.toLowerCase().includes('expert')) {
      newPrompt += "- Use terminologia técnica apropriada\n";
      newPrompt += "- Vá direto ao ponto com precisão\n";
      newPrompt += "- Ofereça insights avançados\n";
    }
    
    newPrompt += "\nSempre mantenha um tom ";
    if (goal.toLowerCase().includes('conversacional')) {
      newPrompt += "natural e próximo, como se fosse uma conversa entre amigos. ";
    } else if (goal.toLowerCase().includes('técnico')) {
      newPrompt += "profissional mas acessível, equilibrando precisão com clareza. ";
    }
    
    newPrompt += "\n\nQuando responder, sempre considere o contexto e as necessidades específicas do usuário, oferecendo informações relevantes e actionáveis.";
    
    return newPrompt;
  };

  const generateRefinedPrompt = (refinements: string) => {
    // Simula ajustes baseados no feedback
    let refined = generateNewPrompt();
    
    if (refinements.toLowerCase().includes('mais formal')) {
      refined = refined.replace('conversacional e amigável', 'profissional e respeitoso');
    } else if (refinements.toLowerCase().includes('menos formal')) {
      refined = refined.replace('profissional mas acessível', 'descontraído e amigável');
    }
    
    return refined;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    addUserMessage(inputValue);
    generateResponse(inputValue);
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copiado!",
        description: "Mensagem copiada para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a mensagem.",
        variant: "destructive",
      });
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group">
          {/* Glow effect - behind button */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 blur-lg opacity-20 pointer-events-none"></div>
          
          <Button
            onClick={() => setIsOpen(true)}
            className="relative w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 hover:from-purple-600 hover:via-pink-600 hover:to-indigo-600 text-white shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-110 z-10"
          >
            <Wand2 className="w-10 h-10" />
            
            {/* Status indicator */}
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </Button>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-3 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            ✨ Assistente de Prompts
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className={`bg-white shadow-2xl border-0 transition-all duration-300 rounded-2xl ${
        isMinimized ? 'w-96 h-16' : 'w-[480px] h-[700px]'
      }`}>
        {/* Header */}
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-800">{assistantName}</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-slate-500">Online</span>
                </div>
              </div>
            </CardTitle>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-8 h-8 p-0 hover:bg-slate-100"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 p-0 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            {/* Messages */}
            <CardContent className="p-0 flex-1 overflow-hidden">
              <div className="h-[560px] overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'bg-white border border-slate-200 text-slate-800'
                      }`}
                    >
                      {message.sender === 'assistant' && (
                        <div className="flex items-center space-x-2 mb-2">
                          <Avatar className="w-7 h-7">
                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold">
                              <Wand2 className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium text-purple-600">Assistente de Prompts</span>
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed whitespace-pre-line">
                          {message.content}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <span className={`text-xs ${
                            message.sender === 'user' ? 'text-purple-100' : 'text-slate-400'
                          }`}>
                            {message.timestamp.toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {message.sender === 'assistant' && message.content.includes('---') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyMessage(message.content)}
                              className="h-7 px-2 text-xs hover:bg-slate-100 rounded-lg"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copiar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 max-w-[85%] shadow-sm">
                      <div className="flex items-center space-x-2 mb-2">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold">
                            <Wand2 className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-purple-600">Assistente de Prompts</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-xs text-slate-500">digitando...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </CardContent>

            {/* Input */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <form onSubmit={handleSubmit} className="flex items-center space-x-3">
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    disabled={isTyping}
                    className="w-full h-12 pr-12 rounded-2xl border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 bg-white"
                  />
                  <Button
                    type="submit"
                    disabled={!inputValue.trim() || isTyping}
                    className="absolute right-1 top-1 w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 p-0 transition-all duration-200"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center justify-center mt-2">
                  <div className="flex items-center space-x-2 text-sm text-slate-500">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span>O assistente está digitando...</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
} 