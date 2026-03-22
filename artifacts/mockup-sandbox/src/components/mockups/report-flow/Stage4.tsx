import { useState } from "react";

const STAGES = [
  { id: 1, label: "Profile Generated" },
  { id: 2, label: "LLM Rank" },
  { id: 3, label: "Authority Domains" },
  { id: 4, label: "Action Report" },
];

function PipelineBar() {
  return (
    <div style={{ background: "#070d1a", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 18px", display: "flex", alignItems: "center", height: 50, gap: 0, flexShrink: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: "#10b981", marginRight: 18, letterSpacing: "0.12em", fontFamily: "monospace", flexShrink: 0 }}>AM /</div>
      <div style={{ display: "flex", alignItems: "center", flex: 1, gap: 0 }}>
        {STAGES.map((s, i) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", flex: i < 3 ? 1 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
              <div style={{ width: 19, height: 19, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "#10b981", fontSize: 9, fontWeight: 700, color: "#fff" }}>✓</div>
              <div style={{ fontSize: 10.5, fontWeight: 500, color: "#10b981", whiteSpace: "nowrap" }}>{s.label}</div>
            </div>
            {i < 3 && <div style={{ flex: 1, height: 1, margin: "0 10px", background: "rgba(16,185,129,0.5)", minWidth: 12 }} />}
          </div>
        ))}
      </div>
      <div style={{ marginLeft: 16, fontSize: 10, color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 5, padding: "3px 9px", fontWeight: 600, flexShrink: 0 }}>COMPLETE</div>
    </div>
  );
}

function CollapsedSection({ icon, title, meta, expandedContent, defaultOpen = false }: { icon: string; title: string; meta: string; expandedContent?: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, marginBottom: 10, overflow: "hidden" }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
      >
        <div style={{ fontSize: 16, flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "#e2e8f0" }}>{title}</div>
          <div style={{ fontSize: 10.5, color: "#475569", marginTop: 2 }}>{meta}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 9.5, color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 4, padding: "2px 7px", fontWeight: 600 }}>DONE</span>
          <span style={{ color: "#6366f1", fontSize: 14, transform: open ? "rotate(90deg)" : "none", display: "inline-block", transition: "transform 0.2s" }}>›</span>
        </div>
      </div>
      {open && expandedContent && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#060f1e", padding: "12px 14px" }}>
          {expandedContent}
        </div>
      )}
    </div>
  );
}

const rankingContent = (
  <div>
    {[
      { brand: "Call Doctor", pct: 67, color: "#818cf8" },
      { brand: "Eureka Home Health", pct: 31, color: "#a5b4fc" },
      { brand: "Nightingale Health", pct: 24, color: "#c4b5fd" },
      { brand: "Dubai Physio", pct: 18, color: "#ddd6fe" },
    ].map((r, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%", background: r.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#1e1b4b", flexShrink: 0 }}>{i + 1}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11.5, color: "#e2e8f0", fontWeight: 500 }}>{r.brand}</span>
            <span style={{ fontSize: 11, color: r.color }}>{r.pct}%</span>
          </div>
          <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2 }}>
            <div style={{ height: "100%", width: `${r.pct}%`, background: r.color, borderRadius: 2 }} />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const reportContent = (
  <div>
    <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>⚡ Key Finding</div>
    <p style={{ fontSize: 11.5, color: "#94a3b8", lineHeight: 1.6, margin: "0 0 12px 0" }}>Regulatory licensing pages (VARA public register) and brand homepages dominate AI citations, with BitGo, Zodia Custody, and Hex Trust leveraging government registry presence to achieve 60% of all citations.</p>
    <div style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Top GEO Tactics · 5 found</div>
    {["Claim your listing on every government licensing registry", "Publish dedicated service pages for each use-case keyword", "Build authority through high-DA directory partnerships"].map((t, i) => (
      <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#818cf8", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
        <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>{t}</div>
      </div>
    ))}
  </div>
);

export function Stage4() {
  return (
    <div style={{ background: "#060f1e", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "system-ui, sans-serif" }}>
      <PipelineBar />

      <div style={{ padding: "14px 18px", flex: 1 }}>
        <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.18)", borderRadius: 10, padding: "9px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14 }}>✓</span>
          <div style={{ fontSize: 12, color: "#34d399", fontWeight: 500 }}>Analysis complete · your GEO intelligence report is ready</div>
        </div>

        <CollapsedSection icon="📊" title="Rankings · 4 segments" meta="Call Doctor 67% · Eureka 31% · Nightingale 24% · Dubai Physio 18%" expandedContent={rankingContent} />
        <CollapsedSection icon="🌐" title="Authority Domains · 529 URLs" meta="187 domains indexed · top sources mapped" />
        <CollapsedSection icon="◆" title="Action Report · GEO Citation Analysis" meta="Generated just now · 5 tactics · 3 champions · expand to view" expandedContent={reportContent} defaultOpen />
      </div>
    </div>
  );
}
