import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
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
import CrawlabilityReport from "@/pages/CrawlabilityReport";
import GeoLandingPageReport from "@/pages/GeoLandingPageReport";
import { Loader2 } from "lucide-react";

function AdminRouter() {
  return (
    <Switch>
      <Route path="/" component={Analyzer} />
      <Route path="/history" component={HistoryPage} />
      <Route path="/prompts" component={PromptGenerator} />
      <Route path="/scoring/:id" component={ScoringDetail} />
      <Route path="/v2/:id" component={V2SessionDetail} />
      <Route path="/summary/:id" component={SummaryReport} />
      <Route path="/teaser/:id" component={ProspectTeaser} />
      <Route path="/reports/collectmaxx" component={CollectmaxxReport} />
      <Route path="/leads" component={Leads} />
      <Route path="/incoming-leads" component={IncomingLeads} />
      <Route component={NotFound} />
    </Switch>
  );
}

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

function PublicRouter() {
  return (
    <Switch>
      <Route path="/share/summary/:id" component={SummaryReport} />
      <Route path="/share/teaser/:id" component={ProspectTeaser} />
      <Route path="/analytics/:sessionId" component={AnalyticsDashboard} />
      <Route path="/analytics" component={AnalyticsDashboard} />
      <Route path="/reports/crawlability" component={CrawlabilityReport} />
      <Route path="/reports/geo-landing-page" component={GeoLandingPageReport} />
      <Route path="/reports/collectmaxx" component={CollectmaxxReport} />
      <Route path="/summary/:id" component={SlugSummary} />
      <Route path="/incoming-leads">
        <Login onSuccess={() => window.location.reload()} />
      </Route>
      <Route path="/leads">
        <Login onSuccess={() => window.location.reload()} />
      </Route>
      <Route path="/audit/:slug">{(params) => <AuditBySlug params={params} />}</Route>
      <Route path="/:slug">{(params) => <SlugTeaser params={params} />}</Route>
      <Route>
        <Login onSuccess={() => window.location.reload()} />
      </Route>
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
    return (
      <>
        <Switch>
          <Route path="/share/summary/:id" component={SummaryReport} />
          <Route path="/share/teaser/:id" component={ProspectTeaser} />
          <Route path="/history" component={HistoryPage} />
          <Route path="/prompts" component={PromptGenerator} />
          <Route path="/scoring/:id" component={ScoringDetail} />
          <Route path="/v2/:id" component={V2SessionDetail} />
          <Route path="/summary/:id" component={SummaryReport} />
          <Route path="/teaser/:id" component={ProspectTeaser} />
          <Route path="/leads" component={Leads} />
          <Route path="/incoming-leads" component={IncomingLeads} />
          <Route path="/citations/:sessionId">{(params) => <CitationViewer sessionId={parseInt(params.sessionId)} />}</Route>
          <Route path="/analytics/:sessionId">{(params) => <AnalyticsDashboard />}</Route>
          <Route path="/analytics" component={AnalyticsDashboard} />
          <Route path="/brand-intelligence" component={BrandIntelligence} />
          <Route path="/reports/crawlability" component={CrawlabilityReport} />
          <Route path="/reports/geo-landing-page" component={GeoLandingPageReport} />
          <Route path="/reports/collectmaxx" component={CollectmaxxReport} />
          <Route path="/audit/:slug">{(params) => <AuditBySlug params={params} />}</Route>
          <Route path="/" component={Analyzer} />
          <Route path="/:slug">{(params) => <SlugTeaser params={params} />}</Route>
          <Route component={NotFound} />
        </Switch>
      </>
    );
  }

  return <PublicRouter />;
}

function App() {
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
