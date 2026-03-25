import { SiLinkedin, SiInstagram, SiReddit, SiTrustpilot, SiX, SiYoutube, SiG2, SiGoogle } from "react-icons/si";

const ENGINES = [
  { label: "ChatGPT" },
  { label: "Claude" },
  { label: "Gemini" },
  { label: "Perplexity" },
];

const MONITORS = [
  { icon: SiLinkedin, label: "LinkedIn", color: "#0A66C2" },
  { icon: SiInstagram, label: "Instagram", color: "#E1306C" },
  { icon: SiReddit, label: "Reddit", color: "#FF4500" },
  { icon: SiTrustpilot, label: "Trustpilot", color: "#00B67A" },
  { icon: SiX, label: "X", color: "#1a1a1a" },
  { icon: SiYoutube, label: "YouTube", color: "#FF0000" },
  { icon: SiG2, label: "G2", color: "#FF492C" },
  { icon: SiGoogle, label: "Google Reviews", color: "#4285F4" },
];

export default function MonitorsVariantB() {
  return (
    <div style={{ background: "#ffffff", fontFamily: "system-ui, -apple-system, sans-serif", padding: "28px 32px", width: 740, borderRadius: 12, border: "1px solid #f1f5f9" }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#6366f1", textAlign: "center", marginBottom: 16, textTransform: "uppercase" }}>
        Analyzing signals across primary intelligence engines
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 40, marginBottom: 20 }}>
        {ENGINES.map((e) => (
          <span key={e.label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: "#374151" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
            {e.label}
          </span>
        ))}
      </div>

      {/* Monitor row — pill badge style */}
      <div style={{
        borderTop: "1px solid rgba(99,102,241,0.12)",
        paddingTop: 16,
        background: "rgba(248,250,252,0.8)",
        margin: "0 -32px -28px",
        padding: "16px 32px",
        borderRadius: "0 0 12px 12px",
      }}>
        <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em", color: "#9ca3af", textAlign: "center", marginBottom: 12, textTransform: "uppercase" }}>
          Signal monitoring
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
          {MONITORS.map(({ icon: Icon, label, color }) => (
            <span key={label} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 100,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              fontSize: 11.5, fontWeight: 500, color: "#374151",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}>
              <Icon style={{ width: 13, height: 13, color, flexShrink: 0 }} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
