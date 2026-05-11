import { NextResponse } from "next/server";
import type { ExtractedMetric, WebPullResult } from "@/lib/web-data";

type PullPayload = {
  urls?: string[];
};

type PageRecord = {
  url: string;
  title: string;
  status: number;
  ok: boolean;
  text: string;
  error?: string;
};

const MAX_URLS = 3;
const MAX_TEXT_PER_SOURCE = 32000;
const DEVELOPED_MARKETS = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "New Zealand",
  "Singapore",
  "Hong Kong",
  "Germany",
  "France",
  "Netherlands",
  "Belgium",
  "Switzerland",
  "Italy",
  "Spain",
  "Portugal",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland"
];

export async function POST(request: Request) {
  let payload: PullPayload;

  try {
    payload = (await request.json()) as PullPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const urls = (payload.urls ?? [])
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, MAX_URLS);

  if (!urls.length) {
    return NextResponse.json({ error: "Provide at least one public webpage URL." }, { status: 400 });
  }

  const invalid = urls.find((url) => !isHttpUrl(url));
  if (invalid) {
    return NextResponse.json({ error: `Unsupported URL: ${invalid}` }, { status: 400 });
  }

  const pages = await Promise.all(urls.map(fetchPage));
  const successfulPages = pages.filter((page) => page.ok && page.text.length > 0);

  if (!successfulPages.length) {
    return NextResponse.json({
      pulledAt: new Date().toISOString(),
      provider: "regex",
      sources: pages.map(stripPageText),
      metrics: {},
      dataCoverage: undefined,
      notes: buildSourceNotes(pages, ["No readable public page text could be pulled from the submitted URLs."])
    } satisfies WebPullResult);
  }

  const fallback = extractWithRegex(successfulPages);
  const groq = await extractWithGroq(successfulPages, fallback);

  return NextResponse.json({
    pulledAt: new Date().toISOString(),
    provider: groq ? "groq" : "regex",
    sources: pages.map(stripPageText),
    metrics: groq?.metrics ?? fallback.metrics,
    dataCoverage: fallback.dataCoverage,
    notes: buildSourceNotes(pages, groq?.notes ?? fallback.notes)
  } satisfies WebPullResult);
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function fetchPage(url: string): Promise<PageRecord> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "OceanX-AI-Underwriting-Agent/0.1 contact=demo@oceanx.ai",
        Accept: "text/html,application/xhtml+xml,application/json,text/plain;q=0.9,*/*;q=0.8"
      },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(12000)
    });
    const raw = await response.text();
    const text = normalizeText(raw).slice(0, MAX_TEXT_PER_SOURCE);
    return {
      url,
      title: extractTitle(raw),
      status: response.status,
      ok: response.ok,
      text
    };
  } catch (error) {
    return {
      url,
      title: "",
      status: 0,
      ok: false,
      text: "",
      error: error instanceof Error ? error.message : "Unable to fetch URL"
    };
  }
}

function stripPageText(page: PageRecord) {
  return {
    url: page.url,
    title: page.title,
    status: page.status,
    ok: page.ok,
    error: page.error
  };
}

function normalizeText(raw: string) {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/&#x([0-9a-f]+);/gi, (_, value: string) => String.fromCharCode(parseInt(value, 16)))
    .replace(/&#(\d+);/g, (_, value: string) => String.fromCharCode(Number(value)))
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(raw: string) {
  const match = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? normalizeText(match[1]).slice(0, 120) : "";
}

function extractWithRegex(pages: PageRecord[]): Omit<WebPullResult, "pulledAt" | "provider" | "sources"> {
  const joined = pages.map((page) => `${page.url}\n${page.text}`).join("\n\n");
  const metrics: WebPullResult["metrics"] = {};

  const revenue = extractMoney(joined, /(annual revenue|revenue|net sales|sales)[^$€£0-9]{0,80}([$€£]?\s?[\d,.]+)\s?(billion|million|bn|m|k)?/i);
  if (revenue) metrics.revenue = metric(revenue.value, "medium", revenue.evidence, findSource(pages, revenue.evidence));

  const grossMargin = extractPercent(joined, /(gross margin|gross profit margin)[^0-9%]{0,80}(\d{1,2}(?:\.\d+)?)\s?%/i);
  if (grossMargin) metrics.grossMargin = metric(grossMargin.value, "medium", grossMargin.evidence, findSource(pages, grossMargin.evidence));

  const debtRatio = extractPercent(joined, /(debt ratio|debt to revenue|debt\/revenue)[^0-9%]{0,80}(\d{1,2}(?:\.\d+)?)\s?%/i);
  if (debtRatio) metrics.debtRatio = metric(debtRatio.value, "low", debtRatio.evidence, findSource(pages, debtRatio.evidence));

  const runway = extractNumber(joined, /(cash runway|runway)[^0-9]{0,80}(\d{1,2}(?:\.\d+)?)\s?(months|month|mo)/i);
  if (runway) metrics.cashRunwayMonths = metric(runway.value, "low", runway.evidence, findSource(pages, runway.evidence));

  const adb = extractMoney(joined, /(average daily balance|adb)[^$€£0-9]{0,80}([$€£]?\s?[\d,.]+)\s?(billion|million|bn|m|k)?/i);
  if (adb) metrics.adb = metric(adb.value, "low", adb.evidence, findSource(pages, adb.evidence));

  const cashInBank = extractMoney(joined, /(cash in bank|cash and equivalents|cash balance|cash & equivalents)[^$€£0-9]{0,80}([$€£]?\s?[\d,.]+)\s?(billion|million|bn|m|k)?/i);
  if (cashInBank) metrics.cashInBank = metric(cashInBank.value, "low", cashInBank.evidence, findSource(pages, cashInBank.evidence));

  const minDailyBalance = extractMoney(joined, /(minimum daily balance|min daily balance)[^$€£0-9]{0,80}([$€£]?\s?[\d,.]+)\s?(billion|million|bn|m|k)?/i);
  if (minDailyBalance) metrics.minDailyBalance = metric(minDailyBalance.value, "low", minDailyBalance.evidence, findSource(pages, minDailyBalance.evidence));

  const avgMonthlyInflow = extractMoney(joined, /(average monthly inflow|monthly inflow)[^$€£0-9]{0,80}([$€£]?\s?[\d,.]+)\s?(billion|million|bn|m|k)?/i);
  if (avgMonthlyInflow) metrics.avgMonthlyInflow = metric(avgMonthlyInflow.value, "low", avgMonthlyInflow.evidence, findSource(pages, avgMonthlyInflow.evidence));

  const avgMonthlyOutflow = extractMoney(joined, /(average monthly outflow|monthly outflow)[^$€£0-9]{0,80}([$€£]?\s?[\d,.]+)\s?(billion|million|bn|m|k)?/i);
  if (avgMonthlyOutflow) metrics.avgMonthlyOutflow = metric(avgMonthlyOutflow.value, "low", avgMonthlyOutflow.evidence, findSource(pages, avgMonthlyOutflow.evidence));

  const overdueAp = extractPercent(joined, /(overdue ap|aged payables|accounts payable overdue)[^0-9%]{0,80}(\d{1,2}(?:\.\d+)?)\s?%/i);
  if (overdueAp) metrics.overdueAp = metric(overdueAp.value, "low", overdueAp.evidence, findSource(pages, overdueAp.evidence));

  const inventoryOnHand = extractMoney(joined, /(inventory on hand|inventory balance|stock on hand)[^$€£0-9]{0,80}([$€£]?\s?[\d,.]+)\s?(billion|million|bn|m|k)?/i);
  if (inventoryOnHand) metrics.inventoryOnHand = metric(inventoryOnHand.value, "low", inventoryOnHand.evidence, findSource(pages, inventoryOnHand.evidence));

  const foundedYear = extractNumber(joined, /(founded|established|since)[^0-9]{0,30}(19\d{2}|20\d{2})/i);
  if (foundedYear) {
    const currentYear = new Date().getFullYear();
    metrics.tenureYears = metric(Math.max(0, currentYear - foundedYear.value), "medium", foundedYear.evidence, findSource(pages, foundedYear.evidence));
  }

  const country = inferCountry(joined);
  if (country) metrics.country = metric(country, "low", country, findSource(pages, country));

  const industry = inferIndustry(joined);
  if (industry) metrics.industry = metric(industry, "low", industry, findSource(pages, industry));

  const physicalGoodsPattern = /(import|imports|supplier|factory|inventory|warehouse|shipment|purchase order|physical goods|footwear|apparel|clothing|consumer product|products)/i;
  const importsPhysicalGoods = physicalGoodsPattern.test(joined);
  if (importsPhysicalGoods) {
    const evidence = snippet(joined, physicalGoodsPattern);
    metrics.importsPhysicalGoods = metric(true, "low", evidence, findSource(pages, evidence));
  }

  const dataCoverage = extractDataCoverage(joined);

  return {
    metrics,
    dataCoverage,
    notes: dataCoverage?.verifiedConnectedPacket
      ? [
          "Sandbox connected packet detected; this source simulates connected bank, accounting, and e-commerce evidence for the demo.",
          "Use public company pages for public-source stress tests; use this packet for a complete policy decision walkthrough."
        ]
      : [
          "Regex extraction is evidence-based but conservative; review pulled values before relying on them.",
          "Private bank, accounting, and e-commerce records still require authenticated integrations."
        ]
  };
}

async function extractWithGroq(
  pages: PageRecord[],
  fallback: Omit<WebPullResult, "pulledAt" | "provider" | "sources">
): Promise<Pick<WebPullResult, "metrics" | "notes"> | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Extract underwriting metrics from public webpage text. Return only JSON with keys metrics and notes. Each metric value must include value, confidence, evidence, sourceUrl. If a field is not explicitly supported by page evidence, omit it."
          },
          {
            role: "user",
            content: JSON.stringify({
              schema: {
                metrics: {
                  revenue: "number USD annual revenue",
                  grossMargin: "number percent",
                  debtRatio: "number percent",
                  adb: "number USD average daily bank balance",
                  cashInBank: "number USD cash in bank",
                  minDailyBalance: "number USD minimum daily balance",
                  avgMonthlyInflow: "number USD average monthly inflow",
                  avgMonthlyOutflow: "number USD average monthly outflow",
                  cashRunwayMonths: "number months",
                  overdueAp: "number percent",
                  inventoryOnHand: "number USD inventory on hand",
                  tenureYears: "number years",
                  country: "string",
                  industry: "string",
                  importsPhysicalGoods: "boolean"
                },
                notes: ["string"]
              },
              pages: pages.map((page) => ({
                url: page.url,
                title: page.title,
                text: page.text.slice(0, 18000)
              }))
            })
          }
        ]
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as Pick<WebPullResult, "metrics" | "notes">;
    return {
      metrics: sanitizeGroqMetrics(parsed.metrics ?? {}, pages, fallback.metrics),
      notes: parsed.notes?.length ? parsed.notes : fallback.notes
    };
  } catch {
    return null;
  }
}

function sanitizeGroqMetrics(
  metrics: WebPullResult["metrics"],
  pages: PageRecord[],
  fallback: WebPullResult["metrics"]
) {
  const sanitized: WebPullResult["metrics"] = { ...fallback };

  for (const key of Object.keys(metrics) as Array<keyof WebPullResult["metrics"]>) {
    const item = metrics[key] as ExtractedMetric<unknown> | undefined;
    if (!item || item.value === undefined || !item.evidence) continue;
    const sourceUrl = pages.some((page) => page.url === item.sourceUrl) ? item.sourceUrl : findSource(pages, item.evidence);
    sanitized[key] = {
      ...item,
      confidence: item.confidence === "high" || item.confidence === "medium" ? item.confidence : "low",
      sourceUrl
    } as never;
  }

  return sanitized;
}

function metric<T>(value: T, confidence: "high" | "medium" | "low", evidence: string, sourceUrl: string): ExtractedMetric<T> {
  return { value, confidence, evidence: evidence.slice(0, 220), sourceUrl };
}

function extractMoney(text: string, regex: RegExp) {
  const match = text.match(regex);
  if (!match) return null;
  const amount = Number(match[2].replace(/[$€£,\s]/g, ""));
  if (!Number.isFinite(amount)) return null;
  let unit: string | undefined = match[3]?.toLowerCase();
  const charAfterUnit = match.index === undefined ? "" : text[match.index + match[0].length] ?? "";
  if (unit && /^[bmk]$/.test(unit) && /[a-z]/i.test(charAfterUnit)) {
    unit = undefined;
  }
  const hasCurrency = /[$â‚¬Â£]/.test(match[0]);
  const hasUnit = Boolean(unit);
  if (!hasCurrency && !hasUnit && amount >= 1900 && amount <= 2100) return null;
  if (!hasCurrency && !hasUnit && amount < 100000) return null;
  const multiplier = unit?.startsWith("b") ? 1000000000 : unit?.startsWith("m") ? 1000000 : unit?.startsWith("k") ? 1000 : 1;
  return { value: Math.round(amount * multiplier), evidence: snippet(text, regex) };
}

function extractPercent(text: string, regex: RegExp) {
  const match = text.match(regex);
  if (!match) return null;
  const value = Number(match[2]);
  if (!Number.isFinite(value)) return null;
  return { value, evidence: snippet(text, regex) };
}

function extractNumber(text: string, regex: RegExp) {
  const match = text.match(regex);
  if (!match) return null;
  const value = Number(match[2]);
  if (!Number.isFinite(value)) return null;
  return { value, evidence: snippet(text, regex) };
}

function snippet(text: string, regex: RegExp) {
  const match = regex.exec(text);
  if (!match || match.index === undefined) return "";
  const start = Math.max(0, match.index - 70);
  const end = Math.min(text.length, match.index + match[0].length + 70);
  return text.slice(start, end).trim();
}

function findSource(pages: PageRecord[], evidence: string) {
  const source = pages.find((page) => evidence && page.text.includes(evidence.slice(0, 50)));
  return source?.url ?? pages[0]?.url ?? "";
}

function extractDataCoverage(text: string): WebPullResult["dataCoverage"] {
  const verifiedConnectedPacket = /verified connected data packet|connected underwriting packet|sandbox connected source/i.test(text);

  return {
    bankConnected: verifiedConnectedPacket || /\bbank connected[^a-z0-9]{0,20}yes\b/i.test(text),
    accountingConnected: verifiedConnectedPacket || /\baccounting connected[^a-z0-9]{0,20}yes\b/i.test(text),
    ecommerceConnected: verifiedConnectedPacket || /\be-?commerce connected[^a-z0-9]{0,20}yes\b/i.test(text),
    uploadsReceived: text.match(/\buploads received[^a-z0-9]{0,20}([^.]+)/i)?.[1]?.trim(),
    meetingNotes: verifiedConnectedPacket || /\bmeeting notes[^a-z0-9]{0,20}yes\b/i.test(text),
    directDebitMandate: verifiedConnectedPacket || /\bdirect debit mandate[^a-z0-9]{0,20}(active|yes)\b/i.test(text),
    verifiedConnectedPacket
  };
}

function inferIndustry(text: string) {
  const checks = [
    ["Apparel", /(apparel|fashion|clothing|garment|footwear)/i],
    ["Electronics", /(electronics|hardware|components|devices|semiconductor)/i],
    ["Furniture", /(furniture|home furnishing|home goods|decor)/i],
    ["Consumer Goods", /(consumer goods|retail|skincare|beauty|household)/i]
  ] as const;
  return checks.find(([, regex]) => regex.test(text))?.[0];
}

function inferCountry(text: string) {
  const headquartersSlice =
    text.match(/(headquarters|location|head office|based in)[^.]{0,220}/i)?.[0] ??
    text.match(/(company type|industry|founded|founder|headquarters)[^|]{0,500}/i)?.[0] ??
    text;
  const explicit = DEVELOPED_MARKETS.find((market) => new RegExp(`\\b${escapeRegExp(market)}\\b`, "i").test(headquartersSlice));
  if (explicit) return explicit;
  if (/\b(California|New York|Colorado|Massachusetts|Oregon|Texas|Washington)\b/i.test(headquartersSlice)) return "United States";
  return DEVELOPED_MARKETS.find((market) => new RegExp(`\\b${escapeRegExp(market)}\\b`, "i").test(text));
}

function buildSourceNotes(pages: PageRecord[], baseNotes: string[]) {
  const notes = [...baseNotes];
  for (const page of pages) {
    if (page.ok) continue;
    if (page.status === 403) notes.push(`${page.url} blocked server-side access with 403.`);
    else if (page.error?.toLowerCase().includes("timed out")) notes.push(`${page.url} timed out before readable text was returned.`);
    else if (page.error) notes.push(`${page.url} failed: ${page.error}`);
  }
  return notes;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
