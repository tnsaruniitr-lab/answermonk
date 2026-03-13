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
import { Loader2 } from "lucide-react";

interface CitationUrlRow {
  url_category: string;
  total_citations: string;
  total_unique_urls: string;
  chatgpt_citations: string;
  chatgpt_unique_urls: string;
  gemini_citations: string;
  gemini_unique_urls: string;
}

interface SegmentRow {
  segment_persona: string;
  engine: string;
  url_category: string;
  citations: string;
  unique_urls: string;
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

function formatSegment(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

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
        <span className="ml-auto text-xs text-gray-400 font-medium">{total.toLocaleString()} citations</span>
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

export default function AnalyticsDashboard() {
  const params = useParams<{ sessionId?: string }>();
  const sessionId = parseInt(params.sessionId || "77");
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [tableEngine, setTableEngine] = useState<"all" | "chatgpt" | "gemini">("all");

  const { data: segData, isLoading: segLoading } = useQuery<{
    rows: SegmentRow[];
    segments: string[];
    sessionId: number;
  }>({
    queryKey: [`/api/citation-urls/by-segment?sessionId=${sessionId}`],
    staleTime: 30000,
  });

  const { data: summaryData, isLoading: summaryLoading } = useQuery<{
    rows: CitationUrlRow[];
    sessionId: number;
  }>({
    queryKey: [`/api/citation-urls/summary?sessionId=${sessionId}`],
    staleTime: 30000,
  });

  const segments = segData?.segments || [];
  const activeSegment = selectedSegment || segments[0] || null;

  const { chatgptSlices, geminiSlices, chatgptBrand, geminiBrand } = useMemo(() => {
    if (!segData || !activeSegment) return { chatgptSlices: [], geminiSlices: [], chatgptBrand: 0, geminiBrand: 0 };
    const rows = segData.rows.filter((r) => r.segment_persona === activeSegment);
    const toSlices = (eng: string) =>
      rows
        .filter((r) => r.engine === eng && parseInt(r.citations) > 0 && !BRAND_CATEGORIES.has(r.url_category))
        .map((r) => ({ name: r.url_category, value: parseInt(r.citations), total: 0 }))
        .sort((a, b) => b.value - a.value);
    const brandTotal = (eng: string) =>
      rows
        .filter((r) => r.engine === eng && BRAND_CATEGORIES.has(r.url_category))
        .reduce((s, r) => s + parseInt(r.citations), 0);
    return {
      chatgptSlices: toSlices("chatgpt"),
      geminiSlices: toSlices("gemini"),
      chatgptBrand: brandTotal("chatgpt"),
      geminiBrand: brandTotal("gemini"),
    };
  }, [segData, activeSegment]);

  const summaryRows = summaryData?.rows || [];
  const tableRows = summaryRows.map((r) => {
    if (tableEngine === "chatgpt") return { ...r, total_citations: r.chatgpt_citations, total_unique_urls: r.chatgpt_unique_urls };
    if (tableEngine === "gemini") return { ...r, total_citations: r.gemini_citations, total_unique_urls: r.gemini_unique_urls };
    return r;
  }).filter((r) => parseInt(r.total_citations) > 0);

  const grandTotal = tableRows.reduce((s, r) => s + parseInt(r.total_citations), 0);
  const grandUnique = tableRows.reduce((s, r) => s + parseInt(r.total_unique_urls), 0);

  const isLoading = segLoading || summaryLoading;

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
            {/* Segment tabs */}
            <div className="flex flex-wrap gap-2">
              {segments.map((seg) => (
                <button
                  key={seg}
                  onClick={() => setSelectedSegment(seg)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all border ${
                    activeSegment === seg
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700"
                  }`}
                  data-testid={`segment-tab-${seg}`}
                >
                  {formatSegment(seg)}
                </button>
              ))}
            </div>

            {/* Pie charts */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Third-Party Source Mix
                  </h2>
                  {activeSegment && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatSegment(activeSegment)} · brand-owned citations excluded · hover a slice to inspect
                    </p>
                  )}
                </div>
                {/* Brand citations summary pill */}
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <div className="text-right">
                    <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide font-medium">Brand citations (excluded)</div>
                    <div className="flex gap-3">
                      <span className="text-xs bg-orange-50 text-orange-700 border border-orange-100 px-2.5 py-1 rounded-full font-semibold">
                        ChatGPT {chatgptBrand.toLocaleString()}
                      </span>
                      <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full font-semibold">
                        Gemini {geminiBrand.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-6 divide-x divide-gray-100">
                <EnginePie
                  engine="chatgpt"
                  data={chatgptSlices}
                  label="ChatGPT"
                  accentColor="#f97316"
                />
                <div className="pl-6 flex-1 flex flex-col">
                  <EnginePie
                    engine="gemini"
                    data={geminiSlices}
                    label="Gemini"
                    accentColor="#3b82f6"
                  />
                </div>
              </div>
            </div>

            {/* Summary table */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  All Sessions · Category Totals
                </h2>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Category
                    </th>
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
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Unique URLs
                    </th>
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
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: CATEGORY_COLOR[row.url_category] || "#d1d5db" }}
                          />
                          <span
                            className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${
                              CATEGORY_BADGE[row.url_category] || "bg-gray-100 text-gray-600"
                            }`}
                          >
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
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">
                        {parseInt(row.total_citations).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 text-xs">
                        {parseInt(row.total_unique_urls).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</td>
                    {tableEngine === "all" && (
                      <>
                        <td className="px-4 py-3 text-right text-orange-600 font-bold">
                          {summaryRows.reduce((s, r) => s + parseInt(r.chatgpt_citations), 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-orange-400 text-xs font-semibold">
                          {summaryRows.reduce((s, r) => s + parseInt(r.chatgpt_unique_urls), 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-blue-600 font-bold">
                          {summaryRows.reduce((s, r) => s + parseInt(r.gemini_citations), 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-blue-400 text-xs font-semibold">
                          {summaryRows.reduce((s, r) => s + parseInt(r.gemini_unique_urls), 0).toLocaleString()}
                        </td>
                      </>
                    )}
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{grandTotal.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-500 text-xs font-semibold">{grandUnique.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
