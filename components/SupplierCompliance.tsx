
import React, { useState } from 'react';
import { ArrowLeft, Printer, CheckCircle, ClipboardCheck, Building2, Users } from 'lucide-react';

interface SupplierComplianceProps {
  onBack: () => void;
}

const companyDocs = [
  'PGR – Programa de Gerenciamento de Riscos',
  'PCMSO – Programa de Controle Médico de Saúde Ocupacional',
  'ALVARÁ DE FUNCIONAMENTO',
  'CARTÃO CNPJ',
  'CND - Certidão negativa de débitos federais',
  'CNDT - Certidão negativa de débitos trabalhistas',
  'CRF - Certificado de Regularidade do FGTS',
  'Lista de funcionários prestadores de serviços para o Grupo RB'
];

const employeeDocs = [
  'ASO – Atestado de Saúde Ocupacional',
  'Ficha de EPI – Equipamento de Proteção Individual',
  'Registro dos colaboradores',
  'OS – Ordem de Serviço de Segurança do Trabalho',
  'Documentação de qualificação (Treinamentos: NR10, NR33, NR35, etc.)'
];

const SupplierCompliance: React.FC<SupplierComplianceProps> = ({ onBack }) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const handleToggle = (item: string) => {
    setCheckedItems(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-orange-600 text-white shadow-md print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
           <button onClick={onBack} className="flex items-center text-orange-100 hover:text-white">
             <ArrowLeft size={20} className="mr-2" /> Voltar ao Portal
           </button>
           <h1 className="text-xl font-bold flex items-center">
             <ClipboardCheck className="mr-2" /> Ficha de Requisitos (Fornecedor)
           </h1>
           <button onClick={handlePrint} className="bg-white text-orange-600 px-4 py-2 rounded-lg font-bold flex items-center text-sm hover:bg-orange-50">
             <Printer size={16} className="mr-2" /> Imprimir / PDF
           </button>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full">
        <div className="bg-white p-8 md:p-12 rounded-xl shadow-lg print:shadow-none print:p-0">
          
          {/* Document Header (Print Style) */}
          <div className="mb-8 border-b pb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Ficha de Homologação: Segurança e RH</h1>
            <p className="text-gray-500">
              Checklist de documentos obrigatórios para prestação de serviços no Grupo RB.
              Por favor, assinale os documentos que serão entregues.
            </p>
          </div>

          <div className="space-y-10">
            {/* Empresa Section */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 flex items-center mb-4 pb-2 border-b border-gray-200">
                <Building2 className="mr-3 text-orange-600" />
                Documentos da Empresa
              </h2>
              <div className="space-y-3">
                {companyDocs.map((doc, idx) => (
                  <label key={`comp-${idx}`} className="flex items-start cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors group">
                    <div className="relative flex items-center h-5">
                      <input 
                        type="checkbox" 
                        checked={!!checkedItems[`comp-${idx}`]}
                        onChange={() => handleToggle(`comp-${idx}`)}
                        className="h-5 w-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" 
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <span className={`font-medium ${checkedItems[`comp-${idx}`] ? 'text-gray-900' : 'text-gray-700'}`}>{doc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* Colaborador Section */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 flex items-center mb-4 pb-2 border-b border-gray-200">
                <Users className="mr-3 text-orange-600" />
                Documentos do Colaborador
              </h2>
              <p className="text-sm text-gray-500 mb-4 bg-orange-50 p-3 rounded border border-orange-100">
                 Deve ser apresentada uma pasta para cada colaborador contendo as cópias dos documentos abaixo.
              </p>
              <div className="space-y-3">
                {employeeDocs.map((doc, idx) => (
                  <label key={`emp-${idx}`} className="flex items-start cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors group">
                    <div className="relative flex items-center h-5">
                      <input 
                        type="checkbox" 
                        checked={!!checkedItems[`emp-${idx}`]}
                        onChange={() => handleToggle(`emp-${idx}`)}
                        className="h-5 w-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" 
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <span className={`font-medium ${checkedItems[`emp-${idx}`] ? 'text-gray-900' : 'text-gray-700'}`}>{doc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t-2 border-dashed border-gray-300 print:mt-16">
            <div className="grid grid-cols-2 gap-12">
              <div className="text-center">
                 <div className="h-10 border-b border-gray-400 mb-2"></div>
                 <p className="text-sm font-medium text-gray-600">Assinatura do Fornecedor</p>
              </div>
              <div className="text-center">
                 <div className="h-10 border-b border-gray-400 mb-2"></div>
                 <p className="text-sm font-medium text-gray-600">Segurança do Trabalho / RH (Grupo RB)</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SupplierCompliance;
