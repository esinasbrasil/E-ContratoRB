
export enum SupplierStatus {
  HOMOLOGATED = 'Homologado',
  PENDING = 'Aguardando',
  BLOCKED = 'Bloqueado'
}

// Removed Enum to allow dynamic creation of services
export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
}

export interface Supplier {
  id: string;
  name: string;
  cnpj: string;
  address: string;
  serviceType: string; // Changed to string to match dynamic ServiceCategory
  status: SupplierStatus;
  rating: number;
  docs: string[];
}

export interface Unit {
  id: string;
  name: string;
  address: string;
  cnpj: string;
  ie?: string;
  email?: string;
  phone?: string;
}

export interface Project {
  id: string;
  name: string;
  unitId: string;
  costCenter: string;
  description: string;
  estimatedValue: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Completed' | 'Planned';
}

export interface Preposto {
  name: string;
  role: string;
  email: string;
}

export interface LaborDetail {
  role: string;
  quantity: number;
}

export interface ContractAttachment {
  name: string;
  type: string; // Changed from union to string to support Safety/HR docs
  fileData: string; // Base64 string
}

export interface ContractRequestData {
  supplierId: string;
  projectId: string;
  
  // 1. Supplier & Location
  supplierBranches: string;
  serviceLocation: string;
  serviceType: string;
  
  // 2. Legal
  docSocialContract: boolean;
  docSerasa: boolean;
  
  // 3. Object & Scope
  objectDescription: string;
  scopeDescription: string;
  
  // 4. Team
  prepostos: Preposto[];
  technicalResponsible: string;
  
  // 5. Resources
  hasMaterials: boolean;
  materialsList: string;
  hasEquipment: boolean;
  equipmentList: string;
  hasRental: boolean;
  rentalList: string;
  hasLabor: boolean;
  laborDetails: LaborDetail[];
  
  // 6. Timeline & Financial
  startDate: string;
  endDate: string;
  scheduleSteps: string;
  value: number;
  paymentTerms: string;
  capLimit: string;
  correctionIndex: string;
  warranties: string;
  
  // 7. Risk (Existing text field)
  urgenciesRisks: string;

  // 7.1 Legal & Risk Aspects (Checkboxes)
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

  // 7.2 Mandatory Documents Checklist (New Checkboxes)
  docCheckCommercial: boolean;
  docCheckPO: boolean;
  docCheckCompliance: boolean;
  docCheckSupplierAcceptance: boolean;
  docCheckSystemRegistration: boolean;
  docCheckSupplierReport: boolean;
  docCheckFiscalValidation: boolean;
  docCheckSafetyDocs: boolean;
  docCheckTrainingCertificates: boolean;

  // 8 & 9. Attachments (General & Safety)
  attachments: ContractAttachment[];
}

export interface Contract {
  id: string;
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
