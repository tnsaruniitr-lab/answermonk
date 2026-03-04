import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface TeaserLead {
  id: number;
  sessionId: number;
  brandName: string;
  interests: string[];
  comments: string | null;
  createdAt: string;
}

const INTEREST_LABELS: Record<string, string> = {
  regular_report: "Regular reports",
  improve_visibility: "Improve AI visibility",
  other_automations: "Help with automations",
  analysis_for_others: "Analysis for others",
};

export default function Leads() {
  const { data, isLoading } = useQuery<{ leads: TeaserLead[] }>({
    queryKey: ["/api/teaser-leads"],
  });

  const leads = data?.leads || [];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="heading-leads">
              Teaser Leads
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Submissions from prospect teaser pages
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

        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground" data-testid="loading-leads">
            Loading leads...
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20" data-testid="empty-leads">
            <p className="text-muted-foreground">No leads yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Leads will appear here when prospects submit the survey on your teaser pages.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-[80px_1fr_1fr_1fr_140px] gap-4 px-4 py-2 text-xs font-mono uppercase tracking-wider text-muted-foreground border-b">
              <div>Session</div>
              <div>Brand</div>
              <div>Interests</div>
              <div>Comments</div>
              <div className="text-right">Date</div>
            </div>
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="grid grid-cols-[80px_1fr_1fr_1fr_140px] gap-4 px-4 py-4 rounded-md border bg-card items-start"
                data-testid={`lead-row-${lead.id}`}
              >
                <div>
                  <Link href={`/v2/${lead.sessionId}`}>
                    <span className="font-mono text-sm text-primary hover:underline cursor-pointer" data-testid={`link-session-${lead.sessionId}`}>
                      #{lead.sessionId}
                    </span>
                  </Link>
                </div>
                <div className="text-sm font-medium text-foreground" data-testid={`text-brand-${lead.id}`}>
                  {lead.brandName}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {lead.interests.map((interest) => (
                    <span
                      key={interest}
                      className="inline-block text-xs px-2 py-0.5 rounded-sm bg-primary/10 text-primary border border-primary/20"
                      data-testid={`badge-interest-${interest}`}
                    >
                      {INTEREST_LABELS[interest] || interest}
                    </span>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground" data-testid={`text-comments-${lead.id}`}>
                  {lead.comments || "—"}
                </div>
                <div className="text-xs text-muted-foreground text-right font-mono" data-testid={`text-date-${lead.id}`}>
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
          {leads.length} total lead{leads.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}
