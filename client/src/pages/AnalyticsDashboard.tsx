import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
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

export default function AnalyticsDashboard() {
  const params = useParams<{ sessionId?: string }>();
  const sessionId = parseInt(params.sessionId || "77");
  const [engine, setEngine] = useState<"all" | "chatgpt" | "gemini">("all");

  const { data, isLoading } = useQuery<{ rows: CitationUrlRow[]; sessionId: number }>({
    queryKey: [`/api/citation-urls/summary?sessionId=${sessionId}`],
    staleTime: 30000,
  });

  const rows = data?.rows || [];

  const displayed = rows.map((r) => {
    if (engine === "chatgpt") {
      return {
        ...r,
        total_citations: r.chatgpt_citations,
        total_unique_urls: r.chatgpt_unique_urls,
      };
    }
    if (engine === "gemini") {
      return {
        ...r,
        total_citations: r.gemini_citations,
        total_unique_urls: r.gemini_unique_urls,
      };
    }
    return r;
  }).filter((r) => parseInt(r.total_citations) > 0);

  const grandTotal = displayed.reduce((s, r) => s + parseInt(r.total_citations), 0);
  const grandUnique = displayed.reduce((s, r) => s + parseInt(r.total_unique_urls), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900">Citation Analytics</h1>
          <p className="text-sm text-gray-400 mt-1">Session {sessionId} · citation_urls table</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Citations by Category
            </h2>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 text-xs font-medium">
              {(["all", "chatgpt", "gemini"] as const).map((e) => (
                <button
                  key={e}
                  onClick={() => setEngine(e)}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    engine === e
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

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-24 text-center text-sm text-gray-400">
              No citation data found for session {sessionId}.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Category
                  </th>
                  {engine === "all" && (
                    <>
                      <th className="px-4 py-3 text-right text-xs font-medium text-orange-500 uppercase tracking-wide">
                        ChatGPT
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-orange-400 uppercase tracking-wide">
                        Unique
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-blue-500 uppercase tracking-wide">
                        Gemini
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-blue-400 uppercase tracking-wide">
                        Unique
                      </th>
                    </>
                  )}
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wide">
                    {engine === "all" ? "Total" : "Citations"}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Unique URLs
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((row, i) => (
                  <tr
                    key={row.url_category}
                    className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                    data-testid={`category-row-${i}`}
                  >
                    <td className="px-6 py-3">
                      <span
                        className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${
                          CATEGORY_BADGE[row.url_category] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {row.url_category}
                      </span>
                    </td>
                    {engine === "all" && (
                      <>
                        <td className="px-4 py-3 text-right text-orange-600 font-medium">
                          {parseInt(row.chatgpt_citations).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-orange-400 text-xs">
                          {parseInt(row.chatgpt_unique_urls).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-blue-600 font-medium">
                          {parseInt(row.gemini_citations).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-blue-400 text-xs">
                          {parseInt(row.gemini_unique_urls).toLocaleString()}
                        </td>
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
                  <td className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Total
                  </td>
                  {engine === "all" && (
                    <>
                      <td className="px-4 py-3 text-right text-orange-600 font-bold">
                        {rows.reduce((s, r) => s + parseInt(r.chatgpt_citations), 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-orange-400 text-xs font-semibold">
                        {rows.reduce((s, r) => s + parseInt(r.chatgpt_unique_urls), 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-blue-600 font-bold">
                        {rows.reduce((s, r) => s + parseInt(r.gemini_citations), 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-blue-400 text-xs font-semibold">
                        {rows.reduce((s, r) => s + parseInt(r.gemini_unique_urls), 0).toLocaleString()}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    {grandTotal.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs font-semibold">
                    {grandUnique.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
