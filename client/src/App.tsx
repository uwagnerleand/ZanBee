/* ZanBee — Catálogo de Vendas com Painel de Administração Integrado */
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AdminAuthProvider, useAdminAuth } from "./contexts/AdminAuthContext";
import Home from "./pages/Home";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLogin from "./pages/admin/AdminLogin";
import NotFound from "./pages/NotFound";

function AdminRoute() {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fffaf2] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#f4b72b] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-[#856c5a] uppercase tracking-wider">
            Carregando painel...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return <AdminDashboard />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AdminAuthProvider>
          <TooltipProvider>
            <Toaster position="top-center" richColors />
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/admin/login" component={AdminLogin} />
              <Route path="/admin" component={AdminRoute} />
              <Route component={NotFound} />
            </Switch>
          </TooltipProvider>
        </AdminAuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
