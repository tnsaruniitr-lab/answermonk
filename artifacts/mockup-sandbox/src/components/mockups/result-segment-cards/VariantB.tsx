import React from "react";

export function VariantB() {
  return (
    <div style={{ backgroundColor: "#060f1e", minHeight: "100vh", padding: "40px 20px", display: "flex", flexDirection: "column", gap: "24px", alignItems: "center", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      
      {/* RESULT CARD */}
      <div style={{ 
        width: "100%", 
        maxWidth: "660px", 
        backgroundColor: "#0d1526", 
        border: "1px solid rgba(255,255,255,0.08)", 
        borderRadius: "16px",
        padding: "24px",
        boxSizing: "border-box",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
      }}>
        {/* Header */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ color: "#14b8a6", fontSize: "11px", fontWeight: "700", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "8px" }}>
            Your Brand Performance
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "6px" }}>
            <h2 style={{ color: "#ffffff", fontSize: "22px", fontWeight: "700", margin: 0, lineHeight: "1.2" }}>
              First Response Healthcare
            </h2>
            <div style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: "12px", fontWeight: "600", padding: "4px 10px", borderRadius: "100px" }}>
              #5 of 27 brands
            </div>
          </div>
          <div style={{ color: "#94a3b8", fontSize: "12px" }}>
            Dubai · 3/3 segments · 48 responses
          </div>
        </div>

        {/* Main Stats Area */}
        <div style={{ display: "flex", gap: "24px", marginBottom: "28px", flexWrap: "wrap" }}>
          {/* Ring Area */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "12px" }}>
            <div style={{ position: "relative", width: "80px", height: "80px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "conic-gradient(#3b82f6 47%, rgba(255,255,255,0.05) 0)", marginBottom: "12px" }}>
              <div style={{ position: "absolute", width: "66px", height: "66px", backgroundColor: "#0d1526", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#ffffff", fontSize: "20px", fontWeight: "700" }}>47%</span>
              </div>
            </div>
            <div style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Visibility Score
            </div>
          </div>

          {/* Three Stat Boxes */}
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px" }}>
            <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px", backgroundColor: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ color: "#ffffff", fontSize: "20px", fontWeight: "700", marginBottom: "4px" }}>25%</div>
              <div style={{ color: "#94a3b8", fontSize: "12px" }}>Top 3 Rate</div>
            </div>
            <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px", backgroundColor: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ color: "#ffffff", fontSize: "20px", fontWeight: "700", marginBottom: "4px" }}>#4.1</div>
              <div style={{ color: "#94a3b8", fontSize: "12px" }}>Avg Rank</div>
            </div>
            <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px", backgroundColor: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ color: "#ffffff", fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>Moderate</div>
              <div style={{ color: "#94a3b8", fontSize: "12px" }}>Rating</div>
            </div>
          </div>
        </div>

        {/* Engine Breakdown */}
        <div>
          <div style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>
            AI Engine Breakdown
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Gemini */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#3b82f6" }}></div>
              <div style={{ color: "#cbd5e1", fontSize: "13px", width: "70px", textAlign: "left" }}>Gemini</div>
              <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px", height: "8px", overflow: "hidden" }}>
                <div style={{ width: "60%", backgroundColor: "#3b82f6", height: "100%", borderRadius: "4px" }}></div>
              </div>
              <div style={{ color: "#ffffff", fontSize: "13px", fontWeight: "600", width: "40px", textAlign: "right" }}>60%</div>
            </div>
            {/* ChatGPT */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#22c55e" }}></div>
              <div style={{ color: "#cbd5e1", fontSize: "13px", width: "70px", textAlign: "left" }}>ChatGPT</div>
              <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px", height: "8px", overflow: "hidden" }}>
                <div style={{ width: "33%", backgroundColor: "#22c55e", height: "100%", borderRadius: "4px" }}></div>
              </div>
              <div style={{ color: "#ffffff", fontSize: "13px", fontWeight: "600", width: "40px", textAlign: "right" }}>33%</div>
            </div>
            {/* Claude */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#8b5cf6" }}></div>
              <div style={{ color: "#cbd5e1", fontSize: "13px", width: "70px", textAlign: "left" }}>Claude</div>
              <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px", height: "8px", overflow: "hidden" }}>
                <div style={{ width: "0%", backgroundColor: "#8b5cf6", height: "100%", borderRadius: "4px" }}></div>
              </div>
              <div style={{ color: "#ffffff", fontSize: "13px", fontWeight: "600", width: "40px", textAlign: "right" }}>0%</div>
            </div>
          </div>
        </div>
      </div>

      {/* SEGMENT CARD */}
      <div style={{ 
        width: "100%", 
        maxWidth: "660px", 
        backgroundColor: "#0d1526", 
        border: "1px solid rgba(255,255,255,0.08)", 
        borderRadius: "16px",
        padding: "24px",
        boxSizing: "border-box",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <h3 style={{ color: "#ffffff", fontSize: "18px", fontWeight: "700", margin: 0, textAlign: "left" }}>
                Doctor On Call
              </h3>
              <div style={{ backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", fontSize: "10px", fontWeight: "700", padding: "4px 8px", borderRadius: "100px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Service
              </div>
            </div>
            <div style={{ color: "#94a3b8", fontSize: "13px", textAlign: "left", lineHeight: "1.4" }}>
              "{`trusted doctor on call services in Dubai`}"
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#ffffff", fontSize: "26px", fontWeight: "700", lineHeight: "1" }}>
              63%
            </div>
            <div style={{ color: "#94a3b8", fontSize: "11px", marginTop: "4px" }}>Appearance</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          <div style={{ flex: 1, border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "12px", backgroundColor: "rgba(255,255,255,0.02)" }}>
            <div style={{ color: "#ffffff", fontSize: "16px", fontWeight: "700", marginBottom: "2px" }}>50%</div>
            <div style={{ color: "#94a3b8", fontSize: "12px" }}>Top 3</div>
          </div>
          <div style={{ flex: 1, border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "12px", backgroundColor: "rgba(255,255,255,0.02)" }}>
            <div style={{ color: "#ffffff", fontSize: "16px", fontWeight: "700", marginBottom: "2px" }}>#1.9</div>
            <div style={{ color: "#94a3b8", fontSize: "12px" }}>Avg Rank</div>
          </div>
          <div style={{ flex: 1, border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "12px", backgroundColor: "rgba(255,255,255,0.02)" }}>
            <div style={{ color: "#ffffff", fontSize: "16px", fontWeight: "700", marginBottom: "2px" }}>232</div>
            <div style={{ color: "#94a3b8", fontSize: "12px" }}>Citations</div>
          </div>
        </div>

        {/* Engine Blocks */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "28px" }}>
          <div style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: "6px", padding: "6px 12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#3b82f6" }}></div>
            <span style={{ color: "#cbd5e1", fontSize: "12px" }}>Gemini</span>
            <span style={{ color: "#ffffff", fontSize: "12px", fontWeight: "600" }}>75%</span>
          </div>
          <div style={{ backgroundColor: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)", borderRadius: "6px", padding: "6px 12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#22c55e" }}></div>
            <span style={{ color: "#cbd5e1", fontSize: "12px" }}>ChatGPT</span>
            <span style={{ color: "#ffffff", fontSize: "12px", fontWeight: "600" }}>50%</span>
          </div>
        </div>

        {/* Rankings Header */}
        <div style={{ marginBottom: "16px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <h4 style={{ color: "#ffffff", fontSize: "15px", fontWeight: "700", margin: "0 0 4px 0", textAlign: "left" }}>
            Top Brands in AI Results
          </h4>
          <div style={{ color: "#94a3b8", fontSize: "11px", textAlign: "left" }}>
            When your customers search this, AI recommends:
          </div>
        </div>

        {/* Rankings Rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {[
            { rank: 1, name: "Call Doctor", score: 131, isYou: false },
            { rank: 2, name: "Housecall", score: 75, isYou: false },
            { rank: 3, name: "First Response Healthcare", score: 63, isYou: true },
            { rank: 4, name: "Aster Clinic", score: 44, isYou: false },
            { rank: 5, name: "Nightingale Health Services", score: 31, isYou: false },
            { rank: 6, name: "Mediclinic", score: 25, isYou: false },
            { rank: 7, name: "TruDoc 24x7", score: 25, isYou: false },
            { rank: 8, name: "KindCare Home HealthCare", score: 25, isYou: false },
          ].map((row, i) => (
            <div key={i} style={{ 
              display: "flex", 
              alignItems: "center", 
              padding: "8px 12px", 
              borderRadius: "6px",
              background: row.isYou ? "linear-gradient(90deg, rgba(59,130,246,0.15) 0%, rgba(99,102,241,0.05) 100%)" : "transparent",
              border: row.isYou ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent"
            }}>
              <div style={{ width: "24px", color: row.isYou ? "#60a5fa" : "#64748b", fontSize: "13px", fontWeight: "600", textAlign: "left" }}>
                {row.rank}
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ color: row.isYou ? "#ffffff" : "#e2e8f0", fontSize: "13px", fontWeight: row.isYou ? "600" : "400", textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {row.name}
                </div>
                {row.isYou && (
                  <div style={{ backgroundColor: "#3b82f6", color: "#ffffff", fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "4px" }}>
                    YOU
                  </div>
                )}
              </div>
              
              {/* Bar and Score */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "140px", justifyContent: "flex-end" }}>
                <div style={{ flex: 1, display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
                  <div style={{ 
                    height: "6px", 
                    backgroundColor: row.isYou ? "#3b82f6" : "#1e3a5f", 
                    borderRadius: "3px",
                    width: `${Math.min(100, (row.score / 131) * 100)}%`,
                    minWidth: "4px"
                  }} />
                </div>
                <div style={{ color: row.isYou ? "#60a5fa" : "#94a3b8", fontSize: "13px", fontWeight: "600", width: "36px", textAlign: "right" }}>
                  {row.score}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
