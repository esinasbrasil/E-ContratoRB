
import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { Loader2, AlertCircle, ShieldCheck, Globe, ExternalLink, Settings, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onDemoLogin?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onDemoLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{message: string, isProvider: boolean} | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fix: Added type assertion to supabase.auth to resolve signInWithOAuth property error.
      const { error: authError } = await (supabase.auth as any).signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin, // Garante que volta para a raiz do site
        }
      });
      
      if (authError) throw authError;
    } catch (err: any) {
      console.error("Erro Supabase:", err);
      const msg = err?.message || String(err);
      
      if (msg.includes("provider is not enabled")) {
        setError({
          message: "O provedor Google não foi ativado no painel do Supabase.",
          isProvider: true
        });
      } else {
        setError({
          message: "Erro ao conectar com o Google. Verifique suas credenciais.",
          isProvider: false
        });
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans selection:bg-emerald-500 selection:text-white">
      <div className="bg-white p-10 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] w-full max-w-md border border-slate-100 text-center relative overflow-hidden">
        
        {/* Glow Decor */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50"></div>

        <div className="relative">
          <div className="bg-emerald-600 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-200 rotate-6 hover:rotate-0 transition-all duration-500">
            <ShieldCheck className="text-white" size={40} />
          </div>
          
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">Portal RB</h1>
          <p className="text-slate-500 mb-10 text-sm font-medium">Contratos & Homologação</p>

          {error && (
            <div className="mb-8 p-5 rounded-3xl bg-amber-50 border border-amber-100 text-left animate-in fade-in slide-in-from-top-2">
              <div className="flex gap-3 text-amber-800">
                <AlertCircle className="shrink-0" size={20} />
                <div>
                  <p className="text-sm font-bold">Ação Necessária</p>
                  <p className="text-xs leading-relaxed mt-1">{error.message}</p>
                </div>
              </div>
              
              {error.isProvider && (
                <div className="mt-4 space-y-2">
                  <a 
                    href="https://supabase.com/dashboard/project/vuhkbbxqzhosmbztjten/auth/providers" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-amber-600 text-white rounded-2xl text-xs font-black hover:bg-amber-700 transition-colors shadow-lg shadow-amber-200"
                  >
                    <Settings size={14} /> ATIVAR NO SUPABASE
                  </a>
                  <p className="text-[10px] text-amber-600 text-center italic">
                    Lembre-se de salvar após ativar!
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-4 py-5 px-6 border-2 border-slate-100 rounded-[2rem] text-base font-bold text-slate-700 bg-white hover:bg-slate-50 hover:border-emerald-200 focus:outline-none focus:ring-4 focus:ring-emerald-50 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin text-emerald-600" size={24} />
              ) : (
                <>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                  Entrar com Google
                </>
              )}
            </button>

            <div className="flex items-center gap-4 my-6">
              <div className="h-[1px] bg-slate-100 flex-1"></div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Acesso Rápido</span>
              <div className="h-[1px] bg-slate-100 flex-1"></div>
            </div>

            {onDemoLogin && (
              <button
                onClick={onDemoLogin}
                className="w-full py-5 px-6 rounded-[2rem] text-sm font-black text-white bg-slate-900 hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 group"
              >
                Modo Offline
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-50">
            <div className="flex items-center justify-center gap-2 text-emerald-500 mb-1">
              <Globe size={12} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Cloud Monitoring Active</span>
            </div>
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">GRUPO RB • {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
