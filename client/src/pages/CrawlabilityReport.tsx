const FRH_COLOR = "#4f46e5";
const VALEO_COLOR = "#0d9488";

type Quality = "excellent" | "good" | "medium" | "low" | "none";

const QUALITY_STYLES: Record<Quality, { bg: string; text: string; border: string; dot: string }> = {
  excellent: { bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  good:      { bg: "bg-sky-50",      text: "text-sky-700",     border: "border-sky-200",     dot: "bg-sky-500"     },
  medium:    { bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-500"   },
  low:       { bg: "bg-rose-50",     text: "text-rose-700",    border: "border-rose-200",    dot: "bg-rose-500"    },
  none:      { bg: "bg-gray-100",    text: "text-gray-500",    border: "border-gray-200",    dot: "bg-gray-400"    },
};

type Row = {
  dimension: string;
  question: string;
  frh: { rating: string; quality: Quality; desc: string };
  valeo: { rating: string; quality: Quality; desc: string };
};

const ROWS: Row[] = [
  {
    dimension: "Content volume",
    question: "Amount of parseable homepage text",
    frh: {
      rating: "High",
      quality: "excellent",
      desc: "Rich homepage with stats, service lists, blog previews, testimonials, and full footer — extensive crawlable surface area.",
    },
    valeo: {
      rating: "Very low",
      quality: "none",
      desc: "Landing page is a city selector only. Virtually no body content — just city names and two lines of copy.",
    },
  },
  {
    dimension: "Semantic HTML",
    question: "Headings, landmarks, and list structure",
    frh: {
      rating: "Strong",
      quality: "excellent",
      desc: "Proper h1–h3 hierarchy, labelled anchors, section groupings, footer nav with headings. Easy to parse hierarchy.",
    },
    valeo: {
      rating: "Minimal",
      quality: "low",
      desc: "Single h1, city links as plain anchors. No semantic sections, lists, or structured nav beyond the city grid.",
    },
  },
  {
    dimension: "Rendering dependency",
    question: "Is JS required to see content?",
    frh: {
      rating: "Low",
      quality: "excellent",
      desc: "Content appears server-rendered — most text is available without JS execution.",
    },
    valeo: {
      rating: "Moderate",
      quality: "medium",
      desc: "Built on Next.js. City selector renders, but service and pricing pages are dynamic — key content locked behind JS navigation.",
    },
  },
  {
    dimension: "Media vs text ratio",
    question: "How much content is image or video-locked?",
    frh: {
      rating: "Moderate",
      quality: "medium",
      desc: "Testimonials are embedded videos (not transcribed). Several sections rely on images for context. Good balance overall.",
    },
    valeo: {
      rating: "Low concern",
      quality: "good",
      desc: "Almost no media on the landing page — but only because there's almost no content at all.",
    },
  },
  {
    dimension: "URL taxonomy",
    question: "Are URLs descriptive and crawlable?",
    frh: {
      rating: "Excellent",
      quality: "excellent",
      desc: "/ae/dubai/physiotherapy/neurological — fully descriptive, deeply structured, highly crawlable URL tree.",
    },
    valeo: {
      rating: "Good",
      quality: "good",
      desc: "Clean structure: /en-ae/dubai — locale and city encoded. Sub-pages exist but aren't linked from the landing page.",
    },
  },
  {
    dimension: "Structured data",
    question: "JSON-LD, Open Graph, schema markup",
    frh: {
      rating: "Partial",
      quality: "medium",
      desc: "Title and basic meta present, but no visible JSON-LD or rich schema markup on the homepage.",
    },
    valeo: {
      rating: "Partial",
      quality: "medium",
      desc: "Next.js app with standard meta tags. No rich structured data visible at the landing level.",
    },
  },
  {
    dimension: "LLM clarity",
    question: "Can an LLM state what this brand does?",
    frh: {
      rating: "Clear",
      quality: "excellent",
      desc: '"24x7 home healthcare in UAE & Qatar" is immediately obvious. Services, locations, and differentiation are all on-page.',
    },
    valeo: {
      rating: "Partial",
      quality: "medium",
      desc: '"Personalized healthcare services at your doorstep" is vague. No services listed at this level.',
    },
  },
  {
    dimension: "Service catalogue",
    question: "Are services named and described?",
    frh: {
      rating: "Comprehensive",
      quality: "excellent",
      desc: "25+ named services with direct URLs, grouped by location and category. An LLM can enumerate them from this page alone.",
    },
    valeo: {
      rating: "None visible",
      quality: "none",
      desc: "No services listed on the landing page. An LLM cannot infer what Valeo offers without navigating to a city sub-page.",
    },
  },
  {
    dimension: "Trust signals",
    question: "Ratings, stats, credentials — extractable?",
    frh: {
      rating: "Strong",
      quality: "excellent",
      desc: `4.9 Google rating, "50+ years combined experience," "1,000+ happy patients" — all in plain text, easily extracted.`,
    },
    valeo: {
      rating: "None",
      quality: "none",
      desc: "No ratings, reviews, or credentialing signals present at this URL level.",
    },
  },
  {
    dimension: "Geographic clarity",
    question: "Locations and service areas stated?",
    frh: {
      rating: "Explicit",
      quality: "excellent",
      desc: "Dubai, Abu Dhabi, RAK, Doha Qatar — named clearly with individual service detail pages per location.",
    },
    valeo: {
      rating: "Good",
      quality: "good",
      desc: "All 9 UAE cities listed by name on the landing page. Coverage is geographically clear even if service content is absent.",
    },
  },
  {
    dimension: "Ambiguity / noise",
    question: "Redundant or conflicting content",
    frh: {
      rating: "Some noise",
      quality: "medium",
      desc: "Duplicate blog entries, CDN asset URLs, and video placeholders add clutter for LLM parsing.",
    },
    valeo: {
      rating: "Low noise",
      quality: "good",
      desc: "Very little content means very little noise. What's there is clean, but the page is a navigation shell.",
    },
  },
  {
    dimension: "RAG value",
    question: "Useful for retrieval-augmented generation?",
    frh: {
      rating: "High value",
      quality: "excellent",
      desc: "Blog posts, service descriptions, location pages, and team bios offer rich retrieval material if crawled holistically.",
    },
    valeo: {
      rating: "Low value",
      quality: "none",
      desc: "Landing page alone is insufficient for RAG. Sub-pages are required but inaccessible without JS rendering.",
    },
  },
];

function QualityBadge({ rating, quality }: { rating: string; quality: Quality }) {
  const s = QUALITY_STYLES[quality];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {rating}
    </span>
  );
}

function ScoreArc({ score, color, max = 10 }: { score: number; color: string; max?: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / max);
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="shrink-0">
      <circle cx="48" cy="48" r={r} fill="none" stroke="#e5e7eb" strokeWidth="7" />
      <circle
        cx="48" cy="48" r={r}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 48 48)"
      />
      <text x="48" y="44" textAnchor="middle" fontSize="20" fontWeight="700" fill={color} fontFamily="Inter, sans-serif">
        {score}
      </text>
      <text x="48" y="60" textAnchor="middle" fontSize="11" fill="#9ca3af" fontFamily="Inter, sans-serif">
        / {max}
      </text>
    </svg>
  );
}

export default function CrawlabilityReport() {
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-slate-900 px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">GEO Extractibility Audit</p>
          <h1 className="text-white text-2xl font-bold">Crawlability Comparison</h1>
          <p className="text-slate-400 text-sm mt-1">How well can AI systems parse, understand, and cite each brand from its web presence?</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8">

        {/* Score cards */}
        <div className="grid grid-cols-2 gap-4 pt-6 pb-4">
          {[
            { name: "First Response Healthcare", domain: "firstresponsehealthcare.com", score: 7.5, color: FRH_COLOR, verdict: "Strong crawlable presence. LLM-ready content architecture with room to add schema markup." },
            { name: "Valeo Health", domain: "feelvaleo.com/en-ae", score: 3.0, color: VALEO_COLOR, verdict: "Landing page is a navigation shell. Rich content exists on sub-pages but is JS-locked and unlisted." },
          ].map((brand) => (
            <div key={brand.name} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start gap-5 shadow-sm">
              <ScoreArc score={brand.score} color={brand.color} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: brand.color }} />
                  <span className="font-bold text-slate-800 text-base leading-tight">{brand.name}</span>
                </div>
                <p className="text-xs text-slate-400 mb-2">{brand.domain}</p>
                <p className="text-sm text-slate-600 leading-relaxed">{brand.verdict}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">

          {/* Column headers */}
          <div className="grid grid-cols-[220px_1fr_1fr] border-b border-slate-100">
            <div className="px-5 py-4 bg-slate-50 border-r border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dimension</span>
            </div>
            <div className="px-5 py-4 border-r border-slate-100" style={{ borderTop: `3px solid ${FRH_COLOR}` }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: FRH_COLOR }} />
                <span className="font-semibold text-slate-700 text-sm">First Response Healthcare</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">firstresponsehealthcare.com</p>
            </div>
            <div className="px-5 py-4" style={{ borderTop: `3px solid ${VALEO_COLOR}` }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: VALEO_COLOR }} />
                <span className="font-semibold text-slate-700 text-sm">Valeo Health</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">feelvaleo.com/en-ae</p>
            </div>
          </div>

          {/* Data rows */}
          {ROWS.map((row, i) => (
            <div
              key={row.dimension}
              className={`grid grid-cols-[220px_1fr_1fr] hover:bg-slate-50/60 transition-colors ${i < ROWS.length - 1 ? "border-b border-slate-50" : ""}`}
            >
              <div className="px-5 py-4 border-r border-slate-100 bg-slate-50/40">
                <p className="font-semibold text-slate-700 text-sm leading-tight">{row.dimension}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">{row.question}</p>
              </div>
              <div className="px-5 py-4 border-r border-slate-100">
                <div className="mb-2">
                  <QualityBadge rating={row.frh.rating} quality={row.frh.quality} />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{row.frh.desc}</p>
              </div>
              <div className="px-5 py-4">
                <div className="mb-2">
                  <QualityBadge rating={row.valeo.rating} quality={row.valeo.quality} />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{row.valeo.desc}</p>
              </div>
            </div>
          ))}

          {/* Overall score footer */}
          <div className="grid grid-cols-[220px_1fr_1fr] bg-slate-900">
            <div className="px-5 py-5 border-r border-slate-700 flex items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Score</span>
            </div>
            <div className="px-5 py-5 border-r border-slate-700 flex items-center gap-3">
              <span className="text-3xl font-black" style={{ color: FRH_COLOR }}>7.5</span>
              <span className="text-slate-500 text-sm">/ 10</span>
              <div className="ml-2 flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: "75%", backgroundColor: FRH_COLOR }} />
              </div>
            </div>
            <div className="px-5 py-5 flex items-center gap-3">
              <span className="text-3xl font-black" style={{ color: VALEO_COLOR }}>3.0</span>
              <span className="text-slate-500 text-sm">/ 10</span>
              <div className="ml-2 flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: "30%", backgroundColor: VALEO_COLOR }} />
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 pb-8 justify-center flex-wrap">
          {(Object.entries(QUALITY_STYLES) as [Quality, typeof QUALITY_STYLES[Quality]][]).map(([k, s]) => (
            <div key={k} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span className="text-xs text-slate-500 capitalize">{k}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
