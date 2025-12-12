
import React from 'react';
import { FileText, HardHat, ClipboardCheck, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onSelectModule: (module: 'contracts' | 'engineering' | 'compliance') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectModule }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-primary-900 mb-4">Portal Corporativo GRUPORB</h1>
        <p className="text-lg text-gray-600">Selecione o módulo de acesso</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        {/* Contratos */}
        <div 
          onClick={() => onSelectModule('contracts')}
          className="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform transition-all hover:-translate-y-2 hover:shadow-2xl border-t-4 border-emerald-500 group"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors">
            <FileText size={32} className="text-emerald-600 group-hover:text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Gestão de Contratos</h2>
          <p className="text-gray-500 mb-6">
            Homologação de fornecedores, geração de minutas, gestão de unidades e dashboard administrativo.
          </p>
          <div className="flex items-center text-emerald-600 font-semibold group-hover:translate-x-2 transition-transform">
            Acessar Painel <ArrowRight size={20} className="ml-2" />
          </div>
        </div>

        {/* Engenharia */}
        <div 
          onClick={() => onSelectModule('engineering')}
          className="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform transition-all hover:-translate-y-2 hover:shadow-2xl border-t-4 border-blue-500 group"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
            <HardHat size={32} className="text-blue-600 group-hover:text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Engenharia & Projetos</h2>
          <p className="text-gray-500 mb-6">
            Cadastro de projetos (CAPEX/OPEX), escopo técnico, upload de plantas e checklist de NRs obrigatórias.
          </p>
          <div className="flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform">
            Acessar Projetos <ArrowRight size={20} className="ml-2" />
          </div>
        </div>

        {/* Ficha Fornecedor */}
        <div 
          onClick={() => onSelectModule('compliance')}
          className="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform transition-all hover:-translate-y-2 hover:shadow-2xl border-t-4 border-orange-500 group"
        >
          <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-600 transition-colors">
            <ClipboardCheck size={32} className="text-orange-600 group-hover:text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Segurança & RH</h2>
          <p className="text-gray-500 mb-6">
            Ficha de requisitos para fornecedores. Checklist de documentos de empresa e colaboradores (PGR, ASO, NRs).
          </p>
          <div className="flex items-center text-orange-600 font-semibold group-hover:translate-x-2 transition-transform">
            Gerar Ficha <ArrowRight size={20} className="ml-2" />
          </div>
        </div>
      </div>
      
      <div className="mt-16 text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Grupo Resinas Brasil - EcoContract System
      </div>
    </div>
  );
};

export default LandingPage;
