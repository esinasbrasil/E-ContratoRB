import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LogOut, Loader2 } from 'lucide-react';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import EngineeringModule from './components/EngineeringModule';
import SupplierCompliance from './components/SupplierCompliance';
import Dashboard from './components/Dashboard';
import ContractWizard from './components/ContractWizard';
import UnitManager from './components/UnitManager';
import ProjectManager from './components/ProjectManager';
import SupplierManager from './components/SupplierManager';
import ContractManager from './components/ContractManager';
import SettingsManager from './components/SettingsManager';
import ServiceTypeManager from './components/ServiceTypeManager';
import LoginPage from './components/LoginPage';
import { Supplier, SupplierStatus, Project, ServiceCategory, Unit, Contract, ContractRequestData, CompanySettings } from './types';
import { analyzeSupplierRisk } from './services/geminiService';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';

// Base64 Logo Placeholder (The user provided a logo, I'll use a placeholder for stability or the actual if it fits)
const DEFAULT_LOGO_RB = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23059669'/%3E%3Cpath d='M30 70 L50 30 L70 70' stroke='white' stroke-width='5' fill='none'/%3E%3C/svg%3E";

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [currentModule, setCurrentModule] = useState<'home' | 'contracts' | 'engineering' | 'compliance'>('home');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    companyName: 'GRUPO RESINAS BRASIL',
    logoBase64: DEFAULT_LOGO_RB,
    footerText: 'https://gruporesinasbrasil.com.br/',
    primaryColor: '#064e3b',
    documentTitle: 'Solicitação de Contrato / Minuta'
  });

  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [contractWizardSupplierId, setContractWizardSupplierId] = useState<string | 'new' | null>(null);
  const [analyzingRisk, setAnalyzingRisk] = useState<string | null>(null);
  const [riskReport, setRiskReport] = useState<{ id: string, text: string } | null>(null);

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
      const [
        { data: s }, 
        { data: p }, 
        { data: u }, 
        { data: cat }, 
        { data: ctr },
        { data: settingsData }
      ] = await Promise.all([
        supabase.from('suppliers').select('*').order('name'),
        supabase.from('projects').select('*').order('name'),
        supabase.from('units').select('*').order('name'),
        supabase.from('service_categories').select('*').order('name'),
        supabase.from('contracts').select('*').order('createdAt', { ascending: false }),
        supabase.from('company_settings').select('*').single()
      ]);

      if (s) setSuppliers(s);
      if (p) setProjects(p);
      if (u) setUnits(u);
      if (cat) setServiceCategories(cat);
      if (ctr) setContracts(ctr);
      if (settingsData) setCompanySettings(settingsData);
    } catch (error) {
      console.error("Erro ao sincronizar dados:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session: initialSession } } = await (supabase.auth as any).getSession();
      setSession(initialSession);
      setAuthChecking(false);
      if (initialSession) fetchData();
    };

    initializeAuth();

    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange((_event: any, session: any) => {
      setSession(session);
      if (session) fetchData();
    });

    return () => subscription.unsubscribe();
  }, [fetchData]);

  const handleLogout = async () => {
    await (supabase.auth as any).signOut();
    setSession(null);
  };

  const handleAddSupplier = async (supplier: Supplier) => {
    await supabase.from('suppliers').insert(supplier);
    fetchData();
  };

  const handleUpdateSupplier = async (supplier: Supplier) => {
    await supabase.from('suppliers').update(supplier).eq('id', supplier.id);
    fetchData();
  };

  const handleDeleteSupplier = async (id: string) => {
    await supabase.from('suppliers').delete().eq('id', id);
    fetchData();
  };

  const handleAddProject = async (project: Project) => {
    await supabase.from('projects').insert(project);
    fetchData();
  };

  const handleUpdateProject = async (project: Project) => {
    await supabase.from('projects').update(project).eq('id', project.id);
    fetchData();
  };

  const handleDeleteProject = async (id: string) => {
    await supabase.from('projects').delete().eq('id', id);
    fetchData();
  };

  const handleAddUnit = async (unit: Unit) => {
    await supabase.from('units').insert(unit);
    fetchData();
  };

  const handleUpdateUnit = async (unit: Unit) => {
    await supabase.from('units').update(unit).eq('id', unit.id);
    fetchData();
  };

  const handleDeleteUnit = async (id: string) => {
    await supabase.from('units').delete().eq('id', id);
    fetchData();
  };

  const handleAddServiceCategory = async (cat: ServiceCategory) => {
    await supabase.from('service_categories').insert(cat);
    fetchData();
  };

  const handleDeleteServiceCategory = async (id: string) => {
    if (window.confirm("Deseja realmente excluir este tipo de serviço?")) {
      await supabase.from('service_categories').delete().eq('id', id);
      fetchData();
    }
  };

  const handleSaveContract = async (data: ContractRequestData, supplierId: string, value: number): Promise<boolean> => {
     const newContract: any = editingContract ? {
       ...editingContract, value, details: data, supplierId, projectId: data.projectId
     } : {
       id: crypto.randomUUID(), projectId: data.projectId, supplierId, value, 
       createdAt: new Date().toISOString(), status: 'Draft', details: data
     };

     const { error } = await supabase.from('contracts').upsert(newContract);
     if (error) return false;
     fetchData();
     return true;
  };

  const handleDeleteContract = async (id: string) => {
    if (window.confirm("Excluir esta solicitação?")) {
      await supabase.from('contracts').delete().eq('id', id);
      fetchData();
    }
  };

  const handleRiskAnalysis = async (supplier: Supplier) => {
    setAnalyzingRisk(supplier.id);
    const report = await analyzeSupplierRisk(supplier.name, supplier.serviceType);
    setRiskReport({ id: supplier.id, text: report });
    setAnalyzingRisk(null);
  };

  const handleSaveSettings = async (s: CompanySettings) => {
    setCompanySettings(s);
    await supabase.from('company_settings').upsert({ id: 1, ...s });
  };

  const handleDemoLogin = () => {
    setSession({ 
      user: { email: 'demo@gruporb.com.br', id: 'demo' },
      access_token: 'demo'
    } as any);
  };

  if (authChecking) return (
    <div className="h-screen w-full flex items-center justify-center bg-white">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="mt-6 text-slate-400 font-black text-[10px] uppercase tracking-widest">Iniciando Sistemas...</p>
      </div>
    </div>
  );

  if (!session) return <LoginPage onDemoLogin={handleDemoLogin} />;

  return (
    <BrowserRouter>
      {currentModule === 'home' && <LandingPage onSelectModule={setCurrentModule} />}
      
      {currentModule === 'engineering' && (
        <EngineeringModule 
          projects={projects} units={units}
          onAddProject={handleAddProject} onUpdateProject={handleUpdateProject}
          onBack={() => setCurrentModule('home')}
        />
      )}

      {currentModule === 'compliance' && <SupplierCompliance onBack={() => setCurrentModule('home')} />}

      {currentModule === 'contracts' && (
        <>
          {contractWizardSupplierId !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-md">
              <ContractWizard 
                suppliers={suppliers} projects={projects} units={units} settings={companySettings}
                preSelectedSupplierId={contractWizardSupplierId === 'new' ? undefined : contractWizardSupplierId}
                initialData={editingContract?.details}
                onCancel={() => { setContractWizardSupplierId(null); setEditingContract(null); }}
                onSave={handleSaveContract}
              />
            </div>
          )}

          <Layout activeTab={activeTab} onNavigate={(tab) => tab === 'home' ? setCurrentModule('home') : setActiveTab(tab)}>
            <div className="absolute top-4 right-20 z-20">
               <button onClick={handleLogout} className="text-slate-400 hover:text-emerald-600 font-bold text-xs transition-colors flex items-center gap-2">
                 <LogOut size={14}/> Encerrar Sessão
               </button>
            </div>
            
            {loading && (
              <div className="fixed bottom-10 right-10 bg-white shadow-2xl p-4 rounded-3xl border border-slate-100 flex items-center gap-3 text-xs font-black text-emerald-600 z-50 animate-bounce">
                <Loader2 size={16} className="animate-spin" /> Atualizando Nuvem...
              </div>
            )}

            {activeTab === 'dashboard' && <Dashboard stats={{
                totalSuppliers: suppliers.length,
                activeProjects: projects.filter(p => p.status === 'Active').length,
                contractsGenerated: contracts.length,
                pendingHomologations: suppliers.filter(s => s.status === SupplierStatus.PENDING).length
            }} suppliersData={suppliers} />}

            {activeTab === 'suppliers' && (
              <SupplierManager
                 suppliers={suppliers} serviceCategories={serviceCategories}
                 onAdd={handleAddSupplier} onUpdate={handleUpdateSupplier} onDelete={handleDeleteSupplier}
                 onOpenContractWizard={setContractWizardSupplierId} onRiskAnalysis={handleRiskAnalysis}
                 analyzingRiskId={analyzingRisk} riskReport={riskReport} onCloseRiskReport={() => setRiskReport(null)}
              />
            )}

            {activeTab === 'contracts' && (
               <ContractManager 
                  contracts={contracts} suppliers={suppliers} settings={companySettings} 
                  onOpenWizard={() => setContractWizardSupplierId('new')}
                  onEditContract={(c) => { setEditingContract(c); setContractWizardSupplierId(c.supplierId); }}
                  onDeleteContract={handleDeleteContract}
               />
            )}

            {activeTab === 'units' && <UnitManager units={units} onAdd={handleAddUnit} onUpdate={handleUpdateUnit} onDelete={handleDeleteUnit} />}
            
            {activeTab === 'projects' && <ProjectManager projects={projects} units={units} onAdd={handleAddProject} onUpdate={handleUpdateProject} onDelete={handleDeleteProject} />}
            
            {activeTab === 'types' && <ServiceTypeManager services={serviceCategories} onAdd={handleAddServiceCategory} onDelete={handleDeleteServiceCategory} />}

            {activeTab === 'settings' && <SettingsManager settings={companySettings} onSave={handleSaveSettings} onReset={() => {}} onSeed={() => {}} />}
          </Layout>
        </>
      )}
    </BrowserRouter>
  );
};

export default App;