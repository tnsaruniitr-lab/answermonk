export function AuroraDrift() {
  return (
    <div 
      className="relative min-h-screen w-full overflow-hidden flex flex-col font-sans"
      style={{
        background: 'linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)'
      }}
    >
      {/* Aurora Orbs */}
      <div 
        className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px]"
        style={{
          background: '#fbcfe8', // blush pink
          borderRadius: '50%',
          filter: 'blur(100px)',
          opacity: 0.35,
          pointerEvents: 'none'
        }}
      />
      <div 
        className="absolute top-[10%] right-[-10%] w-[600px] h-[600px]"
        style={{
          background: '#c4b5fd', // soft violet
          borderRadius: '50%',
          filter: 'blur(120px)',
          opacity: 0.35,
          pointerEvents: 'none'
        }}
      />
      <div 
        className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px]"
        style={{
          background: '#a7f3d0', // pale cyan
          borderRadius: '50%',
          filter: 'blur(100px)',
          opacity: 0.35,
          pointerEvents: 'none'
        }}
      />

      {/* Top Navigation */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="text-xl font-bold text-indigo-900 tracking-tight">
          Nexalytics <span className="text-indigo-600/80">GEO</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 text-center -mt-20">
        <div className="space-y-8 max-w-3xl flex flex-col items-center">
          
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-violet-200 text-violet-700 rounded-full text-sm font-medium shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            Intelligence Engine v2.0 — Live
          </div>

          {/* Heading */}
          <h1 
            className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight"
            style={{ color: '#1e1b4b' }}
          >
            Dominate{" "}
            <span style={{ background: "linear-gradient(to right, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              AI search results
            </span>
          </h1>

          {/* Subtext */}
          <p 
            className="text-lg md:text-xl max-w-xl mx-auto"
            style={{ color: '#374151' }}
          >
            When customers ask AI,{" "}
            <span style={{ color: '#1e1b4b', fontWeight: 500 }}>see which brands get recommended, why they win, and how to beat them.</span>
          </p>

          {/* Search Row */}
          <div className="w-full max-w-xl mx-auto space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                placeholder="Enter your website URL..." 
                className="flex-1 px-5 py-4 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-gray-800 placeholder-gray-400 text-lg"
              />
              <button 
                className="px-8 py-4 text-white font-medium rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 whitespace-nowrap text-lg flex items-center justify-center gap-2"
                style={{ backgroundColor: '#7c3aed' }}
              >
                Analyse <span>&rarr;</span>
              </button>
            </div>

            {/* Chip below input */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-full text-sm font-medium text-gray-600 shadow-sm transition-colors hover:bg-white/80 cursor-pointer">
              <span>Try: <span className="text-gray-900">warbyparker.com</span></span>
              <span className="text-violet-600 flex items-center gap-1 ml-1">
                View free example <span className="text-xs">&rarr;</span>
              </span>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
