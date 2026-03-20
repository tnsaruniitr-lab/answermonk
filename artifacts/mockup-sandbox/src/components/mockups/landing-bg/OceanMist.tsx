export function OceanMist() {
  return (
    <div
      style={{
        background: "linear-gradient(180deg, #e0f2fe 0%, #ffffff 45%, #ede9fe 100%)",
        minHeight: "100vh",
        fontFamily: "'Inter', sans-serif",
      }}
      className="relative w-full overflow-hidden flex flex-col items-center"
    >
      {/* Background Blobs */}
      <div
        className="absolute rounded-full blur-[100px] pointer-events-none"
        style={{
          background: "radial-gradient(circle, #bae6fd 0%, transparent 70%)",
          width: "600px",
          height: "600px",
          top: "10%",
          left: "-10%",
          opacity: 0.4,
        }}
      />
      <div
        className="absolute rounded-full blur-[120px] pointer-events-none"
        style={{
          background: "radial-gradient(circle, #ddd6fe 0%, transparent 70%)",
          width: "700px",
          height: "700px",
          bottom: "-10%",
          right: "-15%",
          opacity: 0.2,
        }}
      />

      {/* Top Bar */}
      <header className="w-full max-w-[1280px] mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="text-blue-900 font-bold text-xl tracking-tight">
          Nexalytics GEO
        </div>
      </header>

      {/* Centered Content Column */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-[1280px] mx-auto px-6 relative z-10 -mt-16">
        
        {/* Eyebrow Pill */}
        <div className="bg-white border border-blue-200 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-8 shadow-sm">
          GEO Intelligence Platform
        </div>

        {/* H1 */}
        <h1 
          className="text-5xl md:text-6xl font-extrabold text-center tracking-tight leading-[1.15] mb-6"
          style={{ color: "#0c1445" }}
        >
          When customers ask AI —<br />
          are you the answer?
        </h1>

        {/* Subtext */}
        <p 
          className="text-lg md:text-xl text-center max-w-lg mb-10"
          style={{ color: "#1e3a5f" }}
        >
          See which brands get recommended, why they win, and how to beat them.
        </p>

        {/* Search Row */}
        <div className="w-full max-w-xl relative flex items-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-xl bg-white border border-blue-100 p-1.5 mb-6 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
          <input
            type="text"
            placeholder="Enter brand or domain..."
            className="flex-1 px-4 py-3 bg-transparent outline-none text-slate-800 placeholder:text-slate-400 text-lg"
          />
          <button 
            className="px-6 py-3 rounded-xl font-medium shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
            style={{ backgroundColor: "#2563eb", color: "white" }}
          >
            Analyse →
          </button>
        </div>

        {/* Small Chip */}
        <button className="flex items-center gap-2 bg-blue-50/80 hover:bg-blue-100/80 transition-colors border border-blue-100 rounded-full px-4 py-2 text-sm text-blue-600 font-medium">
          <span className="font-semibold text-blue-700">warbyparker.com</span>
          <span className="opacity-80">View free example →</span>
        </button>

      </main>
    </div>
  );
}
