import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NovoJogo from "./pages/NovoJogo";
import RankingClientes from "./pages/RankingClientes";
import Campanhas from "./pages/Campanhas";
import RelatorioFinanceiro from "./pages/RelatorioFinanceiro";
import CustosLucros from "./pages/CustosLucros";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import EmployeeAccess from "./pages/EmployeeAccess";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1">
          <header className="sticky top-0 z-50 h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center justify-between px-4 lg:px-6">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="mr-4" />
                <h2 className="text-lg font-semibold">Axe de Nessa - Sistema de Gestão</h2>
              </div>
              {user && (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4" />
                    <span>{user.email}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                </div>
              )}
            </div>
          </header>
          <div className="flex-1 p-4 lg:p-6">
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/employee" element={<ProtectedRoute><EmployeeAccess /></ProtectedRoute>} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/novo-jogo" element={<ProtectedRoute><NovoJogo /></ProtectedRoute>} />
              <Route path="/ranking" element={<ProtectedRoute><RankingClientes /></ProtectedRoute>} />
              <Route path="/campanhas" element={<ProtectedRoute><Campanhas /></ProtectedRoute>} />
              <Route path="/relatorio-financeiro" element={<ProtectedRoute><RelatorioFinanceiro /></ProtectedRoute>} />
            <Route path="/custos-lucros" element={<ProtectedRoute><CustosLucros /></ProtectedRoute>} />
            <Route path="/usuarios" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
