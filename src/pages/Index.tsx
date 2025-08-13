import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Bot, MessageSquare, Users, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import KonverLayout from "@/components/KonverLayout";
import KonverStats from "@/components/KonverStats";
import BotsList from "@/components/BotsList";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const stats = [
    {
      label: "Active Assistants",
      value: "12",
      icon: <Bot className="h-5 w-5" />,
      trend: { value: 8, isPositive: true },
      description: "2 new this week"
    },
    {
      label: "Total Conversations",
      value: "1,284",
      icon: <MessageSquare className="h-5 w-5" />,
      trend: { value: 12, isPositive: true },
      description: "Last 30 days"
    },
    {
      label: "Active Users",
      value: "856",
      icon: <Users className="h-5 w-5" />,
      trend: { value: 5, isPositive: true },
      description: "Currently online"
    },
    {
      label: "Performance",
      value: "98.2%",
      icon: <Zap className="h-5 w-5" />,
      trend: { value: 2, isPositive: true },
      description: "Response accuracy"
    }
  ];

  const actions = (
    <div className="flex items-center gap-4">
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Search your assistants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 w-72 h-11 bg-background/50 border-border hover:border-primary/30 focus:border-primary konver-focus text-sm backdrop-blur-sm"
        />
      </div>
      
      <Button
        className="konver-button-primary h-11 px-6 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
        onClick={() => navigate('/assistant/new')}
      >
        <Plus className="h-4 w-4 mr-2" />
        New Assistant
      </Button>
    </div>
  );

  return (
    <KonverLayout
      title={`Welcome back, ${user?.email?.split('@')[0] || 'there'}!`}
      subtitle="Transform your workflow with intelligent AI assistants. Build, deploy, and scale conversational experiences that drive results."
      actions={actions}
    >
      <div className="space-y-12">
        {/* Enhanced Stats Overview */}
        <section className="konver-animate-in">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-3">
              <div className="w-1 h-6 konver-gradient-primary rounded-full"></div>
              Dashboard Overview
            </h2>
            <p className="text-muted-foreground/90">
              Monitor your AI assistant performance and engagement metrics
            </p>
          </div>
          <KonverStats stats={stats} />
        </section>

        {/* Enhanced Main Content */}
        <section className="space-y-8 konver-animate-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground flex items-center gap-3">
                <div className="w-1 h-7 konver-gradient-accent rounded-full"></div>
                Your AI Assistants
              </h2>
              <p className="text-base text-muted-foreground/90 leading-relaxed max-w-2xl">
                Create powerful conversational AI assistants tailored to your specific needs. Each assistant can be customized with unique personalities, knowledge bases, and capabilities.
              </p>
            </div>
          </div>

          {/* Enhanced Assistants List */}
          <div className="konver-animate-in" style={{ animationDelay: '300ms' }}>
            <BotsList searchQuery={searchQuery} />
          </div>
        </section>

        {/* Quick Actions Section */}
        {!searchQuery && (
          <section className="konver-animate-in" style={{ animationDelay: '400ms' }}>
            <div className="konver-card-feature p-8 text-center">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 konver-gradient-hero rounded-2xl flex items-center justify-center shadow-lg konver-animate-float">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-semibold konver-text-gradient">
                    Ready to build something amazing?
                  </h3>
                  <p className="text-muted-foreground/90 text-lg leading-relaxed">
                    Start creating intelligent assistants that understand context, learn from interactions, and deliver exceptional user experiences.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    onClick={() => navigate('/assistant/new')}
                    className="konver-button-hero"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create New Assistant
                  </Button>
                  <Button
                    variant="ghost"
                    className="konver-hover-subtle text-muted-foreground hover:text-foreground"
                  >
                    Browse Templates
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </KonverLayout>
  );
};

export default Index;