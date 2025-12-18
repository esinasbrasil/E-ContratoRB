
import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { Lock, Loader2, AlertCircle, ShieldCheck, Globe, ExternalLink } from 'lucide-react';

interface LoginPageProps {
  onDemoLogin?: () => void;
}

interface AuthErrorState {
  message: string;
  isProviderError: boolean;
}

const LoginPage: React.FC<LoginPageProps> = ({ onDemoLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthErrorState | null>(null);

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured) {
      setError({ message: "O sistema ainda não está conectado à nuvem. Verifique as chaves de configuração.", isProviderError: false });
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (authError) throw authError;
    } catch (err: any) {
      console.error("Erro de autenticação:", err);
      const msg = typeof err === 'string' ? err : (err?.message || 'Erro inesperado ao conectar.');
      
      if (msg.includes("provider is not enabled")) {
        setError({ 
          message: "O login via Google não está ativado no seu painel Supabase. Vá em Authentication > Providers > Google e ative-o.", 
          isProviderError: true 
        });
      } else {
        setError({ message: msg, isProviderError: false });
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100 text-center relative overflow-hidden">
        
        {/* Status Badge */}
        <div className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
           <Globe size={12} className="text-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Cloud Active</span>
        </div>

        <div className="bg-emerald-50 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner rotate-3 transition-transform hover:rotate-0">
          <ShieldCheck className="text-emerald-600" size={48} />
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">Portal Corporativo</h1>
        <p className="text-slate-500 mb-10 text-sm font-medium">Contratos e Homologação • Grupo RB</p>

        {error && (
          <div className={`p-4 rounded-2xl mb-8 text-xs flex flex-col text-left border animate-shake ${error.isProviderError ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-red-50 text-red-700 border-red-100'}`}>
            <div className="flex items-start">
              <AlertCircle size={18} className="mr-3 mt-0.5 flex-shrink-0" />
              <span className="font-medium">{error.message}</span>
            </div>
            {error.isProviderError && (
              <a 
                href="https://supabase.com/dashboard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-3 ml-7 flex items-center gap-1 font-bold underline hover:text-amber-900"
              >
                Abrir Painel Supabase <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 py-4 px-6 border border-slate-200 rounded-2xl shadow-sm text-base font-bold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin text-emerald-600" size={24} />
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                Entrar com Gmail
              </>
            )}
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-slate-400 font-medium">ou</span></div>
          </div>

          {onDemoLogin && (
            <button
              onClick={onDemoLogin}
              className="w-full py-4 px-6 rounded-2xl text-sm font-black text-white bg-slate-800 hover:bg-slate-900 transition-all shadow-lg hover:shadow-slate-200 flex items-center justify-center gap-2"
            >
              <ShieldCheck size={18} className="text-emerald-400" />
              Acesso de Demonstração
            </button>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Ambiente Seguro e Monitorado
            </p>
          </div>
          <span className="text-[9px] text-slate-300 font-medium">GRUPO RESINAS BRASIL © {new Date().getFullYear()}</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
