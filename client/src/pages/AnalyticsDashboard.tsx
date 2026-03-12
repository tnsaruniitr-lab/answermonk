import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const THIRD_PARTY_EXCLUDE = ["healthcare_provider", "hospital_clinic"];

const CATEGORY_ORDER = [
  "healthcare_directory",
  "news_media",
  "review_platform",
  "community",
  "government",
  "market_research",
  "business_directory",
  "social_media",
  "jobs_platform",
  "general_web",
  "healthcare_provider",
  "hospital_clinic",
  "unknown",
];

const CATEGORY_LABELS: Record<string, string> = {
  healthcare_directory: "Healthcare Directory",
  news_media: "News & Media",
  review_platform: "Review Platform",
  community: "Community",
  government: "Government",
  market_research: "Market Research",
  business_directory: "Business Directory",
  social_media: "Social Media",
  jobs_platform: "Jobs Platform",
  general_web: "General Web",
  healthcare_provider: "Healthcare Provider",
  hospital_clinic: "Hospital & Clinic",
  unknown: "Unknown",
};

const CATEGORY_COLORS: Record<string, string> = {
  healthcare_directory: "bg-teal-100 text-teal-800",
  news_media: "bg-orange-100 text-orange-800",
  review_platform: "bg-yellow-100 text-yellow-800",
  community: "bg-green-100 text-green-800",
  government: "bg-blue-100 text-blue-800",
  market_research: "bg-indigo-100 text-indigo-800",
  business_directory: "bg-violet-100 text-violet-800",
  social_media: "bg-pink-100 text-pink-800",
  jobs_platform: "bg-slate-100 text-slate-800",
  general_web: "bg-gray-100 text-gray-700",
  healthcare_provider: "bg-cyan-100 text-cyan-800",
  hospital_clinic: "bg-red-100 text-red-800",
  unknown: "bg-gray-100 text-gray-500",
};

interface AnalyticsData {
  session: {
    id: number;
    brandName: string;
    segmentCount: number;
    createdAt: string;
  };
  brands: string[];
  selectedBrand: string | null;
  sessionTotals: Record<string, number>;
  engineStats: Record<string, { total: number; uniqueDomains: number }>;
  categoryBreakdown: Array<{ category: string; gemini: number; chatgpt: number }>;
  domainAggregates: Array<{
    domain: string;
    domainCategory: string;
    geminiCount: number;
    chatgptCount: number;
  }>;
}

function pct(part: number, total: number) {
  if (!total) return "0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

function StatCard({
  engine,
  total,
  uniqueDomains,
  sessionTotal,
  color,
  label,
  isBrandView,
}: {
  engine: string;
  total: number;
  uniqueDomains: number;
  sessionTotal: number;
  color: string;
  label: string;
  isBrandView: boolean;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 flex-1" data-testid={`stat-card-${engine}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-3 h-3 rounded-full ${color}`} />
        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex gap-8">
        <div>
          <div className="text-3xl font-bold text-gray-900" data-testid={`stat-total-${engine}`}>
            {total.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400 mt-1">grounded citations</div>
          {isBrandView && sessionTotal > 0 && (
            <div className="text-xs text-gray-500 mt-1 font-medium">
              {pct(total, sessionTotal)} of session
            </div>
          )}
        </div>
        <div>
          <div className="text-3xl font-bold text-gray-900" data-testid={`stat-domains-${engine}`}>
            {uniqueDomains.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400 mt-1">unique domains</div>
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-semibold text-gray-900">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

function DomainList({
  title,
  domains,
  engine,
  sessionId,
  color,
}: {
  title: string;
  domains: Array<{ domain: string; domainCategory: string; count: number; sharedWithOther: boolean }>;
  engine: string;
  sessionId: number;
  color: string;
}) {
  const [, setLocation] = useLocation();

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {domains.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">No data</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-8">#</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Domain</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Category</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Citations</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((d, i) => (
                <tr
                  key={d.domain}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setLocation(`/citations/${sessionId}?domain=${encodeURIComponent(d.domain)}`)}
                  data-testid={`domain-row-${engine}-${i}`}
                >
                  <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-gray-800 truncate">{d.domain}</span>
                      {d.sharedWithOther && (
                        <span className="shrink-0 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">Both</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[d.domainCategory] || "bg-gray-100 text-gray-600"}`}>
                      {CATEGORY_LABELS[d.domainCategory] || d.domainCategory}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{d.count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = parseInt(params.sessionId || "77");
  const [thirdPartyOnly, setThirdPartyOnly] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string>("all");

  const brandParam = selectedBrand !== "all" ? `?brand=${encodeURIComponent(selectedBrand)}` : "";

  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: [`/api/analytics/session/${sessionId}${brandParam}`],
  });

  const filtered = useMemo(() => {
    if (!data) return null;

    const domains = thirdPartyOnly
      ? data.domainAggregates.filter(d => !THIRD_PARTY_EXCLUDE.includes(d.domainCategory))
      : data.domainAggregates;

    const geminiStats = {
      total: domains.reduce((s, d) => s + d.geminiCount, 0),
      uniqueDomains: domains.filter(d => d.geminiCount > 0).length,
    };
    const chatgptStats = {
      total: domains.reduce((s, d) => s + d.chatgptCount, 0),
      uniqueDomains: domains.filter(d => d.chatgptCount > 0).length,
    };

    const categoryBreakdown = data.categoryBreakdown
      .filter(c => thirdPartyOnly ? !THIRD_PARTY_EXCLUDE.includes(c.category) : true)
      .filter(c => c.gemini > 0 || c.chatgpt > 0)
      .sort((a, b) => {
        const ai = CATEGORY_ORDER.indexOf(a.category);
        const bi = CATEGORY_ORDER.indexOf(b.category);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      })
      .map(c => ({
        category: CATEGORY_LABELS[c.category] || c.category,
        Gemini: c.gemini,
        ChatGPT: c.chatgpt,
      }))
      .reverse();

    const geminiDomains = [...domains]
      .filter(d => d.geminiCount > 0)
      .sort((a, b) => b.geminiCount - a.geminiCount)
      .slice(0, 10)
      .map(d => ({
        domain: d.domain,
        domainCategory: d.domainCategory,
        count: d.geminiCount,
        sharedWithOther: d.chatgptCount > 0,
      }));

    const chatgptDomains = [...domains]
      .filter(d => d.chatgptCount > 0)
      .sort((a, b) => b.chatgptCount - a.chatgptCount)
      .slice(0, 10)
      .map(d => ({
        domain: d.domain,
        domainCategory: d.domainCategory,
        count: d.chatgptCount,
        sharedWithOther: d.geminiCount > 0,
      }));

    return { geminiStats, chatgptStats, categoryBreakdown, geminiDomains, chatgptDomains };
  }, [data, thirdPartyOnly]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Failed to load analytics data.</p>
      </div>
    );
  }

  const isBrandView = selectedBrand !== "all";
  const geminiSessionTotal = data.sessionTotals?.["gemini"] || 0;
  const chatgptSessionTotal = data.sessionTotals?.["chatgpt"] || 0;

  const displayGemini = thirdPartyOnly
    ? (filtered?.geminiStats ?? { total: 0, uniqueDomains: 0 })
    : (data.engineStats?.["gemini"] ?? { total: 0, uniqueDomains: 0 });
  const displayChatgpt = thirdPartyOnly
    ? (filtered?.chatgptStats ?? { total: 0, uniqueDomains: 0 })
    : (data.engineStats?.["chatgpt"] ?? { total: 0, uniqueDomains: 0 });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-900 text-white px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-xs text-gray-400 uppercase tracking-widest mb-2 font-medium">Engine Intelligence</div>
          <div className="flex items-end justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold mb-1" data-testid="session-brand-name">
                {data.session.brandName}
              </h1>
              <p className="text-gray-400 text-sm">
                {data.session.segmentCount} segment{data.session.segmentCount !== 1 ? "s" : ""}
                &nbsp;·&nbsp;
                {new Date(data.session.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                &nbsp;·&nbsp; Session #{data.session.id}
              </p>
            </div>
            <div className="shrink-0 w-56">
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Brand</label>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger
                  className="bg-gray-800 border-gray-700 text-white text-sm h-9 focus:ring-0 focus:ring-offset-0"
                  data-testid="brand-select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All brands</SelectItem>
                  {data.brands.map(b => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">
        <div className="flex gap-4">
          <StatCard
            engine="gemini"
            label="Gemini"
            total={displayGemini.total}
            uniqueDomains={displayGemini.uniqueDomains}
            sessionTotal={geminiSessionTotal}
            color="bg-blue-500"
            isBrandView={isBrandView}
          />
          <StatCard
            engine="chatgpt"
            label="ChatGPT"
            total={displayChatgpt.total}
            uniqueDomains={displayChatgpt.uniqueDomains}
            sessionTotal={chatgptSessionTotal}
            color="bg-orange-500"
            isBrandView={isBrandView}
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Source Category Breakdown</h2>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 text-xs font-medium">
              <button
                onClick={() => setThirdPartyOnly(true)}
                className={`px-3 py-1.5 rounded-md transition-all ${thirdPartyOnly ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                data-testid="toggle-third-party"
              >
                Third-party sources
              </button>
              <button
                onClick={() => setThirdPartyOnly(false)}
                className={`px-3 py-1.5 rounded-md transition-all ${!thirdPartyOnly ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                data-testid="toggle-all-sources"
              >
                All sources
              </button>
            </div>
          </div>

          {filtered && filtered.categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={filtered.categoryBreakdown.length * 44 + 40}>
              <BarChart
                data={filtered.categoryBreakdown}
                layout="vertical"
                margin={{ top: 0, right: 24, left: 140, bottom: 0 }}
                barCategoryGap="30%"
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  width={135}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
                <Bar dataKey="Gemini" fill="#3b82f6" radius={[0, 3, 3, 0]} maxBarSize={18} />
                <Bar dataKey="ChatGPT" fill="#f97316" radius={[0, 3, 3, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-400 text-sm">No data</div>
          )}
        </div>

        {filtered && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Top Cited Domains</h2>
            <div className="flex gap-6">
              <DomainList
                title="Gemini Top 10"
                domains={filtered.geminiDomains}
                engine="gemini"
                sessionId={sessionId}
                color="bg-blue-500"
              />
              <DomainList
                title="ChatGPT Top 10"
                domains={filtered.chatgptDomains}
                engine="chatgpt"
                sessionId={sessionId}
                color="bg-orange-500"
              />
            </div>
            <p className="text-xs text-gray-400 mt-3">
              "Both" = cited by both engines. Click any row to view citations.
              {isBrandView && (
                <span className="ml-2 text-gray-500">
                  Share % in stat cards is of total session citations.
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
