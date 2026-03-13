import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { Loader2, ChevronDown, ChevronRight, ExternalLink, RefreshCw, Play } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface CitationUrlRow {
  url_category: string;
  total_citations: string;
  total_unique_urls: string;
  chatgpt_citations: string;
  chatgpt_unique_urls: string;
  gemini_citations: string;
  gemini_unique_urls: string;
}

const CATEGORY_COLOR: Record<string, string> = {
  "Brand Homepage": "#60a5fa",
  "Brand Service Page": "#818cf8",
  "Brand Inner Page": "#a78bfa",
  "Brand About / Contact": "#c084fc",
  "Brand Blog / Article": "#e879f9",
  "Directory Listing": "#2dd4bf",
  "Review Platform": "#fbbf24",
  "Comparison Article": "#fb923c",
  "Government / Regulatory": "#38bdf8",
  "Community Thread": "#4ade80",
  "News / PR": "#fcd34d",
  "Market Research": "#34d399",
  "Jobs Listing": "#94a3b8",
  "Social Media Profile": "#f472b6",
  "Others (third-party)": "#d1d5db",
};

const CATEGORY_BADGE: Record<string, string> = {
  "Brand Homepage": "bg-blue-50 text-blue-700",
  "Brand Service Page": "bg-indigo-50 text-indigo-700",
  "Brand Inner Page": "bg-violet-50 text-violet-700",
  "Brand About / Contact": "bg-purple-50 text-purple-700",
  "Brand Blog / Article": "bg-fuchsia-50 text-fuchsia-700",
  "Directory Listing": "bg-teal-50 text-teal-700",
  "Review Platform": "bg-yellow-50 text-yellow-700",
  "Comparison Article": "bg-orange-50 text-orange-700",
  "Government / Regulatory": "bg-sky-50 text-sky-700",
  "Community Thread": "bg-green-50 text-green-700",
  "News / PR": "bg-amber-50 text-amber-700",
  "Market Research": "bg-emerald-50 text-emerald-700",
  "Jobs Listing": "bg-slate-50 text-slate-600",
  "Social Media Profile": "bg-pink-50 text-pink-700",
};

const BRAND_CATEGORIES = new Set([
  "Brand Homepage",
  "Brand Service Page",
  "Brand Inner Page",
  "Brand About / Contact",
  "Brand Blog / Article",
]);

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const total = payload[0].payload.total;
  const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : "0";
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm">
      <div className="font-semibold text-gray-800 mb-1">{d.name}</div>
      <div className="text-gray-500">
        <span className="font-bold text-gray-900">{d.value.toLocaleString()}</span> citations
        <span className="ml-2 text-xs text-gray-400">({pct}%)</span>
      </div>
    </div>
  );
}

function EnginePie({
  engine,
  data,
  label,
  accentColor,
}: {
  engine: string;
  data: Array<{ name: string; value: number; total: number }>;
  label: string;
  accentColor: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  const enriched = data.map((d) => ({ ...d, total }));

  if (total === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[320px]">
        <div className="text-gray-300 text-sm">No {label} citations for this segment</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-2 mb-3 px-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: accentColor }} />
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="ml-auto text-xs text-gray-400 font-medium">{total.toLocaleString()} citations (non-unique)</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={enriched}
            cx="50%"
            cy="50%"
            innerRadius={72}
            outerRadius={110}
            paddingAngle={2}
            dataKey="value"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            animationBegin={0}
            animationDuration={700}
          >
            {enriched.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={CATEGORY_COLOR[entry.name] || "#d1d5db"}
                opacity={activeIndex === null || activeIndex === index ? 1 : 0.45}
                stroke={activeIndex === index ? "#1f2937" : "transparent"}
                strokeWidth={activeIndex === index ? 1.5 : 0}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span className="text-xs text-gray-600">{value}</span>
            )}
            iconSize={8}
            iconType="circle"
            wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface AuthorityUrl {
  url: string;
  title: string;
  engine: string;
  segment: string;
  count: number;
}

interface AuthorityDomain {
  domain: string;
  url_category: string;
  total_citations: string;
  chatgpt_citations: string;
  gemini_citations: string;
  urls: AuthorityUrl[];
}

function formatSegmentLabel(s: string | null | undefined) {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function AuthoritySection({ sessionId }: { sessionId: number }) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  const params = new URLSearchParams({ sessionId: String(sessionId) });
  if (activeCategory !== "All") params.set("category", activeCategory);

  const { data, isLoading } = useQuery<{
    domains: AuthorityDomain[];
    categories: string[];
    sessionId: number;
  }>({
    queryKey: [`/api/citation-urls/authority?${params.toString()}`],
    staleTime: 30000,
    enabled: open,
  });

  const domains = data?.domains || [];
  const categories = ["All", ...(data?.categories || [])];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50/60 transition-colors"
        data-testid="authority-toggle"
      >
        <div>
          <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Authority Sources</span>
          <span className="text-xs text-gray-400 ml-3">Third-party domains ranked by total citation events</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="px-6 pb-4 border-b border-gray-100">
            <p className="text-xs text-gray-400 mb-3">Click a row to see cited URLs</p>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setExpandedDomain(null); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    activeCategory === cat
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700"
                  }`}
                  data-testid={`authority-cat-${cat}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
            </div>
          ) : domains.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">No data</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide w-8">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Domain</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-orange-500 uppercase tracking-wide">ChatGPT</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-blue-500 uppercase tracking-wide">Gemini</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wide">Total</th>
                  <th className="w-8" />
                </tr>
              </thead>
          <tbody>
            {domains.flatMap((d, i) => {
              const isExpanded = expandedDomain === d.domain;
              const deduped = Object.values(
                d.urls.reduce((acc: Record<string, AuthorityUrl & { engines: string[] }>, u) => {
                  const urlKey = u.url;
                  if (!acc[urlKey]) acc[urlKey] = { ...u, engines: [u.engine], count: u.count };
                  else { acc[urlKey].engines.push(u.engine); acc[urlKey].count += u.count; }
                  return acc;
                }, {})
              ).sort((a, b) => b.count - a.count);

              const mainRow = (
                <tr
                  key={d.domain}
                  className={`border-b border-gray-50 cursor-pointer transition-colors ${isExpanded ? "bg-gray-50" : "hover:bg-gray-50/60"}`}
                  onClick={() => setExpandedDomain(isExpanded ? null : d.domain)}
                  data-testid={`authority-row-${i}`}
                >
                  <td className="px-4 py-3 text-gray-400 text-xs font-medium">{i + 1}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-800">{d.domain}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${CATEGORY_BADGE[d.url_category] || "bg-gray-100 text-gray-600"}`}>
                      {d.url_category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-orange-600 font-medium">{parseInt(d.chatgpt_citations).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-blue-600 font-medium">{parseInt(d.gemini_citations).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">{parseInt(d.total_citations).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {isExpanded
                      ? <ChevronDown className="w-4 h-4" />
                      : <ChevronRight className="w-4 h-4" />}
                  </td>
                </tr>
              );

              if (!isExpanded) return [mainRow];

              const expandedRow = (
                <tr key={`${d.domain}-expanded`} className="border-b border-gray-100 bg-gray-50/80">
                  <td colSpan={7} className="px-4 py-0">
                    <div className="ml-6 border-l-2 border-gray-200 pl-4 py-3 space-y-2">
                      {deduped.map((u, ui) => (
                        <div key={ui} className="flex items-start gap-3 text-xs py-1.5 border-b border-gray-100 last:border-0">
                          <span className="text-gray-400 w-4 shrink-0 pt-0.5">{ui + 1}</span>
                          <div className="flex-1 min-w-0">
                            <a
                              href={u.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center gap-1 truncate"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span className="truncate">{u.url}</span>
                            </a>
                            {u.title && u.title !== d.domain && (
                              <div className="text-gray-400 truncate mt-0.5">{u.title}</div>
                            )}
                            {u.segment && <div className="text-gray-400 mt-0.5">{formatSegmentLabel(u.segment)}</div>}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {(u as any).engines?.includes("chatgpt") && (
                              <span className="bg-orange-50 text-orange-600 border border-orange-100 px-1.5 py-0.5 rounded text-xs font-medium">GPT</span>
                            )}
                            {(u as any).engines?.includes("gemini") && (
                              <span className="bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded text-xs font-medium">Gem</span>
                            )}
                            <span className="text-gray-500 font-semibold w-5 text-right">{u.count}×</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              );

              return [mainRow, expandedRow];
            })}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

interface CrawlStatus {
  total_citation_urls: number;
  crawled: number;
  accessible: number;
  failed: number;
  analyzed: number;
}

interface BrandConsistency {
  brand: string;
  page_count: string;
  category_count: string;
  positive_pages: string;
  neutral_pages: string;
  negative_pages: string;
  best_rank: string | null;
  ranked_pages: string;
  all_attributes: string[];
  all_services: string[];
  all_trust_signals: string[];
}

interface BrandContextPage {
  page_url: string;
  page_title: string;
  url_category: string;
  domain: string;
  brand: string;
  mention_count: number;
  rank_position: number | null;
  attributes: string[];
  services: string[];
  trust_signals: string[];
  sentiment: string;
  framing: string;
  snippets: string[];
  publish_date: string | null;
}

const SENTIMENT_BADGE: Record<string, string> = {
  positive: "bg-green-50 text-green-700 border-green-100",
  neutral: "bg-gray-50 text-gray-600 border-gray-200",
  negative: "bg-red-50 text-red-700 border-red-100",
};

const FRAMING_BADGE: Record<string, string> = {
  recommended: "bg-emerald-50 text-emerald-700",
  listed: "bg-blue-50 text-blue-700",
  compared: "bg-indigo-50 text-indigo-700",
  criticized: "bg-red-50 text-red-700",
  mentioned: "bg-gray-50 text-gray-600",
};

function ContextAuditSection({ sessionId }: { sessionId: number }) {
  const qc = useQueryClient();
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  const { data: statusData, isLoading: statusLoading } = useQuery<CrawlStatus>({
    queryKey: [`/api/crawl/status/${sessionId}`],
    refetchInterval: (query) => {
      const d = query.state.data as CrawlStatus | undefined;
      if (!d) return 5000;
      const crawling = d.crawled > 0 && d.crawled < d.total_citation_urls;
      const analyzing = d.analyzed > 0 && d.analyzed < d.accessible;
      return (crawling || analyzing) ? 3000 : 10000;
    },
    staleTime: 2000,
  });

  const { data: consistencyData, isLoading: consistencyLoading } = useQuery<{ brands: BrandConsistency[] }>({
    queryKey: [`/api/context-consistency/${sessionId}`],
    staleTime: 30000,
    enabled: (statusData?.analyzed ?? 0) > 0,
  });

  const { data: brandData, isLoading: brandLoading } = useQuery<{ brand: string; pages: BrandContextPage[] }>({
    queryKey: [`/api/brand-context/${sessionId}/${selectedBrand}`],
    staleTime: 30000,
    enabled: !!selectedBrand,
  });

  const crawlMut = useMutation({
    mutationFn: () => apiRequest("POST", `/api/crawl/run/${sessionId}`),
    onSuccess: () => setTimeout(() => qc.invalidateQueries({ queryKey: [`/api/crawl/status/${sessionId}`] }), 2000),
  });

  const analyzeMut = useMutation({
    mutationFn: () => apiRequest("POST", `/api/crawl/analyze/${sessionId}`),
    onSuccess: () => setTimeout(() => qc.invalidateQueries({ queryKey: [`/api/crawl/status/${sessionId}`] }), 2000),
  });

  const status = statusData;
  const crawlPct = status ? Math.round((status.crawled / status.total_citation_urls) * 100) : 0;
  const analyzedPct = status && status.accessible > 0 ? Math.round((status.analyzed / status.accessible) * 100) : 0;
  const isCrawling = !!status && status.crawled > 0 && status.crawled < status.total_citation_urls;
  const isAnalyzing = !!status && status.analyzed > 0 && status.analyzed < status.accessible;
  const isActive = isCrawling || isAnalyzing;
  const brands = consistencyData?.brands || [];

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Crawl Status</h2>
            {isActive && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {isCrawling ? "Crawling…" : "Analyzing…"}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => crawlMut.mutate()}
              disabled={crawlMut.isPending}
              data-testid="btn-start-crawl"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {crawlMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              Crawl Pages
            </button>
            <button
              onClick={() => analyzeMut.mutate()}
              disabled={analyzeMut.isPending || (status?.accessible ?? 0) === 0}
              data-testid="btn-start-analyze"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {analyzeMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Analyze
            </button>
          </div>
        </div>

        {statusLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
        ) : status ? (
          <div className="space-y-4">
            {/* Stat pills */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Total URLs", value: status.total_citation_urls, color: "text-gray-900" },
                { label: "Crawled", value: status.crawled, color: "text-blue-700" },
                { label: "Accessible", value: status.accessible, color: "text-green-700" },
                { label: "Analyzed", value: status.analyzed, color: "text-purple-700" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Crawl progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Crawl progress</span>
                <span className="font-medium text-blue-700">{status.crawled} / {status.total_citation_urls} — {crawlPct}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-700"
                  style={{ width: `${crawlPct}%` }}
                />
              </div>
              {status.failed > 0 && (
                <p className="text-xs text-gray-400">{status.failed} URLs blocked or timed out (normal for Reddit, rate-limited sites)</p>
              )}
            </div>

            {/* Analysis progress bar — only show once crawling has some results */}
            {status.accessible > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>LLM analysis progress</span>
                  <span className="font-medium text-purple-700">{status.analyzed} / {status.accessible} — {analyzedPct}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-700"
                    style={{ width: `${analyzedPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Consistency Overview */}
      {consistencyLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
      ) : brands.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <p className="text-sm text-gray-400">No brand context data yet — run the crawl then the analysis to populate this section.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Brand Context Overview</h2>
            <p className="text-xs text-gray-400 mt-0.5">Attributes, services, and sentiment extracted from all cited pages per brand</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Brand</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">Pages</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">Best Rank</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-green-600 uppercase tracking-wide">+</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">~</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-red-500 uppercase tracking-wide">−</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Top Attributes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Services</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b, i) => (
                <tr
                  key={b.brand}
                  onClick={() => setSelectedBrand(selectedBrand === b.brand ? null : b.brand)}
                  className={`border-b border-gray-50 cursor-pointer transition-colors ${selectedBrand === b.brand ? "bg-blue-50/40" : "hover:bg-gray-50/60"}`}
                  data-testid={`brand-row-${i}`}
                >
                  <td className="px-4 py-3 font-medium text-gray-800">{b.brand}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{b.page_count}</td>
                  <td className="px-4 py-3 text-center">
                    {b.best_rank ? <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs font-semibold">#{b.best_rank}</span> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-green-600 font-medium">{b.positive_pages}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{b.neutral_pages}</td>
                  <td className="px-4 py-3 text-center text-red-500 font-medium">{b.negative_pages}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(b.all_attributes || []).slice(0, 4).map((a, ai) => (
                        <span key={ai} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs">{a}</span>
                      ))}
                      {(b.all_attributes || []).length > 4 && <span className="text-gray-400 text-xs">+{b.all_attributes.length - 4}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(b.all_services || []).slice(0, 3).map((s, si) => (
                        <span key={si} className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-xs">{s}</span>
                      ))}
                      {(b.all_services || []).length > 3 && <span className="text-gray-400 text-xs">+{b.all_services.length - 3}</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Brand Detail Drilldown */}
      {selectedBrand && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Brand Context — <span className="text-gray-900 normal-case">{selectedBrand}</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">How each cited page describes this brand</p>
            </div>
            <button onClick={() => setSelectedBrand(null)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100">✕ close</button>
          </div>

          {brandLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
          ) : (brandData?.pages || []).length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">No pages found for this brand</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {(brandData?.pages || []).map((page, i) => (
                <div key={i} className="px-6 py-4 hover:bg-gray-50/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${SENTIMENT_BADGE[page.sentiment] || SENTIMENT_BADGE.neutral}`}>
                          {page.sentiment}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FRAMING_BADGE[page.framing] || FRAMING_BADGE.mentioned}`}>
                          {page.framing}
                        </span>
                        {page.rank_position != null && (
                          <span className="bg-amber-50 text-amber-700 border border-amber-100 text-xs px-2 py-0.5 rounded-full font-semibold">
                            Rank #{page.rank_position}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_BADGE[page.url_category] || "bg-gray-100 text-gray-600"}`}>
                          {page.url_category}
                        </span>
                      </div>
                      <a
                        href={page.page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1 truncate"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{page.page_title || page.domain}</span>
                      </a>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{page.page_url}</p>

                      {page.attributes?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {page.attributes.map((a, ai) => (
                            <span key={ai} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs">{a}</span>
                          ))}
                        </div>
                      )}
                      {page.services?.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {page.services.map((s, si) => (
                            <span key={si} className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-xs">{s}</span>
                          ))}
                        </div>
                      )}
                      {page.trust_signals?.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {page.trust_signals.map((t, ti) => (
                            <span key={ti} className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-xs border border-green-100">✓ {t}</span>
                          ))}
                        </div>
                      )}
                      {page.snippets?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {page.snippets.slice(0, 2).map((s, si) => (
                            <p key={si} className="text-xs text-gray-500 italic border-l-2 border-gray-200 pl-2">&ldquo;{s}&rdquo;</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const BRAND_COLORS: Record<string, string> = {
  "Call Doctor":               "#3b82f6",
  "Emirates Home Nursing":     "#8b5cf6",
  "First Response Healthcare": "#10b981",
  "Nightingale Health Services": "#f97316",
  "Vesta Care":                "#f43f5e",
  "Manzil Health":             "#f59e0b",
};

const METRIC_LABELS: Record<string, string> = {
  authority_source_presence: "Auth Source",
  category_clarity:          "Category",
  trust:                     "Trust",
  service_breadth:           "Breadth",
  care_depth:                "Depth",
  delivery_reliability:      "Delivery",
  authority_reputation:      "Reputation",
  identity_consistency:      "Identity",
};

const METRIC_KEYS = Object.keys(METRIC_LABELS);

function scoreColor(v: number): string {
  if (v >= 66) return "#10b981";
  if (v >= 40) return "#f59e0b";
  return "#f43f5e";
}

// ─── GEO types ───────────────────────────────────────────────────────────────

type GeoSubsignal = {
  label: string;
  own_snippet_num: number; own_snippet_den: number;
  ext_snippet_num: number; ext_snippet_den: number;
  own_domain_num: number;  own_domain_den: number;
  ext_domain_num: number;  ext_domain_den: number;
};
type GeoExample  = { host: string; url: string; text: string; is_own: boolean };
type GeoPacket   = { packet: boolean[]; label: string; count: number; pct: number; hosts: number; total_hosts: number };
type GeoMetricDetail = {
  score: number;
  subsignals: Record<string, GeoSubsignal>;
  examples: GeoExample[];
  packets?: { packets: GeoPacket[]; total_snippets: number };
  components?: Record<string, number | string>;
};
type GeoDetailData = Record<string, Record<string, GeoMetricDetail>>;

// ─── MetricDetailPanel ────────────────────────────────────────────────────────

function MetricDetailPanel({ detail, metricKey }: { detail: GeoMetricDetail; metricKey: string }) {
  const subsignalRows = Object.values(detail.subsignals ?? {}).filter(
    (s) => s.own_snippet_num + s.ext_snippet_num > 0
  );

  return (
    <div className="mt-1 mb-3 ml-[88px] bg-gray-50 border border-gray-100 rounded-lg overflow-hidden">

      {/* ── Identity consistency: packet table ── */}
      {metricKey === "identity_consistency" && detail.packets?.packets?.length ? (
        <div className="p-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Messaging Packets</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 text-[10px]">
                <th className="text-left pb-1 font-medium">Packet dimensions</th>
                <th className="text-right pb-1 font-medium">%</th>
                <th className="text-right pb-1 font-medium">Snippets</th>
                <th className="text-right pb-1 font-medium">Hosts</th>
              </tr>
            </thead>
            <tbody>
              {detail.packets.packets.map((pkt, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="py-1 text-gray-700 pr-2">{pkt.label || "(none)"}</td>
                  <td className="text-right py-1 font-medium text-gray-600">{pkt.pct}%</td>
                  <td className="text-right py-1 text-gray-500">{pkt.count}/{detail.packets!.total_snippets}</td>
                  <td className="text-right py-1 text-gray-500">{pkt.hosts}/{pkt.total_hosts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      ) : metricKey === "authority_source_presence" && detail.components ? (
        /* ── Authority source: component factors ── */
        <div className="p-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
          {Object.entries(detail.components).map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-gray-400 capitalize">{k.replace(/_/g, " ")}</span>
              <span className="font-medium text-gray-700">{String(v)}</span>
            </div>
          ))}
        </div>

      ) : subsignalRows.length > 0 ? (
        /* ── Keyword metric: sub-signal table ── */
        <div className="p-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase tracking-wider">
                <th className="text-left pb-1.5 font-medium">Sub-signal</th>
                <th className="text-right pb-1.5 font-medium">Own snips</th>
                <th className="text-right pb-1.5 font-medium">Ext snips</th>
                <th className="text-right pb-1.5 font-medium">Own dom</th>
                <th className="text-right pb-1.5 font-medium">Ext dom</th>
              </tr>
            </thead>
            <tbody>
              {subsignalRows.map((s, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="py-1 text-gray-700 pr-2">{s.label}</td>
                  <td className="text-right py-1 text-gray-600 font-medium">
                    {s.own_snippet_num > 0
                      ? <span className="text-blue-600">{s.own_snippet_num}</span>
                      : <span className="text-gray-300">0</span>}/{s.own_snippet_den}
                  </td>
                  <td className="text-right py-1 text-gray-600 font-medium">
                    {s.ext_snippet_num > 0
                      ? <span className="text-emerald-600">{s.ext_snippet_num}</span>
                      : <span className="text-gray-300">0</span>}/{s.ext_snippet_den}
                  </td>
                  <td className="text-right py-1 text-gray-500">{s.own_domain_num}/{s.own_domain_den}</td>
                  <td className="text-right py-1 text-gray-500">{s.ext_domain_num}/{s.ext_domain_den}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      ) : (
        <div className="p-3 text-xs text-gray-400 italic">No matching signals found for this metric.</div>
      )}

      {/* ── Evidence snippets ── */}
      {detail.examples?.length > 0 && (
        <div className="border-t border-gray-100 p-3 space-y-2.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Evidence</p>
          {detail.examples.map((ex, i) => (
            <div key={i} className="text-xs">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide ${
                  ex.is_own ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"
                }`}>
                  {ex.is_own ? "own" : "ext"}
                </span>
                <span className="text-gray-400 font-medium">{ex.host}</span>
                {ex.url && (
                  <a
                    href={ex.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-gray-500"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
              <p className="text-gray-600 leading-relaxed line-clamp-3">{ex.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── GeoMetricsSection ───────────────────────────────────────────────────────

function GeoMetricsSection({ sessionId }: { sessionId: number }) {
  const [open, setOpen] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ brands: Record<string, string | number>[] }>({
    queryKey: [`/api/geo-metrics/${sessionId}`],
    staleTime: 60000,
    enabled: open,
  });

  const { data: detailData } = useQuery<GeoDetailData>({
    queryKey: [`/api/geo-metrics-detail/${sessionId}`],
    staleTime: 60000,
    enabled: open,
  });

  const brands = data?.brands || [];

  const radarData = METRIC_KEYS.map((key) => {
    const row: Record<string, string | number> = { metric: METRIC_LABELS[key] };
    brands.forEach((b) => { row[b.brand as string] = Number(b[key] ?? 0); });
    return row;
  });

  const topBrand = useMemo(() => {
    if (!brands.length) return null;
    return brands.reduce((best, b) => {
      const avg = METRIC_KEYS.reduce((s, k) => s + Number(b[k] ?? 0), 0) / METRIC_KEYS.length;
      const bestAvg = METRIC_KEYS.reduce((s, k) => s + Number(best[k] ?? 0), 0) / METRIC_KEYS.length;
      return avg > bestAvg ? b : best;
    });
  }, [brands]);

  const toggleMetric = useCallback((brandName: string, metricKey: string) => {
    const key = `${brandName}::${metricKey}`;
    setExpandedKey((prev) => (prev === key ? null : key));
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50/60 transition-colors"
        data-testid="geo-metrics-toggle"
      >
        <div>
          <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Brand GEO Intelligence</span>
          <span className="text-xs text-gray-400 ml-3">8-dimension scoring from AI citation context · crawled pages only</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
            </div>
          ) : brands.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">No brand scores found.</div>
          ) : (
            <div className="px-6 pb-8">

              {/* top bar */}
              {topBrand && (
                <div className="flex items-center gap-3 py-4 border-b border-gray-100 mb-6">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Overall leader</span>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: BRAND_COLORS[topBrand.brand as string] ?? "#6b7280" }}
                  >
                    {topBrand.brand as string}
                  </span>
                  <span className="text-xs text-gray-400">
                    avg {(METRIC_KEYS.reduce((s, k) => s + Number(topBrand[k] ?? 0), 0) / METRIC_KEYS.length).toFixed(1)} / 100
                  </span>
                </div>
              )}

              {/* Radar chart */}
              <div className="mb-8">
                <p className="text-xs text-gray-400 mb-4 uppercase tracking-wide">Radar — all brands across all dimensions</p>
                <ResponsiveContainer width="100%" height={360}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#6b7280" }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    {brands.map((b) => (
                      <Radar
                        key={b.brand as string}
                        name={b.brand as string}
                        dataKey={b.brand as string}
                        stroke={BRAND_COLORS[b.brand as string] ?? "#6b7280"}
                        fill={BRAND_COLORS[b.brand as string] ?? "#6b7280"}
                        fillOpacity={0.08}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                    <Tooltip
                      formatter={(val: number) => [`${val.toFixed(1)}`, undefined]}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Brand cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {brands.map((b) => {
                  const brandName = b.brand as string;
                  const color = BRAND_COLORS[brandName] ?? "#6b7280";
                  const avg = METRIC_KEYS.reduce((s, k) => s + Number(b[k] ?? 0), 0) / METRIC_KEYS.length;
                  const brandDetail = detailData?.[brandName];

                  return (
                    <div
                      key={brandName}
                      className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow"
                      data-testid={`geo-brand-card-${brandName.replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      {/* Card header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-sm font-semibold text-gray-800 truncate">{brandName}</span>
                        </div>
                        <span className="text-xs font-bold shrink-0 ml-2" style={{ color }}>
                          {avg.toFixed(0)}
                        </span>
                      </div>

                      {/* Metric rows — each clickable */}
                      <div className="space-y-0.5">
                        {METRIC_KEYS.map((key) => {
                          const val       = Number(b[key] ?? 0);
                          const barColor  = scoreColor(val);
                          const expandKey = `${brandName}::${key}`;
                          const isExpanded = expandedKey === expandKey;
                          const detail    = brandDetail?.[key];

                          return (
                            <div key={key}>
                              <button
                                onClick={() => toggleMetric(brandName, key)}
                                className="w-full flex items-center gap-2 py-1.5 rounded hover:bg-gray-50 px-1 -mx-1 group transition-colors"
                                data-testid={`geo-metric-${key}-${brandName.replace(/\s+/g, "-").toLowerCase()}`}
                                title={detail ? "Click to expand sub-signals and evidence" : undefined}
                              >
                                <span className="text-xs text-gray-400 w-20 shrink-0 text-left">{METRIC_LABELS[key]}</span>
                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${val}%`, backgroundColor: barColor }}
                                  />
                                </div>
                                <span className="text-xs font-medium w-8 text-right shrink-0" style={{ color: barColor }}>
                                  {val.toFixed(0)}
                                </span>
                                <ChevronRight
                                  className={`w-3 h-3 shrink-0 transition-transform duration-150 ${
                                    isExpanded ? "rotate-90 text-gray-400" : "text-gray-200 group-hover:text-gray-400"
                                  }`}
                                />
                              </button>

                              {isExpanded && detail && (
                                <MetricDetailPanel detail={detail} metricKey={key} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-gray-300 mt-6 text-center">
                Scores derived from {brands.length} brands · crawled citation pages only · click any metric row to expand sub-signals and evidence
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const params = useParams<{ sessionId?: string }>();
  const sessionId = parseInt(params.sessionId || "77");
  const [activeTab, setActiveTab] = useState<"citations" | "context">("citations");
  const [tableEngine, setTableEngine] = useState<"all" | "chatgpt" | "gemini">("all");
  const [showTable, setShowTable] = useState(false);

  const { data: summaryData, isLoading } = useQuery<{
    rows: CitationUrlRow[];
    sessionId: number;
  }>({
    queryKey: [`/api/citation-urls/summary?sessionId=${sessionId}`],
    staleTime: 30000,
  });

  const summaryRows = summaryData?.rows || [];

  const { chatgptSlices, geminiSlices, chatgptBrandSlices, geminiBrandSlices } = useMemo(() => {
    const thirdParty = summaryRows.filter((r) => !BRAND_CATEGORIES.has(r.url_category));
    const brand = summaryRows.filter((r) => BRAND_CATEGORIES.has(r.url_category));
    const toSlices = (rows: CitationUrlRow[], field: "chatgpt_citations" | "gemini_citations") =>
      rows
        .filter((r) => parseInt(r[field]) > 0)
        .map((r) => ({ name: r.url_category, value: parseInt(r[field]), total: 0 }))
        .sort((a, b) => b.value - a.value);
    const othersTotal = (field: "chatgpt_citations" | "gemini_citations") =>
      thirdParty.reduce((s, r) => s + parseInt(r[field]), 0);
    const withOthers = (slices: { name: string; value: number; total: number }[], field: "chatgpt_citations" | "gemini_citations") => {
      const total = othersTotal(field);
      return total > 0 ? [...slices, { name: "Others (third-party)", value: total, total: 0 }] : slices;
    };
    return {
      chatgptSlices: toSlices(thirdParty, "chatgpt_citations"),
      geminiSlices: toSlices(thirdParty, "gemini_citations"),
      chatgptBrandSlices: withOthers(toSlices(brand, "chatgpt_citations"), "chatgpt_citations"),
      geminiBrandSlices: withOthers(toSlices(brand, "gemini_citations"), "gemini_citations"),
    };
  }, [summaryRows]);

  const tableRows = summaryRows.map((r) => {
    if (tableEngine === "chatgpt") return { ...r, total_citations: r.chatgpt_citations, total_unique_urls: r.chatgpt_unique_urls };
    if (tableEngine === "gemini") return { ...r, total_citations: r.gemini_citations, total_unique_urls: r.gemini_unique_urls };
    return r;
  }).filter((r) => parseInt(r.total_citations) > 0);

  const grandTotal = tableRows.reduce((s, r) => s + parseInt(r.total_citations), 0);
  const grandUnique = tableRows.reduce((s, r) => s + parseInt(r.total_unique_urls), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Citation Analytics</h1>
            <p className="text-sm text-gray-400 mt-1">Session {sessionId} · source: citation_urls</p>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {(["citations", "context"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                data-testid={`tab-${tab}`}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "citations" ? "Citation Analysis" : "Context Audit"}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "context" ? (
          <ContextAuditSection sessionId={sessionId} />
        ) : isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-7 h-7 animate-spin text-gray-300" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Brand-owned pie charts */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="mb-5">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Brand-Owned Citation Mix
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  All segments combined · non-unique citation events · how deeply AI indexes the brand's own pages
                </p>
              </div>
              <div className="flex gap-6 divide-x divide-gray-100">
                <EnginePie engine="chatgpt" data={chatgptBrandSlices} label="ChatGPT" accentColor="#f97316" />
                <div className="pl-6 flex-1 flex flex-col">
                  <EnginePie engine="gemini" data={geminiBrandSlices} label="Gemini" accentColor="#3b82f6" />
                </div>
              </div>
            </div>

            {/* Third-party pie charts */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="mb-5">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Third-Party Source Mix
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  All segments combined · non-unique citation events · independent sources AI trusts in this category
                </p>
              </div>
              <div className="flex gap-6 divide-x divide-gray-100">
                <EnginePie engine="chatgpt" data={chatgptSlices} label="ChatGPT" accentColor="#f97316" />
                <div className="pl-6 flex-1 flex flex-col">
                  <EnginePie engine="gemini" data={geminiSlices} label="Gemini" accentColor="#3b82f6" />
                </div>
              </div>
            </div>

            {/* Authority sources */}
            <AuthoritySection sessionId={sessionId} />

            {/* Brand GEO Intelligence metrics */}
            <GeoMetricsSection sessionId={sessionId} />

            {/* Summary table — collapsible */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowTable((v) => !v)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50/60 transition-colors"
                data-testid="toggle-table"
              >
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Full Breakdown · Category Totals
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  {showTable ? "Hide ↑" : "Show details ↓"}
                </span>
              </button>

              {showTable && (
                <>
                  <div className="px-6 pb-3 border-b border-gray-100 flex justify-end">
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 text-xs font-medium">
                      {(["all", "chatgpt", "gemini"] as const).map((e) => (
                        <button
                          key={e}
                          onClick={() => setTableEngine(e)}
                          className={`px-3 py-1.5 rounded-md transition-all ${
                            tableEngine === e
                              ? "bg-white shadow text-gray-900"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                          data-testid={`engine-filter-${e}`}
                        >
                          {e === "all" ? "All" : e === "chatgpt" ? "ChatGPT" : "Gemini"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Category</th>
                        {tableEngine === "all" && (
                          <>
                            <th className="px-4 py-3 text-right text-xs font-medium text-orange-500 uppercase tracking-wide">ChatGPT</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-orange-400 uppercase tracking-wide">Unique</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-blue-500 uppercase tracking-wide">Gemini</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-blue-400 uppercase tracking-wide">Unique</th>
                          </>
                        )}
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wide">
                          {tableEngine === "all" ? "Total" : "Citations"}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Unique URLs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row, i) => (
                        <tr
                          key={row.url_category}
                          className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                          data-testid={`category-row-${i}`}
                        >
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CATEGORY_COLOR[row.url_category] || "#d1d5db" }} />
                              <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${CATEGORY_BADGE[row.url_category] || "bg-gray-100 text-gray-600"}`}>
                                {row.url_category}
                              </span>
                            </div>
                          </td>
                          {tableEngine === "all" && (
                            <>
                              <td className="px-4 py-3 text-right text-orange-600 font-medium">{parseInt(row.chatgpt_citations).toLocaleString()}</td>
                              <td className="px-4 py-3 text-right text-orange-400 text-xs">{parseInt(row.chatgpt_unique_urls).toLocaleString()}</td>
                              <td className="px-4 py-3 text-right text-blue-600 font-medium">{parseInt(row.gemini_citations).toLocaleString()}</td>
                              <td className="px-4 py-3 text-right text-blue-400 text-xs">{parseInt(row.gemini_unique_urls).toLocaleString()}</td>
                            </>
                          )}
                          <td className="px-4 py-3 text-right font-semibold text-gray-800">{parseInt(row.total_citations).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-gray-500 text-xs">{parseInt(row.total_unique_urls).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</td>
                        {tableEngine === "all" && (
                          <>
                            <td className="px-4 py-3 text-right text-orange-600 font-bold">{summaryRows.reduce((s, r) => s + parseInt(r.chatgpt_citations), 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-orange-400 text-xs font-semibold">{summaryRows.reduce((s, r) => s + parseInt(r.chatgpt_unique_urls), 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-blue-600 font-bold">{summaryRows.reduce((s, r) => s + parseInt(r.gemini_citations), 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-blue-400 text-xs font-semibold">{summaryRows.reduce((s, r) => s + parseInt(r.gemini_unique_urls), 0).toLocaleString()}</td>
                          </>
                        )}
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{grandTotal.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-gray-500 text-xs font-semibold">{grandUnique.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
