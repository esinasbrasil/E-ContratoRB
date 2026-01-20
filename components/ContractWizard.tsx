
import React, { useState, useEffect } from 'react';
import { Supplier, Project, Preposto, ContractRequestData, Unit, CompanySettings, ContractAttachment, LaborDetail } from '../types';
import { Check, ChevronRight, ChevronLeft, FileText, AlertCircle, Wand2, Plus, Trash2, Calendar, DollarSign, Upload, Paperclip, Users, Scale, FileCheck, HardHat, Building, Briefcase, Info, Link as LinkIcon, Loader2, Tag } from 'lucide-react';
import { generateContractClause } from '../services/geminiService';
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
  'Aspectos Jurídicos',
  'Doc. Obrigatórios',
  'Anexos',
  'Segurança & RH',
  'Revisão'
];

const companyDocs = [
  'PGR – Programa de Gerenciamento de Riscos',
  'PCMSO – Programa de Controle Médico',
  'ALVARÁ DE FUNCIONAMENTO',
  'CARTÃO CNPJ',
  'CND - Certidão negativa de débitos federais',
  'CNDT - Certidão negativa de débitos trabalhistas',
  'CRF - Certificado de Regularidade do FGTS',
  'Lista de funcionários prestadores'
];

const employeeDocs = [
  'ASO – Atestado de Saúde Ocupacional',
  'Ficha de EPI',
  'Registro dos colaboradores',
  'OS – Ordem de Serviço de Segurança',
  'Qualificação/Treinamento (NR10, NR33, NR35)'
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
  const [aiGenerating, setAiGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<ContractRequestData>({
    supplierId: preSelectedSupplierId || '',
    projectId: '',
    orderNumber: '',
    supplierBranches: 'Não aplicável',
    serviceLocation: '',
    serviceType: '',
    
    docSocialContract: false,
    docSerasa: false,
    
    objectDescription: '',
    scopeDescription: '',
    
    prepostos: [{ name: '', role: '', email: '' }],
    technicalResponsible: '',
    
    hasMaterials: false,
    materialsList: '',
    hasEquipment: false,
    equipmentList: '',
    hasRental: false,
    rentalList: '',
    hasLabor: false,
    laborDetails: [],
    
    startDate: '',
    endDate: '',
    scheduleSteps: '',
    value: 0,
    paymentTerms: '',
    capLimit: 'Não aplicável',
    correctionIndex: 'Não aplicável',
    warranties: '',
    
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
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    if (formData.supplierId && !initialData) {
      const supplier = suppliers.find(s => s.id === formData.supplierId);
      if (supplier) {
        setFormData(prev => ({
          ...prev,
          serviceType: supplier.serviceType,
        }));
      }
    }
  }, [formData.supplierId, suppliers, initialData]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleChange = (field: keyof ContractRequestData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProjectSelection = (projectId: string) => {
    handleChange('projectId', projectId);
    
    if (!projectId) return;

    const project = projects.find(p => p.id === projectId);
    if (project) {
        setFormData(prev => ({
            ...prev,
            projectId: projectId,
            orderNumber: prev.orderNumber || project.orderNumber || '',
            objectDescription: prev.objectDescription || project.name,
            scopeDescription: prev.scopeDescription || project.description,
            startDate: prev.startDate || project.startDate,
            endDate: prev.endDate || project.endDate,
            value: prev.value || project.estimatedValue,
            serviceLocation: units.find(u => u.id === project.unitId)?.name || prev.serviceLocation
        }));
    }
  };

  const handleAiDraft = async (field: keyof ContractRequestData, contextStep: string) => {
    setAiGenerating(true);
    const clause = await generateContractClause(contextStep, formData);
    handleChange(field, clause);
    setAiGenerating(false);
  };

  const updatePreposto = (index: number, field: keyof Preposto, value: string) => {
    const newPrepostos = [...formData.prepostos];
    newPrepostos[index] = { ...newPrepostos[index], [field]: value };
    handleChange('prepostos', newPrepostos);
  };

  const addPreposto = () => {
    handleChange('prepostos', [...formData.prepostos, { name: '', role: '', email: '' }]);
  };

  const removePreposto = (index: number) => {
    const newPrepostos = formData.prepostos.filter((_, i) => i !== index);
    handleChange('prepostos', newPrepostos);
  };

  const addLaborDetail = () => {
    handleChange('laborDetails', [...formData.laborDetails, { role: '', quantity: 1 }]);
  };

  const updateLaborDetail = (index: number, field: keyof LaborDetail, value: any) => {
    const newLabor = [...formData.laborDetails];
    newLabor[index] = { ...newLabor[index], [field]: value };
    handleChange('laborDetails', newLabor);
  };

  const removeLaborDetail = (index: number) => {
    const newLabor = formData.laborDetails.filter((_, i) => i !== index);
    handleChange('laborDetails', newLabor);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert("Por favor, anexe apenas arquivos PDF.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const existingIndex = formData.attachments.findIndex(a => a.type === type);
        const newAttachment: ContractAttachment = {
          name: file.name,
          type: type,
          fileData: base64
        };

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

  const removeAttachment = (index: number) => {
    const newAttachments = formData.attachments.filter((_, i) => i !== index);
    handleChange('attachments', newAttachments);
  };

  const getAttachmentStatus = (type: string) => {
    return formData.attachments.some(a => a.type === type);
  };

  const handleFinish = async () => {
      if (isSaving) return;
      setIsSaving(true);
      const supplier = suppliers.find(s => s.id === formData.supplierId);
      try {
        let saveSuccessful = true;
        if (onSave) {
          const result = await onSave(formData, formData.supplierId, formData.value);
          if (result === false) saveSuccessful = false;
        }
        if (saveSuccessful) {
          await mergeAndSavePDF(formData, supplier, settings);
          onCancel();
        }
      } catch (error) {
        console.error("Erro no processo de salvamento:", error);
        alert("Ocorreu um erro ao finalizar o processo. Tente novamente.");
      } finally {
        setIsSaving(false);
      }
  };

  const renderStepContent = () => {
    const selectedSupplier = suppliers.find(s => s.id === formData.supplierId);
    const selectedProject = projects.find(p => p.id === formData.projectId);

    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">1. Dados do Fornecedor e Projeto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Fornecedor / CNPJ</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-primary-500 focus:ring-primary-500"
                  value={formData.supplierId}
                  onChange={(e) => handleChange('supplierId', e.target.value)}
                  disabled={!!initialData}
                >
                  <option value="">Selecione um fornecedor...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - {s.cnpj}</option>
                  ))}
                </select>
              </div>

              {selectedSupplier && (
                <>
                  <div className="bg-gray-50 p-3 rounded-md col-span-2 border border-gray-200 text-sm">
                    <p><strong>Endereço:</strong> {selectedSupplier.address}</p>
                    <p><strong>CNPJ:</strong> {selectedSupplier.cnpj}</p>
                  </div>

                  <div className="col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <label className="block text-sm font-bold text-blue-900 mb-1 flex items-center">
                        <LinkIcon size={16} className="mr-2"/>
                        Vincular Projeto de Engenharia (Sincronismo)
                    </label>
                    <select
                      className="mt-1 block w-full rounded-md border-blue-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500"
                      value={formData.projectId}
                      onChange={(e) => handleProjectSelection(e.target.value)}
                    >
                      <option value="">Selecione um projeto para importar dados (Opcional)</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>
                            {p.name} ({p.status === 'Active' ? 'Ativo' : 'Planejado'})
                        </option>
                      ))}
                    </select>
                    
                    {selectedProject && (
                        <div className="mt-3 text-xs text-blue-800 space-y-1">
                            <p className="font-semibold flex items-center"><Info size={12} className="mr-1"/> Dados importados da Engenharia:</p>
                            <ul className="list-disc list-inside pl-2">
                                <li>Centro de Custo: {selectedProject.costCenter}</li>
                                <li className="font-bold">Número do Pedido: {selectedProject.orderNumber || 'NÃO INFORMADO'}</li>
                                <li>Valor (BID): R$ {selectedProject.estimatedValue.toLocaleString('pt-BR')}</li>
                                <li>Prazo: {selectedProject.startDate ? new Date(selectedProject.startDate).toLocaleDateString() : '?'} a {selectedProject.endDate ? new Date(selectedProject.endDate).toLocaleDateString() : '?'}</li>
                                {selectedProject.requiredNRs && selectedProject.requiredNRs.length > 0 && (
                                    <li className="font-bold text-red-600">
                                        NRs Exigidas: {selectedProject.requiredNRs.map(nr => nr.toUpperCase().replace('NR', '')).join(', ')}
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 col-span-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nº do Pedido</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Tag size={16} className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          className="block w-full pl-10 rounded-md border-gray-300 shadow-sm p-2 border focus:border-primary-500 focus:ring-primary-500"
                          value={formData.orderNumber || ''}
                          onChange={(e) => handleChange('orderNumber', e.target.value)}
                          placeholder="Ex: 4500012345"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tipo de Serviço</label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-primary-500 focus:ring-primary-500 bg-gray-50"
                        value={formData.serviceType}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Filiais envolvidas (com CNPJs)</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-primary-500 focus:ring-primary-500"
                      value={formData.supplierBranches}
                      onChange={(e) => handleChange('supplierBranches', e.target.value)}
                      placeholder="Ex: Não aplicável"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Local de Prestação (Unidade)</label>
                    <input
                      type="text"
                      list="registered-units"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-primary-500 focus:ring-primary-500"
                      value={formData.serviceLocation}
                      onChange={(e) => handleChange('serviceLocation', e.target.value)}
                      placeholder="Busque por uma unidade cadastrada..."
                    />
                    <datalist id="registered-units">
                        {units.map(u => <option key={u.id} value={u.name} />)}
                    </datalist>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">2. Documentação Legal</h3>
            <div className="space-y-4">
              <div className="flex items-start p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center h-5">
                  <input
                    id="docSocial"
                    type="checkbox"
                    checked={formData.docSocialContract}
                    onChange={(e) => handleChange('docSocialContract', e.target.checked)}
                    className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="docSocial" className="font-medium text-gray-700">Contrato Social</label>
                  <p className="text-gray-500">Confirmar se o documento está anexo e é a última alteração consolidada.</p>
                </div>
              </div>
              <div className="flex items-start p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center h-5">
                  <input
                    id="docSerasa"
                    type="checkbox"
                    checked={formData.docSerasa}
                    onChange={(e) => handleChange('docSerasa', e.target.checked)}
                    className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="docSerasa" className="font-medium text-gray-700">Pesquisas / Documentos (Serasa/Certidões)</label>
                  <p className="text-gray-500">Confirmar a situação cadastral e financeira do fornecedor.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">3. Objeto e Escopo</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Objeto de Fornecimento</label>
              <textarea
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-primary-500 focus:ring-primary-500"
                value={formData.objectDescription}
                onChange={(e) => handleChange('objectDescription', e.target.value)}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Escopo Detalhado</label>
                <button 
                  onClick={() => handleAiDraft('scopeDescription', `Detalhe o escopo para: ${formData.objectDescription}`)}
                  disabled={aiGenerating}
                  className="flex items-center text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
                >
                  <Wand2 size={14} className="mr-1" />
                  IA: Sugerir Escopo
                </button>
              </div>
              <textarea
                rows={8}
                className="block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-primary-500 focus:ring-primary-500"
                value={formData.scopeDescription}
                onChange={(e) => handleChange('scopeDescription', e.target.value)}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">4. Equipe e Responsáveis</h3>
            <div>
               <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center">
                 <Users size={16} className="mr-2 text-primary-600"/> Representantes Legais
               </h4>
               {formData.prepostos.map((p, idx) => (
                 <div key={idx} className="flex flex-col md:flex-row gap-2 mb-3 items-start bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <input placeholder="Nome" value={p.name} onChange={(e) => updatePreposto(idx, 'name', e.target.value)} className="flex-1 rounded-md border-gray-300 p-2 border text-sm" />
                    <input placeholder="Cargo" value={p.role} onChange={(e) => updatePreposto(idx, 'role', e.target.value)} className="flex-1 rounded-md border-gray-300 p-2 border text-sm" />
                    <input placeholder="E-mail" value={p.email} onChange={(e) => updatePreposto(idx, 'email', e.target.value)} className="flex-1 rounded-md border-gray-300 p-2 border text-sm" />
                    {formData.prepostos.length > 1 && (
                      <button onClick={() => removePreposto(idx)} className="text-red-500 p-2 hover:bg-red-50 rounded">
                        <Trash2 size={16} />
                      </button>
                    )}
                 </div>
               ))}
               <button onClick={addPreposto} className="flex items-center text-sm text-primary-600 hover:text-primary-800 font-medium">
                 <Plus size={16} className="mr-1" /> Adicionar Assinante
               </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">5. Recursos</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input type="checkbox" checked={formData.hasMaterials} onChange={(e) => handleChange('hasMaterials', e.target.checked)} className="h-4 w-4 text-primary-600 border-gray-300 rounded" />
                <label className="ml-2 block text-sm font-medium text-gray-900">Há materiais inclusos?</label>
              </div>
              {formData.hasMaterials && <textarea className="block w-full rounded-md border-gray-300 p-2 border text-sm" value={formData.materialsList} onChange={(e) => handleChange('materialsList', e.target.value)} />}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">6. Financeiro</h3>
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700">Início</label>
                 <input type="date" className="block w-full rounded-md border-gray-300 border p-2" value={formData.startDate} onChange={(e) => handleChange('startDate', e.target.value)} />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700">Fim</label>
                 <input type="date" className="block w-full rounded-md border-gray-300 border p-2" value={formData.endDate} onChange={(e) => handleChange('endDate', e.target.value)} />
               </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Valor (R$)</label>
              <input type="number" className="block w-full rounded-md border-gray-300 border p-2" value={formData.value} onChange={(e) => handleChange('value', parseFloat(e.target.value))} />
            </div>
          </div>
        );

      case 10:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">11. Revisão</h3>
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 space-y-4 text-sm text-gray-800">
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-500 uppercase text-xs">Fornecedor</h4>
                    <p className="font-medium text-lg">{selectedSupplier?.name || "N/A"}</p>
                    <p>CNPJ: {selectedSupplier?.cnpj}</p>
                    <p>Local: {formData.serviceLocation}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-500 uppercase text-xs">Identificação do Pedido</h4>
                    <p className="font-medium text-lg text-primary-700 flex items-center">
                      <Tag size={18} className="mr-2" />
                      Pedido: {formData.orderNumber || 'NÃO INFORMADO'}
                    </p>
                    <p className="mt-2 font-semibold text-gray-500 uppercase text-xs">Valores</p>
                    <p className="font-medium">R$ {formData.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
               </div>
               <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-gray-500 uppercase text-xs mb-1">Objeto</h4>
                  <p>{formData.objectDescription}</p>
               </div>
            </div>
          </div>
        );

      default:
        return <div>Etapa não configurada</div>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-gray-100 flex flex-col h-[85vh] w-full max-w-5xl mx-auto overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h2 className="text-xl font-bold text-primary-900">Nova Solicitação</h2>
        <button onClick={onCancel}>&times;</button>
      </div>
      <div className="px-6 py-4 bg-white border-b border-gray-100 flex overflow-x-auto gap-4">
            {steps.map((label, index) => (
                <div key={index} className={`flex-shrink-0 text-xs font-bold ${index === currentStep ? 'text-primary-700 underline' : 'text-gray-400'}`}>
                    {index + 1}. {label}
                </div>
            ))}
      </div>
      <div className="flex-1 p-8 overflow-y-auto bg-gray-50/50">
           {renderStepContent()}
      </div>
      <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-between items-center">
        <button onClick={handleBack} disabled={currentStep === 0} className="px-5 py-2.5 rounded-lg border border-gray-300">Voltar</button>
        {currentStep === steps.length - 1 ? (
             <button onClick={handleFinish} className="px-6 py-2.5 bg-primary-600 text-white rounded-lg">Finalizar</button>
        ) : (
            <button onClick={handleNext} className="px-6 py-2.5 bg-primary-600 text-white rounded-lg">Próximo</button>
        )}
      </div>
    </div>
  );
};

export default ContractWizard;
