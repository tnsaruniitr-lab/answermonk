import { useQuery } from "@tanstack/react-query";
import { Loader2, ExternalLink, CheckCircle2, AlertCircle, XCircle, MinusCircle } from "lucide-react";
import { MonkWordmark } from "@/components/MonkWordmark";

const ENGINE_COLORS: Record<string, string> = {
  chatgpt: "#10a37f",
  gemini: "#4285f4",
  claude: "#d97706",
};

const ENGINE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
};

function IdentityBadge({ match }: { match: string }) {
  const configs: Record<string, { icon: React.ReactNode; label: string; bg: string; color: string }> = {
    confirmed: { icon: <CheckCircle2 size={13} />, label: "Confirmed you", bg: "#ecfdf5", color: "#059669" },
    partial: { icon: <AlertCircle size={13} />, label: "Partial match", bg: "#fffbeb", color: "#d97706" },
    wrong: { icon: <XCircle size={13} />, label: "Wrong person", bg: "#fef2f2", color: "#dc2626" },
    absent: { icon: <MinusCircle size={13} />, label: "Not found", bg: "#f9fafb", color: "#9ca3af" },
  };
  const cfg = configs[match] ?? configs.absent;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: cfg.bg, color: cfg.color,
      borderRadius: 100, padding: "3px 10px", fontSize: 12, fontWeight: 600,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function ScoreCard({ score, grade, label, description, color }: {
  score: number; grade: string; label: string; description: string; color: string;
}) {
  const gradeColors: Record<string, string> = { A: "#059669", B: "#0891b2", C: "#d97706", D: "#ea580c", F: "#dc2626" };
  const gradeColor = gradeColors[grade] ?? "#dc2626";
  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: 28,
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6",
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
        <span style={{ fontSize: 52, fontWeight: 900, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 28, fontWeight: 800, color: gradeColor, lineHeight: 1, marginBottom: 4 }}>{grade}</span>
      </div>
      <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{description}</p>
    </div>
  );
}

export default function PeopleReport({ slug }: { slug: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/people/report", slug],
    queryFn: async () => {
      const res = await fetch(`/api/people/report/${slug}`);
      return res.json();
    },
  });

  if (isLoading || !data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f7ff" }}>
        <Loader2 size={32} color="#6366f1" className="animate-spin" />
      </div>
    );
  }

  const { session, scores, reportData } = data;
  const rd = reportData ?? {};

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7ff", fontFamily: "Inter, system-ui, sans-serif" }}>
      <nav style={{ padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(99,102,241,0.1)", background: "#fff" }}>
        <a href="/" style={{ textDecoration: "none" }}><MonkWordmark /></a>
        <a href="/people" style={{ fontSize: 13, color: "#6366f1", fontWeight: 600, textDecoration: "none", padding: "8px 16px", background: "#eef2ff", borderRadius: 8 }}>
          New audit
        </a>
      </nav>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 6 }}>AI Identity Report</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f0a2e", marginBottom: 4 }}>{session?.name}</h1>
          {session?.headline && <p style={{ fontSize: 15, color: "#6b7280" }}>{session.headline}</p>}
        </div>

        {/* Two-score dashboard */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <ScoreCard
            score={scores?.recognitionScore ?? 0}
            grade={scores?.recognitionGrade ?? "F"}
            label="AI Recognition Score"
            description="How well AI surfaces you by name alone, without context"
            color="#6366f1"
          />
          <ScoreCard
            score={scores?.proofScore ?? 0}
            grade={scores?.proofGrade ?? "F"}
            label="Identity Proof Score"
            description="How accurately and well-sourced AI describes you when it finds you"
            color="#8b5cf6"
          />
        </div>

        {scores?.diagnosticText && (
          <div style={{
            background: "#fff", borderRadius: 12, padding: "16px 20px",
            border: "1px solid rgba(99,102,241,0.15)", marginBottom: 40,
            borderLeft: "4px solid #6366f1",
          }}>
            <p style={{ fontSize: 14, color: "#1f2937", lineHeight: 1.6, margin: 0 }}>
              <strong>Diagnosis:</strong> {scores.diagnosticText}
            </p>
          </div>
        )}

        {/* Section 1: How AI sees you */}
        <Section title="How AI sees you right now">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {(rd.engineCards ?? []).map((card: any) => (
              <EngineCard key={card.engine} card={card} />
            ))}
          </div>
        </Section>

        {/* Section 2: Default recognition */}
        <Section title="Default recognition — Who is you?">
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
            What each AI engine says when asked "Who is {session?.name}?" with zero context.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {(rd.defaultRecognition ?? []).map((item: any) => (
              <DefaultCard key={item.engine} item={item} />
            ))}
          </div>
        </Section>

        {/* Section 3: Name landscape */}
        {(rd.nameLandscape ?? []).length > 0 && (
          <Section title={`Name landscape — All ${session?.name?.split(" ").pop()}s AI knows`}>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
              Everyone with your name that AI surfaces, ranked by prominence.
            </p>
            <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", border: "1px solid #f3f4f6" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    <th style={thStyle}>Rank</th>
                    <th style={thStyle}>Person</th>
                    <th style={thStyle}>Known for</th>
                    <th style={thStyle}>Engines</th>
                  </tr>
                </thead>
                <tbody>
                  {(rd.nameLandscape ?? []).map((person: any, i: number) => {
                    const isTarget = session?.name && person.name?.toLowerCase().includes(session.name.split(" ")[0]?.toLowerCase());
                    return (
                      <tr key={i} style={{ background: isTarget ? "#eef2ff" : "transparent", borderTop: "1px solid #f3f4f6" }}>
                        <td style={{ ...tdStyle, fontWeight: 700, color: isTarget ? "#6366f1" : "#9ca3af" }}>#{person.rank ?? i + 1}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: isTarget ? "#4f46e5" : "#1f2937" }}>
                          {person.name} {isTarget && <span style={{ fontSize: 11, background: "#c7d2fe", color: "#4f46e5", borderRadius: 4, padding: "1px 6px", marginLeft: 4 }}>You</span>}
                        </td>
                        <td style={{ ...tdStyle, color: "#6b7280", fontSize: 13 }}>{person.description?.slice(0, 80)}</td>
                        <td style={{ ...tdStyle, fontSize: 12, color: "#9ca3af" }}>{(person.engines ?? []).join(", ")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* Section 4: Source graph */}
        {(rd.sourceGraph ?? []).length > 0 && (
          <Section title="Source graph — Where AI gets its knowledge of you">
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
              Domains cited by AI engines when answering questions about you.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(rd.sourceGraph ?? []).map((src: any, i: number) => (
                <SourceRow key={i} src={src} max={(rd.sourceGraph[0]?.citationCount ?? 1)} />
              ))}
            </div>
          </Section>
        )}

        {/* Section 5: Recommendations */}
        <Section title="Recommendations">
          <Recommendations scores={scores} sourceGraph={rd.sourceGraph} nameLandscape={rd.nameLandscape} />
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f0a2e", marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid #e5e7eb" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function EngineCard({ card }: { card: any }) {
  const color = ENGINE_COLORS[card.engine] ?? "#6366f1";
  const label = ENGINE_LABELS[card.engine] ?? card.engine;
  return (
    <div style={{
      background: "#fff", borderRadius: 12, padding: 20,
      border: "1px solid #f3f4f6",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{label}</span>
        <IdentityBadge match={card.identityMatch ?? "absent"} />
      </div>
      <p style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.6, marginBottom: 12, minHeight: 60 }}>
        {card.description ? `"${card.description.slice(0, 200)}..."` : "No response"}
      </p>
      {(card.citedUrls ?? []).length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginBottom: 4 }}>Sources</div>
          {(card.citedUrls ?? []).slice(0, 2).map((url: string, i: number) => {
            let domain = url;
            try { domain = new URL(url).hostname.replace(/^www\./, ""); } catch {}
            return (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                style={{ display: "block", fontSize: 11, color: "#6366f1", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {domain}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DefaultCard({ item }: { item: any }) {
  const color = ENGINE_COLORS[item.engine] ?? "#6366f1";
  const label = ENGINE_LABELS[item.engine] ?? item.engine;
  return (
    <div style={{
      background: "#fff", borderRadius: 12, padding: 20,
      border: "1px solid #f3f4f6", display: "flex", gap: 16, alignItems: "flex-start",
    }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, marginTop: 5, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1f2937" }}>{label}</span>
          <IdentityBadge match={item.identityMatch ?? "absent"} />
        </div>
        <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.6, margin: 0 }}>
          {item.response ? `"${item.response.slice(0, 300)}..."` : "No response returned"}
        </p>
      </div>
    </div>
  );
}

function SourceRow({ src, max }: { src: any; max: number }) {
  const pct = Math.round((src.citationCount / max) * 100);
  return (
    <div style={{
      background: "#fff", borderRadius: 10, padding: "12px 16px",
      border: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 12,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <a href={`https://${src.domain}`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 13, fontWeight: 600, color: "#4f46e5", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
            {src.domain} <ExternalLink size={11} />
          </a>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>{src.citationCount} citation{src.citationCount !== 1 ? "s" : ""}</span>
        </div>
        <div style={{ height: 4, background: "#f3f4f6", borderRadius: 100 }}>
          <div style={{ height: "100%", background: "#6366f1", borderRadius: 100, width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

function Recommendations({ scores, sourceGraph, nameLandscape }: any) {
  const recs: { priority: number; text: string }[] = [];

  if ((scores?.recognitionScore ?? 0) < 40) {
    recs.push({ priority: 1, text: "Wikipedia presence — the single biggest factor separating top-ranked people with your name. A Wikipedia stub with your name, role, and company creates an immediate high-authority anchor for AI engines." });
  }
  if ((sourceGraph ?? []).length < 3) {
    recs.push({ priority: 2, text: "Press mentions in authoritative publications — TechCrunch, Forbes, industry-specific outlets. One well-indexed profile feature gives AI engines a citable, high-authority source for your identity claims." });
  }
  if ((sourceGraph ?? []).every((s: any) => s.domain.includes("linkedin"))) {
    recs.push({ priority: 3, text: "Diversify your source graph beyond LinkedIn. AI citing only LinkedIn for your identity is fragile — a single source means low confidence. Podcast appearances, speaker pages, and company blog profiles each add a distinct citation point." });
  }
  if ((scores?.proofScore ?? 0) < 50) {
    recs.push({ priority: 4, text: "Claim and complete high-authority directory listings — Crunchbase, AngelList, F6S, relevant industry directories. These pages are indexed by AI engines and frequently cited in identity responses." });
  }
  if ((nameLandscape ?? []).length > 0 && (scores?.recognitionScore ?? 0) < 60) {
    recs.push({ priority: 5, text: "Build industry-specific content under your name — bylined articles, LinkedIn newsletters, or a personal blog. Content that consistently references your name alongside your field creates a strong name-expertise association in AI training data." });
  }

  if (recs.length === 0) {
    recs.push({ priority: 1, text: "Your AI identity is strong. Maintain it by publishing regularly under your name, updating your professional profiles, and pursuing press opportunities to keep your source graph fresh." });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {recs.sort((a, b) => a.priority - b.priority).map((rec, i) => (
        <div key={i} style={{
          background: "#fff", borderRadius: 12, padding: "16px 20px",
          border: "1px solid #f3f4f6", display: "flex", gap: 16, alignItems: "flex-start",
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: "50%",
            background: i === 0 ? "#6366f1" : "#e0e7ff",
            color: i === 0 ? "#fff" : "#6366f1",
            fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            {i + 1}
          </div>
          <p style={{ fontSize: 14, color: "#1f2937", lineHeight: 1.6, margin: 0 }}>{rec.text}</p>
        </div>
      ))}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase",
  letterSpacing: "0.06em", padding: "10px 16px", textAlign: "left",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px", fontSize: 14, verticalAlign: "top",
};
