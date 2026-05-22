import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Users, 
  MapPin, 
  ShieldAlert, 
  CheckCircle2, 
  Plus, 
  RotateCcw, 
  FileText, 
  ChevronDown, 
  Search, 
  AlertCircle,
  Clock,
  NotebookTabs,
  Globe,
  Settings
} from 'lucide-react';
import { SupplierStatus } from '../types';

// Predefined list of Construction Companies from user screenshots
const DEFAULT_CONSTRUTORAS = [
  // Pequeno Porte
  {
    id: 'c1',
    name: 'Dutra',
    size: 'Pequeno porte',
    status: SupplierStatus.BLOCKED,
    cnpj: '24.553.756/0001-26',
    city: 'São Paulo – SP',
    region: 'Sul',
    modalities: ['Empreitada Parcial', 'Empreitada Parcial', 'Homem Hora', 'SP', 'Aguardando']
  },
  {
    id: 'c2',
    name: 'Iva',
    size: 'Pequeno porte',
    status: SupplierStatus.PENDING,
    cnpj: '21.283.446/0001-40',
    city: 'Pelotas – RS',
    region: 'Sul',
    modalities: ['Empreitada Parcial', 'Empreitada Parcial', 'Homem Hora', 'SP', 'Aguardando']
  },
  {
    id: 'c3',
    name: 'Ramires',
    size: 'Pequeno porte',
    status: SupplierStatus.HOMOLOGATED,
    cnpj: '21.902.040/0001-07',
    city: 'São José do Norte – RS',
    region: 'Sul',
    modalities: ['Empreitada Parcial', 'Empreitada Parcial', 'Homem Hora', 'SP', 'Aguardando']
  },
  {
    id: 'c4',
    name: 'AM Engenharia',
    size: 'Pequeno porte',
    status: SupplierStatus.HOMOLOGATED,
    cnpj: '40.535.057/0001-00',
    city: 'Chavantes – SP',
    region: 'SP',
    modalities: ['Empreitada Parcial', 'Empreitada Parcial', 'Homem Hora', 'SP', 'Aguardando']
  },
  {
    id: 'c5',
    name: 'AndLoc Engenharia',
    size: 'Pequeno porte',
    status: SupplierStatus.HOMOLOGATED,
    cnpj: '54.397.032/0001-00',
    city: 'Bom Sucesso - SP',
    region: 'SP',
    modalities: ['Empreitada Parcial', 'Empreitada Parcial', 'Homem Hora', 'SP', 'Aguardando']
  },
  {
    id: 'c6',
    name: 'Engesa',
    size: 'Pequeno porte',
    status: SupplierStatus.BLOCKED,
    cnpj: '43.562.787/0001-98',
    city: 'Avaré – SP',
    region: 'SP',
    modalities: ['Empreitada Parcial', 'Empreitada Parcial', 'Homem Hora', 'SP', 'Aguardando']
  },

  // Médio Porte
  {
    id: 'c7',
    name: 'Almab',
    size: 'Médio porte',
    status: SupplierStatus.PENDING,
    cnpj: '41.841.231/0001-05',
    city: 'São Paulo',
    region: 'SP / PR / Sul',
    modalities: ['Turn-Key', 'Empreitada Parcial', 'Contrato por Administração', 'SP / PR / Sul', 'Aguardando']
  },
  {
    id: 'c8',
    name: 'Alves e Moraes',
    size: 'Médio porte',
    status: SupplierStatus.PENDING,
    cnpj: '20.515.386/0001-81',
    city: 'Holambra II / Paranapanema – SP',
    region: 'SP / PR / Sul',
    modalities: ['Turn-Key', 'Empreitada Parcial', 'Contrato por Administração', 'SP / PR / Sul', 'Aguardando']
  },
  {
    id: 'c9',
    name: 'Construfort',
    size: 'Médio porte',
    status: SupplierStatus.HOMOLOGATED,
    cnpj: '15.831.289/0001-68',
    city: 'Fartura - SP',
    region: 'SP / PR / Sul',
    modalities: ['Turn-Key', 'Empreitada Parcial', 'Contrato por Administração', 'SP / PR / Sul', 'Aguardando']
  },
  {
    id: 'c10',
    name: 'Gcom',
    size: 'Médio porte',
    status: SupplierStatus.HOMOLOGATED,
    cnpj: '59.996.777/0001-08',
    city: 'Avaré – SP',
    region: 'SP / PR / Sul',
    modalities: ['Turn-Key', 'Empreitada Parcial', 'Contrato por Administração', 'SP / PR / Sul', 'Aguardando']
  },
  {
    id: 'c11',
    name: 'Grandini Engenharia',
    size: 'Médio porte',
    status: SupplierStatus.HOMOLOGATED,
    cnpj: '09.284.836/0001-30',
    city: 'Ourinhos - SP',
    region: 'SP / PR / Sul',
    modalities: ['Turn-Key', 'Empreitada Parcial', 'Contrato por Administração', 'SP / PR / Sul', 'Aguardando']
  },

  // Grande Porte
  {
    id: 'c12',
    name: 'HTB',
    size: 'Grande porte',
    status: SupplierStatus.PENDING,
    cnpj: '08.606.901/0001-33',
    city: 'São Paulo',
    region: 'Nacional',
    modalities: ['Preço Máximo Garantido', 'Turn-Key', 'Empreitada Parcial', 'Nacional', 'Aguardando']
  },
  {
    id: 'c13',
    name: 'MSE',
    size: 'Grande porte',
    status: SupplierStatus.PENDING,
    cnpj: '08.797.481/0001-70',
    city: 'São Paulo',
    region: 'Nacional',
    modalities: ['Preço Máximo Garantido', 'Turn-Key', 'Empreitada Parcial', 'Nacional', 'Aguardando']
  },
  {
    id: 'c14',
    name: 'Racional Eng',
    size: 'Grande porte',
    status: SupplierStatus.PENDING,
    cnpj: '43.202.951/0001-56',
    city: 'São Paulo',
    region: 'Nacional',
    modalities: ['Preço Máximo Garantido', 'Turn-Key', 'Empreitada Parcial', 'Nacional', 'Aguardando']
  },

  // Especializado
  {
    id: 'c15',
    name: 'EQS',
    size: 'Especializado',
    status: SupplierStatus.PENDING,
    cnpj: '80.464.753/0001-97',
    city: 'São José – SC',
    region: 'SP',
    modalities: ['Turn-Key', 'Empreitada Parcial', 'Empreitada Parcial', 'Nacional', 'Aguardando']
  },
  {
    id: 'c16',
    name: 'Firemaster',
    size: 'Especializado',
    status: SupplierStatus.PENDING,
    cnpj: '29.932.249/0001-17',
    city: 'Brasília – DF',
    region: 'SP',
    modalities: ['Turn-Key', 'Empreitada Parcial', 'Empreitada Parcial', 'Nacional', 'Aguardando']
  },
  {
    id: 'c17',
    name: 'Global',
    size: 'Especializado',
    status: SupplierStatus.PENDING,
    cnpj: '29.845.912/0001-46',
    city: 'Salto – SP',
    region: 'SP',
    modalities: ['Turn-Key', 'Empreitada Parcial', 'Empreitada Parcial', 'Nacional', 'Aguardando']
  },
  {
    id: 'c18',
    name: 'Fireshild',
    size: 'Especializado',
    status: SupplierStatus.HOMOLOGATED,
    cnpj: '50.480.895/0001-87',
    city: 'Dourados – MS',
    region: 'Nacional',
    modalities: ['Turn-Key', 'Empreitada Parcial', 'Empreitada Parcial', 'Nacional', 'Aguardando']
  }
];

// Sizes tabs as sorted in user images
const SIZES = ['Especializado', 'Grande porte', 'Médio porte', 'Pequeno porte'];

const VendorList: React.FC = () => {
  const [construtoras, setConstrutoras] = useState(DEFAULT_CONSTRUTORAS);
  const [activeSize, setActiveSize] = useState<string>('Pequeno porte');
  const [selectedRegions, setSelectedRegions] = useState<Record<string, boolean>>({});
  const [selectedCompanyDropdown, setSelectedCompanyDropdown] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Custom dialog to add a new constructor
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    size: 'Pequeno porte',
    status: SupplierStatus.HOMOLOGATED,
    cnpj: '',
    city: '',
    region: 'SP',
    modality1: 'Empreitada Parcial',
    modality2: 'Empreitada Parcial',
    modality3: 'Homem Hora'
  });

  // Calculate available regions for the currently active tab
  const activeTabRegions = useMemo(() => {
    const list = construtoras.filter(c => c.size === activeSize);
    const regions = new Set<string>();
    list.forEach(c => {
      if (c.region) {
        regions.add(c.region);
      }
    });
    return Array.from(regions);
  }, [construtoras, activeSize]);

  // Handle changing tabs: reset regions selected & company dropdown
  const handleTabChange = (size: string) => {
    setActiveSize(size);
    setSelectedRegions({});
    setSelectedCompanyDropdown('Todos');
  };

  // Filter list based on active tab size, selected regions checklist, dropdown select and text search query
  const filteredList = useMemo(() => {
    return construtoras.filter(c => {
      // 1. Size match
      if (c.size !== activeSize) return false;

      // 2. Region check (if any checked)
      const activeCheckedRegions = Object.entries(selectedRegions)
        .filter(([_, checked]) => checked)
        .map(([reg]) => reg);
      
      if (activeCheckedRegions.length > 0) {
        if (!activeCheckedRegions.includes(c.region)) return false;
      }

      // 3. Company dropdown
      if (selectedCompanyDropdown !== 'Todos') {
        if (c.name !== selectedCompanyDropdown) return false;
      }

      // 4. Text search
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(query) ||
          c.cnpj.includes(query) ||
          c.city.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [construtoras, activeSize, selectedRegions, selectedCompanyDropdown, searchQuery]);

  // Companies list for dropdown filtered by active size
  const dropdownCompanies = useMemo(() => {
    return construtoras
      .filter(c => c.size === activeSize)
      .map(c => c.name);
  }, [construtoras, activeSize]);

  // Modalities summary based on the active tab (images show different modalities per size segment)
  const modalitiesSummary = useMemo(() => {
    // We can show dynamic or predefined values corresponding EXACTLY to the images
    if (activeSize === 'Pequeno porte') {
      return {
        m1: 'Empreitada Parcial',
        m2: 'Empreitada Parcial',
        m3: 'Homem Hora',
        atuacao: 'SP',
        situacao: 'Aguardando'
      };
    } else if (activeSize === 'Médio porte') {
      return {
        m1: 'Turn-Key',
        m2: 'Empreitada Parcial',
        m3: 'Contrato por Adminis...',
        atuacao: 'SP / PR / Sul',
        situacao: 'Aguardando'
      };
    } else if (activeSize === 'Grande porte') {
      return {
        m1: 'Preço Máximo Garant...',
        m2: 'Turn-Key',
        m3: 'Empreitada Parcial',
        atuacao: 'Nacional',
        situacao: 'Aguardando'
      };
    } else { // Especializado
      return {
        m1: 'Turn-Key',
        m2: 'Empreitada Parcial',
        m3: 'Empreitada Parcial',
        atuacao: 'Nacional',
        situacao: 'Aguardando'
      };
    }
  }, [activeSize]);

  // Handle region checkbox selection
  const handleRegionCheckboxChange = (region: string) => {
    setSelectedRegions(prev => ({
      ...prev,
      [region]: !prev[region]
    }));
  };

  const handleReset = () => {
    if (window.confirm("Deseja realmente restaurar a lista original de construtoras?")) {
      setConstrutoras(DEFAULT_CONSTRUTORAS);
      setActiveSize('Pequeno porte');
      setSelectedRegions({});
      setSelectedCompanyDropdown('Todos');
      setSearchQuery('');
    }
  };

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.name || !newCompany.cnpj) {
      alert("Por favor, preencha o nome e o CNPJ da construtora.");
      return;
    }

    const created = {
      id: 'custom_' + Date.now(),
      name: newCompany.name,
      size: newCompany.size,
      status: newCompany.status,
      cnpj: newCompany.cnpj,
      city: newCompany.city || 'Desconhecido – SP',
      region: newCompany.region,
      modalities: [newCompany.modality1, newCompany.modality2, newCompany.modality3, newCompany.region, 'Aguardando']
    };

    setConstrutoras(prev => [created, ...prev]);
    setShowAddModal(false);
    setActiveSize(newCompany.size);
    // Reset form
    setNewCompany({
      name: '',
      size: 'Pequeno porte',
      status: SupplierStatus.HOMOLOGATED,
      cnpj: '',
      city: '',
      region: 'SP',
      modality1: 'Empreitada Parcial',
      modality2: 'Empreitada Parcial',
      modality3: 'Homem Hora'
    });
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-140px)] bg-[#e2e8f0] rounded-[3.5rem] overflow-hidden border border-slate-300 shadow-2xl relative" id="vendor-list-container">
      
      {/* BACKGROUND FOREST WATERMARK EFFECT */}
      <div className="absolute bottom-0 right-0 left-0 pointer-events-none opacity-[0.05] z-0 flex items-end justify-center select-none">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 300" className="w-full text-[#064e3b] fill-current">
          <path d="M50 300 L120 180 L100 180 L160 100 L140 100 L200 20 L260 100 L240 100 L300 180 L280 180 L350 300 Z" />
          <path d="M250 300 L310 200 L290 200 L340 130 L320 130 L370 60 L420 130 L400 130 L450 200 L430 200 L490 300 Z" />
          <path d="M450 300 L520 170 L500 170 L560 90 L540 90 L600 10 L660 90 L640 90 L700 170 L680 170 L750 300 Z" />
          <path d="M680 300 L740 190 L720 190 L770 110 L750 110 L800 40 L850 110 L830 110 L880 190 L860 190 L920 300 Z" />
          <path d="M820 300 L880 210 L860 210 L910 140 L890 140 L940 70 L990 140 L970 140 L1020 210 L1000 210 L1060 300 Z" />
        </svg>
      </div>

      {/* LEFT SIDEBAR: DARK GREEN GRAPHICAL PANELS */}
      <div className="w-full lg:w-64 bg-[#0a5c43] text-white p-6 flex flex-col gap-6 z-10 shrink-0 border-r border-[#084b36]">
        {/* Sphere Logotype Wrapper */}
        <div className="flex flex-col items-center py-4 border-b border-[#0f7657]">
          <div className="w-20 h-20 bg-emerald-950 rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden group hover:scale-105 transition-all mb-3 border border-emerald-500/20">
            {/* Glossy sphere overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#064e3b]/80 via-transparent to-white/40 mix-blend-overlay z-10"></div>
            <div className="absolute top-1 left-2 right-2 h-7 bg-white/20 rounded-full blur-[2px]"></div>
            
            {/* Visual Logo Content */}
            <svg viewBox="0 0 100 100" className="w-14 h-14 text-white fill-current relative z-0">
              <path d="M50 15 L25 55 L35 55 L20 75 L45 75 L45 85 L55 85 L55 75 L80 75 L65 55 L75 55 Z" />
            </svg>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">Resinas Brasil</span>
        </div>

        {/* Filter Card 1: Região de Atuação */}
        <div className="bg-white rounded-3xl p-5 shadow-xl text-slate-805 flex flex-col border border-slate-200">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
            Região de Atua...
          </h3>
          <div className="space-y-3">
            {activeTabRegions.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">Nenhum registro para esta categoria</p>
            ) : (
              activeTabRegions.map(region => (
                <label key={region} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox"
                    checked={!!selectedRegions[region]}
                    onChange={() => handleRegionCheckboxChange(region)}
                    className="h-5 w-5 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 font-bold group-hover:text-slate-900 select-none transition-colors">
                    {region}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Filter Card 2: Empresa Dropdown */}
        <div className="bg-white rounded-3xl p-5 shadow-xl text-slate-805 flex flex-col border border-slate-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 flex-grow">
              Empresa
            </h3>
            <ChevronDown className="text-slate-400 w-4 h-4 ml-1" />
          </div>
          <select
            value={selectedCompanyDropdown}
            onChange={(e) => setSelectedCompanyDropdown(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all cursor-pointer"
          >
            <option value="Todos">Todos</option>
            {dropdownCompanies.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* Global actions */}
        <div className="mt-auto pt-6 border-t border-[#0f7657] flex flex-col gap-2">
          <button 
            type="button"
            onClick={() => setShowAddModal(true)}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-black text-2xs uppercase tracking-widest py-3 px-4 rounded-2xl shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 border border-emerald-400/10"
          >
            <Plus size={14} strokeWidth={3} /> Nova Construtora
          </button>
          <button 
            type="button"
            onClick={handleReset}
            className="w-full bg-[#084b36] hover:bg-[#063a2a] text-emerald-250 hover:text-white font-bold text-2xs uppercase tracking-widest py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 border border-[#0d644a]/20"
          >
            <RotateCcw size={13} /> Restaurar Padrão
          </button>
        </div>
      </div>

      {/* RIGHT SIDEBAR: CONTENT MODULE */}
      <div className="flex-1 p-6 lg:p-10 flex flex-col gap-8 z-10 relative">
        
        {/* HEADER BRANDING CARD */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="bg-white py-4 px-8 rounded-3xl shadow-lg border border-slate-200">
            <h1 className="text-xl md:text-2xl font-black text-[#0a5c43] tracking-tight uppercase flex items-center gap-3">
              <span className="w-3 h-6 bg-emerald-600 rounded-sm inline-block"></span>
              Vendor List - Construtoras
            </h1>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-72">
            <input 
              type="text"
              placeholder="Buscar construtora..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-slate-850 pl-10 pr-4 py-3 rounded-2xl text-xs font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-slate-200 shadow-md transition-all"
            />
            <Search className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
          </div>
        </div>

        {/* FIVE HORIZONTAL CAPABILITY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          
          {/* Card 1 */}
          <div className="bg-white rounded-2xl shadow-md p-4 border-l-4 border-emerald-600 flex flex-col justify-center min-h-[70px]">
            <span className="text-emerald-700 text-xs font-black tracking-tight">{modalitiesSummary.m1}</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">Especialidade Principal</span>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl shadow-md p-4 border-l-4 border-emerald-650 flex flex-col justify-center min-h-[70px]">
            <span className="text-emerald-700 text-xs font-black tracking-tight">{modalitiesSummary.m2}</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">Especialidade Secundária</span>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl shadow-md p-4 border-l-4 border-emerald-700 flex flex-col justify-center min-h-[70px]">
            <span className="text-emerald-700 text-xs font-black tracking-tight truncate" title={modalitiesSummary.m3}>
              {modalitiesSummary.m3}
            </span>
            <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">Regime Contratação</span>
          </div>

          {/* Card 4 - Dynamic Region Badge */}
          <div className="bg-white rounded-2xl shadow-md p-4 border-l-4 border-emerald-750 flex flex-col justify-center min-h-[70px] text-center">
            <span className="text-emerald-700 text-md font-black tracking-wider block">
              {modalitiesSummary.atuacao}
            </span>
            <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Atuação</span>
          </div>

          {/* Card 5 - Status Badge */}
          <div className="bg-white rounded-2xl shadow-md p-4 border-l-4 border-emerald-800 flex flex-col justify-center min-h-[70px] text-center">
            <span className="text-emerald-750 text-xs font-black tracking-wider block">
              {modalitiesSummary.situacao}
            </span>
            <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Situação</span>
          </div>

        </div>

        {/* SIZE TABS NAVIGATION */}
        <div className="flex flex-wrap gap-2 border-b border-slate-350 pb-2">
          {SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => handleTabChange(size)}
              className={`
                px-5 py-2 text-xs font-black uppercase tracking-wider rounded-xl border border-slate-300 transition-all duration-150 shadow-sm
                ${activeSize === size 
                  ? 'bg-slate-800 text-white border-slate-800 shadow-md shadow-slate-900/10' 
                  : 'bg-white text-slate-650 hover:bg-slate-50 hover:text-slate-800'}
              `}
            >
              {size}
            </button>
          ))}
        </div>

        {/* RESULTS TABLE PANEL */}
        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-200 flex-1 flex flex-col min-h-[300px]">
          <div className="overflow-x-auto flex-1 h-full pr-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-blue-500/20 select-text">
                  <th className="px-6 py-4 text-xs font-black text-slate-700 uppercase tracking-widest min-w-[120px]">Empresa</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-700 uppercase tracking-widest min-w-[100px]">Porte</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-700 uppercase tracking-widest min-w-[100px]">Situação</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-700 uppercase tracking-widest min-w-[150px]">CNPJ</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-700 uppercase tracking-widest min-w-[150px]">Cidade</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-700 uppercase tracking-widest min-w-[150px]">Região de Atuação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 select-text font-medium text-xs text-slate-800">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-450 font-medium">
                      <div className="flex flex-col items-center gap-3">
                        <AlertCircle className="text-slate-350 w-10 h-10" />
                        <p className="text-sm font-black text-slate-500">Nenhum fornecedor encontrado</p>
                        <p className="text-2xs text-slate-400 max-w-xs">Tente ajustar seus critérios de busca, os filtros de regiões selecionadas ou mude de aba de porte.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item, index) => (
                    <tr 
                      key={item.id}
                      className={`hover:bg-emerald-50/20 transition-colors ${index % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}`}
                    >
                      <td className="px-6 py-4 font-black text-slate-800 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 block"></span>
                        {item.name}
                      </td>
                      <td className="px-6 py-4 text-slate-550">{item.size}</td>
                      <td className="px-6 py-4">
                        <span className={`
                          px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1
                          ${item.status === SupplierStatus.HOMOLOGATED 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' 
                            : item.status === SupplierStatus.PENDING 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/50' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200/50'}
                        `}>
                          <span className={`w-1 h-1 rounded-full ${item.status === SupplierStatus.HOMOLOGATED ? 'bg-emerald-600' : item.status === SupplierStatus.PENDING ? 'bg-amber-600' : 'bg-rose-600'}`}></span>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-500">{item.cnpj}</td>
                      <td className="px-6 py-4 text-slate-500">{item.city}</td>
                      <td className="px-6 py-4 text-slate-600 font-bold uppercase tracking-tight">{item.region}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Table Footer Summary */}
          <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-2xs text-slate-450 font-black uppercase tracking-widest gap-2">
            <span>Categoria: Construção Civil</span>
            <span>Total de Registros: {filteredList.length} de {construtoras.filter(c => c.size === activeSize).length}</span>
          </div>
        </div>

      </div>

      {/* MODAL: ADD CONSTRUTORA */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-scale-up">
            
            {/* Header */}
            <div className="bg-[#0a5c43] text-white px-8 py-6 flex justify-between items-center">
              <h2 className="text-lg font-black uppercase tracking-wider flex items-center gap-2">
                <Building2 size={20} /> Cadastrar Nova Construtora
              </h2>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-emerald-100 hover:text-white font-black text-sm"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddCompany} className="p-8 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Razão Social / Nome Fantasia *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Construtora Rocha Ltda"
                  value={newCompany.name}
                  onChange={e => setNewCompany(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">CNPJ *</label>
                  <input 
                    type="text"
                    required
                    placeholder="00.000.000/0001-00"
                    value={newCompany.cnpj}
                    onChange={e => setNewCompany(prev => ({ ...prev, cnpj: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Cidade e Estado</label>
                  <input 
                    type="text"
                    placeholder="Cidade – UF"
                    value={newCompany.city}
                    onChange={e => setNewCompany(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Porte de Atuação</label>
                  <select 
                    value={newCompany.size}
                    onChange={e => setNewCompany(prev => ({ ...prev, size: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Região de Atuação</label>
                  <select 
                    value={newCompany.region}
                    onChange={e => setNewCompany(prev => ({ ...prev, region: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    <option value="SP">SP</option>
                    <option value="Sul">Sul</option>
                    <option value="SP / PR / Sul">SP / PR / Sul</option>
                    <option value="Nacional">Nacional</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Situação Cadastral</label>
                <div className="flex gap-4 p-2 bg-slate-50 border border-slate-200 rounded-2xl">
                  {Object.values(SupplierStatus).map(status => (
                    <label key={status} className="flex-1 flex items-center justify-center gap-1.5 py-2 whitespace-nowrap rounded-lg active:scale-95 transition-all text-[10px] font-black uppercase cursor-pointer select-none">
                      <input 
                        type="radio" 
                        name="add_status"
                        checked={newCompany.status === status}
                        onChange={() => setNewCompany(prev => ({ ...prev, status }))}
                        className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      {status}
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end gap-3 mt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 bg-slate-150 hover:bg-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 bg-[#0a5c43] hover:bg-[#074632] text-white rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-emerald-900/10 transition-all"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default VendorList;
