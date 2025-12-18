
import { Supplier, Project, Unit, ServiceCategory, Contract, CompanySettings } from '../types';

const KEYS = {
  SUPPLIERS: 'ecocontract_suppliers',
  PROJECTS: 'ecocontract_projects',
  UNITS: 'ecocontract_units',
  SERVICES: 'ecocontract_services',
  CONTRACTS: 'ecocontract_contracts',
  SETTINGS: 'ecocontract_settings'
};

// Helper genérico para pegar dados
const get = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error(`Erro ao ler ${key}`, e);
    return [];
  }
};

// Helper genérico para salvar lista completa
const set = (key: string, data: any[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const storageService = {
  // --- Suppliers ---
  getSuppliers: (): Supplier[] => get<Supplier>(KEYS.SUPPLIERS),
  saveSupplier: (supplier: Supplier) => {
    const list = get<Supplier>(KEYS.SUPPLIERS);
    const index = list.findIndex(s => s.id === supplier.id);
    if (index >= 0) {
      list[index] = supplier;
    } else {
      list.push(supplier);
    }
    set(KEYS.SUPPLIERS, list);
  },
  deleteSupplier: (id: string) => {
    const list = get<Supplier>(KEYS.SUPPLIERS);
    set(KEYS.SUPPLIERS, list.filter(s => s.id !== id));
  },

  // --- Projects ---
  getProjects: (): Project[] => get<Project>(KEYS.PROJECTS),
  saveProject: (project: Project) => {
    const list = get<Project>(KEYS.PROJECTS);
    const index = list.findIndex(p => p.id === project.id);
    if (index >= 0) {
      list[index] = project;
    } else {
      list.push(project);
    }
    set(KEYS.PROJECTS, list);
  },
  deleteProject: (id: string) => {
    const list = get<Project>(KEYS.PROJECTS);
    set(KEYS.PROJECTS, list.filter(p => p.id !== id));
  },

  // --- Units ---
  getUnits: (): Unit[] => get<Unit>(KEYS.UNITS),
  saveUnit: (unit: Unit) => {
    const list = get<Unit>(KEYS.UNITS);
    const index = list.findIndex(u => u.id === unit.id);
    if (index >= 0) {
      list[index] = unit;
    } else {
      list.push(unit);
    }
    set(KEYS.UNITS, list);
  },
  deleteUnit: (id: string) => {
    const list = get<Unit>(KEYS.UNITS);
    set(KEYS.UNITS, list.filter(u => u.id !== id));
  },

  // --- Service Categories ---
  getServices: (): ServiceCategory[] => get<ServiceCategory>(KEYS.SERVICES),
  saveService: (service: ServiceCategory) => {
    const list = get<ServiceCategory>(KEYS.SERVICES);
    // Services might not allow update in UI, but safe add
    if (!list.find(s => s.id === service.id)) {
        list.push(service);
        set(KEYS.SERVICES, list);
    }
  },
  deleteService: (id: string) => {
    const list = get<ServiceCategory>(KEYS.SERVICES);
    set(KEYS.SERVICES, list.filter(s => s.id !== id));
  },

  // --- Contracts ---
  getContracts: (): Contract[] => get<Contract>(KEYS.CONTRACTS),
  saveContract: (contract: Contract) => {
    const list = get<Contract>(KEYS.CONTRACTS);
    const index = list.findIndex(c => c.id === contract.id);
    if (index >= 0) {
      list[index] = contract;
    } else {
      list.push(contract);
    }
    set(KEYS.CONTRACTS, list);
  },
  deleteContract: (id: string) => {
    const list = get<Contract>(KEYS.CONTRACTS);
    set(KEYS.CONTRACTS, list.filter(c => c.id !== id));
  },

  // --- Settings ---
  getSettings: (): CompanySettings | null => {
    const data = localStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : null;
  },
  saveSettings: (settings: CompanySettings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  // --- System ---
  resetDatabase: () => {
    localStorage.clear();
  },
  
  seedDatabase: (
      suppliers: Supplier[], 
      projects: Project[], 
      units: Unit[], 
      services: ServiceCategory[], 
      contracts: Contract[]
  ) => {
      set(KEYS.SUPPLIERS, suppliers);
      set(KEYS.PROJECTS, projects);
      set(KEYS.UNITS, units);
      set(KEYS.SERVICES, services);
      set(KEYS.CONTRACTS, contracts);
  }
};
