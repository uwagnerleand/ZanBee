import React, { useState } from "react";
import { useLocation } from "wouter";
import { Lock, ArrowRight, Eye, EyeOff, Store } from "lucide-react";
import { toast } from "sonner";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const LOGO = "./images/zanbee-logo.png";
const BEE = "./images/zanbee-bee-icon.png";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated } = useAdminAuth();
  const [, setLocation] = useLocation();

  // If already authenticated, redirect to /admin
  React.useEffect(() => {
    if (isAuthenticated) {
      setLocation("/admin");
    }
  }, [isAuthenticated, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error("Por favor, digite a senha de administrador.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(password);
      if (res.success) {
        toast.success("Acesso autorizado! Entrando no painel...");
        setLocation("/admin");
      } else {
        toast.error(res.message || "Senha incorreta. Tente novamente.");
      }
    } catch {
      toast.error("Erro ao tentar conectar ao servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffaf2] text-[#4b2b1d] flex flex-col justify-between selection:bg-[#f4b72b]/40">
      <div className="container py-6 flex items-center justify-between">
        <a href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-[#8b6a52] hover:text-[#4b2b1d] transition-colors">
          <Store size={16} /> Voltar para a Vitrine Pública
        </a>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#fffdf9] border border-[#eadbc7] rounded-3xl p-8 sm:p-10 shadow-xl shadow-[#4b2b1d]/5 relative overflow-hidden">
          {/* Subtle honey accent border on top */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#f4b72b] via-[#e88491] to-[#f4b72b]" />

          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src={LOGO} alt="ZanBee" className="h-12 object-contain" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fce5df] text-[#c53030] text-[11px] font-bold uppercase tracking-wider mb-3">
              <Lock size={12} /> Área Restrita
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#4b2b1d]">
              Painel do Administrador
            </h1>
            <p className="text-xs sm:text-sm text-[#856c5a] mt-2">
              Digite a senha de gestão para gerenciar produtos, estoque, valores e visibilidade.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6d4b39] mb-2">
                Senha de Acesso
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha..."
                  autoFocus
                  disabled={isSubmitting}
                  className="w-full h-12 px-4 pr-12 rounded-xl bg-[#fffaf2] border border-[#eadbc7] text-sm text-[#4b2b1d] placeholder:text-[#b8a28e] focus:outline-none focus:border-[#f4b72b] focus:ring-2 focus:ring-[#f4b72b]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#856c5a] hover:text-[#4b2b1d] p-1 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-[#f4b72b] hover:bg-[#ebae21] text-[#4b2b1d] font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#f4b72b]/25 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Verificando...</span>
              ) : (
                <>
                  <span>Entrar no Painel</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#eadbc7]/60 flex items-center justify-center gap-2 text-xs text-[#856c5a]">
            <img src={BEE} alt="" className="w-5 h-5 object-contain" />
            <span>ZanBee Moda Infantil • Óbidos – PA</span>
          </div>
        </div>
      </div>

      <footer className="py-4 text-center text-[11px] text-[#af9a86]">
        Acesso exclusivo da gerência • Não compartilhe a senha
      </footer>
    </div>
  );
}
