
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter } from 'react-router-dom';
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
import LoginPage from './components/LoginPage';
import { Supplier, SupplierStatus, Project, ServiceCategory, Unit, Contract, ContractRequestData, CompanySettings } from './types';
import { analyzeSupplierRisk } from './services/geminiService';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
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
    companyName: 'EcoContract Manager',
    logoBase64: null,
    footerText: 'Documento gerado via EcoContract System',
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
    // Check local session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthChecking(false);
      if (session) fetchData();
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchData();
    });

    return () => subscription.unsubscribe();
  }, [fetchData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
    // Funçao de bypass para teste imediato
    setSession({ 
      user: { email: 'demo@gruporb.com.br', id: 'demo' },
      access_token: 'demo',
      refresh_token: 'demo'
    } as any);
  };

  if (authChecking) return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center">
        <Loader2 className="animate-spin text-primary-600 mb-4" size={48} />
        <p className="text-gray-500 font-medium tracking-tight">Autenticando portal...</p>
      </div>
    </div>
  );

  if (!session) return <LoginPage onDemoLogin={handleDemoLogin} />;

  return (
    <HashRouter>
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
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
               <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 flex items-center gap-1 text-sm font-medium transition-colors">
                 <LogOut size={16}/> Sair
               </button>
            </div>
            
            {loading && (
              <div className="fixed top-24 right-10 bg-white shadow-xl p-3 rounded-2xl border border-primary-100 flex items-center gap-3 text-sm font-bold text-primary-700 z-50 animate-bounce">
                <Loader2 size={18} className="animate-spin" /> Sincronizando dados...
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
            
            {activeTab === 'settings' && <SettingsManager settings={companySettings} onSave={handleSaveSettings} onReset={() => {}} onSeed={() => {}} />}
          </Layout>
        </>
      )}
    </HashRouter>
  );
};

export default App;
