import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORY_COLORS: Record<string, string> = {
  ai_platform: "bg-purple-100 text-purple-800",
  government: "bg-blue-100 text-blue-800",
  news_media: "bg-orange-100 text-orange-800",
  healthcare_directory: "bg-teal-100 text-teal-800",
  hospital_clinic: "bg-red-100 text-red-800",
  review_platform: "bg-yellow-100 text-yellow-800",
  social_media: "bg-pink-100 text-pink-800",
  market_research: "bg-indigo-100 text-indigo-800",
  jobs_platform: "bg-slate-100 text-slate-800",
  community: "bg-green-100 text-green-800",
  healthcare_provider: "bg-cyan-100 text-cyan-800",
  general_web: "bg-gray-100 text-gray-700",
};

interface CitationRow {
  id: number;
  brand: string;
  domain: string;
  domainCategory: string;
  url: string;
  resolvedUrl: string;
  engines: string[] | null;
  sourceType: string;
  pageTitle: string | null;
  mentionIndex: number;
  context: string;
  fetchStatus: string;
}

export default function CitationViewer({ sessionId = 77 }: { sessionId?: number }) {
  const [search, setSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterEngine, setFilterEngine] = useState("all");

  const { data, isLoading } = useQuery<{ rows: CitationRow[]; total: number }>({
    queryKey: [`/api/citations/session/${sessionId}/rows`],
  });

  const rows = data?.rows || [];

  const brands = useMemo(() => ["all", ...Array.from(new Set(rows.map(r => r.brand))).sort()], [rows]);
  const categories = useMemo(() => ["all", ...Array.from(new Set(rows.map(r => r.domainCategory).filter(Boolean))).sort()], [rows]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (filterBrand !== "all" && r.brand !== filterBrand) return false;
      if (filterCategory !== "all" && r.domainCategory !== filterCategory) return false;
      if (filterEngine !== "all") {
        const engines = r.engines || [];
        if (!engines.includes(filterEngine)) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return (
          r.domain?.toLowerCase().includes(q) ||
          r.brand?.toLowerCase().includes(q) ||
          r.context?.toLowerCase().includes(q) ||
          r.pageTitle?.toLowerCase().includes(q) ||
          r.resolvedUrl?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rows, filterBrand, filterCategory, filterEngine, search]);

  const stats = useMemo(() => {
    const byCategory: Record<string, number> = {};
    const byEngine: Record<string, number> = {};
    for (const r of filtered) {
      byCategory[r.domainCategory] = (byCategory[r.domainCategory] || 0) + 1;
      for (const e of (r.engines || [])) {
        byEngine[e] = (byEngine[e] || 0) + 1;
      }
    }
    return { byCategory, byEngine };
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-muted-foreground">
        Loading citation data…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-4">
          <h1 className="text-lg font-semibold text-gray-900">Session {sessionId} — Citation Data</h1>
          <p className="text-sm text-muted-foreground">{data?.total.toLocaleString()} total rows · {filtered.length.toLocaleString()} shown</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Input
            placeholder="Search domain, brand, context…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-64 h-8 text-sm"
            data-testid="input-search"
          />
          <Select value={filterBrand} onValueChange={setFilterBrand}>
            <SelectTrigger className="w-48 h-8 text-sm" data-testid="select-brand">
              <SelectValue placeholder="All brands" />
            </SelectTrigger>
            <SelectContent>
              {brands.map(b => <SelectItem key={b} value={b}>{b === "all" ? "All brands" : b}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48 h-8 text-sm" data-testid="select-category">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => <SelectItem key={c} value={c}>{c === "all" ? "All categories" : c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterEngine} onValueChange={setFilterEngine}>
            <SelectTrigger className="w-36 h-8 text-sm" data-testid="select-engine">
              <SelectValue placeholder="All engines" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All engines</SelectItem>
              <SelectItem value="chatgpt">ChatGPT</SelectItem>
              <SelectItem value="gemini">Gemini</SelectItem>
              <SelectItem value="claude">Claude</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(stats.byCategory).sort((a,b) => b[1]-a[1]).map(([cat, count]) => (
            <span
              key={cat}
              className={`text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer ${CATEGORY_COLORS[cat] || "bg-gray-100 text-gray-700"}`}
              onClick={() => setFilterCategory(filterCategory === cat ? "all" : cat)}
            >
              {cat} ({count})
            </span>
          ))}
          {Object.entries(stats.byEngine).map(([eng, count]) => (
            <span
              key={eng}
              className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-200 text-slate-700 cursor-pointer"
              onClick={() => setFilterEngine(filterEngine === eng ? "all" : eng)}
            >
              {eng} ({count})
            </span>
          ))}
        </div>

        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 w-32">Brand</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 w-28">Category</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 w-32">Domain</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 w-20">Engine(s)</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 w-40">Page Title</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Context Snippet</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 w-10">URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.slice(0, 500).map(row => (
                  <tr key={row.id} className="hover:bg-gray-50" data-testid={`row-citation-${row.id}`}>
                    <td className="px-3 py-2 font-medium text-gray-800 truncate max-w-[128px]">{row.brand}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[row.domainCategory] || "bg-gray-100 text-gray-600"}`}>
                        {row.domainCategory || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-blue-600 truncate max-w-[128px]">
                      <a href={row.resolvedUrl || row.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {row.domain}
                      </a>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {(row.engines || []).map(e => (
                          <span key={e} className={`px-1 rounded text-xs ${e === "gemini" ? "bg-blue-100 text-blue-700" : e === "chatgpt" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{e}</span>
                        ))}
                        {(!row.engines || row.engines.length === 0) && <span className="text-gray-400">—</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-600 truncate max-w-[160px]" title={row.pageTitle || ""}>{row.pageTitle || "—"}</td>
                    <td className="px-3 py-2 text-gray-700 max-w-md">
                      <p className="line-clamp-2">{row.context}</p>
                    </td>
                    <td className="px-3 py-2">
                      <a href={row.resolvedUrl || row.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">↗</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 500 && (
              <div className="px-3 py-2 text-xs text-muted-foreground border-t">
                Showing 500 of {filtered.length.toLocaleString()} rows — use filters to narrow down
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
