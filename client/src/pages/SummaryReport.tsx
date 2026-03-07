import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { getBrandConfig } from "@/lib/brand-config";
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
  ChevronDown,
  Award,
  Eye,
  FileText,
  Check,
  X,
  Lock,
  Mail,
  Send,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";

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
  const [location] = useLocation();
  const isShareView = location.startsWith("/share/");

  const { data: authData } = useQuery<{ authenticated: boolean }>({
    queryKey: ["/api/auth/check"],
    staleTime: 60_000,
  });
  const isAdmin = authData?.authenticated === true;
  const lockActionPlan = !isAdmin;
  const isGroupKey = sessionId?.startsWith("v2auto-") || false;
  const isSlug = sessionId ? isNaN(Number(sessionId)) && !isGroupKey : false;

  const reportUrl = isSlug
    ? `/api/share/summary/by-slug/${sessionId}`
    : isGroupKey
    ? `/api/scoring/v2-groups/${sessionId}/report`
    : `/api/multi-segment-sessions/${sessionId}/report`;

  const { data, isLoading, error } = useQuery<ReportResponse>({
    queryKey: [reportUrl],
    queryFn: async () => {
      const res = await fetch(reportUrl);
      if (!res.ok) throw new Error("Failed to load report");
      return res.json();
    },
    staleTime: Infinity,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-lg" data-testid="text-loading">Loading summary report...</p>
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
          {!isShareView && (
            <Link href={`/v2/${sessionId}`}>
              <Button variant="outline" data-testid="button-back-to-detail">Back to Detail</Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  const report = data.report;
  const { meta, section1, section2, section3, competitorPlaybook, appendix } = report;

  const allCompetitors = gatherTopCompetitors(competitorPlaybook);
  const brandMentionAudit = gatherBrandMentionAudit(section2, meta.brandName);
  const biggestGaps = extractBiggestGaps(section3, competitorPlaybook);
  const consolidatedWins = extractConsolidatedWins(section3, competitorPlaybook, allCompetitors, section1);
  const authoritySnapshot = buildAuthoritySnapshot(appendix);
  const brandConfig = getBrandConfig(meta.brandName);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {isShareView && brandConfig ? (
        <header className="sticky top-0 z-50" style={{ backgroundColor: brandConfig.primaryColor }}>
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={brandConfig.logoUrl} alt={brandConfig.displayName} className="h-8 object-contain" data-testid="img-brand-logo" />
              <div className="h-6 w-px bg-white/30" />
              <div>
                <h1 className="text-lg font-semibold text-white tracking-tight" data-testid="text-brand-name">AI Visibility Report</h1>
                <p className="text-xs text-white/70">{meta.segmentCount} segments, {meta.totalRuns} AI responses analyzed</p>
              </div>
            </div>
            <span className="text-xs text-white/60" data-testid="badge-date">
              {new Date(meta.analyzedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </header>
      ) : (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!isShareView && (
                <>
                  <Link href={`/v2/${sessionId}`}>
                    <Button variant="ghost" size="sm" data-testid="button-back">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Full Report
                    </Button>
                  </Link>
                  <Separator orientation="vertical" className="h-6" />
                </>
              )}
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
      )}

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        <VisibilityScorecard section1={section1} section2={section2} meta={meta} />
        <SegmentBreakdown section2={section2} section1={section1} brandName={meta.brandName} />
        <TopScorersSection competitors={allCompetitors} brandName={meta.brandName} />
        <BrandMentionAudit audit={brandMentionAudit} brandName={meta.brandName} allCompetitors={allCompetitors} />
        <BiggestGaps gaps={biggestGaps} />
        <ConsolidatedWinsSection wins={consolidatedWins} locked={lockActionPlan} brandName={meta.brandName} sessionId={meta.sessionId} />
        <AuthoritySnapshotSection snapshot={authoritySnapshot} brandName={meta.brandName} />
        <AllCitationSourcesSection appendix={appendix} />
      </main>

      <footer className="border-t border-gray-200 mt-16" style={isShareView && brandConfig ? { backgroundColor: brandConfig.primaryColor } : { backgroundColor: "white" }}>
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          {isShareView && brandConfig ? (
            <>
              <img src={brandConfig.logoUrl} alt={brandConfig.displayName} className="h-6 object-contain opacity-70" />
              <p className="text-xs text-white/50">AI Visibility Report — {new Date(meta.analyzedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground w-full text-center">
              Generated by GEO Analyzer — {new Date(meta.analyzedAt).toLocaleString()}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}

function buildRankingTable(section2: any, brandName: string, section1: any) {
  const segments = section2?.perSegment ?? [];
  if (segments.length === 0) return [];

  const brandKey = brandName.toLowerCase().trim();
  const competitorMap: Record<string, { totalShare: number; segCount: number; segments: Record<string, number> }> = {};

  const brandOverall = section1?.overall;
  const brandPerSeg = section1?.perSegment ?? [];

  segments.forEach((seg: any, idx: number) => {
    const segLabel = seg.segmentLabel || `Segment ${idx + 1}`;
    const top5 = seg.top5 ?? [];
    top5.forEach((c: any) => {
      const key = c.name.toLowerCase().trim();
      if (!competitorMap[key]) competitorMap[key] = { totalShare: 0, segCount: 0, segments: {} };
      competitorMap[key].totalShare += (c.share ?? 0);
      competitorMap[key].segCount += 1;
      competitorMap[key].segments[segLabel] = c.share ?? 0;
    });
  });

  const segLabels = segments.map((s: any, i: number) => s.segmentLabel || `Segment ${i + 1}`);

  const rows = Object.entries(competitorMap)
    .map(([key, val]) => ({
      name: key,
      avgShare: val.totalShare / segments.length,
      perSegment: segLabels.map((sl: string) => val.segments[sl] ?? 0),
      isBrand: false,
    }))
    .sort((a, b) => b.avgShare - a.avgShare)
    .slice(0, 7);

  const brandAvgShare = brandOverall?.appearanceRate ?? 0;
  const brandRow = {
    name: brandName,
    avgShare: brandAvgShare,
    perSegment: segLabels.map((_sl: string, idx: number) => brandPerSeg[idx]?.appearanceRate ?? 0),
    isBrand: true,
  };

  const alreadyInList = rows.some(r => r.name === brandKey);
  if (!alreadyInList) {
    rows.push(brandRow);
  } else {
    const existing = rows.find(r => r.name === brandKey);
    if (existing) existing.isBrand = true;
  }

  rows.sort((a, b) => b.avgShare - a.avgShare);

  return { rows, segLabels };
}

function VisibilityScorecard({ section1, section2, meta }: { section1: any; section2: any; meta: any }) {
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
    let totalApp = 0, totalRuns = 0, totalPrimary = 0;
    if (heatmap) {
      for (const segKey of Object.keys(heatmap)) {
        const segData = heatmap[segKey];
        if (segData?.[eng]) {
          totalApp += Math.round(segData[eng].appearanceRate * segData[eng].validRuns);
          totalPrimary += Math.round((segData[eng].primaryRate ?? 0) * segData[eng].validRuns);
          totalRuns += segData[eng].validRuns;
        }
      }
    }
    const rate = totalRuns > 0 ? totalApp / totalRuns : 0;
    const top3Rate = totalRuns > 0 ? totalPrimary / totalRuns : 0;
    return { engine: eng, label: engineLabels[eng], rate, top3Rate, totalRuns };
  });

  const ranking = buildRankingTable(section2, meta.brandName, section1);
  const showRanking = ranking && ranking.rows && ranking.rows.length > 0 && overall.appearanceRate >= 0.2;

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
      <p className="text-xl font-bold text-foreground mb-6">Your customers ask AI - are you the answer?</p>

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
              <p className="text-xs text-muted-foreground mt-1">Top 3: <span className="font-semibold text-foreground">{formatPct(es.top3Rate)}</span></p>
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

      {showRanking && (
        <Card className="mt-6" data-testid="card-ranking-table">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <CardTitle className="text-lg">Competitive Ranking</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">Where {meta.brandName} ranks against competitors across all segments</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-ranking">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground w-8">#</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">Brand</th>
                    <th className="text-center py-3 px-3 font-medium text-muted-foreground">Overall</th>
                    {ranking.segLabels.map((sl: string) => (
                      <th key={sl} className="text-center py-3 px-3 font-medium text-muted-foreground whitespace-nowrap">{sl}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ranking.rows.map((row: any, idx: number) => (
                    <tr
                      key={row.name}
                      className={`border-b border-gray-100 ${row.isBrand ? "bg-primary/5 font-semibold" : "hover:bg-gray-50"}`}
                      data-testid={`row-ranking-${idx}`}
                    >
                      <td className="py-3 px-3 text-muted-foreground">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          {row.isBrand && <div className="w-2 h-2 rounded-full bg-primary" />}
                          <span className={row.isBrand ? "text-primary" : ""}>{row.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 bg-gray-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${row.isBrand ? "bg-primary" : "bg-gray-400"}`}
                              style={{ width: `${Math.min(row.avgShare * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono w-10">{formatPct(row.avgShare)}</span>
                        </div>
                      </td>
                      {row.perSegment.map((val: number, si: number) => (
                        <td key={si} className="py-3 px-3 text-center">
                          <span className={`text-xs font-mono ${val === 0 ? "text-gray-300" : val >= 0.5 ? "text-emerald-600 font-semibold" : ""}`}>
                            {val === 0 ? "—" : formatPct(val)}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

interface CategoryGroup {
  key: string;
  title: string;
  description: string;
  segmentIndices: number[];
  icon: string;
}

function categorizeSegments(segments: any[]): CategoryGroup[] {
  const general: number[] = [];
  const byService: number[] = [];
  const byCustomer: number[] = [];
  const byBoth: number[] = [];

  segments.forEach((seg: any, idx: number) => {
    const hasSvc = !!(seg.serviceType && seg.serviceType.trim());
    const hasCust = !!(seg.customerType && seg.customerType.trim());
    if (hasSvc && hasCust) byBoth.push(idx);
    else if (hasSvc) byService.push(idx);
    else if (hasCust) byCustomer.push(idx);
    else general.push(idx);
  });

  const groups: CategoryGroup[] = [];
  if (general.length > 0) groups.push({ key: "general", title: "General Search", description: "How you rank in general agency searches", segmentIndices: general, icon: "globe" });
  if (byService.length > 0) groups.push({ key: "service", title: "By Service Type", description: "How you rank when customers search for a specific service", segmentIndices: byService, icon: "service" });
  if (byCustomer.length > 0) groups.push({ key: "customer", title: "By Customer Type", description: "How you rank when a specific industry searches for you", segmentIndices: byCustomer, icon: "customer" });
  if (byBoth.length > 0) groups.push({ key: "niche", title: "By Service + Customer Niche", description: "How you rank when a specific industry searches for a specific service", segmentIndices: byBoth, icon: "niche" });
  return groups;
}

function computeCategoryAggregates(segmentIndices: number[], segments: any[], brandPerSeg: any[], brandName: string) {
  const brandKey = brandName.toLowerCase().trim();
  let totalApp = 0, totalRuns = 0, rankWeightedSum = 0, rankWeightTotal = 0;
  const compMap: Record<string, { appearances: number; totalRuns: number }> = {};

  for (const idx of segmentIndices) {
    const seg = segments[idx];
    const brandSeg = brandPerSeg[idx];
    if (brandSeg) {
      const segAppearances = Math.round((brandSeg.appearanceRate ?? 0) * (brandSeg.validRuns ?? 0));
      totalApp += segAppearances;
      totalRuns += brandSeg.validRuns ?? 0;
      if (brandSeg.avgRank != null && segAppearances > 0) {
        rankWeightedSum += brandSeg.avgRank * segAppearances;
        rankWeightTotal += segAppearances;
      }
    }
    for (const c of (seg.top5 ?? [])) {
      if (c.name.toLowerCase().trim() === brandKey) continue;
      if (!compMap[c.name]) compMap[c.name] = { appearances: 0, totalRuns: 0 };
      compMap[c.name].appearances += c.appearances ?? 0;
      compMap[c.name].totalRuns += seg.top5?.reduce((s: number, x: any) => s + (x.appearances ?? 0), 0) ?? 0;
    }
  }

  const brandVisibility = totalRuns > 0 ? Math.round((totalApp / totalRuns) * 100) : 0;
  const avgRank = rankWeightTotal > 0 ? Math.round((rankWeightedSum / rankWeightTotal) * 10) / 10 : null;

  const topComps = Object.entries(compMap)
    .map(([name, d]) => ({ name, appearances: d.appearances }))
    .sort((a, b) => b.appearances - a.appearances)
    .slice(0, 3);

  const totalCompAppearances = Object.values(compMap).reduce((s, d) => s + d.appearances, 0);
  const top3WithRate = topComps.map(c => ({
    name: c.name,
    rate: totalCompAppearances > 0 ? Math.round((c.appearances / (totalRuns || 1)) * 100) : 0,
  }));

  return { brandVisibility, avgRank, top3: top3WithRate };
}

function CategoryAccordion({ group, segments, brandPerSeg, brandName, colorSet }: {
  group: CategoryGroup;
  segments: any[];
  brandPerSeg: any[];
  brandName: string;
  colorSet: { bar: string; bg: string; text: string; accent: string; border: string };
}) {
  const [expanded, setExpanded] = useState(false);
  const agg = computeCategoryAggregates(group.segmentIndices, segments, brandPerSeg, brandName);
  const visColor = agg.brandVisibility >= 50 ? "text-emerald-600" : agg.brandVisibility >= 25 ? "text-amber-600" : "text-red-500";
  const brandKey = brandName.toLowerCase().trim();

  const uniqueServices = [...new Set(group.segmentIndices.map(i => segments[i]?.serviceType).filter(Boolean))];
  const uniqueCustomers = [...new Set(group.segmentIndices.map(i => segments[i]?.customerType).filter(Boolean))];

  const segColors = [
    { bar: "bg-indigo-500", bg: "bg-indigo-50", text: "text-indigo-700" },
    { bar: "bg-teal-500", bg: "bg-teal-50", text: "text-teal-700" },
    { bar: "bg-rose-500", bg: "bg-rose-50", text: "text-rose-700" },
    { bar: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
  ];

  return (
    <div className={`rounded-xl border ${colorSet.border} overflow-hidden`} data-testid={`category-${group.key}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors ${expanded ? "border-b" : ""}`}
        data-testid={`button-toggle-${group.key}`}
      >
        <div className={`w-9 h-9 rounded-lg ${colorSet.bg} flex items-center justify-center shrink-0`}>
          {group.icon === "globe" && <Globe className={`w-4.5 h-4.5 ${colorSet.text}`} />}
          {group.icon === "service" && <Zap className={`w-4.5 h-4.5 ${colorSet.text}`} />}
          {group.icon === "customer" && <Eye className={`w-4.5 h-4.5 ${colorSet.text}`} />}
          {group.icon === "niche" && <Target className={`w-4.5 h-4.5 ${colorSet.text}`} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="font-semibold text-base">{group.title}</h3>
            <Badge variant="outline" className="text-[11px]">{group.segmentIndices.length} segment{group.segmentIndices.length > 1 ? "s" : ""}</Badge>
          </div>
          {(uniqueServices.length > 0 || uniqueCustomers.length > 0) && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {uniqueServices.map(s => (
                <Badge key={s} variant="outline" className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 border-indigo-300 font-medium">⚡ {s}</Badge>
              ))}
              {uniqueCustomers.map(c => (
                <Badge key={c} variant="outline" className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 border-amber-300 font-medium">👥 {c}</Badge>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span>Visibility: <span className={`font-bold text-base ${visColor}`}>{agg.brandVisibility}%</span></span>
            {agg.avgRank !== null && <span>Avg Rank: <span className="font-bold text-base text-foreground">#{agg.avgRank}</span></span>}
            {agg.top3.length > 0 && (
              <span className="hidden sm:inline">Top 3: {agg.top3.map((c, i) => (
                <span key={c.name}>{i > 0 ? ", " : ""}<span className="font-semibold text-foreground">{c.name}</span> <span className="text-xs">({c.rate}%)</span></span>
              ))}</span>
            )}
          </div>
        </div>
        <div className={`shrink-0 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </button>

      {expanded && (
        <div className="p-5 bg-gray-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {group.segmentIndices.map((si, localIdx) => {
              const seg = segments[si];
              const competitors = (seg.top5 ?? []).slice(0, 10);
              const brandAlreadyIn = competitors.some((c: any) => c.name.toLowerCase().trim() === brandKey);
              let combined = [...competitors];
              if (!brandAlreadyIn && brandPerSeg[si]) {
                combined.push({ name: brandName, share: brandPerSeg[si].appearanceRate ?? 0, appearances: Math.round((brandPerSeg[si].appearanceRate ?? 0) * (brandPerSeg[si].validRuns ?? 0)), _isBrand: true });
              }
              combined.sort((a: any, b: any) => (b.share ?? 0) - (a.share ?? 0));
              combined = combined.slice(0, 10);
              const color = segColors[localIdx % segColors.length];
              const maxShare = combined.length > 0 ? Math.max(...combined.map((c: any) => c.share ?? 0)) : 1;

              return (
                <Card key={si} className="overflow-hidden" data-testid={`card-segment-${si}`}>
                  <div className={`h-1 ${color.bar}`} />
                  <CardContent className="pt-5 pb-5">
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <Target className={`w-4 h-4 ${color.text}`} />
                        <h3 className="font-semibold text-sm" data-testid={`text-segment-label-${si}`}>{seg.segmentLabel}</h3>
                      </div>
                      {(seg.serviceType || seg.customerType) && (
                        <div className="flex flex-wrap gap-1.5 mt-2 ml-6">
                          {seg.serviceType && <Badge variant="outline" className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 border-indigo-300 font-medium" data-testid={`badge-svc-${si}`}>⚡ {seg.serviceType}</Badge>}
                          {seg.customerType && <Badge variant="outline" className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 border-amber-300 font-medium" data-testid={`badge-cust-${si}`}>👥 {seg.customerType}</Badge>}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2.5">
                      {combined.map((comp: any, ci: number) => {
                        const pct = Math.round((comp.share ?? 0) * 100);
                        const isBrand = comp._isBrand || comp.name.toLowerCase().trim() === brandKey;
                        return (
                          <div key={ci} className={`flex items-center gap-3 ${isBrand ? "py-1 px-2 -mx-2 rounded-lg bg-primary/5" : ""}`} data-testid={`row-competitor-${si}-${ci}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isBrand ? "bg-primary text-primary-foreground" : "bg-gray-100 text-gray-500"}`}>
                              {ci + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-sm truncate ${isBrand ? "font-bold text-primary" : "font-medium"}`} data-testid={`text-comp-name-${si}-${ci}`}>{comp.name}</span>
                                <span className={`text-sm font-semibold ml-2 shrink-0 ${isBrand ? "text-primary" : color.text}`} data-testid={`text-comp-rate-${si}-${ci}`}>{pct}%</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${isBrand ? "bg-primary" : color.bar} transition-all`} style={{ width: `${((comp.share ?? 0) / maxShare) * 100}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3">{combined.reduce((s: number, c: any) => s + (c.appearances ?? 0), 0)} total appearances across all prompts</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SegmentBreakdown({ section2, section1, brandName }: { section2: any; section1: any; brandName: string }) {
  const segments = section2?.perSegment ?? [];
  const brandPerSeg = section1?.perSegment ?? [];
  if (segments.length === 0) return null;

  const groups = categorizeSegments(segments);
  const hasMultipleCategories = groups.length > 1;

  const categoryColors: Record<string, { bar: string; bg: string; text: string; accent: string; border: string }> = {
    general: { bar: "bg-slate-500", bg: "bg-slate-100", text: "text-slate-700", accent: "bg-slate-50", border: "border-slate-200" },
    service: { bar: "bg-blue-500", bg: "bg-blue-100", text: "text-blue-700", accent: "bg-blue-50", border: "border-blue-200" },
    customer: { bar: "bg-violet-500", bg: "bg-violet-100", text: "text-violet-700", accent: "bg-violet-50", border: "border-violet-200" },
    niche: { bar: "bg-emerald-500", bg: "bg-emerald-100", text: "text-emerald-700", accent: "bg-emerald-50", border: "border-emerald-200" },
  };

  const segColors = [
    { bar: "bg-indigo-500", bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-200" },
    { bar: "bg-teal-500", bg: "bg-teal-50", text: "text-teal-700", ring: "ring-teal-200" },
    { bar: "bg-rose-500", bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200" },
    { bar: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  ];

  if (!hasMultipleCategories) {
    return (
      <section data-testid="section-segment-breakdown">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Who Shows Up When Your Customers Search</h2>
            <p className="text-sm text-muted-foreground">Top 10 per segment — including {brandName} — based on AI engine responses</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {segments.map((seg: any, si: number) => {
            const competitors = (seg.top5 ?? []).slice(0, 10);
            const brandKey = brandName.toLowerCase().trim();
            const brandAlreadyIn = competitors.some((c: any) => c.name.toLowerCase().trim() === brandKey);
            let combined = [...competitors];
            if (!brandAlreadyIn && brandPerSeg[si]) {
              combined.push({ name: brandName, share: brandPerSeg[si].appearanceRate ?? 0, appearances: Math.round((brandPerSeg[si].appearanceRate ?? 0) * (brandPerSeg[si].validRuns ?? 0)), _isBrand: true });
            }
            combined.sort((a: any, b: any) => (b.share ?? 0) - (a.share ?? 0));
            combined = combined.slice(0, 10);
            const color = segColors[si % segColors.length];
            const maxShare = combined.length > 0 ? Math.max(...combined.map((c: any) => c.share ?? 0)) : 1;
            return (
              <Card key={si} className="overflow-hidden" data-testid={`card-segment-${si}`}>
                <div className={`h-1 ${color.bar}`} />
                <CardContent className="pt-5 pb-5">
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <Target className={`w-4 h-4 ${color.text}`} />
                      <h3 className="font-semibold text-sm" data-testid={`text-segment-label-${si}`}>{seg.segmentLabel}</h3>
                    </div>
                    {(seg.serviceType || seg.customerType) && (
                      <div className="flex flex-wrap gap-1.5 mt-2 ml-6">
                        {seg.serviceType && <Badge variant="outline" className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 border-indigo-300 font-medium" data-testid={`badge-svc-${si}`}>⚡ {seg.serviceType}</Badge>}
                        {seg.customerType && <Badge variant="outline" className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 border-amber-300 font-medium" data-testid={`badge-cust-${si}`}>👥 {seg.customerType}</Badge>}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    {combined.map((comp: any, ci: number) => {
                      const pct = Math.round((comp.share ?? 0) * 100);
                      const isBrand = comp._isBrand || comp.name.toLowerCase().trim() === brandKey;
                      return (
                        <div key={ci} className={`flex items-center gap-3 ${isBrand ? "py-1 px-2 -mx-2 rounded-lg bg-primary/5" : ""}`} data-testid={`row-competitor-${si}-${ci}`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isBrand ? "bg-primary text-primary-foreground" : "bg-gray-100 text-gray-500"}`}>{ci + 1}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm truncate ${isBrand ? "font-bold text-primary" : "font-medium"}`} data-testid={`text-comp-name-${si}-${ci}`}>{comp.name}</span>
                              <span className={`text-sm font-semibold ml-2 shrink-0 ${isBrand ? "text-primary" : color.text}`} data-testid={`text-comp-rate-${si}-${ci}`}>{pct}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${isBrand ? "bg-primary" : color.bar} transition-all`} style={{ width: `${((comp.share ?? 0) / maxShare) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3">{combined.reduce((s: number, c: any) => s + (c.appearances ?? 0), 0)} total appearances across all prompts</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section data-testid="section-segment-breakdown">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Who Shows Up When Your Customers Search</h2>
          <p className="text-sm text-muted-foreground">Top 10 per segment — including {brandName} — grouped by search dimension</p>
        </div>
      </div>

      <div className="space-y-3">
        {groups.map(group => (
          <CategoryAccordion
            key={group.key}
            group={group}
            segments={segments}
            brandPerSeg={brandPerSeg}
            brandName={brandName}
            colorSet={categoryColors[group.key] || categoryColors.general}
          />
        ))}
      </div>
    </section>
  );
}

function CollapsibleList({ items, initialCount, renderItem, label }: {
  items: any[];
  initialCount: number;
  renderItem: (item: any, index: number) => JSX.Element;
  label: string;
}) {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;
  const visible = expanded ? items : items.slice(0, initialCount);
  const remaining = items.length - initialCount;
  return (
    <div>
      <div className="space-y-2">
        {visible.map((item, i) => renderItem(item, i))}
      </div>
      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full py-2 text-sm font-medium text-primary bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 hover:border-primary/30 flex items-center justify-center gap-2 transition-all"
          data-testid={`btn-toggle-${label}`}
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {expanded ? "Show less" : `Show all ${items.length} ${label}`}
        </button>
      )}
    </div>
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
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sources Backing This Competitor ({comp.allSources.length})</p>
                <CollapsibleList
                  items={comp.allSources}
                  initialCount={3}
                  label="sources"
                  renderItem={(src: any, si: number) => (
                    <div key={si} className="flex items-start gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors" data-testid={`row-source-${comp.name}-${si}`}>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${tierColor(src.tier)}`}>{src.tier}</Badge>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{src.domain}</p>
                        <p className="text-[11px] text-muted-foreground">{tierLabel(src.tier)}</p>
                        {src.urls.map((u: string, ui: number) => (
                          <a key={ui} href={u} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5 truncate" data-testid={`link-source-url-${comp.name}-${si}-${ui}`}>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate">{u}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                />
              </div>

              {comp.socialMentions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    <MessageSquare className="w-3 h-3 inline mr-1" />
                    Social & Community Mentions ({comp.socialMentions.length})
                  </p>
                  <CollapsibleList
                    items={comp.socialMentions}
                    initialCount={3}
                    label="social mentions"
                    renderItem={(sm: any, si: number) => (
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
                    )}
                  />
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
            <p className="text-4xl font-bold text-blue-700 mt-1" data-testid="text-brand-source-count">{audit.uniqueDomainCount}</p>
            <p className="text-xs text-blue-600 mt-1">Citation source{audit.uniqueDomainCount !== 1 ? "s" : ""}</p>
          </CardContent>
        </Card>
        {top3Comps.map((comp, i) => (
          <Card key={comp.name} data-testid={`card-comp-audit-${i}`}>
            <CardContent className="pt-5 text-center">
              <p className="text-sm font-medium text-muted-foreground">{comp.name}</p>
              <p className="text-4xl font-bold mt-1" data-testid={`text-comp-source-count-${i}`}>{comp.allSources.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Citation source{comp.allSources.length !== 1 ? "s" : ""}</p>
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
            <CollapsibleList
              items={audit.brandSources}
              initialCount={5}
              label="sources"
              renderItem={(src: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors" data-testid={`row-brand-source-${i}`}>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${tierColor(src.tier)}`}>{src.tier}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{src.domain} <span className="text-xs text-muted-foreground ml-1">{tierLabel(src.tier)}</span></p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{src.mentions}</p>
                    <p className="text-[10px] text-muted-foreground">mention{src.mentions !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              )}
            />
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

function ActionPlanCTA({ brandName, sessionId }: { brandName: string; sessionId?: number }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await apiRequest("POST", "/api/share/summary-lead", {
        email,
        brandName,
        sessionId,
        sourcePage: window.location.pathname,
      });
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8" data-testid="cta-success">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-emerald-700">Thank you!</h3>
        <p className="text-sm text-muted-foreground mt-1">We'll be in touch with your full action plan and audit details.</p>
      </div>
    );
  }

  return (
    <div className="text-center py-8" data-testid="cta-form">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-5">
        <Lock className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-xl font-bold tracking-tight mb-3" data-testid="text-cta-headline">
        Unlock Your Full AI Action Plan
      </h3>
      <p className="text-3xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent mb-2" data-testid="text-cta-highlight">
        Improve visibility by 20–40%
      </p>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6" data-testid="text-cta-subtext">
        Show up in AI's top 3 recommendations consistently.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Enter your work email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-9 h-11"
            data-testid="input-email"
            disabled={submitting}
          />
        </div>
        <Button type="submit" disabled={submitting} className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700" data-testid="button-submit-email">
          <Send className="w-4 h-4 mr-2" />
          {submitting ? "Sending..." : "Get My Action Plan"}
        </Button>
      </form>
      {error && <p className="text-xs text-red-500 mt-2" data-testid="text-cta-error">{error}</p>}
      <p className="text-[11px] text-muted-foreground mt-3">No spam. We'll review your report and get back to you.</p>
    </div>
  );
}

function ConsolidatedWinsSection({ wins, locked, brandName, sessionId }: { wins: ConsolidatedWin[]; locked: boolean; brandName: string; sessionId?: number }) {
  const [showAll, setShowAll] = useState(false);
  if (wins.length === 0) return null;

  const icons = [
    <FileText className="w-5 h-5" />,
    <Globe className="w-5 h-5" />,
    <Award className="w-5 h-5" />,
    <MessageSquare className="w-5 h-5" />,
    <Shield className="w-5 h-5" />,
  ];
  const colors = [
    { bg: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700", border: "border-emerald-200", light: "bg-emerald-50/50" },
    { bg: "bg-indigo-500", badge: "bg-indigo-100 text-indigo-700", border: "border-indigo-200", light: "bg-indigo-50/50" },
    { bg: "bg-blue-500", badge: "bg-blue-100 text-blue-700", border: "border-blue-200", light: "bg-blue-50/50" },
    { bg: "bg-purple-500", badge: "bg-purple-100 text-purple-700", border: "border-purple-200", light: "bg-purple-50/50" },
    { bg: "bg-amber-500", badge: "bg-amber-100 text-amber-700", border: "border-amber-200", light: "bg-amber-50/50" },
  ];

  const previewCount = locked ? 1 : 3;
  const initialCount = previewCount;
  const visibleWins = showAll ? wins : wins.slice(0, initialCount);
  const remaining = wins.length - initialCount;

  return (
    <section data-testid="section-quick-wins">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Strategic Action Plan</h2>
          <p className="text-sm text-muted-foreground">
            {locked
              ? `${wins.length} high-impact actions identified for ${brandName}`
              : "High-impact moves based on GEO principles and real competitor data"
            }
          </p>
        </div>
        {locked && (
          <Badge className="ml-auto bg-amber-100 text-amber-700 border-amber-300" variant="outline">
            <Lock className="w-3 h-3 mr-1" />
            Preview
          </Badge>
        )}
      </div>

      <div className="space-y-5">
        {visibleWins.map((win, i) => {
          const color = colors[i] || colors[0];
          return (
            <Card key={i} className={`overflow-hidden ${color.border}`} data-testid={`card-quickwin-${i}`}>
              <div className={`h-1 ${color.bg}`} />
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${color.bg} flex items-center justify-center text-white shrink-0`}>
                    {icons[i] || icons[0]}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold text-base" data-testid={`text-quickwin-title-${i}`}>{win.title}</h3>
                      {win.principle && (
                        <p className={`text-xs font-medium mt-1 ${color.badge} inline-block px-2 py-0.5 rounded-md`} data-testid={`text-quickwin-principle-${i}`}>
                          {win.principle}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground leading-relaxed mt-2" data-testid={`text-quickwin-desc-${i}`}>{win.description}</p>
                    </div>

                    {win.examples.length > 0 && (
                      <div className={`${color.light} rounded-lg p-3.5 space-y-2.5`}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What competitors are doing</p>
                        {win.examples.map((ex, ei) => (
                          <div key={ei} className="flex items-start gap-2" data-testid={`example-${i}-${ei}`}>
                            <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-sm font-medium">{ex.competitor}:</span>{" "}
                              <span className="text-sm text-foreground/80">{ex.detail}</span>
                              {ex.url && (
                                <a href={ex.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 ml-1">
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {win.targetDomains.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Target these domains</p>
                        <CollapsibleList
                          items={win.targetDomains}
                          initialCount={4}
                          label="domains"
                          renderItem={(td: any, ti: number) => (
                            <a
                              key={ti}
                              href={td.url || `https://${td.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium hover:opacity-80 transition-opacity ${tierColor(td.tier)}`}
                              data-testid={`link-target-${i}-${ti}`}
                            >
                              <ExternalLink className="w-3 h-3" />
                              {td.domain}
                              <span className="opacity-60">({td.tier})</span>
                            </a>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {locked && wins.length > previewCount && (
        <div className="relative mt-5">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white rounded-xl -top-16 pointer-events-none" style={{ zIndex: 1 }} />
          <Card className="relative border-2 border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white" style={{ zIndex: 2 }} data-testid="card-cta-lock">
            <CardContent className="pt-6 pb-6">
              <ActionPlanCTA brandName={brandName} sessionId={sessionId} />
            </CardContent>
          </Card>
        </div>
      )}

      {!locked && remaining > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="mt-4 w-full py-2.5 text-sm font-medium text-primary hover:text-primary/80 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary/30 hover:border-primary/50 transition-colors"
          data-testid="btn-toggle-action-plan"
        >
          {showAll ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {showAll ? "Show fewer actions" : `Show all ${wins.length} actions`}
        </button>
      )}
    </section>
  );
}

function AuthoritySnapshotSection({ snapshot, brandName }: { snapshot: AuthorityDomain[]; brandName: string }) {
  const [showAll, setShowAll] = useState(false);
  if (snapshot.length === 0) return null;

  const initialCount = 10;
  const visibleRows = showAll ? snapshot : snapshot.slice(0, initialCount);
  const remaining = snapshot.length - initialCount;

  return (
    <section data-testid="section-authority-snapshot">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Authority Source Snapshot</h2>
          <p className="text-sm text-muted-foreground">Top {snapshot.length} domains AI engines cite — who they mention</p>
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
                {visibleRows.map((d, i) => {
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
          {remaining > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="mt-4 w-full py-2.5 text-sm font-medium text-primary hover:text-primary/80 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary/30 hover:border-primary/50 transition-colors"
              data-testid="btn-toggle-authority"
            >
              {showAll ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              {showAll ? "Show fewer" : `Show all ${snapshot.length} domains`}
            </button>
          )}
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
  brandSources: Array<{ domain: string; tier: string; mentions: number }>;
  byType: Array<{ type: string; count: number }>;
  uniqueDomainCount: number;
  totalMentions: number;
}

function gatherBrandMentionAudit(section2: any, brandName: string): BrandMentionAuditData {
  const brandCitationDomains = section2?.brandComparison?.brandCitationDomains ?? [];
  const brandSources: Array<{ domain: string; tier: string; mentions: number }> = [];
  const typeCounts: Record<string, number> = {};

  for (const d of brandCitationDomains) {
    brandSources.push({ domain: d.domain, tier: d.tier, mentions: d.mentions });

    let sourceType = "publication";
    const dm = d.domain.toLowerCase();
    if (dm.includes("reddit") || dm.includes("quora") || dm.includes("trustpilot") || dm.includes("twitter") || dm.includes("facebook") || dm.includes("linkedin")) {
      sourceType = "social";
    } else if (dm.includes("g2") || dm.includes("capterra") || dm.includes("crunchbase") || dm.includes("glassdoor")) {
      sourceType = "directory";
    } else if (d.tier === "T1") {
      sourceType = "major publication";
    } else if (d.tier === "T3" || d.tier === "T4") {
      sourceType = "third-party";
    }

    typeCounts[sourceType] = (typeCounts[sourceType] || 0) + 1;
  }

  const byType = Object.entries(typeCounts).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
  const uniqueDomainCount = section2?.brandComparison?.uniqueDomainCount ?? brandSources.length;
  const totalMentionsFallback = brandSources.reduce((sum, s) => sum + s.mentions, 0);
  return { brandSources, byType, uniqueDomainCount, totalMentions: totalMentionsFallback };
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

interface ConsolidatedWin {
  title: string;
  principle: string;
  description: string;
  examples: Array<{ competitor: string; detail: string; url?: string }>;
  targetDomains: Array<{ domain: string; tier: string; url?: string }>;
}

function extractConsolidatedWins(section3: any, playbook: any, allCompetitors: TopCompetitorAggregate[], section1: any): ConsolidatedWin[] {
  const wins: ConsolidatedWin[] = [];
  const competitorNames = new Set(allCompetitors.map(c => c.name.toLowerCase()));

  const isCompetitorDomain = (domain: string) => {
    const dl = domain.toLowerCase();
    return [...competitorNames].some(cn => {
      const words = cn.replace(/[^a-z0-9 ]/g, "").split(/\s+/);
      return words.some(w => w.length > 3 && dl.includes(w));
    });
  };

  // WIN 1: Write for Passages, Not Pages (Principle 3)
  const passageExamples: Array<{ competitor: string; detail: string }> = [];
  const allThemes = new Set<string>();
  for (const seg of (playbook?.perSegment ?? [])) {
    for (const comp of (seg?.topCompetitors ?? [])) {
      for (const theme of (comp.contextThemes ?? [])) allThemes.add(theme.theme);
      if (comp.exampleQuotes?.length > 0 && !passageExamples.some(p => p.competitor === comp.name)) {
        const eq = comp.exampleQuotes[0];
        const quote = eq.quote.length > 140 ? eq.quote.substring(0, 140) + "..." : eq.quote;
        passageExamples.push({
          competitor: comp.name,
          detail: `${eq.engine} cites them with: "${quote}"`,
        });
      }
    }
  }
  const topPhrases = [...allThemes].slice(0, 5);
  const phraseList = topPhrases.length > 0
    ? `Add phrases like ${topPhrases.slice(0, 3).map(t => `"${t}"`).join(", ")} as structured Q&A, bullet points, and direct definitions on your key pages — not buried in paragraphs.`
    : "Structure your content as Q&A, bullet points, and direct definitions — not buried in long paragraphs.";
  wins.push({
    title: "Write for Passages, Not Just Pages",
    principle: "LLMs pick 1–3 sentence snippets that directly answer a question. Fluffy intros get skipped.",
    description: `Top competitors get cited because they have clean, extractable passages. ${phraseList}`,
    examples: passageExamples.slice(0, 2),
    targetDomains: [],
  });

  // WIN 2: Build Entity Authority (Principle 4)
  const entityExamples: Array<{ competitor: string; detail: string }> = [];
  const entityDomains = new Map<string, { tier: string; url?: string }>();

  for (const seg of (playbook?.perSegment ?? [])) {
    for (const comp of (seg?.topCompetitors ?? [])) {
      const themes = (comp.contextThemes ?? []).map((t: any) => t.theme);
      const consistency = comp.crossEngineConsistency;
      if (consistency === "strong" && !entityExamples.some(e => e.competitor === comp.name)) {
        entityExamples.push({
          competitor: comp.name,
          detail: `Consistently described across all 3 AI engines as "${themes[0] || "trusted provider"}". This repeated entity signal is why they rank.`,
        });
      }
      for (const src of (comp.authoritySources ?? [])) {
        if (src.isAIInfra || src.tier === "T4") continue;
        if (isCompetitorDomain(src.domain)) continue;
        if ((src.tier === "T1" || src.tier === "T2") && !entityDomains.has(src.domain)) {
          entityDomains.set(src.domain, { tier: src.tier, url: src.urls?.[0] });
        }
      }
    }
  }

  for (const comp of allCompetitors.slice(0, 5)) {
    if (comp.segmentsPresent >= 3 && !entityExamples.some(e => e.competitor === comp.name)) {
      entityExamples.push({
        competitor: comp.name,
        detail: `Appears across ${comp.segmentsPresent} different search segments — AI engines treat them as a recognized entity in this space.`,
      });
    }
  }

  wins.push({
    title: "Build Entity Authority Across Trusted Contexts",
    principle: "Backlinks still help, but LLMs also reward repeated brand mentions across reviews, comparisons, and reputable discussions.",
    description: "AI engines don't just count backlinks — they look for consistent brand mentions across trusted sources. Get your brand name mentioned in the same contexts competitors appear in: review sites, comparison articles, and industry directories.",
    examples: entityExamples.slice(0, 2),
    targetDomains: [...entityDomains.entries()].sort((a, b) => {
      const o: Record<string, number> = { T1: 0, T2: 1 };
      return (o[a[1].tier] ?? 2) - (o[b[1].tier] ?? 2);
    }).slice(0, 4).map(([domain, data]) => ({ domain, tier: data.tier, url: data.url })),
  });

  // WIN 3: Get Featured in AI-Trusted Publications (Principle 10 + 4)
  const pubExamples: Array<{ competitor: string; detail: string; url?: string }> = [];
  const pubDomains = new Map<string, { tier: string; url?: string }>();

  for (const seg of (playbook?.perSegment ?? [])) {
    for (const comp of (seg?.topCompetitors ?? [])) {
      for (const src of (comp.authoritySources ?? [])) {
        if (src.isAIInfra || src.tier === "T4") continue;
        if (isCompetitorDomain(src.domain)) continue;
        if (!pubDomains.has(src.domain)) {
          pubDomains.set(src.domain, { tier: src.tier, url: src.urls?.[0] });
        }
      }
      for (const da of (comp.derivedActions ?? [])) {
        if (da.includes("high-authority sources") && !pubExamples.some(p => p.competitor === comp.name)) {
          pubExamples.push({ competitor: comp.name, detail: da });
        }
      }
    }
    for (const hfs of (seg.highFrequencySources ?? [])) {
      if (hfs.tier === "T4") continue;
      if (!pubDomains.has(hfs.domain)) pubDomains.set(hfs.domain, { tier: hfs.tier });
    }
  }

  const recs = section3?.recommendations ?? [];
  for (const rec of recs) {
    for (const url of (rec.getListedHere ?? [])) {
      try {
        const domain = new URL(url).hostname.replace(/^www\./, "");
        if (!isCompetitorDomain(domain) && !pubDomains.has(domain)) {
          pubDomains.set(domain, { tier: "T3", url });
        }
      } catch { /* skip */ }
    }
  }

  const sortedPubDomains = [...pubDomains.entries()]
    .sort((a, b) => {
      const o: Record<string, number> = { T1: 0, T2: 1, T3: 2 };
      return (o[a[1].tier] ?? 3) - (o[b[1].tier] ?? 3);
    })
    .slice(0, 6)
    .map(([domain, data]) => ({ domain, tier: data.tier, url: data.url }));

  wins.push({
    title: "Get Featured Where AI Models Retrieve From",
    principle: "LLM distribution goes beyond your own site — be present where retrieval systems look: review sites, comparisons, directories, and definition-style pages.",
    description: "AI engines retrieve from specific publications and use them as citation sources. Getting mentioned in these publications directly increases your chance of appearing in AI answers. Target PR, guest content, and directory profiles.",
    examples: pubExamples.slice(0, 2),
    targetDomains: sortedPubDomains,
  });

  // WIN 4: Own the Two-Layer SERP — Reddit/Quora/Trustpilot (Principle 7)
  const socialExamples: Array<{ competitor: string; detail: string; url?: string }> = [];
  const socialDomains = new Map<string, { url?: string }>();

  for (const comp of allCompetitors.slice(0, 8)) {
    for (const sm of (comp.socialMentions ?? [])) {
      const domain = sm.domain.toLowerCase().replace(/^(www\.|ca\.)/, "");
      if (!socialDomains.has(domain)) socialDomains.set(domain, { url: sm.url });
      if (!socialExamples.some(s => s.competitor === comp.name)) {
        socialExamples.push({
          competitor: comp.name,
          detail: `Mentioned on ${sm.domain} — AI engines retrieve and cite this thread directly when recommending them.`,
          url: sm.url,
        });
      }
    }
  }

  if (socialDomains.size > 0) {
    const platformList = [...socialDomains.keys()].slice(0, 4).join(", ");
    wins.push({
      title: "Own the Two-Layer SERP: Reddit, Quora & Reviews",
      principle: "In AI search, it's rational to rank on Reddit/Quora — not just your own site. Those threads are what get retrieved and cited.",
      description: `AI models retrieve answers from community platforms like ${platformList}. Seed accurate, helpful answers in high-ranking threads. Ensure your brand appears in "best / alternatives / comparison" discussions. Publish canonical pages those threads can link back to.`,
      examples: socialExamples.slice(0, 2),
      targetDomains: [...socialDomains.entries()].slice(0, 4).map(([domain, data]) => ({ domain, tier: "T2", url: data.url })),
    });
  }

  // WIN 5: Show Your Work — E-E-A-T for AI (Principle 5)
  const grounding = section1?.grounding ?? {};
  const engineCitationRates: Array<{ engine: string; pct: number }> = [];
  for (const eng of ["chatgpt", "gemini", "claude"]) {
    const g = grounding[eng];
    if (g) engineCitationRates.push({ engine: eng, pct: g.pct ?? 0 });
  }

  const showWorkExamples: Array<{ competitor: string; detail: string }> = [];
  for (const seg of (playbook?.perSegment ?? [])) {
    for (const comp of (seg?.topCompetitors ?? [])) {
      const themes = (comp.contextThemes ?? []).map((t: any) => t.theme);
      const credibilityThemes = themes.filter((t: string) =>
        t.includes("licensed") || t.includes("accredited") || t.includes("certified") || t.includes("government") || t.includes("award") || t.includes("trusted")
      );
      if (credibilityThemes.length > 0 && !showWorkExamples.some(e => e.competitor === comp.name)) {
        showWorkExamples.push({
          competitor: comp.name,
          detail: `AI engines highlight their "${credibilityThemes[0]}" credential — this verifiable claim makes them safe to cite.`,
        });
      }
    }
  }

  if (showWorkExamples.length > 0 || engineCitationRates.length > 0) {
    const citationNote = engineCitationRates
      .filter(e => e.pct > 0)
      .map(e => `${e.engine}: ${e.pct}% of responses include citations`)
      .join("; ");

    wins.push({
      title: "Make Your Pages Safe to Cite (E-E-A-T for AI)",
      principle: "LLM systems prefer sources that make verification easy: clear credentials, dates, methodology, and outbound references.",
      description: `AI answers are fragile — engines prefer citing sources they can verify. Add clear accreditations, "updated on" dates, author info, and methodology to your key pages.${citationNote ? ` Currently: ${citationNote}.` : ""} Make it easy for AI to trust and quote you.`,
      examples: showWorkExamples.slice(0, 2),
      targetDomains: [],
    });
  }

  return wins;
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

const TIER_CONFIG: Array<{ key: string; label: string; description: string; colorClass: string }> = [
  { key: "T1", label: "T1 — Major Publications", description: "High-authority domains trusted by AI engines", colorClass: "text-emerald-700" },
  { key: "T2", label: "T2 — Mid-Tier & Social", description: "Blogs, social platforms, review sites", colorClass: "text-blue-700" },
  { key: "T3", label: "T3 — Third-Party Sites", description: "Directories, niche sites, local listings", colorClass: "text-amber-700" },
  { key: "T4", label: "T4 — Competitor Owned", description: "Competitor websites and properties", colorClass: "text-red-700" },
  { key: "brand_owned", label: "Brand Owned", description: "Your own website and properties", colorClass: "text-purple-700" },
];

const ENGINE_BADGE_COLORS: Record<string, string> = {
  chatgpt: "bg-green-100 text-green-700 border-green-200",
  gemini: "bg-blue-100 text-blue-700 border-blue-200",
  claude: "bg-orange-100 text-orange-700 border-orange-200",
};

function AllCitationSourcesSection({ appendix }: { appendix: any }) {
  const [expandedTier, setExpandedTier] = useState<string | null>(null);
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const domainsByTier = appendix?.domainsByTier ?? {};
  const totalDomains = appendix?.totalDomains ?? 0;

  if (totalDomains === 0) return null;

  const toggleDomain = (domainKey: string) => {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      if (next.has(domainKey)) next.delete(domainKey);
      else next.add(domainKey);
      return next;
    });
  };

  return (
    <section data-testid="section-all-citations">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center">
          <Globe className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">All Citation Sources</h2>
          <p className="text-sm text-muted-foreground">{totalDomains} domains sourced across all AI engine responses</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {TIER_CONFIG.map(tc => {
          const count = (domainsByTier[tc.key] ?? []).length;
          if (count === 0) return null;
          return (
            <Badge key={tc.key} variant="outline" className={`text-xs ${tierColor(tc.key)}`} data-testid={`badge-tier-count-${tc.key}`}>
              {tc.key === "brand_owned" ? "Own" : tc.key}: {count} domains
            </Badge>
          );
        })}
      </div>

      <div className="space-y-3">
        {TIER_CONFIG.map(tc => {
          const domains = domainsByTier[tc.key] ?? [];
          if (domains.length === 0) return null;
          const isOpen = expandedTier === tc.key;

          return (
            <Card key={tc.key} className="overflow-hidden" data-testid={`card-tier-${tc.key}`}>
              <button
                type="button"
                onClick={() => setExpandedTier(isOpen ? null : tc.key)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
                data-testid={`btn-tier-toggle-${tc.key}`}
              >
                <div className="flex items-center gap-2">
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span className={`text-sm font-semibold ${tc.colorClass}`}>{tc.label}</span>
                  <span className="text-xs text-muted-foreground">({domains.length} domains)</span>
                </div>
                <span className="text-xs text-muted-foreground">{tc.description}</span>
              </button>
              {isOpen && (
                <div className="border-t divide-y divide-border/50">
                  {domains.map((d: any, di: number) => {
                    const urls: Array<{ url: string; engines: string[] }> = (d.urls || []).map((u: any) =>
                      typeof u === "string" ? { url: u, engines: [] } : { url: u.url, engines: u.engines || [] }
                    );
                    const domainEngines: string[] = d.engines || [];
                    const domainKey = `${tc.key}-${d.domain}`;
                    const isDomainOpen = expandedDomains.has(domainKey);

                    return (
                      <div key={di} className="px-4 py-2" data-testid={`row-domain-${tc.key}-${di}`}>
                        <button
                          type="button"
                          onClick={() => toggleDomain(domainKey)}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isDomainOpen ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
                            <span className="text-xs font-medium truncate">{d.domain}</span>
                            <span className="text-[9px] text-muted-foreground shrink-0">({urls.length} URLs)</span>
                            {domainEngines.map((eng: string) => (
                              <span key={eng} className={`text-[7px] px-1.5 py-0 rounded-full border font-medium capitalize ${ENGINE_BADGE_COLORS[eng] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                {eng}
                              </span>
                            ))}
                          </div>
                          {(d.mentionedEntities || []).length > 0 && (
                            <span className="text-[9px] text-muted-foreground truncate max-w-[250px] ml-2">
                              {d.mentionedEntities.slice(0, 3).join(", ")}
                            </span>
                          )}
                        </button>
                        {isDomainOpen && (
                          <div className="mt-2 ml-5 space-y-1.5 pb-1">
                            {(d.mentionedEntities || []).length > 0 && (
                              <p className="text-[9px] text-muted-foreground">
                                Mentioned: {d.mentionedEntities.join(", ")}
                              </p>
                            )}
                            {urls.map((u, ui) => (
                              <div key={ui} className="flex items-center gap-1.5">
                                <a
                                  href={u.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline min-w-0"
                                  data-testid={`link-citation-${tc.key}-${di}-${ui}`}
                                >
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate">{u.url}</span>
                                </a>
                                {u.engines.map((eng: string) => (
                                  <span key={eng} className={`text-[7px] px-1.5 py-0 rounded-full border font-medium capitalize shrink-0 ${ENGINE_BADGE_COLORS[eng] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                    {eng}
                                  </span>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
