import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Mail, Lock, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, signIn, signUp } = useAuth();

  // Redirect authenticated users to dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, fullName);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card/30 to-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 konver-gradient-primary rounded-full opacity-5 blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 konver-gradient-accent rounded-full opacity-5 blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-md space-y-8 relative z-10 konver-animate-in">
        {/* Enhanced Logo Section */}
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl konver-gradient-primary shadow-xl mb-8 konver-animate-float">
            <MessageSquare className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold konver-text-gradient mb-3">
            konver
          </h1>
       
        </div>

        {/* Enhanced Auth Card */}
        <Card className="konver-glass border border-border/50 shadow-2xl backdrop-blur-xl">
          <CardHeader className="text-center pb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 rounded-t-xl"></div>
            <div className="relative z-10">
              <CardTitle className="text-2xl font-semibold text-foreground mb-2">
                {isLogin ? "Bem-vindo de volta" : "Comece agora"}
              </CardTitle>
              <CardDescription className="text-muted-foreground/90 text-base">
                {isLogin 
                  ? "Acesse seu painel de assistentes e otimize seu atendimento" 
                  : "Comece a criar assistentes inteligentes que transformam conversas"
                }
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="space-y-3 konver-animate-scale-in" style={{ animationDelay: '100ms' }}>
                  <Label htmlFor="fullName" className="text-sm font-semibold text-foreground">
                    Nome Completo
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Digite seu nome completo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={!isLogin}
                      className="pl-12 h-12 konver-focus bg-background/50 border-border hover:border-primary/30 transition-all duration-200 text-base"
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-3 konver-animate-scale-in" style={{ animationDelay: !isLogin ? '200ms' : '100ms' }}>
                <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                  Endereço de Email
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Digite seu endereço de email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-12 h-12 konver-focus bg-background/50 border-border hover:border-primary/30 transition-all duration-200 text-base"
                  />
                </div>
              </div>
              
              <div className="space-y-3 konver-animate-scale-in" style={{ animationDelay: !isLogin ? '300ms' : '200ms' }}>
                <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                  Senha
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-12 h-12 konver-focus bg-background/50 border-border hover:border-primary/30 transition-all duration-200 text-base"
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full h-12 konver-button-primary font-semibold text-base konver-animate-scale-in"
                style={{ animationDelay: !isLogin ? '400ms' : '300ms' }}
                disabled={loading}
              >
                {loading 
                  ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {isLogin ? "Entrando..." : "Criando conta..."}
                    </div>
                  ) 
                  : (isLogin ? "Entrar" : "Criar Conta")
                }
              </Button>
            </form>
            
            <div className="text-center pt-6 border-t border-border/50">
              <Button
                variant="ghost"
                onClick={() => setIsLogin(!isLogin)}
                className="konver-hover-subtle text-base font-medium text-muted-foreground hover:text-foreground px-6 py-2"
              >
                {isLogin 
                  ? "Não tem uma conta? Cadastre-se" 
                  : "Já tem uma conta? Entre"
                }
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Footer */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground/60">
            <span>Política de Privacidade</span>
            <span>•</span>
            <span>Termos de Serviço</span>
            <span>•</span>
            <span>Suporte</span>
          </div>
          <p className="text-xs text-muted-foreground/50">
            © 2024 Konver. Potencializando conversas com IA.
          </p>
        </div>
      </div>
    </div>
  );
}