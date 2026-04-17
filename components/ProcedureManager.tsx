
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
  Users,
  Settings,
  Info,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion } from 'motion/react';
import { Procedure, Project, Supplier, ProcessStep, ProcedureSettings } from '../types';
import { generateId } from '../utils';

interface ProcedureManagerProps {
  procedures: Procedure[];
  projects: Project[];
  suppliers: Supplier[];
  settings: ProcedureSettings | null;
  onSaveSettings: (settings: ProcedureSettings) => Promise<boolean>;
  onAdd: (procedure: Procedure) => Promise<boolean>;
  onUpdate: (procedure: Procedure) => Promise<boolean>;
  onDelete: (id: string) => void;
}

const DEFAULT_STEPS: Omit<ProcessStep, 'id'>[] = [
  { name: 'Definição de Escopo', type: 'internal', standardDurationDays: 60, description: 'Fase inicial onde as necessidades do projeto são detalhadas e o escopo técnico é fechado.' },
  { name: 'Estimativa + CC', type: 'internal', standardDurationDays: 5, description: 'Levantamento de custos e definição do Centro de Custo para o projeto.' },
  { name: 'Abertura da Solicitação', type: 'internal', standardDurationDays: 3, description: 'Formalização da demanda no sistema interno para início do processo de procurement.' },
  { name: 'Validação Fornecedores Homol.', type: 'internal', standardDurationDays: 20, description: 'Verificação da base de fornecedores já homologados que atendem ao escopo.' },
  { name: 'Busca Novos Fornecedores', type: 'internal', standardDurationDays: 15, description: 'Identificação e análise de novos parceiros no mercado para ampliar concorrência.' },
  { name: 'Equalização e Orçamentos', type: 'internal', standardDurationDays: 10, description: 'Análise comparativa das propostas recebidas para garantir que todos orçaram o mesmo escopo.' },
  { name: 'Análise de Propostas', type: 'internal', standardDurationDays: 20, description: 'Avaliação técnica e comercial detalhada para seleção da melhor oferta.' },
  { name: 'Aprovação do Pedido', type: 'internal', standardDurationDays: 5, description: 'Obtenção das assinaturas de diretoria/gerência para o fechamento do negócio.' },
  { name: 'Checklist + Assinatura', type: 'internal', standardDurationDays: 7, isParallel: true, description: 'Conferência documental e coleta de assinaturas no contrato final.' },
  { name: 'Doc. Fornecedor (Paralelo)', type: 'supplier', standardDurationDays: 7, isParallel: true, description: 'Coleta de documentações específicas do fornecedor para conformidade.' },
  { name: 'Liberação para Execução', type: 'final', standardDurationDays: 1, description: 'Entrega da ordem de serviço e autorização para início dos trabalhos em campo.' },
];

const ProcedureManager: React.FC<ProcedureManagerProps> = ({ 
  procedures, 
  projects, 
  suppliers,
  settings,
  onSaveSettings,
  onAdd, 
  onUpdate, 
  onDelete 
}) => {
  const [activeView, setActiveView] = useState<'map' | 'control' | 'settings'>('control');
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [editingSettings, setEditingSettings] = useState<ProcedureSettings | null>(null);
  
  const currentSteps = useMemo(() => settings?.steps || DEFAULT_STEPS, [settings]);
  
  const calculateTotalLeadTime = (steps: Omit<ProcessStep, 'id'>[]) => {
    let total = 0;
    let i = 0;
    while (i < steps.length) {
      if (steps[i].isParallel) {
        let maxParallel = 0;
        while (i < steps.length && steps[i].isParallel) {
          maxParallel = Math.max(maxParallel, steps[i].standardDurationDays);
          i++;
        }
        total += maxParallel;
      } else {
        total += steps[i].standardDurationDays;
        i++;
      }
    }
    return total;
  };

  const totalLeadTime = useMemo(() => {
    const stepsToCalc = editingSettings?.steps || currentSteps;
    return calculateTotalLeadTime(stepsToCalc);
  }, [editingSettings, currentSteps]);

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
    if (!formData.projectId || !formData.startDate) return;

    const project = projects.find(p => p.id === formData.projectId);
    const supplier = suppliers.find(s => s.id === formData.supplierId);

    const steps: ProcessStep[] = currentSteps.map((s, idx) => {
      const stepId = generateId();
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

    const success = await onAdd(newProcedure);
    if (success) {
      setShowAddForm(false);
      setFormData({ projectId: '', startDate: new Date().toISOString().split('T')[0] });
    }
  };

  const updateStepFinish = async (procedure: Procedure, stepId: string, finishDate: string) => {
    const updatedSteps = [...procedure.steps];
    const stepIdx = updatedSteps.findIndex(s => s.id === stepId);
    if (stepIdx === -1) return;

    updatedSteps[stepIdx].completedDate = finishDate;

    // Logic to unlock next steps
    if (stepIdx < updatedSteps.length - 1) {
      const currentStep = updatedSteps[stepIdx];
      const nextStep = updatedSteps[stepIdx + 1];

      // Special logic for parallelism (9 and 10 in standard 11-step flow)
      // Usually steps 8 is 'Aprovação do Pedido', 9 is 'Checklist', 10 is 'Doc Fornecedor'
      if (currentStep.name === 'Aprovação do Pedido') {
        // Find indices of parallel steps
        updatedSteps.forEach((s, i) => {
          if (s.isParallel && !s.startDate) {
            s.startDate = finishDate;
            s.limitDate = addDays(finishDate, s.standardDurationDays);
          }
        });
      }

      // Check if we can start the next purely sequential step
      // A step can start if all non-parallel previous steps are done 
      // AND if parallel steps are required, they are also done.
      const parallelSteps = updatedSteps.filter(s => s.isParallel);
      const allParallelDone = parallelSteps.every(s => s.completedDate);
      
      const nextNonStarted = updatedSteps.find((s, i) => i > stepIdx && !s.startDate && !s.isParallel);
      if (nextNonStarted) {
        const prevIdx = updatedSteps.indexOf(nextNonStarted) - 1;
        const prevStep = updatedSteps[prevIdx];
        
        // If previous is one of parallel, we only start if BOTH parallel are done
        if (prevStep.isParallel) {
          if (allParallelDone) {
            const lastFinish = Math.max(...parallelSteps.map(s => new Date(s.completedDate!).getTime()));
            nextNonStarted.startDate = new Date(lastFinish).toISOString().split('T')[0];
            nextNonStarted.limitDate = addDays(nextNonStarted.startDate, nextNonStarted.standardDurationDays);
          }
        } else if (prevStep.completedDate) {
          nextNonStarted.startDate = prevStep.completedDate;
          nextNonStarted.limitDate = addDays(prevStep.completedDate, nextNonStarted.standardDurationDays);
        }
      }
    }

    const isAllDone = updatedSteps.every(s => s.completedDate);
    const updatedProcedure = {
      ...procedure,
      steps: updatedSteps,
      status: (isAllDone ? 'Completed' : 'In Progress') as any
    };
    
    await onUpdate(updatedProcedure);
    setSelectedProcedure(updatedProcedure);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSettings) {
      await onSaveSettings(editingSettings);
      setEditingSettings(null);
      setActiveView('control');
    }
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
      default: return { color: 'bg-slate-200', text: 'Não Disponível', icon: <ChevronRight size={12} /> };
    }
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

  if (selectedProcedure) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
          <div className="flex justify-between items-start mb-10">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setSelectedProcedure(null)}
                className="w-12 h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl flex items-center justify-center transition-all"
              >
                <ChevronRight className="rotate-180" />
              </button>
              <div>
                <h2 className="text-3xl font-black text-slate-900">{selectedProcedure.projectName}</h2>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-slate-500 font-bold flex items-center gap-1.5"><Users size={16} /> {selectedProcedure.supplierName || 'Fornecedor Pendente'}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                  <span className="text-emerald-600 font-black flex items-center gap-1.5"><Timer size={16} /> Lead Time: {getLeadTime(selectedProcedure)} Dias</span>
                </div>
              </div>
            </div>
            
            <div className="flex bg-slate-100 p-2 rounded-[2rem]">
               <div className="px-6 py-2 bg-white rounded-[1.5rem] shadow-sm text-xs font-black text-slate-800 uppercase tracking-widest">
                  Fluxo Operacional
               </div>
            </div>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            {selectedProcedure.steps.map((step, idx) => {
              const status = calculateStepStatus(step);
              const info = getStatusInfo(status);
              const isLocked = !step.startDate && !step.completedDate;

              return (
                <div 
                  key={step.id} 
                  className={`flex items-stretch gap-6 group relative ${idx < selectedProcedure.steps.length - 1 ? 'pb-4' : ''}`}
                >
                  {/* Timeline logic */}
                  {idx < selectedProcedure.steps.length - 1 && (
                    <div className={`absolute left-6 top-10 bottom-0 w-1 ${step.completedDate ? 'bg-emerald-500' : 'bg-slate-100'}`}></div>
                  )}

                  {/* Icon/Checkbox column */}
                  <div className="flex flex-col items-center">
                    <button 
                      disabled={isLocked || !!step.completedDate}
                      onClick={() => updateStepFinish(selectedProcedure, step.id, new Date().toISOString().split('T')[0])}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-4 ${
                        step.completedDate 
                          ? 'bg-emerald-500 border-emerald-100 text-white' 
                          : isLocked 
                            ? 'bg-slate-50 border-slate-50 text-slate-200' 
                            : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-500 hover:text-emerald-500'
                      }`}
                    >
                      {step.completedDate ? <Check size={24} strokeWidth={4} /> : idx + 1}
                    </button>
                  </div>

                  {/* Content column */}
                  <div className={`flex-1 p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between ${
                    step.completedDate 
                      ? 'bg-emerald-50/30 border-emerald-100' 
                      : isLocked 
                        ? 'bg-slate-50/50 border-transparent opacity-60' 
                        : 'bg-white border-slate-100 shadow-lg shadow-slate-100'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className={`text-lg font-black transition-colors ${step.completedDate ? 'text-emerald-900' : 'text-slate-800'}`}>
                          {step.name}
                        </h4>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          step.type === 'internal' ? 'bg-blue-50 text-blue-600' : 
                          step.type === 'supplier' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {step.type === 'internal' ? 'INTERNO' : step.type === 'supplier' ? 'FORNECEDOR' : 'FINAL'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        {step.limitDate && !step.completedDate && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <Calendar className="text-slate-400" size={14} />
                            <span className="text-slate-400 font-medium">Prazo Estimado:</span>
                            <span className={`font-black ${status === 'overdue' ? 'text-red-500' : 'text-slate-700'}`}>
                              {new Date(step.limitDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {step.completedDate && (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                            <CheckCircle2 size={14} />
                            <span className="font-medium">Finalizado em:</span>
                            <span className="font-black">{new Date(step.completedDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {!step.completedDate && step.startDate && (
                      <button 
                        onClick={() => updateStepFinish(selectedProcedure, step.id, new Date().toISOString().split('T')[0])}
                        className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2"
                      >
                        Check <Check size={14} />
                      </button>
                    )}
                    
                    {isLocked && (
                      <div className="text-slate-300">
                         <Clock size={20} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Zap className="text-emerald-500" fill="currentColor" /> Monitor de Fluxos
          </h2>
          <p className="text-slate-500 font-medium tracking-tight">Estratégia e execução de prazos GRUPORB</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-[2rem]">
          <button 
            onClick={() => setActiveView('map')}
            className={`px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'map' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <MapIcon size={16} /> Mapa de Fluxo
          </button>
          <button 
            onClick={() => setActiveView('control')}
            className={`px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'control' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <BarChart3 size={16} /> Controle Ativo
          </button>
          <button 
            onClick={() => setActiveView('settings')}
            className={`px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'settings' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Settings size={16} /> Ajuste de Datas
          </button>
        </div>
      </div>

      {activeView === 'settings' ? (
        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-300">
           <div className="flex justify-between items-start mb-10">
              <div>
                 <h3 className="text-2xl font-black text-slate-900">Configuração de Prazos Padrão</h3>
                 <p className="text-slate-500 font-medium">Defina a duração padrão em dias para cada etapa do processo.</p>
              </div>
              <div className="bg-emerald-50 px-8 py-5 rounded-3xl border border-emerald-100 text-center shadow-sm">
                 <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Lead Time Total</span>
                 <div className="flex items-center gap-2 justify-center">
                    <span className="text-4xl font-black text-slate-900">{totalLeadTime}</span>
                    <span className="text-lg font-black text-emerald-600">Dias</span>
                 </div>
                 <div className="mt-1 pt-1 border-t border-emerald-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       ≈ {(totalLeadTime / 30).toFixed(1)} Meses
                    </span>
                 </div>
              </div>
           </div>

           <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {(editingSettings?.steps || currentSteps).map((step, idx) => (
                  <div key={idx} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl group hover:bg-white hover:shadow-lg transition-all border-2 border-transparent hover:border-emerald-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-slate-400 shadow-sm group-hover:text-emerald-500">
                        {idx + 1}
                      </div>
                      <span className="font-black text-slate-800">{step.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <input 
                          type="number" 
                          className="w-20 bg-white border-2 border-slate-200 rounded-xl p-2 text-center font-black text-emerald-600 focus:border-emerald-500 outline-none transition-all"
                          value={step.standardDurationDays}
                          onChange={(e) => {
                             const newSteps = [...(editingSettings?.steps || currentSteps)];
                             newSteps[idx] = { ...newSteps[idx], standardDurationDays: parseInt(e.target.value) || 0 };
                             setEditingSettings({ id: settings?.id || 'global', steps: newSteps });
                          }}
                       />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dias</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-10 flex gap-4">
                <button 
                  type="submit" 
                  disabled={!editingSettings}
                  className="flex-1 bg-slate-900 hover:bg-emerald-600 disabled:bg-slate-200 text-white font-black py-5 rounded-2xl transition-all uppercase tracking-widest text-sm shadow-xl"
                >
                  Salvar Configurações Globais
                </button>
                <button 
                  type="button"
                  onClick={() => { setEditingSettings(null); setActiveView('control'); }}
                  className="px-10 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-5 rounded-2xl transition-all uppercase tracking-widest text-sm"
                >
                  Cancelar
                </button>
              </div>
           </form>
        </div>
      ) : activeView === 'map' ? (
        <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-500">
           <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 text-white p-12 rounded-[4rem] relative overflow-hidden shadow-2xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                 <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/10 mb-6 backdrop-blur-sm">
                       <Zap size={16} className="text-emerald-400" fill="currentColor" />
                       <span className="text-xs font-black uppercase tracking-widest">Excelência Operacional</span>
                    </div>
                    <h2 className="text-5xl font-black mb-6 tracking-tight">Mapa de Fluxo Operacional</h2>
                    <p className="text-emerald-100 text-xl max-w-2xl font-medium leading-relaxed opacity-80">
                       Nossa metodologia exclusiva de 11 etapas garante transparência, compliance e agilidade na contratação de serviços técnicos GRUPORB.
                    </p>
                 </div>
                 
                 <div className="bg-[#eefcf6] px-10 py-7 rounded-[2.5rem] text-center shadow-2xl shrink-0 border border-emerald-100/30 animate-in zoom-in duration-500 delay-200">
                    <span className="text-[11px] font-black text-[#008a65] uppercase tracking-[0.2em] block mb-1">Lead Time Total</span>
                    <div className="flex items-center gap-2 justify-center">
                       <span className="text-6xl font-black text-[#0f172a] leading-none tracking-tighter">{totalLeadTime}</span>
                       <span className="text-2xl font-black text-[#008a65]">Dias</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#008a65]/10">
                       <span className="text-sm font-black text-slate-400 uppercase tracking-[0.1em]">
                          ≈ {(totalLeadTime / 30).toFixed(1)} Meses
                       </span>
                    </div>
                 </div>
              </div>
              <MapIcon size={300} className="absolute -right-20 -bottom-20 text-white/5 rotate-12" />
              
              {/* Decorative elements */}
              <div className="absolute top-10 right-20 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-20 left-1/2 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl"></div>
           </div>

           <div className="relative max-w-5xl mx-auto px-4">
              {/* Central Line */}
              <div className="absolute left-[30px] md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 via-emerald-100 to-transparent md:-translate-x-1/2 opacity-20 hidden md:block"></div>

              <div className="space-y-12">
                {currentSteps.map((step, idx) => {
                  // Dynamic icon selection based on step name
                  const getIcon = (name: string) => {
                    if (name.includes('Escopo')) return <ClipboardList className="w-6 h-6" />;
                    if (name.includes('Estimativa')) return <BarChart3 className="w-6 h-6" />;
                    if (name.includes('Solicitação')) return <Plus className="w-6 h-6" />;
                    if (name.includes('Homol')) return <CheckCircle2 className="w-6 h-6" />;
                    if (name.includes('Busca')) return <Search className="w-6 h-6" />;
                    if (name.includes('Equalização')) return <BarChart3 className="w-6 h-6" />;
                    if (name.includes('Análise')) return <Search className="w-6 h-6" />;
                    if (name.includes('Aprovação')) return <CheckCircle2 className="w-6 h-6" />;
                    if (name.includes('Checklist')) return <ClipboardList className="w-6 h-6" />;
                    if (name.includes('Doc. Fornecedor')) return <Users className="w-6 h-6" />;
                    if (name.includes('Liberação')) return <CheckCircle2 className="w-6 h-6" />;
                    return <ArrowRight className="w-6 h-6" />;
                  };

                  const isEven = idx % 2 === 0;

                  return (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className={`flex flex-col md:flex-row items-center gap-8 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse text-right'}`}
                    >
                      {/* Card Section */}
                      <div className={`flex-1 w-full bg-white p-8 rounded-[3rem] shadow-xl border-2 transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] ${
                        step.type === 'internal' ? 'border-blue-50' : 
                        step.type === 'supplier' ? 'border-orange-50' : 'border-emerald-50'
                      }`}>
                         <div className={`flex items-center gap-4 mb-4 ${!isEven && 'md:flex-row-reverse'}`}>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                              step.type === 'internal' ? 'bg-blue-600' : 
                              step.type === 'supplier' ? 'bg-orange-500' : 'bg-emerald-600'
                            }`}>
                              {getIcon(step.name)}
                            </div>
                            <div>
                               <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                                 step.type === 'internal' ? 'text-blue-500' : 
                                 step.type === 'supplier' ? 'text-orange-500' : 'text-emerald-500'
                               }`}>
                                  {step.type === 'internal' ? 'Interno' : step.type === 'supplier' ? 'Fornecedor' : 'Final'}
                               </span>
                               <h4 className="text-xl font-black text-slate-900">{step.name}</h4>
                            </div>
                         </div>
                         <p className={`text-slate-500 text-sm leading-relaxed font-medium mb-6 ${!isEven && 'md:text-right'}`}>
                            {step.description || 'Nenhuma descrição disponível para esta etapa.'}
                         </p>
                         <div className={`flex items-center gap-4 ${!isEven && 'md:justify-end'}`}>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                               <Timer size={14} className="text-slate-400" />
                               <span className="text-xs font-black text-slate-700">{step.standardDurationDays} Dias Padrão</span>
                            </div>
                            {step.isParallel && (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-xl border border-orange-100">
                                 <Zap size={14} className="text-orange-500" fill="currentColor" />
                                 <span className="text-xs font-black text-orange-600 uppercase tracking-widest text-[10px]">Paralelo</span>
                              </div>
                            )}
                         </div>
                      </div>

                      {/* Timeline Marker */}
                      <div className="relative z-20 flex flex-col items-center">
                         <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-xl shadow-xl ring-8 ${
                            step.type === 'internal' ? 'bg-blue-600 ring-blue-50' : 
                            step.type === 'supplier' ? 'bg-orange-500 ring-orange-50' : 'bg-emerald-600 ring-emerald-50'
                         }`}>
                           {idx + 1}
                         </div>
                         {idx < currentSteps.length - 1 && (
                            <div className="md:hidden w-1 h-12 bg-slate-100 mt-2"></div>
                         )}
                      </div>

                      {/* Spacer for empty side */}
                      <div className="hidden md:block flex-1"></div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Success Final Indicator */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="mt-20 flex flex-col items-center text-center"
              >
                 <div className="w-24 h-24 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-200 mb-6 rotate-12">
                    <CheckCircle2 size={48} />
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest leading-none">Processo Finalizado</h3>
                 <p className="text-slate-400 font-bold mt-2">Pronto para execução eficiente em campo</p>
              </motion.div>
           </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
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

          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Projeto / Fornecedor</th>
                    <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Etapa Atual</th>
                    <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Início</th>
                    <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Prazo (Limite)</th>
                    <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Dias Parado</th>
                    <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProcedures.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-20 text-center">
                        <History size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold">Nenhum fluxo encontrado</p>
                      </td>
                    </tr>
                  ) : filteredProcedures.map(proc => {
                    const activeStep = proc.steps.find(s => s.startDate && !s.completedDate);
                    const status = activeStep ? calculateStepStatus(activeStep) : 'completed';
                    const info = getStatusInfo(status);
                    const bottleneck = getBottleneck(proc);

                    return (
                      <tr key={proc.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                        <td className="p-6">
                          <p className="font-black text-slate-900">{proc.projectName}</p>
                          <p className="text-xs text-slate-500 font-medium tracking-tight">{proc.supplierName || 'Fornecedor não vinculado'}</p>
                        </td>
                        <td className="p-6">
                           <div className="flex items-center gap-2 mb-1">
                              <div className={`w-2 h-2 rounded-full ${info.color}`}></div>
                              <span className="text-xs font-black text-slate-800">{activeStep?.name || 'Concluído'}</span>
                           </div>
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
                        <td className="p-6 flex items-center gap-2">
                           <button 
                             onClick={() => setSelectedProcedure(proc)}
                             className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all shadow-sm"
                           >
                             <ArrowRight size={18} />
                           </button>
                           <button 
                             onClick={() => onDelete(proc.id)}
                             className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                           >
                              <Trash2 size={18} />
                           </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-10 bg-emerald-600 text-white relative">
              <h2 className="text-3xl font-black">Iniciar Novo Procedimento</h2>
              <p className="text-emerald-100 font-medium mt-1">Este fluxo automatiza as {currentSteps.length} etapas críticas.</p>
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
                    O sistema calculará automaticamente o <strong>Lead Time total</strong> e as datas limite para cada etapa com base nas configurações globais atuais.
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
