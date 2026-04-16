
import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { Loader2, AlertCircle, ShieldCheck, Globe, Settings, ArrowRight, Mail, Lock } from 'lucide-react';

interface LoginPageProps {
  onDemoLogin?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onDemoLogin }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('fecampos120@gmail.com');
  const [password, setPassword] = useState('@adm2026');
  const [error, setError] = useState<{message: string, isProvider: boolean} | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Erro Firebase Auth:", err);
      setError({
        message: "Erro ao conectar com o Google. Verifique se o login com Google está ativado no Firebase Console.",
        isProvider: false
      });
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error("Erro Firebase Auth Email:", err);
      let message = "Erro ao entrar. Verifique suas credenciais.";
      if (err.code === 'auth/operation-not-allowed') {
        message = "O login por e-mail/senha não está ativado no Firebase Console. Vá em Authentication > Sign-in method e ative 'E-mail/senha'.";
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = "E-mail ou senha incorretos. Certifique-se de que o usuário foi criado no Firebase Console.";
      }
      setError({ message, isProvider: false });
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
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4 mb-8">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-emerald-500 focus:outline-none transition-all text-sm font-medium"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-emerald-500 focus:outline-none transition-all text-sm font-medium"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Entrar com E-mail"}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="h-[1px] bg-slate-100 flex-1"></div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Ou acesse via</span>
            <div className="h-[1px] bg-slate-100 flex-1"></div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-4 py-4 px-6 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 hover:border-emerald-200 focus:outline-none transition-all disabled:opacity-50"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Google Login
            </button>

            {onDemoLogin && (
              <button
                onClick={onDemoLogin}
                className="w-full py-4 px-6 rounded-2xl text-sm font-black text-slate-400 hover:text-slate-600 transition-all flex items-center justify-center gap-2 group"
              >
                Modo Offline
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-50">
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">GRUPO RB • {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
