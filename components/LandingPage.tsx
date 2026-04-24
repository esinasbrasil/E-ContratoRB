
// v2.4 - Final Label Alignment with Logo
import React from 'react';
import { FileText, HardHat, ClipboardCheck, ArrowRight, History, ScanFace, Globe } from 'lucide-react';
import Logo from './Logo';

import { UserRole } from '../types';

interface LandingPageProps {
  onSelectModule: (module: 'contracts' | 'engineering' | 'compliance' | 'procedures' | 'portaria' | 'portal') => void;
  userRole?: UserRole;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectModule, userRole = 'admin' }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="text-center mb-16 flex flex-col items-center">
        <Logo variant="dark" showText={true} className="h-16 mb-6" />
        <h1 className="text-xl font-bold text-slate-400 uppercase tracking-[0.3em] opacity-50">Portal Corporativo</h1>
        {userRole !== 'admin' && (
          <div className="mt-2 px-4 py-1.5 bg-slate-200 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
            Acesso Restrito: {userRole}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl w-full">
        {/* Prazos e Fluxo */}
        {userRole === 'admin' && (
          <div 
            onClick={() => onSelectModule('procedures')}
            className="bg-white rounded-[3rem] shadow-2xl p-10 cursor-pointer transform transition-all hover:-translate-y-2 hover:shadow-emerald-900/10 border border-slate-100 group flex flex-col items-start"
          >
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-8 group-hover:bg-slate-900 transition-all duration-300">
              <History size={36} className="text-slate-900 group-hover:text-white" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Prazos e Fluxo</h2>
            <p className="text-slate-500 mb-8 text-sm font-medium leading-relaxed tracking-tight flex-1">
              Acompanhamento de 11 etapas, controle de lead time, SLAs e identificação de gargalos no processo.
            </p>
            <div className="mt-auto flex items-center text-slate-900 font-black text-xs uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
              Ver Fluxo <ArrowRight size={16} className="ml-2" strokeWidth={3} />
            </div>
          </div>
        )}

        {/* Contratos */}
        {userRole === 'admin' && (
          <div 
            onClick={() => onSelectModule('contracts')}
            className="bg-white rounded-[3rem] shadow-2xl p-10 cursor-pointer transform transition-all hover:-translate-y-2 hover:shadow-emerald-900/10 border-t-8 border-emerald-500 group flex flex-col items-start"
          >
            <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-8 group-hover:bg-emerald-600 transition-all duration-300">
              <FileText size={36} className="text-emerald-600 group-hover:text-white" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Gestão de Contratos</h2>
            <p className="text-slate-500 mb-8 text-sm font-medium leading-relaxed tracking-tight flex-1">
              Homologação, geração de minutas, gestão de unidades e dashboard administrativo estratégico.
            </p>
            <div className="mt-auto flex items-center text-emerald-600 font-black text-xs uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
              Acessar Painel <ArrowRight size={16} className="ml-2" strokeWidth={3} />
            </div>
          </div>
        )}

        {/* Engenharia */}
        {userRole === 'admin' && (
          <div 
            onClick={() => onSelectModule('engineering')}
            className="bg-white rounded-[3rem] shadow-2xl p-10 cursor-pointer transform transition-all hover:-translate-y-2 hover:shadow-blue-900/10 border-t-8 border-blue-500 group flex flex-col items-start"
          >
            <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-8 group-hover:bg-blue-600 transition-all duration-300">
              <HardHat size={36} className="text-blue-600 group-hover:text-white" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Engenharia e Projetos</h2>
            <p className="text-slate-500 mb-8 text-sm font-medium leading-relaxed tracking-tight flex-1">
              Cadastro de projetos CAPEX/OPEX, escopo técnico, upload de plantas e checklist de NRs obrigatórias.
            </p>
            <div className="mt-auto flex items-center text-blue-600 font-black text-xs uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
              Acessar Projetos <ArrowRight size={16} className="ml-2" strokeWidth={3} />
            </div>
          </div>
        )}

        {/* Ficha Fornecedor */}
        {userRole === 'admin' && (
          <div 
            onClick={() => onSelectModule('compliance')}
            className="bg-white rounded-[3rem] shadow-2xl p-10 cursor-pointer transform transition-all hover:-translate-y-2 hover:shadow-orange-900/10 border border-slate-100 group flex flex-col items-start"
          >
            <div className="w-20 h-20 bg-[#FFF7ED] rounded-[2rem] flex items-center justify-center mb-8 group-hover:bg-orange-600 transition-all duration-300">
              <ClipboardCheck size={36} className="text-orange-500 group-hover:text-white" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Segurança e RH</h2>
            <p className="text-slate-500 mb-8 text-sm font-medium leading-relaxed tracking-tight flex-1">
              Classificação p/ Carta Convite (RFP) e Homologação de Fornecedores (Docs Empresa/Colaborador).
            </p>
            <div className="mt-auto flex items-center text-orange-600 font-black text-xs uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
              Gestão Requisitos <ArrowRight size={16} className="ml-2" strokeWidth={3} />
            </div>
          </div>
        )}

        {/* Portaria */}
        {(userRole === 'admin' || userRole === 'portaria') && (
          <div 
            onClick={() => onSelectModule('portaria')}
            className="bg-slate-900 rounded-[3rem] shadow-2xl p-10 cursor-pointer transform transition-all hover:-translate-y-2 hover:shadow-indigo-900/30 border border-slate-800 group flex flex-col items-start text-white"
          >
            <div className="w-20 h-20 bg-indigo-500/10 rounded-[2rem] flex items-center justify-center mb-8 group-hover:bg-indigo-500 transition-all duration-300">
              <ScanFace size={36} className="text-indigo-400 group-hover:text-white" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-black text-white mb-4 tracking-tight">Controle de Acesso</h2>
            <p className="text-slate-400 mb-8 text-sm font-medium leading-relaxed tracking-tight flex-1">
              Consulta rápida de conformidade por CPF/CNPJ. Controle de acesso em campo e validação de documentos.
            </p>
            <div className="mt-auto flex items-center text-indigo-400 font-black text-xs uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
              Acessar Consulta <ArrowRight size={16} className="ml-2" strokeWidth={3} />
            </div>
          </div>
        )}

        {/* Portal Fornecedor */}
        {(userRole === 'admin' || userRole === 'fornecedor') && (
          <div 
            onClick={() => onSelectModule('portal')}
            className="bg-emerald-950 rounded-[3rem] shadow-2xl p-10 cursor-pointer transform transition-all hover:-translate-y-2 hover:shadow-emerald-900/30 border border-emerald-900 group flex flex-col items-start text-white"
          >
            <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mb-8 group-hover:bg-emerald-500 transition-all duration-300">
              <Globe size={36} className="text-emerald-400 group-hover:text-white" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-black text-white mb-4 tracking-tight">Portal Fornecedor</h2>
            <p className="text-emerald-200/60 mb-8 text-sm font-medium leading-relaxed tracking-tight flex-1">
              Espaço para o fornecedor atualizar documentos e dados cadastrais. Gestão de validade e compliance.
            </p>
            <div className="mt-auto flex items-center text-emerald-400 font-black text-xs uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
              Acessar Portal <ArrowRight size={16} className="ml-2" strokeWidth={3} />
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-20 text-slate-400 text-[10px] font-black uppercase tracking-widest border-t border-slate-200 pt-8 w-full text-center">
        &copy; {new Date().getFullYear()} Grupo Resinas Brasil • EcoContract System v2.3
      </div>
    </div>
  );
};

export default LandingPage;
