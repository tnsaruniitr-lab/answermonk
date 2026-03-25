import { useState, useEffect, lazy, Suspense, Component } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Analyzer from "@/pages/Analyzer";
import HistoryPage from "@/pages/History";
import PromptGenerator from "@/pages/PromptGenerator";
import ScoringDetail from "@/pages/ScoringDetail";
import V2SessionDetail from "@/pages/V2SessionDetail";
import SummaryReport from "@/pages/SummaryReport";
import ProspectTeaser from "@/pages/ProspectTeaser";
import Leads from "@/pages/Leads";
import IncomingLeads from "@/pages/IncomingLeads";
import Login from "@/pages/Login";
import CitationViewer from "@/pages/CitationViewer";
import AnalyticsDashboard from "@/pages/AnalyticsDashboard";
import BrandIntelligence from "@/pages/BrandIntelligence";
import SignalConsistency from "@/pages/SignalConsistency";
import CrawlabilityReport from "@/pages/CrawlabilityReport";
import GeoLandingPageReport from "@/pages/GeoLandingPageReport";
import Landing from "@/pages/Landing";
import ReportsSession from "@/pages/ReportsSession";
import ReportsIndex from "@/pages/ReportsIndex";
import DirectoryListing from "@/pages/DirectoryListing";
import AdminSettings from "@/pages/AdminSettings";
import AdminCaptures from "@/pages/AdminCaptures";
import AdminCosts from "@/pages/AdminCosts";
import { Loader2 } from "lucide-react";

const Methodology = lazy(() => import("@/pages/seo/Methodology"));
const AiSearchAudit = lazy(() => import("@/pages/seo/AiSearchAudit"));
const HowAiSearchWorks = lazy(() => import("@/pages/seo/HowAiSearchWorks"));
const HowToImproveAiCitations = lazy(() => import("@/pages/seo/HowToImproveAiCitations"));
const UseCasePage = lazy(() => import("@/pages/seo/UseCasePage"));
const ChatgptVisibilityAudit = lazy(() => import("@/pages/seo/ChatgptVisibilityAudit"));
const LlmSeoAudit = lazy(() => import("@/pages/seo/LlmSeoAudit"));
const GlossaryPage = lazy(() => import("@/pages/seo/GlossaryPage"));
const ComparePage = lazy(() => import("@/pages/seo/ComparePage"));
const SampleReport = lazy(() => import("@/pages/seo/SampleReport"));

const SEO_PREFIXES = [
  "/methodology", "/ai-search-audit", "/how-ai-search-works",
  "/how-to-improve-ai-citations", "/use-cases", "/chatgpt-visibility-audit",
  "/llm-seo-audit", "/glossary", "/compare", "/sample-report",
];

function SlugTeaser({ params }: { params: { slug: string } }) {
  return <ProspectTeaser slug={params.slug} />;
}

function SlugSummary() {
  return <SummaryReport />;
}

function AuditBySlug({ params }: { params: { slug: string } }) {
  return <SummaryReport auditSlug={params.slug} />;
}

function CollectmaxxReport() {
  return <SummaryReport auditSlug="collectmaxx-reminders" />;
}

function AdminDashboard() {
  return (
    <Switch>
      <Route path="/admin" component={Analyzer} />
      <Route path="/admin/history" component={HistoryPage} />
      <Route path="/admin/prompts" component={PromptGenerator} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/captures" component={AdminCaptures} />
      <Route path="/admin/costs" component={AdminCosts} />
      <Route path="/history" component={HistoryPage} />
      <Route path="/prompts" component={PromptGenerator} />
      <Route path="/scoring/:id" component={ScoringDetail} />
      <Route path="/v2/:id" component={V2SessionDetail} />
      <Route path="/reports/:slug" component={ReportsSession} />
      <Route path="/summary/:id" component={SlugSummary} />
      <Route path="/teaser/:id" component={ProspectTeaser} />
      <Route path="/share/summary/:id" component={SummaryReport} />
      <Route path="/share/teaser/:id" component={ProspectTeaser} />
      <Route path="/leads" component={Leads} />
      <Route path="/incoming-leads" component={IncomingLeads} />
      <Route path="/citations/:sessionId">{(params) => <CitationViewer sessionId={parseInt(params.sessionId)} />}</Route>
      <Route path="/analytics/:sessionId" component={AnalyticsDashboard} />
      <Route path="/analytics" component={AnalyticsDashboard} />
      <Route path="/brand-intelligence" component={BrandIntelligence} />
      <Route path="/signal-consistency" component={SignalConsistency} />
      <Route path="/reports/crawlability" component={CrawlabilityReport} />
      <Route path="/reports/geo-landing-page" component={GeoLandingPageReport} />
      <Route path="/reports/collectmaxx" component={CollectmaxxReport} />
      <Route path="/directory" component={DirectoryListing} />
      <Route path="/audit/:slug">{(params) => <AuditBySlug params={params} />}</Route>
      <Route path="/:slug">{(params) => <SlugTeaser params={params} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthGate() {
  const [authState, setAuthState] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    fetch("/api/auth/check")
      .then(res => res.json())
      .then(data => setAuthState(data.authenticated ? "authenticated" : "unauthenticated"))
      .catch(() => setAuthState("unauthenticated"));
  }, []);

  if (authState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (authState === "authenticated") {
    return <AdminDashboard />;
  }

  return <Login onSuccess={() => window.location.reload()} />;
}

class ChunkErrorBoundary extends Component<{ children: React.ReactNode }, { crashed: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { crashed: false };
  }
  static getDerivedStateFromError(err: Error) {
    const msg = err?.message ?? "";
    const isChunk =
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("Importing a module script failed") ||
      msg.includes("Loading chunk") ||
      (err as any)?.name === "ChunkLoadError";
    return { crashed: !isChunk };
  }
  componentDidCatch(err: Error) {
    const msg = err?.message ?? "";
    const isChunk =
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("Importing a module script failed") ||
      msg.includes("Loading chunk") ||
      (err as any)?.name === "ChunkLoadError";
    if (isChunk) window.location.reload();
  }
  render() {
    if (this.state.crashed) return null;
    return this.props.children;
  }
}

function SeoRoutes({ path }: { path: string }) {
  return (
    <ChunkErrorBoundary>
    <Suspense fallback={null}>
      {path === "/methodology" && <Methodology />}
      {path === "/ai-search-audit" && <AiSearchAudit />}
      {path === "/how-ai-search-works" && <HowAiSearchWorks />}
      {path === "/how-to-improve-ai-citations" && <HowToImproveAiCitations />}
      {path === "/chatgpt-visibility-audit" && <ChatgptVisibilityAudit />}
      {path === "/llm-seo-audit" && <LlmSeoAudit />}
      {path === "/sample-report" && <SampleReport />}
      {path === "/use-cases/brands" && <UseCasePage useCase="brands" />}
      {path === "/use-cases/agencies" && <UseCasePage useCase="agencies" />}
      {path === "/use-cases/b2b-saas" && <UseCasePage useCase="b2b-saas" />}
      {path === "/use-cases/ecommerce" && <UseCasePage useCase="ecommerce" />}
      {path === "/use-cases/local-business" && <UseCasePage useCase="local-business" />}
      {path === "/glossary/generative-engine-optimization" && <GlossaryPage term="generative-engine-optimization" />}
      {path === "/glossary/ai-visibility-score" && <GlossaryPage term="ai-visibility-score" />}
      {path === "/glossary/ai-search-visibility" && <GlossaryPage term="ai-search-visibility" />}
      {path === "/compare/answermonk-vs-profound" && <ComparePage competitor="answermonk-vs-profound" />}
      {path === "/compare/answermonk-vs-ahrefs-brand-radar" && <ComparePage competitor="answermonk-vs-ahrefs-brand-radar" />}
    </Suspense>
    </ChunkErrorBoundary>
  );
}

function App() {
  const [path] = useLocation();

  // Public landing page — always accessible, no auth required
  if (path === "/" || path === "/start" || path.startsWith("/start?")) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Landing />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Public SEO content pages — no auth required
  const isSeoPath = SEO_PREFIXES.some(p => path === p || path.startsWith(p + "/"));
  if (isSeoPath) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SeoRoutes path={path} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Public reports index — /reports exactly
  if (path === "/reports") {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <ReportsIndex />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Public report pages — no auth required
  if (path.startsWith("/reports/")) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <ReportsSession />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // All other routes — require admin auth
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthGate />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
