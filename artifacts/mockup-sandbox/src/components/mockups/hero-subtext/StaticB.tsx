export function StaticB() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "40px 32px",
    }}>
      <div style={{ textAlign: "center", maxWidth: 520 }}>
        <p style={{
          fontSize: 18,
          fontWeight: 400,
          lineHeight: 1.6,
          color: "#374151",
          margin: 0,
          letterSpacing: "-0.01em",
        }}>
          Know exactly where your brand shows up in AI answers —{" "}
          <span style={{ color: "#6366f1", fontWeight: 600 }}>and what to do about it.</span>
        </p>
      </div>
    </div>
  );
}
