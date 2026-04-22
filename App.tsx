
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
import ProcedureManager from './components/ProcedureManager';
import SettingsManager from './components/SettingsManager';
import ServiceTypeManager from './components/ServiceTypeManager';
import PortariaPanel from './components/PortariaPanel';
import SupplierPortal from './components/SupplierPortal';
import AccessManagement from './components/AccessManagement';
import LoginPage from './components/LoginPage';
import { Supplier, SupplierStatus, Project, ServiceCategory, Unit, Contract, ContractRequestData, CompanySettings, Procedure, AppTab } from './types';
import { generateId, cleanObject } from './utils';
import { analyzeSupplierRisk } from './services/geminiService';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, signInAnonymously } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  setDoc, 
  doc, 
  deleteDoc,
  getDocFromServer,
  getDocs
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const LOGO_RB_FIXO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAABNmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDAgNzkuMTYwNDUxLCAyMDE3LzA1LzA2LTAxOjA4OjIxICAgICAgICAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiA8L3JkZjpSREY+CjwveDp4bXB0YT4KPD94cGFja2V0IGVuZD0idyI/PlS999MAAAAZSURBVHgB7cEBDQAAAMKg909tDwcUAAAAAIB3A08AAAF7v9SRAAAAAElFTkSuQmCC";

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [currentModule, setCurrentModule] = useState<'home' | 'contracts' | 'engineering' | 'compliance' | 'procedures' | 'portaria' | 'portal'>('home');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [processos, setProcessos] = useState<Procedure[]>([]);
  const [procedureSettings, setProcedureSettings] = useState<any>(null);
  
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setSession({ 
          user: { 
            uid: user.uid, 
            email: user.email, 
            displayName: user.displayName 
          } 
        });
      } else {
        setSession(null);
      }
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;

    const unsubscribers: (() => void)[] = [];

    const setupListener = (colName: string, setter: (data: any) => void, orderField: string = 'name', direction: 'asc' | 'desc' = 'asc') => {
      const unsub = onSnapshot(collection(db, colName), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        data.sort((a: any, b: any) => {
          const valA = a[orderField] || '';
          const valB = b[orderField] || '';
          return direction === 'asc' 
            ? valA.toString().localeCompare(valB.toString())
            : valB.toString().localeCompare(valA.toString());
        });
        setter(data);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, colName);
      });
      unsubscribers.push(unsub);
    };

    setupListener('suppliers', setSuppliers);
    setupListener('projects', setProjects);
    setupListener('units', setUnits);
    setupListener('service_categories', setServiceCategories);
    setupListener('contracts', setContracts, 'createdAt', 'desc');
    setupListener('processos', setProcessos, 'createdAt', 'desc');
    setupListener('procedure_settings', (data) => setProcedureSettings(data[0] || null));

    // Settings is a single doc
    const settingsUnsub = onSnapshot(doc(db, 'company_settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setCompanySettings(snapshot.data() as CompanySettings);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'company_settings/global');
    });
    unsubscribers.push(settingsUnsub);

    return () => unsubscribers.forEach(unsub => unsub());
  }, [session]);

  useEffect(() => {
    // Test connection to Firestore
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setSession(null);
  };

  const saveAction = async (table: string, data: any): Promise<boolean> => {
    setLoading(true);
    console.log(`Iniciando salvamento em ${table}:`, data);
    try {
      const dataWithUser = { ...data };
      if (session?.user?.uid) {
        dataWithUser.user_id = session.user.uid;
      }
      
      const docId = data.id || (table === 'company_settings' ? 'global' : generateId());
      if (!data.id && table !== 'company_settings') {
        dataWithUser.id = docId;
      }

      const cleanedData = cleanObject(dataWithUser);
      await setDoc(doc(db, table, docId), cleanedData);
      console.log(`Documento salvo com sucesso em ${table}/${docId}`);
      return true;
    } catch (err: any) {
      console.error(`Erro ao salvar em ${table}:`, err);
      
      const errorMessage = err.message || String(err);
      // Firebase error codes are often in err.code
      if (err.code === 'permission-denied' || errorMessage.includes('permission-denied') || errorMessage.includes('insufficient permissions')) {
         alert(`Erro de Permissão: Você não tem permissão para salvar na coleção "${table}". Verifique se você é o dono deste registro ou administrador.`);
      } else if (err.code === 'quota-exceeded') {
         alert(`Limite atingido: O limite gratuito do Firebase foi excedido. Os dados serão resetados amanhã.`);
      } else {
         alert(`Falha ao salvar em "${table}": ${errorMessage}`);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContract = async (data: ContractRequestData, supplierId: string, value: number): Promise<boolean> => {
     const contractId = editingContract?.id || generateId();
     
     // 1. Separar os dados dos arquivos para não estourar o limite de 1MB do Firestore
     const attachmentsWithData = [...data.attachments];
     
     // 2. Criar uma versão "leve" do checklist (sem os base64 pesados) para o documento principal
     const lightweightDetails = {
       ...data,
       attachments: data.attachments.map(att => ({
         ...att,
         fileData: "" // Limpamos o dado binário no documento principal
       }))
     };

     const newContract: Contract = {
       id: contractId, 
       projectId: data.projectId || '', 
       supplierId, 
       value, 
       createdAt: editingContract?.createdAt || new Date().toISOString(), 
       status: 'Draft', 
       details: lightweightDetails
     };

     // 3. Salvar o documento principal do contrato
     const mainSuccess = await saveAction('contracts', newContract);
     if (!mainSuccess) return false;

     // 4. Salvar cada anexo individualmente na subcoleção para que cada um tenha seu próprio limite de 1MB
     try {
       for (let i = 0; i < attachmentsWithData.length; i++) {
         const att = attachmentsWithData[i];
         if (att.fileData) {
           // Usamos um ID determinístico baseado no tipo para facilitar sobrescrever/atualizar
           const attId = att.type.replace(/\s+/g, '_');
           await setDoc(doc(db, `contracts/${contractId}/attachments`, attId), {
             name: att.name,
             type: att.type,
             fileData: att.fileData,
             updatedAt: new Date().toISOString()
           });
         }
       }
       return true;
     } catch (err: any) {
       console.error("Erro ao salvar anexos na subcoleção:", err);
       alert("O contrato foi salvo, mas houve um erro ao processar alguns anexos pesados.");
       return true; // Retornamos true pois o principal foi salvo
     }
  };

  const loadContractWithAttachments = async (contract: Contract) => {
    setLoading(true);
    try {
      // Buscar os arquivos da subcoleção
      const attachmentsSnapshot = await getDocs(collection(db, `contracts/${contract.id}/attachments`));
      const fullAttachments = attachmentsSnapshot.docs.map(d => ({
        name: d.data().name,
        type: d.data().type,
        fileData: d.data().fileData
      }));

      // Injetar os arquivos de volta nos detalhes
      const contractWithFiles = {
        ...contract,
        details: {
          ...contract.details,
          attachments: fullAttachments
        }
      };

      setEditingContract(contractWithFiles);
      setContractWizardSupplierId(contract.supplierId);
    } catch (err) {
      console.error("Erro ao carregar anexos:", err);
      // Se falhar, carregamos sem anexos mesmo
      setEditingContract(contract);
      setContractWizardSupplierId(contract.supplierId);
    } finally {
      setLoading(false);
    }
  };

  const deleteAction = async (table: string, id: string) => {
    if (!window.confirm("Deseja realmente excluir este registro?")) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, table, id));
    } catch (err: any) { 
      alert(`Erro ao excluir: ${err.message}`); 
    } finally { 
      setLoading(false); 
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="text-emerald-500 animate-spin" size={48} />
      </div>
    );
  }

  if (!session) {
    return <LoginPage onDemoLogin={() => signInAnonymously(auth)} />;
  }

  return (
    <>
      {currentModule === 'home' && (
        <LandingPage onSelectModule={(mod) => {
          if (mod === 'procedures') {
            setCurrentModule('contracts');
            setActiveTab('procedures');
          } else {
            setCurrentModule(mod);
          }
        }} />
      )}
      {currentModule === 'engineering' && (
        <EngineeringModule 
          projects={projects} units={units} 
          onAdd={p => saveAction('projects', p)}
          onUpdate={p => saveAction('projects', p)} 
          onBack={() => setCurrentModule('home')}
        />
      )}
      {currentModule === 'compliance' && (
        <SupplierCompliance 
          suppliers={suppliers}
          units={units}
          projects={projects}
          settings={companySettings}
          onBack={() => setCurrentModule('home')} 
        />
      )}
      {currentModule === 'portaria' && (
        <PortariaPanel 
          suppliers={suppliers}
          contracts={contracts}
          onBack={() => setCurrentModule('home')}
        />
      )}
      {currentModule === 'portal' && (
        <SupplierPortal 
          suppliers={suppliers}
          onBack={() => setCurrentModule('home')}
          onUpdateSupplier={s => saveAction('suppliers', s)}
        />
      )}
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
          <Layout activeTab={activeTab} onNavigate={(tab) => {
            if (tab === 'home') {
              setCurrentModule('home');
            } else {
              setActiveTab(tab);
            }
          }}>
            <div className="absolute top-4 right-20 z-20">
               <button onClick={handleLogout} className="text-slate-400 hover:text-emerald-600 font-bold text-xs transition-colors flex items-center gap-2">
                 <LogOut size={14}/> Sair
               </button>
            </div>
            {loading && (
              <div className="fixed bottom-10 right-10 bg-white shadow-2xl p-4 rounded-3xl border border-slate-100 flex items-center gap-3 text-xs font-black text-emerald-600 z-50">
                <Loader2 size={16} className="animate-spin" /> Sincronizando Nuvem...
              </div>
            )}
            {activeTab === 'dashboard' && <Dashboard stats={{ totalSuppliers: suppliers.length, activeProjects: projects.filter(p => p.status === 'Active').length, contractsGenerated: contracts.length, pendingHomologations: suppliers.filter(s => s.status === SupplierStatus.PENDING).length }} suppliersData={suppliers} projectsData={projects} />}
            {activeTab === 'suppliers' && (
              <SupplierManager 
                suppliers={suppliers} serviceCategories={serviceCategories} 
                onAdd={s => saveAction('suppliers', s)} 
                onUpdate={s => saveAction('suppliers', s)} 
                onDelete={id => deleteAction('suppliers', id)}
                onOpenContractWizard={setContractWizardSupplierId} 
                onRiskAnalysis={async s => { setAnalyzingRisk(s.id); const report = await analyzeSupplierRisk(s.name, s.serviceType); setRiskReport({ id: s.id, text: report }); setAnalyzingRisk(null); }}
                analyzingRiskId={analyzingRisk} riskReport={riskReport} onCloseRiskReport={() => setRiskReport(null)}
              />
            )}
            {activeTab === 'projects' && <ProjectManager projects={projects} units={units} onAdd={p => saveAction('projects', p)} onUpdate={p => saveAction('projects', p)} onDelete={id => deleteAction('projects', id)} />}
            {activeTab === 'units' && <UnitManager units={units} onAdd={u => saveAction('units', u)} onUpdate={u => saveAction('units', u)} onDelete={id => deleteAction('units', id)} />}
            {activeTab === 'contracts' && (
              <ContractManager 
                contracts={contracts} 
                suppliers={suppliers} 
                settings={companySettings} 
                units={units} 
                onOpenWizard={() => setContractWizardSupplierId('new')} 
                onEditContract={loadContractWithAttachments} 
                onDeleteContract={id => deleteAction('contracts', id)} 
              />
            )}
            {activeTab === 'procedures' && (
              <ProcedureManager 
                procedures={processos} 
                projects={projects} 
                suppliers={suppliers} 
                settings={procedureSettings}
                onSaveSettings={s => saveAction('procedure_settings', s)}
                onAdd={p => saveAction('processos', p)} 
                onUpdate={p => saveAction('processos', p)} 
                onDelete={id => deleteAction('processos', id)} 
              />
            )}
            {activeTab === 'types' && <ServiceTypeManager services={serviceCategories} onAdd={c => saveAction('service_categories', c)} onDelete={id => deleteAction('service_categories', id)} />}
            {activeTab === 'settings' && <SettingsManager settings={companySettings} onSave={s => saveAction('company_settings', s)} />}
            {activeTab === 'access' && <AccessManagement suppliers={suppliers} />}
          </Layout>
        </>
      )}
    </>
  );
};

export default App;
