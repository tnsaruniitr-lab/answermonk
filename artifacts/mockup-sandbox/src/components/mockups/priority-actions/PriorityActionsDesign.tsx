import { useState } from "react";

const actions = [
  {
    num: 1,
    summary: "Commission a dedicated Wikipedia article with VARA license details",
    detail: "Create or commission a dedicated Wikipedia article for 'Binance FZE' or 'Binance UAE operations' with structured infobox containing VARA license VL/24/04/001, ADGM global license details, and comparison table positioning alongside the global entity. Replicate Rain's strategy of maintaining separate regional entity documentation that AI models treat as authoritative reference anchors distinct from parent company pages.",
    weakest: "Secure Wikipedia and directory listing citations as evergreen knowledge base anchors",
    gap: "4 citations — Rain leads with 6",
  },
  {
    num: 2,
    summary: "Publish a joint case study with Fireblocks on custody infrastructure",
    detail: "Pursue a joint case study publication with Fireblocks (who already lists your brand as a customer) emphasising specific compliance features or AED settlement infrastructure. Position your custody and settlement tech as a merchant services enabler to generate distributed citations across fintech vendor blogs — beyond just exchange comparison articles.",
    weakest: "Embed into third-party infrastructure provider case studies as customer proof points",
    gap: "6 citations — Binance leads with 8",
  },
  {
    num: 3,
    summary: "Launch Sharia-compliant custody co-marketing with Liminal or Copper",
    detail: "Partner with custody providers (Liminal, Copper, Fireblocks) to publish a joint 'Sharia-compliant custody' or 'ADGM-licensed infrastructure' case study. Convert your regulatory differentiator into vendor co-marketing content that generates third-party citations, replicating how Binance appears in Fireblocks and payment integration guides as proof of ecosystem maturity.",
    weakest: "Embed into third-party infrastructure provider case studies as customer proof points",
    gap: "0 citations — 8 gap to close",
  },
];

const sources = [
  { domain: "vara.ae", type: "Government", gpt: true, gem: true, cla: true, apps: 18 },
  { domain: "adgm.com", type: "Government", gpt: true, gem: true, cla: true, apps: 14 },
  { domain: "wikipedia.org", type: "Community", gpt: true, gem: true, cla: true, apps: 12 },
  { domain: "godex.io", type: "Brand", gpt: true, gem: true, cla: true, apps: 11 },
  { domain: "sc.com", type: "News", gpt: true, gem: true, cla: true, apps: 10 },
  { domain: "difccourts.ae", type: "Government", gpt: true, gem: true, cla: true, apps: 9 },
  { domain: "ocorian.com", type: "Brand", gpt: true, gem: true, cla: true, apps: 9 },
  { domain: "bitget.com", type: "Brand", gpt: true, gem: true, cla: false, apps: 8 },
  { domain: "transfi.com", type: "Brand", gpt: true, gem: true, cla: false, apps: 8 },
  { domain: "cryptonews.com", type: "News", gpt: true, gem: false, cla: false, apps: 6 },
  { domain: "fireblocks.com", type: "Brand", gpt: false, gem: true, cla: true, apps: 6 },
  { domain: "trustpilot.com", type: "Review Platform", gpt: true, gem: false, cla: false, apps: 5 },
];

const TYPE_COLOR: Record<string, string> = {
  Government: "#f59e0b",
  News: "#60a5fa",
  Brand: "#818cf8",
  Community: "#34d399",
  "Review Platform": "#a78bfa",
};

function Dot({ on }: { on: boolean }) {
  return (
    <span style={{
      display: "inline-block", width: 7, height: 7, borderRadius: "50%",
      background: on ? "#4ade80" : "rgba(255,255,255,0.08)",
      border: on ? "none" : "1px solid rgba(255,255,255,0.1)",
      margin: "0 1px",
    }} />
  );
}

function ActionItem({ action, defaultOpen }: { action: typeof actions[0]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", background: "#0b1120" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <div style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, fontWeight: 900, color: "#818cf8" }}>
          {action.num}
        </div>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.4 }}>{action.summary}</span>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: open ? "rgba(99,102,241,0.14)" : "rgba(255,255,255,0.05)", border: `1px solid ${open ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, color: open ? "#818cf8" : "#64748b", transition: "all 0.15s", transform: open ? "rotate(180deg)" : "none" }}>
          ›
        </div>
      </button>
      {open && (
        <div style={{ padding: "4px 16px 16px 58px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "#080e1c" }}>
          <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.65, margin: "12px 0 10px" }}>{action.detail}</p>
          <div style={{ fontSize: 10, color: "#475569", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 8 }}>
            Weakest tactic: <span style={{ color: "#64748b" }}>{action.weakest}</span>
            <span style={{ color: "#334155" }}> · {action.gap}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function PriorityActionsDesign() {
  const [quickOpen, setQuickOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: "#080c18", padding: "24px 20px", fontFamily: "system-ui, sans-serif" }}>

      {/* ── Priority Actions ── */}
      <div style={{ marginBottom: 28 }}>

        {/* Section header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🎯</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Data-backed moves</div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#f1f5f9", lineHeight: 1.2, margin: 0 }}>Quick actions to leapfrog<br />the competition</h3>
          </div>
        </div>

        {/* Action items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {actions.map((a, i) => <ActionItem key={a.num} action={a} defaultOpen={i === 0} />)}

          {/* Quick Win — bonus item */}
          <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(251,191,36,0.25)", background: "rgba(251,191,36,0.04)" }}>
            <button
              onClick={() => setQuickOpen(o => !o)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
            >
              <div style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>⚡</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#fbbf24", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>Bonus · Quick Win</div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#fde68a", lineHeight: 1.4 }}>Secure a Fireblocks case study mention this week</span>
              </div>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: quickOpen ? "rgba(251,191,36,0.14)" : "rgba(255,255,255,0.05)", border: `1px solid ${quickOpen ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, color: quickOpen ? "#fbbf24" : "#64748b", transition: "all 0.15s", transform: quickOpen ? "rotate(180deg)" : "none" }}>
                ›
              </div>
            </button>
            {quickOpen && (
              <div style={{ padding: "4px 16px 16px 58px", borderTop: "1px solid rgba(251,191,36,0.1)", background: "rgba(251,191,36,0.03)" }}>
                <p style={{ fontSize: 13, color: "#fde68a", lineHeight: 1.65, margin: "12px 0 0", opacity: 0.85 }}>
                  Secure a case study mention in Fireblocks' UAE digital assets blog (currently 6 citations, highest in infrastructure category) by emphasising Sharia-compliant custody integration or ADGM regulatory alignment — pitch compliance differentiation narrative to Fireblocks marketing team this week, immediately capturing high-authority fintech citations.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Sources table ── */}
      <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", background: "#0d1526" }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 60px 60px", padding: "8px 16px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {["Source", "Type", "Engines", "Apps."].map(h => (
            <span key={h} style={{ fontSize: 9, fontWeight: 700, color: "#334155", letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</span>
          ))}
        </div>
        {sources.map((s, i) => (
          <div
            key={s.domain}
            style={{ display: "grid", gridTemplateColumns: "1fr 100px 60px 60px", padding: "8px 16px", alignItems: "center", borderBottom: i < sources.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
          >
            <span style={{ fontSize: 12, fontWeight: 500, color: "#e2e8f0" }}>{s.domain}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: TYPE_COLOR[s.type] ?? "#94a3b8", background: `${TYPE_COLOR[s.type] ?? "#94a3b8"}14`, border: `1px solid ${TYPE_COLOR[s.type] ?? "#94a3b8"}30`, borderRadius: 4, padding: "2px 6px", display: "inline-block" }}>
              {s.type}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Dot on={s.gpt} /><Dot on={s.gem} /><Dot on={s.cla} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>{s.apps}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
