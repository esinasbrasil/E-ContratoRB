import React, { useState } from 'react';
import { Project, Unit } from '../types';
import { Plus, Trash2, Briefcase, Calendar, DollarSign, FileText, Pencil, X, MapPin, Hash } from 'lucide-react';

interface ProjectManagerProps {
  projects: Project[];
  units: Unit[];
  onAdd: (project: Project) => void;
  onUpdate: (project: Project) => void;
  onDelete: (id: string) => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ projects, units, onAdd, onUpdate, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    unitId: '',
    costCenter: '',
    description: '',
    estimatedValue: 0,
    startDate: '',
    endDate: '',
    status: 'Planned',
    type: 'Other',
    attachments: [],
    requiredNRs: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.unitId) return;

    const projectData: Project = {
      id: editingId || Date.now().toString(),
      name: formData.name,
      unitId: formData.unitId,
      costCenter: formData.costCenter || '',
      description: formData.description || '',
      estimatedValue: Number(formData.estimatedValue) || 0,
      startDate: formData.startDate || '',
      endDate: formData.endDate || '',
      status: (formData.status as any) || 'Planned',
      type: formData.type || 'Other',
      attachments: formData.attachments || [],
      requiredNRs: formData.requiredNRs || []
    };

    if (editingId) {
      onUpdate(projectData);
      setEditingId(null);
    } else {
      onAdd(projectData);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      unitId: '',
      costCenter: '',
      description: '',
      estimatedValue: 0,
      startDate: '',
      endDate: '',
      status: 'Planned',
      type: 'Other',
      attachments: [],
      requiredNRs: []
    });
    setEditingId(null);
  };

  const handleEditClick = (project: Project) => {
    setEditingId(project.id);
    setFormData({ ...project });
  };

  const handleChange = (field: keyof Project, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getUnitName = (id: string) => {
    return units.find(u => u.id === id)?.name || 'Unidade desconhecida';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestão de Projetos (BID)</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="xl:col-span-1">
          <div className={`bg-white p-6 rounded-xl shadow-sm border sticky top-6 transition-all duration-300 ${editingId ? 'border-primary-300 ring-2 ring-primary-50' : 'border-gray-100'}`}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-between">
              <span className="flex items-center">
                {editingId ? <Pencil size={20} className="mr-2 text-primary-600" /> : <Plus size={20} className="mr-2 text-primary-600" />}
                {editingId ? 'Editar Projeto' : 'Novo Projeto'}
              </span>
              {editingId && (
                <button onClick={resetForm} className="text-xs text-red-500 hover:text-red-700 flex items-center">
                  <X size={14} className="mr-1" /> Cancelar
                </button>
              )}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Projeto *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ex: Reforma do Galpão B"
                  className="w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidade Vinculada *</label>
                <select
                  value={formData.unitId}
                  onChange={(e) => handleChange('unitId', e.target.value)}
                  className="w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  required
                >
                  <option value="">Selecione uma unidade...</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Centro de Custo</label>
                    <input
                      type="text"
                      value={formData.costCenter}
                      onChange={(e) => handleChange('costCenter', e.target.value)}
                      placeholder="CC 102030"
                      className="w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      required
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                      className="w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    >
                      <option value="Planned">Planejado</option>
                      <option value="Active">Em Andamento</option>
                      <option value="Completed">Concluído</option>
                    </select>
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Estimado (Bid)</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">R$</span>
                  </div>
                  <input
                    type="number"
                    value={formData.estimatedValue}
                    onChange={(e) => handleChange('estimatedValue', e.target.value)}
                    className="w-full rounded-md border-gray-300 border p-2 pl-10 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleChange('startDate', e.target.value)}
                      className="w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Término</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleChange('endDate', e.target.value)}
                      className="w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Breve Resumo</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Descreva o escopo e objetivo principal do projeto..."
                  rows={3}
                  className="w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>

              <div className="flex gap-2">
                 {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="w-1/3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                      Cancelar
                    </button>
                 )}
                 <button
                   type="submit"
                   className={`flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${editingId ? 'bg-primary-700 hover:bg-primary-800' : 'bg-primary-600 hover:bg-primary-700'}`}
                 >
                   {editingId ? 'Salvar Alterações' : 'Cadastrar Projeto'}
                 </button>
              </div>
            </form>
          </div>
        </div>

        {/* List Section */}
        <div className="xl:col-span-2 space-y-4">
            <h3 className="font-semibold text-gray-700 flex items-center">
                <Briefcase className="text-primary-500 mr-2" size={20} />
                Projetos Cadastrados ({projects.length})
            </h3>
             
             {projects.length === 0 ? (
               <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
                 Nenhum projeto cadastrado.
               </div>
             ) : (
               <div className="grid grid-cols-1 gap-4">
                 {projects.map((project) => (
                   <div 
                      key={project.id} 
                      className={`bg-white rounded-xl p-5 shadow-sm border transition-all relative group
                        ${editingId === project.id ? 'border-primary-300 ring-2 ring-primary-50 transform scale-[1.01]' : 'border-gray-100 hover:shadow-md'}
                      `}
                   >
                      <div className="flex justify-between items-start">
                         <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <h4 className="text-lg font-bold text-gray-900">{project.name}</h4>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ml-2 
                                  ${project.status === 'Active' ? 'bg-green-100 text-green-700' : 
                                    project.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 
                                    'bg-gray-100 text-gray-600'}`}>
                                  {project.status === 'Active' ? 'Em Andamento' : 
                                   project.status === 'Completed' ? 'Concluído' : 'Planejado'}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mt-3 text-sm text-gray-600">
                                <div className="flex items-center">
                                    <MapPin size={14} className="mr-2 text-gray-400" /> 
                                    <span>Unidade: <span className="font-medium text-gray-800">{getUnitName(project.unitId)}</span></span>
                                </div>
                                <div className="flex items-center">
                                    <Hash size={14} className="mr-2 text-gray-400" /> 
                                    <span>CC: <span className="font-medium text-gray-800">{project.costCenter}</span></span>
                                </div>
                                <div className="flex items-center">
                                    <Calendar size={14} className="mr-2 text-gray-400" /> 
                                    <span>{new Date(project.startDate).toLocaleDateString('pt-BR')} até {new Date(project.endDate).toLocaleDateString('pt-BR')}</span>
                                </div>
                                <div className="flex items-center">
                                    <DollarSign size={14} className="mr-2 text-green-500" /> 
                                    <span>Bid: <span className="font-medium text-green-700">R$ {project.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></span>
                                </div>
                            </div>
                            
                            {project.description && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-sm text-gray-500 line-clamp-2">{project.description}</p>
                                </div>
                            )}
                         </div>

                         <div className="flex flex-col gap-2 ml-4">
                             <button
                               onClick={() => handleEditClick(project)}
                               className={`p-2 rounded-full transition-colors ${editingId === project.id ? 'bg-primary-100 text-primary-700' : 'text-gray-400 hover:text-primary-600 hover:bg-primary-50'}`}
                               title="Editar Projeto"
                             >
                               <Pencil size={18} />
                             </button>
                             <button
                               onClick={() => onDelete(project.id)}
                               className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                               title="Remover Projeto"
                             >
                               <Trash2 size={18} />
                             </button>
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

export default ProjectManager;