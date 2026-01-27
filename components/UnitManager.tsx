
import React, { useState } from 'react';
import { Unit } from '../types';
import { Plus, Trash2, Building2, MapPin, Phone, Mail, FileText, Pencil, X, Loader2 } from 'lucide-react';

interface UnitManagerProps {
  units: Unit[];
  onAdd: (unit: Unit) => Promise<boolean>;
  onUpdate: (unit: Unit) => Promise<boolean>;
  onDelete: (id: string) => void;
}

const UnitManager: React.FC<UnitManagerProps> = ({ units, onAdd, onUpdate, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Unit>>({
    name: '',
    cnpj: '',
    address: '',
    ie: '',
    email: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.cnpj) return;
    setIsSaving(true);

    try {
        let unitData: Unit = {
          id: editingId || crypto.randomUUID(),
          name: formData.name,
          cnpj: formData.cnpj,
          address: formData.address || '',
          ie: formData.ie,
          email: formData.email,
          phone: formData.phone
        };
        
        const success = editingId ? await onUpdate(unitData) : await onAdd(unitData);
        
        if (success) {
          setFormData({ name: '', cnpj: '', address: '', ie: '', email: '', phone: '' });
          setEditingId(null);
        }
    } finally {
        setIsSaving(false);
    }
  };

  const handleEditClick = (unit: Unit) => {
    setEditingId(unit.id);
    setFormData({ ...unit });
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
                <input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Ex: BA01 - Unidade Salto" className="w-full rounded-md border-gray-300 border p-2 text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ *</label>
                  <input type="text" value={formData.cnpj} onChange={(e) => handleChange('cnpj', e.target.value)} placeholder="00.000.000/0000-00" className="w-full rounded-md border-gray-300 border p-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Insc. Estadual</label>
                  <input type="text" value={formData.ie} onChange={(e) => handleChange('ie', e.target.value)} className="w-full rounded-md border-gray-300 border p-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
                <textarea value={formData.address} onChange={(e) => handleChange('address', e.target.value)} rows={2} className="w-full rounded-md border-gray-300 border p-2 text-sm" />
              </div>
              <div className="flex gap-2">
                 <button type="submit" disabled={isSaving} className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50">
                   {isSaving ? <Loader2 size={18} className="animate-spin" /> : editingId ? 'Salvar Alterações' : 'Cadastrar Unidade'}
                 </button>
              </div>
            </form>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-4">
             {units.length === 0 ? (
               <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">Nenhuma unidade cadastrada.</div>
             ) : (
               <div className="grid grid-cols-1 gap-4">
                 {units.map((unit) => (
                   <div key={unit.id} className={`bg-white rounded-xl p-5 shadow-sm border transition-all ${editingId === unit.id ? 'border-primary-300 ring-2 ring-primary-50' : 'border-gray-100'}`}>
                      <div className="flex justify-between items-start">
                         <div className="flex items-start space-x-3">
                             <div className="bg-primary-50 p-3 rounded-lg text-primary-600"><Building2 size={24} /></div>
                             <div>
                                <h4 className="text-lg font-bold text-gray-900">{unit.name}</h4>
                                <p className="text-sm text-gray-600">CNPJ: {unit.cnpj} | {unit.address}</p>
                             </div>
                         </div>
                         <div className="flex items-center space-x-2">
                             <button onClick={() => handleEditClick(unit)} className="p-2 text-gray-400 hover:text-primary-600"><Pencil size={18} /></button>
                             <button onClick={() => onDelete(unit.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                         </div>
                      </div>
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
