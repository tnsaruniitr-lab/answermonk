export function WarmSunrise() {
  return (
    <div 
      className="min-h-screen w-full flex flex-col font-sans relative overflow-hidden"
      style={{
        backgroundColor: "#fffbf5",
        backgroundImage: `
          radial-gradient(circle at top right, #fed7aa 0%, #fef3c7 30%, transparent 60%),
          radial-gradient(circle at bottom left, #fce7f3 0%, transparent 40%)
        `,
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* Top Bar */}
      <header className="w-full max-w-7xl mx-auto p-6 md:px-12 flex justify-between items-center relative z-10">
        <div className="font-bold text-xl text-orange-900 tracking-tight">
          Nexalytics GEO
        </div>
      </header>

      {/* Hero Content */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10 -mt-16">
        {/* Eyebrow */}
        <div className="bg-[#fffbf5] border border-orange-200 text-[#ea580c] px-4 py-1.5 rounded-full text-sm font-medium mb-8 shadow-sm">
          GEO Intelligence Platform
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl font-extrabold text-[#1c1917] tracking-tight mb-6 leading-tight">
          When customers ask AI —<br />
          are you the answer?
        </h1>

        {/* Subtext */}
        <p className="text-lg md:text-xl text-[#57534e] max-w-lg mb-10 leading-relaxed">
          See which brands get recommended, why they win, and how to beat them.
        </p>

        {/* Search Input Area */}
        <div className="w-full max-w-xl flex flex-col items-center">
          <div className="w-full flex bg-[#fffbf5]/80 backdrop-blur-sm border border-orange-100 p-2 rounded-xl shadow-[0_8px_30px_rgb(234,88,12,0.08)] mb-4">
            <input 
              type="text" 
              placeholder="Enter your website..." 
              className="flex-1 bg-transparent px-4 text-[#1c1917] placeholder-[#a8a29e] outline-none text-lg"
            />
            <button className="bg-[#ea580c] hover:bg-[#c2410c] text-white px-6 py-3 rounded-xl font-medium transition-colors whitespace-nowrap shadow-sm">
              Analyse &rarr;
            </button>
          </div>

          {/* Example Chip */}
          <div className="bg-[#fffbf5]/60 text-[#ea580c] hover:bg-[#fffbf5] px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors border border-orange-50 flex items-center gap-1.5 shadow-sm">
            <span className="font-semibold text-[#c2410c]">warbyparker.com</span>
            <span>View free example &rarr;</span>
          </div>
        </div>
      </main>
    </div>
  );
}
