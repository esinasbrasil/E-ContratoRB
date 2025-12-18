
import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { Lock, Loader2, AlertCircle, ShieldCheck, Globe } from 'lucide-react';

interface LoginPageProps {
  onDemoLogin?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onDemoLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured) {
      setError("O sistema ainda não está conectado à nuvem. Verifique as chaves de configuração.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar com o Google. Certifique-se de que o Google Auth está ativado no Supabase.');
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
          <div className="p-4 rounded-2xl mb-8 text-xs flex items-start bg-red-50 text-red-700 text-left border border-red-100 animate-shake">
            <AlertCircle size={18} className="mr-3 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
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

          {onDemoLogin && (
            <button
              onClick={onDemoLogin}
              className="w-full py-3 px-6 rounded-2xl text-xs font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors uppercase tracking-widest"
            >
              Acesso Rápido (Demonstração)
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
