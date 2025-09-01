import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import Index from "./pages/Index";
import NovoJogo from "./pages/NovoJogo";
import RankingClientes from "./pages/RankingClientes";
import Campanhas from "./pages/Campanhas";
import RelatorioFinanceiro from "./pages/RelatorioFinanceiro";
import CustosLucros from "./pages/CustosLucros";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <main className="flex-1">
              <header className="sticky top-0 z-50 h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-14 items-center px-4 lg:px-6">
                  <SidebarTrigger className="mr-4" />
                  <div className="flex items-center space-x-4">
                    <h2 className="text-lg font-semibold">Axe de Nessa - Sistema de Gestão</h2>
                  </div>
                </div>
              </header>
              <div className="flex-1 p-4 lg:p-6">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/novo-jogo" element={<NovoJogo />} />
                  <Route path="/ranking" element={<RankingClientes />} />
                  <Route path="/campanhas" element={<Campanhas />} />
                  <Route path="/relatorio-financeiro" element={<RelatorioFinanceiro />} />
                  <Route path="/custos-lucros" element={<CustosLucros />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </main>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
