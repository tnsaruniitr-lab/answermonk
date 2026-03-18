const top3 = [
  { domain: "adgm.com", count: 68, gpt: true, gem: true, label: "Regulator" },
  { domain: "vara.ae", count: 52, gpt: true, gem: true, label: "Regulator" },
  { domain: "sc.com", count: 32, gpt: true, gem: true, label: "Institution" },
];

const rest = [
  { rank: 4, domain: "en.wikipedia.org", gpt: true, gem: true, count: 32 },
  { rank: 5, domain: "difccourts.ae", gpt: true, gem: true, count: 24 },
  { rank: 6, domain: "reddit.com", gpt: true, gem: true, count: 20 },
  { rank: 7, domain: "trustpilot.com", gpt: true, gem: true, count: 18 },
  { rank: 8, domain: "xaigate.com", gpt: false, gem: true, count: 16 },
  { rank: 9, domain: "coindesk.com", gpt: true, gem: false, count: 14 },
  { rank: 10, domain: "aquanow.com", gpt: true, gem: true, count: 14 },
];

const podiumColors = ["#f59e0b", "#94a3b8", "#cd7c2f"];
const podiumBg = ["rgba(245,158,11,0.08)", "rgba(148,163,184,0.06)", "rgba(205,124,47,0.06)"];
const podiumBorder = ["rgba(245,158,11,0.2)", "rgba(148,163,184,0.12)", "rgba(205,124,47,0.12)"];
const max = 68;

export function CitationLedger() {
  return (
    <div className="min-h-screen flex items-start justify-center p-6" style={{ background: "#080c18" }}>
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-5">
          <div style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 5, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ display: "inline-block", width: 16, height: 1, background: "#6366f1" }} />
            The Authoritative Sources
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", lineHeight: 1.25, margin: 0 }}>
            Sources LLMs trust most<br />when citing category leaders
          </h2>
        </div>

        {/* Top 3 podium */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {top3.map((s, i) => (
            <div
              key={s.domain}
              className="rounded-xl p-3 text-center"
              style={{ background: podiumBg[i], border: `1px solid ${podiumBorder[i]}` }}
            >
              <div style={{ fontSize: 18, fontWeight: 900, color: podiumColors[i], lineHeight: 1 }}>#{i + 1}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0", marginTop: 4, lineHeight: 1.2 }}>{s.domain}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: podiumColors[i], marginTop: 6 }}>{s.count}</div>
              <div style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>citations</div>
              <div className="flex justify-center gap-1 mt-2">
                {s.gpt && <span style={{ fontSize: 7, fontWeight: 700, padding: "1px 4px", borderRadius: 2, background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}>GPT</span>}
                {s.gem && <span style={{ fontSize: 7, fontWeight: 700, padding: "1px 4px", borderRadius: 2, background: "rgba(96,165,250,0.12)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.2)" }}>Gem</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Rest of list */}
        <div className="rounded-xl overflow-hidden" style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.06)" }}>
          {rest.map((s, i) => (
            <div
              key={s.domain}
              className="flex items-center gap-3 px-4 py-2"
              style={{ borderBottom: i < rest.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
            >
              <span style={{ fontSize: 10, fontWeight: 600, color: "#334155", width: 18, textAlign: "right", flexShrink: 0 }}>{s.rank}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#cbd5e1", flex: 1, minWidth: 0 }} className="truncate">{s.domain}</span>
              <div className="flex gap-1 shrink-0">
                <span style={{ fontSize: 7, fontWeight: 700, padding: "1px 4px", borderRadius: 2, opacity: s.gpt ? 1 : 0.15, background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}>GPT</span>
                <span style={{ fontSize: 7, fontWeight: 700, padding: "1px 4px", borderRadius: 2, opacity: s.gem ? 1 : 0.15, background: "rgba(96,165,250,0.12)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.2)" }}>Gem</span>
              </div>
              <div style={{ width: 56, height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden", flexShrink: 0 }}>
                <div style={{ height: "100%", width: `${(s.count / max) * 100}%`, background: "rgba(99,102,241,0.6)", borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", width: 20, textAlign: "right", flexShrink: 0 }}>{s.count}</span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 10, color: "#334155", marginTop: 8, textAlign: "center" }}>
          25 authority sources · pure SQL, no AI required
        </div>
      </div>
    </div>
  );
}
