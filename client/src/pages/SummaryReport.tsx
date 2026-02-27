import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Trophy,
  Target,
  Shield,
  AlertTriangle,
  ExternalLink,
  Zap,
  BarChart3,
  Globe,
  MessageSquare,
  ChevronRight,
  Award,
  Eye,
  FileText,
  Check,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface ReportResponse {
  report: any;
}

function tierColor(tier: string) {
  switch (tier) {
    case "T1": return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "T2": return "bg-blue-100 text-blue-800 border-blue-200";
    case "T3": return "bg-amber-100 text-amber-800 border-amber-200";
    case "T4": return "bg-red-100 text-red-800 border-red-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function tierLabel(tier: string) {
  switch (tier) {
    case "T1": return "Major Publication";
    case "T2": return "Social / Mid-tier";
    case "T3": return "Third-party";
    case "T4": return "Competitor-owned";
    default: return tier;
  }
}

function consistencyColor(c: string) {
  switch (c) {
    case "strong": return "text-emerald-600";
    case "moderate": return "text-amber-600";
    case "weak": return "text-red-500";
    default: return "text-muted-foreground";
  }
}

function formatPct(val: number) {
  return `${Math.round(val * 100)}%`;
}

function scoreGrade(rate: number): { label: string; color: string } {
  if (rate >= 0.6) return { label: "Strong", color: "text-emerald-600" };
  if (rate >= 0.3) return { label: "Moderate", color: "text-amber-600" };
  if (rate >= 0.1) return { label: "Weak", color: "text-orange-500" };
  return { label: "Critical", color: "text-red-600" };
}

export default function SummaryReport() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id;

  const { data, isLoading, error } = useQuery<ReportResponse>({
    queryKey: [`/api/multi-segment-sessions/${sessionId}/report`],
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-lg" data-testid="text-loading">Generating summary report...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
          <p className="text-muted-foreground" data-testid="text-error">Failed to load report data.</p>
          <Link href={`/v2/${sessionId}`}>
            <Button variant="outline" data-testid="button-back-to-detail">Back to Detail</Button>
          </Link>
        </div>
      </div>
    );
  }

  const report = data.report;
  const { meta, section1, section2, section3, competitorPlaybook, appendix } = report;

  const allCompetitors = gatherTopCompetitors(competitorPlaybook);
  const brandMentionAudit = gatherBrandMentionAudit(appendix, meta.brandName);
  const biggestGaps = extractBiggestGaps(section3, competitorPlaybook);
  const quickWins = extractQuickWins(section3, competitorPlaybook);
  const authoritySnapshot = buildAuthoritySnapshot(appendix);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/v2/${sessionId}`}>
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Full Report
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-xl font-semibold tracking-tight" data-testid="text-brand-name">{meta.brandName}</h1>
              <p className="text-sm text-muted-foreground">GEO Impact Summary — {meta.segmentCount} segments, {meta.totalRuns} AI responses analyzed</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs" data-testid="badge-date">
            {new Date(meta.analyzedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </Badge>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        <VisibilityScorecard section1={section1} meta={meta} />
        <TopScorersSection competitors={allCompetitors} brandName={meta.brandName} />
        <BrandMentionAudit audit={brandMentionAudit} brandName={meta.brandName} allCompetitors={allCompetitors} />
        <BiggestGaps gaps={biggestGaps} />
        <QuickWinsSection wins={quickWins} />
        <AuthoritySnapshotSection snapshot={authoritySnapshot} brandName={meta.brandName} />
      </main>

      <footer className="border-t border-gray-200 bg-white mt-16">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center text-sm text-muted-foreground">
          Generated by GEO Analyzer — {new Date(meta.analyzedAt).toLocaleString()}
        </div>
      </footer>
    </div>
  );
}

function VisibilityScorecard({ section1, meta }: { section1: any; meta: any }) {
  const overall = section1.overall;
  const grade = scoreGrade(overall.appearanceRate);

  const engines = ["chatgpt", "gemini", "claude"];
  const engineLabels: Record<string, string> = { chatgpt: "ChatGPT", gemini: "Gemini", claude: "Claude" };
  const engineColors: Record<string, string> = {
    chatgpt: "from-green-500 to-emerald-600",
    gemini: "from-blue-500 to-indigo-600",
    claude: "from-orange-500 to-amber-600",
  };

  const engineStats = engines.map(eng => {
    const heatmap = section1.engineHeatmap;
    let totalApp = 0, totalRuns = 0;
    if (heatmap) {
      for (const segKey of Object.keys(heatmap)) {
        const segData = heatmap[segKey];
        if (segData?.[eng]) {
          totalApp += Math.round(segData[eng].appearanceRate * segData[eng].validRuns);
          totalRuns += segData[eng].validRuns;
        }
      }
    }
    const rate = totalRuns > 0 ? totalApp / totalRuns : 0;
    return { engine: eng, label: engineLabels[eng], rate, totalRuns };
  });

  return (
    <section data-testid="section-visibility-scorecard">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <Eye className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Brand Visibility Scorecard</h2>
          <p className="text-sm text-muted-foreground">How often AI engines recommend {meta.brandName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1 border-2 border-primary/20">
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium text-muted-foreground mb-2">Overall Visibility</p>
            <p className={`text-5xl font-bold ${grade.color}`} data-testid="text-overall-rate">{formatPct(overall.appearanceRate)}</p>
            <Badge className={`mt-3 ${grade.color === "text-emerald-600" ? "bg-emerald-100 text-emerald-700" : grade.color === "text-amber-600" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`} data-testid="badge-grade">
              {grade.label}
            </Badge>
            <div className="mt-4 space-y-1 text-xs text-muted-foreground">
              <p>Top 3 Rate: <span className="font-semibold text-foreground">{formatPct(overall.primaryRate)}</span></p>
              <p>Avg Rank: <span className="font-semibold text-foreground">{overall.avgRank ? `#${overall.avgRank.toFixed(1)}` : "N/A"}</span></p>
              <p>Total Responses: <span className="font-semibold text-foreground">{overall.totalValidRuns}</span></p>
            </div>
          </CardContent>
        </Card>

        {engineStats.map(es => (
          <Card key={es.engine} className="overflow-hidden" data-testid={`card-engine-${es.engine}`}>
            <div className={`h-1.5 bg-gradient-to-r ${engineColors[es.engine]}`} />
            <CardContent className="pt-5 text-center">
              <p className="text-sm font-medium text-muted-foreground mb-1">{es.label}</p>
              <p className="text-3xl font-bold" data-testid={`text-engine-rate-${es.engine}`}>{formatPct(es.rate)}</p>
              <p className="text-xs text-muted-foreground mt-2">{es.totalRuns} responses analyzed</p>
              <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full bg-gradient-to-r ${engineColors[es.engine]}`}
                  style={{ width: `${Math.min(es.rate * 100, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function TopScorersSection({ competitors, brandName }: { competitors: TopCompetitorAggregate[]; brandName: string }) {
  const top3 = competitors.slice(0, 3);

  return (
    <section data-testid="section-top-scorers">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">What Top Scorers Are Doing Right</h2>
          <p className="text-sm text-muted-foreground">Why these competitors dominate AI recommendations</p>
        </div>
      </div>

      <div className="space-y-6">
        {top3.map((comp, idx) => (
          <Card key={comp.name} className="overflow-hidden" data-testid={`card-top-scorer-${idx}`}>
            <div className={`h-1 ${idx === 0 ? "bg-amber-400" : idx === 1 ? "bg-gray-400" : "bg-amber-700"}`} />
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? "bg-amber-100 text-amber-700" : idx === 1 ? "bg-gray-100 text-gray-700" : "bg-amber-50 text-amber-800"}`}>
                    #{idx + 1}
                  </div>
                  <div>
                    <CardTitle className="text-lg" data-testid={`text-scorer-name-${idx}`}>{comp.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{comp.totalMentions} total mentions across {comp.segmentsPresent} segment{comp.segmentsPresent > 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {comp.engines.map(eng => (
                    <Badge key={eng} variant="outline" className="text-xs capitalize" data-testid={`badge-engine-${comp.name}-${eng}`}>{eng}</Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {comp.narrative && (
                <div className="bg-gray-50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-line" data-testid={`text-narrative-${idx}`}>
                  {comp.narrative}
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-blue-700" data-testid={`text-mentions-${idx}`}>{comp.totalMentions}</p>
                  <p className="text-xs text-blue-600">Total Mentions</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-emerald-700" data-testid={`text-sources-${idx}`}>{comp.allSources.length}</p>
                  <p className="text-xs text-emerald-600">Non-Brand Sources</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-purple-700" data-testid={`text-avg-rank-${idx}`}>{comp.avgRank ? `#${comp.avgRank.toFixed(1)}` : "—"}</p>
                  <p className="text-xs text-purple-600">Avg Rank</p>
                </div>
              </div>

              {comp.topThemes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Themes AI Associates</p>
                  <div className="flex flex-wrap gap-2">
                    {comp.topThemes.map(t => (
                      <Badge key={t} variant="secondary" className="text-xs" data-testid={`badge-theme-${comp.name}-${t}`}>{t}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sources Backing This Competitor</p>
                <div className="space-y-2">
                  {comp.allSources.map((src, si) => (
                    <div key={si} className="flex items-start gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors" data-testid={`row-source-${comp.name}-${si}`}>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${tierColor(src.tier)}`}>{src.tier}</Badge>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{src.domain}</p>
                        <p className="text-[11px] text-muted-foreground">{tierLabel(src.tier)}</p>
                        {src.urls.map((u, ui) => (
                          <a key={ui} href={u} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5 truncate" data-testid={`link-source-url-${comp.name}-${si}-${ui}`}>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate">{u}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {comp.socialMentions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    <MessageSquare className="w-3 h-3 inline mr-1" />
                    Social & Community Mentions ({comp.socialMentions.length})
                  </p>
                  <div className="space-y-2">
                    {comp.socialMentions.map((sm, si) => (
                      <div key={si} className="flex items-start gap-3 p-2.5 rounded-lg bg-blue-50/50 border border-blue-100" data-testid={`row-social-${comp.name}-${si}`}>
                        <Globe className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{sm.domain}</p>
                          <a href={sm.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate" data-testid={`link-social-url-${comp.name}-${si}`}>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate">{sm.url}</span>
                          </a>
                          {sm.context && <p className="text-xs text-muted-foreground mt-1 italic">"{sm.context}"</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {comp.exampleQuotes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">What AI Says About Them</p>
                  <div className="space-y-2">
                    {comp.exampleQuotes.slice(0, 2).map((eq, qi) => (
                      <div key={qi} className="border-l-2 border-l-primary/30 pl-4 py-2" data-testid={`quote-scorer-${comp.name}-${qi}`}>
                        <p className="text-sm italic text-foreground/80 line-clamp-3">"{eq.quote}"</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] capitalize">{eq.engine}</Badge>
                          {eq.prompt && <span className="text-[10px] text-muted-foreground">Prompt: {eq.prompt}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function BrandMentionAudit({ audit, brandName, allCompetitors }: { audit: BrandMentionAuditData; brandName: string; allCompetitors: TopCompetitorAggregate[] }) {
  const top3Comps = allCompetitors.slice(0, 3);

  return (
    <section data-testid="section-brand-audit">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Brand Mention Audit</h2>
          <p className="text-sm text-muted-foreground">Where {brandName} appears across non-brand sources vs. competitors</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-2 border-blue-200 bg-blue-50/30">
          <CardContent className="pt-5 text-center">
            <p className="text-sm font-medium text-blue-700">{brandName}</p>
            <p className="text-4xl font-bold text-blue-700 mt-1" data-testid="text-brand-source-count">{audit.brandSources.length}</p>
            <p className="text-xs text-blue-600 mt-1">Non-brand sources</p>
          </CardContent>
        </Card>
        {top3Comps.map((comp, i) => (
          <Card key={comp.name} data-testid={`card-comp-audit-${i}`}>
            <CardContent className="pt-5 text-center">
              <p className="text-sm font-medium text-muted-foreground">{comp.name}</p>
              <p className="text-4xl font-bold mt-1" data-testid={`text-comp-source-count-${i}`}>{comp.allSources.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Non-brand sources</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sources Mentioning {brandName}</CardTitle>
        </CardHeader>
        <CardContent>
          {audit.brandSources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-brand-sources">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
              <p>No non-brand sources currently cite {brandName} in AI recommendations.</p>
              <p className="text-sm mt-1">This is a critical gap — see Quick Wins below.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {audit.brandSources.map((src, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded border border-gray-100" data-testid={`row-brand-source-${i}`}>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${tierColor(src.tier)}`}>{src.tier}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{src.domain} <span className="text-xs text-muted-foreground ml-1">{tierLabel(src.tier)}</span></p>
                    {src.urls.map((u, ui) => (
                      <a key={ui} href={u} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5 truncate" data-testid={`link-brand-source-${i}-${ui}`}>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{u}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {audit.byType.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Breakdown by Source Type</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {audit.byType.map(bt => (
                  <div key={bt.type} className="bg-gray-50 rounded-lg p-3 text-center" data-testid={`card-source-type-${bt.type}`}>
                    <p className="text-xl font-bold">{bt.count}</p>
                    <p className="text-xs text-muted-foreground capitalize">{bt.type}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function BiggestGaps({ gaps }: { gaps: GapEntry[] }) {
  if (gaps.length === 0) return null;

  return (
    <section data-testid="section-biggest-gaps">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
          <Target className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Biggest Gaps</h2>
          <p className="text-sm text-muted-foreground">Where the brand is weakest or absent in AI recommendations</p>
        </div>
      </div>

      <div className="space-y-4">
        {gaps.map((gap, i) => (
          <Card key={i} className="bg-red-50/30 border-red-200" data-testid={`card-gap-${i}`}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-base" data-testid={`text-gap-segment-${i}`}>{gap.segmentLabel}</h3>
                  <p className="text-sm text-muted-foreground">{gap.gapType} gap</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className={gap.authority === "absent" || gap.authority === "weak" ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}>
                    Authority: {gap.authority}
                  </Badge>
                  <Badge variant="outline" className={gap.context === "absent" || gap.context === "weak" ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}>
                    Context: {gap.context}
                  </Badge>
                </div>
              </div>
              {gap.quote && (
                <div className="bg-red-50/50 rounded-lg p-3 border-l-2 border-l-red-300">
                  <p className="text-sm italic text-foreground/80" data-testid={`text-gap-quote-${i}`}>"{gap.quote}"</p>
                  <p className="text-xs text-muted-foreground mt-1">— AI says this instead of recommending the brand</p>
                </div>
              )}
              {gap.missingSources.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Missing from these sources:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {gap.missingSources.slice(0, 6).map(ms => (
                      <Badge key={ms.domain} variant="outline" className={`text-[10px] ${tierColor(ms.tier)}`} data-testid={`badge-missing-${ms.domain}`}>
                        {ms.domain} ({ms.tier})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function QuickWinsSection({ wins }: { wins: QuickWin[] }) {
  if (wins.length === 0) return null;

  return (
    <section data-testid="section-quick-wins">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quick Wins</h2>
          <p className="text-sm text-muted-foreground">Highest-impact actions to improve AI visibility</p>
        </div>
      </div>

      <div className="space-y-3">
        {wins.map((win, i) => (
          <Card key={i} className="bg-emerald-50/30 border-emerald-200" data-testid={`card-quickwin-${i}`}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium leading-relaxed" data-testid={`text-quickwin-${i}`}>{win.action}</p>
                  {win.segment && <p className="text-xs text-muted-foreground mt-1">Segment: {win.segment}</p>}
                  {win.getListedUrls && win.getListedUrls.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {win.getListedUrls.map((url, ui) => (
                        <a key={ui} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1" data-testid={`link-getlisted-${i}-${ui}`}>
                          <ExternalLink className="w-3 h-3" />
                          {url.replace(/https?:\/\/(www\.)?/, "").split("/")[0]}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function AuthoritySnapshotSection({ snapshot, brandName }: { snapshot: AuthorityDomain[]; brandName: string }) {
  if (snapshot.length === 0) return null;

  return (
    <section data-testid="section-authority-snapshot">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Authority Source Snapshot</h2>
          <p className="text-sm text-muted-foreground">Top domains AI engines cite — who they mention</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-authority">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Domain</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tier</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">URLs</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Entities Mentioned</th>
                  <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{brandName}?</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.map((d, i) => {
                  const mentionsBrand = d.mentionedEntities.some(e => e.toLowerCase().includes(brandName.toLowerCase()));
                  return (
                    <tr key={i} className={`border-b border-gray-50 ${mentionsBrand ? "bg-emerald-50/30" : ""}`} data-testid={`row-authority-${i}`}>
                      <td className="py-2.5 px-3 font-medium">{d.domain}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className={`text-[10px] ${tierColor(d.tier)}`}>{d.tier}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground">{d.urlCount}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          {d.mentionedEntities.slice(0, 5).map(e => (
                            <span key={e} className={`text-xs px-1.5 py-0.5 rounded ${e.toLowerCase().includes(brandName.toLowerCase()) ? "bg-emerald-100 text-emerald-700 font-semibold" : "bg-gray-100 text-gray-600"}`}>
                              {e}
                            </span>
                          ))}
                          {d.mentionedEntities.length > 5 && <span className="text-xs text-muted-foreground">+{d.mentionedEntities.length - 5}</span>}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {mentionsBrand ? (
                          <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-red-400 mx-auto" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

interface TopCompetitorAggregate {
  name: string;
  totalMentions: number;
  segmentsPresent: number;
  engines: string[];
  avgRank: number | null;
  topThemes: string[];
  narrative: string;
  allSources: Array<{ domain: string; tier: string; urls: string[] }>;
  socialMentions: Array<{ domain: string; url: string; context: string }>;
  exampleQuotes: Array<{ quote: string; engine: string; prompt?: string }>;
}

function gatherTopCompetitors(playbook: any): TopCompetitorAggregate[] {
  const map = new Map<string, TopCompetitorAggregate & { _rankSum: number; _rankCount: number }>();

  for (const seg of (playbook?.perSegment ?? [])) {
    for (const comp of (seg?.topCompetitors ?? [])) {
      const mentions = comp.quickStats?.totalMentions || comp.appearances || 0;
      const currentRank = comp.quickStats?.avgRankAcrossEngines ?? null;
      const existing = map.get(comp.name);
      if (existing) {
        existing.totalMentions += mentions;
        existing.segmentsPresent += 1;
        if (currentRank !== null) {
          existing._rankSum += currentRank * mentions;
          existing._rankCount += mentions;
        }

        for (const src of (comp.authoritySources ?? [])) {
          if (!src.isAIInfra && !existing.allSources.some((s: any) => s.domain === src.domain)) {
            existing.allSources.push({ domain: src.domain, tier: src.tier, urls: src.urls || [] });
          }
        }

        for (const sm of (comp.socialMentions ?? [])) {
          if (!existing.socialMentions.some((s: any) => s.url === sm.url)) {
            existing.socialMentions.push(sm);
          }
        }

        for (const eq of (comp.exampleQuotes ?? [])) {
          if (existing.exampleQuotes.length < 3 && !existing.exampleQuotes.some((q: any) => q.quote === eq.quote)) {
            existing.exampleQuotes.push(eq);
          }
        }

        const newEngines = Object.keys(comp.enginePresence || {}).filter(e => (comp.enginePresence[e]?.appearances || 0) > 0);
        for (const e of newEngines) {
          if (!existing.engines.includes(e)) existing.engines.push(e);
        }

        for (const t of (comp.quickStats?.topThemes ?? [])) {
          if (!existing.topThemes.includes(t) && existing.topThemes.length < 6) existing.topThemes.push(t);
        }

        if (!existing.narrative && comp.narrative) existing.narrative = comp.narrative;
      } else {
        map.set(comp.name, {
          name: comp.name,
          totalMentions: mentions,
          segmentsPresent: 1,
          engines: Object.keys(comp.enginePresence || {}).filter(e => (comp.enginePresence[e]?.appearances || 0) > 0),
          avgRank: currentRank,
          topThemes: comp.quickStats?.topThemes ?? [],
          narrative: comp.narrative || "",
          allSources: (comp.authoritySources ?? []).filter((s: any) => !s.isAIInfra).map((s: any) => ({ domain: s.domain, tier: s.tier, urls: s.urls || [] })),
          socialMentions: comp.socialMentions ?? [],
          exampleQuotes: (comp.exampleQuotes ?? []).slice(0, 3),
          _rankSum: currentRank !== null ? currentRank * mentions : 0,
          _rankCount: currentRank !== null ? mentions : 0,
        });
      }
    }
  }

  const results = Array.from(map.values()).map(({ _rankSum, _rankCount, ...rest }) => ({
    ...rest,
    avgRank: _rankCount > 0 ? _rankSum / _rankCount : null,
  }));

  return results.sort((a, b) => b.totalMentions - a.totalMentions);
}

interface BrandMentionAuditData {
  brandSources: Array<{ domain: string; tier: string; urls: string[] }>;
  byType: Array<{ type: string; count: number }>;
}

function gatherBrandMentionAudit(appendix: any, brandName: string): BrandMentionAuditData {
  const brandSources: Array<{ domain: string; tier: string; urls: string[] }> = [];
  const typeCounts: Record<string, number> = {};

  const tiers = appendix?.domainsByTier ?? {};
  for (const [tier, domains] of Object.entries(tiers) as [string, any[]][]) {
    if (tier === "brand_owned") continue;

    for (const d of domains) {
      const mentionsBrand = (d.mentionedEntities || []).some((e: string) => e.toLowerCase().includes(brandName.toLowerCase()));
      if (mentionsBrand) {
        brandSources.push({ domain: d.domain, tier, urls: d.urls || [] });

        let sourceType = "publication";
        const dm = d.domain.toLowerCase();
        if (dm.includes("reddit") || dm.includes("quora") || dm.includes("trustpilot") || dm.includes("twitter") || dm.includes("facebook") || dm.includes("linkedin")) {
          sourceType = "social";
        } else if (dm.includes("g2") || dm.includes("capterra") || dm.includes("crunchbase") || dm.includes("glassdoor")) {
          sourceType = "directory";
        } else if (tier === "T1") {
          sourceType = "major publication";
        } else if (tier === "T3" || tier === "T4") {
          sourceType = "third-party";
        }

        typeCounts[sourceType] = (typeCounts[sourceType] || 0) + 1;
      }
    }
  }

  const byType = Object.entries(typeCounts).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
  return { brandSources, byType };
}

interface GapEntry {
  segmentLabel: string;
  gapType: string;
  authority: string;
  context: string;
  quote: string | null;
  missingSources: Array<{ domain: string; tier: string }>;
}

function extractBiggestGaps(section3: any, playbook: any): GapEntry[] {
  const gaps: GapEntry[] = [];
  const gapAnalysis = section3?.gapAnalysis ?? [];
  const recs = section3?.recommendations ?? [];

  for (let i = 0; i < gapAnalysis.length; i++) {
    const ga = gapAnalysis[i];
    const rec = recs[i];

    const authorityBad = ga.authority?.label === "absent" || ga.authority?.label === "weak";
    const contextBad = ga.context?.label === "absent" || ga.context?.label === "weak";

    if (!authorityBad && !contextBad) continue;

    let quote: string | null = null;
    const segPlaybook = playbook.perSegment?.find((s: any) => s.segmentLabel === ga.segmentLabel);
    if (segPlaybook?.topCompetitors?.[0]?.exampleQuotes?.[0]) {
      quote = segPlaybook.topCompetitors[0].exampleQuotes[0].quote;
      if (quote && quote.length > 200) quote = quote.substring(0, 200) + "...";
    }

    gaps.push({
      segmentLabel: ga.segmentLabel,
      gapType: ga.gapType || "multiple",
      authority: ga.authority?.label || "unknown",
      context: ga.context?.label || "unknown",
      quote,
      missingSources: rec?.missingSources || [],
    });
  }

  return gaps.sort((a, b) => {
    const scoreA = (a.authority === "absent" ? 2 : a.authority === "weak" ? 1 : 0) + (a.context === "absent" ? 2 : a.context === "weak" ? 1 : 0);
    const scoreB = (b.authority === "absent" ? 2 : b.authority === "weak" ? 1 : 0) + (b.context === "absent" ? 2 : b.context === "weak" ? 1 : 0);
    return scoreB - scoreA;
  }).slice(0, 3);
}

interface QuickWin {
  action: string;
  segment: string | null;
  getListedUrls: string[];
}

function extractQuickWins(section3: any, playbook: any): QuickWin[] {
  const wins: QuickWin[] = [];
  const recs = section3?.recommendations ?? [];
  const seen = new Set<string>();

  for (const rec of recs) {
    if (rec.quickWins && !seen.has(rec.quickWins)) {
      seen.add(rec.quickWins);
      wins.push({ action: rec.quickWins, segment: rec.segmentLabel, getListedUrls: rec.getListedHere ?? [] });
    }
    if (rec.secondaryAction && !seen.has(rec.secondaryAction) && wins.length < 5) {
      seen.add(rec.secondaryAction);
      wins.push({ action: rec.secondaryAction, segment: rec.segmentLabel, getListedUrls: [] });
    }
  }

  for (const seg of (playbook?.perSegment ?? [])) {
    for (const comp of (seg?.topCompetitors ?? [])) {
      for (const da of (comp?.derivedActions ?? [])) {
        if (!seen.has(da) && wins.length < 7) {
          seen.add(da);
          wins.push({ action: da, segment: seg.segmentLabel, getListedUrls: [] });
        }
      }
    }
  }

  return wins.slice(0, 7);
}

interface AuthorityDomain {
  domain: string;
  tier: string;
  urlCount: number;
  mentionedEntities: string[];
}

function buildAuthoritySnapshot(appendix: any): AuthorityDomain[] {
  const domains: AuthorityDomain[] = [];
  const tiers = appendix?.domainsByTier ?? {};

  for (const [tier, list] of Object.entries(tiers) as [string, any[]][]) {
    if (tier === "brand_owned" || tier === "T4") continue;
    for (const d of list) {
      domains.push({
        domain: d.domain,
        tier,
        urlCount: (d.urls || []).length,
        mentionedEntities: d.mentionedEntities || [],
      });
    }
  }

  return domains
    .sort((a, b) => {
      const tierOrder: Record<string, number> = { T1: 0, T2: 1, T3: 2 };
      const tierDiff = (tierOrder[a.tier] ?? 3) - (tierOrder[b.tier] ?? 3);
      if (tierDiff !== 0) return tierDiff;
      return b.urlCount - a.urlCount;
    })
    .slice(0, 25);
}
