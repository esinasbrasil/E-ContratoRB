
import React, { useState } from 'react';
import { ArrowLeft, Printer, CheckCircle, ClipboardCheck, Building2, Users, Search, Download, ShieldCheck, Mail, MapPin, Share2, Globe, Link } from 'lucide-react';
import { Supplier, Unit, Project, CompanySettings, ContractRequestData, SupplierStatus } from '../types';
import { mergeAndSavePDF } from '../services/pdfService';

interface SupplierComplianceProps {
  suppliers: Supplier[];
  units: Unit[];
  projects: Project[];
  settings: CompanySettings;
  onBack: () => void;
}

const homolCompanyDocs = [
  { id: 'homolCompanyPGR', label: 'PGR – Programa de Gerenciamento de Riscos' },
  { id: 'homolCompanyPCMSO', label: 'PCMSO – Programa de Controle Médico de Saúde Ocupacional' },
  { id: 'homolCompanyAlvara', label: 'ALVARÁ DE FUNCIONAMENTO' },
  { id: 'homolCompanyCNPJ', label: 'CARTÃO CNPJ' },
  { id: 'homolCompanyCNDFed', label: 'CND - Certidão negativa de débitos federais' },
  { id: 'homolCompanyCNDT', label: 'CNDT - Certidão negativa de débitos trabalhistas' },
  { id: 'homolCompanyCRF', label: 'CRF - Certificado de Regularidade do FGTS' },
  { id: 'homolCompanyEmployeeList', label: 'Lista de funcionários prestadores de serviços para o Grupo RB' }
];

const homolEmployeeDocs = [
  { id: 'homolEmployeeASO', label: 'ASO – Atestado de Saúde Ocupacional' },
  { id: 'homolEmployeeEPI', label: 'Ficha de EPI – Equipamento de Proteção Individual' },
  { id: 'homolEmployeeRegistration', label: 'Registro dos colaboradores' },
  { id: 'homolEmployeeOS', label: 'OS – Ordem de Serviço de Segurança do Trabalho' },
  { id: 'homolEmployeeQualif', label: 'Documentação de qualificação (Treinamentos: NR10, NR33, NR35, etc.)' }
];

const SAFETY_QUESTIONS = [
  { id: "altura", pergunta: "Trabalho em altura (acima de 2 metros)?", nr: ["NR35"], documentos: ["Treinamento NR35", "ASO apto altura"], epis: ["Cinto paraquedista", "Talabarte", "Capacete com jugular"], controles: ["APR", "PT"] },
  { id: "espaco_confinado", pergunta: "Trabalho em espaço confinado?", nr: ["NR33"], documentos: ["Treinamento NR33", "ASO específico"], epis: ["Detector de gases", "Respirador", "Tripé resgate"], controles: ["PET", "Monitoramento de gases"] },
  { id: "eletricidade", pergunta: "Trabalho com eletricidade ou energia ativa?", nr: ["NR10"], documentos: ["Treinamento NR10", "Autorização formal"], epis: ["Luva isolante", "Capacete classe B", "Roupa anti-chama"], controles: ["LOTO", "Desenergização"] },
  { id: "maquinas", pergunta: "Uso de máquinas ou equipamentos?", nr: ["NR12"], documentos: ["Capacitação operador"], epis: ["Óculos", "Protetor auricular", "Luvas"], controles: ["Proteção de máquina", "Botão emergência"] },
  { id: "carga", pergunta: "Movimentação de carga?", nr: ["NR11"], documentos: ["Treinamento operador"], epis: ["Luvas", "Botina", "Capacete"], controles: ["Sinalização", "Plano de içamento"] },
  { id: "quimicos", pergunta: "Uso de produtos químicos?", nr: ["NR20"], documentos: ["FISPQ", "Treinamento"], epis: ["Luva química", "Respirador", "Óculos"], controles: ["Ventilação", "Armazenamento correto"] },
  { id: "escavacao", pergunta: "Haverá escavação ou obra civil?", nr: ["NR18"], documentos: ["PGR obra", "PCMAT"], epis: ["Capacete", "Botina", "Colete"], controles: ["Escoramento", "Isolamento área"] },
  { id: "ruido", pergunta: "Ambiente com ruído ou agente agressivo?", nr: ["NR15"], documentos: ["Laudo insalubridade"], epis: ["Protetor auricular", "Respirador"], controles: [] as string[] }
];

const NR_BASE = ["NR01", "NR06", "NR07"];

const SupplierCompliance: React.FC<SupplierComplianceProps> = ({ suppliers, units, projects, settings, onBack }) => {
  const [mode, setMode] = useState<'convite' | 'homologacao'>('convite');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [search, setSearch] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [safetyAnswers, setSafetyAnswers] = useState<Record<string, boolean>>({});
  const [complexity, setComplexity] = useState<'baixa' | 'media' | 'alta'>('baixa');
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');

  const generateInviteLink = () => {
    if (!selectedSupplierId) {
      alert("Selecione um fornecedor primeiro.");
      return;
    }
    const sup = suppliers.find(s => s.id === selectedSupplierId);
    const url = `${window.location.origin}/portal?cnpj=${sup?.cnpj}`;
    setInviteUrl(url);
    setShowInviteLink(true);
  };
  
  const [formData, setFormData] = useState<Partial<ContractRequestData>>({
    homolCompanyPGR: false,
    homolCompanyPCMSO: false,
    homolCompanyAlvara: false,
    homolCompanyCNPJ: false,
    homolCompanyCNDFed: false,
    homolCompanyCNDT: false,
    homolCompanyCRF: false,
    homolCompanyEmployeeList: false,
    homolEmployeeASO: false,
    homolEmployeeEPI: false,
    homolEmployeeRegistration: false,
    homolEmployeeOS: false,
    homolEmployeeQualif: false,
  });

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.cnpj.includes(search)
  );

  const handleToggle = (field: keyof ContractRequestData) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

  const calculateSafetyResults = () => {
    let nr = new Set(NR_BASE);
    let documentos = new Set<string>();
    let epis = new Set<string>();
    let controles = new Set<string>();

    SAFETY_QUESTIONS.forEach(q => {
      if (safetyAnswers[q.id]) {
        q.nr.forEach(n => nr.add(n));
        q.documentos.forEach(d => documentos.add(d));
        q.epis.forEach(e => epis.add(e));
        q.controles.forEach(c => controles.add(c));
      }
    });

    if (complexity === "media") controles.add("APR obrigatória");
    if (complexity === "alta") {
      controles.add("APR obrigatória");
      controles.add("Permissão de Trabalho (PT)");
      controles.add("Supervisor obrigatório");
    }

    return {
      nr: Array.from(nr),
      documentos: Array.from(documentos),
      epis: Array.from(epis),
      controles: Array.from(controles),
      answers: safetyAnswers,
      complexity
    };
  };

  const handleProjectSelect = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (projectId === 'manual') {
      setSelectedProjectId('manual');
      setProjectName('');
      setProjectDescription('');
      return;
    }
    if (project) {
      setSelectedProjectId(projectId);
      setProjectName(project.name);
      setProjectDescription(project.description);
      setSelectedUnitId(project.unitId);
    }
  };

  const handleGeneratePDF = async () => {
    if (mode === 'homologacao' && !selectedSupplierId) {
      alert("Por favor, selecione um fornecedor para a homologação.");
      return;
    }
    
    if (mode === 'convite' && !projectName) {
      alert("Por favor, informe o nome do projeto/serviço para a Carta Convite.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const safetyResults = calculateSafetyResults();
      const unit = units.find(u => u.id === selectedUnitId);
      
      const mockSupplier: Supplier = {
        id: 'no-supplier',
        name: projectName || 'Serviço sob Consulta (RFP)',
        cnpj: '00.000.000/0000-00',
        serviceType: '-',
        status: SupplierStatus.PENDING,
        address: unit?.address || 'Unidades Grupo RB',
        rating: 0,
        docs: []
      };

      const fullData: ContractRequestData = {
        supplierId: mode === 'homologacao' ? selectedSupplierId : 'convite-rfp',
        projectId: '',
        unitId: selectedUnitId,
        supplierBranches: 'Não informado',
        serviceLocation: unit?.name || 'Unidades Grupo RB',
        serviceType: mode === 'homologacao' ? (selectedSupplier?.serviceType || '') : 'Carta Convite / RFP',
        docSocialContract: false,
        docSerasa: false,
        objectDescription: mode === 'convite' ? `REQUISITOS TÉCNICOS: ${projectName}` : 'Homologação de Segurança e RH',
        scopeDescription: mode === 'convite' ? (projectDescription || `Ficha de requisitos mínimos exigidos para participação no processo de cotação (Carta Convite).`) : 'Prestação de serviços contínuos ou pontuais sob demanda.',
        prepostos: [],
        technicalResponsible: '-',
        technicalResponsibleCpf: '-',
        hasMaterials: false,
        materialsList: '',
        hasEquipment: false,
        equipmentList: '',
        hasRental: false,
        rentalList: '',
        hasComodato: false,
        comodatoList: '',
        hasLabor: true,
        laborDetails: [],
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: 0,
        paymentTerms: '-',
        capLimit: '-',
        correctionIndex: '-',
        warranties: '-',
        urgenciesRisks: '-',
        aspectStandardDraft: true,
        aspectNonStandardDraft: false,
        aspectConfidentiality: true,
        aspectTermination: true,
        aspectWarranties: false,
        aspectWarrantyStart: false,
        aspectPostTermination: true,
        aspectPublicAgencies: false,
        aspectAdvancePayment: false,
        aspectNonStandard: false,
        docCheckCommercial: false,
        docCheckPO: false,
        docCheckCompliance: true,
        docCheckSupplierAcceptance: true,
        docCheckSystemRegistration: true,
        docCheckSupplierReport: false,
        docCheckFiscalValidation: true,
        docCheckSafetyDocs: true,
        docCheckTrainingCertificates: true,
        attachments: [],
        safetyClassification: safetyResults,
        ...formData
      } as ContractRequestData;

      await mergeAndSavePDF(fullData, mode === 'homologacao' ? selectedSupplier : mockSupplier, settings, unit);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
           <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-900 font-bold text-sm transition-all group">
             <div className="p-2 bg-slate-100 rounded-xl mr-3 group-hover:bg-slate-200"><ArrowLeft size={18} /></div>
             Voltar ao Portal
           </button>
           <div className="flex items-center gap-3">
             <div className="p-2.5 bg-orange-50 text-orange-600 rounded-2xl"><ShieldCheck size={24} /></div>
             <h1 className="text-xl font-black text-slate-900 tracking-tight tracking-tight">Compliance & Homologação</h1>
           </div>
           <div className="flex gap-4">
              {mode === 'homologacao' && selectedSupplierId && (
                <button 
                  onClick={generateInviteLink}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black flex items-center text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  <Share2 size={18} className="mr-2" /> Enviar p/ Fornecedor
                </button>
              )}
              <button 
                onClick={handleGeneratePDF} 
                disabled={isGenerating || (mode === 'homologacao' && !selectedSupplierId) || (mode === 'convite' && (!projectName || !selectedUnitId))}
                className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-black flex items-center text-xs uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 disabled:opacity-30 disabled:shadow-none"
              >
                {isGenerating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"/> Gerando...</> : <><Download size={18} className="mr-2" /> {mode === 'convite' ? 'Gerar Carta Convite' : 'Gerar PDF Homologação'}</>}
              </button>
           </div>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar: Modo e Seleção */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">1. Finalidade do Documento</h2>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => setMode('convite')}
                className={`p-4 rounded-2xl text-left border-2 transition-all ${mode === 'convite' ? 'bg-orange-50 border-orange-400 text-orange-900 shadow-lg shadow-orange-50' : 'bg-white border-slate-50 text-slate-500'}`}
              >
                <p className="font-black text-xs uppercase tracking-widest mb-1">Carta Convite / RFP</p>
                <p className="text-[10px] font-medium opacity-70">Definir requisitos para convocar fornecedores</p>
              </button>
              <button 
                onClick={() => setMode('homologacao')}
                className={`p-4 rounded-2xl text-left border-2 transition-all ${mode === 'homologacao' ? 'bg-orange-50 border-orange-400 text-orange-900 shadow-lg shadow-orange-50' : 'bg-white border-slate-50 text-slate-500'}`}
              >
                <p className="font-black text-xs uppercase tracking-widest mb-1">Homologação de Fornecedor</p>
                <p className="text-[10px] font-medium opacity-70">Validar documentos do fornecedor escolhido</p>
              </button>
            </div>
          </div>

          {mode === 'convite' ? (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 animate-in slide-in-from-left-4 space-y-6">
              <h2 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
                <ShieldCheck size={20} className="text-orange-500" />
                2. Seleção de Projeto
              </h2>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Vincular Projeto Existente</label>
                <select 
                  className="w-full p-4 bg-slate-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 font-medium"
                  value={selectedProjectId}
                  onChange={e => handleProjectSelect(e.target.value)}
                >
                  <option value="">Selecione um projeto...</option>
                  <option value="manual">+ Digitar manualmente</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Unidade / Fábrica</label>
                <select 
                  className={`w-full p-4 bg-slate-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 font-medium ${selectedProjectId !== 'manual' && selectedProjectId !== '' ? 'opacity-70 cursor-not-allowed' : ''}`}
                  value={selectedUnitId}
                  onChange={e => setSelectedUnitId(e.target.value)}
                  disabled={selectedProjectId !== 'manual' && selectedProjectId !== ''}
                >
                  <option value="">Selecione a Unidade...</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                {selectedUnitId && (
                  <p className="mt-2 text-[10px] text-orange-600 font-bold flex items-center gap-1">
                    <MapPin size={12} /> {units.find(u => u.id === selectedUnitId)?.address}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nome do Projeto/Serviço</label>
                <input 
                  type="text" 
                  placeholder="Ex: Reforma de Piso Galpão A" 
                  className="w-full p-4 bg-slate-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 font-medium"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  readOnly={selectedProjectId !== 'manual' && selectedProjectId !== ''}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Resumo do Projeto (Escopo)</label>
                <textarea 
                  placeholder="Descreva brevemente o que será feito..." 
                  className="w-full p-4 bg-slate-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 font-medium"
                  rows={4}
                  value={projectDescription}
                  onChange={e => setProjectDescription(e.target.value)}
                  readOnly={selectedProjectId !== 'manual' && selectedProjectId !== ''}
                />
              </div>

              <p className="mt-4 text-[10px] text-slate-400 font-bold leading-tight">
                * Os dados preenchidos serão utilizados para compor a ficha de requisitos técnicos da Carta Convite.
              </p>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 animate-in slide-in-from-left-4">
              <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <Search size={20} className="text-orange-500" />
                2. Selecionar Fornecedor
              </h2>
              <input 
                type="text" 
                placeholder="Buscar por nome ou CNPJ..." 
                className="w-full p-4 bg-slate-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 mb-6 font-medium"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                {filteredSuppliers.map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => setSelectedSupplierId(s.id)}
                    className={`p-5 rounded-3xl border-2 transition-all cursor-pointer ${selectedSupplierId === s.id ? 'bg-orange-50 border-orange-400 shadow-lg shadow-orange-50' : 'bg-white border-slate-50 hover:border-orange-100'}`}
                  >
                    <p className={`font-black text-sm mb-1 ${selectedSupplierId === s.id ? 'text-orange-900' : 'text-slate-800'}`}>{s.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.cnpj}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mode === 'homologacao' && selectedSupplier && (
            <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white animate-in zoom-in-95">
               <div className="flex items-center gap-3 mb-6">
                 <div className="p-3 bg-white/10 rounded-2xl"><Building2 size={24} className="text-orange-400" /></div>
                 <div>
                    <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest">Informações em Foco</p>
                    <h3 className="text-lg font-black line-clamp-1 tracking-tight">{selectedSupplier.name}</h3>
                 </div>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center gap-3 text-xs">
                     <MapPin size={14} className="text-slate-500" />
                     <span className="font-medium text-slate-300">{selectedSupplier.address}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                     <Mail size={14} className="text-slate-500" />
                     <span className="font-medium text-slate-300">financeiro@fornecedor.com</span>
                  </div>
                  <div className={`mt-6 inline-flex border px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${selectedSupplier.status === SupplierStatus.HOMOLOGATED ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : 'border-orange-500 text-orange-500 bg-orange-500/10'}`}>
                    {selectedSupplier.status}
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Content: Checklist */}
        <div className="lg:col-span-2">
          <div className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-2xl border border-slate-100">
            <div className="mb-12 border-b border-slate-100 pb-10">
              <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">
                {mode === 'convite' ? 'Carta Convite: Requisitos' : 'Ficha de Homologação'}
              </h1>
              <p className="text-slate-500 font-medium leading-relaxed max-w-2xl">
                {mode === 'convite' 
                  ? 'Defina os critérios e documentos obrigatórios que todos os fornecedores convidados devem apresentar para participar desta cotação.'
                  : 'Checklist de documentos para prestação de serviços no Grupo RB. Assinale os itens validados para compor o dossiê.'}
              </p>
            </div>

            <div className="space-y-12">
              <section className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><ShieldCheck size={24} /></div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Classificação de Serviço</h2>
                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mt-1 opacity-70">Análise de Risco Operacional</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {SAFETY_QUESTIONS.map(q => (
                    <div key={q.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white rounded-3xl border border-slate-100 shadow-sm gap-4 transition-all hover:shadow-md">
                      <div className="max-w-md">
                        <p className="text-sm font-black text-slate-800 leading-tight mb-1">{q.pergunta}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Envolvimento de {q.nr.join(', ')}</p>
                      </div>
                      <div className="flex bg-slate-100 p-1.5 rounded-2xl shrink-0">
                        <button 
                          onClick={() => setSafetyAnswers(prev => ({ ...prev, [q.id]: true }))}
                          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${safetyAnswers[q.id] === true ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                          Sim
                        </button>
                        <button 
                          onClick={() => setSafetyAnswers(prev => ({ ...prev, [q.id]: false }))}
                          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${safetyAnswers[q.id] === false ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                          Não
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 pt-8 border-t border-slate-200">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Complexidade Operacional Geral</p>
                   <div className="grid grid-cols-3 gap-3">
                      {['baixa', 'media', 'alta'].map(c => (
                        <button
                          key={c}
                          onClick={() => setComplexity(c as any)}
                          className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border-2 transition-all ${complexity === c ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:border-orange-500'}`}
                        >
                          {c}
                        </button>
                      ))}
                   </div>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm border border-orange-100"><Building2 size={20} /></div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    {mode === 'convite' ? 'Documentos da Empresa (Requisitos)' : 'Documentos da Empresa'}
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {homolCompanyDocs.map(item => (
                    <label key={item.id} className={`flex items-start gap-4 p-5 border-2 rounded-2xl transition-all cursor-pointer group ${formData[item.id as keyof ContractRequestData] ? (mode === 'convite' ? 'bg-orange-50 border-orange-200' : 'bg-orange-50 border-orange-200 shadow-inner') : 'bg-white border-slate-50 hover:border-orange-100'}`}>
                      <input 
                        type="checkbox" 
                        checked={!!formData[item.id as keyof ContractRequestData]}
                        onChange={() => handleToggle(item.id as keyof ContractRequestData)}
                        className="h-6 w-6 text-orange-600 border-gray-300 rounded-lg focus:ring-orange-500" 
                      />
                      <div>
                        <span className={`text-xs font-bold leading-tight block ${formData[item.id as keyof ContractRequestData] ? 'text-orange-900' : 'text-slate-600 group-hover:text-slate-900'}`}>{item.label}</span>
                        {mode === 'convite' && <span className="text-[9px] text-slate-400 font-medium">Exigir no convite</span>}
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100"><Users size={20} /></div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      {mode === 'convite' ? 'Documentos do Colaborador (Requisitos)' : 'Documentos do Colaborador'}
                    </h2>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1 opacity-70">Pasta individual necessária por funcionário</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {homolEmployeeDocs.map(item => (
                    <label key={item.id} className={`flex items-start gap-4 p-5 border-2 rounded-2xl transition-all cursor-pointer group ${formData[item.id as keyof ContractRequestData] ? (mode === 'convite' ? 'bg-blue-50 border-blue-200' : 'bg-blue-50 border-blue-200 shadow-inner') : 'bg-white border-slate-50 hover:border-blue-100'}`}>
                      <input 
                        type="checkbox" 
                        checked={!!formData[item.id as keyof ContractRequestData]}
                        onChange={() => handleToggle(item.id as keyof ContractRequestData)}
                        className="h-6 w-6 text-blue-600 border-gray-300 rounded-lg focus:ring-blue-500" 
                      />
                      <div>
                        <span className={`text-xs font-bold leading-tight block ${formData[item.id as keyof ContractRequestData] ? 'text-blue-900' : 'text-slate-600 group-hover:text-slate-900'}`}>{item.label}</span>
                        {mode === 'convite' && <span className="text-[9px] text-slate-400 font-medium">Exigir no convite</span>}
                      </div>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-20 pt-16 border-t-2 border-dashed border-slate-100">
              <div className="grid grid-cols-2 gap-16">
                <div className="text-center">
                   <div className="h-0.5 bg-slate-200 mb-4 mx-4"></div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assinatura do Fornecedor</p>
                </div>
                <div className="text-center">
                   <div className="h-0.5 bg-slate-200 mb-4 mx-4"></div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Segurança do Trabalho / RH (Grupo RB)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showInviteLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] p-12 max-w-xl w-full shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 h-40 w-40 bg-indigo-50 rounded-full -mr-10 -mt-20"></div>
             
             <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">Enviar ao Fornecedor</h3>
             <p className="text-slate-500 font-medium mb-8">Copie o link seguro abaixo e envie para o fornecedor {selectedSupplier?.name} iniciar o upload dos documentos.</p>
             
             <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-slate-600 truncate">
                   <Link size={18} className="shrink-0" />
                   <code className="text-[10px] font-mono truncate">{inviteUrl}</code>
                </div>
                <button 
                  onClick={() => { navigator.clipboard.writeText(inviteUrl); alert('Link copiado!'); }}
                  className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-200 transition-all shrink-0"
                >
                  Copiar
                </button>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <button 
                onClick={() => setShowInviteLink(false)}
                className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
               >
                 Fechar
               </button>
               <button 
                onClick={() => { window.open(`https://wa.me/?text=Olá, seguem instruções para homologação no Grupo RB: ${inviteUrl}`, '_blank'); }}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
               >
                 <ShieldCheck size={16} /> WhatsApp
               </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SupplierCompliance;
