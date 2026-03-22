import { useAdminSettings } from "@/hooks/useAdminSettings";

const ROW_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 0",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const LABEL_STYLE = {
  color: "#94a3b8",
  fontSize: 13,
  fontFamily: "system-ui, sans-serif",
};

const SUB_STYLE = {
  color: "#475569",
  fontSize: 11,
  marginTop: 2,
  fontFamily: "system-ui, sans-serif",
};

const SECTION_TITLE: React.CSSProperties = {
  color: "#3b82f6",
  fontSize: 10,
  fontFamily: "monospace",
  letterSpacing: 2,
  marginBottom: 4,
  marginTop: 24,
};

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!on)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        background: on ? "#3b82f6" : "rgba(255,255,255,0.08)",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative",
        transition: "background 0.2s",
        opacity: disabled ? 0.4 : 1,
        flexShrink: 0,
      }}
    >
      <div style={{
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: "#fff",
        position: "absolute",
        top: 3,
        left: on ? 21 : 3,
        transition: "left 0.2s",
      }} />
    </button>
  );
}

function NumberInput({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
      >−</button>
      <span style={{ color: "#e2e8f0", fontSize: 14, fontFamily: "monospace", minWidth: 20, textAlign: "center" }}>{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
      >+</button>
    </div>
  );
}

export default function AdminSettings() {
  const { settings, update, setEngine } = useAdminSettings();

  const enabledEngineCount = Object.values(settings.engines).filter(Boolean).length;

  return (
    <div style={{ minHeight: "100vh", background: "#040912", padding: "40px 24px" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ color: "#3b82f6", fontSize: 11, fontFamily: "monospace", letterSpacing: 2 }}>ANSWERMONK</span>
            <span style={{ color: "#1e3a5f", fontSize: 11 }}>·</span>
            <span style={{ color: "#334155", fontSize: 11, fontFamily: "monospace", letterSpacing: 2 }}>ADMIN SETTINGS</span>
          </div>
          <h1 style={{ color: "#e2e8f0", fontSize: 22, fontWeight: 600, margin: 0, fontFamily: "system-ui, sans-serif" }}>
            Platform Controls
          </h1>
          <p style={{ color: "#475569", fontSize: 12, marginTop: 6, fontFamily: "system-ui, sans-serif" }}>
            Settings persist in browser storage and take effect on the next analysis run.
          </p>
        </div>

        {/* Section: LLM Engines */}
        <p style={SECTION_TITLE}>LLM ENGINES</p>
        <div style={{ background: "#0a1628", borderRadius: 10, padding: "0 16px", border: "1px solid rgba(255,255,255,0.06)" }}>

          {(["chatgpt", "gemini", "claude"] as const).map((engine) => {
            const isLastEnabled = settings.engines[engine] && enabledEngineCount === 1;
            const labels: Record<string, { name: string; sub: string }> = {
              chatgpt: { name: "ChatGPT", sub: "OpenAI GPT-4o — citation retrieval + scoring" },
              gemini: { name: "Gemini", sub: "Google Gemini 1.5 — grounding + citation retrieval" },
              claude: { name: "Claude", sub: "Anthropic Claude — citation analysis + scoring" },
            };
            return (
              <div key={engine} style={ROW_STYLE}>
                <div>
                  <div style={LABEL_STYLE}>{labels[engine].name}</div>
                  <div style={SUB_STYLE}>{labels[engine].sub}</div>
                </div>
                <Toggle
                  on={settings.engines[engine]}
                  onChange={(v) => setEngine(engine, v)}
                  disabled={isLastEnabled}
                />
              </div>
            );
          })}

          <div style={{ ...ROW_STYLE, borderBottom: "none" }}>
            <div>
              <div style={LABEL_STYLE}>DeepSeek</div>
              <div style={SUB_STYLE}>DeepSeek R1 — not yet wired, coming soon</div>
            </div>
            <Toggle on={false} onChange={() => {}} disabled />
          </div>
        </div>

        {/* Section: URL Classification */}
        <p style={SECTION_TITLE}>URL CLASSIFICATION</p>
        <div style={{ background: "#0a1628", borderRadius: 10, padding: "0 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ ...ROW_STYLE, borderBottom: "none" }}>
            <div>
              <div style={LABEL_STYLE}>Heuristic Classification</div>
              <div style={SUB_STYLE}>
                {settings.useHeuristicClassification
                  ? "Domain/path rules — ~85% accuracy, instant, zero API cost"
                  : "LLM classification — highest accuracy, ~10-20s, API cost per run"}
              </div>
            </div>
            <Toggle
              on={settings.useHeuristicClassification}
              onChange={(v) => update({ useHeuristicClassification: v })}
            />
          </div>
        </div>

        {/* Section: Segment Limits */}
        <p style={SECTION_TITLE}>SEGMENT LIMITS</p>
        <div style={{ background: "#0a1628", borderRadius: 10, padding: "0 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={ROW_STYLE}>
            <div>
              <div style={LABEL_STYLE}>Max Services</div>
              <div style={SUB_STYLE}>Maximum service segments a user can select per run</div>
            </div>
            <NumberInput
              value={settings.maxServices}
              onChange={(v) => update({ maxServices: v })}
              min={1}
              max={8}
            />
          </div>
          <div style={{ ...ROW_STYLE, borderBottom: "none" }}>
            <div>
              <div style={LABEL_STYLE}>Max Customers</div>
              <div style={SUB_STYLE}>Maximum customer segments a user can select per run</div>
            </div>
            <NumberInput
              value={settings.maxCustomers}
              onChange={(v) => update({ maxCustomers: v })}
              min={1}
              max={8}
            />
          </div>
        </div>

        {/* Section: Citation Analysis */}
        <p style={SECTION_TITLE}>CITATION ANALYSIS</p>
        <div style={{ background: "#0a1628", borderRadius: 10, padding: "0 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
          {(["url_rows", "domain_aggregated"] as const).map((mode, i, arr) => {
            const isLast = i === arr.length - 1;
            const labels: Record<string, { name: string; sub: string }> = {
              url_rows: { name: "Standard (URL rows)", sub: "Current flow — up to 250 individual URL rows, ~25K tokens, ~150s" },
              domain_aggregated: { name: "Domain Aggregated (fast)", sub: "One row per domain — ~60 rows, ~4K tokens, ~30–40s" },
            };
            const isSelected = settings.citationAnalysisMode === mode;
            return (
              <div
                key={mode}
                onClick={() => update({ citationAnalysisMode: mode })}
                style={{
                  ...ROW_STYLE,
                  borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.06)",
                  cursor: "pointer",
                  opacity: isSelected ? 1 : 0.6,
                }}
              >
                <div>
                  <div style={{ ...LABEL_STYLE, color: isSelected ? "#e2e8f0" : "#94a3b8" }}>{labels[mode].name}</div>
                  <div style={SUB_STYLE}>{labels[mode].sub}</div>
                </div>
                <div style={{
                  width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                  border: `2px solid ${isSelected ? "#3b82f6" : "rgba(255,255,255,0.2)"}`,
                  background: isSelected ? "#3b82f6" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isSelected && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Section: Insights Model */}
        <p style={SECTION_TITLE}>INSIGHTS MODEL</p>
        <div style={{ background: "#0a1628", borderRadius: 10, padding: "0 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
          {(["claude-sonnet-4-5", "claude-haiku-4-5"] as const).map((m, i, arr) => {
            const isLast = i === arr.length - 1;
            const labels: Record<string, { name: string; sub: string }> = {
              "claude-sonnet-4-5": { name: "Claude Sonnet 4.5", sub: "High quality — ~150–200s, ~$0.10 per run" },
              "claude-haiku-4-5": { name: "Claude Haiku 4.5 (fast)", sub: "Faster & cheaper — ~30–50s, ~$0.01 per run" },
            };
            const isSelected = settings.insightsModel === m;
            return (
              <div
                key={m}
                onClick={() => update({ insightsModel: m })}
                style={{
                  ...ROW_STYLE,
                  borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.06)",
                  cursor: "pointer",
                  opacity: isSelected ? 1 : 0.6,
                }}
              >
                <div>
                  <div style={{ ...LABEL_STYLE, color: isSelected ? "#e2e8f0" : "#94a3b8" }}>{labels[m].name}</div>
                  <div style={SUB_STYLE}>{labels[m].sub}</div>
                </div>
                <div style={{
                  width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                  border: `2px solid ${isSelected ? "#3b82f6" : "rgba(255,255,255,0.2)"}`,
                  background: isSelected ? "#3b82f6" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isSelected && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Section: Dev Tools */}
        <p style={SECTION_TITLE}>DEV TOOLS</p>
        <div style={{ background: "#0a1628", borderRadius: 10, padding: "0 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ ...ROW_STYLE, borderBottom: "none" }}>
            <div>
              <div style={LABEL_STYLE}>Show Re-run Button</div>
              <div style={SUB_STYLE}>Displays ↺ RE-RUN CRAWL + ANALYSIS on all report citation panels</div>
            </div>
            <Toggle
              on={settings.showDevRerunButton}
              onChange={(v) => update({ showDevRerunButton: v })}
            />
          </div>
        </div>

        {/* Active summary */}
        <div style={{ marginTop: 24, padding: "12px 16px", background: "rgba(59,130,246,0.06)", borderRadius: 8, border: "1px solid rgba(59,130,246,0.12)" }}>
          <div style={{ color: "#64748b", fontSize: 10, fontFamily: "monospace", letterSpacing: 1, marginBottom: 6 }}>ACTIVE CONFIGURATION</div>
          <div style={{ color: "#475569", fontSize: 11, fontFamily: "monospace", lineHeight: 1.8 }}>
            Engines: {["chatgpt", "gemini", "claude"].filter(e => settings.engines[e as keyof typeof settings.engines]).join(", ") || "none"}<br />
            Classification: {settings.useHeuristicClassification ? "heuristic" : "llm"}<br />
            Citation analysis: {settings.citationAnalysisMode === "domain_aggregated" ? "domain aggregated" : "standard url rows"}<br />
            Insights model: {settings.insightsModel}<br />
            Segment limits: {settings.maxServices} services · {settings.maxCustomers} customers<br />
            Dev re-run button: {settings.showDevRerunButton ? "visible" : "hidden"}
          </div>
        </div>

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <a href="/admin" style={{ color: "#334155", fontSize: 11, fontFamily: "monospace", letterSpacing: 1 }}>← BACK TO ADMIN</a>
        </div>
      </div>
    </div>
  );
}
