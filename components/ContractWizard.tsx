import React, { useState, useEffect } from 'react';
import { Supplier, Project, Preposto, ContractRequestData, Unit, CompanySettings, ContractAttachment, LaborDetail } from '../types';
import { Check, ChevronRight, ChevronLeft, FileText, AlertCircle, Wand2, Plus, Trash2, Calendar, DollarSign, Upload, Paperclip, Users, Scale, FileCheck, HardHat, Building, Briefcase, Info, Link as LinkIcon, Loader2 } from 'lucide-react';
import { generateContractClause } from '../services/geminiService';
import { mergeAndSavePDF } from '../services/pdfService';

interface ContractWizardProps {
  suppliers: Supplier[];
  projects: Project[];
  units: Unit[];
  settings: CompanySettings;
  preSelectedSupplierId?: string;
  initialData?: ContractRequestData; // For editing
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

// Safety and HR Document Lists
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

    // Legal Aspects
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

    // Mandatory Documents Checklist (New)
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

  // Load initial data for editing
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Effect to pre-fill data when supplier is selected (only if not editing)
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

  // SYNC LOGIC: When a project is selected, pull data from Engineering
  const handleProjectSelection = (projectId: string) => {
    handleChange('projectId', projectId);
    
    if (!projectId) return;

    const project = projects.find(p => p.id === projectId);
    if (project) {
        // Auto-fill fields from Engineering Data if they are empty or to update context
        setFormData(prev => ({
            ...prev,
            projectId: projectId,
            // Pre-fill Object with Project Name
            objectDescription: prev.objectDescription || project.name,
            // Pre-fill Scope with Project Description
            scopeDescription: prev.scopeDescription || project.description,
            // Pre-fill Dates
            startDate: prev.startDate || project.startDate,
            endDate: prev.endDate || project.endDate,
            // Pre-fill Value (Budget/Estimate)
            value: prev.value || project.estimatedValue,
            // Try to match unit name
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

  // Labor Handlers
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
        // Check if attachment of this type already exists, if so, replace it, otherwise add new
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
      if (isSaving) return; // Prevent double clicks
      
      setIsSaving(true);
      const supplier = suppliers.find(s => s.id === formData.supplierId);
      
      try {
        let saveSuccessful = true;
        
        // Save if handler provided
        if (onSave) {
          const result = await onSave(formData, formData.supplierId, formData.value);
          if (result === false) {
             saveSuccessful = false;
          }
        }

        // Only proceed if save was successful or no onSave handler provided
        if (saveSuccessful) {
          // Generate PDF locally for immediate feedback
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
    // ... existing render logic ...
    const selectedSupplier = suppliers.find(s => s.id === formData.supplierId);
    const selectedProject = projects.find(p => p.id === formData.projectId);

    switch (currentStep) {
      case 0: // Fornecedor e Local
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
                  disabled={!!initialData} // Lock supplier on edit
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

                  {/* PROJECT SYNC SECTION */}
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
                                <li>Valor (BID): R$ {selectedProject.estimatedValue.toLocaleString('pt-BR')}</li>
                                <li>Prazo: {new Date(selectedProject.startDate).toLocaleDateString()} a {new Date(selectedProject.endDate).toLocaleDateString()}</li>
                                {selectedProject.requiredNRs && selectedProject.requiredNRs.length > 0 && (
                                    <li className="font-bold text-red-600">
                                        NRs Exigidas: {selectedProject.requiredNRs.map(nr => nr.toUpperCase().replace('NR', '')).join(', ')}
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}
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

                  <div>
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Serviço</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-primary-500 focus:ring-primary-500 bg-gray-50"
                      value={formData.serviceType}
                      readOnly
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 1: // Legal
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">2. Documentação Legal</h3>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                Confirme o recebimento e validade dos documentos obrigatórios para a elaboração da minuta.
              </p>
            </div>
            
            <div className="space-y-4 mt-4">
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

      case 2: // Escopo
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">3. Objeto e Escopo</h3>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Objeto de Fornecimento</label>
              </div>
              <textarea
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-primary-500 focus:ring-primary-500"
                value={formData.objectDescription}
                onChange={(e) => handleChange('objectDescription', e.target.value)}
                placeholder="Ex: Execução de rampa lateral e acesso..."
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
                  {aiGenerating ? 'Gerando...' : 'IA: Sugerir Escopo'}
                </button>
              </div>
              <textarea
                rows={8}
                className="block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-primary-500 focus:ring-primary-500"
                value={formData.scopeDescription}
                onChange={(e) => handleChange('scopeDescription', e.target.value)}
                placeholder="Descreva detalhadamente as atividades, entregáveis e limites do escopo..."
              />
            </div>
          </div>
        );

      case 3: // Equipe
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">4. Equipe e Responsáveis</h3>
            
            <div>
               <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center">
                 <Users size={16} className="mr-2 text-primary-600"/>
                 Representantes Legais (Assinantes)
               </h4>
               {formData.prepostos.map((p, idx) => (
                 <div key={idx} className="flex flex-col md:flex-row gap-2 mb-3 items-start bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <input 
                      placeholder="Nome Completo"
                      value={p.name}
                      onChange={(e) => updatePreposto(idx, 'name', e.target.value)}
                      className="flex-1 rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                    />
                    <input 
                      placeholder="Cargo / Função"
                      value={p.role}
                      onChange={(e) => updatePreposto(idx, 'role', e.target.value)}
                      className="flex-1 rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                    />
                    <input 
                      placeholder="E-mail"
                      value={p.email}
                      onChange={(e) => updatePreposto(idx, 'email', e.target.value)}
                      className="flex-1 rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                    />
                    {formData.prepostos.length > 1 && (
                      <button onClick={() => removePreposto(idx)} className="text-red-500 p-2 hover:bg-red-50 rounded">
                        <Trash2 size={16} />
                      </button>
                    )}
                 </div>
               ))}
               <button onClick={addPreposto} className="flex items-center text-sm text-primary-600 hover:text-primary-800 font-medium mt-1">
                 <Plus size={16} className="mr-1" /> Adicionar Assinante
               </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Responsável Técnico (ART/RRT)</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-primary-500 focus:ring-primary-500"
                value={formData.technicalResponsible}
                onChange={(e) => handleChange('technicalResponsible', e.target.value)}
                placeholder="Nome do engenheiro ou responsável técnico principal"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-800 flex items-center">
                    <Briefcase size={16} className="mr-2 text-primary-600"/> 
                    Quadro de Colaboradores (Mão de Obra)
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Liste a quantidade e função dos profissionais que atuarão na execução.
                  </p>
                </div>
                <div className="flex items-center">
                  <label className="mr-2 text-xs font-medium text-gray-600 cursor-pointer" onClick={() => handleChange('hasLabor', !formData.hasLabor)}>
                    Alocação de pessoal?
                  </label>
                  <button 
                    onClick={() => handleChange('hasLabor', !formData.hasLabor)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.hasLabor ? 'bg-primary-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition transition-transform ${formData.hasLabor ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
              
              {formData.hasLabor && (
                <div className="bg-white p-3 rounded border border-gray-200 space-y-3">
                   {/* Header Row */}
                   {formData.laborDetails.length > 0 && (
                       <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 border-b pb-2 mb-2">
                           <div className="col-span-2 text-center">Qtd</div>
                           <div className="col-span-9">Função / Cargo</div>
                           <div className="col-span-1"></div>
                       </div>
                   )}

                   {formData.laborDetails.map((labor, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                         <div className="col-span-2">
                            <input
                              type="number"
                              min="1"
                              className="block w-full rounded-md border-gray-300 shadow-sm p-2 border text-sm text-center"
                              value={labor.quantity}
                              onChange={(e) => updateLaborDetail(idx, 'quantity', parseInt(e.target.value) || 0)}
                              placeholder="0"
                            />
                         </div>
                         <div className="col-span-9">
                            <input 
                              type="text"
                              className="block w-full rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                              placeholder="Ex: Pedreiro, Servente, Encanador..."
                              value={labor.role}
                              onChange={(e) => updateLaborDetail(idx, 'role', e.target.value)}
                            />
                         </div>
                         <div className="col-span-1 flex justify-end">
                            <button 
                              onClick={() => removeLaborDetail(idx)} 
                              className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50"
                              title="Remover"
                            >
                              <Trash2 size={16} />
                            </button>
                         </div>
                      </div>
                   ))}

                   <button 
                      onClick={addLaborDetail} 
                      className="w-full py-2 border-2 border-dashed border-gray-300 rounded-md text-sm text-gray-500 hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center justify-center mt-2 bg-gray-50 hover:bg-white"
                   >
                     <Plus size={16} className="mr-1" /> Adicionar Função
                   </button>
                </div>
              )}
            </div>
          </div>
        );

      case 4: // Recursos
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">5. Recursos, Materiais e Equipamentos</h3>
            
            {/* Materiais */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                   <input
                    type="checkbox"
                    checked={formData.hasMaterials}
                    onClick={(e: any) => handleChange('hasMaterials', e.target.checked)}
                    onChange={()=>{}}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                   />
                   <label className="ml-2 block text-sm font-medium text-gray-900">Há materiais inclusos?</label>
                </div>
              </div>
              {formData.hasMaterials && (
                <textarea
                  className="mt-3 block w-full rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                  rows={2}
                  placeholder="Liste os materiais..."
                  value={formData.materialsList}
                  onChange={(e) => handleChange('materialsList', e.target.value)}
                />
              )}
            </div>

            {/* Equipamentos */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                   <input
                    type="checkbox"
                    checked={formData.hasEquipment}
                    onClick={(e: any) => handleChange('hasEquipment', e.target.checked)}
                    onChange={()=>{}}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                   />
                   <label className="ml-2 block text-sm font-medium text-gray-900">Há equipamentos cedidos / comodato?</label>
                </div>
              </div>
              {formData.hasEquipment && (
                <textarea
                  className="mt-3 block w-full rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                  rows={2}
                  placeholder="Liste os equipamentos e áreas..."
                  value={formData.equipmentList}
                  onChange={(e) => handleChange('equipmentList', e.target.value)}
                />
              )}
            </div>

            {/* Locação */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                   <input
                    type="checkbox"
                    checked={formData.hasRental}
                    onClick={(e: any) => handleChange('hasRental', e.target.checked)}
                    onChange={()=>{}}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                   />
                   <label className="ml-2 block text-sm font-medium text-gray-900">Há locação envolvida (equipamento/espaço)?</label>
                </div>
              </div>
              {formData.hasRental && (
                <textarea
                  className="mt-3 block w-full rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                  rows={2}
                  placeholder="Descreva a locação..."
                  value={formData.rentalList}
                  onChange={(e) => handleChange('rentalList', e.target.value)}
                />
              )}
            </div>
          </div>
        );

      case 5: // Financeiro
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">6. Prazos e Condições Financeiras</h3>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700">Início Vigência</label>
                 <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      className="block w-full pl-10 rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.startDate}
                      onChange={(e) => handleChange('startDate', e.target.value)}
                    />
                 </div>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700">Fim Vigência</label>
                 <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      className="block w-full pl-10 rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.endDate}
                      onChange={(e) => handleChange('endDate', e.target.value)}
                    />
                 </div>
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Cronograma de Etapas</label>
              <textarea
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-primary-500 focus:ring-primary-500"
                value={formData.scheduleSteps}
                onChange={(e) => handleChange('scheduleSteps', e.target.value)}
                placeholder="Descreva as etapas ou marcos de entrega..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Valor Total Estimado (R$)</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      className="block w-full pl-10 rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.value}
                      onChange={(e) => handleChange('value', parseFloat(e.target.value))}
                    />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ex: Medição Quinzenal"
                    value={formData.paymentTerms}
                    onChange={(e) => handleChange('paymentTerms', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700">CAP / Limite</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500"
                    value={formData.capLimit}
                    onChange={(e) => handleChange('capLimit', e.target.value)}
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700">Índice de Correção</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500"
                    value={formData.correctionIndex}
                    onChange={(e) => handleChange('correctionIndex', e.target.value)}
                  />
               </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700">Tipos de Garantias</label>
               <input
                 type="text"
                 className="mt-1 block w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500"
                 placeholder="Ex: 5 anos para estrutural, 1 ano instalações..."
                 value={formData.warranties}
                 onChange={(e) => handleChange('warranties', e.target.value)}
               />
               <p className="text-xs text-gray-500 mt-1">Contados a partir da entrega dos serviços ou do equipamento.</p>
            </div>
            
            <div>
               <label className="block text-sm font-medium text-gray-700">Urgências e Riscos Envolvidos</label>
               <textarea
                 className="mt-1 block w-full rounded-md border-red-200 shadow-sm p-2 border bg-red-50 focus:border-red-500 focus:ring-red-500"
                 rows={2}
                 placeholder="Descreva riscos de prazo, segurança ou financeiros..."
                 value={formData.urgenciesRisks}
                 onChange={(e) => handleChange('urgenciesRisks', e.target.value)}
               />
            </div>
          </div>
        );

      case 6: // Aspectos Jurídicos
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">7. Aspectos Jurídicos e de Risco</h3>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 flex items-start">
              <Scale className="text-orange-500 mt-0.5 mr-3" size={20} />
              <p className="text-sm text-orange-800">
                Selecione os itens que devem constar no contrato. Isso orientará a elaboração da minuta.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {[
                { key: 'aspectStandardDraft', label: 'Minuta padrão' },
                { key: 'aspectNonStandardDraft', label: 'Minuta NÃO padrão' },
                { key: 'aspectConfidentiality', label: 'Cláusulas de confidencialidade' },
                { key: 'aspectTermination', label: 'Cláusulas de rescisão e penalidades' },
                { key: 'aspectWarranties', label: 'Garantias exigidas (performance, entrega)' },
                { key: 'aspectWarrantyStart', label: 'Contagem da garantia (entrega/execução)' },
                { key: 'aspectPostTermination', label: 'Obrigações pós-encerramento (sigilo)' },
                { key: 'aspectPublicAgencies', label: 'Interação com órgãos públicos' },
                { key: 'aspectAdvancePayment', label: 'Cláusula de antecipação de pagamento' },
                { key: 'aspectNonStandard', label: 'Condições não padrão (Outros)' },
              ].map((item) => (
                <div key={item.key} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    id={item.key}
                    type="checkbox"
                    checked={(formData as any)[item.key]}
                    onChange={(e) => handleChange(item.key as keyof ContractRequestData, e.target.checked)}
                    className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor={item.key} className="ml-3 text-sm text-gray-700 cursor-pointer select-none">
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        );

      case 7: // Documentos Obrigatórios (Checklist)
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">8. Documentos Obrigatórios</h3>
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 flex items-start">
              <FileCheck className="text-emerald-500 mt-0.5 mr-3" size={20} />
              <p className="text-sm text-emerald-800">
                Confirme se os seguintes documentos estão disponíveis e validados antes de prosseguir com os anexos.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 mt-4">
              {[
                { key: 'docCheckCommercial', label: 'Acordo Comercial (escopo definido com o fornecedor)' },
                { key: 'docCheckPO', label: 'Pedido de Compra (PO), se já emitido' },
                { key: 'docCheckCompliance', label: 'Termo de Conformidade (se aplicável)' },
                { key: 'docCheckSupplierAcceptance', label: 'Confirmação de aceite do fornecedor (e-mail ou assinatura eletrônica)' },
                { key: 'docCheckSystemRegistration', label: 'Registro no sistema de gestão contratual (se aplicável)' },
                { key: 'docCheckSupplierReport', label: 'Relatório de avaliação do fornecedor (se aplicável)' },
                { key: 'docCheckFiscalValidation', label: 'Documentos fiscais validados pela área financeira' },
                { key: 'docCheckSafetyDocs', label: 'Documentos de segurança do trabalho (se houver prestação presencial)' },
                { key: 'docCheckTrainingCertificates', label: 'Certificados de treinamentos obrigatórios (NRs, ASO, EPI, etc.)' },
              ].map((item) => (
                <div key={item.key} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors bg-white">
                  <input
                    id={item.key}
                    type="checkbox"
                    checked={(formData as any)[item.key]}
                    onChange={(e) => handleChange(item.key as keyof ContractRequestData, e.target.checked)}
                    className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor={item.key} className="ml-3 text-sm text-gray-700 cursor-pointer select-none">
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        );

      case 8: // Anexos
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">9. Anexar Documentos Contratuais</h3>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
               <p className="text-sm text-yellow-800 flex items-center">
                 <AlertCircle size={16} className="mr-2"/>
                 Anexe os PDFs originais. Eles serão unificados ao final deste documento.
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {[
                 { label: 'Contrato Social', type: 'Contrato Social' },
                 { label: 'Relatório Serasa', type: 'Serasa' },
                 { label: 'Orçamento Aprovado', type: 'Orçamento' },
                 { label: 'Pedido de Compra', type: 'Pedido' }
               ].map((item) => {
                 const isAttached = getAttachmentStatus(item.type);
                 return (
                   <div key={item.type} className={`border rounded-lg p-4 transition-colors ${isAttached ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className={`font-medium ${isAttached ? 'text-green-800' : 'text-gray-700'}`}>{item.label}</h4>
                        {isAttached && <Check size={16} className="text-green-600" />}
                      </div>
                      <label className={`cursor-pointer inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium w-full justify-center transition-colors
                        ${isAttached ? 'bg-white border-green-300 text-green-700 hover:bg-green-50' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                         <Upload size={16} className="mr-2"/>
                         {isAttached ? 'Substituir PDF' : 'Selecionar PDF'}
                         <input 
                           type="file" 
                           accept="application/pdf"
                           className="hidden" 
                           onChange={(e) => handleFileUpload(e, item.type)}
                         />
                      </label>
                   </div>
                 );
               })}
            </div>

            {formData.attachments.length > 0 && (
               <div className="mt-6">
                  <h4 className="font-medium text-gray-700 mb-3">Arquivos Anexados ({formData.attachments.length})</h4>
                  <ul className="divide-y divide-gray-100 bg-white border rounded-lg">
                     {formData.attachments.map((file, idx) => (
                       <li key={idx} className="flex justify-between items-center p-3">
                          <div className="flex items-center">
                             <Paperclip size={16} className="text-gray-400 mr-2"/>
                             <div>
                                <p className="text-sm font-medium text-gray-800">{file.type}</p>
                                <p className="text-xs text-gray-500">{file.name}</p>
                             </div>
                          </div>
                          <button onClick={() => removeAttachment(idx)} className="text-red-400 hover:text-red-600">
                             <Trash2 size={16}/>
                          </button>
                       </li>
                     ))}
                  </ul>
               </div>
            )}
          </div>
        );

      case 9: // Segurança e RH
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">10. Segurança e RH</h3>
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 flex items-start">
              <HardHat className="text-indigo-500 mt-0.5 mr-3" size={20} />
              <p className="text-sm text-indigo-800">
                Anexe os documentos específicos de Segurança do Trabalho e RH conforme aplicável.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <Building size={18} className="mr-2 text-primary-600"/> Documentos da Empresa
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {companyDocs.map((docType) => {
                    const isAttached = getAttachmentStatus(docType);
                    return (
                      <div key={docType} className={`border rounded-lg p-3 transition-colors ${isAttached ? 'bg-green-50 border-green-200' : 'bg-white hover:bg-gray-50'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-xs font-medium ${isAttached ? 'text-green-800' : 'text-gray-700'}`}>{docType}</span>
                          {isAttached && <Check size={14} className="text-green-600 flex-shrink-0 ml-2" />}
                        </div>
                        <label className={`cursor-pointer flex items-center justify-center px-2 py-1.5 border rounded text-xs font-medium w-full transition-colors
                          ${isAttached ? 'bg-white border-green-300 text-green-700 hover:bg-green-50' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                           <Upload size={12} className="mr-1.5"/>
                           {isAttached ? 'Alterar' : 'Anexar PDF'}
                           <input 
                             type="file" 
                             accept="application/pdf"
                             className="hidden" 
                             onChange={(e) => handleFileUpload(e, docType)}
                           />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <Users size={18} className="mr-2 text-primary-600"/> Documentos do Colaborador
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {employeeDocs.map((docType) => {
                    const isAttached = getAttachmentStatus(docType);
                    return (
                      <div key={docType} className={`border rounded-lg p-3 transition-colors ${isAttached ? 'bg-green-50 border-green-200' : 'bg-white hover:bg-gray-50'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-xs font-medium ${isAttached ? 'text-green-800' : 'text-gray-700'}`}>{docType}</span>
                          {isAttached && <Check size={14} className="text-green-600 flex-shrink-0 ml-2" />}
                        </div>
                        <label className={`cursor-pointer flex items-center justify-center px-2 py-1.5 border rounded text-xs font-medium w-full transition-colors
                          ${isAttached ? 'bg-white border-green-300 text-green-700 hover:bg-green-50' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                           <Upload size={12} className="mr-1.5"/>
                           {isAttached ? 'Alterar' : 'Anexar PDF'}
                           <input 
                             type="file" 
                             accept="application/pdf"
                             className="hidden" 
                             onChange={(e) => handleFileUpload(e, docType)}
                           />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      case 10: // Review
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">11. Revisão da Solicitação</h3>
            
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 space-y-4 text-sm text-gray-800">
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-500 uppercase text-xs">Fornecedor</h4>
                    <p className="font-medium text-lg">{selectedSupplier?.name || "Fornecedor não selecionado"}</p>
                    <p>{selectedSupplier?.cnpj}</p>
                    <p>{formData.serviceLocation}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-500 uppercase text-xs">Valores e Prazos</h4>
                    <p className="font-medium text-lg">R$ {formData.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p>{formData.paymentTerms}</p>
                    <p>{formData.startDate} até {formData.endDate}</p>
                  </div>
               </div>
               
               {selectedProject && (
                   <div className="border-t border-gray-200 pt-4 bg-blue-50 -mx-6 px-6 py-2">
                      <h4 className="font-semibold text-blue-700 uppercase text-xs mb-1">Projeto Vinculado (Engenharia)</h4>
                      <p className="font-medium">{selectedProject.name}</p>
                      <p className="text-xs">CC: {selectedProject.costCenter}</p>
                   </div>
               )}
               
               <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-gray-500 uppercase text-xs mb-1">Objeto</h4>
                  <p>{formData.objectDescription}</p>
               </div>
               
               <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-gray-500 uppercase text-xs mb-1">Equipe Principal</h4>
                  <ul className="list-disc list-inside">
                    {formData.prepostos.map((p, i) => (
                      <li key={i}>{p.name} - {p.role} ({p.email})</li>
                    ))}
                  </ul>
                  {formData.technicalResponsible && <p className="mt-1"><strong>RT:</strong> {formData.technicalResponsible}</p>}
                  
                  {formData.hasLabor && formData.laborDetails.length > 0 && (
                      <div className="mt-2">
                          <p className="font-medium text-gray-700 mb-1">Mão de Obra Alocada:</p>
                          <ul className="list-disc list-inside pl-2">
                             {formData.laborDetails.map((l, i) => (
                               <li key={i}>{l.quantity}x {l.role}</li>
                             ))}
                          </ul>
                      </div>
                  )}
               </div>

               {/* Legal Section Review */}
               <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-gray-500 uppercase text-xs mb-1">Aspectos Jurídicos Selecionados</h4>
                  <ul className="list-disc list-inside text-xs text-gray-700 grid grid-cols-2 gap-1">
                    {formData.aspectStandardDraft && <li>Minuta padrão</li>}
                    {formData.aspectNonStandardDraft && <li>Minuta NÃO padrão</li>}
                    {formData.aspectConfidentiality && <li>Cláusulas de confidencialidade</li>}
                    {formData.aspectTermination && <li>Rescisão e penalidades</li>}
                    {formData.aspectWarranties && <li>Garantias exigidas</li>}
                    {formData.aspectWarrantyStart && <li>Contagem da garantia</li>}
                    {formData.aspectPostTermination && <li>Obrigações pós-encerramento</li>}
                    {formData.aspectPublicAgencies && <li>Interação com órgãos públicos</li>}
                    {formData.aspectAdvancePayment && <li>Antecipação de pagamento</li>}
                    {formData.aspectNonStandard && <li>Condições não padrão</li>}
                  </ul>
               </div>

               {/* Mandatory Docs Review */}
               <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-gray-500 uppercase text-xs mb-1">Documentos Obrigatórios Verificados</h4>
                  <ul className="list-disc list-inside text-xs text-gray-700 grid grid-cols-2 gap-1">
                    {formData.docCheckCommercial && <li>Acordo Comercial</li>}
                    {formData.docCheckPO && <li>Pedido de Compra (PO)</li>}
                    {formData.docCheckCompliance && <li>Termo de Conformidade</li>}
                    {formData.docCheckSupplierAcceptance && <li>Aceite do Fornecedor</li>}
                    {formData.docCheckSystemRegistration && <li>Registro no Sistema</li>}
                    {formData.docCheckSupplierReport && <li>Relatório de Avaliação</li>}
                    {formData.docCheckFiscalValidation && <li>Documentos Fiscais</li>}
                    {formData.docCheckSafetyDocs && <li>Docs Segurança do Trabalho</li>}
                    {formData.docCheckTrainingCertificates && <li>Certificados de Treinamento</li>}
                  </ul>
               </div>

               {formData.attachments.length > 0 && (
                   <div className="border-t border-gray-200 pt-4">
                     <h4 className="font-semibold text-gray-500 uppercase text-xs mb-1">Todos os Anexos ({formData.attachments.length})</h4>
                     <ul className="text-xs text-gray-600 grid grid-cols-2 gap-1">
                        {formData.attachments.map((a, i) => (
                           <li key={i} className="truncate" title={a.name}>• {a.type}</li>
                        ))}
                     </ul>
                   </div>
               )}
               
               {formData.urgenciesRisks && (
                 <div className="bg-red-50 p-3 rounded border border-red-100 mt-2">
                    <h4 className="font-semibold text-red-800 uppercase text-xs mb-1 flex items-center"><AlertCircle size={12} className="mr-1"/> Riscos/Urgências</h4>
                    <p className="text-red-700">{formData.urgenciesRisks}</p>
                 </div>
               )}
            </div>

            <div className="flex items-center justify-center p-6 border-2 border-dashed border-primary-200 rounded-lg bg-primary-50">
                <FileText className="text-primary-500 mr-2" size={24} />
                <span className="text-primary-700 font-medium">O documento PDF será gerado e unificado com os anexos.</span>
            </div>
          </div>
        );

      default:
        return <div>Etapa não configurada</div>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-gray-100 flex flex-col h-[85vh] w-full max-w-5xl mx-auto overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <div>
           <h2 className="text-xl font-bold text-primary-900">
             {initialData ? 'Editar Solicitação' : 'Nova Solicitação de Contrato'}
           </h2>
           <p className="text-xs text-gray-500">Checklist para elaboração de minuta</p>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
          <span className="sr-only">Fechar</span>
          &times;
        </button>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-4 bg-white border-b border-gray-100 overflow-x-auto">
        <div className="flex items-center min-w-max md:justify-between md:min-w-0">
            {steps.map((label, index) => (
                <div key={index} className="flex flex-col items-center relative z-10 mx-4 md:mx-0 group cursor-pointer" onClick={() => index < currentStep && setCurrentStep(index)}>
                    <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2
                        ${index <= currentStep 
                          ? 'bg-primary-600 text-white border-primary-600 shadow-md' 
                          : 'bg-white text-gray-400 border-gray-200'}`}
                    >
                        {index < currentStep ? <Check size={14} /> : index + 1}
                    </div>
                    <span className={`text-xs mt-2 font-medium transition-colors ${index === currentStep ? 'text-primary-700' : 'text-gray-400'}`}>
                        {label}
                    </span>
                </div>
            ))}
             <div className="absolute top-[5.5rem] left-0 w-full h-0.5 bg-gray-100 -z-0 hidden md:block">
                <div 
                  className="h-full bg-primary-200 transition-all duration-300" 
                  style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                ></div>
             </div> 
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-gray-50/50">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
           {renderStepContent()}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button
          onClick={handleBack}
          disabled={currentStep === 0 || isSaving}
          className={`flex items-center px-5 py-2.5 rounded-lg text-sm font-medium transition-colors
            ${currentStep === 0 || isSaving ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100 border border-gray-300'}`}
        >
          <ChevronLeft size={18} className="mr-1" />
          Voltar
        </button>

        <div className="text-xs text-gray-400 font-medium hidden sm:block">
           Etapa {currentStep + 1} de {steps.length}
        </div>

        {currentStep === steps.length - 1 ? (
             <button
             onClick={handleFinish}
             disabled={isSaving}
             className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-medium bg-primary-600 text-white shadow-lg transition-all transform
                ${isSaving ? 'opacity-75 cursor-not-allowed' : 'hover:bg-primary-700 hover:shadow-xl hover:-translate-y-0.5'}`}
           >
             {isSaving ? (
               <>
                 <Loader2 size={18} className="mr-2 animate-spin" />
                 Salvando...
               </>
             ) : (
               <>
                 {initialData ? 'Atualizar e Gerar PDF' : 'Salvar e Gerar PDF'}
                 <FileText size={18} className="ml-2" />
               </>
             )}
           </button>
        ) : (
            <button
            onClick={handleNext}
            disabled={isSaving}
            className="flex items-center px-6 py-2.5 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 shadow-md transition-colors"
          >
            Próximo
            <ChevronRight size={18} className="ml-1" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ContractWizard;