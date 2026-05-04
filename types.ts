
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

export interface ComplianceDocument {
  id: string;
  name: string;
  expiryDate: string;
  fileUrl?: string;
  type: string;
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
  complianceDocuments?: ComplianceDocument[];
  contactEmail?: string;
  contactPhone?: string;
  lastVisit?: string;
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

export interface SafetyClassificationResults {
  nr: string[];
  documentos: string[];
  epis: string[];
  controles: string[];
  answers: Record<string, boolean>;
  complexity: 'baixa' | 'media' | 'alta';
}

export interface ContractScheduleStep {
  name: string;
  days: number;
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
  scheduleStepsStructured?: ContractScheduleStep[];
  value: number;
  paymentTerms: string;
  billingSchedule?: string;
  capLimit: string;
  correctionIndex: string;
  warranties: string;
  
  urgenciesRisks: string;

  // Novos campos Jurídicos Passo 7
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
  
  // Ficha de Homologação: Segurança e RH
  homolCompanyPGR: boolean;
  homolCompanyPCMSO: boolean;
  homolCompanyAlvara: boolean;
  homolCompanyCNPJ: boolean;
  homolCompanyCNDFed: boolean;
  homolCompanyCNDT: boolean;
  homolCompanyCRF: boolean;
  homolCompanyEmployeeList: boolean;
  homolEmployeeASO: boolean;
  homolEmployeeEPI: boolean;
  homolEmployeeRegistration: boolean;
  homolEmployeeOS: boolean;
  homolEmployeeQualif: boolean;
  
  // Datas de validade
  expiryPGR?: string;
  expiryPCMSO?: string;
  expiryASO?: string;
  expiryNRs?: string;

  safetyClassification?: SafetyClassificationResults;
  createdAt?: string;

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

export interface ProcessStep {
  id: string;
  name: string;
  description?: string;
  type: 'internal' | 'supplier' | 'final';
  standardDurationDays: number;
  startDate?: string | null;
  limitDate?: string | null;
  completedDate?: string | null;
  isParallel?: boolean;
}

export interface Procedure {
  id: string;
  user_id?: string;
  projectId: string;
  supplierId?: string | null;
  projectName: string;
  supplierName?: string | null;
  steps: ProcessStep[];
  status: 'In Progress' | 'Completed' | 'Delayed';
  notes?: string;
  createdAt: string;
}

export interface ProcedureSettings {
  id: string;
  steps: Omit<ProcessStep, 'id'>[];
}

export enum AppTab {
  DASHBOARD = 'Dashboard',
  SUPPLIERS = 'Fornecedores',
  UNITS = 'Unidades',
  PROJECTS = 'Projetos',
  REQUISITION = 'Requisitante',
  COMPLIANCE = 'Seguranca',
  JURIDICO = 'Juridico',
  FINANCEIRO = 'Financeiro',
  PROCEDURES = 'Fluxo',
  PORTARIA_ADMIN = 'AcessoPortaria',
  SETTINGS = 'Configuracoes'
}

export interface VisitRecord {
  id: string;
  user_id?: string;
  name: string;
  cpf: string;
  cnpj: string;
  companyName?: string;
  carPlate: string;
  reason: string;
  authorizedBy: string;
  startDate: string;
  endDate: string;
  status: 'Authorized' | 'Completed' | 'Canceled';
  createdAt: string;
}

export interface DashboardStats {
  totalSuppliers: number;
  activeProjects: number;
  contractsGenerated: number;
  pendingHomologations: number;
}

export type UserRole = 'admin' | 'portaria' | 'fornecedor';

export interface UserSession {
  uid: string;
  email: string | null;
  role: UserRole;
  displayName?: string | null;
}

export interface CompanySettings {
  companyName: string;
  logoBase64: string | null;
  footerText: string;
  primaryColor: string;
  documentTitle?: string;
}
