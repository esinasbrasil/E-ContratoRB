import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Terminal } from 'lucide-react';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import EngineeringModule from './components/EngineeringModule';
import SupplierCompliance from './components/SupplierCompliance';
import Dashboard from './components/Dashboard';
import ContractWizard from './components/ContractWizard';
import ServiceTypeManager from './components/ServiceTypeManager';
import UnitManager from './components/UnitManager';
import ProjectManager from './components/ProjectManager';
import SupplierManager from './components/SupplierManager';
import ContractManager from './components/ContractManager';
import SettingsManager from './components/SettingsManager';
import LoginPage from './components/LoginPage';
import { Supplier, SupplierStatus, Project, DashboardStats, ServiceCategory, Unit, Contract, ContractRequestData, CompanySettings } from './types';
import { analyzeSupplierRisk } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [currentModule, setCurrentModule] = useState<'home' | 'contracts' | 'engineering' | 'compliance'>('home');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [failedTable, setFailedTable] = useState<string | null>(null);
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
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

  // --- AUTH INITIALIZATION ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchData(); // Re-fetch data on login
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- SUPABASE FETCHING & MAPPING ---

  const fetchData = async () => {
    // Only fetch if session exists
    const currentSession = await supabase.auth.getSession();
    if (!currentSession.data.session) return;

    setLoading(true);
    setConnectionError(null);
    setFailedTable(null);

    try {
      // 1. Service Categories
      const { data: servicesData, error: servicesError } = await supabase.from('service_categories').select('*');
      if (servicesError) {
        setFailedTable('service_categories');
        throw new Error(servicesError.message);
      }
      if (servicesData) setServiceCategories(servicesData);

      // 2. Units
      const { data: unitsData, error: unitsError } = await supabase.from('units').select('*');
      if (unitsError) {
        setFailedTable('units');
        throw new Error(unitsError.message);
      }
      if (unitsData) setUnits(unitsData);

      // 3. Suppliers (Map snake_case to camelCase)
      const { data: suppliersData, error: suppliersError } = await supabase.from('suppliers').select('*');
      if (suppliersError) {
        setFailedTable('suppliers');
        throw new Error(suppliersError.message);
      }
      if (suppliersData) {
        setSuppliers(suppliersData.map((s: any) => ({
          ...s,
          serviceType: s.service_type
        })));
      }

      // 4. Projects (Map snake_case to camelCase)
      const { data: projectsData, error: projectsError } = await supabase.from('projects').select('*');
      if (projectsError) {
        setFailedTable('projects');
        throw new Error(projectsError.message);
      }
      if (projectsData) {
        setProjects(projectsData.map((p: any) => ({
          ...p,
          unitId: p.unit_id,
          costCenter: p.cost_center,
          estimatedValue: p.estimated_value,
          startDate: p.start_date,
          endDate: p.end_date,
          requiredNRs: p.required_nrs || []
        })));
      }

      // 5. Contracts (Map snake_case to camelCase)
      const { data: contractsData, error: contractsError } = await supabase.from('contracts').select('*');
      if (contractsError) {
        setFailedTable('contracts');
        throw new Error(contractsError.message);
      }
      if (contractsData) {
        setContracts(contractsData.map((c: any) => ({
          ...c,
          projectId: c.project_id,
          supplierId: c.supplier_id,
          createdAt: c.created_at
        })));
      }

      // 6. Settings
      const { data: settingsData, error: settingsError } = await supabase.from('company_settings').select('*').single();
      // Settings might be empty initially, so we tolerate error code PGRST116 (0 rows)
      if (settingsError && settingsError.code !== 'PGRST116') {
         console.warn("Settings warning:", settingsError.message);
      }
      
      if (settingsData) {
        setCompanySettings({
          companyName: settingsData.company_name,
          logoBase64: settingsData.logo_base64,
          footerText: settingsData.footer_text,
          primaryColor: settingsData.primary_color,
          documentTitle: settingsData.document_title
        });
      }

    } catch (error: any) {
      console.error("Error fetching data from Supabase:", error);
      setConnectionError(error.message || "Erro desconhecido de conexão.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

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

  // --- CRUD HANDLERS WITH SUPABASE ---

  const handleSaveContract = async (data: ContractRequestData, supplierId: string, value: number) => {
    if (editingContract) {
       // Update existing
       const updatedContract: Contract = {
         ...editingContract,
         value: value,
         details: data,
         supplierId: supplierId,
         projectId: data.projectId
       };
       
       const { error } = await supabase.from('contracts').update({
         value: updatedContract.value,
         details: updatedContract.details,
         supplier_id: updatedContract.supplierId,
         project_id: updatedContract.projectId
       }).eq('id', updatedContract.id);

       if (!error) {
         setContracts(prev => prev.map(c => c.id === editingContract.id ? updatedContract : c));
       } else {
         alert(`Erro ao salvar: ${error.message}`);
       }
    } else {
       // Create new
       const newContract: Contract = {
        id: crypto.randomUUID(),
        projectId: data.projectId || '',
        supplierId: supplierId,
        value: value,
        createdAt: new Date().toISOString(),
        status: 'Draft',
        details: data
      };

      const { error } = await supabase.from('contracts').insert({
        id: newContract.id,
        project_id: newContract.projectId,
        supplier_id: newContract.supplierId,
        value: newContract.value,
        created_at: newContract.createdAt,
        status: newContract.status,
        details: newContract.details
      });

      if (!error) {
        setContracts(prev => [newContract, ...prev]);
      } else {
        alert(`Erro ao salvar: ${error.message}`);
      }
    }
  };

  const handleDeleteContract = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta solicitação?")) {
      const { error } = await supabase.from('contracts').delete().eq('id', id);
      if (!error) {
        setContracts(prev => prev.filter(c => c.id !== id));
      } else {
        alert(`Erro ao excluir: ${error.message}`);
      }
    }
  };

  // Service Type Management Handlers
  const handleAddService = async (service: ServiceCategory) => {
    const { error } = await supabase.from('service_categories').insert({
      id: service.id,
      name: service.name,
      description: service.description
    });
    if (!error) setServiceCategories([...serviceCategories, service]);
    else alert(`Erro ao adicionar serviço: ${error.message}`);
  };

  const handleDeleteService = async (id: string) => {
    if (confirm('Tem certeza que deseja remover esta categoria de serviço?')) {
      const { error } = await supabase.from('service_categories').delete().eq('id', id);
      if (!error) setServiceCategories(serviceCategories.filter(s => s.id !== id));
      else alert(`Erro ao deletar: ${error.message}`);
    }
  };

  // Unit Management Handlers
  const handleAddUnit = async (unit: Unit) => {
    const { error } = await supabase.from('units').insert(unit);
    if (!error) setUnits([...units, unit]);
    else alert(`Erro ao adicionar unidade: ${error.message}`);
  };

  const handleUpdateUnit = async (updatedUnit: Unit) => {
    const { error } = await supabase.from('units').update(updatedUnit).eq('id', updatedUnit.id);
    if (!error) setUnits(units.map(u => u.id === updatedUnit.id ? updatedUnit : u));
    else alert(`Erro ao atualizar: ${error.message}`);
  };

  const handleDeleteUnit = async (id: string) => {
    if (confirm('Tem certeza que deseja remover esta unidade?')) {
      const { error } = await supabase.from('units').delete().eq('id', id);
      if (!error) setUnits(units.filter(u => u.id !== id));
      else alert(`Erro ao deletar: ${error.message}`);
    }
  };

  // Project Management Handlers
  const handleAddProject = async (project: Project) => {
    const dbProject = {
      id: project.id,
      name: project.name,
      unit_id: project.unitId,
      cost_center: project.costCenter,
      description: project.description,
      estimated_value: project.estimatedValue,
      start_date: project.startDate,
      end_date: project.endDate,
      status: project.status,
      type: project.type,
      attachments: project.attachments,
      required_nrs: project.requiredNRs
    };

    const { error } = await supabase.from('projects').insert(dbProject);
    if (!error) setProjects([...projects, project]);
    else alert(`Erro ao adicionar projeto: ${error.message}`);
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    const dbProject = {
      name: updatedProject.name,
      unit_id: updatedProject.unitId,
      cost_center: updatedProject.costCenter,
      description: updatedProject.description,
      estimated_value: updatedProject.estimatedValue,
      start_date: updatedProject.startDate,
      end_date: updatedProject.endDate,
      status: updatedProject.status,
      type: updatedProject.type,
      attachments: updatedProject.attachments,
      required_nrs: updatedProject.requiredNRs
    };

    const { error } = await supabase.from('projects').update(dbProject).eq('id', updatedProject.id);
    if (!error) setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
    else alert(`Erro ao atualizar projeto: ${error.message}`);
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este projeto?')) {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (!error) setProjects(projects.filter(p => p.id !== id));
      else alert(`Erro ao deletar: ${error.message}`);
    }
  };

  // Supplier Management Handlers
  const handleAddSupplier = async (supplier: Supplier) => {
    const dbSupplier = {
      id: supplier.id,
      name: supplier.name,
      cnpj: supplier.cnpj,
      address: supplier.address,
      service_type: supplier.serviceType,
      status: supplier.status,
      rating: supplier.rating,
      docs: supplier.docs
    };

    const { error } = await supabase.from('suppliers').insert(dbSupplier);
    if (!error) setSuppliers([...suppliers, supplier]);
    else alert(`Erro ao adicionar fornecedor: ${error.message}`);
  };

  const handleUpdateSupplier = async (updatedSupplier: Supplier) => {
     const dbSupplier = {
      name: updatedSupplier.name,
      cnpj: updatedSupplier.cnpj,
      address: updatedSupplier.address,
      service_type: updatedSupplier.serviceType,
      status: updatedSupplier.status,
      rating: updatedSupplier.rating,
      docs: updatedSupplier.docs
    };

    const { error } = await supabase.from('suppliers').update(dbSupplier).eq('id', updatedSupplier.id);
    if (!error) setSuppliers(suppliers.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
    else alert(`Erro ao atualizar fornecedor: ${error.message}`);
  };

  const handleDeleteSupplier = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este fornecedor?')) {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (!error) setSuppliers(suppliers.filter(s => s.id !== id));
      else alert(`Erro ao deletar: ${error.message}`);
    }
  };

  const handleSaveSettings = async (settings: CompanySettings) => {
    const dbSettings = {
      company_name: settings.companyName,
      logo_base64: settings.logoBase64,
      footer_text: settings.footerText,
      primary_color: settings.primaryColor,
      document_title: settings.documentTitle
    };
    
    // Upsert to row with ID 1
    const { error } = await supabase.from('company_settings').upsert({ id: 1, ...dbSettings });
    if (!error) setCompanySettings(settings);
    else alert(`Erro ao salvar configurações: ${error.message}`);
  };

  const handleResetDatabase = async () => {
    if (!window.confirm("ATENÇÃO EXTREMA: Isso apagará TODOS os dados do banco de dados.\n\nTem certeza absoluta?")) return;
    
    setLoading(true);
    try {
        await supabase.from('contracts').delete().neq('id', '0');
        await supabase.from('projects').delete().neq('id', '0');
        await supabase.from('suppliers').delete().neq('id', '0');
        await supabase.from('units').delete().neq('id', '0');
        await supabase.from('service_categories').delete().neq('id', '0');
        
        await fetchData(); // Reload empty state
        setActiveTab('dashboard');
        alert("Banco de dados resetado com sucesso.");
    } catch (e: any) {
        alert("Erro ao resetar: " + e.message);
    } finally {
        setLoading(false);
    }
  };

  // --- RENDERING ---

  if (authChecking) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 flex-col">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      </div>
     );
  }

  if (!session) {
    return <LoginPage />;
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 flex-col">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">Carregando Sistema...</h2>
        <p className="text-sm text-gray-500 mt-2">Sincronizando dados seguros</p>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-lg w-full border-t-4 border-red-500">
           <div className="flex items-center text-red-600 mb-4">
              <AlertTriangle size={32} className="mr-3" />
              <h1 className="text-2xl font-bold">Erro de Segurança</h1>
           </div>
           
           <p className="text-gray-700 mb-4">
             O sistema detectou um problema de permissão na tabela <strong className="font-mono bg-gray-100 px-1 rounded">{failedTable || 'desconhecida'}</strong>.
           </p>
           
           <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-sm text-yellow-800 mb-6">
             <strong>Ação Requerida:</strong> O administrador do banco de dados deve ativar as políticas de segurança (RLS) para permitir que usuários autenticados acessem os dados.
           </div>

           <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center"><Terminal size={16} className="mr-2"/> Correção:</h3>
              <p className="text-sm text-gray-600">
                Execute o script SQL fornecido no console do Supabase para ativar as políticas de acesso para usuários autenticados.
              </p>
              
              <button 
                onClick={fetchData} 
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold flex items-center justify-center transition-colors"
              >
                <RefreshCw size={20} className="mr-2" />
                Tentar Novamente
              </button>

              <button 
                onClick={() => supabase.auth.signOut()} 
                className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm"
              >
                Sair da conta
              </button>
           </div>
           
           <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400 font-mono break-all">
             Erro: {connectionError}
           </div>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      {/* 1. Landing Page (Portal) */}
      {currentModule === 'home' && (
        <LandingPage onSelectModule={setCurrentModule} />
      )}

      {/* 2. Engineering Module */}
      {currentModule === 'engineering' && (
        <EngineeringModule 
          projects={projects}
          units={units}
          onAddProject={handleAddProject}
          onUpdateProject={handleUpdateProject}
          onBack={() => setCurrentModule('home')}
        />
      )}

      {/* 3. Compliance Module (Ficha) */}
      {currentModule === 'compliance' && (
        <SupplierCompliance onBack={() => setCurrentModule('home')} />
      )}

      {/* 4. Contracts Module (Original App) */}
      {currentModule === 'contracts' && (
        <>
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

          <Layout activeTab={activeTab} onNavigate={(tab) => {
             if (tab === 'home') {
                 setCurrentModule('home');
             } else {
                 setActiveTab(tab);
             }
          }}>
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
                onSave={handleSaveSettings}
                onReset={handleResetDatabase}
              />
            )}
          </Layout>
        </>
      )}
    </HashRouter>
  );
};

export default App;