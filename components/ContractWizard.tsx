
import React, { useState, useEffect } from 'react';
import { Supplier, Project, Preposto, ContractRequestData, Unit, CompanySettings, ContractAttachment, LaborDetail } from '../types';
import { Check, ChevronRight, ChevronLeft, FileText, Plus, Upload, Building, Info, Link as LinkIcon, Loader2, X, Save, MapPin, FileCheck, AlertTriangle } from 'lucide-react';
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

const attachmentTypes = [
  'Certidão negativa de débitos ou Positiva com Efeitos de Negativa no âmbito Federal',
  'Certidão negativa de débitos ou Positiva com Efeitos de Negativa no âmbito Estadual',
  'Certidão negativa de débitos ou Positiva com Efeitos de Negativa no âmbito Municipal',
  'Certidão negativa de débitos trabalhistas',
  'Certidão de Regularidade de FGTS',
  'Última alteração do Contrato/Estatuto Social consolidado ou atos societários atualizados',
  'Ata de Eleição de Diretoria e/ou Procuração Pública/Privada com poderes para assinatura de Contratos',
  'Relatório Serasa',
  'Orçamento Detalhado'
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

  // Fix: Added missing handleUnitSelection function to update unitId and serviceLocation.
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
      alert("Selecione um fornecedor para salvar o rascunho.");
      return;
    }
    setIsDraftSaving(true);
    try {
      if (onSave) {
        const success = await onSave(formData, formData.supplierId, formData.value);
        if (success) {
           alert("Solicitação salva como rascunho. Você pode editá-la na lista de contratos.");
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
      let success = true;
      if (onSave) {
        success = await onSave(formData, formData.supplierId, formData.value);
      }
      
      if (success) {
        const supplier = suppliers.find(s => s.id === formData.supplierId);
        const unit = units.find(u => u.id === formData.unitId) || units.find(u => u.name === formData.serviceLocation);
        
        const pdfSuccess = await mergeAndSavePDF(formData, supplier, settings, unit);
        
        if (pdfSuccess) {
          onCancel();
        } else {
           alert("Contrato salvo, mas houve um erro ao gerar o PDF. Você pode tentar baixar novamente na lista de contratos.");
           onCancel();
        }
      }
    } catch (error: any) {
      console.error("Erro no fluxo de finalização:", error);
      alert(`Erro ao salvar contrato: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedUnit = units.find(u => u.id === formData.unitId);

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <label className="block text-sm font-medium text-gray-700">Fornecedor / CNPJ</label>
            <select className="w-full p-2 border border-gray-300 rounded-md shadow-sm" value={formData.supplierId} onChange={(e) => handleChange('supplierId', e.target.value)}>
              <option value="">Selecione um fornecedor...</option>
              {suppliers.map(su => <option key={su.id} value={su.id}>{su.name} - {su.cnpj}</option>)}
            </select>
            <div className="p-4 border border-blue-100 bg-blue-50/30 rounded-lg space-y-4">
              <label className="text-sm font-bold text-blue-800 flex items-center gap-2"><LinkIcon size={16}/> Vincular Projeto de Engenharia</label>
              <select className="w-full p-2 border border-blue-200 rounded-md shadow-sm" value={formData.projectId} onChange={(e) => handleProjectSelection(e.target.value)}>
                <option value="">Nenhum projeto selecionado</option>
                {projects.map(pr => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Nº do Pedido</label>
                  <input type="text" className="w-full p-2 border border-gray-300 rounded-md shadow-sm" value={formData.orderNumber || ''} onChange={e => handleChange('orderNumber', e.target.value)} />
               </div>
               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Local de Prestação (Unidade)</label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm" 
                    value={formData.unitId} 
                    onChange={e => handleUnitSelection(e.target.value)}
                  >
                    <option value="">Selecione a unidade...</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
               </div>
            </div>
            {selectedUnit && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <Info size={14} /> Dados da Unidade
                </h4>
                <div className="text-sm">
                  <p className="font-bold text-gray-700">{selectedUnit.name}</p>
                  <p className="text-gray-500">CNPJ: {selectedUnit.cnpj} | Endereço: {selectedUnit.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      );
      case 1: return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">2. Documentação Legal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-4 border rounded-xl hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" className="h-5 w-5 text-primary-600" checked={formData.docSocialContract} onChange={e => handleChange('docSocialContract', e.target.checked)} />
              <span className="text-sm font-medium text-gray-700">Possui Contrato Social?</span>
            </label>
            <label className="flex items-center gap-3 p-4 border rounded-xl hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" className="h-5 w-5 text-primary-600" checked={formData.docSerasa} onChange={e => handleChange('docSerasa', e.target.checked)} />
              <span className="text-sm font-medium text-gray-700">Possui Pesquisas Serasa/Certidões?</span>
            </label>
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">3. Escopo</h3>
          <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Objeto</label><input className="w-full p-2 border rounded" value={formData.objectDescription} onChange={e => handleChange('objectDescription', e.target.value)} /></div>
          <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição Detalhada</label><textarea rows={6} className="w-full p-2 border rounded" value={formData.scopeDescription} onChange={e => handleChange('scopeDescription', e.target.value)} /></div>
        </div>
      );
      case 3: return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">4. Equipe</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-gray-500 uppercase">Resp. Técnico</label><input className="w-full p-2 border rounded" value={formData.technicalResponsible} onChange={e => handleChange('technicalResponsible', e.target.value)} /></div>
            <div><label className="block text-xs font-bold text-gray-500 uppercase">CPF Resp. Técnico</label><input className="w-full p-2 border rounded" value={formData.technicalResponsibleCpf} onChange={e => handleChange('technicalResponsibleCpf', e.target.value)} /></div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Assinantes (Prepostos)</label>
            {formData.prepostos.map((p, i) => (
              <div key={i} className="flex gap-2 mb-2 p-2 border rounded bg-gray-50">
                <input placeholder="Nome" className="flex-1 p-1 text-xs" value={p.name} onChange={e => { const n = [...formData.prepostos]; n[i].name = e.target.value; handleChange('prepostos', n); }} />
                <input placeholder="CPF" className="w-32 p-1 text-xs" value={p.cpf} onChange={e => { const n = [...formData.prepostos]; n[i].cpf = e.target.value; handleChange('prepostos', n); }} />
                <button onClick={() => handleChange('prepostos', formData.prepostos.filter((_, idx) => idx !== i))} className="text-red-500"><X size={14}/></button>
              </div>
            ))}
            <button onClick={() => handleChange('prepostos', [...formData.prepostos, {name:'', role:'', email:'', cpf:''}])} className="text-xs text-blue-600 flex items-center gap-1 mt-2"><Plus size={14}/> Adicionar Assinante</button>
          </div>
        </div>
      );
      case 4: return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">5. Recursos</h3>
          {['Materials', 'Rental', 'Comodato'].map(type => (
            <div key={type} className="p-3 border rounded-lg">
              <label className="flex items-center gap-2 mb-2 font-bold text-sm">
                <input type="checkbox" checked={(formData as any)[`has${type}`]} onChange={e => handleChange(`has${type}` as any, e.target.checked)} /> Inclui {type}?
              </label>
              {(formData as any)[`has${type}`] && <textarea className="w-full p-2 text-sm border rounded" value={(formData as any)[`${type.toLowerCase()}List`]} onChange={e => handleChange(`${type.toLowerCase()}List` as any, e.target.value)} />}
            </div>
          ))}
        </div>
      );
      case 5: return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">6. Financeiro</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-gray-500 uppercase">Valor Total (R$)</label><input type="number" className="w-full p-2 border rounded" value={formData.value} onChange={e => handleChange('value', parseFloat(e.target.value))} /></div>
            <div className="flex gap-2">
              <div className="flex-1"><label className="block text-xs font-bold text-gray-500 uppercase">Início</label><input type="date" className="w-full p-2 border rounded" value={formData.startDate} onChange={e => handleChange('startDate', e.target.value)} /></div>
              <div className="flex-1"><label className="block text-xs font-bold text-gray-500 uppercase">Término</label><input type="date" className="w-full p-2 border rounded" value={formData.endDate} onChange={e => handleChange('endDate', e.target.value)} /></div>
            </div>
          </div>
          <div><label className="block text-xs font-bold text-gray-500 uppercase">Pagamento</label><input className="w-full p-2 border rounded" value={formData.paymentTerms} onChange={e => handleChange('paymentTerms', e.target.value)} /></div>
        </div>
      );
      case 6: return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">7. Análise de Risco</h3>
          <textarea rows={6} className="w-full p-3 border rounded text-sm bg-red-50/10" value={formData.urgenciesRisks} onChange={e => handleChange('urgenciesRisks', e.target.value)} placeholder="Descreva os riscos identificados..."/>
        </div>
      );
      case 7: return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">8. Doc. Obrigatórios</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {checklistItems.map(item => (
              <label key={item.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" className="h-5 w-5 text-primary-600" checked={(formData as any)[item.id]} onChange={e => handleChange(item.id as any, e.target.checked)} />
                <span className="text-sm font-medium">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      );
      case 8: return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-800">9. Anexos</h3>
              <p className="text-xs text-slate-500">Envio opcional de certidões e documentos em PDF (máx. 2MB).</p>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">{formData.attachments.length} arquivos</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin">
            {attachmentTypes.map(type => {
              const hasFile = formData.attachments.some(a => a.type === type);
              return (
                <div key={type} className={`p-4 border rounded-2xl flex flex-col justify-between h-40 transition-all ${hasFile ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 shadow-sm'}`}>
                  <div className="flex justify-between items-start gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-tighter leading-tight ${hasFile ? 'text-emerald-700' : 'text-slate-500'}`}>{type}</span>
                    {hasFile && <Check className="text-emerald-500 shrink-0" size={14} />}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                      {hasFile ? formData.attachments.find(a => a.type === type)?.name : 'Nenhum arquivo'}
                    </span>
                    <label className={`p-2 rounded-xl cursor-pointer ${hasFile ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      <Upload size={14} />
                      <input type="file" className="hidden" accept=".pdf" onChange={e => handleFileUpload(e, type)} />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
      case 9: return (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-800">10. Revisão Final</h3>
          <div className="bg-white p-8 border rounded-[2rem] shadow-sm text-sm space-y-6">
             <div className="flex items-center gap-4 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
               <FileCheck size={32} />
               <div>
                  <p className="font-black">Pronto para Finalizar</p>
                  <p className="text-xs text-emerald-600">Ao clicar em Finalizar, o contrato será salvo no banco e o download do PDF será iniciado.</p>
               </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-2xl"><p className="text-[10px] uppercase font-bold text-gray-400">Fornecedor</p><p className="font-bold">{suppliers.find(s=>s.id===formData.supplierId)?.name || 'N/A'}</p></div>
                <div className="p-4 border rounded-2xl"><p className="text-[10px] uppercase font-bold text-gray-400">Total</p><p className="font-bold text-emerald-600">R$ {formData.value.toLocaleString('pt-BR')}</p></div>
             </div>
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col h-[90vh] w-full max-w-5xl mx-auto overflow-hidden animate-in zoom-in-95">
      <div className="px-10 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
        <div><h2 className="text-2xl font-black text-gray-900 tracking-tighter">Wizard de Contrato</h2><p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Grupo Resinas Brasil</p></div>
        <button onClick={onCancel} className="p-1 text-gray-300 hover:text-red-500 transition-colors"><X size={28} /></button>
      </div>
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex overflow-x-auto gap-8 no-scrollbar scroll-smooth">
        {steps.map((label, index) => (
          <div key={index} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer" onClick={() => setCurrentStep(index)}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${index === currentStep ? 'bg-primary-600 text-white shadow-lg' : index < currentStep ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'}`}>
              {index < currentStep ? <Check size={14}/> : index + 1}
            </div>
            <span className={`text-[8px] font-black uppercase tracking-tighter ${index === currentStep ? 'text-primary-600' : 'text-gray-400'}`}>{label}</span>
          </div>
        ))}
      </div>
      <div className="flex-1 p-10 overflow-y-auto">{renderStepContent()}</div>
      <div className="px-10 py-6 border-t border-gray-100 bg-white flex justify-between items-center">
        <div className="flex gap-2">
          <button onClick={handleBack} disabled={currentStep === 0} className="px-6 py-3 rounded-2xl border-2 border-gray-100 text-sm font-bold text-gray-400 disabled:opacity-30 flex items-center gap-2 hover:bg-gray-50 transition-all"><ChevronLeft size={18}/> Voltar</button>
          <button onClick={handleSaveDraft} disabled={isDraftSaving || !formData.supplierId} className="px-6 py-3 rounded-2xl border-2 border-emerald-100 text-emerald-600 text-sm font-bold flex items-center gap-2 hover:bg-emerald-50 transition-all disabled:opacity-30">{isDraftSaving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} Salvar Rascunho</button>
        </div>
        {currentStep === steps.length - 1 ? (
          <button onClick={handleFinish} disabled={isSaving} className="px-10 py-3 bg-primary-600 text-white rounded-2xl text-sm font-bold shadow-xl shadow-primary-100 flex items-center gap-2 hover:bg-primary-700 transition-all">
            {isSaving ? <><Loader2 size={18} className="animate-spin"/> Salvando...</> : <><FileText size={18}/> Finalizar e Baixar</>}
          </button>
        ) : (
          <button onClick={handleNext} className="px-10 py-3 bg-gray-900 text-white rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-black transition-all">Próximo <ChevronRight size={18}/></button>
        )}
      </div>
    </div>
  );
};

export default ContractWizard;
