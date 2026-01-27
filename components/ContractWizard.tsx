
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
  'Contrato Social / Estatuto Social Consolidado',
  'Ata de Eleição / Procuração',
  'Certidão Negativa Federal',
  'Certidão Negativa Estadual',
  'Certidão Negativa Municipal',
  'Certidão Negativa Trabalhista (CNDT)',
  'Certidão de Regularidade FGTS (CRF)',
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
           alert("Rascunho salvo com sucesso!");
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
           alert("Dados salvos no sistema, mas houve um erro ao processar o arquivo PDF. Você pode baixar novamente na lista de contratos.");
           onCancel();
        }
      }
    } catch (error: any) {
      console.error("Erro no fluxo de finalização:", error);
      alert(`Falha ao concluir: ${error.message || 'Erro desconhecido'}`);
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
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl animate-in fade-in slide-in-from-top-2">
                <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <Info size={14} /> Dados da Unidade Vinculada
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-700"><Building size={14} className="text-emerald-500" /><span className="font-bold">{selectedUnit.name}</span></div>
                  <div className="flex items-center gap-2 text-gray-500"><FileText size={14} className="text-emerald-500" /><span>CNPJ: {selectedUnit.cnpj} {selectedUnit.ie ? `| IE: ${selectedUnit.ie}` : ''}</span></div>
                  <div className="md:col-span-2 flex items-start gap-2 text-gray-500 mt-1"><MapPin size={14} className="text-emerald-500 mt-1 shrink-0" /><span className="leading-tight">{selectedUnit.address}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
      case 1: return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">2. Documentação e Compliance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-4 border rounded-xl hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" className="h-5 w-5 text-primary-600" checked={formData.docSocialContract} onChange={e => handleChange('docSocialContract', e.target.checked)} />
              <span className="text-sm font-medium text-gray-700">Contrato Social</span>
            </label>
            <label className="flex items-center gap-3 p-4 border rounded-xl hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" className="h-5 w-5 text-primary-600" checked={formData.docSerasa} onChange={e => handleChange('docSerasa', e.target.checked)} />
              <span className="text-sm font-medium text-gray-700">Pesquisas Serasa/Certidões</span>
            </label>
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">3. Escopo Técnico</h3>
          <div className="space-y-4">
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Objeto do Fornecimento</label><textarea rows={2} className="w-full p-2 border border-gray-300 rounded-md" value={formData.objectDescription} onChange={e => handleChange('objectDescription', e.target.value)} /></div>
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição Detalhada do Escopo</label><textarea rows={8} className="w-full p-2 border border-gray-300 rounded-md" value={formData.scopeDescription} onChange={e => handleChange('scopeDescription', e.target.value)} /></div>
          </div>
        </div>
      );
      case 3: return (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-800">4. Equipe e Responsáveis</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Responsável Técnico (ART/RRT)</label><input type="text" className="w-full p-2 border border-gray-300 rounded-md shadow-sm" value={formData.technicalResponsible} onChange={e => handleChange('technicalResponsible', e.target.value)} /></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">CPF Responsável Técnico</label><input type="text" className="w-full p-2 border border-gray-300 rounded-md shadow-sm" value={formData.technicalResponsibleCpf} onChange={e => handleChange('technicalResponsibleCpf', e.target.value)} /></div>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assinantes do Contrato (Prepostos)</label>
              {formData.prepostos.map((pre, idx) => (
                <div key={idx} className="p-4 border rounded-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 relative bg-gray-50 shadow-sm">
                    <div><input placeholder="Nome" className="w-full p-2 border rounded text-xs bg-white" value={pre.name} onChange={e => { const n = [...formData.prepostos]; n[idx].name = e.target.value; handleChange('prepostos', n); }} /></div>
                    <div><input placeholder="Cargo" className="w-full p-2 border rounded text-xs bg-white" value={pre.role} onChange={e => { const n = [...formData.prepostos]; n[idx].role = e.target.value; handleChange('prepostos', n); }} /></div>
                    <div><input placeholder="CPF" className="w-full p-2 border rounded text-xs bg-white" value={pre.cpf} onChange={e => { const n = [...formData.prepostos]; n[idx].cpf = e.target.value; handleChange('prepostos', n); }} /></div>
                    <div><input placeholder="E-mail" className="w-full p-2 border rounded text-xs bg-white" value={pre.email} onChange={e => { const n = [...formData.prepostos]; n[idx].email = e.target.value; handleChange('prepostos', n); }} /></div>
                    {formData.prepostos.length > 1 && (<button onClick={() => handleChange('prepostos', formData.prepostos.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 bg-white text-red-500 border rounded-full p-1"><X size={14}/></button>)}
                </div>
              ))}
              <button onClick={() => handleChange('prepostos', [...formData.prepostos, {name:'', role:'', email:'', cpf:''}])} className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 p-2"><Plus size={16}/> Adicionar Assinante</button>
            </div>
          </div>
        </div>
      );
      case 4: return (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-800">5. Recursos e Materiais</h3>
          <div className="space-y-4">
             {[
               { field: 'hasMaterials', label: 'Materiais' },
               { field: 'hasRental', label: 'Locação/Equipamentos' },
               { field: 'hasComodato', label: 'Comodato' }
             ].map((item) => (
                <div key={item.field} className="p-4 border rounded-xl bg-white shadow-sm space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="h-5 w-5 accent-primary-600" checked={(formData as any)[item.field]} onChange={e => handleChange(item.field as any, e.target.checked)} /> 
                    <span className="font-bold text-gray-700">Inclui {item.label}?</span>
                  </label>
                  {(formData as any)[item.field] && (
                    <textarea 
                      placeholder={`Descreva os ${item.label.toLowerCase()} envolvidos...`}
                      rows={3} 
                      className="w-full p-3 border rounded-xl text-sm" 
                      value={(formData as any)[item.field.replace('has', '').toLowerCase() + 'List']} 
                      onChange={e => handleChange(item.field.replace('has', '').toLowerCase() + 'List' as any, e.target.value)} 
                    />
                  )}
                </div>
             ))}
          </div>
        </div>
      );
      case 5: return (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-800">6. Condições Comerciais</h3>
          <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest block mb-1">Valor Total Estimado</label><input type="number" className="w-full p-3 bg-white border border-emerald-200 rounded-xl text-xl font-black text-emerald-900" value={formData.value} onChange={e => handleChange('value', parseFloat(e.target.value))}/></div>
            <div><label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest block mb-1">Vigência</label><div className="flex items-center gap-2"><input type="date" className="flex-1 p-3 bg-white border border-emerald-200 rounded-xl text-sm" value={formData.startDate} onChange={e => handleChange('startDate', e.target.value)}/><input type="date" className="flex-1 p-3 bg-white border border-emerald-200 rounded-xl text-sm" value={formData.endDate} onChange={e => handleChange('endDate', e.target.value)}/></div></div>
          </div>
          <div className="grid grid-cols-1 gap-4">
             <div><label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">Forma de Pagamento</label><input type="text" className="w-full p-3 border rounded-xl text-sm" value={formData.paymentTerms} onChange={e => handleChange('paymentTerms', e.target.value)} /></div>
             <div><label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">CAP / Limite</label><input type="text" className="w-full p-3 border rounded-xl text-sm" value={formData.capLimit} onChange={e => handleChange('capLimit', e.target.value)} /></div>
          </div>
        </div>
      );
      case 6: return (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-800">7. Análise de Risco</h3>
          <textarea rows={6} className="w-full p-3 border border-red-100 bg-red-50/20 rounded-xl text-sm" value={formData.urgenciesRisks} onChange={e => handleChange('urgenciesRisks', e.target.value)} placeholder="Descreva aqui pontos de atenção, urgências ou riscos críticos identificados..."/>
        </div>
      );
      case 7: return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">8. Checklist de Documentos Obrigatórios</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {checklistItems.map(item => (
              <label key={item.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="checkbox" className="h-5 w-5 text-primary-600" checked={(formData as any)[item.id]} onChange={e => handleChange(item.id as any, e.target.checked)} />
                <span className="text-sm text-gray-600 font-medium">{item.label}</span>
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
              <p className="text-xs text-slate-500">Formato PDF (máx. 2MB por arquivo). Certidões e atos societários.</p>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">{formData.attachments.length} arquivos</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin">
            {attachmentTypes.map(type => {
              const hasFile = formData.attachments.some(a => a.type === type);
              return (
                <div key={type} className={`p-4 border rounded-2xl flex flex-col justify-between h-32 transition-all ${hasFile ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-100' : 'bg-white border-slate-100 hover:border-primary-300 shadow-sm'}`}>
                  <div className="flex justify-between items-start gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-tighter leading-tight ${hasFile ? 'text-emerald-700' : 'text-slate-500'}`}>{type}</span>
                    {hasFile && <Check className="text-emerald-500 shrink-0" size={14} />}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                      {hasFile ? formData.attachments.find(a => a.type === type)?.name : 'Nenhum arquivo'}
                    </span>
                    <label className={`p-2 rounded-xl cursor-pointer transition-colors ${hasFile ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
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
          <h3 className="text-lg font-bold text-gray-800">10. Revisão e Finalização</h3>
          <div className="bg-white p-8 border rounded-[2rem] shadow-sm text-sm space-y-6">
             <div className="flex items-center gap-4 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
               <FileCheck size={32} />
               <div>
                  <p className="font-black">Pronto para Salvar e Baixar</p>
                  <p className="text-xs">Ao finalizar, os dados serão salvos no banco de dados e o PDF será gerado automaticamente.</p>
               </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-2xl"><p className="text-[10px] uppercase font-bold text-gray-400">Fornecedor Selecionado</p><p className="font-bold">{suppliers.find(s=>s.id===formData.supplierId)?.name || 'Não selecionado'}</p></div>
                <div className="p-4 border rounded-2xl"><p className="text-[10px] uppercase font-bold text-gray-400">Valor Estimado</p><p className="font-bold text-emerald-600">R$ {formData.value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div>
             </div>
          </div>
        </div>
      );
      default: return null;
    }
  };

  const selectedUnit = units.find(u => u.id === formData.unitId);

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col h-[90vh] w-full max-w-5xl mx-auto overflow-hidden animate-in zoom-in-95">
      <div className="px-10 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
        <div><h2 className="text-2xl font-black text-gray-900 tracking-tighter">Solicitação de Contrato</h2><p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Grupo Resinas Brasil</p></div>
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
            {isSaving ? <><Loader2 size={18} className="animate-spin"/> Salvando e Gerando...</> : <><FileText size={18}/> Finalizar e Baixar PDF</>}
          </button>
        ) : (
          <button onClick={handleNext} className="px-10 py-3 bg-gray-900 text-white rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-black transition-all">Próximo <ChevronRight size={18}/></button>
        )}
      </div>
    </div>
  );
};

export default ContractWizard;
