"use client";

import { type FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Building2,
  CheckCircle2,
  ClipboardList,
  DatabaseZap,
  ExternalLink,
  FileSearch,
  FileSignature,
  FileText,
  Globe2,
  Landmark,
  Link,
  ListChecks,
  Radar,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
  XCircle,
  Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateLiveUnderwriting, type LiveUnderwritingDecision } from "@/lib/live-underwriting";
import { currency, percent } from "@/lib/utils";
import type { WebPullResult } from "@/lib/web-data";

const SAMPLE_CASES = [
  {
    label: "Verified Packet",
    urls: ["/demo-source/northstar-outfitters"]
  },
  {
    label: "Incomplete Case",
    urls: ["/demo-source/global-logistics-group"]
  },
  {
    label: "Allbirds",
    urls: ["https://en.wikipedia.org/wiki/Allbirds"]
  },
  {
    label: "GoPro",
    urls: ["https://en.wikipedia.org/wiki/GoPro"]
  },
  {
    label: "Crocs",
    urls: ["https://en.wikipedia.org/wiki/Crocs"]
  }
];

export function LiveUnderwritingAgent() {
  const [urls, setUrls] = useState("");
  const [result, setResult] = useState<WebPullResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [contract, setContract] = useState<string | null>(null);
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);
  const decision = useMemo(() => calculateLiveUnderwriting(result), [result]);
  const metrics = result ? Object.entries(result.metrics) : [];

  async function runPull(urlsToPull: string[]) {
    if (!urlsToPull.length) {
      setError("Paste at least one public source URL.");
      return;
    }

    setError(null);
    setIsPulling(true);

    try {
      const response = await fetch("/api/data-pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: urlsToPull })
      });
      const raw = await response.text();
      const data = parseJson(raw);
      if (!response.ok) throw new Error(data?.error ?? `Data pull failed with status ${response.status}.`);
      setResult(data as WebPullResult);
    } catch (pullError) {
      setError(pullError instanceof Error ? pullError.message : "Unable to pull live data.");
    } finally {
      setIsPulling(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedUrls = urls
      .split(/\n|,/)
      .map((url) => url.trim())
      .filter(Boolean);

    await runPull(parsedUrls);
  }

  function clearCase() {
    setUrls("");
    setResult(null);
    setError(null);
    setContract(null);
    setContractError(null);
  }

  async function handleGenerateContract() {
    setContractError(null);
    setIsGeneratingContract(true);
    try {
      const response = await fetch("/api/generate-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(decision)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate contract.");
      setContract(data.contract);
    } catch (err) {
      setContractError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsGeneratingContract(false);
    }
  }

  function loadSample(urlsToLoad: string[]) {
    setUrls(urlsToLoad.join("\n"));
    setError(null);
  }

  async function runSample(urlsToLoad: string[]) {
    const absoluteUrls = urlsToLoad.map(toAbsoluteUrl);
    loadSample(absoluteUrls);
    await runPull(absoluteUrls);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.14),transparent_32%),linear-gradient(180deg,#071018,#0a0d16_45%,#06080d)]">
      <div className="grid-mask pointer-events-none fixed inset-0 opacity-60" />
      <section className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-300 text-slate-950 shadow-glow">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">OceanX AI</p>
                <p className="text-xs text-muted-foreground">Live Underwriting Agent</p>
              </div>
            </div>
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-cyan-200">
              <BrainCircuit className="h-4 w-4" />
              Pulls financial data, scores risk, suggests credit limit
            </div>
            <h1 className="max-w-4xl text-balance text-3xl font-semibold tracking-normal text-white md:text-5xl">
              Real-time public-source trade underwriting
            </h1>
          </div>
          <Badge variant={result ? "good" : "secondary"}>{result ? "Live data pulled" : "Awaiting source"}</Badge>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]"
        >
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-cyan-300" />
                Source Pull
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block text-sm text-muted-foreground">
                  Public URLs
                  <textarea
                    value={urls}
                    onChange={(event) => setUrls(event.target.value)}
                    placeholder="Paste public company, sandbox packet, annual report, investor, filing, or financial profile URLs. One URL per line."
                    className="mt-2 min-h-36 w-full resize-none rounded-md border border-white/10 bg-slate-950/70 p-3 text-sm text-white outline-none ring-cyan-300/0 transition placeholder:text-slate-500 focus:ring-2"
                  />
                </label>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">One-click samples</p>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_CASES.map((sample) => (
                      <Button
                        key={sample.label}
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isPulling}
                        onClick={() => void runSample(sample.urls)}
                      >
                        {isPulling ? "Pulling..." : sample.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={isPulling}>
                    <DatabaseZap className="mr-2 h-4 w-4" />
                    {isPulling ? "Pulling live data" : "Pull live data"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={clearCase}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                </div>
                {error ? (
                  <div className="rounded-md border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">
                    {error}
                  </div>
                ) : null}
                <div className="rounded-md border border-cyan-300/15 bg-cyan-300/8 p-3">
                  <p className="text-xs leading-5 text-muted-foreground">
                    Paste website URLs only. If copied page text is pasted instead of a URL, the agent cannot pull anything.
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    This agent uses real-time webpage pulls. Public sources are handled conservatively; sandbox connected packets can demonstrate bank, accounting, and e-commerce coverage.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          <DecisionPanel decision={decision} result={result} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06 }}
          className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]"
        >
          <CustomerSummaryPanel decision={decision} />
          <DataCoveragePanel decision={decision} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]"
        >
          <EvidencePanel result={result} metrics={metrics} />
          <ChecksPanel decision={decision} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18 }}
          className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]"
        >
          <KeyMetricsPanel decision={decision} />
          <CreditLimitPanel decision={decision} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.24 }}
          className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]"
        >
          <RepaymentFitPanel decision={decision} />
          <ImpactPanel decision={decision} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
          className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]"
        >
          <RiskAndMitigationPanel decision={decision} />
          <NextActionsPanel decision={decision} />
        </motion.div>

        {contract ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.36 }}
            className="mt-5"
          >
            <ContractPanel contract={contract} decision={decision} />
          </motion.div>
        ) : (decision.status !== "AWAITING DATA") ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.36 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 pb-10"
          >
            <Button 
              onClick={handleGenerateContract} 
              disabled={isGeneratingContract} 
              className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold shadow-glow transition-all duration-300"
            >
              {isGeneratingContract ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Structuring Contract...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-5 w-5" />
                  Generate Legal Contract
                </>
              )}
            </Button>
            {contractError && <p className="text-sm text-rose-300 bg-rose-400/10 border border-rose-400/20 px-3 py-1.5 rounded-md mt-2">{contractError}</p>}
          </motion.div>
        ) : null}
      </section>
    </main>
  );
}

function DecisionPanel({ decision, result }: { decision: LiveUnderwritingDecision; result: WebPullResult | null }) {
  const successfulSources = result?.sources.filter((source) => source.ok).length ?? 0;

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radar className="h-5 w-5 text-cyan-300" />
          Underwriting Decision
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-4">
          <MiniStat label="Decision" value={decision.status} badgeVariant={decisionVariant(decision.status)} />
          <MiniStat label="Basic qualification" value={decision.basicQualification} badgeVariant={qualificationVariant(decision.basicQualification)} />
          <MiniStat label="Deep qualification" value={decision.deepQualification} badgeVariant={qualificationVariant(decision.deepQualification)} />
          <MiniStat label="Confidence" value={result ? `${decision.confidenceScore}/100` : "-"} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <MiniStat label="Risk score" value={result ? `${decision.riskScore}/100` : "-"} />
          <MiniStat label="Coverage confidence" value={decision.dataCoverage.confidence} badgeVariant={confidenceVariant(decision.dataCoverage.confidence)} />
        </div>
        {result ? (
          <div className="mt-4 rounded-md border border-emerald-300/15 bg-emerald-300/10 p-3 text-sm text-emerald-100">
            Live pull completed from {successfulSources} successful source{successfulSources === 1 ? "" : "s"}.
          </div>
        ) : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <MiniStat
            label="Method A: 10 x ADB"
            value={decision.creditLimits.methodA.limit !== null ? currency(decision.creditLimits.methodA.limit, false) : "Missing ADB"}
          />
          <MiniStat
            label="Method B: total 20% revenue cap"
            value={decision.creditLimits.methodB.totalCap !== null ? currency(decision.creditLimits.methodB.totalCap, false) : "Missing revenue"}
          />
          <MiniStat
            label="Recommended total"
            value={decision.creditLimits.recommended.total !== null ? currency(decision.creditLimits.recommended.total, false) : "Not available"}
          />
        </div>
        <div className="mt-4 space-y-3">
          {decision.reasoning.map((item) => (
            <div key={item} className="flex gap-3 rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-muted-foreground">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        {decision.missingFields.length ? (
          <div className="mt-4 rounded-md border border-amber-300/20 bg-amber-300/10 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-200">
              <AlertTriangle className="h-4 w-4" />
              Missing verification
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{decision.missingFields.join(", ")}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function CustomerSummaryPanel({ decision }: { decision: LiveUnderwritingDecision }) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-cyan-300" />
          Customer Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGrid
          items={[
            ["Company", decision.customerSummary.company],
            ["Country", decision.customerSummary.country],
            ["Tenure", decision.customerSummary.tenure],
            ["Business model", decision.customerSummary.businessModel],
            ["Channels", decision.customerSummary.channels],
            ["Import regions / suppliers", decision.customerSummary.importRegions]
          ]}
        />
      </CardContent>
    </Card>
  );
}

function DataCoveragePanel({ decision }: { decision: LiveUnderwritingDecision }) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-cyan-300" />
          Data Coverage & Confidence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniStat label="Bank connected" value={decision.dataCoverage.bankConnected} />
          <MiniStat label="Accounting connected" value={decision.dataCoverage.accountingConnected} />
          <MiniStat label="E-commerce connected" value={decision.dataCoverage.ecommerceConnected} />
          <MiniStat label="Uploads received" value={decision.dataCoverage.uploadsReceived} />
          <MiniStat label="Meeting notes" value={decision.dataCoverage.meetingNotes} />
          <MiniStat label="Confidence" value={decision.dataCoverage.confidence} badgeVariant={confidenceVariant(decision.dataCoverage.confidence)} />
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-muted-foreground">
          {decision.dataCoverage.rationale}
        </div>
        <div className="rounded-md border border-cyan-300/15 bg-cyan-300/8 p-3">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">Trust hierarchy</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Connected bank {">"} connected accounting {">"} connected e-commerce {">"} uploaded documents {">"} meeting notes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function EvidencePanel({
  result,
  metrics
}: {
  result: WebPullResult | null;
  metrics: Array<[string, NonNullable<WebPullResult["metrics"][keyof WebPullResult["metrics"]]> | undefined]>;
}) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSearch className="h-5 w-5 text-cyan-300" />
          Pulled Evidence
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!result ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniStat label="Extractor" value={result.provider === "groq" ? "Groq" : "Regex"} />
              <MiniStat label="Sources" value={result.sources.length.toString()} />
              <MiniStat label="Fields found" value={metrics.length.toString()} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {result.sources.map((source) => (
                <div key={source.url} className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <Badge variant={source.ok ? "good" : "danger"}>{source.ok ? "Fetched" : "Failed"}</Badge>
                    <span className="text-xs text-muted-foreground">{source.status || "n/a"}</span>
                  </div>
                  <p className="line-clamp-1 text-xs font-medium text-white">{source.title || source.url}</p>
                  <a href={source.url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1 text-xs text-cyan-200">
                    <ExternalLink className="h-3 w-3" />
                    Open source
                  </a>
                  {source.error ? <p className="mt-2 text-xs leading-5 text-rose-300">{source.error}</p> : null}
                </div>
              ))}
            </div>
            {result.notes.length ? (
              <div className="rounded-md border border-amber-300/20 bg-amber-300/10 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-200">
                  <AlertTriangle className="h-4 w-4" />
                  Pull notes
                </div>
                <div className="space-y-2">
                  {result.notes.map((note) => (
                    <p key={note} className="text-xs leading-5 text-muted-foreground">
                      {note}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="max-h-96 space-y-2 overflow-auto pr-1">
              {metrics.length ? (
                metrics.map(([key, item]) =>
                  item ? (
                    <div key={key} className="rounded-md border border-white/10 bg-slate-950/35 p-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-sm font-medium capitalize text-white">{key.replace(/([A-Z])/g, " $1")}</p>
                        <Badge variant={item.confidence === "high" ? "good" : item.confidence === "medium" ? "default" : "secondary"}>
                          {item.confidence}
                        </Badge>
                      </div>
                      <p className="text-sm text-cyan-100">{formatPulledValue(key, item.value)}</p>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.evidence}</p>
                    </div>
                  ) : null
                )
              ) : (
                <div className="rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-muted-foreground">
                  The source was fetched, but no explicit underwriting metrics were found.
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChecksPanel({ decision }: { decision: LiveUnderwritingDecision }) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-cyan-300" />
          Eligibility
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <MiniStat label="Basic qualification" value={decision.basicQualification} badgeVariant={qualificationVariant(decision.basicQualification)} />
          <MiniStat label="Deep qualification" value={decision.deepQualification} badgeVariant={qualificationVariant(decision.deepQualification)} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <CheckGroup title="Basic qualification" checks={decision.basicChecks} />
          <CheckGroup title="Deep qualification" checks={decision.deepChecks} />
        </div>
      </CardContent>
    </Card>
  );
}

function KeyMetricsPanel({ decision }: { decision: LiveUnderwritingDecision }) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-cyan-300" />
          Key Metrics Snapshot
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGrid
          items={[
            ["Revenue (TTM)", formatMoney(decision.keyMetrics.revenue)],
            ["Gross margin", formatPercent(decision.keyMetrics.grossMargin)],
            ["Cash in bank (latest)", formatMoney(decision.keyMetrics.cashInBank)],
            ["ADB (last 90d)", formatMoney(decision.keyMetrics.adb)],
            ["Min daily balance (90d)", formatMoney(decision.keyMetrics.minDailyBalance)],
            ["Monthly inflow/outflow", decision.keyMetrics.monthlyInflowOutflow],
            ["Debt (interest-bearing)", formatMoney(decision.keyMetrics.debt)],
            ["Inventory on hand", formatMoney(decision.keyMetrics.inventoryOnHand)],
            ["AR/AP + aging", decision.keyMetrics.overdueAp !== null ? `Overdue AP ${percent(decision.keyMetrics.overdueAp)}` : "Missing"]
          ]}
        />
      </CardContent>
    </Card>
  );
}

function CreditLimitPanel({ decision }: { decision: LiveUnderwritingDecision }) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WalletCards className="h-5 w-5 text-cyan-300" />
          Credit Limit Calculation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormulaCard
          title="Method A (Liquidity-based)"
          items={[
            ["ADB (90d)", formatMoney(decision.creditLimits.methodA.adb)],
            ["Base limit", decision.creditLimits.methodA.baseLimit !== null ? `10 x ADB = ${formatMoney(decision.creditLimits.methodA.baseLimit)}` : "Missing ADB"],
            ["Method A limit", formatMoney(decision.creditLimits.methodA.limit)]
          ]}
        />
        <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
          <p className="text-sm font-medium text-white">Adjustments</p>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
            {decision.creditLimits.methodA.adjustments.map((item) => (
              <li key={item} className="flex gap-2">
                <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-cyan-300" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <FormulaCard
          title="Method B (Revenue caps)"
          items={[
            ["Import cap (10% rev)", formatMoney(decision.creditLimits.methodB.importCap)],
            ["Inventory cap (10% rev)", formatMoney(decision.creditLimits.methodB.inventoryCap)],
            ["Total cap (20% rev)", formatMoney(decision.creditLimits.methodB.totalCap)]
          ]}
        />
        <FormulaCard
          title="Recommended limits"
          items={[
            ["Import Finance", formatMoney(decision.creditLimits.recommended.importFinance)],
            ["Inventory Finance", formatMoney(decision.creditLimits.recommended.inventoryFinance)],
            ["Total", formatMoney(decision.creditLimits.recommended.total)]
          ]}
        />
        <div className="rounded-md border border-cyan-300/15 bg-cyan-300/8 p-3 text-sm leading-6 text-muted-foreground">
          {decision.creditLimits.recommended.note}
        </div>
      </CardContent>
    </Card>
  );
}

function RepaymentFitPanel({ decision }: { decision: LiveUnderwritingDecision }) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="h-5 w-5 text-cyan-300" />
          Repayment Fit
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGrid
          items={[
            ["Assumed cash cycle", `${decision.repaymentFit.assumedCashCycleMonths} months`],
            ["Term", `${decision.repaymentFit.termWeeks} weeks`],
            ["Weekly debit estimate", formatMoney(decision.repaymentFit.weeklyDebitEstimate)],
            ["Direct debit mandate", decision.repaymentFit.directDebitMandate]
          ]}
        />
        <div className="mt-4 rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-muted-foreground">
          {decision.repaymentFit.fitCommentary}
        </div>
      </CardContent>
    </Card>
  );
}

function ImpactPanel({ decision }: { decision: LiveUnderwritingDecision }) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-cyan-300" />
          Impact of Additional Capital
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGrid
          items={[
            ["Utilization", `${decision.impact.utilization}%`],
            ["Gross margin", formatPercent(decision.impact.grossMargin)],
            ["Cash cycle", `${decision.impact.cashCycleMonths} months`],
            ["Sales per cycle", formatMoney(decision.impact.salesPerCycle)],
            ["Turns per year", formatNumber(decision.impact.turnsPerYear)],
            ["Incremental annual sales", formatMoney(decision.impact.incrementalAnnualSales)],
            ["Incremental annual gross profit", formatMoney(decision.impact.incrementalAnnualGrossProfit)]
          ]}
        />
        <div className="mt-4 rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-muted-foreground">
          {decision.impact.note}
        </div>
      </CardContent>
    </Card>
  );
}

function RiskAndMitigationPanel({ decision }: { decision: LiveUnderwritingDecision }) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-cyan-300" />
          Risk Flags & Mitigations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ListCard title="Flags" items={decision.riskFlags} tone="danger" />
        <ListCard title="Mitigations / conditions" items={decision.mitigations} tone="good" />
      </CardContent>
    </Card>
  );
}

function NextActionsPanel({ decision }: { decision: LiveUnderwritingDecision }) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-cyan-300" />
          Next Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ListCard title="Data / docs to request" items={decision.nextActions} tone="default" />
        <div className="rounded-md border border-cyan-300/15 bg-cyan-300/8 p-3 text-sm leading-6 text-muted-foreground">
          Monitoring plan: review repayment performance weekly, re-check ADB and AP aging when connected data arrives, and do not disburse until direct debit readiness is verified.
        </div>
      </CardContent>
    </Card>
  );
}

function CheckGroup({
  title,
  checks
}: {
  title: string;
  checks: LiveUnderwritingDecision["basicChecks"];
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-white">{title}</p>
      {checks.length ? (
        checks.map((check) => (
          <div key={check.label} className="flex gap-3 rounded-md border border-white/10 bg-white/[0.03] p-3">
            {check.passed === true ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            ) : check.passed === false ? (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            )}
            <div>
              <p className="text-sm font-medium text-white">{check.label}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{check.detail}</p>
            </div>
          </div>
        ))
      ) : (
        <p className="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-muted-foreground">
          Pull live source data to run checks.
        </p>
      )}
    </div>
  );
}

function ListCard({
  title,
  items,
  tone
}: {
  title: string;
  items: string[];
  tone: "danger" | "good" | "default";
}) {
  const iconTone =
    tone === "danger" ? "text-rose-300" : tone === "good" ? "text-emerald-300" : "text-cyan-300";

  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
      <p className="text-sm font-medium text-white">{title}</p>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <ArrowRight className={`mt-1 h-3.5 w-3.5 shrink-0 ${iconTone}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FormulaCard({ title, items }: { title: string; items: Array<[string, string]> }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
      <p className="text-sm font-medium text-white">{title}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {items.map(([label, value]) => (
          <MiniStat key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
}

function FieldGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-md border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-sm leading-6 text-white">{value}</p>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-md border border-cyan-300/15 bg-cyan-300/8 p-4 text-sm leading-6 text-muted-foreground">
      <div className="mb-2 flex items-center gap-2 font-medium text-cyan-100">
        <Link className="h-4 w-4" />
        No source pulled yet
      </div>
      Paste public source URLs to start a real-time underwriting case.
      <ArrowRight className="mt-3 h-4 w-4 text-muted-foreground" />
    </div>
  );
}

function MiniStat({
  label,
  value,
  badgeVariant
}: {
  label: string;
  value: string;
  badgeVariant?: "default" | "secondary" | "good" | "warn" | "danger";
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1">
        {badgeVariant ? (
          <Badge variant={badgeVariant} className="w-fit">
            {value}
          </Badge>
        ) : (
          <p className="text-lg font-semibold text-white">{value}</p>
        )}
      </div>
    </div>
  );
}

function parseJson(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("The data-pull endpoint returned a non-JSON response. Restart the local dev server and try again.");
  }
}

function ContractPanel({ contract, decision }: { contract: string; decision: LiveUnderwritingDecision }) {
  const [sent, setSent] = useState(false);
  
  return (
    <Card className="glass-panel border-cyan-400/30 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 mb-4 gap-4 relative">
        <CardTitle className="flex items-center gap-2 text-cyan-300 text-xl">
          <FileSignature className="h-6 w-6" />
          Commercial Finance Agreement
        </CardTitle>
        <Badge variant="good" className="bg-cyan-400/10 text-cyan-200 border-cyan-400/30 font-medium tracking-wide">
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          Generated by Agent
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6 relative">
        <div className="bg-[#0b131a] border border-cyan-900/40 rounded-lg p-6 sm:p-8 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-200 font-serif shadow-inner mx-auto max-w-4xl">
          {contract}
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-white/10 gap-4 max-w-4xl mx-auto">
          <p className="text-sm text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Contract ready for borrower execution
          </p>
          <Button 
            onClick={() => setSent(true)} 
            disabled={sent}
            className={`font-semibold transition-all duration-300 ${sent ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 cursor-default hover:bg-emerald-500/20" : "bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-glow"}`}
          >
            {sent ? (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Sent to {decision.customerSummary.company}
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Send via DocuSign
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function formatPulledValue(key: string, value: string | number | boolean) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value;
  if (key === "revenue" || key === "adb") return currency(value, false);
  if (key === "cashInBank" || key === "minDailyBalance" || key === "avgMonthlyInflow" || key === "avgMonthlyOutflow" || key === "inventoryOnHand") return currency(value, false);
  if (key === "grossMargin" || key === "debtRatio" || key === "overdueAp") return percent(value);
  if (key === "cashRunwayMonths") return `${value} months`;
  if (key === "tenureYears") return `${value} years`;
  return value.toLocaleString();
}

function toAbsoluteUrl(url: string) {
  if (url.startsWith("/")) return `${window.location.origin}${url}`;
  return url;
}

function formatMoney(value: number | null) {
  return value === null ? "Missing" : currency(value, false);
}

function formatPercent(value: number | null) {
  return value === null ? "Missing" : percent(value);
}

function formatNumber(value: number | null) {
  return value === null ? "Missing" : value.toFixed(2);
}

function decisionVariant(status: LiveUnderwritingDecision["status"]) {
  switch (status) {
    case "APPROVE":
      return "good";
    case "APPROVE WITH CONDITIONS":
      return "warn";
    case "REQUEST INFO":
      return "secondary";
    case "REJECT":
      return "danger";
    default:
      return "secondary";
  }
}

function qualificationVariant(status: "PASS" | "FAIL" | "NEED INFO") {
  switch (status) {
    case "PASS":
      return "good";
    case "FAIL":
      return "danger";
    default:
      return "secondary";
  }
}

function confidenceVariant(level: "High" | "Medium" | "Low") {
  switch (level) {
    case "High":
      return "good";
    case "Medium":
      return "warn";
    default:
      return "secondary";
  }
}
