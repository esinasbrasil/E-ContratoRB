
import React, { useState, useEffect, useCallback } from 'react';
import { LogOut, Loader2, AlertTriangle } from 'lucide-react';
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
import { storageService } from './services/storageService';

const LOGO_RB_FIXO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAABNmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDAgNzkuMTYwNDUxLCAyMDE3LzA1LzA2LTAxOjA4OjIxICAgICAgICAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiA8L3JkZjpSREY+CjwveDp4bXB0YT4KPD94cGFja2V0IGVuZD0idyI/PlS999MAAAAZSURBVHgB7cEBDQAAAMKg909tDwcUAAAAAIB3A08AAAF7v9SRAAAAAElFTkSuQmCC";

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
    logoBase64: LOGO_RB_FIXO,
    footerText: 'https://gruporesinasbrasil.com.br/',
    primaryColor: '#064e3b',
    documentTitle: 'Solicitação de Contrato / Minuta'
  });

  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [contractWizardSupplierId, setContractWizardSupplierId] = useState<string | 'new' | null>(null);
  const [analyzingRisk, setAnalyzingRisk] = useState<string | null>(null);
  const [riskReport, setRiskReport] = useState<{ id: string, text: string } | null>(null);

  const isDemo = session?.user?.id === 'demo';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isDemo) {
        setSuppliers(storageService.getSuppliers());
        setProjects(storageService.getProjects());
        setUnits(storageService.getUnits());
        setServiceCategories(storageService.getServices());
        setContracts(storageService.getContracts());
        const settings = storageService.getSettings();
        if (settings) setCompanySettings(settings);
      } else if (isSupabaseConfigured) {
        const [
          { data: s }, { data: p }, { data: u }, { data: cat }, { data: ctr }, { data: settingsData }
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
      }
    } catch (error) { console.error("Erro ao sincronizar:", error); }
    finally { setLoading(false); }
  }, [isDemo]);

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session: initialSession } } = await (supabase.auth as any).getSession();
      setSession(initialSession);
      setAuthChecking(false);
    };
    initializeAuth();
    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange((_event: any, session: any) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session) fetchData(); }, [session, fetchData]);

  const handleLogout = async () => {
    await (supabase.auth as any).signOut();
    setSession(null);
  };

  const saveAction = async (table: string, data: any, storageMethod: (item: any) => void): Promise<boolean> => {
    setLoading(true);
    try {
      if (isDemo) {
        try {
          storageMethod(data);
          await fetchData();
          return true;
        } catch (storageErr: any) {
          if (storageErr.name === 'QuotaExceededError') {
            alert("ERRO: Memória cheia. Remova arquivos PDF muito grandes.");
            return false;
          }
          throw storageErr;
        }
      } else {
        const dataWithUser = { ...data };
        if (session?.user?.id) {
          dataWithUser.user_id = session.user.id;
        }

        const { error } = await supabase.from(table).upsert(dataWithUser);
        
        if (error) {
          console.error(`Erro Supabase (${table}):`, error);
          if (error.message.includes('row-level security policy')) {
            alert(`ERRO DE PERMISSÃO: O banco de dados Supabase bloqueou a gravação na tabela "${table}".\n\nCOMO CORRIGIR:\n1. Acesse o SQL Editor no Supabase.\n2. Execute: CREATE POLICY "Permitir Tudo" ON ${table} FOR ALL USING (true);`);
          } else {
            alert(`Erro ao salvar no banco: ${error.message}`);
          }
          return false;
        }
        await fetchData();
        return true;
      }
    } catch (err: any) {
      alert(`Falha ao salvar: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContract = async (data: ContractRequestData, supplierId: string, value: number): Promise<boolean> => {
     const contractId = editingContract?.id || crypto.randomUUID();
     const newContract: Contract = {
       id: contractId, 
       projectId: data.projectId || '', 
       supplierId, 
       value, 
       createdAt: editingContract?.createdAt || new Date().toISOString(), 
       status: 'Draft', 
       details: data
     };
     return await saveAction('contracts', newContract, storageService.saveContract);
  };

  const deleteAction = async (table: string, id: string, storageMethod: (id: string) => void) => {
    if (!window.confirm("Deseja realmente excluir este registro?")) return;
    setLoading(true);
    try {
      if (isDemo) storageMethod(id);
      else {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
      }
      await fetchData();
    } catch (err: any) { alert(`Erro ao excluir: ${err.message}`); }
    finally { setLoading(false); }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="text-emerald-500 animate-spin" size={48} />
      </div>
    );
  }

  if (!session) {
    return <LoginPage onDemoLogin={() => setSession({ user: { id: 'demo' } })} />;
  }

  return (
    <>
      {currentModule === 'home' && <LandingPage onSelectModule={setCurrentModule} />}
      {currentModule === 'engineering' && (
        <EngineeringModule 
          projects={projects} units={units} 
          onAddProject={p => saveAction('projects', p, storageService.saveProject)}
          onUpdateProject={p => saveAction('projects', p, storageService.saveProject)} 
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
                initialData={editingContract?.details} onCancel={() => { setContractWizardSupplierId(null); setEditingContract(null); }}
                onSave={handleSaveContract}
              />
            </div>
          )}
          <Layout activeTab={activeTab} onNavigate={(tab) => tab === 'home' ? setCurrentModule('home') : setActiveTab(tab)}>
            <div className="absolute top-4 right-20 z-20">
               <button onClick={handleLogout} className="text-slate-400 hover:text-emerald-600 font-bold text-xs transition-colors flex items-center gap-2">
                 <LogOut size={14}/> Sair
               </button>
            </div>
            {loading && (
              <div className="fixed bottom-10 right-10 bg-white shadow-2xl p-4 rounded-3xl border border-slate-100 flex items-center gap-3 text-xs font-black text-emerald-600 z-50">
                <Loader2 size={16} className="animate-spin" /> {isDemo ? 'Sincronizando Local...' : 'Sincronizando Nuvem...'}
              </div>
            )}
            {activeTab === 'dashboard' && <Dashboard stats={{ totalSuppliers: suppliers.length, activeProjects: projects.filter(p => p.status === 'Active').length, contractsGenerated: contracts.length, pendingHomologations: suppliers.filter(s => s.status === SupplierStatus.PENDING).length }} suppliersData={suppliers} projectsData={projects} />}
            {activeTab === 'suppliers' && (
              <SupplierManager 
                suppliers={suppliers} serviceCategories={serviceCategories} 
                onAdd={s => saveAction('suppliers', s, storageService.saveSupplier)} 
                onUpdate={s => saveAction('suppliers', s, storageService.saveSupplier)} 
                onDelete={id => deleteAction('suppliers', id, storageService.deleteSupplier)}
                onOpenContractWizard={setContractWizardSupplierId} 
                onRiskAnalysis={async s => { setAnalyzingRisk(s.id); const report = await analyzeSupplierRisk(s.name, s.serviceType); setRiskReport({ id: s.id, text: report }); setAnalyzingRisk(null); }}
                analyzingRiskId={analyzingRisk} riskReport={riskReport} onCloseRiskReport={() => setRiskReport(null)}
              />
            )}
            {activeTab === 'projects' && <ProjectManager projects={projects} units={units} onAdd={p => saveAction('projects', p, storageService.saveProject)} onUpdate={p => saveAction('projects', p, storageService.saveProject)} onDelete={id => deleteAction('projects', id, storageService.deleteProject)} />}
            {activeTab === 'units' && <UnitManager units={units} onAdd={u => saveAction('units', u, storageService.saveUnit)} onUpdate={u => saveAction('units', u, storageService.saveUnit)} onDelete={id => deleteAction('units', id, storageService.deleteUnit)} />}
            {activeTab === 'contracts' && <ContractManager contracts={contracts} suppliers={suppliers} settings={companySettings} units={units} onOpenWizard={() => setContractWizardSupplierId('new')} onEditContract={(c) => { setEditingContract(c); setContractWizardSupplierId(c.supplierId); }} onDeleteContract={id => deleteAction('contracts', id, storageService.deleteContract)} />}
            {activeTab === 'types' && <ServiceTypeManager services={serviceCategories} onAdd={c => saveAction('service_categories', c, storageService.saveService)} onDelete={id => deleteAction('service_categories', id, storageService.deleteService)} />}
            {activeTab === 'settings' && <SettingsManager settings={companySettings} onSave={s => saveAction('company_settings', s, storageService.saveSettings)} onReset={() => { storageService.resetDatabase(); fetchData(); }} onSeed={() => {}} />}
          </Layout>
        </>
      )}
    </>
  );
};

export default App;
