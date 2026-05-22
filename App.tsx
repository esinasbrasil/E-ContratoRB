
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
import ProjectFollowUp from './components/ProjectFollowUp';
import LoginPage from './components/LoginPage';
import VendorList from './components/VendorList';
import Logo from './components/Logo';
import { Supplier, SupplierStatus, Project, ServiceCategory, Unit, Contract, ContractRequestData, CompanySettings, Procedure, FollowUpProject, FollowUpHistory, AppTab, UserRole } from './types';
import { generateId, cleanObject } from './utils';
import { analyzeSupplierRisk } from './services/geminiService';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
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

function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : (error?.message || String(error));
  const errorCode = error?.code || '';

  const isQuotaError = errorCode === 'quota-exceeded' || 
                      errorCode === 'resource-exhausted' ||
                      errorCode.includes('quota') ||
                      errorMessage.toLowerCase().includes('quota') || 
                      errorMessage.toLowerCase().includes('limit exceeded') ||
                      errorMessage.toLowerCase().includes('rate limit') ||
                      errorMessage.toLowerCase().includes('429') ||
                      errorMessage.toLowerCase().includes('resource_exhausted') ||
                      errorMessage.toLowerCase().includes('reads') ||
                      errorMessage.toLowerCase().includes('daily read units');

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
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
  
  if (isQuotaError) {
    // We don't throw for quota errors to avoid crashing the whole React app
    // The UI should handle this state
    return true;
  }
  
  throw new Error(JSON.stringify(errInfo));
}

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [authChecking, setAuthChecking] = useState(true);
  const [currentModule, setCurrentModule] = useState<'home' | 'contracts' | 'engineering' | 'compliance' | 'procedures' | 'portaria' | 'portal' | 'followup_admin' | 'followup_consult'>('home');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [ignoreQuota, setIgnoreQuota] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [processos, setProcessos] = useState<Procedure[]>([]);
  const [followupProjects, setFollowupProjects] = useState<FollowUpProject[]>([]);
  const [followupHistory, setFollowupHistory] = useState<FollowUpHistory[]>([]);
  const [procedureSettings, setProcedureSettings] = useState<any>(null);
  
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    companyName: 'GRUPO RESINAS BRASIL',
    logoBase64: '',
    footerText: 'https://gruporesinasbrasil.com.br/',
    primaryColor: '#064e3b',
    documentTitle: 'Solicitação de Contrato / Minuta'
  });

  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [contractWizardSupplierId, setContractWizardSupplierId] = useState<string | 'new' | null>(null);
  const [analyzingRisk, setAnalyzingRisk] = useState<string | null>(null);
  const [riskReport, setRiskReport] = useState<{ id: string, text: string } | null>(null);

  // --- PERSISTÊNCIA LOCAL (FALLBACK) ---
  
  // Carregar backup local ao iniciar se o Firebase estiver inacessível ou vazio
  useEffect(() => {
    const backupContracts = localStorage.getItem('rb_contracts_v1');
    const backupSettings = localStorage.getItem('rb_settings_v1');
    
    if (backupContracts) {
      try {
        const parsed = JSON.parse(backupContracts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setContracts(prev => prev.length === 0 ? parsed : prev);
        }
      } catch (e) { console.warn("Erro ao restaurar contratos localmente", e); }
    }
    
    if (backupSettings) {
      try {
        const parsed = JSON.parse(backupSettings);
        if (parsed.companyName) {
          setCompanySettings(parsed);
        }
      } catch (e) { console.warn("Erro ao restaurar configurações localmente", e); }
    }
  }, []);

  // Salvar backup local sempre que os dados mudarem
  useEffect(() => {
    if (contracts.length > 0) localStorage.setItem('rb_contracts_v1', JSON.stringify(contracts));
    if (suppliers.length > 0) localStorage.setItem('rb_suppliers_v1', JSON.stringify(suppliers));
    if (projects.length > 0) localStorage.setItem('rb_projects_v1', JSON.stringify(projects));
    if (units.length > 0) localStorage.setItem('rb_units_v1', JSON.stringify(units));
    if (serviceCategories.length > 0) localStorage.setItem('rb_service_categories_v1', JSON.stringify(serviceCategories));
    if (processos.length > 0) localStorage.setItem('rb_processos_v1', JSON.stringify(processos));
    if (followupProjects.length > 0) localStorage.setItem('rb_followup_projects_v1', JSON.stringify(followupProjects));
    if (followupHistory.length > 0) localStorage.setItem('rb_followup_history_v1', JSON.stringify(followupHistory));
  }, [contracts, suppliers, projects, units, serviceCategories, processos, followupProjects, followupHistory]);

  useEffect(() => {
    if (companySettings) {
      localStorage.setItem('rb_settings_v1', JSON.stringify(companySettings));
    }
  }, [companySettings]);

  // Carregar todos os backups locais ao iniciar
  useEffect(() => {
    const loadBackup = (key: string, setter: (data: any) => void) => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.length > 0) setter(parsed);
        } catch (e) { console.warn(`Erro ao restaurar ${key}`, e); }
      }
    };

    loadBackup('rb_contracts_v1', setContracts);
    loadBackup('rb_suppliers_v1', setSuppliers);
    loadBackup('rb_projects_v1', setProjects);
    loadBackup('rb_units_v1', setUnits);
    loadBackup('rb_service_categories_v1', setServiceCategories);
    loadBackup('rb_processos_v1', setProcessos);
    loadBackup('rb_followup_projects_v1', setFollowupProjects);
    loadBackup('rb_followup_history_v1', setFollowupHistory);
    
    const settings = localStorage.getItem('rb_settings_v1');
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        if (parsed.companyName) setCompanySettings(parsed);
      } catch (e) {}
    }
  }, []);

  // --- FIM DA PERSISTÊNCIA LOCAL ---

  useEffect(() => {
    // Tenta login automático se não houver sessão ativa
    const autoLogin = async () => {
      if (!session && !authChecking) {
        try {
          await signInWithEmailAndPassword(auth, 'fecampos120@gmail.com', '@adm2026');
          console.log("Auto-login com e-mail realizado com sucesso.");
        } catch (error: any) {
          console.warn("Auto-login com e-mail falhou. Tentando registrar se não existir...", error);
          const errorCode = error?.code || '';
          const errorMessage = error?.message || '';
          
          // Se for erro de usuário não encontrado ou credencial inválida, tentamos criar o usuário padrão
          if (
            errorCode === 'auth/user-not-found' || 
            errorCode === 'auth/invalid-credential' || 
            errorMessage.includes('user-not-found') || 
            errorMessage.includes('invalid-credential')
          ) {
            try {
              await createUserWithEmailAndPassword(auth, 'fecampos120@gmail.com', '@adm2026');
              console.log("Usuário padrão registrado e logado com sucesso!");
            } catch (createErr: any) {
              const createErrorCode = createErr?.code || '';
              if (createErrorCode === 'auth/email-already-in-use') {
                console.log("O usuário já existe, mas a senha padrão não confere ou o login por e-mail/senha está configurado diferente no console. Aguardando login manual.");
              } else {
                console.warn("Falha ao registrar usuário padrão:", createErr);
              }
            }
          } else {
            console.warn("Erro de autenticação não tratado no auto-login:", error);
          }
          
          // NOTA: Se o auto-login falhar, nós NÃO forçamos o modo offline silenciosamente.
          // Isso garante que o usuário seja levado à página de login (LoginPage) onde poderá optar 
          // por entrar via Google Login (conexão real), digitar as credenciais corretas ou escolher o 'Modo Offline' de forma consciente.
        }
      }
    };

    if (!authChecking) autoLogin();
  }, [authChecking]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Define role baseado no e-mail do admin
        const role = 'admin'; 
        setUserRole(role);
        setSession({ 
          user: { 
            uid: user.uid, 
            email: user.email, 
            displayName: user.displayName 
          } 
        });
      } else {
        // Não resetamos para null imediatamente para evitar flash da tela de login se o auto-login estiver rodando
      }
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCustomLogin = async (role: 'portaria' | 'fornecedor') => {
    const email = `${role}@portal.rb`;
    const password = `@${role}123`;
    setLoading(true);
    try {
      try {
        console.log(`Tentando autenticação real do Firebase para ${role} (${email})...`);
        await signInWithEmailAndPassword(auth, email, password);
        console.log(`Login custom com e-mail realizado com sucesso para ${role}`);
      } catch (err: any) {
        const errCode = err?.code || '';
        const errMsg = err?.message || '';
        if (
          errCode === 'auth/user-not-found' || 
          errCode === 'auth/invalid-credential' || 
          errMsg.includes('user-not-found') || 
          errMsg.includes('invalid-credential')
        ) {
          try {
            console.log(`Conta ${email} não encontrada ou senha padrão desatualizada. Criando conta automática...`);
            await createUserWithEmailAndPassword(auth, email, password);
            console.log(`Conta ${email} registrada e logada com sucesso!`);
          } catch (createErr: any) {
            console.warn(`Tentativa de criação automática da conta ${email} falhou:`, createErr);
            // Se já existir ou falhar por outro motivo, tenta login anônimo como último esforço
            try {
              await signInAnonymously(auth);
            } catch (anonErr) {
              console.warn("Login anônimo de fallback também falhou. Entrando em modo simulado.");
            }
          }
        } else {
          console.error(`Erro inesperado de login para ${role}:`, err);
          throw err;
        }
      }

      setSession({
        user: {
          uid: auth.currentUser?.uid || `custom_${role}`,
          email: email,
          displayName: role === 'portaria' ? 'Equipe Portaria' : 'Portal Fornecedor'
        },
        isCustom: true
      });
      setUserRole(role);
      setCurrentModule(role === 'portaria' ? 'portaria' : 'portal');
    } catch (error) {
      console.error("Falha ao autenticar para modo custom:", error);
      // Fallback local se todas as tentativas no Firebase falharem
      setSession({
        user: {
          uid: `custom_${role}`,
          email: email,
          displayName: role === 'portaria' ? 'Equipe Portaria' : 'Portal Fornecedor'
        },
        isCustom: true
      });
      setUserRole(role);
      setCurrentModule(role === 'portaria' ? 'portaria' : 'portal');
    } finally {
      setLoading(false);
    }
  };

  // --- AUTOMATIC FRONTEND TO BACKEND SYNCHRONIZATION ---
  useEffect(() => {
    if (!session || session.isOffline || (quotaExceeded && !ignoreQuota)) return;

    const syncLocalDataToFirebase = async () => {
      console.log("Iniciando controle e sincronização de dados locais para o Firebase...");
      setLoading(true);

      const collectionsToSync = [
        { key: 'rb_suppliers_v1', table: 'suppliers' },
        { key: 'rb_projects_v1', table: 'projects' },
        { key: 'rb_units_v1', table: 'units' },
        { key: 'rb_service_categories_v1', table: 'service_categories' },
        { key: 'rb_contracts_v1', table: 'contracts' },
        { key: 'rb_processos_v1', table: 'processos' },
        { key: 'rb_followup_projects_v1', table: 'followup_projects' },
        { key: 'rb_followup_history_v1', table: 'followup_history' }
      ];

      try {
        for (const item of collectionsToSync) {
          const localDataStr = localStorage.getItem(item.key);
          if (localDataStr) {
            try {
              const localItems = JSON.parse(localDataStr);
              if (Array.isArray(localItems) && localItems.length > 0) {
                // Obter IDs já existentes no Firestore
                const firestoreSnapshot = await getDocs(collection(db, item.table));
                const existingIds = new Set(firestoreSnapshot.docs.map(doc => doc.id));

                for (const localDoc of localItems) {
                  if (localDoc && localDoc.id && !existingIds.has(localDoc.id)) {
                    const docId = localDoc.id;
                    const cleanedData = cleanObject({
                      ...localDoc,
                      user_id: session.user?.uid || localDoc.user_id || 'system_synced'
                    });
                    
                    await setDoc(doc(db, item.table, docId), cleanedData);
                    console.log(`Item local ${item.table}/${docId} sincronizado na nuvem.`);
                  }
                }
              }
            } catch (e) {
              console.warn(`Erro ao sincronizar coleção ${item.table}:`, e);
            }
          }
        }

        // Configurações Globais
        const localSettingsStr = localStorage.getItem('rb_settings_v1');
        if (localSettingsStr) {
          try {
            const localSettings = JSON.parse(localSettingsStr);
            if (localSettings && localSettings.companyName) {
              const settingsDoc = await getDocFromServer(doc(db, 'company_settings', 'global'));
              if (!settingsDoc.exists()) {
                const cleanedData = cleanObject({
                  ...localSettings,
                  user_id: session.user?.uid || 'system_synced'
                });
                await setDoc(doc(db, 'company_settings', 'global'), cleanedData);
                console.log("Configurações locais sincronizadas na nuvem.");
              }
            }
          } catch (e) {
            console.warn("Erro ao sincronizar configurações globais:", e);
          }
        }
        console.log("Sincronização concluída com sucesso!");
      } catch (err: any) {
        console.error("Falha geral na rotina de sincronização:", err);
      } finally {
        setLoading(false);
      }
    };

    syncLocalDataToFirebase();
  }, [session, quotaExceeded, ignoreQuota]);

  useEffect(() => {
    if (!session || (quotaExceeded && !ignoreQuota) || session.isOffline) return;

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
        const handled = handleFirestoreError(error, OperationType.LIST, colName);
        if (handled) setQuotaExceeded(true);
      });
      unsubscribers.push(unsub);
    };

    setupListener('suppliers', setSuppliers);
    setupListener('projects', setProjects);
    setupListener('units', setUnits);
    setupListener('service_categories', setServiceCategories);
    setupListener('contracts', setContracts, 'createdAt', 'desc');
    setupListener('processos', setProcessos, 'createdAt', 'desc');
    setupListener('followup_projects', setFollowupProjects, 'projectNumber', 'asc');
    setupListener('followup_history', setFollowupHistory, 'date', 'desc');
    setupListener('procedure_settings', (data) => setProcedureSettings(data[0] || null));

    // Settings is a single doc
    const settingsUnsub = onSnapshot(doc(db, 'company_settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setCompanySettings(snapshot.data() as CompanySettings);
      }
    }, (error) => {
      const handled = handleFirestoreError(error, OperationType.GET, 'company_settings/global');
      if (handled) setQuotaExceeded(true);
    });
    unsubscribers.push(settingsUnsub);

    return () => unsubscribers.forEach(unsub => unsub());
  }, [session]);

  const handleLogout = async () => {
    await signOut(auth);
    setSession(null);
    setOfflineMode(false);
  };

  const saveAction = async (table: string, data: any): Promise<boolean> => {
    if (session?.isOffline) {
       console.log("Modo Offline: Atualizando estado local para", table);
       const updateLocalState = (prev: any[], newData: any) => {
         const exists = prev.find(item => item.id === newData.id);
         if (exists) return prev.map(item => item.id === newData.id ? newData : item);
         return [...prev, newData];
       };

       const dataWithId = { ...data, id: data.id || generateId() };

       if (table === 'suppliers') setSuppliers(prev => updateLocalState(prev, dataWithId));
       if (table === 'projects') setProjects(prev => updateLocalState(prev, dataWithId));
       if (table === 'units') setUnits(prev => updateLocalState(prev, dataWithId));
       if (table === 'service_categories') setServiceCategories(prev => updateLocalState(prev, dataWithId));
       if (table === 'contracts') setContracts(prev => updateLocalState(prev, dataWithId));
       if (table === 'processos') setProcessos(prev => updateLocalState(prev, dataWithId));
       if (table === 'followup_projects') setFollowupProjects(prev => updateLocalState(prev, dataWithId));
       if (table === 'followup_history') setFollowupHistory(prev => updateLocalState(prev, dataWithId));
       if (table === 'company_settings') setCompanySettings(dataWithId);
       if (table === 'procedure_settings') setProcedureSettings(dataWithId);

       return true;
    }
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
      
      const handled = handleFirestoreError(err, OperationType.WRITE, table);
      if (handled) {
        setQuotaExceeded(true);
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
       createdAt: editingContract?.createdAt || new Date().toISOString(),
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
    if (session?.isOffline) {
      setEditingContract(contract);
      setContractWizardSupplierId(contract.supplierId);
      return;
    }
    setLoading(true);
    try {
      // Se os anexos já tiverem dados, use-os. Caso contrário, busque na subcoleção.
      let fullAttachments = contract.details.attachments || [];
      const isMissingData = fullAttachments.length > 0 && fullAttachments.some(a => !a.fileData || a.fileData.length < 100);

      if (isMissingData || fullAttachments.length === 0) {
        try {
          // Buscar os arquivos da subcoleção
          const attachmentsSnapshot = await getDocs(collection(db, `contracts/${contract.id}/attachments`));
          if (!attachmentsSnapshot.empty) {
            fullAttachments = attachmentsSnapshot.docs.map(d => ({
              name: d.data().name,
              type: d.data().type,
              fileData: d.data().fileData
            }));
          }
        } catch (fetchErr) {
          console.warn("Aviso ao buscar anexos para edição:", fetchErr);
        }
      }

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
    } catch (err: any) {
      const handled = handleFirestoreError(err, OperationType.LIST, `contracts/${contract.id}/attachments`);
      if (handled) setQuotaExceeded(true);
      
      // Fallback para os detalhes sem os binários pesados
      setEditingContract(contract);
      setContractWizardSupplierId(contract.supplierId);
    } finally {
      setLoading(false);
    }
  };

  const deleteAction = async (table: string, id: string) => {
    if (!window.confirm("Deseja realmente excluir este registro?")) return;
    if (session?.isOffline) {
      console.log("Modo Offline: Removendo do estado local em", table);
      if (table === 'suppliers') setSuppliers(prev => prev.filter(i => i.id !== id));
      if (table === 'projects') setProjects(prev => prev.filter(i => i.id !== id));
      if (table === 'units') setUnits(prev => prev.filter(i => i.id !== id));
      if (table === 'service_categories') setServiceCategories(prev => prev.filter(i => i.id !== id));
      if (table === 'contracts') setContracts(prev => prev.filter(i => i.id !== id));
      if (table === 'processos') setProcessos(prev => prev.filter(i => i.id !== id));
      if (table === 'followup_projects') setFollowupProjects(prev => prev.filter(i => i.id !== id));
      if (table === 'followup_history') setFollowupHistory(prev => prev.filter(i => i.id !== id));
      return;
    }
    setLoading(true);
    try {
      await deleteDoc(doc(db, table, id));
    } catch (err: any) {
      const handled = handleFirestoreError(err, OperationType.DELETE, `${table}/${id}`);
      if (handled) setQuotaExceeded(true);
    } finally {
      setLoading(false);
    }
  };

  const reloadFromLocalStorage = () => {
    const loadBackup = (key: string, setter: (data: any) => void) => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) setter(parsed);
        } catch (e) { console.warn(`Erro ao carregar ${key} do localStorage`, e); }
      } else {
        setter([]);
      }
    };
    loadBackup('rb_contracts_v1', setContracts);
    loadBackup('rb_suppliers_v1', setSuppliers);
    loadBackup('rb_projects_v1', setProjects);
    loadBackup('rb_units_v1', setUnits);
    loadBackup('rb_service_categories_v1', setServiceCategories);
    loadBackup('rb_processos_v1', setProcessos);
    loadBackup('rb_followup_projects_v1', setFollowupProjects);
    loadBackup('rb_followup_history_v1', setFollowupHistory);
    
    const settings = localStorage.getItem('rb_settings_v1');
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        if (parsed.companyName) setCompanySettings(parsed);
      } catch (e) {}
    }
  };

  const forceSync = async (): Promise<boolean> => {
    if (!session || session.isOffline) {
      alert("Você está em Modo Offline. Conecte-se para sincronizar.");
      return false;
    }
    
    console.log("Forçando sincronização manual para o Firebase...");
    setLoading(true);

    const collectionsToSync = [
      { key: 'rb_suppliers_v1', table: 'suppliers' },
      { key: 'rb_projects_v1', table: 'projects' },
      { key: 'rb_units_v1', table: 'units' },
      { key: 'rb_service_categories_v1', table: 'service_categories' },
      { key: 'rb_contracts_v1', table: 'contracts' },
      { key: 'rb_processos_v1', table: 'processos' },
      { key: 'rb_followup_projects_v1', table: 'followup_projects' },
      { key: 'rb_followup_history_v1', table: 'followup_history' }
    ];

    try {
      let syncedCount = 0;
      for (const item of collectionsToSync) {
        const localDataStr = localStorage.getItem(item.key);
        if (localDataStr) {
          try {
            const localItems = JSON.parse(localDataStr);
            if (Array.isArray(localItems) && localItems.length > 0) {
              const firestoreSnapshot = await getDocs(collection(db, item.table));
              const existingIds = new Set(firestoreSnapshot.docs.map(doc => doc.id));

              for (const localDoc of localItems) {
                if (localDoc && localDoc.id && !existingIds.has(localDoc.id)) {
                  const docId = localDoc.id;
                  const cleanedData = cleanObject({
                    ...localDoc,
                    user_id: session.user?.uid || localDoc.user_id || 'system_synced'
                  });
                  
                  await setDoc(doc(db, item.table, docId), cleanedData);
                  syncedCount++;
                }
              }
            }
          } catch (e) {
            console.warn(`Erro na sincronização manual da tabela ${item.table}:`, e);
          }
        }
      }
      console.log(`Sincronização manual concluída. ${syncedCount} itens sincronizados.`);
      return true;
    } catch (err) {
      console.error("Erro na sincronização:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
        <Logo className="w-16 h-16 animate-pulse" />
        <div className="flex items-center gap-3 text-emerald-500 font-bold text-xs uppercase tracking-widest">
          <Loader2 className="animate-spin" size={16} />
          Iniciando Sistema...
        </div>
      </div>
    );
  }

  if (!session && !offlineMode) {
    return (
      <LoginPage 
        onDemoLogin={() => {
          setOfflineMode(true);
          setSession({ 
            user: { 
              uid: 'offline_user', 
              email: 'fecampos120@gmail.com', 
              displayName: 'Administrador (Offline)' 
            },
            isOffline: true
          });
          setUserRole('admin');
        }}
        onCustomLogin={handleCustomLogin}
      />
    );
  }

  if (quotaExceeded && !ignoreQuota) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-10 rounded-[3rem] shadow-2xl border border-red-100 flex flex-col items-center">
          <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mb-8">
            <AlertTriangle size={40} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight uppercase">Limite de Uso do Google</h2>
          <p className="text-slate-500 mb-8 text-sm font-medium leading-relaxed tracking-tight">
            Este projeto atingiu o limite gratuito de acessos ao banco de dados do Google (50 mil leituras/dia). 
            <br/><br/>
            Para não perder seu trabalho, você pode continuar usando o sistema no **Modo Offline**. Os dados que você já salvou neste navegador continuarão disponíveis.
          </p>
          <div className="flex flex-col gap-3 w-full">
             <button 
              onClick={() => setIgnoreQuota(true)}
              className="w-full py-4 px-6 rounded-2xl text-xs font-black text-white bg-slate-900 hover:bg-slate-800 transition-all uppercase tracking-widest"
             >
              Continuar no Modo Offline
             </button>
             <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 px-6 rounded-2xl text-xs font-black text-slate-400 border border-slate-100 hover:bg-slate-50 transition-all uppercase tracking-widest"
             >
              Tentar Reconectar
             </button>
             <button 
              onClick={handleLogout}
              className="w-full py-4 px-6 rounded-2xl text-[9px] font-black text-slate-300 hover:text-slate-500 transition-all uppercase tracking-widest"
             >
              Sair
             </button>
          </div>
        </div>
      </div>
    );
  }

  const renderModule = () => {
    // Restringe acesso baseado no papel
    if (userRole === 'portaria') {
       return <PortariaPanel 
          suppliers={suppliers}
          contracts={contracts}
          onBack={() => {}}
        />;
    }

    if (userRole === 'fornecedor') {
       return <SupplierPortal 
          suppliers={suppliers}
          onBack={() => {}}
          onUpdateSupplier={s => saveAction('suppliers', s)}
        />;
    }

    return (
      <>
        {currentModule === 'home' && (
          <LandingPage onSelectModule={(mod) => {
            if (mod === 'procedures') {
              setCurrentModule('contracts');
              setActiveTab('procedures');
            } else if (mod === 'vendor_list') {
              setCurrentModule('contracts');
              setActiveTab('vendor_list');
            } else {
              setCurrentModule(mod);
            }
          }} userRole={userRole} />
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
        {(currentModule === 'followup_admin' || currentModule === 'followup_consult') && (
          <ProjectFollowUp 
            projects={followupProjects} 
            history={followupHistory}
            userRole={userRole}
            mode={currentModule === 'followup_admin' ? 'admin' : 'consult'}
            onAddProjects={async (newBatch) => {
              for (const p of newBatch) {
                await saveAction('followup_projects', p);
              }
            }}
            onAddHistory={async (h) => {
              await saveAction('followup_history', h);
            }}
            onUpdateHistory={async (h) => {
              await saveAction('followup_history', h);
            }}
            onBack={() => setCurrentModule('home')}
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
              {activeTab === 'settings' && (
                <SettingsManager 
                  settings={companySettings} 
                  onSave={s => saveAction('company_settings', s)} 
                  onDataImported={reloadFromLocalStorage}
                  onForceSync={forceSync}
                  session={session}
                />
              )}
              {activeTab === 'access' && <AccessManagement suppliers={suppliers} />}
              {activeTab === 'vendor_list' && <VendorList />}
            </Layout>
          </>
        )}
      </>
    );
  };

  return (
    <>
      {userRole !== 'admin' && (
        <div className="fixed top-4 left-4 z-[60]">
           <button onClick={handleLogout} className="bg-slate-900 border border-slate-800 text-white px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-black hover:bg-slate-800 transition-all shadow-2xl">
             <LogOut size={14} /> Sair do Sistema
           </button>
        </div>
      )}
      {renderModule()}
    </>
  );
};

export default App;
