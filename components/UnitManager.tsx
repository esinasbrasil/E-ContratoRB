
import React, { useState } from 'react';
import { Unit } from '../types';
import { Plus, Trash2, Building2, MapPin, Phone, Mail, FileText, Pencil, X } from 'lucide-react';

interface UnitManagerProps {
  units: Unit[];
  onAdd: (unit: Unit) => void;
  onUpdate: (unit: Unit) => void;
  onDelete: (id: string) => void;
}

const UnitManager: React.FC<UnitManagerProps> = ({ units, onAdd, onUpdate, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Unit>>({
    name: '',
    cnpj: '',
    address: '',
    ie: '',
    email: '',
    phone: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.cnpj) return;

    if (editingId) {
      // Update Mode
      const updatedUnit: Unit = {
        id: editingId,
        name: formData.name,
        cnpj: formData.cnpj,
        address: formData.address || '',
        ie: formData.ie,
        email: formData.email,
        phone: formData.phone
      };
      onUpdate(updatedUnit);
      setEditingId(null);
    } else {
      // Create Mode
      const newUnit: Unit = {
        id: Date.now().toString(),
        name: formData.name,
        cnpj: formData.cnpj,
        address: formData.address || '',
        ie: formData.ie,
        email: formData.email,
        phone: formData.phone
      };
      onAdd(newUnit);
    }
    
    setFormData({ name: '', cnpj: '', address: '', ie: '', email: '', phone: '' });
  };

  const handleEditClick = (unit: Unit) => {
    setEditingId(unit.id);
    setFormData({
      name: unit.name,
      cnpj: unit.cnpj,
      address: unit.address,
      ie: unit.ie || '',
      email: unit.email || '',
      phone: unit.phone || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', cnpj: '', address: '', ie: '', email: '', phone: '' });
  };

  const handleChange = (field: keyof Unit, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Cadastro de Unidades</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="xl:col-span-1">
          <div className={`bg-white p-6 rounded-xl shadow-sm border sticky top-6 transition-all duration-300 ${editingId ? 'border-primary-300 ring-2 ring-primary-50' : 'border-gray-100'}`}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-between">
              <span className="flex items-center">
                {editingId ? <Pencil size={20} className="mr-2 text-primary-600" /> : <Plus size={20} className="mr-2 text-primary-600" />}
                {editingId ? 'Editar Unidade' : 'Nova Unidade'}
              </span>
              {editingId && (
                <button onClick={handleCancelEdit} className="text-xs text-red-500 hover:text-red-700 flex items-center">
                  <X size={14} className="mr-1" /> Cancelar
                </button>
              )}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Unidade *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ex: BA01 - Unidade Salto"
                  className="w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ *</label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => handleChange('cnpj', e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className="w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Insc. Estadual</label>
                  <input
                    type="text"
                    value={formData.ie}
                    onChange={(e) => handleChange('ie', e.target.value)}
                    placeholder="IE..."
                    className="w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Rua, Número, Cidade, CEP..."
                  rows={2}
                  className="w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone/Fax</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                 </div>
              </div>

              <div className="flex gap-2">
                 {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="w-1/3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                      Cancelar
                    </button>
                 )}
                 <button
                   type="submit"
                   className={`flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${editingId ? 'bg-primary-700 hover:bg-primary-800' : 'bg-primary-600 hover:bg-primary-700'}`}
                 >
                   {editingId ? 'Salvar Alterações' : 'Cadastrar Unidade'}
                 </button>
              </div>
            </form>
          </div>
        </div>

        {/* List Section */}
        <div className="xl:col-span-2 space-y-4">
            <h3 className="font-semibold text-gray-700 flex items-center">
                <Building2 className="text-primary-500 mr-2" size={20} />
                Unidades Ativas ({units.length})
            </h3>
             
             {units.length === 0 ? (
               <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
                 Nenhuma unidade cadastrada.
               </div>
             ) : (
               <div className="grid grid-cols-1 gap-4">
                 {units.map((unit) => (
                   <div 
                      key={unit.id} 
                      className={`bg-white rounded-xl p-5 shadow-sm border transition-all relative group
                        ${editingId === unit.id ? 'border-primary-300 ring-2 ring-primary-50 transform scale-[1.01]' : 'border-gray-100 hover:shadow-md'}
                      `}
                   >
                      <div className="flex justify-between items-start">
                         <div className="flex items-start space-x-3">
                             <div className="bg-primary-50 p-3 rounded-lg text-primary-600 mt-1">
                                <Building2 size={24} />
                             </div>
                             <div>
                                <h4 className="text-lg font-bold text-gray-900">{unit.name}</h4>
                                <div className="text-sm text-gray-600 mt-1 space-y-1">
                                    <p className="flex items-center"><FileText size={14} className="mr-2 text-gray-400" /> 
                                      <span className="font-medium mr-2">CNPJ:</span> {unit.cnpj} 
                                      {unit.ie && <span className="ml-2 text-gray-500">| IE: {unit.ie}</span>}
                                    </p>
                                    <p className="flex items-start"><MapPin size={14} className="mr-2 text-gray-400 mt-0.5" /> {unit.address}</p>
                                </div>
                             </div>
                         </div>
                         <div className="flex items-center space-x-2">
                             <button
                               onClick={() => handleEditClick(unit)}
                               className={`p-2 rounded-full transition-colors ${editingId === unit.id ? 'bg-primary-100 text-primary-700' : 'text-gray-400 hover:text-primary-600 hover:bg-primary-50'}`}
                               title="Editar Unidade"
                             >
                               <Pencil size={18} />
                             </button>
                             <button
                               onClick={() => onDelete(unit.id)}
                               className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                               title="Remover Unidade"
                             >
                               <Trash2 size={18} />
                             </button>
                         </div>
                      </div>
                      
                      {(unit.email || unit.phone) && (
                          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-4 text-sm text-gray-600">
                              {unit.email && <div className="flex items-center"><Mail size={14} className="mr-1.5 text-blue-500"/> {unit.email}</div>}
                              {unit.phone && <div className="flex items-center"><Phone size={14} className="mr-1.5 text-green-500"/> {unit.phone}</div>}
                          </div>
                      )}
                   </div>
                 ))}
               </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default UnitManager;
