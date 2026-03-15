import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Globe, MapPin, Briefcase, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { IncomingLead } from "@shared/schema";

function statusColor(status: string) {
  if (status === "processed") return "default";
  return "secondary";
}

export default function IncomingLeads() {
  const { toast } = useToast();

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

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading leads...
        </div>
      ) : leads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No incoming leads yet. The other app will POST here when a classification completes.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <Card key={lead.id} data-testid={`card-lead-${lead.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-base" data-testid={`text-business-name-${lead.id}`}>
                    {lead.businessName || "Unnamed Business"}
                  </CardTitle>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={statusColor(lead.status)} data-testid={`status-lead-${lead.id}`}>
                      {lead.status === "processed" ? (
                        <><CheckCircle className="h-3 w-3 mr-1" />Processed</>
                      ) : (
                        <><Clock className="h-3 w-3 mr-1" />Pending</>
                      )}
                    </Badge>
                    {lead.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`button-mark-processed-${lead.id}`}
                        onClick={() => markProcessed.mutate(lead.id)}
                        disabled={markProcessed.isPending}
                      >
                        Mark Processed
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
                {lead.services && lead.services.length > 0 && (
                  <div className="flex items-start gap-2 text-muted-foreground" data-testid={`text-services-${lead.id}`}>
                    <Briefcase className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {lead.services.map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="text-xs text-muted-foreground pt-1">
                  Received {lead.receivedAt ? new Date(lead.receivedAt).toLocaleString() : "—"}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
