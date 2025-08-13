import { ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { 
  MessageSquare, 
  Settings, 
  LogOut, 
  User,
  Home,
  ChevronRight
} from "lucide-react";
import { AssistantData } from "@/types/assistant";

interface KonverLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  showSidebar?: boolean;
  assistant?: AssistantData;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export default function KonverLayout({ 
  children, 
  title, 
  subtitle, 
  actions,
  showSidebar = true,
  assistant,
  breadcrumbs 
}: KonverLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-md ">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foreground">
                konver
              </h1>
            </div>
            
            {/* Minimal Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <Home className="h-4 w-4" />
                {breadcrumbs.map((breadcrumb, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4" />
                    {breadcrumb.href ? (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(breadcrumb.href!)}
                        className="text-muted-foreground hover:text-foreground font-medium p-0 h-auto"
                      >
                        {breadcrumb.label}
                      </Button>
                    ) : (
                      <span className="text-foreground font-medium">
                        {breadcrumb.label}
                      </span>
                    )}
                  </div>
                ))}
              </nav>
            )}
            
            {!breadcrumbs && showSidebar && (
              <nav className="hidden md:flex items-center gap-6">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/')}
                  className="hover:bg-accent/10 text-foreground/80 hover:text-foreground font-medium"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </nav>
            )}
          </div>

          {/* Actions & User Menu */}
          <div className="flex items-center gap-4">
            {actions}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative h-10 w-10 rounded-full hover:bg-accent/10">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-white text-sm font-semibold shadow-md">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent className="w-64 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border/50 shadow-xl" align="end" forceMount>
                <div className="flex items-center justify-start gap-3 p-4 bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border/50">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-white text-sm font-semibold">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="text-sm font-semibold text-foreground">
                      {user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                </div>
                
                <div className="p-2">
                  <DropdownMenuItem className="hover:bg-accent/10 cursor-pointer rounded-lg mb-1">
                    <User className="mr-3 h-4 w-4 text-primary" />
                    <span className="font-medium">Profile</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem className="hover:bg-accent/10 cursor-pointer rounded-lg mb-1">
                    <Settings className="mr-3 h-4 w-4 text-primary" />
                    <span className="font-medium">Settings</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="my-2" />
                  
                  <DropdownMenuItem 
                    className="hover:bg-accent/10 cursor-pointer text-destructive focus:text-destructive rounded-lg"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="font-medium">Sign out</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {(title || subtitle) && (
          <div className="border-b border-border/50 bg-gradient-to-r from-background via-card/30 to-background relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-50"></div>
            <div className="container py-8 relative z-10">
              <div className="flex items-center justify-between">
                <div className="space-y-2 konver-animate-in">
                  {title && (
                    <h2 className="text-3xl font-bold tracking-tight text-foreground text-foreground">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="text-base text-muted-foreground/90 max-w-2xl leading-relaxed">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="container py-8 konver-animate-in">
          {children}
        </div>
      </main>
    </div>
  );
}