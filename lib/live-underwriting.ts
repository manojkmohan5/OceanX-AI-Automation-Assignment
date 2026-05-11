import type { WebPullResult } from "@/lib/web-data";

const DEVELOPED_MARKETS = new Set([
  "united states",
  "united kingdom",
  "canada",
  "australia",
  "new zealand",
  "singapore",
  "hong kong",
  "germany",
  "france",
  "netherlands",
  "belgium",
  "switzerland",
  "italy",
  "spain",
  "portugal",
  "sweden",
  "norway",
  "denmark",
  "finland",
  "luxembourg"
]);

type Check = {
  label: string;
  passed: boolean | null;
  detail: string;
};

type QualificationStatus = "PASS" | "FAIL" | "NEED INFO";
type DecisionStatus = "AWAITING DATA" | "APPROVE" | "APPROVE WITH CONDITIONS" | "REQUEST INFO" | "REJECT";
type ConfidenceLevel = "High" | "Medium" | "Low";

export type LiveUnderwritingDecision = {
  status: DecisionStatus;
  confidenceLevel: ConfidenceLevel;
  riskScore: number;
  confidenceScore: number;
  customerSummary: {
    company: string;
    country: string;
    tenure: string;
    businessModel: string;
    channels: string;
    importRegions: string;
  };
  dataCoverage: {
    bankConnected: string;
    accountingConnected: string;
    ecommerceConnected: string;
    uploadsReceived: string;
    meetingNotes: string;
    confidence: ConfidenceLevel;
    rationale: string;
  };
  basicQualification: QualificationStatus;
  deepQualification: QualificationStatus;
  basicChecks: Check[];
  deepChecks: Check[];
  keyMetrics: {
    revenue: number | null;
    grossMargin: number | null;
    cashInBank: number | null;
    adb: number | null;
    minDailyBalance: number | null;
    monthlyInflowOutflow: string;
    debt: number | null;
    inventoryOnHand: number | null;
    overdueAp: number | null;
  };
  creditLimits: {
    methodA: {
      adb: number | null;
      baseLimit: number | null;
      adjustments: string[];
      limit: number | null;
    };
    methodB: {
      importCap: number | null;
      inventoryCap: number | null;
      totalCap: number | null;
    };
    recommended: {
      importFinance: number | null;
      inventoryFinance: number | null;
      total: number | null;
      note: string;
    };
  };
  repaymentFit: {
    assumedCashCycleMonths: number;
    termWeeks: number;
    weeklyDebitEstimate: number | null;
    fitCommentary: string;
    directDebitMandate: string;
  };
  impact: {
    utilization: number;
    grossMargin: number | null;
    cashCycleMonths: number;
    salesPerCycle: number | null;
    turnsPerYear: number | null;
    incrementalAnnualSales: number | null;
    incrementalAnnualGrossProfit: number | null;
    note: string;
  };
  riskFlags: string[];
  mitigations: string[];
  nextActions: string[];
  missingFields: string[];
  reasoning: string[];
};

export function calculateLiveUnderwriting(result: WebPullResult | null): LiveUnderwritingDecision {
  if (!result) {
    return {
      status: "AWAITING DATA",
      confidenceLevel: "Low",
      riskScore: 0,
      confidenceScore: 0,
      customerSummary: {
        company: "Not yet pulled",
        country: "Unknown",
        tenure: "Unknown",
        businessModel: "Pending source pull",
        channels: "Unknown",
        importRegions: "Unknown"
      },
      dataCoverage: {
        bankConnected: "No",
        accountingConnected: "No",
        ecommerceConnected: "No",
        uploadsReceived: "None",
        meetingNotes: "No",
        confidence: "Low",
        rationale: "Paste one or more public source URLs to begin underwriting."
      },
      basicQualification: "NEED INFO",
      deepQualification: "NEED INFO",
      basicChecks: [],
      deepChecks: [],
      keyMetrics: {
        revenue: null,
        grossMargin: null,
        cashInBank: null,
        adb: null,
        minDailyBalance: null,
        monthlyInflowOutflow: "Unavailable",
        debt: null,
        inventoryOnHand: null,
        overdueAp: null
      },
      creditLimits: {
        methodA: {
          adb: null,
          baseLimit: null,
          adjustments: ["Awaiting source pull."],
          limit: null
        },
        methodB: {
          importCap: null,
          inventoryCap: null,
          totalCap: null
        },
        recommended: {
          importFinance: null,
          inventoryFinance: null,
          total: null,
          note: "No underwriting output until evidence is pulled."
        }
      },
      repaymentFit: {
        assumedCashCycleMonths: 4,
        termWeeks: 16,
        weeklyDebitEstimate: null,
        fitCommentary: "Repayment fit requires revenue plus connected bank/accounting evidence.",
        directDebitMandate: "Unknown"
      },
      impact: {
        utilization: 100,
        grossMargin: null,
        cashCycleMonths: 4,
        salesPerCycle: null,
        turnsPerYear: null,
        incrementalAnnualSales: null,
        incrementalAnnualGrossProfit: null,
        note: "Impact model requires gross margin and a usable recommended limit."
      },
      riskFlags: ["No source pulled yet."],
      mitigations: ["Provide a public company source to start the case."],
      nextActions: ["Paste public source URL."],
      missingFields: ["Public source URL"],
      reasoning: ["Paste one or more public URLs so the underwriting agent can pull live evidence."]
    };
  }

  const metrics = result.metrics;
  const revenue = metrics.revenue?.value ?? null;
  const grossMargin = metrics.grossMargin?.value ?? null;
  const adb = metrics.adb?.value ?? null;
  const debtRatio = metrics.debtRatio?.value ?? null;
  const cashRunwayMonths = metrics.cashRunwayMonths?.value ?? null;
  const overdueAp = metrics.overdueAp?.value ?? null;
  const tenureYears = metrics.tenureYears?.value ?? null;
  const country = metrics.country?.value ?? null;
  const industry = metrics.industry?.value ?? null;
  const importsPhysicalGoods = metrics.importsPhysicalGoods?.value ?? null;
  const bankConnected = Boolean(result.dataCoverage?.bankConnected);
  const accountingConnected = Boolean(result.dataCoverage?.accountingConnected);
  const ecommerceConnected = Boolean(result.dataCoverage?.ecommerceConnected);
  const directDebitMandate = Boolean(result.dataCoverage?.directDebitMandate);
  const developedMarket = country ? DEVELOPED_MARKETS.has(country.toLowerCase()) : null;
  const company = deriveCompanyName(result);

  const basicChecks: Check[] = [
    {
      label: "Revenue >= $1M",
      passed: revenue !== null ? revenue >= 1000000 : null,
      detail: revenue !== null ? `$${revenue.toLocaleString()}` : "Not found in available source"
    },
    {
      label: "Developed market",
      passed: developedMarket,
      detail: country ?? "Country not found"
    },
    {
      label: "Tenure >= 2 years",
      passed: tenureYears !== null ? tenureYears >= 2 : null,
      detail: tenureYears !== null ? `${tenureYears} years` : "Founded year not found"
    },
    {
      label: "Imports physical goods",
      passed: importsPhysicalGoods,
      detail:
        importsPhysicalGoods === null
          ? "No import / physical-goods evidence found"
          : importsPhysicalGoods
            ? "Public source suggests physical goods / imported products"
            : "Public source does not support imported physical-goods model"
    }
  ];

  const methodABase = adb !== null ? adb * 10 : null;
  const methodAAdjustments =
    adb !== null
      ? bankConnected
        ? ["Connected bank packet supports ADB. No one-off injection, overdraft, or NSF adjustment is indicated in this demo source."]
        : ["No min-balance, volatility, NSF, or one-off injection adjustments are available from public-only data."]
      : ["Method A requires connected bank data or uploaded balances for the last 90 days."];
  const methodALimit = methodABase;
  const importCap = revenue !== null ? revenue * 0.1 : null;
  const inventoryCap = revenue !== null ? revenue * 0.1 : null;
  const totalCap = revenue !== null ? revenue * 0.2 : null;
  const finalRecommendedTotal = methodALimit !== null && totalCap !== null ? Math.min(methodALimit, totalCap) : null;
  const recommendedImportFinance = finalRecommendedTotal !== null ? finalRecommendedTotal / 2 : null;
  const recommendedInventoryFinance = finalRecommendedTotal !== null ? finalRecommendedTotal / 2 : null;
  const assumedCashCycleMonths = 4;
  const termWeeks = 16;
  const weeklyDebitEstimate = finalRecommendedTotal !== null ? finalRecommendedTotal / termWeeks : null;

  const bankLiquidityPass = adb !== null && weeklyDebitEstimate !== null ? weeklyDebitEstimate < adb / 2 : null;

  const deepChecks: Check[] = [
    {
      label: "Debt ratio <= 10%",
      passed: debtRatio !== null ? debtRatio <= 10 : null,
      detail: debtRatio !== null ? `${debtRatio}%` : "Requires connected accounting or uploaded debt schedule"
    },
    {
      label: "Gross margin >= 30%",
      passed: grossMargin !== null ? grossMargin >= 30 : null,
      detail: grossMargin !== null ? `${grossMargin}%` : "Requires revenue + COGS or public gross margin disclosure"
    },
    {
      label: "Cash runway > 6 months",
      passed: cashRunwayMonths !== null ? cashRunwayMonths > 6 : null,
      detail: cashRunwayMonths !== null ? `${cashRunwayMonths} months` : "Requires connected bank/accounting cash + opex data"
    },
    {
      label: "Overdue AP <= 20%",
      passed: overdueAp !== null ? overdueAp <= 20 : null,
      detail: overdueAp !== null ? `${overdueAp}%` : "Requires aged AP ledger or connected accounting data"
    },
    {
      label: "Bank liquidity (ADB + weekly debit fit)",
      passed: bankLiquidityPass,
      detail:
        bankLiquidityPass === null
          ? "Requires ADB and bank balance history"
          : bankLiquidityPass
            ? "ADB supports the assumed weekly debit"
            : "ADB does not comfortably support the assumed weekly debit"
    }
  ];

  const basicQualification = summarizeChecks(basicChecks);
  const deepQualification = summarizeChecks(deepChecks);

  const missingFields = [
    !metrics.revenue && "Revenue (TTM)",
    !metrics.country && "Country / geography",
    !metrics.tenureYears && "Founded year / tenure",
    !metrics.importsPhysicalGoods && "Import / physical-goods evidence",
    !metrics.adb && "Average Daily Balance (90d)",
    !metrics.grossMargin && "Gross margin",
    !metrics.debtRatio && "Debt ratio / debt schedule",
    !metrics.cashRunwayMonths && "Cash runway",
    !metrics.overdueAp && "Overdue AP / aged payables",
    !bankConnected && "Connected bank accounts",
    !accountingConnected && "Connected accounting",
    !ecommerceConnected && "Connected e-commerce"
  ].filter(Boolean) as string[];

  const confidenceLevel = getConfidenceLevel(result, missingFields.length);
  const failedBasicChecks = basicChecks.filter((check) => check.passed === false).length;
  const failedDeepChecks = deepChecks.filter((check) => check.passed === false).length;
  const riskScore = Math.min(96, Math.max(18, 24 + failedBasicChecks * 22 + failedDeepChecks * 14 + missingFields.length * 3));
  const confidenceScore = Math.max(
    18,
    Math.min(90, 84 - missingFields.length * 3 - result.sources.filter((source) => !source.ok).length * 10 - (confidenceLevel === "Low" ? 12 : confidenceLevel === "Medium" ? 5 : 0))
  );

  let status: DecisionStatus = "REQUEST INFO";
  if (basicQualification === "FAIL") {
    status = "REJECT";
  } else if (deepQualification === "FAIL" && failedDeepChecks >= 2) {
    status = "REJECT";
  } else if (basicQualification === "PASS" && deepQualification === "PASS" && finalRecommendedTotal !== null && confidenceLevel === "High" && directDebitMandate) {
    status = "APPROVE";
  } else if (basicQualification === "PASS" && deepQualification === "PASS" && finalRecommendedTotal !== null && confidenceLevel !== "Low") {
    status = "APPROVE WITH CONDITIONS";
  }

  const riskFlags = buildRiskFlags({
    revenue,
    tenureYears,
    developedMarket,
    grossMargin,
    debtRatio,
    overdueAp,
    adb,
    confidenceLevel,
    bankConnected,
    accountingConnected,
    ecommerceConnected
  });

  const mitigations = buildMitigations({
    finalRecommendedTotal,
    grossMargin,
    adb,
    bankConnected,
    accountingConnected,
    ecommerceConnected,
    directDebitMandate
  });

  const nextActions = buildNextActions(missingFields, directDebitMandate);

  const impact = calculateImpact(finalRecommendedTotal, grossMargin, assumedCashCycleMonths);

  const customerSummary = {
    company,
    country: country ?? "Unknown",
    tenure: tenureYears !== null ? `${tenureYears} years` : "Unknown",
    businessModel: importsPhysicalGoods ? "Importer / seller of physical goods supported by source evidence." : "Business model not sufficiently verified from source.",
    channels: ecommerceConnected ? "E-commerce and wholesale channels verified in connected packet." : "Public source only; e-commerce / wholesale split not yet connected.",
    importRegions: result.dataCoverage?.verifiedConnectedPacket ? "Vietnam, China, and Portugal supplier records in connected packet." : "Not verified from public source."
  };

  const dataCoverage = {
    bankConnected: bankConnected ? "Yes" : "No",
    accountingConnected: accountingConnected ? "Yes" : "No",
    ecommerceConnected: ecommerceConnected ? "Yes" : "No",
    uploadsReceived: result.dataCoverage?.uploadsReceived ?? "None",
    meetingNotes: result.dataCoverage?.meetingNotes ? "Yes" : "No",
    confidence: confidenceLevel,
    rationale:
      confidenceLevel === "High"
        ? "Connected demo packet includes bank, accounting, and e-commerce evidence, so the case can move to a clear policy decision."
        : confidenceLevel === "Low"
        ? "Only public webpage evidence is available. Connected bank, accounting, and e-commerce data are missing."
        : "Public evidence supports core company facts, but connected financial sources are still required for a final underwriting decision."
  };

  const keyMetrics = {
    revenue,
    grossMargin,
    cashInBank: metrics.cashInBank?.value ?? null,
    adb,
    minDailyBalance: metrics.minDailyBalance?.value ?? null,
    monthlyInflowOutflow:
      metrics.avgMonthlyInflow?.value !== undefined || metrics.avgMonthlyOutflow?.value !== undefined
        ? `${formatCurrency(metrics.avgMonthlyInflow?.value ?? null)} inflow / ${formatCurrency(metrics.avgMonthlyOutflow?.value ?? null)} outflow`
        : "Unavailable without connected bank data",
    debt: debtRatio !== null && revenue !== null ? (debtRatio / 100) * revenue : null,
    inventoryOnHand: metrics.inventoryOnHand?.value ?? null,
    overdueAp
  };

  const creditLimits = {
    methodA: {
      adb,
      baseLimit: methodABase,
      adjustments: methodAAdjustments,
      limit: methodALimit
    },
    methodB: {
      importCap,
      inventoryCap,
      totalCap
    },
    recommended: {
      importFinance: recommendedImportFinance,
      inventoryFinance: recommendedInventoryFinance,
      total: finalRecommendedTotal,
      note:
        finalRecommendedTotal !== null
          ? "Final recommended limit uses the lower of Method A and the total revenue cap."
          : totalCap !== null
            ? "Revenue caps are available, but final recommended limits require Method A and connected bank/accounting verification."
            : "Unable to size limits until revenue is verified."
    }
  };

  const repaymentFit = {
    assumedCashCycleMonths,
    termWeeks,
    weeklyDebitEstimate,
    fitCommentary:
      weeklyDebitEstimate !== null && adb !== null
        ? weeklyDebitEstimate < adb / 2
          ? "Weekly debit is below ADB / 2 and fits the conservative proxy."
          : "Weekly debit is not comfortably below ADB / 2 and needs review."
        : "Cannot assess repayment fit until ADB or average weekly inflow is connected.",
    directDebitMandate: directDebitMandate ? "Active" : "Unknown / not connected"
  };

  const reasoning = [
    result.dataCoverage?.verifiedConnectedPacket
      ? "Trust hierarchy applied: this sandbox source represents connected bank, accounting, and e-commerce evidence for demo underwriting."
      : "Trust hierarchy applied conservatively: public website evidence is weaker than connected bank, accounting, or e-commerce sources.",
    methodABase !== null
      ? `Method A base limit is 10 x ADB = $${methodABase.toLocaleString()}.`
      : "Method A cannot be calculated because ADB and daily balance history are not connected.",
    totalCap !== null
      ? `Method B caps are Import ${formatCurrency(importCap)}, Inventory ${formatCurrency(inventoryCap)}, Total ${formatCurrency(totalCap)}.`
      : "Method B cannot be calculated until revenue is verified.",
    finalRecommendedTotal !== null
      ? `Recommended total limit is ${formatCurrency(finalRecommendedTotal)} using the lower of Method A and Method B.`
      : "A final recommended limit is withheld until connected bank/accounting evidence is available."
  ];

  return {
    status,
    confidenceLevel,
    riskScore,
    confidenceScore,
    customerSummary,
    dataCoverage,
    basicQualification,
    deepQualification,
    basicChecks,
    deepChecks,
    keyMetrics,
    creditLimits,
    repaymentFit,
    impact,
    riskFlags,
    mitigations,
    nextActions,
    missingFields,
    reasoning
  };
}

function summarizeChecks(checks: Check[]): QualificationStatus {
  if (checks.some((check) => check.passed === false)) return "FAIL";
  if (checks.some((check) => check.passed === null)) return "NEED INFO";
  return "PASS";
}

function getConfidenceLevel(result: WebPullResult, missingFieldCount: number): ConfidenceLevel {
  const extractedFields = Object.values(result.metrics).filter(Boolean).length;
  if (
    result.dataCoverage?.bankConnected &&
    result.dataCoverage.accountingConnected &&
    result.dataCoverage.ecommerceConnected &&
    extractedFields >= 9 &&
    missingFieldCount === 0 &&
    result.sources.every((source) => source.ok)
  ) {
    return "High";
  }
  if (extractedFields >= 6 && missingFieldCount <= 5 && result.sources.every((source) => source.ok)) return "Medium";
  return "Low";
}

function buildRiskFlags(input: {
  revenue: number | null;
  tenureYears: number | null;
  developedMarket: boolean | null;
  grossMargin: number | null;
  debtRatio: number | null;
  overdueAp: number | null;
  adb: number | null;
  confidenceLevel: ConfidenceLevel;
  bankConnected: boolean;
  accountingConnected: boolean;
  ecommerceConnected: boolean;
}) {
  const flags: string[] = [];
  if (input.revenue !== null && input.revenue < 1000000) flags.push("Revenue below $1M basic qualification threshold.");
  if (input.tenureYears !== null && input.tenureYears < 2) flags.push("Business tenure below 2 years.");
  if (input.developedMarket === false) flags.push("Geography falls outside approved developed markets.");
  if (input.grossMargin !== null && input.grossMargin < 30) flags.push("Gross margin below 30% deep qualification threshold.");
  if (input.debtRatio !== null && input.debtRatio > 10) flags.push("Debt ratio above 10% of annual revenue.");
  if (input.overdueAp !== null && input.overdueAp > 20) flags.push("Overdue AP exceeds 20% of total AP.");
  if (input.adb === null) flags.push("ADB, volatility, and NSF indicators are missing.");
  if (input.confidenceLevel === "Low") flags.push("Public-source-only evidence provides low underwriting confidence.");
  if (!input.bankConnected) flags.push("Connected bank data is not available.");
  if (!input.accountingConnected) flags.push("Connected accounting data is not available.");
  if (!input.ecommerceConnected) flags.push("Connected e-commerce data is not available.");
  if (!flags.length) flags.push("No immediate policy breach from supplied evidence.");
  return flags;
}

function buildMitigations(input: {
  finalRecommendedTotal: number | null;
  grossMargin: number | null;
  adb: number | null;
  bankConnected: boolean;
  accountingConnected: boolean;
  ecommerceConnected: boolean;
  directDebitMandate: boolean;
}) {
  const mitigations = ["Use a smaller initial limit and step-up only after repayment performance is observed.", "Apply inventory collateral and tighter weekly monitoring where capital is released."];
  if (input.finalRecommendedTotal !== null) mitigations.unshift(`Use ${formatCurrency(input.finalRecommendedTotal)} as the recommended total facility limit.`);
  if (!input.bankConnected) mitigations.push("Request connected bank feeds or last 90 days daily balances to compute ADB and volatility.");
  if (!input.accountingConnected) mitigations.push("Request connected accounting or uploaded AP aging to verify overdue AP and debt.");
  if (!input.ecommerceConnected) mitigations.push("Request connected e-commerce sales history to cross-check revenue.");
  if (input.grossMargin !== null && input.grossMargin >= 30) mitigations.push("Margin profile appears supportive, subject to accounting verification.");
  if (input.adb === null || !input.directDebitMandate) mitigations.push("Do not disburse until ADB and direct debit readiness are verified.");
  return mitigations;
}

function buildNextActions(missingFields: string[], directDebitMandate: boolean) {
  if (!missingFields.length) {
    return [
      "Generate approval memo and facility terms.",
      "Prepare import and inventory finance allocation schedule.",
      directDebitMandate ? "Confirm direct debit mandate remains active before disbursement." : "Activate direct debit mandate before disbursement.",
      "Begin weekly monitoring of ADB, AP aging, inventory levels, and repayment performance."
    ];
  }

  return [
    `Request: ${missingFields.filter((field) => !field.startsWith("Connected ")).join(", ")}.`,
    "Connect bank accounts or upload 90 days daily balances to compute ADB, min balance, and volatility.",
    "Connect accounting or upload financials, AP aging, and debt schedules.",
    "Verify direct debit mandate activation before any disbursement.",
    "Confirm channel mix, suppliers, and import regions during the meeting checkpoint."
  ];
}

function calculateImpact(recommendedTotal: number | null, grossMargin: number | null, cashCycleMonths: number) {
  if (recommendedTotal === null || grossMargin === null || grossMargin >= 100) {
    return {
      utilization: 100,
      grossMargin,
      cashCycleMonths,
      salesPerCycle: null,
      turnsPerYear: null,
      incrementalAnnualSales: null,
      incrementalAnnualGrossProfit: null,
      note: "Impact model requires a final recommended limit and verified gross margin."
    };
  }

  const gm = grossMargin / 100;
  const salesPerCycle = recommendedTotal / (1 - gm);
  const turnsPerYear = 12 / cashCycleMonths;
  const incrementalAnnualSales = salesPerCycle * turnsPerYear;
  const incrementalAnnualGrossProfit = incrementalAnnualSales * gm;

  return {
    utilization: 100,
    grossMargin,
    cashCycleMonths,
    salesPerCycle,
    turnsPerYear,
    incrementalAnnualSales,
    incrementalAnnualGrossProfit,
    note: "Assumes 100% utilization, stable gross margin, and a 4-month cash cycle."
  };
}

function deriveCompanyName(result: WebPullResult) {
  const firstTitle = result.sources.find((source) => source.title)?.title ?? "";
  if (!firstTitle) return "Unknown company";
  return firstTitle.replace(/\s*-\s*Wikipedia$/i, "").trim();
}

function formatCurrency(value: number | null) {
  return value === null ? "n/a" : `$${Math.round(value).toLocaleString()}`;
}
