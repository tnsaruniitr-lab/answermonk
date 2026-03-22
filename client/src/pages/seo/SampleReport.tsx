import { useQuery } from "@tanstack/react-query";
import { SEOLayout, PageHero, Section, ProseP, CTABox } from "./SEOLayout";
import { Link } from "wouter";

interface DirectoryTile {
  id: number;
  sessionId: number;
  query: string;
  category: string;
  brandName: string;
  brandDomain: string;
  topBrand: string | null;
  topScore: number;
  rivals: string[];
  engines: { chatgpt: boolean; gemini: boolean; claude: boolean };
  createdAt: string;
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 60 ? "#10b981" : score >= 30 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{score}%</span>
      </div>
      <div style={{ height: 8, background: "rgba(0,0,0,0.07)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

function EngineTag({ name, active }: { name: string; active: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: active ? "rgba(79,70,229,0.08)" : "rgba(0,0,0,0.04)",
      color: active ? "#4f46e5" : "#9ca3af", border: `1px solid ${active ? "rgba(79,70,229,0.2)" : "rgba(0,0,0,0.08)"}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#4f46e5" : "#d1d5db", display: "inline-block" }} />
      {name}
    </span>
  );
}

function AuditCard({ tile, index }: { tile: DirectoryTile; index: number }) {
  const date = new Date(tile.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return (
    <div style={{
      background: "rgba(255,255,255,0.85)", borderRadius: 16, border: "1px solid rgba(0,0,0,0.08)", padding: 28, marginBottom: 24,
      boxShadow: "0 2px 16px rgba(79,70,229,0.06)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7c3aed", marginBottom: 4 }}>
            Example Audit #{index + 1}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>{tile.brandName}</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{tile.brandDomain} · {date}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>AI Visibility Score</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: tile.topScore >= 50 ? "#10b981" : tile.topScore >= 25 ? "#f59e0b" : "#ef4444", letterSpacing: "-0.02em" }}>
            {tile.topScore}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Query category</div>
        <div style={{ fontSize: 14, color: "#374151", padding: "8px 12px", background: "rgba(79,70,229,0.04)", borderRadius: 8, borderLeft: "3px solid #7c3aed" }}>
          {tile.query}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>AI engine presence</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <EngineTag name="ChatGPT" active={tile.engines.chatgpt} />
          <EngineTag name="Gemini" active={tile.engines.gemini} />
          <EngineTag name="Claude" active={tile.engines.claude} />
        </div>
      </div>

      {tile.topBrand && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Top competitor in AI search</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{tile.topBrand}</span>
            {tile.rivals.length > 0 && (
              <span style={{ fontSize: 12, color: "#9ca3af" }}>+ {tile.rivals.join(", ")}</span>
            )}
          </div>
        </div>
      )}

      <ScoreBar score={tile.topScore} label={`${tile.brandName} AI appearance rate`} />

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", justifyContent: "flex-end" }}>
        <Link href="/start">
          <span style={{ fontSize: 13, fontWeight: 600, color: "#4f46e5", cursor: "pointer" }}>Run your own audit →</span>
        </Link>
      </div>
    </div>
  );
}

export default function SampleReport() {
  const { data: tiles = [], isLoading } = useQuery<DirectoryTile[]>({
    queryKey: ["/api/directory/recent"],
  });

  const displayTiles = tiles.slice(0, 3);

  return (
    <SEOLayout
      title="Sample AI Search Visibility Report | AnswerMonk"
      description="See real examples of AnswerMonk AI search visibility audits — showing brand appearance rates, competitor benchmarks, and AI engine coverage."
    >
      <PageHero
        eyebrow="Sample Report"
        headline="Real AI search visibility audits"
        sub="These are actual audits run through AnswerMonk — showing AI appearance rates, competitor benchmarks, and which engines each brand appears on."
      />

      <Section title="What each audit shows">
        <ProseP>
          Each audit below represents a real brand analysis. You can see the query category that was tested, the brand's AI visibility score, which AI engines (ChatGPT, Gemini, Claude) mentioned the brand, and who the top competitors were in AI search for that category.
        </ProseP>
        <ProseP>
          The AI visibility score reflects the brand's weighted appearance rate across all tested prompts and engines. A score of 50 means the brand appeared in roughly half of the relevant queries tested. A score above 70 indicates strong AI search presence.
        </ProseP>
      </Section>

      {isLoading && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: 14 }}>
          Loading recent audits…
        </div>
      )}

      {!isLoading && displayTiles.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: 14 }}>
          No completed audits available yet. Run the first one →
        </div>
      )}

      {displayTiles.map((tile, i) => (
        <AuditCard key={tile.id} tile={tile} index={i} />
      ))}

      <Section title="How to read these results">
        <ProseP>
          <strong>AI Visibility Score</strong> — a 0–100 number representing how often the brand appeared across all tested prompts and AI engines, weighted by engine market share. Higher is better.
        </ProseP>
        <ProseP>
          <strong>Engine presence</strong> — which AI engines mentioned the brand. A brand can appear frequently on ChatGPT but rarely on Gemini, or vice versa. The engine breakdown is critical because different segments of your audience use different AI engines.
        </ProseP>
        <ProseP>
          <strong>Top competitors</strong> — the brands that AI engines recommended most frequently in the same category. These are not manually selected — they emerge organically from what AI engines say.
        </ProseP>
      </Section>

      <CTABox />
    </SEOLayout>
  );
}
