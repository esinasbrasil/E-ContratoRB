import React from 'react';
import { Contract, Supplier, CompanySettings } from '../types';
import { FileText, Download, DollarSign, Building, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { mergeAndSavePDF } from '../services/pdfService';

interface ContractManagerProps {
  contracts: Contract[];
  suppliers: Supplier[];
  settings: CompanySettings;
  onOpenWizard: () => void;
  onEditContract: (contract: Contract) => void;
  onDeleteContract: (id: string) => void;
}

const ContractManager: React.FC<ContractManagerProps> = ({ 
  contracts, 
  suppliers, 
  settings, 
  onOpenWizard,
  onEditContract,
  onDeleteContract
}) => {

  const handleDownload = (contract: Contract) => {
    const supplier = suppliers.find(s => s.id === contract.supplierId);
    mergeAndSavePDF(contract.details, supplier, settings);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Contratos & Solicitações</h1>
          <p className="text-sm text-gray-500">Gerencie e emita minutas contratuais</p>
        </div>
        <button 
          onClick={onOpenWizard}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-md transition-all transform hover:-translate-y-0.5"
        >
          <PlusCircle size={20} className="mr-2" />
          Novo Checklist
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Empty State / CTA */}
        {contracts.length === 0 && (
           <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="text-primary-400" size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Nenhuma solicitação registrada</h3>
            <p className="text-gray-500 mt-2 max-w-md mx-auto mb-6">
              Inicie o checklist para preencher os dados do fornecedor, escopo e condições financeiras para gerar a minuta em PDF.
            </p>
            <button 
              onClick={onOpenWizard}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
            >
              Iniciar Checklist Agora
            </button>
          </div>
        )}

        {contracts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-700">Histórico de Solicitações ({contracts.length})</h3>
            </div>
            <table className="w-full text-left border-collapse">
              <thead className="bg-white text-gray-600 text-sm border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-medium">Data / ID</th>
                  <th className="px-6 py-4 font-medium">Fornecedor</th>
                  <th className="px-6 py-4 font-medium">Objeto</th>
                  <th className="px-6 py-4 font-medium">Valor Total</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contracts.map(contract => {
                  const supplier = suppliers.find(s => s.id === contract.supplierId);
                  return (
                    <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">
                          {new Date(contract.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400">Ref: {contract.id.slice(-6)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                           <Building size={14} className="mr-2 text-gray-400" />
                           <span className="text-sm text-gray-700 font-medium">{supplier?.name || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-[200px] truncate" title={contract.details.objectDescription}>
                          {contract.details.objectDescription}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm font-medium text-gray-700">
                           <DollarSign size={14} className="mr-1 text-green-600" />
                           {contract.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                          ${contract.status === 'Signed' ? 'bg-green-50 text-green-700 border-green-200' : 
                            contract.status === 'Legal Review' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                            'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                            {contract.status === 'Signed' ? 'Concluído' : 
                             contract.status === 'Legal Review' ? 'Em Análise' : 'Rascunho'}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleDownload(contract)}
                              className="inline-flex items-center px-2 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                              title="Baixar PDF"
                            >
                              <Download size={14} />
                            </button>
                            <button 
                              onClick={() => onEditContract(contract)}
                              className="inline-flex items-center px-2 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-blue-50 hover:text-blue-600 focus:outline-none"
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>
                            <button 
                              onClick={() => onDeleteContract(contract.id)}
                              className="inline-flex items-center px-2 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-red-50 hover:text-red-600 focus:outline-none"
                              title="Excluir"
                            >
                              <Trash2 size={14} />
                            </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractManager;