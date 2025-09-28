export type CheckState = boolean;

export interface ContractDays {
  mon: CheckState;
  tue: CheckState;
  wed: CheckState;
  thu: CheckState;
  fri: CheckState;
  sat: CheckState;
  sun: CheckState;
}

export interface ContractFormData {
  clientName: string;
  siteAddress: string;
  date: string;
  brand: "APS" | "AIS" | null;
  isStartup: CheckState;
  isAdjustment: CheckState;
  isTermination: CheckState;
  isChangeHours: CheckState;
  effectiveDate: string;
  accountManager: string;
  zone: string;
  summary: string;
  oldPrice: string;
  newPrice: string;
  newInvoiceAmount: string;
  septemberAdjustments: string;
  remodellingNote: string;
  employeeToggle: CheckState;
  subcontractorToggle: CheckState;
  oldEmployeeName: string;
  oldEmployeeMobile: string;
  newEmployeeName: string;
  newEmployeeMobile: string;
  shiftStart: string;
  shiftEnd: string;
  newEmploymentContractRequired: CheckState;
  days: ContractDays;
  oldSupplierName: string;
  newSupplierName: string;
  newSupplierPhone: string;
  newSupplierEmail: string;
  materialsYes: CheckState;
  materialsNo: CheckState;
  materialsBudget: string;
  supplierCostPCM: CheckState;
  supplierCostPA: CheckState;
  monthlyCost: string;
  annualised: string;
  actualDays: string;
}

export interface ParseResult {
  data: Partial<ContractFormData>;
  summaryLines: string[];
}