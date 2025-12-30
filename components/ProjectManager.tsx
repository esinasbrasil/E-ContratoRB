import React, { useState } from 'react';
import { Project, Unit } from '../types';
import { Plus, Trash2, Briefcase, Calendar, DollarSign, Pencil, X, MapPin, Hash, Search, Filter } from 'lucide-react';

interface ProjectManagerProps {
  projects: Project[];
  units: Unit[];
  onAdd: (project: Project) => void;
  onUpdate: (project: Project) => void;
  onDelete: (id: string) => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ projects, units, onAdd, onUpdate, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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
      id: editingId || crypto.randomUUID(),
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

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.costCenter.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestão de Projetos (BID)</h1>
      </div>

      {/* Barra de Busca de Conexão */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar projeto por nome ou Centro de Custo..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="flex items-center px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 text-sm font-medium transition-colors">
          <Filter size={16} className="mr-2" />
          Filtros
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Formulário */}
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
                  className="w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidade *</label>
                <select
                  value={formData.unitId}
                  onChange={(e) => handleChange('unitId', e.target.value)}
                  className="w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  required
                >
                  <option value="">Selecione...</option>
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
                      <option value="Active">Ativo</option>
                      <option value="Completed">Concluído</option>
                    </select>
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Estimado (R$)</label>
                <input
                  type="number"
                  value={formData.estimatedValue}
                  onChange={(e) => handleChange('estimatedValue', e.target.value)}
                  className="w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
              >
                {editingId ? 'Salvar Alterações' : 'Cadastrar'}
              </button>
            </form>
          </div>
        </div>

        {/* Lista */}
        <div className="xl:col-span-2 space-y-4">
             {filteredProjects.length === 0 ? (
               <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                 <Briefcase size={48} className="mx-auto text-gray-200 mb-4" />
                 <p className="text-gray-500">Nenhum projeto encontrado.</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 gap-4">
                 {filteredProjects.map((project) => (
                   <div key={project.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start">
                         <div>
                            <h4 className="text-lg font-bold text-gray-900">{project.name}</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                                <div className="flex items-center">
                                    <MapPin size={14} className="mr-2 text-gray-400" /> {getUnitName(project.unitId)}
                                </div>
                                <div className="flex items-center">
                                    <Hash size={14} className="mr-2 text-gray-400" /> CC: {project.costCenter}
                                </div>
                                <div className="flex items-center text-green-600 font-medium">
                                    <DollarSign size={14} className="mr-1" /> R$ {project.estimatedValue.toLocaleString('pt-BR')}
                                </div>
                                <div className="flex items-center">
                                    <Calendar size={14} className="mr-2 text-gray-400" /> {project.status === 'Active' ? 'Em Andamento' : 'Programado'}
                                </div>
                            </div>
                         </div>
                         <div className="flex gap-2">
                             <button onClick={() => handleEditClick(project)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors">
                               <Pencil size={18} />
                             </button>
                             <button onClick={() => onDelete(project.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
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
