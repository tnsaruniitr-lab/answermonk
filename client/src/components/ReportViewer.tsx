import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  FileText,
  Loader2,
  ChevronDown,
  ChevronRight,
  Eye,
  Trophy,
  Target,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  BarChart3,
  Globe,
  Lightbulb,
  Shield,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

async function exportPDF(report: any) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = 20;

  const addPage = () => { doc.addPage(); y = 20; };
  const checkPage = (needed: number) => { if (y + needed > 270) addPage(); };

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(`GEO Report — ${report.meta.brandName}`, margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text(`Domain: ${report.meta.brandDomain || "N/A"}  |  Analyzed: ${new Date(report.meta.analyzedAt).toLocaleDateString()}  |  ${report.meta.segmentCount} segments, ${report.meta.totalRuns} runs`, margin, y);
  doc.setTextColor(0);
  y += 10;

  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, y, contentW, 18, 2, 2, "F");
  const boxW = contentW / 4;
  const statsLabels = ["Appearance Rate", "Top 3 Rate", "Avg Rank", "Valid Runs"];
  const statsValues = [
    `${Math.round(report.section1.overall.appearanceRate * 100)}%`,
    `${Math.round(report.section1.overall.primaryRate * 100)}%`,
    report.section1.overall.avgRank !== null ? `#${report.section1.overall.avgRank}` : "—",
    `${report.section1.overall.totalValidRuns}`,
  ];
  for (let i = 0; i < 4; i++) {
    const cx = margin + boxW * i + boxW / 2;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(statsValues[i], cx, y + 8, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    doc.text(statsLabels[i], cx, y + 13, { align: "center" });
    doc.setTextColor(0);
  }
  y += 24;

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("1. Visibility Dashboard", margin, y);
  y += 7;

  const segRows = report.section1.perSegment.map((s: any, i: number) => [
    `#${i + 1}`,
    s.persona.replace(/_/g, " "),
    s.location || "—",
    `${Math.round(s.appearanceRate * 100)}%`,
    `${Math.round(s.primaryRate * 100)}%`,
    s.avgRank !== null ? `#${s.avgRank}` : "—",
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["#", "Persona", "Location", "Appearance", "Top 3", "Avg Rank"]],
    body: segRows,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [60, 60, 60], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 248, 248] },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  const heatmapEntries = Object.entries(report.section1.engineHeatmap);
  if (heatmapEntries.length > 0) {
    checkPage(20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Engine Heatmap", margin, y);
    y += 5;

    const heatRows = heatmapEntries.map(([seg, engines]: [string, any]) => [
      seg,
      engines.chatgpt ? `${Math.round(engines.chatgpt.appearanceRate * 100)}%` : "—",
      engines.gemini ? `${Math.round(engines.gemini.appearanceRate * 100)}%` : "—",
      engines.claude ? `${Math.round(engines.claude.appearanceRate * 100)}%` : "—",
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Segment", "ChatGPT", "Gemini", "Claude"]],
      body: heatRows,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [60, 60, 60], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 248, 248] },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  checkPage(15);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("2. Competitive Landscape", margin, y);
  y += 7;

  for (const seg of report.section2.perSegment) {
    checkPage(25);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(seg.segmentLabel, margin, y);
    y += 5;

    const compRows = seg.top5.map((c: any, i: number) => [
      `${i + 1}`,
      c.name,
      `${Math.round(c.share * 100)}%`,
      `${c.appearances}`,
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["#", "Competitor", "Share", "Appearances"]],
      body: compRows,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [80, 80, 80], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 248, 248] },
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    for (const dd of seg.deepDives) {
      checkPage(20);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`${dd.name} — ${Math.round(dd.share * 100)}% share (${dd.crossEngineConsistency} cross-engine)`, margin + 3, y);
      y += 4;

      if (dd.authoritySources?.length > 0) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80);
        doc.text(`Authority sources: ${dd.authoritySources.slice(0, 5).map((s: any) => `${s.domain} (${s.tier})`).join(", ")}`, margin + 3, y);
        doc.setTextColor(0);
        y += 4;
      }

      if (dd.comparisonSurfaces?.length > 0) {
        const missing = dd.comparisonSurfaces.filter((cs: any) => !cs.brandPresent);
        if (missing.length > 0) {
          doc.setFontSize(8);
          doc.setTextColor(180, 0, 0);
          doc.text(`Missing from: ${missing.slice(0, 3).map((cs: any) => cs.domain).join(", ")}`, margin + 3, y);
          doc.setTextColor(0);
          y += 4;
        }
      }
      y += 2;
    }
  }

  checkPage(15);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("3. Actionable Insights", margin, y);
  y += 7;

  if (report.section3.modelUnderstanding) {
    checkPage(15);
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(60, 60, 160);
    const muLines = doc.splitTextToSize(`AI perception: ${report.section3.modelUnderstanding}`, contentW - 6);
    doc.text(muLines, margin + 3, y);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    y += muLines.length * 4 + 4;
  }

  for (const gap of report.section3.gapAnalysis) {
    checkPage(20);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`${gap.segmentLabel} — ${gap.gapType} gap`, margin, y);
    y += 4;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.text(`Authority: ${gap.authority.label} — ${gap.authority.detail}`, margin + 3, y); y += 3.5;
    doc.text(`Context: ${gap.context.label} — ${gap.context.detail}`, margin + 3, y); y += 3.5;
    doc.text(`Comparative: ${gap.comparative.label} — ${gap.comparative.detail}`, margin + 3, y); y += 5;
    doc.setTextColor(0);
  }

  for (const rec of report.section3.recommendations) {
    checkPage(30);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(rec.segmentLabel, margin, y);
    y += 5;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const qwLines = doc.splitTextToSize(`Quick Win: ${rec.quickWins}`, contentW - 6);
    doc.setTextColor(0, 120, 0);
    doc.text(qwLines, margin + 3, y);
    doc.setTextColor(0);
    y += qwLines.length * 3.5 + 2;

    if (rec.secondaryAction) {
      checkPage(10);
      const saLines = doc.splitTextToSize(`Secondary: ${rec.secondaryAction}`, contentW - 6);
      doc.setTextColor(0, 60, 160);
      doc.text(saLines, margin + 3, y);
      doc.setTextColor(0);
      y += saLines.length * 3.5 + 2;
    }

    if (rec.getListedHere?.length > 0) {
      checkPage(10);
      doc.setFont("helvetica", "bold");
      doc.text("Get listed here:", margin + 3, y); y += 3.5;
      doc.setFont("helvetica", "normal");
      for (const url of rec.getListedHere.slice(0, 5)) {
        checkPage(5);
        doc.setTextColor(0, 0, 200);
        doc.text(`• ${url}`, margin + 6, y);
        doc.setTextColor(0);
        y += 3.5;
      }
      y += 2;
    }

    if (rec.missingSources?.length > 0) {
      checkPage(10);
      doc.setFont("helvetica", "bold");
      doc.text("Missing high-tier sources:", margin + 3, y); y += 3.5;
      doc.setFont("helvetica", "normal");
      doc.text(rec.missingSources.map((s: any) => `${s.domain} (${s.tier})`).join(", "), margin + 6, y);
      y += 5;
    }
    y += 3;
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160);
    doc.text(`GEO Report — ${report.meta.brandName} — Page ${i}/${pageCount}`, pageW / 2, 290, { align: "center" });
  }

  doc.save(`geo-report-${report.meta.brandName}-${new Date().toISOString().split("T")[0]}.pdf`);
}

interface ReportViewerProps {
  sessionId: number | null;
  brandName: string;
}

const ENGINE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
};

const STRENGTH_COLORS: Record<string, string> = {
  strong: "text-green-600 dark:text-green-400",
  moderate: "text-yellow-600 dark:text-yellow-400",
  weak: "text-red-500 dark:text-red-400",
  unknown: "text-muted-foreground",
};

const STRENGTH_BG: Record<string, string> = {
  strong: "bg-green-100 dark:bg-green-900/20",
  moderate: "bg-yellow-100 dark:bg-yellow-900/20",
  weak: "bg-red-100 dark:bg-red-900/20",
  unknown: "bg-secondary",
};

export function ReportViewer({ sessionId, brandName }: ReportViewerProps) {
  const [showReport, setShowReport] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/multi-segment-sessions", sessionId, "report"],
    queryFn: async () => {
      const res = await fetch(`/api/multi-segment-sessions/${sessionId}/report`);
      if (!res.ok) throw new Error("Failed to generate report");
      return res.json();
    },
    enabled: showReport && sessionId !== null,
  });

  const report = data?.report;

  if (!showReport) {
    return (
      <div className="mt-6">
        <Button
          onClick={() => setShowReport(true)}
          className="w-full gap-2"
          size="lg"
          data-testid="button-generate-report"
        >
          <FileText className="w-4 h-4" />
          Generate Full Report
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-6">
        <Card className="p-8 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Generating report for {brandName}...</p>
        </Card>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="mt-6">
        <Card className="p-6 text-center space-y-3">
          <AlertTriangle className="w-5 h-5 text-destructive mx-auto" />
          <p className="text-sm text-muted-foreground">Failed to generate report. Make sure citation analysis has been run first.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-retry-report">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2" data-testid="text-report-title">
          <FileText className="w-5 h-5" />
          GEO Report — {report.meta.brandName}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="gap-1.5"
            onClick={() => exportPDF(report)}
            data-testid="button-export-pdf"
          >
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `geo-report-${report.meta.brandName}-${new Date().toISOString().split("T")[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            data-testid="button-download-report"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </Button>
        </div>
      </div>

      <Card className="p-4 bg-secondary/30">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <div className="text-2xl font-bold" data-testid="text-report-segments">{report.meta.segmentCount}</div>
            <div className="text-[10px] text-muted-foreground">Segments</div>
          </div>
          <div>
            <div className="text-2xl font-bold" data-testid="text-report-runs">{report.meta.totalRuns}</div>
            <div className="text-[10px] text-muted-foreground">Total Runs</div>
          </div>
          <div>
            <div className="text-2xl font-bold" data-testid="text-report-appearance">
              {Math.round(report.section1.overall.appearanceRate * 100)}%
            </div>
            <div className="text-[10px] text-muted-foreground">Appearance Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold" data-testid="text-report-rank">
              {report.section1.overall.avgRank !== null ? `#${report.section1.overall.avgRank}` : "—"}
            </div>
            <div className="text-[10px] text-muted-foreground">Avg Rank</div>
          </div>
        </div>
      </Card>

      <Section1 data={report.section1} />
      <Section2 data={report.section2} brandName={report.meta.brandName} />
      <Section3 data={report.section3} />
    </div>
  );
}

function Section1({ data }: { data: any }) {
  const [open, setOpen] = useState(true);

  return (
    <Card className="overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors text-left">
          <div className="flex items-center gap-2">
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Section 1: Visibility Dashboard</span>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t space-y-4 pt-3">
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Per Segment</h4>
              <div className="divide-y divide-border/50 border border-border/50 rounded-md overflow-hidden">
                {data.perSegment.map((seg: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2" data-testid={`row-segment-visibility-${i}`}>
                    <div className="text-xs min-w-0 truncate flex-1">
                      <span className="text-muted-foreground mr-1.5">#{i + 1}</span>
                      {seg.persona.replace(/_/g, " ")}
                      {seg.location && <span className="text-muted-foreground ml-1">({seg.location})</span>}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] shrink-0">
                      <span className="font-medium">{Math.round(seg.appearanceRate * 100)}% vis</span>
                      <span className="text-muted-foreground">Top3 {Math.round(seg.primaryRate * 100)}%</span>
                      <span className="font-medium">#{seg.avgRank ?? "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {Object.keys(data.engineHeatmap).length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <BarChart3 className="w-3 h-3" />
                  Engine Heatmap
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1.5 px-2 font-medium text-muted-foreground">Segment</th>
                        {["chatgpt", "gemini", "claude"].map(e => (
                          <th key={e} className="text-center py-1.5 px-2 font-medium text-muted-foreground">
                            {ENGINE_LABELS[e] || e}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(data.engineHeatmap).map(([segLabel, engines]: [string, any]) => (
                        <tr key={segLabel} className="border-b border-border/30">
                          <td className="py-1.5 px-2 truncate max-w-[140px]">{segLabel}</td>
                          {["chatgpt", "gemini", "claude"].map(e => {
                            const d = engines[e];
                            if (!d) return <td key={e} className="text-center px-2 text-muted-foreground">—</td>;
                            const pct = Math.round(d.appearanceRate * 100);
                            const bg = pct >= 60 ? "bg-green-100 dark:bg-green-900/20" : pct >= 30 ? "bg-yellow-100 dark:bg-yellow-900/20" : "bg-red-100 dark:bg-red-900/20";
                            return (
                              <td key={e} className={`text-center px-2 py-1.5 font-medium ${bg}`}>
                                {pct}%
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {Object.keys(data.grounding).length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Globe className="w-3 h-3" />
                  Citation Grounding
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(data.grounding).map(([engine, g]: [string, any]) => (
                    <div key={engine} className="bg-secondary/30 rounded-md p-2 text-center">
                      <div className="text-[10px] text-muted-foreground">{ENGINE_LABELS[engine] || engine}</div>
                      <div className="text-sm font-semibold">{g.pct}%</div>
                      <div className="text-[9px] text-muted-foreground">{g.withCitations}/{g.total} with citations</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function Section2({ data, brandName }: { data: any; brandName: string }) {
  const [open, setOpen] = useState(true);

  return (
    <Card className="overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors text-left">
          <div className="flex items-center gap-2">
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold">Section 2: Competitive Landscape</span>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t space-y-5 pt-3">
            {data.perSegment.map((seg: any, segIdx: number) => (
              <SegmentCompetitors key={segIdx} seg={seg} segIdx={segIdx} brandName={brandName} />
            ))}

            {data.crossSegmentOverlap.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Target className="w-3 h-3" />
                  Cross-Segment Competitors
                </h4>
                <div className="divide-y divide-border/50 border border-border/50 rounded-md overflow-hidden">
                  {data.crossSegmentOverlap.map((comp: any, i: number) => (
                    <div key={i} className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-xs font-medium">{comp.name}</span>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{comp.segmentCount} segments</span>
                        <span>{comp.totalAppearances} appearances</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                Your Brand Authority
              </h4>
              <div className="bg-secondary/30 rounded-md p-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-sm font-bold">{data.brandComparison.uniqueDomainCount}</div>
                  <div className="text-[9px] text-muted-foreground">Unique Domains</div>
                </div>
                <div>
                  <div className="text-sm font-bold capitalize">{data.brandComparison.authorityLabel}</div>
                  <div className="text-[9px] text-muted-foreground">Authority Level</div>
                </div>
                <div>
                  <div className="text-sm font-bold">
                    {data.brandComparison.comparisonPagesPresent}/{data.brandComparison.comparisonPagesTotal}
                  </div>
                  <div className="text-[9px] text-muted-foreground">Comparison Pages</div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function SegmentCompetitors({ seg, segIdx, brandName }: { seg: any; segIdx: number; brandName: string }) {
  const [showDeep, setShowDeep] = useState(false);

  return (
    <div data-testid={`section-segment-competitors-${segIdx}`}>
      <h4 className="text-xs font-medium mb-2">
        <span className="text-muted-foreground mr-1">#{segIdx + 1}</span>
        {seg.segmentLabel}
      </h4>

      <div className="divide-y divide-border/50 border border-border/50 rounded-md overflow-hidden mb-2">
        {seg.top5.map((comp: any, i: number) => (
          <div key={i} className="flex items-center justify-between px-3 py-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground font-mono w-4 text-right">{i + 1}</span>
              <span className="text-xs">{comp.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-1 bg-secondary rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-foreground/40" style={{ width: `${Math.round(comp.share * 100)}%` }} />
              </div>
              <span className="text-[10px] font-medium w-8 text-right">{Math.round(comp.share * 100)}%</span>
            </div>
          </div>
        ))}
      </div>

      {seg.deepDives.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowDeep(!showDeep)}
            className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            data-testid={`button-toggle-deep-dives-${segIdx}`}
          >
            {showDeep ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Deep Dives ({seg.deepDives.length})
          </button>

          <AnimatePresence>
            {showDeep && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <div className="mt-2 space-y-3">
                  {seg.deepDives.map((dd: any, i: number) => (
                    <CompetitorDeepDive key={i} dd={dd} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

function CompetitorDeepDive({ dd }: { dd: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="p-3 space-y-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">{dd.name}</span>
          <Badge variant="outline" className="text-[9px]">{Math.round(dd.share * 100)}% share</Badge>
          <Badge className={`text-[9px] ${STRENGTH_BG[dd.crossEngineConsistency]} ${STRENGTH_COLORS[dd.crossEngineConsistency]} border-0`}>
            {dd.crossEngineConsistency} cross-engine
          </Badge>
        </div>
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <div className="space-y-3 pt-2 border-t">
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(dd.perEngine).map(([engine, stats]: [string, any]) => (
                  <div key={engine} className="bg-secondary/30 rounded-md p-2 text-center">
                    <div className="text-[10px] text-muted-foreground">{ENGINE_LABELS[engine] || engine}</div>
                    <div className="text-sm font-semibold">{stats.appearances}/{stats.totalRuns}</div>
                    {stats.avgRank && <div className="text-[9px] text-muted-foreground">Avg #{stats.avgRank}</div>}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {Object.entries(dd.geoFactors).map(([factor, level]: [string, any]) => (
                  <div key={factor} className={`rounded p-1.5 text-center ${STRENGTH_BG[level]}`}>
                    <div className={`text-[9px] font-medium ${STRENGTH_COLORS[level]}`}>{level}</div>
                    <div className="text-[8px] text-muted-foreground capitalize">{factor.replace(/([A-Z])/g, " $1").trim()}</div>
                  </div>
                ))}
              </div>

              {dd.authoritySources.length > 0 && (
                <div>
                  <div className="text-[10px] font-medium text-muted-foreground mb-1">Authority Sources</div>
                  <div className="space-y-0.5">
                    {dd.authoritySources.slice(0, 5).map((src: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-[11px]">
                        <Badge variant="outline" className="text-[8px] px-1">{src.tier}</Badge>
                        <span className="truncate">{src.domain}</span>
                        <span className="text-muted-foreground">({src.urls.length})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dd.phrases.length > 0 && (
                <div>
                  <div className="text-[10px] font-medium text-muted-foreground mb-1">How AI Describes Them</div>
                  <div className="space-y-1">
                    {dd.phrases.slice(0, 3).map((p: string, i: number) => (
                      <div key={i} className="text-[11px] text-muted-foreground bg-secondary/30 rounded px-2 py-1 italic">
                        "{p}"
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dd.comparisonSurfaces.length > 0 && (
                <div>
                  <div className="text-[10px] font-medium text-muted-foreground mb-1">Comparison Surfaces</div>
                  <div className="space-y-0.5">
                    {dd.comparisonSurfaces.slice(0, 5).map((cs: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-[11px]">
                        <Badge variant={cs.brandPresent ? "default" : "destructive"} className="text-[8px] px-1">
                          {cs.brandPresent ? "You're here" : "Missing"}
                        </Badge>
                        <a href={cs.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline truncate">
                          {cs.domain}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function Section3({ data }: { data: any }) {
  const [open, setOpen] = useState(true);

  return (
    <Card className="overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors text-left">
          <div className="flex items-center gap-2">
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-semibold">Section 3: Actionable Insights</span>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t space-y-5 pt-3">
            {data.modelUnderstanding && (
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wide text-blue-700 dark:text-blue-400 font-medium mb-1">
                  How AI Models See Your Brand
                </div>
                <p className="text-xs text-blue-900 dark:text-blue-200">{data.modelUnderstanding}</p>
              </div>
            )}

            {data.gapAnalysis.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Target className="w-3 h-3" />
                  Gap Analysis
                </h4>
                <div className="space-y-2">
                  {data.gapAnalysis.map((gap: any, i: number) => (
                    <Card key={i} className="p-3 space-y-2" data-testid={`card-gap-analysis-${i}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{gap.segmentLabel}</span>
                        <Badge variant="outline" className="text-[9px] capitalize">{gap.gapType} gap</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Authority", ...gap.authority },
                          { label: "Context", ...gap.context },
                          { label: "Comparative", ...gap.comparative },
                        ].map((item) => (
                          <div key={item.label} className={`rounded-md p-2 ${STRENGTH_BG[item.label.toLowerCase()] || "bg-secondary/30"}`}>
                            <div className="text-[10px] font-medium">{item.label}</div>
                            <div className={`text-[10px] font-semibold capitalize ${STRENGTH_COLORS[item.label.toLowerCase()] || ""}`}>
                              {item.label === "Authority" || item.label === "Context" || item.label === "Comparative" ? item.label : ""} {(item as any).label}
                            </div>
                            <div className="text-[9px] text-muted-foreground mt-0.5 line-clamp-2">{item.detail}</div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {data.recommendations.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3" />
                  Recommendations
                </h4>
                <div className="space-y-3">
                  {data.recommendations.map((rec: any, i: number) => (
                    <Card key={i} className="p-3 space-y-3" data-testid={`card-recommendation-${i}`}>
                      <div className="text-xs font-medium">{rec.segmentLabel}</div>

                      <div className="bg-green-50 dark:bg-green-900/10 rounded p-2">
                        <div className="text-[10px] font-medium text-green-700 dark:text-green-400 mb-0.5">Quick Win</div>
                        <p className="text-[11px] text-green-900 dark:text-green-200">{rec.quickWins}</p>
                      </div>

                      {rec.secondaryAction && (
                        <div className="bg-blue-50 dark:bg-blue-900/10 rounded p-2">
                          <div className="text-[10px] font-medium text-blue-700 dark:text-blue-400 mb-0.5">Secondary Action</div>
                          <p className="text-[11px] text-blue-900 dark:text-blue-200">{rec.secondaryAction}</p>
                        </div>
                      )}

                      {rec.getListedHere.length > 0 && (
                        <div>
                          <div className="text-[10px] font-medium text-muted-foreground mb-1">Get Listed Here</div>
                          <div className="space-y-0.5">
                            {rec.getListedHere.slice(0, 5).map((url: string, j: number) => (
                              <a
                                key={j}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <ExternalLink className="w-3 h-3 shrink-0" />
                                <span className="truncate">{url}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {rec.missingSources.length > 0 && (
                        <div>
                          <div className="text-[10px] font-medium text-muted-foreground mb-1">Missing High-Tier Sources</div>
                          <div className="flex flex-wrap gap-1">
                            {rec.missingSources.map((src: any, j: number) => (
                              <Badge key={j} variant="outline" className="text-[9px] gap-1">
                                <span className="font-medium">{src.tier}</span> {src.domain}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {rec.useThesePhrases.length > 0 && (
                        <div>
                          <div className="text-[10px] font-medium text-muted-foreground mb-1">Use These Phrases</div>
                          <div className="space-y-1">
                            {rec.useThesePhrases.slice(0, 3).map((p: string, j: number) => (
                              <div key={j} className="text-[10px] bg-secondary/30 rounded px-2 py-1 italic text-muted-foreground">
                                "{p}"
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
