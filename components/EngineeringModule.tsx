
import React, { useState } from 'react';
import { Project, Unit, NR } from '../types';
import { HardHat, Plus, Save, X, Paperclip, CheckSquare, Calendar, DollarSign, MapPin, Hash, ArrowLeft } from 'lucide-react';

interface EngineeringModuleProps {
  projects: Project[];
  units: Unit[];
  onAddProject: (p: Project) => void;
  onUpdateProject: (p: Project) => void;
  onBack: () => void;
}

const NR_LIST: NR[] = [
  { id: 'nr1', number: 'NR-01', name: 'Disposições Gerais', description: 'Gerenciamento de Riscos Ocupacionais' },
  { id: 'nr6', number: 'NR-06', name: 'EPI', description: 'Equipamento de Proteção Individual' },
  { id: 'nr10', number: 'NR-10', name: 'Instalações Elétricas', description: 'Segurança em Instalações e Serviços em Eletricidade' },
  { id: 'nr12', number: 'NR-12', name: 'Máquinas e Equipamentos', description: 'Segurança no Trabalho em Máquinas e Equipamentos' },
  { id: 'nr18', number: 'NR-18', name: 'Construção Civil', description: 'Condições e Meio Ambiente de Trabalho na Indústria da Construção' },
  { id: 'nr33', number: 'NR-33', name: 'Espaços Confinados', description: 'Segurança e Saúde nos Trabalhos em Espaços Confinados' },
  { id: 'nr35', number: 'NR-35', name: 'Trabalho em Altura', description: 'Requisitos e medidas de proteção para o trabalho em altura' },
];

const EngineeringModule: React.FC<EngineeringModuleProps> = ({ projects, units, onAddProject, onUpdateProject, onBack }) => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    unitId: '',
    costCenter: '',
    estimatedValue: 0,
    startDate: '',
    endDate: '',
    status: 'Planned',
    type: 'Improvement',
    description: '',
    requiredNRs: [],
    attachments: []
  });

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData({
        name: '',
        unitId: '',
        costCenter: '',
        estimatedValue: 0,
        startDate: '',
        endDate: '',
        status: 'Planned',
        type: 'Improvement',
        description: '',
        requiredNRs: [],
        attachments: []
    });
    setView('form');
  };

  const handleEdit = (project: Project) => {
    setEditingId(project.id);
    setFormData({ ...project });
    setView('form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.unitId) return;

    const projectData: Project = {
      id: editingId || Date.now().toString(),
      name: formData.name!,
      unitId: formData.unitId!,
      costCenter: formData.costCenter || '',
      description: formData.description || '',
      estimatedValue: Number(formData.estimatedValue) || 0,
      startDate: formData.startDate || '',
      endDate: formData.endDate || '',
      status: (formData.status as any) || 'Planned',
      type: (formData.type as any) || 'Improvement',
      requiredNRs: formData.requiredNRs || [],
      attachments: formData.attachments || []
    };

    if (editingId) {
      onUpdateProject(projectData);
    } else {
      onAddProject(projectData);
    }
    setView('list');
  };

  const toggleNR = (nrId: string) => {
    const current = formData.requiredNRs || [];
    if (current.includes(nrId)) {
      setFormData(prev => ({ ...prev, requiredNRs: current.filter(id => id !== nrId) }));
    } else {
      setFormData(prev => ({ ...prev, requiredNRs: [...current, nrId] }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Mock upload just to show interface interaction
      if (e.target.files?.[0]) {
          const file = e.target.files[0];
          const newAtt = {
              name: file.name,
              url: '#',
              type: 'Scope' as const
          };
          setFormData(prev => ({ ...prev, attachments: [...(prev.attachments || []), newAtt] }));
      }
  };

  if (view === 'form') {
    return (
        <div className="bg-gray-100 min-h-screen p-6">
            <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-blue-600 px-6 py-4 flex justify-between items-center text-white">
                    <h2 className="text-xl font-bold flex items-center">
                        <HardHat className="mr-3" /> 
                        {editingId ? 'Editar Projeto de Engenharia' : 'Novo Projeto de Engenharia'}
                    </h2>
                    <button onClick={() => setView('list')} className="text-blue-100 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Basic Info */}
                    <section>
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Detalhes do Projeto</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Nome do Projeto</label>
                                <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Unidade</label>
                                <select required className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={formData.unitId} onChange={e => setFormData({...formData, unitId: e.target.value})}
                                >
                                    <option value="">Selecione...</option>
                                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Centro de Custo</label>
                                <input type="text" className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                                    value={formData.costCenter} onChange={e => setFormData({...formData, costCenter: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tipo do Projeto</label>
                                <select className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}
                                >
                                    <option value="Improvement">Melhoria</option>
                                    <option value="Adaptation">Adaptação</option>
                                    <option value="Acquisition">Aquisição</option>
                                    <option value="Renovation">Reforma</option>
                                    <option value="Compliance">Adequação (Normas)</option>
                                    <option value="Maintenance">Manutenção</option>
                                    <option value="Other">Outros</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Valor Estimado (CAPEX/OPEX)</label>
                                <div className="relative mt-1 rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">R$</span>
                                    </div>
                                    <input type="number" className="block w-full rounded-md border-gray-300 border p-2 pl-10 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                                        value={formData.estimatedValue} onChange={e => setFormData({...formData, estimatedValue: parseFloat(e.target.value)})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Início Previsto</label>
                                <input type="date" className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                                    value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})}
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Término Previsto</label>
                                <input type="date" className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                                    value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})}
                                />
                            </div>
                             <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Breve Resumo / Objetivo</label>
                                <textarea rows={3} className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Escopo e Anexos */}
                    <section>
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Escopo Técnico e Arquivos</h3>
                        <div className="bg-gray-50 p-6 rounded-lg border border-dashed border-gray-300 text-center">
                            <Paperclip className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-2 text-sm text-gray-600">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                    <span>Anexar Arquivo</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileUpload} />
                                </label>
                                <p className="pl-1">ou arraste e solte</p>
                            </div>
                            <p className="text-xs text-gray-500">Fotos, Projetos (DWG/PDF) e Escopo Técnico.</p>
                        </div>
                        {formData.attachments && formData.attachments.length > 0 && (
                            <ul className="mt-4 space-y-2">
                                {formData.attachments.map((file, idx) => (
                                    <li key={idx} className="flex items-center text-sm text-gray-700 bg-white p-2 rounded border">
                                        <Paperclip size={16} className="mr-2 text-blue-500"/> {file.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {/* NRs Checklist */}
                    <section>
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Normas Regulamentadoras (NRs) Aplicáveis</h3>
                        <p className="text-sm text-gray-500 mb-4">O engenheiro deve selecionar quais normas são obrigatórias para a execução deste projeto.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {NR_LIST.map(nr => (
                                <div key={nr.id} 
                                    onClick={() => toggleNR(nr.id)}
                                    className={`cursor-pointer border rounded-lg p-4 flex items-start space-x-3 transition-colors ${formData.requiredNRs?.includes(nr.id) ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}
                                >
                                    <div className={`mt-1 h-5 w-5 rounded border flex items-center justify-center ${formData.requiredNRs?.includes(nr.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                        {formData.requiredNRs?.includes(nr.id) && <CheckSquare size={14} className="text-white" />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{nr.number}</h4>
                                        <p className="text-sm font-medium text-gray-700">{nr.name}</p>
                                        <p className="text-xs text-gray-500 mt-1">{nr.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="flex justify-end space-x-3 pt-6 border-t">
                        <button type="button" onClick={() => setView('list')} className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button type="submit" className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                            <Save size={18} className="inline mr-2" /> Salvar Projeto
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
  }

  // LIST VIEW
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
        <header className="bg-blue-900 text-white shadow-lg">
             <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <button onClick={onBack} className="p-2 hover:bg-blue-800 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center"><HardHat className="mr-3" /> Engenharia & Projetos</h1>
                        <p className="text-blue-200 text-sm">Gestão de Obras, Reformas e Adequações</p>
                    </div>
                </div>
                <button onClick={handleCreateNew} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center shadow-md transition-colors">
                    <Plus size={20} className="mr-2" /> Novo Projeto
                </button>
             </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
            {projects.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
                    <HardHat size={64} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Nenhum projeto registrado</h3>
                    <p className="text-gray-500 mt-1">Utilize o botão acima para cadastrar novos projetos de engenharia.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(project => (
                        <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold 
                                        ${project.status === 'Active' ? 'bg-green-100 text-green-800' : 
                                          project.status === 'Completed' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {project.status === 'Active' ? 'Ativo' : project.status === 'Completed' ? 'Concluído' : 'Planejado'}
                                    </span>
                                    <span className="text-xs text-gray-500 border px-2 py-0.5 rounded">{project.type || 'Projeto'}</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{project.name}</h3>
                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
                                
                                <div className="space-y-2 text-sm text-gray-500">
                                    <div className="flex items-center"><MapPin size={16} className="mr-2 text-gray-400" /> {units.find(u => u.id === project.unitId)?.name}</div>
                                    <div className="flex items-center"><Hash size={16} className="mr-2 text-gray-400" /> CC: {project.costCenter}</div>
                                    <div className="flex items-center"><Calendar size={16} className="mr-2 text-gray-400" /> {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}</div>
                                    <div className="flex items-center"><DollarSign size={16} className="mr-2 text-green-500" /> R$ {project.estimatedValue.toLocaleString('pt-BR')}</div>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center">
                                <div className="flex -space-x-2">
                                     {/* Mock avatars or NR icons */}
                                     {project.requiredNRs && project.requiredNRs.length > 0 && (
                                         <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full" title="NRs Obrigatórias">
                                             {project.requiredNRs.length} NRs
                                         </span>
                                     )}
                                </div>
                                <button onClick={() => handleEdit(project)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                                    Ver Detalhes
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    </div>
  );
};

export default EngineeringModule;
