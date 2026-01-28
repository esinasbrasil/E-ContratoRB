
import React, { useState, useEffect } from 'react';
import { Supplier, Project, Preposto, ContractRequestData, Unit, CompanySettings, ContractAttachment, LaborDetail } from '../types';
import { Check, ChevronRight, ChevronLeft, FileText, Plus, Upload, Building, Info, Link as LinkIcon, Loader2, X, Save, MapPin, FileCheck, AlertTriangle, Mail, User, ShieldCheck, Briefcase, Coins } from 'lucide-react';
import { mergeAndSavePDF } from '../services/pdfService';

interface ContractWizardProps {
  suppliers: Supplier[];
  projects: Project[];
  units: Unit[];
  settings: CompanySettings;
  preSelectedSupplierId?: string;
  initialData?: ContractRequestData;
  onCancel: () => void;
  onSave?: (data: ContractRequestData, supplierId: string, value: number) => Promise<boolean>;
}

const steps = [
  'Fornecedor & Projeto',
  'Legal',
  'Escopo',
  'Equipe',
  'Recursos',
  'Financeiro',
  'Análise de Risco',
  'Doc. Obrigatórios',
  'Anexos',
  'Revisão'
];

const checklistItems = [
  { id: 'docCheckCommercial', label: 'Acordo Comercial' },
  { id: 'docCheckPO', label: 'Pedido de Compra (PO)' },
  { id: 'docCheckCompliance', label: 'Termo de Compliance' },
  { id: 'docCheckSupplierAcceptance', label: 'Aceite do Fornecedor' },
  { id: 'docCheckSystemRegistration', label: 'Registro no Sistema' },
  { id: 'docCheckSupplierReport', label: 'Relatório do Fornecedor' }
];

const legalAspects = [
  { id: 'aspectStandardDraft', label: 'Minuta padrão' },
  { id: 'aspectNonStandardDraft', label: 'Minuta NÃO padrão' },
  { id: 'aspectConfidentiality', label: 'Cláusulas de confidencialidade' },
  { id: 'aspectTermination', label: 'Cláusulas de rescisão e penalidades' },
  { id: 'aspectWarranties', label: 'Garantias exigidas (performance, entrega, etc.)' },
  { id: 'aspectWarrantyStart', label: 'Contagem da garantia (entrega/execução)' },
  { id: 'aspectPostTermination', label: 'Obrigações pós-encerramento (sigilo)' },
  { id: 'aspectPublicAgencies', label: 'Interação com órgãos públicos' },
  { id: 'aspectAdvancePayment', label: 'Cláusula de antecipação de pagamento' },
  { id: 'aspectNonStandard', label: 'Ou não padrão' }
];

const attachmentTypes = [
  'Pedido de Compra',
  'Contrato Social (Alteração Contratual Assinada)',
  'CND Federal (Certidão Federal)',
  'CND Estadual (Certidão Estadual)',
  'CND Municipal (Certidão Municipal)',
  'CND Trabalhista (Certidão Trabalhista)',
  'Certidão FGTS (Certidão FGTS)',
  'Ata ou Procuração (Certidão Simplificada)',
  'Orçamento (Proposta Detalhada)',
  'Relatório Serasa'
];

const ContractWizard: React.FC<ContractWizardProps> = ({ 
  suppliers, 
  projects, 
  units, 
  settings, 
  preSelectedSupplierId, 
  initialData,
  onCancel, 
  onSave 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  
  const [formData, setFormData] = useState<ContractRequestData>({
    supplierId: preSelectedSupplierId || '',
    projectId: '',
    unitId: '',
    orderNumber: '',
    supplierBranches: 'Não aplicável',
    serviceLocation: '',
    serviceType: '',
    docSocialContract: false,
    docSerasa: false,
    objectDescription: '',
    scopeDescription: '',
    prepostos: [{ name: '', role: '', email: '', cpf: '' }],
    technicalResponsible: '',
    technicalResponsibleCpf: '',
    hasMaterials: false,
    materialsList: '',
    hasEquipment: false,
    equipmentList: '',
    hasRental: false,
    rentalList: '',
    hasComodato: false,
    comodatoList: '',
    hasLabor: false,
    laborDetails: [],
    startDate: '',
    endDate: '',
    scheduleSteps: '',
    value: 0,
    paymentTerms: '',
    billingSchedule: '',
    capLimit: 'Não aplicável',
    correctionIndex: 'Não aplicável',
    warranties: 'Não aplicável',
    urgenciesRisks: '',
    aspectStandardDraft: false,
    aspectNonStandardDraft: false,
    aspectConfidentiality: false,
    aspectTermination: false,
    aspectWarranties: false,
    aspectWarrantyStart: false,
    aspectPostTermination: false,
    aspectPublicAgencies: false,
    aspectAdvancePayment: false,
    aspectNonStandard: false,
    docCheckCommercial: false,
    docCheckPO: false,
    docCheckCompliance: false,
    docCheckSupplierAcceptance: false,
    docCheckSystemRegistration: false,
    docCheckSupplierReport: false,
    docCheckFiscalValidation: false,
    docCheckSafetyDocs: false,
    docCheckTrainingCertificates: false,
    attachments: []
  });

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  const handleNext = () => currentStep < steps.length - 1 && setCurrentStep(currentStep + 1);
  const handleBack = () => currentStep > 0 && setCurrentStep(currentStep - 1);
  const handleChange = (field: keyof ContractRequestData, value: any) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleProjectSelection = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const unit = units.find(u => u.id === project.unitId);
      setFormData(prev => ({
        ...prev,
        projectId,
        unitId: project.unitId,
        orderNumber: project.orderNumber || prev.orderNumber || '',
        objectDescription: project.name,
        scopeDescription: project.description,
        startDate: project.startDate,
        endDate: project.endDate,
        value: project.estimatedValue,
        serviceLocation: unit?.name || prev.serviceLocation
      }));
    } else {
      setFormData(prev => ({ ...prev, projectId, unitId: '' }));
    }
  };

  const handleUnitSelection = (unitId: string) => {
    const unit = units.find(u => u.id === unitId);
    setFormData(prev => ({
      ...prev,
      unitId,
      serviceLocation: unit?.name || ''
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') { alert("Apenas arquivos PDF são permitidos."); return; }
      if (file.size > 2 * 1024 * 1024) { alert("Arquivo muito grande. Limite de 2MB por anexo."); return; }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const existingIndex = formData.attachments.findIndex(a => a.type === type);
        const newAttachment = { name: file.name, type, fileData: base64 };
        if (existingIndex >= 0) {
           const newAttachments = [...formData.attachments];
           newAttachments[existingIndex] = newAttachment;
           handleChange('attachments', newAttachments);
        } else {
           handleChange('attachments', [...formData.attachments, newAttachment]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.supplierId) {
      alert("Selecione um fornecedor para salvar.");
      return;
    }
    setIsDraftSaving(true);
    try {
      if (onSave) {
        const success = await onSave(formData, formData.supplierId, formData.value);
        if (success) {
           alert("Solicitação salva com sucesso no sistema!");
           onCancel();
        }
      }
    } finally {
      setIsDraftSaving(false);
    }
  };

  const handleFinish = async () => {
    if (!formData.supplierId) {
      alert("Por favor, selecione um fornecedor no Passo 1.");
      setCurrentStep(0);
      return;
    }
    
    setIsSaving(true);
    try {
      // 1. Salva no banco/storage antes de gerar o PDF
      let success = true;
      if (onSave) {
        success = await onSave(formData, formData.supplierId, formData.value);
      }
      
      if (success) {
        // 2. Gera e baixa o PDF
        const supplier = suppliers.find(s => s.id === formData.supplierId);
        const unit = units.find(u => u.id === formData.unitId) || units.find(u => u.name === formData.serviceLocation);
        
        const pdfSuccess = await mergeAndSavePDF(formData, supplier, settings, unit);
        
        if (pdfSuccess) {
          onCancel();
        } else {
           alert("Solicitação salva com sucesso, mas houve um erro ao gerar o arquivo PDF. Você pode tentar baixá-lo novamente na tela de Contratos.");
           onCancel();
        }
      }
    } catch (error: any) {
      console.error("Erro no fluxo de finalização:", error);
      alert(`Erro ao processar solicitação: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <label className="block text-sm font-medium text-gray-700">Fornecedor / CNPJ</label>
            <select className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500" value={formData.supplierId} onChange={(e) => handleChange('supplierId', e.target.value)}>
              <option value="">Selecione um fornecedor...</option>
              {suppliers.map(su => <option key={su.id} value={su.id}>{su.name} - {su.cnpj}</option>)}
            </select>
            <div className="p-4 border border-blue-100 bg-blue-50/30 rounded-2xl space-y-4">
              <label className="text-sm font-bold text-blue-800 flex items-center gap-2"><LinkIcon size={16}/> Vincular Projeto de Engenharia</label>
              <select className="w-full p-2 border border-blue-200 rounded-xl shadow-sm" value={formData.projectId} onChange={(e) => handleProjectSelection(e.target.value)}>
                <option value="">Nenhum projeto selecionado</option>
                {projects.map(pr => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Nº do Pedido</label>
                  <input type="text" className="w-full p-3 border border-gray-300 rounded-xl shadow-sm" value={formData.orderNumber || ''} onChange={e => handleChange('orderNumber', e.target.value)} />
               </div>
               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Local de Prestação (Unidade)</label>
                  <select 
                    className="w-full p-3 border border-gray-300 rounded-xl shadow-sm" 
                    value={formData.unitId} 
                    onChange={e => handleUnitSelection(e.target.value)}
                  >
                    <option value="">Selecione a unidade...</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
               </div>
            </div>
          </div>
        </div>
      );
      case 1: return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">2. Documentação Legal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-4 p-5 border-2 rounded-2xl hover:bg-gray-50 cursor-pointer transition-all">
              <input type="checkbox" className="h-6 w-6 text-primary-600 rounded-lg" checked={formData.docSocialContract} onChange={e => handleChange('docSocialContract', e.target.checked)} />
              <div>
                <span className="block text-sm font-bold text-gray-800">Possui Contrato Social?</span>
                <span className="text-[10px] text-gray-400">Verifique se está assinado e atualizado</span>
              </div>
            </label>
            <label className="flex items-center gap-4 p-5 border-2 rounded-2xl hover:bg-gray-50 cursor-pointer transition-all">
              <input type="checkbox" className="h-6 w-6 text-primary-600 rounded-lg" checked={formData.docSerasa} onChange={e => handleChange('docSerasa', e.target.checked)} />
              <div>
                <span className="block text-sm font-bold text-gray-800">Possui Pesquisas Serasa?</span>
                <span className="text-[10px] text-gray-400">Certidões e consultas financeiras</span>
              </div>
            </label>
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">3. Escopo</h3>
          <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Objeto do Fornecimento</label><input className="w-full p-3 border rounded-xl" value={formData.objectDescription} onChange={e => handleChange('objectDescription', e.target.value)} /></div>
          <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Descrição Detalhada do Escopo</label><textarea rows={6} className="w-full p-3 border rounded-xl" value={formData.scopeDescription} onChange={e => handleChange('scopeDescription', e.target.value)} /></div>
        </div>
      );
      case 3: return (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-800">4. Equipe e Assinantes</h3>
          <div className="p-8 border-2 border-emerald-100 rounded-[3rem] bg-emerald-50/30 shadow-sm transition-all hover:border-emerald-300">
            <div className="flex items-center gap-3 mb-6">
               <div className="p-2 bg-emerald-600 rounded-xl text-white"><ShieldCheck size={20}/></div>
               <div>
                  <h4 className="text-sm font-black text-emerald-800 uppercase tracking-tight">Responsável Técnico (ART/RRT)</h4>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Este nome sairá em destaque no PDF</p>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Nome Completo</label>
                <input className="w-full p-3 text-sm border-0 rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-emerald-500" value={formData.technicalResponsible} onChange={e => handleChange('technicalResponsible', e.target.value)} placeholder="Engenheiro / Técnico Responsável" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">CPF</label>
                <input className="w-full p-3 text-sm border-0 rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-emerald-500" value={formData.technicalResponsibleCpf} onChange={e => handleChange('technicalResponsibleCpf', e.target.value)} placeholder="000.000.000-00" />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Assinantes do Contrato (Prepostos)</h3>
            <button onClick={() => handleChange('prepostos', [...formData.prepostos, {name:'', role:'', email:'', cpf:''}])} className="px-4 py-2 bg-primary-50 text-primary-700 text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-primary-100"><Plus size={14}/> Adicionar Assinante</button>
          </div>
          
          <div className="space-y-4">
            {formData.prepostos.map((p, i) => (
              <div key={i} className="p-6 border-2 border-gray-100 rounded-[2rem] bg-slate-50 relative group transition-all hover:border-primary-200">
                <button onClick={() => handleChange('prepostos', formData.prepostos.filter((_, idx) => idx !== i))} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"><X size={20}/></button>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Nome Completo</label>
                    <input className="w-full p-3 text-sm border-0 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-primary-500" value={p.name} onChange={e => { const n = [...formData.prepostos]; n[i].name = e.target.value; handleChange('prepostos', n); }} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Cargo</label>
                    <input className="w-full p-3 text-sm border-0 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-primary-500" value={p.role} onChange={e => { const n = [...formData.prepostos]; n[i].role = e.target.value; handleChange('prepostos', n); }} placeholder="Ex: Diretor, Gestor..." />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">CPF</label>
                    <input className="w-full p-3 text-sm border-0 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-primary-500" value={p.cpf} onChange={e => { const n = [...formData.prepostos]; n[i].cpf = e.target.value; handleChange('prepostos', n); }} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">E-mail</label>
                    <input className="w-full p-3 text-sm border-0 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-primary-500" value={p.email} onChange={e => { const n = [...formData.prepostos]; n[i].email = e.target.value; handleChange('prepostos', n); }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
      case 5: return (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-800">6. Financeiro e Condições Comerciais</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100">
               <label className="block text-[10px] font-black text-emerald-600 uppercase mb-2">Valor Total do Contrato (R$)</label>
               <input type="number" className="w-full p-4 text-2xl font-black text-emerald-700 bg-transparent border-0 focus:ring-0" value={formData.value} onChange={e => handleChange('value', parseFloat(e.target.value))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Data Início</label>
                <input type="date" className="w-full p-2 bg-transparent border-0 focus:ring-0 text-sm font-bold" value={formData.startDate} onChange={e => handleChange('startDate', e.target.value)} />
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Data Término</label>
                <input type="date" className="w-full p-2 bg-transparent border-0 focus:ring-0 text-sm font-bold" value={formData.endDate} onChange={e => handleChange('endDate', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border-2 border-gray-100 rounded-[2rem] bg-white">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Forma de Pagamento</label>
              <input className="w-full p-3 border rounded-xl" value={formData.paymentTerms} onChange={e => handleChange('paymentTerms', e.target.value)} placeholder="Ex: 30 dias após emissão da nota..." />
            </div>
            <div className="p-6 border-2 border-gray-100 rounded-[2rem] bg-white">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Cronograma de Faturamento</label>
              <input className="w-full p-3 border rounded-xl" value={formData.billingSchedule} onChange={e => handleChange('billingSchedule', e.target.value)} placeholder="Ex: Medição mensal..." />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 border-2 border-gray-100 rounded-[2rem] bg-white">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 flex items-center gap-1"><ShieldCheck size={12}/> CAP / LIMITE</label>
              <input className="w-full p-2 text-sm border-0 rounded-xl bg-slate-50" value={formData.capLimit} onChange={e => handleChange('capLimit', e.target.value)} />
            </div>
            <div className="p-6 border-2 border-gray-100 rounded-[2rem] bg-white">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 flex items-center gap-1"><Coins size={12}/> Índice de Reajuste</label>
              <input className="w-full p-2 text-sm border-0 rounded-xl bg-slate-50" value={formData.correctionIndex} onChange={e => handleChange('correctionIndex', e.target.value)} />
            </div>
            <div className="p-6 border-2 border-gray-100 rounded-[2rem] bg-white">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 flex items-center gap-1"><ShieldCheck size={12}/> Garantias</label>
              <input className="w-full p-2 text-sm border-0 rounded-xl bg-slate-50" value={formData.warranties} onChange={e => handleChange('warranties', e.target.value)} />
            </div>
          </div>
        </div>
      );
      case 6: return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">7. Análise de Risco</h3>
          <p className="text-xs text-red-500 font-bold flex items-center gap-2"><AlertTriangle size={14}/> Descreva pontos de atenção ou urgências críticas</p>
          <textarea rows={8} className="w-full p-5 border-2 border-red-50 rounded-[2.5rem] text-sm bg-red-50/5 focus:ring-red-500 focus:border-red-500 outline-none" value={formData.urgenciesRisks} onChange={e => handleChange('urgenciesRisks', e.target.value)} placeholder="Fatores de risco identificados..."/>
        </div>
      );
      case 7: return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">8. Doc. Obrigatórios (Checklist)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {checklistItems.map(item => (
              <label key={item.id} className="flex items-center gap-4 p-5 border-2 border-gray-50 rounded-2xl cursor-pointer hover:bg-gray-50 transition-all">
                <input type="checkbox" className="h-6 w-6 text-primary-600 rounded-lg border-gray-300" checked={(formData as any)[item.id]} onChange={e => handleChange(item.id as any, e.target.checked)} />
                <span className="text-sm font-bold text-gray-700">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      );
      case 8: return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-800">9. Documentos Anexos</h3>
              <p className="text-xs text-slate-500 font-medium">Arquivos Cadastrais em PDF (Máx 2MB por arquivo).</p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100">
               <FileCheck size={16}/>
               <span className="text-xs font-black">{formData.attachments.length} Arquivos</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[450px] pr-2 scrollbar-thin">
            {attachmentTypes.map(type => {
              const attachment = formData.attachments.find(a => a.type === type);
              const hasFile = !!attachment;
              return (
                <div key={type} className={`p-5 border-2 rounded-[2rem] flex flex-col justify-between min-h-[110px] transition-all group ${hasFile ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-100 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-50'}`}>
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-tight leading-tight ${hasFile ? 'text-emerald-700' : 'text-slate-500 group-hover:text-primary-600'}`}>
                      {type}
                    </span>
                    {hasFile ? <Check className="text-emerald-500 shrink-0" size={18} /> : <div className="w-5 h-5 rounded-full border-2 border-slate-100 shrink-0" />}
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[10px] text-slate-400 font-bold truncate max-w-[150px]">
                        {hasFile ? attachment.name : 'Vazio'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {hasFile && (
                        <button onClick={() => handleChange('attachments', formData.attachments.filter(a => a.type !== type))} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><X size={14} /></button>
                      )}
                      <label className={`p-2.5 rounded-xl cursor-pointer transition-all ${hasFile ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-sm' : 'bg-slate-50 text-slate-400 hover:bg-primary-600 hover:text-white hover:shadow-lg hover:shadow-primary-100'}`}>
                        <Upload size={16} />
                        <input type="file" className="hidden" accept=".pdf" onChange={e => handleFileUpload(e, type)} />
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
      case 9: return (
        <div className="space-y-8">
          <div className="flex items-center gap-6 p-8 bg-emerald-50 text-emerald-700 rounded-[3rem] border border-emerald-100 shadow-inner">
             <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-lg"><FileCheck size={48} /></div>
             <div>
                <h3 className="text-2xl font-black tracking-tighter">Revisão Final</h3>
                <p className="text-sm font-medium text-emerald-600">Verifique os dados abaixo antes de finalizar a emissão do PDF.</p>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="p-6 bg-white border-2 border-gray-100 rounded-[2.5rem] shadow-sm">
                <p className="text-[10px] uppercase font-black text-gray-400 mb-2 tracking-widest">Contratada</p>
                <p className="text-lg font-black text-gray-800">{suppliers.find(s=>s.id===formData.supplierId)?.name || 'Fornecedor não selecionado'}</p>
             </div>
             <div className="p-6 bg-white border-2 border-gray-100 rounded-[2.5rem] shadow-sm">
                <p className="text-[10px] uppercase font-black text-gray-400 mb-2 tracking-widest">Valor do Contrato</p>
                <p className="text-2xl font-black text-emerald-600">R$ {formData.value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
             </div>
          </div>

          <div className="p-8 bg-slate-900 text-white rounded-[3rem] shadow-2xl relative overflow-hidden">
             <div className="absolute -right-10 -bottom-10 opacity-10"><FileText size={200} /></div>
             <p className="text-[10px] uppercase font-black text-slate-500 mb-4 tracking-widest">Dossiê de Anexos: {formData.attachments.length} arquivos</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8">
               {attachmentTypes.map(type => {
                 const att = formData.attachments.find(a => a.type === type);
                 return (
                   <div key={type} className="flex items-center gap-2 text-xs">
                     <div className={`w-2 h-2 rounded-full ${att ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                     <span className={att ? 'text-slate-100' : 'text-slate-600'}>- {type}: <span className="font-bold">{att ? att.name : 'Pendente'}</span></span>
                   </div>
                 );
               })}
             </div>
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col h-[92vh] w-full max-w-6xl mx-auto overflow-hidden animate-in zoom-in-95 duration-500">
      <div className="px-12 py-8 border-b border-gray-50 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div><h2 className="text-3xl font-black text-slate-900 tracking-tighter">Checklist de Contrato</h2><p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Grupo Resinas Brasil • Sistema EcoContract</p></div>
        <button onClick={onCancel} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"><X size={32} /></button>
      </div>
      
      <div className="px-8 py-5 bg-slate-50/50 border-b border-gray-100 flex overflow-x-auto gap-8 no-scrollbar scroll-smooth">
        {steps.map((label, index) => (
          <div key={index} className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group" onClick={() => setCurrentStep(index)}>
            <div className={`w-10 h-10 rounded-[1.25rem] flex items-center justify-center text-[10px] font-black transition-all ${index === currentStep ? 'bg-primary-600 text-white shadow-xl shadow-primary-200 scale-110' : index < currentStep ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-300 border-2 border-slate-100 group-hover:border-primary-200'}`}>
              {index < currentStep ? <Check size={18} strokeWidth={3}/> : index + 1}
            </div>
            <span className={`text-[8px] font-black uppercase tracking-widest ${index === currentStep ? 'text-primary-600' : 'text-slate-400'}`}>{label}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 p-12 overflow-y-auto no-scrollbar">{renderStepContent()}</div>

      <div className="px-12 py-8 border-t border-gray-50 bg-white flex justify-between items-center sticky bottom-0 z-10">
        <div className="flex gap-4">
          <button onClick={handleBack} disabled={currentStep === 0} className="px-8 py-4 rounded-[1.5rem] border-2 border-slate-100 text-sm font-black text-slate-400 disabled:opacity-30 flex items-center gap-2 hover:bg-slate-50 transition-all hover:border-slate-200"><ChevronLeft size={20}/> Voltar</button>
          <button onClick={handleSaveDraft} disabled={isDraftSaving || !formData.supplierId} className="px-8 py-4 rounded-[1.5rem] bg-emerald-50 text-emerald-700 text-sm font-black flex items-center gap-2 hover:bg-emerald-100 transition-all disabled:opacity-30 border-2 border-emerald-100 shadow-sm">{isDraftSaving ? <Loader2 size={20} className="animate-spin"/> : <Save size={20}/>} Salvar Checklist</button>
        </div>
        
        {currentStep === steps.length - 1 ? (
          <button onClick={handleFinish} disabled={isSaving} className="px-12 py-4 bg-primary-600 text-white rounded-[1.5rem] text-sm font-black shadow-2xl shadow-primary-200 flex items-center gap-3 hover:bg-primary-700 transition-all active:scale-95">
            {isSaving ? <><Loader2 size={20} className="animate-spin"/> Finalizando...</> : <><FileText size={20}/> Finalizar e Baixar PDF</>}
          </button>
        ) : (
          <button onClick={handleNext} className="px-12 py-4 bg-slate-900 text-white rounded-[1.5rem] text-sm font-black flex items-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95">Próximo Passo <ChevronRight size={20}/></button>
        )}
      </div>
    </div>
  );
};

export default ContractWizard;
