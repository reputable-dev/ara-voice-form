import { ContractFormData, ParseResult } from "@/types/contract";

const trim = (v: string | undefined | null) => (v ?? "").trim();

export function initialContractData(): ContractFormData {
  return {
    clientName: "",
    siteAddress: "",
    date: "",
    brand: null,
    isStartup: false,
    isAdjustment: false,
    isTermination: false,
    isChangeHours: false,
    effectiveDate: "",
    accountManager: "",
    zone: "",
    summary: "",
    oldPrice: "",
    newPrice: "",
    newInvoiceAmount: "",
    septemberAdjustments: "",
    remodellingNote: "",
    employeeToggle: false,
    subcontractorToggle: false,
    oldEmployeeName: "",
    oldEmployeeMobile: "",
    newEmployeeName: "",
    newEmployeeMobile: "",
    shiftStart: "",
    shiftEnd: "",
    newEmploymentContractRequired: false,
    days: { mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false },
    oldSupplierName: "",
    newSupplierName: "",
    newSupplierPhone: "",
    newSupplierEmail: "",
    materialsYes: false,
    materialsNo: false,
    materialsBudget: "",
    supplierCostPCM: false,
    supplierCostPA: false,
    monthlyCost: "",
    annualised: "",
    actualDays: "",
  };
}

export function parseContractSource(srcRaw: string): ParseResult {
  const src = srcRaw ?? "";
  const data: Partial<ContractFormData> = {};
  const summary: string[] = [];

  try {
    const mClient = src.match(/Client name:\s*([^\n]+)/i);
    if (mClient) data.clientName = trim(mClient[1]);

    // Match site address with optional date
    const mSiteWithDate = src.match(/Site Address:\s*([^\t\n]+).*?Date:\s*([^\n]+)/i);
    if (mSiteWithDate) {
      data.siteAddress = trim(mSiteWithDate[1]);
      data.date = trim(mSiteWithDate[2]);
    } else {
      // Fallback: match site address without date requirement
      const mSiteOnly = src.match(/Site Address:\s*([^\n]+)/i);
      if (mSiteOnly) data.siteAddress = trim(mSiteOnly[1]);
    }

    if (/ARA Indigenous Services\s*[☒x]/i.test(src)) data.brand = "AIS";
    else if (/ARA Property Services\s*[☒x]/i.test(src)) data.brand = "APS";

    // Contract types - explicitly handle both checked (☒) and unchecked (☐) boxes
    if (/Start up\s*[☒x]/i.test(src)) {
      data.isStartup = true;
    } else if (/Start up\s*☐/i.test(src)) {
      data.isStartup = false;
    }

    if (/Adjustment\s*[☒x]/i.test(src)) {
      data.isAdjustment = true;
    } else if (/Adjustment\s*☐/i.test(src)) {
      data.isAdjustment = false;
    }

    if (/Termination\s*[☒x]/i.test(src)) {
      data.isTermination = true;
    } else if (/Termination\s*☐/i.test(src)) {
      data.isTermination = false;
    }

    if (/Change in allowed hours\s*[☒x]/i.test(src) || /Only\s*12hrs per day will be used/i.test(src)) {
      data.isChangeHours = true;
    } else if (/Change in allowed hours\s*☐/i.test(src)) {
      data.isChangeHours = false;
    }

    const mEff = src.match(/EFFECTIVE\s*([0-9/]+)/i) ?? src.match(/Date change will take effect:\s*([0-9/]+)/i);
    if (mEff) data.effectiveDate = trim(mEff[1]);

    const mAM = src.match(/Account Manager:\s*([^\n]+)/i);
    if (mAM) data.accountManager = trim(mAM[1]);

    const mZone = src.match(/Zone:\s*([^\n]+)/i);
    if (mZone) data.zone = trim(mZone[1]);

    const mNewPrice = src.match(/New contract price:\s*([^\n]+)/i);
    if (mNewPrice) data.newPrice = trim(mNewPrice[1]);

    const mNewInv = src.match(/New invoice amount per month[^\n]*?- ([^\n]+)/i);
    if (mNewInv) data.newInvoiceAmount = trim(mNewInv[1]);

    const mAdj = src.match(/September invoice adjustments([\s\S]*?)(Remodelling|Day Cleaner|Old contract|$)/i);
    if (mAdj && mAdj[1]) data.septemberAdjustments = trim(mAdj[1]);

    const mRemodel = src.match(/Remodelling[\s\S]*?(Only[^\n]+)/i);
    if (mRemodel) data.remodellingNote = trim(mRemodel[0]);

    if (/New Employee hours:/i.test(src) || /Day Cleaner/i.test(src)) data.employeeToggle = true;

    const mEmpName = src.match(/New Employee Name:\s*([^\n]+?)\s+Mobile/i) ?? src.match(/Day Cleaner\s+([A-Za-z\s'\-]+)\s+[–-]/i);
    if (mEmpName) data.newEmployeeName = trim(mEmpName[1]);

    // Extract mobile number from employee line
    const mEmpMobile = src.match(/Mobile:\s*([^\n]+)/i);
    if (mEmpMobile) data.newEmployeeMobile = trim(mEmpMobile[1]);

    const mShift = src.match(/New shift\s*([0-9]{1,2}:[0-9]{2})\s*[–-]\s*([0-9]{1,2}:[0-9]{2})([^\n]*)/i);
    if (mShift) {
      data.shiftStart = trim(mShift[1]);
      data.shiftEnd = trim(mShift[2]);
      const tail = (mShift[3] ?? "").toLowerCase();
      if (/monday\s*to\s*friday/.test(tail)) {
        data.days = { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false };
        data.actualDays = "Mon–Fri";
      }
    }

    if (/New employment contract required/i.test(src)) data.newEmploymentContractRequired = true;

    // Build summary lines
    if (data.clientName) summary.push(`Client: ${data.clientName}`);

    const term = src.match(/Termination of day cleaning service[^\n]+charges\./i);
    if (term) summary.push(trim(term[0]));
    if (data.newInvoiceAmount) summary.push(`New AWB invoice per month: ${data.newInvoiceAmount}`);
    if (data.effectiveDate) summary.push(`Effective: ${data.effectiveDate}`);
    if (data.newEmployeeName || data.shiftStart || data.shiftEnd) {
      const nm = data.newEmployeeName ?? "Employee";
      const st = data.shiftStart ?? "";
      const en = data.shiftEnd ?? "";
      summary.push(`Employee: ${nm} shift ${st}–${en} Mon–Fri; FT→PT.`);
    }
    if (/Update of timegate required/i.test(src)) summary.push("Action: Update Timegate access/config.");
    if (/do not change/i.test(src)) summary.push("Other rostered employees unchanged.");
  } catch (e) {
    console.log("parseContractSource error", e);
  }

  return { data, summaryLines: summary };
}

export function applyParsedToState(current: ContractFormData, parsed: ParseResult): ContractFormData {
  const d = parsed.data;
  const next: ContractFormData = { ...current };

  if (typeof d.clientName !== "undefined") next.clientName = d.clientName ?? "";
  if (typeof d.siteAddress !== "undefined") next.siteAddress = d.siteAddress ?? "";
  if (typeof d.date !== "undefined") next.date = d.date ?? "";
  if (typeof d.brand !== "undefined") next.brand = d.brand ?? null;

  if (typeof d.isStartup !== "undefined") next.isStartup = !!d.isStartup;
  if (typeof d.isAdjustment !== "undefined") next.isAdjustment = !!d.isAdjustment;
  if (typeof d.isTermination !== "undefined") next.isTermination = !!d.isTermination;
  if (typeof d.isChangeHours !== "undefined") next.isChangeHours = !!d.isChangeHours;

  if (typeof d.effectiveDate !== "undefined") next.effectiveDate = d.effectiveDate ?? "";
  if (typeof d.accountManager !== "undefined") next.accountManager = d.accountManager ?? "";
  if (typeof d.zone !== "undefined") next.zone = d.zone ?? "";
  if (typeof d.newPrice !== "undefined") next.newPrice = d.newPrice ?? "";
  if (typeof d.newInvoiceAmount !== "undefined") next.newInvoiceAmount = d.newInvoiceAmount ?? "";
  if (typeof d.septemberAdjustments !== "undefined") next.septemberAdjustments = d.septemberAdjustments ?? "";
  if (typeof d.remodellingNote !== "undefined") next.remodellingNote = d.remodellingNote ?? "";

  if (typeof d.employeeToggle !== "undefined") next.employeeToggle = !!d.employeeToggle;
  if (typeof d.newEmployeeName !== "undefined") next.newEmployeeName = d.newEmployeeName ?? "";
  if (typeof d.shiftStart !== "undefined") next.shiftStart = d.shiftStart ?? "";
  if (typeof d.shiftEnd !== "undefined") next.shiftEnd = d.shiftEnd ?? "";
  if (typeof d.newEmploymentContractRequired !== "undefined") next.newEmploymentContractRequired = !!d.newEmploymentContractRequired;

  if (typeof d.days !== "undefined" && d.days) next.days = { ...next.days, ...d.days };
  if (typeof d.actualDays !== "undefined") next.actualDays = d.actualDays ?? "";

  const summaryJoined = parsed.summaryLines.join("\n");
  next.summary = summaryJoined.length ? summaryJoined : next.summary;

  return next;
}