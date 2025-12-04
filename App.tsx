import React, { useState } from 'react';
import { HashRouter } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ContractWizard from './components/ContractWizard';
import ServiceTypeManager from './components/ServiceTypeManager';
import UnitManager from './components/UnitManager';
import ProjectManager from './components/ProjectManager';
import SupplierManager from './components/SupplierManager';
import ContractManager from './components/ContractManager';
import SettingsManager from './components/SettingsManager';
import { Supplier, SupplierStatus, Project, DashboardStats, ServiceCategory, Unit, Contract, ContractRequestData, CompanySettings } from './types';
import { analyzeSupplierRisk } from './services/geminiService';

// Initial Service Types
const INITIAL_SERVICES: ServiceCategory[] = [
  { id: '1', name: 'Construção Civil', description: 'Obras, reformas e manutenções prediais.' },
  { id: '2', name: 'Instalações Elétricas', description: 'Alta e baixa tensão, manutenção de quadros.' },
  { id: '3', name: 'Instalações Hidráulicas', description: 'Redes de água, esgoto e bombeiros.' },
  { id: '4', name: 'Mecânica Industrial', description: 'Manutenção de máquinas e equipamentos pesados.' },
  { id: '5', name: 'Refrigeração e Climatização', description: 'Ar condicionado, chillers e ventilação.' },
  { id: '6', name: 'Tecnologia da Informação', description: 'Infraestrutura de rede, suporte e software.' },
];

const INITIAL_UNITS: Unit[] = [
  { 
    id: 'u1', 
    name: 'BA01 Unidade de Salto', 
    address: 'ESTRADA DO GUARUJA 3150 SALTO/SP 13323-005', 
    cnpj: '01.593.699/0001-03', 
    ie: '600044670110',
    email: 'nfe@socer.com.br',
    phone: '55 11 40289900'
  },
  { 
    id: 'u2', 
    name: 'BA06 - UNIDADE DE SENGÉS', 
    address: 'EST MUNICIPAL SENGES BARRA SN SENGES/PR 84220-000', 
    cnpj: '01.593.699/0006-18', 
    ie: '9074884110',
    email: 'nfe.socer-senges@gruporesinasbrasil.com.br',
    phone: '55 43 35671324'
  },
  { 
    id: 'u3', 
    name: 'BA03 - UNIDADE DE MANDURI', 
    address: 'ESTRADA MUNICIPAL MANDURI - SAO BERTO KM10 MANDURI/SP 18780-000', 
    cnpj: '01.593.699/0005-37', 
    ie: '434016029115',
    email: 'nfe.socer-manduri@gruporesinasbrasil.com.br',
    phone: '55 14 33561511'
  },
  { 
    id: 'u4', 
    name: 'BA07 - UNIDADE ITAPETININGA - RESINAS FOOD', 
    address: 'ESTRADA MUNICIPAL OLAVO EGYDIO DE SOUZA ARANHA SETUBAL 251 ITAPETIININGA/SP 18208-860', 
    cnpj: '01.593.699/0007-07', 
    ie: '371281130115',
    email: 'nfe.socer-itapetininga@gruporesinasbrasil.com.br',
    phone: '55 15 32758325'
  },
  { 
    id: 'u5', 
    name: 'AE01 - UNIDADE ITACOL', 
    address: 'ESTRADA MUNICIPAL OLAVO EGYDIO DE SOUZA ARANHA SETUBAL 251 ITAPETININGA/SP 18200-000', 
    cnpj: '11.151.429/0001-04', 
    ie: '371249510110',
    email: 'nfe.itacol@gruporesinasbrasil.com.br',
    phone: '55 15 32758323'
  },
  { 
    id: 'u6', 
    name: 'BA02 - UNIDADE SWEETGUM', 
    address: 'ESTRADA MUNICIPAL OLAVO EGYDIO DE SOUZA ARANHA SETUBAL 251 ITAPETININGA/SP 18200-000', 
    cnpj: '01.593.699/0002-94', 
    ie: '371097932115',
    email: 'nfe.sg-itapetininga@gruporesinasbrasil.com.br',
    phone: '55 15 32758325'
  },
  { 
    id: 'u7', 
    name: 'BA11 - UNIDADE SUL', 
    address: 'RUA ROMAR DEMETRIO VANZIN (DIRG) 5200 RIO GRANDE/RS 96204-460', 
    cnpj: '01.593.699/0013-47', 
    ie: '1000327024',
    email: 'nfe.rbsul@gruporesinasbrasil.com.br',
    phone: '55 53 32341650'
  }
];

// Mock Data
const MOCK_SUPPLIERS: Supplier[] = [
  { id: '1', name: 'Construtora Silva', cnpj: '12.345.678/0001-90', address: 'Av. Paulista, 1000', serviceType: 'Construção Civil', status: SupplierStatus.HOMOLOGATED, rating: 4.5, docs: ['contrato.pdf'] },
  { id: '2', name: 'Elétrica Rapida Ltda', cnpj: '98.765.432/0001-10', address: 'Rua das Flores, 200', serviceType: 'Instalações Elétricas', status: SupplierStatus.PENDING, rating: 0, docs: [] },
  { id: '3', name: 'Mecânica Pesada S.A', cnpj: '11.222.333/0001-55', address: 'Distrito Industrial, 5', serviceType: 'Mecânica Industrial', status: SupplierStatus.BLOCKED, rating: 2.0, docs: ['doc_vencido.pdf'] },
  { id: '4', name: 'Tech Solutions', cnpj: '44.555.666/0001-99', address: 'Rua Inovação, 404', serviceType: 'Tecnologia da Informação', status: SupplierStatus.HOMOLOGATED, rating: 5.0, docs: ['certidao.pdf'] },
  { id: '5', name: 'Clima Ideal HVAC', cnpj: '33.444.555/0001-22', address: 'Av. das Nações, 500', serviceType: 'Refrigeração e Climatização', status: SupplierStatus.HOMOLOGATED, rating: 4.8, docs: ['certidao_tecnica.pdf'] },
];

const MOCK_PROJECTS: Project[] = [
  { 
    id: 'p1', 
    name: 'Reforma Sede SP', 
    unitId: 'u1', 
    costCenter: 'CC-ADM-01',
    description: 'Reforma completa da área administrativa e fachada.',
    estimatedValue: 150000,
    startDate: '2023-10-01', 
    endDate: '2024-03-01', 
    status: 'Active' 
  },
  { 
    id: 'p2', 
    name: 'Manutenção Elétrica Fabrica', 
    unitId: 'u2', 
    costCenter: 'CC-OP-05',
    description: 'Manutenção preventiva dos quadros de força da linha 2.',
    estimatedValue: 45000,
    startDate: '2023-11-15', 
    endDate: '2023-12-15', 
    status: 'Active' 
  },
  { 
    id: 'p3', 
    name: 'Instalação Chillers', 
    unitId: 'u1', 
    costCenter: 'CC-UTIL-02',
    description: 'Instalação de novos chillers para o sistema de resfriamento.',
    estimatedValue: 320000,
    startDate: '2024-01-10', 
    endDate: '2024-02-28', 
    status: 'Active' 
  },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(INITIAL_SERVICES);
  const [units, setUnits] = useState<Unit[]>(INITIAL_UNITS);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [contracts, setContracts] = useState<Contract[]>([]);
  
  // Company Settings State
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    companyName: 'EcoContract Manager',
    logoBase64: null,
    footerText: 'Documento confidencial gerado via EcoContract System',
    primaryColor: '#064e3b',
    documentTitle: 'Solicitação de Contrato / Minuta'
  });
  
  // Controls wizard visibility and pre-selection
  const [contractWizardSupplierId, setContractWizardSupplierId] = useState<string | null>(null);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  
  // AI Analysis State
  const [analyzingRisk, setAnalyzingRisk] = useState<string | null>(null);
  const [riskReport, setRiskReport] = useState<{id: string, text: string} | null>(null);

  const stats: DashboardStats = {
    totalSuppliers: suppliers.length,
    activeProjects: projects.filter(p => p.status === 'Active').length,
    contractsGenerated: contracts.length,
    pendingHomologations: suppliers.filter(s => s.status === SupplierStatus.PENDING).length
  };

  const handleRiskAnalysis = async (supplier: Supplier) => {
    setAnalyzingRisk(supplier.id);
    const report = await analyzeSupplierRisk(supplier.name, supplier.serviceType);
    setRiskReport({ id: supplier.id, text: report });
    setAnalyzingRisk(null);
  };

  const openContractWizard = (supplierId?: string) => {
    setEditingContract(null);
    setContractWizardSupplierId(supplierId || 'new');
  };

  const handleEditContract = (contract: Contract) => {
    setEditingContract(contract);
    setContractWizardSupplierId(contract.supplierId);
  };

  const handleSaveContract = (data: ContractRequestData, supplierId: string, value: number) => {
    if (editingContract) {
       // Update existing
       const updatedContract: Contract = {
         ...editingContract,
         value: value,
         details: data,
         supplierId: supplierId,
         projectId: data.projectId
       };
       setContracts(contracts.map(c => c.id === editingContract.id ? updatedContract : c));
    } else {
       // Create new
       const newContract: Contract = {
        id: Date.now().toString(),
        projectId: data.projectId || '',
        supplierId: supplierId,
        value: value,
        createdAt: new Date().toISOString(),
        status: 'Draft',
        details: data
      };
      setContracts([newContract, ...contracts]);
    }
  };

  const handleDeleteContract = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta solicitação?")) {
      setContracts(contracts.filter(c => c.id !== id));
    }
  };

  // Service Type Management Handlers
  const handleAddService = (service: ServiceCategory) => {
    setServiceCategories([...serviceCategories, service]);
  };

  const handleDeleteService = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta categoria de serviço?')) {
      setServiceCategories(serviceCategories.filter(s => s.id !== id));
    }
  };

  // Unit Management Handlers
  const handleAddUnit = (unit: Unit) => {
    setUnits([...units, unit]);
  };

  const handleUpdateUnit = (updatedUnit: Unit) => {
    setUnits(units.map(u => u.id === updatedUnit.id ? updatedUnit : u));
  };

  const handleDeleteUnit = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta unidade?')) {
      setUnits(units.filter(u => u.id !== id));
    }
  };

  // Project Management Handlers
  const handleAddProject = (project: Project) => {
    setProjects([...projects, project]);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const handleDeleteProject = (id: string) => {
    if (confirm('Tem certeza que deseja remover este projeto?')) {
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  // Supplier Management Handlers
  const handleAddSupplier = (supplier: Supplier) => {
    setSuppliers([...suppliers, supplier]);
  };

  const handleUpdateSupplier = (updatedSupplier: Supplier) => {
    setSuppliers(suppliers.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
  };

  const handleDeleteSupplier = (id: string) => {
    if (confirm('Tem certeza que deseja remover este fornecedor?')) {
      setSuppliers(suppliers.filter(s => s.id !== id));
    }
  };

  const handleResetDatabase = () => {
    setSuppliers([]);
    setProjects([]);
    setUnits([]);
    setContracts([]);
    setServiceCategories([]);
    // Optionally alert the user or redirect to dashboard
    setActiveTab('dashboard');
  };

  return (
    <HashRouter>
      {contractWizardSupplierId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
          <ContractWizard 
            suppliers={suppliers} 
            projects={projects}
            units={units}
            settings={companySettings}
            preSelectedSupplierId={contractWizardSupplierId === 'new' ? undefined : contractWizardSupplierId}
            initialData={editingContract?.details}
            onCancel={() => {
              setContractWizardSupplierId(null);
              setEditingContract(null);
            }}
            onSave={handleSaveContract}
          />
        </div>
      )}

      <Layout activeTab={activeTab} onNavigate={setActiveTab}>
        {activeTab === 'dashboard' && <Dashboard stats={stats} suppliersData={suppliers} />}
        {activeTab === 'suppliers' && (
          <SupplierManager
             suppliers={suppliers}
             serviceCategories={serviceCategories}
             onAdd={handleAddSupplier}
             onUpdate={handleUpdateSupplier}
             onDelete={handleDeleteSupplier}
             onOpenContractWizard={openContractWizard}
             onRiskAnalysis={handleRiskAnalysis}
             analyzingRiskId={analyzingRisk}
             riskReport={riskReport}
             onCloseRiskReport={() => setRiskReport(null)}
          />
        )}
        {activeTab === 'contracts' && (
           <ContractManager 
              contracts={contracts} 
              suppliers={suppliers} 
              settings={companySettings} 
              onOpenWizard={() => openContractWizard('new')}
              onEditContract={handleEditContract}
              onDeleteContract={handleDeleteContract}
           />
        )}
        {activeTab === 'types' && (
          <ServiceTypeManager 
            services={serviceCategories} 
            onAdd={handleAddService} 
            onDelete={handleDeleteService} 
          />
        )}
        {activeTab === 'units' && (
           <UnitManager
             units={units}
             onAdd={handleAddUnit}
             onUpdate={handleUpdateUnit}
             onDelete={handleDeleteUnit}
           />
        )}
        {activeTab === 'projects' && (
          <ProjectManager
            projects={projects}
            units={units}
            onAdd={handleAddProject}
            onUpdate={handleUpdateProject}
            onDelete={handleDeleteProject}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsManager 
            settings={companySettings}
            onSave={setCompanySettings}
            onReset={handleResetDatabase}
          />
        )}
      </Layout>
    </HashRouter>
  );
};

export default App;