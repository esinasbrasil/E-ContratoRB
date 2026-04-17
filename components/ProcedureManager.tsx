
import React, { useState, useMemo } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  CalendarDays,
  Trash2,
  Edit2,
  ChevronRight,
  History,
  X,
  Map as MapIcon,
  BarChart3,
  ArrowRight,
  Zap,
  Timer,
  Briefcase,
  Users
} from 'lucide-react';
import { Procedure, Project, Supplier, ProcessStep } from '../types';
import { generateId } from '../utils';

interface ProcedureManagerProps {
  procedures: Procedure[];
  projects: Project[];
  suppliers: Supplier[];
  onAdd: (procedure: Procedure) => Promise<boolean>;
  onUpdate: (procedure: Procedure) => Promise<boolean>;
  onDelete: (id: string) => void;
}

const STANDARD_STEPS: Omit<ProcessStep, 'id'>[] = [
  { name: 'Definição de Escopo', type: 'internal', standardDurationDays: 60 },
  { name: 'Estimativa + CC', type: 'internal', standardDurationDays: 5 },
  { name: 'Abertura da Solicitação', type: 'internal', standardDurationDays: 3 },
  { name: 'Validação Fornecedores Homol.', type: 'internal', standardDurationDays: 20 },
  { name: 'Busca Novos Fornecedores', type: 'internal', standardDurationDays: 15 },
  { name: 'Equalização e Orçamentos', type: 'internal', standardDurationDays: 10 },
  { name: 'Análise de Propostas', type: 'internal', standardDurationDays: 20 },
  { name: 'Aprovação do Pedido', type: 'internal', standardDurationDays: 5 },
  { name: 'Checklist + Assinatura', type: 'internal', standardDurationDays: 7, isParallel: true },
  { name: 'Doc. Fornecedor (Paralelo)', type: 'supplier', standardDurationDays: 7, isParallel: true },
  { name: 'Liberação para Execução', type: 'final', standardDurationDays: 1 },
];

const ProcedureManager: React.FC<ProcedureManagerProps> = ({ 
  procedures, 
  projects, 
  suppliers,
  onAdd, 
  onUpdate, 
  onDelete 
}) => {
  const [activeView, setActiveView] = useState<'map' | 'control'>('map');
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  
  const [formData, setFormData] = useState<{
    projectId: string;
    supplierId?: string;
    startDate: string;
  }>({
    projectId: '',
    startDate: new Date().toISOString().split('T')[0]
  });

  const addDays = (dateStr: string, days: number) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const calculateStepStatus = (step: ProcessStep) => {
    if (step.completedDate) return 'completed';
    if (!step.startDate) return 'not_started';
    
    const today = new Date();
    const limit = new Date(step.limitDate || '');
    const start = new Date(step.startDate);
    
    if (today > limit) return 'overdue';
    
    const duration = limit.getTime() - start.getTime();
    const elapsed = today.getTime() - start.getTime();
    if (elapsed > duration * 0.8) return 'near_deadline';
    
    return 'on_time';
  };

  const handleStartProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("ProcedureManager: handleStartProcess called with formData:", formData);
    
    if (!formData.projectId || !formData.startDate) {
      console.warn("ProcedureManager: Missing required fields", formData);
      return;
    }

    const project = projects.find(p => p.id === formData.projectId);
    const supplier = suppliers.find(s => s.id === formData.supplierId);

    const steps: ProcessStep[] = STANDARD_STEPS.map((s, idx) => {
      const stepId = generateId();
      // Only the first step starts immediately
      const startDate = idx === 0 ? formData.startDate : null;
      const limitDate = startDate ? addDays(startDate, s.standardDurationDays) : null;
      
      return {
        ...s,
        id: stepId,
        startDate,
        limitDate
      };
    });

    const newProcedure: Procedure = {
      id: generateId(),
      projectId: formData.projectId,
      supplierId: formData.supplierId || null,
      projectName: project?.name || 'Projeto Desconhecido',
      supplierName: supplier?.name || null,
      steps,
      status: 'In Progress',
      createdAt: new Date().toISOString()
    };

    console.log("ProcedureManager: Attempting to save newProcedure:", newProcedure);
    const success = await onAdd(newProcedure);
    if (success) {
      console.log("ProcedureManager: Successfully saved procedure");
      setShowAddForm(false);
      setFormData({ projectId: '', startDate: new Date().toISOString().split('T')[0] });
    } else {
      console.error("ProcedureManager: Failed to save procedure");
    }
  };

  const updateStepFinish = async (procedure: Procedure, stepId: string, finishDate: string) => {
    const updatedSteps = [...procedure.steps];
    const stepIdx = updatedSteps.findIndex(s => s.id === stepId);
    if (stepIdx === -1) return;

    updatedSteps[stepIdx].completedDate = finishDate;

    // Start the next step automatically if not parallel/final
    if (stepIdx < updatedSteps.length - 1) {
      const nextStep = updatedSteps[stepIdx + 1];
      // Special logic for parallelism (9 and 10)
      if (updatedSteps[stepIdx].name === 'Aprovação do Pedido') {
          // Starts both 9 and 10
          updatedSteps[stepIdx + 1].startDate = finishDate;
          updatedSteps[stepIdx + 1].limitDate = addDays(finishDate, updatedSteps[stepIdx + 1].standardDurationDays);
          updatedSteps[stepIdx + 2].startDate = finishDate;
          updatedSteps[stepIdx + 2].limitDate = addDays(finishDate, updatedSteps[stepIdx + 2].standardDurationDays);
      } else if (!nextStep.startDate) {
          // Normal sequential flow
          // If we just finished 9 or 10, wait for both to start 11
          const step9 = updatedSteps.find(s => s.name === 'Checklist + Assinatura');
          const step10 = updatedSteps.find(s => s.name === 'Doc. Fornecedor (Paralelo)');
          
          if (step9?.completedDate && step10?.completedDate) {
              const lastFinish = step9.completedDate > step10.completedDate ? step9.completedDate : step10.completedDate;
              const step11 = updatedSteps.find(s => s.name === 'Liberação para Execução');
              if (step11 && !step11.startDate) {
                  step11.startDate = lastFinish;
                  step11.limitDate = addDays(lastFinish, step11.standardDurationDays);
              }
          } else if (stepIdx < 8) {
              nextStep.startDate = finishDate;
              nextStep.limitDate = addDays(finishDate, nextStep.standardDurationDays);
          }
      }
    }

    const isAllDone = updatedSteps.every(s => s.completedDate);
    
    await onUpdate({
      ...procedure,
      steps: updatedSteps,
      status: isAllDone ? 'Completed' : 'In Progress'
    });
  };

  const filteredProcedures = procedures.filter(p => 
    p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.supplierName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed': return { color: 'bg-emerald-500', text: 'Concluído', icon: <CheckCircle2 size={12} /> };
      case 'overdue': return { color: 'bg-red-500', text: 'Atrasado', icon: <AlertCircle size={12} /> };
      case 'near_deadline': return { color: 'bg-orange-500', text: 'Crítico', icon: <Timer size={12} /> };
      case 'on_time': return { color: 'bg-blue-500', text: 'No Prazo', icon: <Clock size={12} /> };
      default: return { color: 'bg-slate-300', text: 'Não Iniciado', icon: <ChevronRight size={12} /> };
    }
  };

  const StepCard = ({ step, procedure }: { step: ProcessStep, procedure: Procedure }) => {
    const status = calculateStepStatus(step);
    const info = getStatusInfo(status);
    
    return (
      <div className={`p-4 rounded-2xl border-2 transition-all ${status === 'completed' ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100 bg-white'}`}>
        <div className="flex justify-between items-start mb-3">
          <div className={`${info.color} text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1`}>
            {info.icon} {info.text}
          </div>
          {step.type === 'internal' ? (
             <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 rounded-md">Interno</span>
          ) : step.type === 'supplier' ? (
             <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 rounded-md">Fornecedor</span>
          ) : (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 rounded-md">Final</span>
          )}
        </div>
        <h4 className="text-sm font-black text-slate-800 mb-2 leading-tight h-10 line-clamp-2">{step.name}</h4>
        
        <div className="space-y-1 mb-4">
           {step.startDate && (
             <p className="text-[10px] text-slate-500 flex items-center justify-between font-medium">
               <span>Início:</span> <span>{new Date(step.startDate).toLocaleDateString()}</span>
             </p>
           )}
           {step.limitDate && !step.completedDate && (
             <p className={`text-[10px] flex items-center justify-between font-bold ${status === 'overdue' ? 'text-red-500' : 'text-slate-500'}`}>
               <span>Limite:</span> <span>{new Date(step.limitDate).toLocaleDateString()}</span>
             </p>
           )}
           {step.completedDate && (
             <p className="text-[10px] text-emerald-600 flex items-center justify-between font-bold">
               <span>Concluído:</span> <span>{new Date(step.completedDate).toLocaleDateString()}</span>
             </p>
           )}
        </div>

        {!step.completedDate && step.startDate && (
          <button 
            onClick={() => updateStepFinish(procedure, step.id, new Date().toISOString().split('T')[0])}
            className="w-full py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors"
          >
            Concluir Etapa
          </button>
        )}
      </div>
    );
  };

  const getLeadTime = (procedure: Procedure) => {
    const firstStep = procedure.steps[0];
    const lastStep = procedure.steps[procedure.steps.length - 1];
    if (!firstStep.startDate) return 0;
    
    const end = lastStep.completedDate ? new Date(lastStep.completedDate) : new Date();
    const start = new Date(firstStep.startDate);
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getBottleneck = (procedure: Procedure) => {
    const activeStep = procedure.steps.find(s => s.startDate && !s.completedDate);
    if (!activeStep) return null;
    
    const start = new Date(activeStep.startDate || '');
    const today = new Date();
    const days = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      step: activeStep.name,
      days: days,
      isOverdue: days > activeStep.standardDurationDays
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Zap className="text-emerald-500" fill="currentColor" /> Gestão de Prazos & Fluxo
          </h2>
          <p className="text-slate-500 font-medium">Controle inteligente de lead time e gargalos operacionais</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button 
            onClick={() => setActiveView('map')}
            className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'map' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <MapIcon size={16} /> Mapa do Processo
          </button>
          <button 
            onClick={() => setActiveView('control')}
            className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'control' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <BarChart3 size={16} /> Controle de Prazos
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-3">
          <Search className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por projeto ou fornecedor..." 
            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-900 outline-none text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-[2rem] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-emerald-100"
        >
          <Plus size={20} /> Novo Fluxo
        </button>
      </div>

      {activeView === 'map' ? (
        <div className="space-y-8">
          {filteredProcedures.length === 0 && (
            <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-200">
               <History size={64} className="mx-auto text-slate-200 mb-6" />
               <h3 className="text-2xl font-black text-slate-400">Nenhum fluxo iniciado</h3>
               <p className="text-slate-400 mt-2">Clique em "Novo Fluxo" para começar a monitorar um projeto.</p>
            </div>
          )}
          
          {filteredProcedures.map(proc => {
            const bottleneck = getBottleneck(proc);
            return (
              <div key={proc.id} className="bg-white rounded-[3rem] shadow-2xl border border-slate-50 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                       <Briefcase className="text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">{proc.projectName}</h3>
                      <p className="text-slate-500 font-bold text-sm flex items-center gap-2">
                         <Users size={14} /> {proc.supplierName || 'Fornecedor Pendente'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead Time Atual</p>
                       <p className="text-2xl font-black text-emerald-600">{getLeadTime(proc)} Dias</p>
                    </div>
                    <div className="h-12 w-px bg-slate-200"></div>
                    {bottleneck && (
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gargalo Identificado</p>
                        <p className={`text-md font-black flex items-center justify-end gap-1 ${bottleneck.isOverdue ? 'text-red-500' : 'text-orange-500'}`}>
                           {bottleneck.isOverdue && <AlertCircle size={16} />} {bottleneck.days}D em: {bottleneck.step}
                        </p>
                      </div>
                    )}
                    <button onClick={() => onDelete(proc.id)} className="ml-4 p-3 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-2xl transition-all">
                       <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {proc.steps.map(step => (
                    <StepCard key={step.id} step={step} procedure={proc} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
           <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Projeto / Fornecedor</th>
                  <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Etapa Atual</th>
                  <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Início</th>
                  <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Prazo (Limite)</th>
                  <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Dias Parado</th>
                  <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredProcedures.map(proc => {
                  const activeStep = proc.steps.find(s => s.startDate && !s.completedDate);
                  const status = activeStep ? calculateStepStatus(activeStep) : 'completed';
                  const info = getStatusInfo(status);
                  const bottleneck = getBottleneck(proc);

                  return (
                    <tr key={proc.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors group">
                      <td className="p-6">
                        <p className="font-black text-slate-900">{proc.projectName}</p>
                        <p className="text-xs text-slate-500 font-medium">{proc.supplierName || '-'}</p>
                      </td>
                      <td className="p-6 font-bold text-slate-700 text-sm">
                        {activeStep?.name || 'Processo Concluído'}
                      </td>
                      <td className="p-6 text-center text-sm font-bold text-slate-500">
                        {activeStep?.startDate ? new Date(activeStep.startDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-6 text-center text-sm font-black text-slate-900">
                        {activeStep?.limitDate ? new Date(activeStep.limitDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-6 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-black ${bottleneck && bottleneck.days > 5 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                           {bottleneck ? `${bottleneck.days} dias` : '-'}
                        </span>
                      </td>
                      <td className="p-6">
                         <div className="flex items-center gap-2">
                           <div className={`w-3 h-3 rounded-full ${info.color} animate-pulse`}></div>
                           <span className="text-xs font-black uppercase tracking-wider text-slate-700">{info.text}</span>
                         </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
           </table>
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-10 bg-emerald-600 text-white relative">
              <h2 className="text-3xl font-black">Iniciar Novo Procedimento</h2>
              <p className="text-emerald-100 font-medium mt-1">Este fluxo automatiza 11 etapas de contrato e prazos.</p>
              <button onClick={() => setShowAddForm(false)} className="absolute top-8 right-8 p-3 hover:bg-white/10 rounded-2xl">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleStartProcess} className="p-10 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Projeto para Vínculo</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-slate-900 font-bold focus:border-emerald-500 focus:bg-white transition-all outline-none"
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  required
                >
                  <option value="">Selecione o Projeto</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Fornecedor (Opcional)</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-slate-900 font-bold focus:border-emerald-500 focus:bg-white transition-all outline-none"
                  value={formData.supplierId}
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                >
                  <option value="">Selecione o Fornecedor</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Data de Início do Escopo</label>
                <input 
                  type="date" 
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-slate-900 font-bold focus:border-emerald-500 focus:bg-white transition-all outline-none"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                 <h4 className="text-emerald-900 font-black text-sm mb-2 flex items-center gap-2">
                    <Zap size={16} /> Fluxo Inteligente Ativado
                 </h4>
                 <p className="text-emerald-700 text-xs leading-relaxed font-medium">
                    Ao iniciar, o sistema calculará automaticamente o <strong>Lead Time total</strong> e as datas limite para cada uma das 11 etapas do processo GRUPORB.
                 </p>
              </div>

              <button type="submit" className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-xl transition-all uppercase tracking-widest text-sm">
                Lançar Processo em Produção
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcedureManager;
