
// v2.3 - Final Label Alignment with Vercel
import React from 'react';
import { FileText, HardHat, ClipboardCheck, ArrowRight, History } from 'lucide-react';

interface LandingPageProps {
  onSelectModule: (module: 'contracts' | 'engineering' | 'compliance' | 'procedures') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectModule }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-black text-[#064e3b] mb-4 tracking-tighter">Portal Corporativo GRUPORB</h1>
        <p className="text-lg text-slate-500 font-medium tracking-tight">Selecione o módulo de acesso</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl w-full">
        {/* Prazos & Fluxo */}
        <div 
          onClick={() => onSelectModule('procedures')}
          className="bg-white rounded-[2.5rem] shadow-2xl p-10 cursor-pointer transform transition-all hover:-translate-y-2 hover:shadow-emerald-900/10 border border-slate-100 group flex flex-col items-start"
        >
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-slate-900 transition-all duration-300">
            <History size={36} className="text-slate-900 group-hover:text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Prazos & Fluxo</h2>
          <p className="text-slate-500 mb-8 text-sm font-medium leading-relaxed">
            Acompanhamento de 11 etapas, controle de lead time, SLAs e identificação de gargalos.
          </p>
          <div className="mt-auto flex items-center text-slate-900 font-black text-sm uppercase tracking-widest group-hover:translate-x-2 transition-transform">
            Ver Fluxo <ArrowRight size={18} className="ml-2" />
          </div>
        </div>

        {/* Contratos */}
        <div 
          onClick={() => onSelectModule('contracts')}
          className="bg-white rounded-[2.5rem] shadow-2xl p-10 cursor-pointer transform transition-all hover:-translate-y-2 hover:shadow-emerald-900/10 border-t-4 border-emerald-500 group flex flex-col items-start"
        >
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-emerald-600 transition-all duration-300">
            <FileText size={36} className="text-emerald-600 group-hover:text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Gestão de Contratos</h2>
          <p className="text-slate-500 mb-8 text-sm font-medium leading-relaxed">
            Homologação de fornecedores, geração de minutas, gestão de unidades e dashboard administrativo.
          </p>
          <div className="mt-auto flex items-center text-emerald-600 font-black text-sm uppercase tracking-widest group-hover:translate-x-2 transition-transform">
            Acessar Painel <ArrowRight size={18} className="ml-2" />
          </div>
        </div>

        {/* Engenharia */}
        <div 
          onClick={() => onSelectModule('engineering')}
          className="bg-white rounded-[2.5rem] shadow-2xl p-10 cursor-pointer transform transition-all hover:-translate-y-2 hover:shadow-blue-900/10 border-t-4 border-blue-500 group flex flex-col items-start"
        >
          <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-blue-600 transition-all duration-300">
            <HardHat size={36} className="text-blue-600 group-hover:text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Engenharia e Projetos</h2>
          <p className="text-slate-500 mb-8 text-sm font-medium leading-relaxed">
            Cadastro de projetos (CAPEX/OPEX), escopo técnico, upload de plantas e checklist de NRs obrigatórias.
          </p>
          <div className="mt-auto flex items-center text-blue-600 font-black text-sm uppercase tracking-widest group-hover:translate-x-2 transition-transform">
            Acessar Projetos <ArrowRight size={18} className="ml-2" />
          </div>
        </div>

        {/* Ficha Fornecedor */}
        <div 
          onClick={() => onSelectModule('compliance')}
          className="bg-white rounded-[2.5rem] shadow-2xl p-10 cursor-pointer transform transition-all hover:-translate-y-2 hover:shadow-orange-900/10 border-t-4 border-orange-500 group flex flex-col items-start"
        >
          <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-orange-600 transition-all duration-300">
            <ClipboardCheck size={36} className="text-orange-600 group-hover:text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Segurança e RH</h2>
          <p className="text-slate-500 mb-8 text-sm font-medium leading-relaxed">
            Ficha de requisitos para fornecedores. Checklist de documentos de empresa e colaboradores (PGR, ASO, NRs).
          </p>
          <div className="mt-auto flex items-center text-orange-600 font-black text-sm uppercase tracking-widest group-hover:translate-x-2 transition-transform">
            Gerar Ficha <ArrowRight size={18} className="ml-2" />
          </div>
        </div>
      </div>
      
      <div className="mt-20 text-slate-400 text-[10px] font-black uppercase tracking-widest border-t border-slate-200 pt-8 w-full text-center">
        &copy; {new Date().getFullYear()} Grupo Resinas Brasil • EcoContract System v2.3
      </div>
    </div>
  );
};

export default LandingPage;
