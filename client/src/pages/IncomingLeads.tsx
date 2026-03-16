import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Loader2, Globe, MapPin, Briefcase, CheckCircle, Clock,
  FlaskConical, ChevronDown, ChevronUp, Sparkles, ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { IncomingLead } from "@shared/schema";

function statusColor(status: string) {
  if (status === "processed") return "default";
  return "secondary";
}

function extractDomain(url: string | null): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function buildSegments(services: string[], city: string | null) {
  return services.map((s) => ({
    persona: s,
    seedType: "__blank__",
    serviceType: "",
    customerType: "",
    customerTypeEnabled: false,
    location: city || "",
    resultCount: 10,
    prompts: null,
    scoringResult: null,
  }));
}

export default function IncomingLeads() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showTest, setShowTest] = useState(false);
  const [confirmingLeadId, setConfirmingLeadId] = useState<number | null>(null);
  const [testForm, setTestForm] = useState({
    url: "", business_name: "", services: "", city: "",
  });

  const { data: leads = [], isLoading } = useQuery<IncomingLead[]>({
    queryKey: ["/api/incoming-leads"],
  });

  const markProcessed = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/incoming-leads/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "processed" }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incoming-leads"] });
      toast({ title: "Marked as processed" });
    },
  });

  const createV2Session = useMutation({
    mutationFn: async (lead: IncomingLead) => {
      const services = lead.services || [];
      const segments = buildSegments(services, lead.city);
      const res = await fetch("/api/multisegment/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: lead.businessName || "Unnamed Business",
          brandDomain: extractDomain(lead.url),
          promptsPerSegment: 3,
          segments,
          sessionType: "brand",
        }),
      });
      if (!res.ok) throw new Error("Failed to create session");
      return res.json();
    },
    onSuccess: (data, lead) => {
      markProcessed.mutate(lead.id);
      navigate(`/v2/${data.id}`);
    },
    onError: () => {
      toast({ title: "Failed to create V2 session", variant: "destructive" });
    },
  });

  const sendTest = useMutation({
    mutationFn: async () => {
      const servicesArray = testForm.services.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await fetch("/api/webhooks/incoming", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: testForm.url || undefined,
          business_name: testForm.business_name || undefined,
          services: servicesArray.length ? servicesArray : undefined,
          city: testForm.city || undefined,
        }),
      });
      if (!res.ok) throw new Error("Webhook failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/incoming-leads"] });
      toast({ title: `Test received — Lead #${data.id} created` });
      setTestForm({ url: "", business_name: "", services: "", city: "" });
    },
    onError: () => {
      toast({ title: "Test failed", variant: "destructive" });
    },
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="heading-incoming-leads">Incoming Leads</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Businesses received via webhook from the classifier app
        </p>
        <div className="mt-3 p-3 bg-muted rounded-md text-sm font-mono text-muted-foreground">
          Webhook endpoint: <span className="text-foreground">POST /api/webhooks/incoming</span>
        </div>
      </div>

      <Card className="border-dashed">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => setShowTest(!showTest)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FlaskConical className="h-4 w-4" />
              Test the webhook
            </div>
            {showTest ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </CardHeader>
        {showTest && (
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Fill in sample data and send it — if it appears in the list below, the webhook is working correctly.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="test-url">Business URL</Label>
                <Input id="test-url" data-testid="input-test-url" placeholder="https://feelvaleo.com/en-ae/dubai"
                  value={testForm.url} onChange={(e) => setTestForm((f) => ({ ...f, url: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="test-name">Business Name</Label>
                <Input id="test-name" data-testid="input-test-name" placeholder="Feelvaleo"
                  value={testForm.business_name} onChange={(e) => setTestForm((f) => ({ ...f, business_name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="test-services">Services <span className="text-muted-foreground">(comma-separated)</span></Label>
                <Input id="test-services" data-testid="input-test-services" placeholder="Physiotherapy, Pilates, Massage"
                  value={testForm.services} onChange={(e) => setTestForm((f) => ({ ...f, services: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="test-city">City</Label>
                <Input id="test-city" data-testid="input-test-city" placeholder="Dubai"
                  value={testForm.city} onChange={(e) => setTestForm((f) => ({ ...f, city: e.target.value }))} />
              </div>
            </div>
            <Button data-testid="button-send-test" onClick={() => sendTest.mutate()} disabled={sendTest.isPending}>
              {sendTest.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending...</> : "Send Test Payload"}
            </Button>
          </CardContent>
        )}
      </Card>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />Loading leads...
        </div>
      ) : leads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No incoming leads yet. Use the test panel above or wait for the classifier app to send data.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => {
            const isConfirming = confirmingLeadId === lead.id;
            const hasServices = lead.services && lead.services.length > 0;
            const segments = hasServices ? buildSegments(lead.services!, lead.city) : [];

            return (
              <Card key={lead.id} data-testid={`card-lead-${lead.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-base" data-testid={`text-business-name-${lead.id}`}>
                      {lead.businessName || "Unnamed Business"}
                    </CardTitle>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={statusColor(lead.status)} data-testid={`status-lead-${lead.id}`}>
                        {lead.status === "processed"
                          ? <><CheckCircle className="h-3 w-3 mr-1" />Processed</>
                          : <><Clock className="h-3 w-3 mr-1" />Pending</>}
                      </Badge>
                      {hasServices && (
                        <Button
                          size="sm"
                          variant={isConfirming ? "default" : "outline"}
                          data-testid={`button-create-v2-${lead.id}`}
                          onClick={() => setConfirmingLeadId(isConfirming ? null : lead.id)}
                        >
                          <Sparkles className="h-3.5 w-3.5 mr-1" />
                          {isConfirming ? "Cancel" : "Create V2 Session"}
                        </Button>
                      )}
                      {lead.status === "pending" && (
                        <Button size="sm" variant="ghost" data-testid={`button-mark-processed-${lead.id}`}
                          onClick={() => markProcessed.mutate(lead.id)} disabled={markProcessed.isPending}>
                          Mark Done
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {lead.url && (
                    <div className="flex items-center gap-2 text-muted-foreground" data-testid={`text-url-${lead.id}`}>
                      <Globe className="h-3.5 w-3.5 shrink-0" />
                      <a href={lead.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-foreground truncate">
                        {lead.url}
                      </a>
                    </div>
                  )}
                  {lead.city && (
                    <div className="flex items-center gap-2 text-muted-foreground" data-testid={`text-city-${lead.id}`}>
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>{lead.city}</span>
                    </div>
                  )}
                  {hasServices && (
                    <div className="flex items-start gap-2 text-muted-foreground" data-testid={`text-services-${lead.id}`}>
                      <Briefcase className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <div className="flex flex-wrap gap-1">
                        {lead.services!.map((s, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground pt-1">
                    Received {lead.receivedAt ? new Date(lead.receivedAt).toLocaleString() : "—"}
                  </div>

                  {isConfirming && (
                    <>
                      <Separator className="my-3" />
                      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                        <p className="text-sm font-medium">V2 Session Preview</p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div><span className="text-foreground font-medium">Brand:</span> {lead.businessName || "Unnamed Business"}</div>
                          <div><span className="text-foreground font-medium">Domain:</span> {extractDomain(lead.url)}</div>
                          <div><span className="text-foreground font-medium">Prompts per segment:</span> 3</div>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {segments.length} segments
                          </p>
                          {segments.map((seg, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs bg-background rounded px-2 py-1.5 border">
                              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="font-medium">{seg.serviceType}</span>
                              {seg.location && <span className="text-muted-foreground">· {seg.location}</span>}
                            </div>
                          ))}
                        </div>
                        <Button
                          className="w-full"
                          data-testid={`button-confirm-v2-${lead.id}`}
                          onClick={() => createV2Session.mutate(lead)}
                          disabled={createV2Session.isPending}
                        >
                          {createV2Session.isPending
                            ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating session...</>
                            : <><Sparkles className="h-4 w-4 mr-2" />Confirm — Open in V2</>}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
