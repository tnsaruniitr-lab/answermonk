import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Loader2, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";

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

function formatSegmentLabel(s: string) {
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
                            <div className="text-gray-400 mt-0.5">{formatSegmentLabel(u.segment)}</div>
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

export default function AnalyticsDashboard() {
  const params = useParams<{ sessionId?: string }>();
  const sessionId = parseInt(params.sessionId || "77");
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
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Citation Analytics</h1>
          <p className="text-sm text-gray-400 mt-1">Session {sessionId} · source: citation_urls</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-7 h-7 animate-spin text-gray-300" />
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
