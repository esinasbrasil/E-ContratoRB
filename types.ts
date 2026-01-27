
export enum SupplierStatus {
  HOMOLOGATED = 'Homologado',
  PENDING = 'Aguardando',
  BLOCKED = 'Bloqueado'
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
}

export interface Supplier {
  id: string;
  user_id?: string;
  name: string;
  cnpj: string;
  address: string;
  serviceType: string;
  status: SupplierStatus;
  rating: number;
  docs: string[];
}

export interface Unit {
  id: string;
  user_id?: string;
  name: string;
  address: string;
  cnpj: string;
  ie?: string;
  email?: string;
  phone?: string;
}

export interface NR {
  id: string;
  number: string;
  name: string;
  description: string;
}

export interface ProjectAttachment {
  name: string;
  url: string;
  type: 'Photo' | 'Scope' | 'Project' | 'Other';
}

export interface Project {
  id: string;
  user_id?: string;
  name: string;
  unitId: string;
  costCenter: string;
  orderNumber?: string;
  description: string;
  estimatedValue: number;
  startDate: string;
  endDate: string;
  type: 'Improvement' | 'Adaptation' | 'Acquisition' | 'Renovation' | 'Compliance' | 'Maintenance' | 'Other';
  status: 'Active' | 'Completed' | 'Planned' | 'On Hold';
  attachments: ProjectAttachment[];
  requiredNRs: string[];
}

export interface Preposto {
  name: string;
  role: string;
  email: string;
  cpf: string;
}

export interface LaborDetail {
  role: string;
  quantity: number;
}

export interface ContractAttachment {
  name: string;
  type: string;
  fileData: string;
}

export interface ContractRequestData {
  supplierId: string;
  projectId: string;
  unitId?: string;
  orderNumber?: string;
  
  supplierBranches: string;
  serviceLocation: string;
  serviceType: string;
  
  docSocialContract: boolean;
  docSerasa: boolean;
  
  objectDescription: string;
  scopeDescription: string;
  
  prepostos: Preposto[];
  technicalResponsible: string;
  technicalResponsibleCpf: string;
  
  hasMaterials: boolean;
  materialsList: string;
  hasEquipment: boolean;
  equipmentList: string;
  hasRental: boolean;
  rentalList: string;
  hasComodato: boolean;
  comodatoList: string;
  hasLabor: boolean;
  laborDetails: LaborDetail[];
  
  startDate: string;
  endDate: string;
  scheduleSteps: string;
  value: number;
  paymentTerms: string;
  capLimit: string;
  correctionIndex: string;
  warranties: string;
  
  urgenciesRisks: string;

  aspectStandardDraft: boolean;
  aspectNonStandardDraft: boolean;
  aspectConfidentiality: boolean;
  aspectTermination: boolean;
  aspectWarranties: boolean;
  aspectWarrantyStart: boolean;
  aspectPostTermination: boolean;
  aspectPublicAgencies: boolean;
  aspectAdvancePayment: boolean;
  aspectNonStandard: boolean;

  docCheckCommercial: boolean;
  docCheckPO: boolean;
  docCheckCompliance: boolean;
  docCheckSupplierAcceptance: boolean;
  docCheckSystemRegistration: boolean;
  docCheckSupplierReport: boolean;
  docCheckFiscalValidation: boolean;
  docCheckSafetyDocs: boolean;
  docCheckTrainingCertificates: boolean;

  attachments: ContractAttachment[];
}

export interface Contract {
  id: string;
  user_id?: string;
  projectId: string;
  supplierId: string;
  value: number;
  createdAt: string;
  status: 'Draft' | 'Legal Review' | 'Signed';
  details: ContractRequestData;
}

export interface DashboardStats {
  totalSuppliers: number;
  activeProjects: number;
  contractsGenerated: number;
  pendingHomologations: number;
}

export interface CompanySettings {
  companyName: string;
  logoBase64: string | null;
  footerText: string;
  primaryColor: string;
  documentTitle?: string;
}
