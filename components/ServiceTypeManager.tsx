import React, { useState } from 'react';
import { ServiceCategory } from '../types';
import { Plus, Trash2, CheckSquare, Layers } from 'lucide-react';

interface ServiceTypeManagerProps {
  services: ServiceCategory[];
  onAdd: (service: ServiceCategory) => void;
  onDelete: (id: string) => void;
}

const ServiceTypeManager: React.FC<ServiceTypeManagerProps> = ({ services, onAdd, onDelete }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
        const newService: ServiceCategory = {
          id: crypto.randomUUID(),
          name: name.trim(),
          description: description.trim()
        };

        onAdd(newService);
        setName('');
        setDescription('');
    } catch (error) {
        console.error("Erro ao adicionar categoria:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gerenciar Tipos de Serviço</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Plus size={20} className="mr-2 text-primary-600" />
              Novo Tipo de Serviço
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Serviço</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Hidráulica"
                  className="w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição breve da categoria..."
                  rows={3}
                  className="w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cadastrar
              </button>
            </form>
          </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center">
               <Layers className="text-gray-500 mr-2" size={20} />
               <h3 className="font-semibold text-gray-700">Categorias Cadastradas</h3>
             </div>
             
             {services.length === 0 ? (
               <div className="p-8 text-center text-gray-500">
                 Nenhuma categoria cadastrada.
               </div>
             ) : (
               <ul className="divide-y divide-gray-100">
                 {services.map((service) => (
                   <li key={service.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                     <div className="flex items-start space-x-3">
                       <div className="mt-1 bg-primary-50 p-2 rounded-lg text-primary-600">
                         <CheckSquare size={18} />
                       </div>
                       <div>
                         <p className="text-sm font-bold text-gray-900">{service.name}</p>
                         {service.description && (
                           <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                         )}
                       </div>
                     </div>
                     <button
                       onClick={() => onDelete(service.id)}
                       className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                       title="Remover"
                     >
                       <Trash2 size={18} />
                     </button>
                   </li>
                 ))}
               </ul>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceTypeManager;