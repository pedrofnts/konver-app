import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import KonverLayout from "@/components/KonverLayout";
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  Download, 
  CheckCircle, 
  AlertCircle,
  Crown,
  Zap,
  Users,
  MessageSquare,
  FileText,
  ExternalLink
} from "lucide-react";

export default function Subscription() {
  const { user } = useAuth();
  
  // Mock data - substituir por dados reais no futuro
  const subscriptionData = {
    plan: "Pro",
    status: "active",
    currentPeriodStart: "2024-01-01",
    currentPeriodEnd: "2024-02-01",
    price: 249.90,
    currency: "BRL",
    assistants: {
      used: 8,
      limit: 25
    },
    conversations: {
      used: 1250,
      limit: 5000
    },
    storage: {
      used: 2.3,
      limit: 10
    }
  };

  const mockInvoices = [
    {
      id: "inv_001",
      date: "2024-01-01",
      amount: 249.90,
      status: "paid",
      downloadUrl: "#"
    },
    {
      id: "inv_002", 
      date: "2023-12-01",
      amount: 249.90,
      status: "paid",
      downloadUrl: "#"
    },
    {
      id: "inv_003",
      date: "2023-11-01", 
      amount: 249.90,
      status: "paid",
      downloadUrl: "#"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ativo
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Cancelado
          </Badge>
        );
      case "past_due":
        return (
          <Badge variant="secondary">
            <AlertCircle className="h-3 w-3 mr-1" />
            Em Atraso
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Desconhecido
          </Badge>
        );
    }
  };

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-xs">
            Pago
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="text-xs">
            Pendente
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="text-xs">
            Falhou
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            Desconhecido
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency === 'BRL' ? 'BRL' : 'USD',
    }).format(amount);
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  return (
    <KonverLayout 
      title="Assinatura" 
      subtitle="Gerencie sua assinatura e faturas"
      breadcrumbs={[
        { label: "Assinatura" }
      ]}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Status da Assinatura */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="konver-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Plano Atual
                </div>
                {getStatusBadge(subscriptionData.status)}
              </CardTitle>
              <CardDescription>
                Informações da sua assinatura atual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Plano</p>
                  <p className="text-2xl font-bold text-primary">{subscriptionData.plan}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Valor Mensal</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(subscriptionData.price, subscriptionData.currency)}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Período Atual</p>
                  <p className="font-medium">
                    {formatDate(subscriptionData.currentPeriodStart)} - {formatDate(subscriptionData.currentPeriodEnd)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Próxima Cobrança</p>
                  <p className="font-medium">
                    {formatDate(subscriptionData.currentPeriodEnd)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="konver-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline">
                <CreditCard className="h-4 w-4 mr-2" />
                Alterar Plano
              </Button>
              <Button className="w-full" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Histórico de Pagamentos
              </Button>
              <Button className="w-full" variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Portal do Cliente
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Uso dos Recursos */}
        <Card className="konver-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Uso dos Recursos
            </CardTitle>
            <CardDescription>
              Acompanhe o uso dos recursos do seu plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Assistentes</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {subscriptionData.assistants.used}/{subscriptionData.assistants.limit}
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(subscriptionData.assistants.used, subscriptionData.assistants.limit)} 
                  className="h-2"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Conversas</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {subscriptionData.conversations.used.toLocaleString()}/{subscriptionData.conversations.limit.toLocaleString()}
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(subscriptionData.conversations.used, subscriptionData.conversations.limit)} 
                  className="h-2"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Armazenamento</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {subscriptionData.storage.used}GB/{subscriptionData.storage.limit}GB
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(subscriptionData.storage.used, subscriptionData.storage.limit)} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Faturas */}
        <Card className="konver-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Histórico de Faturas
            </CardTitle>
            <CardDescription>
              Últimas faturas e comprovantes de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Fatura</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{formatDate(invoice.date)}</TableCell>
                    <TableCell className="font-mono text-sm">{invoice.id}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(invoice.amount, subscriptionData.currency)}
                    </TableCell>
                    <TableCell>
                      {getInvoiceStatusBadge(invoice.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </KonverLayout>
  );
}