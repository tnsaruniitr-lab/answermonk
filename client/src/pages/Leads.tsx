import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";

interface TeaserLead {
  id: number;
  sessionId: number;
  brandName: string;
  interests: string[];
  comments: string | null;
  createdAt: string;
}

interface SummaryLead {
  id: number;
  email: string;
  brandName: string;
  sessionId: number | null;
  sourcePage: string | null;
  createdAt: string;
}

const INTEREST_LABELS: Record<string, string> = {
  regular_report: "Regular reports",
  improve_visibility: "Improve AI visibility",
  other_automations: "Help with automations",
  analysis_for_others: "Analysis for others",
};

export default function Leads() {
  const [tab, setTab] = useState<"all" | "audit" | "teaser">("all");

  const { data: teaserData, isLoading: teaserLoading } = useQuery<{ leads: TeaserLead[] }>({
    queryKey: ["/api/teaser-leads"],
  });

  const { data: allData, isLoading: allLoading } = useQuery<{ summaryLeads: SummaryLead[]; teaserLeads: TeaserLead[] }>({
    queryKey: ["/api/leads"],
  });

  const isLoading = teaserLoading || allLoading;
  const teaserLeads = teaserData?.leads || allData?.teaserLeads || [];
  const summaryLeads = allData?.summaryLeads || [];

  const allLeads = [
    ...summaryLeads.map(l => ({ ...l, type: "audit" as const })),
    ...teaserLeads.map(l => ({ ...l, type: "teaser" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredLeads = tab === "all" ? allLeads : allLeads.filter(l => l.type === tab);

  const auditCount = summaryLeads.length;
  const teaserCount = teaserLeads.length;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="heading-leads">
              Leads
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Submissions from audit and teaser pages
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/history">
              <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer" data-testid="link-history">
                History
              </span>
            </Link>
            <Link href="/prompts">
              <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer" data-testid="link-prompts">
                Prompts
              </span>
            </Link>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { key: "all" as const, label: "All", count: auditCount + teaserCount },
            { key: "audit" as const, label: "Audit Leads", count: auditCount },
            { key: "teaser" as const, label: "Teaser Leads", count: teaserCount },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                tab === t.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
              data-testid={`tab-${t.key}`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground" data-testid="loading-leads">
            Loading leads...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-20" data-testid="empty-leads">
            <p className="text-muted-foreground">No leads yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Leads will appear here when prospects submit forms on your audit or teaser pages.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-[60px_80px_1fr_1fr_1fr_140px] gap-4 px-4 py-2 text-xs font-mono uppercase tracking-wider text-muted-foreground border-b">
              <div>Type</div>
              <div>Session</div>
              <div>Brand</div>
              <div>Contact / Interests</div>
              <div>Details</div>
              <div className="text-right">Date</div>
            </div>
            {filteredLeads.map((lead) => (
              <div
                key={`${lead.type}-${lead.id}`}
                className="grid grid-cols-[60px_80px_1fr_1fr_1fr_140px] gap-4 px-4 py-4 rounded-md border bg-card items-start"
                data-testid={`lead-row-${lead.type}-${lead.id}`}
              >
                <div>
                  <span className={`inline-block text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                    lead.type === "audit"
                      ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                      : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                  }`}>
                    {lead.type === "audit" ? "Audit" : "Teaser"}
                  </span>
                </div>
                <div>
                  {"sessionId" in lead && lead.sessionId ? (
                    <Link href={`/v2/${lead.sessionId}`}>
                      <span className="font-mono text-sm text-primary hover:underline cursor-pointer" data-testid={`link-session-${lead.type}-${lead.id}`}>
                        #{lead.sessionId}
                      </span>
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>
                <div className="text-sm font-medium text-foreground" data-testid={`text-brand-${lead.type}-${lead.id}`}>
                  {lead.brandName}
                </div>
                <div>
                  {lead.type === "audit" ? (
                    <span className="text-sm text-foreground" data-testid={`text-email-${lead.id}`}>
                      {(lead as SummaryLead & { type: "audit" }).email}
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {((lead as TeaserLead & { type: "teaser" }).interests || []).map((interest) => (
                        <span
                          key={interest}
                          className="inline-block text-xs px-2 py-0.5 rounded-sm bg-primary/10 text-primary border border-primary/20"
                          data-testid={`badge-interest-${interest}`}
                        >
                          {INTEREST_LABELS[interest] || interest}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {lead.type === "audit" ? (
                    <span data-testid={`text-source-${lead.id}`}>
                      {(lead as SummaryLead & { type: "audit" }).sourcePage || "—"}
                    </span>
                  ) : (
                    <span data-testid={`text-comments-${lead.id}`}>
                      {(lead as TeaserLead & { type: "teaser" }).comments || "—"}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground text-right font-mono" data-testid={`text-date-${lead.type}-${lead.id}`}>
                  {new Date(lead.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  <br />
                  {new Date(lead.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-xs text-muted-foreground">
          {filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""}
          {tab !== "all" && ` (${auditCount + teaserCount} total)`}
        </div>
      </div>
    </div>
  );
}
