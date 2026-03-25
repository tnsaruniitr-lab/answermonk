import { SiLinkedin, SiInstagram, SiReddit, SiTrustpilot, SiX, SiYoutube, SiG2, SiGoogle } from "react-icons/si";

const ENGINES = [
  { label: "ChatGPT" },
  { label: "Claude" },
  { label: "Gemini" },
  { label: "Perplexity" },
];

const CATEGORIES: { label: string; items: { icon: React.ElementType; name: string; color: string }[] }[] = [
  {
    label: "Social",
    items: [
      { icon: SiLinkedin, name: "LinkedIn", color: "#0A66C2" },
      { icon: SiInstagram, name: "Instagram", color: "#E1306C" },
      { icon: SiX, name: "X", color: "#1a1a1a" },
      { icon: SiYoutube, name: "YouTube", color: "#FF0000" },
    ],
  },
  {
    label: "Community",
    items: [
      { icon: SiReddit, name: "Reddit", color: "#FF4500" },
    ],
  },
  {
    label: "Reviews",
    items: [
      { icon: SiTrustpilot, name: "Trustpilot", color: "#00B67A" },
      { icon: SiG2, name: "G2", color: "#FF492C" },
      { icon: SiGoogle, name: "Google Reviews", color: "#4285F4" },
    ],
  },
];

export default function MonitorsVariantC() {
  return (
    <div style={{ background: "#ffffff", fontFamily: "system-ui, -apple-system, sans-serif", padding: "28px 32px", width: 740, borderRadius: 12, border: "1px solid #f1f5f9" }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#6366f1", textAlign: "center", marginBottom: 16, textTransform: "uppercase" }}>
        Analyzing signals across primary intelligence engines
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 40, marginBottom: 22 }}>
        {ENGINES.map((e) => (
          <span key={e.label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: "#374151" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
            {e.label}
          </span>
        ))}
      </div>

      <div style={{ borderTop: "1px solid rgba(99,102,241,0.12)", paddingTop: 18 }}>
        <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em", color: "#9ca3af", textAlign: "center", marginBottom: 16, textTransform: "uppercase" }}>
          Brand signal monitoring
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 32 }}>
          {CATEGORIES.map((cat) => (
            <div key={cat.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "#d1d5db", textTransform: "uppercase" }}>{cat.label}</span>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
                {cat.items.map(({ icon: Icon, name, color }) => (
                  <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: "#f8fafc",
                      border: "1px solid #e5e7eb",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon style={{ width: 16, height: 16, color }} />
                    </div>
                    <span style={{ fontSize: 9.5, color: "#9ca3af", fontWeight: 500 }}>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
