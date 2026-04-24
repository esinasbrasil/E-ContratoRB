
import React from 'react';
import { ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'light' | 'dark';
}

const Logo: React.FC<LogoProps> = ({ className = "", showText = true, variant = 'dark' }) => {
  const textColor = variant === 'light' ? 'text-white' : 'text-[#064e3b]';
  const subTextColor = variant === 'light' ? 'text-emerald-300' : 'text-emerald-600';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative shrink-0">
        <div className="w-12 h-12 bg-[#064e3b] rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-950/20 rotate-3">
          <FileText className="text-white/20 absolute inset-0 m-auto" size={32} />
          <div className="relative bg-emerald-500 rounded-xl p-1.5 shadow-inner">
            <ShieldCheck className="text-white" size={24} />
          </div>
        </div>
        <div className="absolute -top-1 -left-1 bg-white rounded-full p-0.5 shadow-sm">
          <CheckCircle2 className="text-emerald-500" size={16} fill="white" />
        </div>
      </div>
      
      {showText && (
        <div className="flex flex-col leading-tight whitespace-nowrap min-w-0">
          <span className={`text-2xl font-black tracking-tighter ${textColor} uppercase block px-0`}>
            E-Contrato
          </span>
          <div className="flex items-center gap-1.5 -mt-0.5">
            <div className={`h-[1px] w-3 ${variant === 'light' ? 'bg-emerald-400' : 'bg-emerald-600'} opacity-50`}></div>
            <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${subTextColor}`}>
              Do Grupo RB
            </span>
            <div className={`h-[1px] w-3 ${variant === 'light' ? 'bg-emerald-400' : 'bg-emerald-600'} opacity-50`}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logo;
