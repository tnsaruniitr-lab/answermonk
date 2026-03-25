import { SiLinkedin, SiInstagram, SiReddit, SiTrustpilot, SiX, SiYoutube, SiG2, SiGoogle } from "react-icons/si";

const ENGINES = [
  { label: "ChatGPT", color: "#6366f1" },
  { label: "Claude", color: "#6366f1" },
  { label: "Gemini", color: "#6366f1" },
  { label: "Perplexity", color: "#6366f1" },
];

const MONITORS = [
  { icon: SiLinkedin, label: "LinkedIn", color: "#0A66C2" },
  { icon: SiInstagram, label: "Instagram", color: "#E1306C" },
  { icon: SiReddit, label: "Reddit", color: "#FF4500" },
  { icon: SiTrustpilot, label: "Trustpilot", color: "#00B67A" },
  { icon: SiX, label: "X / Twitter", color: "#000000" },
  { icon: SiYoutube, label: "YouTube", color: "#FF0000" },
  { icon: SiG2, label: "G2", color: "#FF492C" },
  { icon: SiGoogle, label: "Google Reviews", color: "#4285F4" },
];

export default function MonitorsVariantA() {
  return (
    <div style={{ background: "#ffffff", fontFamily: "system-ui, -apple-system, sans-serif", padding: "28px 32px", width: 740, borderRadius: 12, border: "1px solid #f1f5f9" }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#6366f1", textAlign: "center", marginBottom: 16, textTransform: "uppercase" }}>
        Analyzing signals across primary intelligence engines
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 40, marginBottom: 24 }}>
        {ENGINES.map((e) => (
          <span key={e.label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: "#374151" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: e.color, display: "inline-block" }} />
            {e.label}
          </span>
        ))}
      </div>

      <div style={{ borderTop: "1px solid rgba(99,102,241,0.12)", paddingTop: 18 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#94a3b8", textAlign: "center", marginBottom: 14, textTransform: "uppercase" }}>
          Also monitoring brand signals across
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 20 }}>
          {MONITORS.map(({ icon: Icon, label, color }) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, color: "#6b7280" }}>
              <Icon style={{ width: 15, height: 15, color, flexShrink: 0 }} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
