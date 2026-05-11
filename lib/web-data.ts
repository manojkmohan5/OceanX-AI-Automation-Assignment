export type ExtractedMetric<T> = {
  value: T;
  confidence: "high" | "medium" | "low";
  evidence: string;
  sourceUrl: string;
};

export type WebPullResult = {
  pulledAt: string;
  provider: "groq" | "regex";
  sources: Array<{
    url: string;
    title: string;
    status: number;
    ok: boolean;
    error?: string;
  }>;
  metrics: {
    revenue?: ExtractedMetric<number>;
    grossMargin?: ExtractedMetric<number>;
    debtRatio?: ExtractedMetric<number>;
    adb?: ExtractedMetric<number>;
    cashInBank?: ExtractedMetric<number>;
    minDailyBalance?: ExtractedMetric<number>;
    avgMonthlyInflow?: ExtractedMetric<number>;
    avgMonthlyOutflow?: ExtractedMetric<number>;
    cashRunwayMonths?: ExtractedMetric<number>;
    overdueAp?: ExtractedMetric<number>;
    inventoryOnHand?: ExtractedMetric<number>;
    tenureYears?: ExtractedMetric<number>;
    country?: ExtractedMetric<string>;
    industry?: ExtractedMetric<string>;
    importsPhysicalGoods?: ExtractedMetric<boolean>;
  };
  dataCoverage?: {
    bankConnected?: boolean;
    accountingConnected?: boolean;
    ecommerceConnected?: boolean;
    uploadsReceived?: string;
    meetingNotes?: boolean;
    directDebitMandate?: boolean;
    verifiedConnectedPacket?: boolean;
  };
  notes: string[];
};
