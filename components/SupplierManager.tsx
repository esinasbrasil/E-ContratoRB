import React, { useState } from 'react';
import { Supplier, SupplierStatus, ServiceCategory } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  Star, 
  ClipboardList, 
  Pencil, 
  Trash2, 
  X,
  Building,
  FileText
} from 'lucide-react';

interface SupplierManagerProps {
  suppliers: Supplier[];
  serviceCategories: ServiceCategory[];
  onAdd: (supplier: Supplier) => void;
  onUpdate: (supplier: Supplier) => void;
  onDelete: (id: string) => void;
  onOpenContractWizard: (id: string) => void;
  onRiskAnalysis: (supplier: Supplier) => void;
  analyzingRiskId: string | null;
  riskReport: { id: string, text: string } | null;
  onCloseRiskReport: () => void;
}

const SupplierManager: React.FC<SupplierManagerProps> = ({ 
  suppliers, 
  serviceCategories, 
  onAdd, 
  onUpdate, 
  onDelete,
  onOpenContractWizard,
  onRiskAnalysis,
  analyzingRiskId,
  riskReport,
  onCloseRiskReport
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '',
    cnpj: '',
    address: '',
    serviceType: '',
    status: SupplierStatus.PENDING,
    rating: 0
  });

  const resetForm = () => {
    setFormData({
      name: '',
      cnpj: '',
      address: '',
      serviceType: '',
      status: SupplierStatus.PENDING,
      rating: 0
    });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleEditClick = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setFormData({ ...supplier });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.cnpj) return;

    const supplierData: Supplier = {
      id: editingId || Date.now().toString(),
      name: formData.name,
      cnpj: formData.cnpj,
      address: formData.address || '',
      serviceType: formData.serviceType || 'Outros',
      status: formData.status || SupplierStatus.PENDING,
      rating: formData.rating || 0,
      docs: formData.docs || []
    };

    if (editingId) {
      onUpdate(supplierData);
    } else {
      onAdd(supplierData);
    }
    
    resetForm();
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.cnpj.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Fornecedores</h1>
        {!isFormOpen && (
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus size={20} className="mr-2" />
            Novo Fornecedor
          </button>
        )}
      </div>

      {/* Form Section */}
      {isFormOpen && (
        <div className={`bg-white p-6 rounded-xl shadow-sm border transition-all duration-300 ${editingId ? 'border-primary-300 ring-2 ring-primary-50' : 'border-gray-100'}`}>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-between">
            <span className="flex items-center">
              {editingId ? <Pencil size={20} className="mr-2 text-primary-600" /> : <Plus size={20} className="mr-2 text-primary-600" />}
              {editingId ? 'Editar Fornecedor' : 'Cadastrar Novo Fornecedor'}
            </span>
            <button onClick={resetForm} className="text-xs text-red-500 hover:text-red-700 flex items-center">
              <X size={14} className="mr-1" /> Cancelar
            </button>
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ *</label>
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                  className="w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="00.000.000/0000-00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Serviço</label>
                <select
                  value={formData.serviceType}
                  onChange={(e) => setFormData(prev => ({ ...prev, serviceType: e.target.value }))}
                  className="w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  required
                >
                  <option value="">Selecione...</option>
                  {serviceCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as SupplierStatus }))}
                  className="w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                >
                  <option value={SupplierStatus.PENDING}>Aguardando</option>
                  <option value={SupplierStatus.HOMOLOGATED}>Homologado</option>
                  <option value={SupplierStatus.BLOCKED}>Bloqueado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avaliação Inicial (0-5)</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={formData.rating}
                  onChange={(e) => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) }))}
                  className="w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
               <button
                 type="button"
                 onClick={resetForm}
                 className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
               >
                 Cancelar
               </button>
               <button
                 type="submit"
                 className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
               >
                 {editingId ? 'Salvar Alterações' : 'Cadastrar'}
               </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou CNPJ..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="flex items-center px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
          <Filter size={18} className="mr-2" />
          Filtros
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="px-6 py-4 font-medium">Fornecedor</th>
              <th className="px-6 py-4 font-medium">Serviço</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Avaliação</th>
              <th className="px-6 py-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSuppliers.map(s => (
              <React.Fragment key={s.id}>
                <tr className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">{s.name}</p>
                      <div className="flex items-center text-xs text-gray-500 mt-0.5">
                         <FileText size={12} className="mr-1"/> {s.cnpj}
                      </div>
                      {s.address && (
                          <div className="flex items-center text-xs text-gray-400 mt-0.5 max-w-[200px] truncate">
                              <Building size={12} className="mr-1 flex-shrink-0"/> {s.address}
                          </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {s.serviceType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                      ${s.status === SupplierStatus.HOMOLOGATED ? 'bg-green-50 text-green-700 border-green-200' : 
                        s.status === SupplierStatus.PENDING ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                        'bg-red-50 text-red-700 border-red-200'}`}>
                      {s.status === SupplierStatus.HOMOLOGATED && <ShieldCheck size={12} className="mr-1"/>}
                      {s.status === SupplierStatus.PENDING && <ShieldAlert size={12} className="mr-1"/>}
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-amber-400">
                      <span className="text-gray-600 mr-2 text-sm">{s.rating > 0 ? s.rating.toFixed(1) : '-'}</span>
                      {[...Array(5)].map((_, i) => (
                         <Star key={i} size={14} fill={i < Math.floor(s.rating) ? "currentColor" : "none"} className={i < Math.floor(s.rating) ? "" : "text-gray-300"} />
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                     <div className="flex justify-end gap-2 items-center">
                        <button 
                          onClick={() => handleEditClick(s)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        
                        <button 
                          onClick={() => onOpenContractWizard(s.id)}
                          className="text-xs flex items-center bg-primary-50 text-primary-700 hover:bg-primary-100 px-3 py-1.5 rounded transition-colors font-medium border border-primary-100"
                          title="Preencher Checklist de Contrato"
                        >
                          <ClipboardList size={14} className="mr-1.5" />
                          Checklist
                        </button>
                        
                        <button 
                          onClick={() => onRiskAnalysis(s)}
                          disabled={analyzingRiskId === s.id}
                          className="text-xs text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2 py-1.5 rounded transition-colors"
                        >
                          {analyzingRiskId === s.id ? '...' : 'IA Risco'}
                        </button>

                        <button 
                          onClick={() => onDelete(s.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Remover"
                        >
                          <Trash2 size={16} />
                        </button>
                     </div>
                  </td>
                </tr>
                {/* AI Report Section */}
                {riskReport && riskReport.id === s.id && (
                  <tr>
                    <td colSpan={5} className="bg-purple-50 px-6 py-4 relative border-b border-purple-100">
                      <div className="text-sm text-purple-900">
                        <button 
                          onClick={onCloseRiskReport}
                          className="absolute top-2 right-2 text-purple-400 hover:text-purple-700"
                        >
                           <X size={16} />
                        </button>
                        <strong className="flex items-center mb-2"><ShieldAlert size={16} className="mr-2"/> Análise de Risco (IA):</strong>
                        <pre className="whitespace-pre-wrap font-sans text-gray-700">{riskReport.text}</pre>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {filteredSuppliers.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Nenhum fornecedor encontrado.
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierManager;