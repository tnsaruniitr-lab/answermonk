import type { ReactNode } from "react";

const FRH_COLOR = "#4f46e5";
const VALEO_COLOR = "#0d9488";

const avg = (vals: number[]) =>
  Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10;

/* ─── Comparison type ─────────────────────────────────── */
type Winner = "frh" | "tie" | "valeo";

/* ─── AI Search Factor data ──────────────────────────── */
type FactorRow = {
  factor: string;
  why: string;
  valeo: number;
  frh: number;
  winner: Winner;
  evidence: string;
  richEvidence?: ReactNode;
};

const FACTOR_ROWS: FactorRow[] = [
  {
    factor: "Title / meta clarity",
    why: "Models classify page purpose from title + meta description first",
    valeo: 6, frh: 9, winner: "frh",
    evidence: `FRH title + description clearly say "Home Healthcare Services Available 24x7 in UAE & Qatar" and "expert medical care at your doorstep". Valeo title/meta are blood-test-focused — "Blood Lab Test At Home in Dubai" — misaligned with the homepage's broader scope.`,
    richEvidence: (
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-rose-200 bg-rose-50 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-100 border-b border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Valeo</span>
            <span className="ml-auto text-[10px] font-semibold text-rose-500 bg-rose-200 px-2 py-0.5 rounded-full">❌ Blood-test focused</span>
          </div>
          <div className="px-3 py-2.5 space-y-2">
            <div>
              <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider mb-0.5">Title tag</p>
              <p className="text-sm font-bold text-rose-800 leading-snug bg-rose-100 px-2 py-1 rounded-lg border border-rose-200">
                Blood Lab Test At Home in Dubai — Free Sample Collection
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider mb-0.5">Meta description</p>
              <p className="text-sm font-semibold text-rose-700 leading-snug bg-rose-100 px-2 py-1 rounded-lg border border-rose-200">
                Blood-test-focused — does not reflect the full at-home healthcare scope
              </p>
            </div>
            <p className="text-[11px] text-rose-600 italic">Title pushes blood tests while the page sells healthcare + wellness + supplements + programs.</p>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 border-b border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">First Response</span>
            <span className="ml-auto text-[10px] font-semibold text-emerald-600 bg-emerald-200 px-2 py-0.5 rounded-full">✓ Clear & aligned</span>
          </div>
          <div className="px-3 py-2.5 space-y-2">
            <div>
              <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-0.5">Title tag</p>
              <p className="text-sm font-bold text-emerald-800 leading-snug bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200">
                Home Healthcare Services Available 24x7 in UAE & Qatar
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-0.5">Meta description</p>
              <p className="text-sm font-bold text-emerald-800 leading-snug bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200">
                "expert medical care at your doorstep"
              </p>
            </div>
            <p className="text-[11px] text-emerald-700 italic">Title and description both signal home healthcare — one clear intent for AI to classify.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    factor: "H1 clarity",
    why: "H1 is the strongest on-page signal for page topic classification",
    valeo: 6, frh: 8.5, winner: "frh",
    evidence: `FRH uses a specific service-led H1: "24x7 Expert Home Healthcare Services with Tailored Solutions." Valeo H1 is broader and vaguer: "At-Home Healthcare" — appears twice in the DOM.`,
    richEvidence: (
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-rose-200 bg-rose-50 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-100 border-b border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Valeo H1</span>
            <span className="ml-auto text-[10px] font-semibold text-rose-500 bg-rose-200 px-2 py-0.5 rounded-full">❌ Vague · appears ×2</span>
          </div>
          <div className="px-3 py-2.5">
            <p className="text-lg font-black text-rose-800 leading-snug px-2 py-2 bg-rose-100 rounded-lg border border-rose-200">
              At-Home Healthcare
            </p>
            <p className="text-[11px] text-rose-500 italic mt-2">Generic — AI cannot infer services, location, or differentiation from this alone.</p>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 border-b border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">First Response H1</span>
            <span className="ml-auto text-[10px] font-semibold text-emerald-600 bg-emerald-200 px-2 py-0.5 rounded-full">✓ Specific</span>
          </div>
          <div className="px-3 py-2.5">
            <p className="text-lg font-black text-emerald-800 leading-snug px-2 py-2 bg-emerald-100 rounded-lg border border-emerald-200">
              24x7 Expert Home Healthcare Services with Tailored Solutions
            </p>
            <p className="text-[11px] text-emerald-700 italic mt-2">Contains 24x7, Expert, Home Healthcare, Services — four strong retrieval signals in one heading.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    factor: "Intro / first-screen grounding",
    why: "Top-of-page copy is weighted heavily by LLMs for page summarisation",
    valeo: 5.5, frh: 8, winner: "frh",
    evidence: `FRH top messaging is direct: home healthcare + 24x7 + doorstep care — immediately extractable. Valeo's top subtitle is "Built for prevention, optimisation, & longevity" — brand language that is weaker for AI extraction of what the page actually offers.`,
  },
  {
    factor: "Intent consistency",
    why: "Split intent across title, H1, and body confuses LLM classification",
    valeo: 5, frh: 8.5, winner: "frh",
    evidence: `FRH: title, meta, H1, and body all point to home healthcare — one consistent intent throughout. Valeo: title/meta push blood tests, H1 says At-Home Healthcare, body sells blood tests + supplements + peptides + weight loss. That three-way split hurts LLM certainty about what Valeo is.`,
  },
  {
    factor: "Plain-text extractibility",
    why: "Raw crawlable text gives AI retrieval surface; quality matters more than volume",
    valeo: 7, frh: 8, winner: "frh",
    evidence: `Both brands have crawlable text in HTML. FRH has clearer native sections — Associates & Insurance Partners, Testimonials, Blogs — that parse cleanly. Valeo has more raw text volume but more of it is embedded in noisy component and script output, reducing reliable extraction.`,
  },
  {
    factor: "Semantic structure",
    why: "Clear HTML sections help models identify content type and hierarchy",
    valeo: 6.5, frh: 8, winner: "frh",
    evidence: `FRH exposes well-defined sections: "Our Associates & Insurance Partners", "Testimonials", "Blogs" — each maps cleanly to a content type. Valeo has sectioned cards and H2s, but raw HTML is more app-like and cluttered with React component noise.`,
  },
  {
    factor: "Schema / structured data",
    why: "Rich schema strengthens entity confidence and local / service understanding",
    valeo: 8.5, frh: 8, winner: "valeo",
    evidence: `FRH has strong WebPage, BreadcrumbList, DiagnosticLab, LocalBusiness, MedicalBusiness schema. Valeo also has strong Organization, MedicalBusiness, BreadcrumbList, contact/language/area served, and tighter service-level schema — slightly richer at the org and service level.`,
  },
  {
    factor: "Brand identity extraction",
    why: "Richer org-level data gives AI models more confidence in entity resolution",
    valeo: 8.5, frh: 8, winner: "valeo",
    evidence: `FRH exposes brand, phone, address, geo, and socials in schema. Valeo exposes org, parent org, phone, email, languages spoken, and GCC geographic coverage — slightly richer at the organisation identity level.`,
  },
  {
    factor: "Service breadth visibility",
    why: "Services visible near the top of page match more query variants for AI",
    valeo: 7.5, frh: 8.5, winner: "frh",
    evidence: `FRH homepage includes multiple broad proof sections with strong home-health positioning up front. Valeo exposes many services in internal links — blood tests, IV drips, newborn care, supplements, doctor on call, doctor at hotel, weight loss — but much of this is lower on the page rather than top-led.`,
  },
  {
    factor: "Local / geo clarity",
    why: "Explicit location signals boost confidence for local healthcare queries",
    valeo: 8, frh: 8.5, winner: "frh",
    evidence: `FRH clearly exposes Dubai, Abu Dhabi, Ras Al Khaimah, and Qatar in breadcrumbs and metadata. Valeo clearly exposes Dubai/UAE and GCC in schema. FRH edges ahead on breadcrumb-level geographic explicitness.`,
  },
  {
    factor: "Trust signals in HTML",
    why: "Visible proof (hours, address, accreditations) increases AI confidence in recommendations",
    valeo: 7, frh: 8.5, winner: "frh",
    evidence: `FRH shows 24/7 opening hours, full physical address, geo coordinates, testimonials, and a partner/insurance section — all in visible, parseable HTML. Valeo has licensed-team wording and trusted-care language, but weaker visible top-of-page proof blocks.`,
  },
  {
    factor: "Fresh supporting content",
    why: "Indexed blog posts signal active, authoritative, up-to-date knowledge",
    valeo: 6, frh: 8.5, winner: "frh",
    evidence: `FRH homepage includes indexed blog cards with recent dates (e.g. 2026-01-29), signalling fresh, regularly updated content. Valeo's homepage does not surface similarly dated content at the top level.`,
  },
  {
    factor: "Query fan-out coverage",
    why: "Matching a wider range of query phrasings increases retrieval likelihood across diverse search patterns",
    valeo: 8, frh: 8, winner: "tie",
    evidence: `Both brands cover a strong range of query types. Valeo is strong across preventive/longevity + at-home diagnostics + weight loss. FRH is strong across home healthcare, urgent care, nursing, physiotherapy, pediatrics, wellness, and diagnostics. Both are competitive here.`,
  },
  {
    factor: "Internal-link structure",
    why: "Service-led internal linking helps models map the site and attribute service depth to the brand",
    valeo: 7.5, frh: 8, winner: "frh",
    evidence: `FRH internal links are consistently service-led, with strong child-page navigation across medical services. Valeo internal links are also strong but skew toward product/program cards and commerce blocks — which can blur the healthcare service model for AI crawlers.`,
  },
  {
    factor: "Duplication / content cleanliness",
    why: "Repeated sections and competing page identities dilute the signal extracted per crawl",
    valeo: 4, frh: 6.5, winner: "frh",
    evidence: `Valeo has significant content duplication: H1 appears twice, the hero intro is repeated, journey sections are repeated, and press mentions appear multiple times — creating competing page identities. FRH is also repetitive in places, but repetition centres on trust and location blocks, not conflicting intents.`,
  },
];

/* ─── Priority action data ────────────────────────────── */
type Priority = "P1" | "P2" | "P3";

type ActionRow = {
  priority: Priority;
  action: string;
  why: string;
  exactIssue: string;
  specificFix: string;
};

const ACTIONS: ActionRow[] = [
  {
    priority: "P1",
    action: "Align title with actual page role",
    why: "Highest-impact fix. Title is one of the strongest extraction signals. If title says 'blood test' but page is actually a broader healthcare hub, models get mixed signals.",
    exactIssue: `Current title/meta are blood-test-specific: "Blood Lab Test At Home in Dubai…" while schema and body expose broader healthcare, weight loss, IV drips, doctor on call.`,
    specificFix: `Change title to: "At-Home Healthcare in Dubai — Blood Tests, IV Therapy, Doctor on Call & More | Valeo Health"`,
  },
  {
    priority: "P1",
    action: "Rewrite hero intro to state all 3 pillars plainly",
    why: "The first visible block is what many extractors and models latch onto fastest. Abstract brand language is the weakest possible opening for AI extractability.",
    exactIssue: `Current visible hero/H1 is weaker and more abstract: "Built for prevention, optimisation, & longevity" — while stronger service breadth exists elsewhere on the page.`,
    specificFix: `Make the first 2–3 lines factual: category + core services + location + key differentiator. E.g. "At-home healthcare in Dubai — blood tests, IV drips, doctor on call, and newborn care delivered to your door, 7 days a week."`,
  },
  {
    priority: "P1",
    action: "Keep one primary H1, then use pillar H2s",
    why: "This helps the page preserve breadth without becoming semantically muddy. A clean heading hierarchy lets AI models enumerate what the page covers.",
    exactIssue: "Page currently expresses multiple intents but not in a clear hierarchy. Blood tests dominate metadata while broader categories are lower in content. H1 appears twice in the DOM.",
    specificFix: `Use: H1 = "At-Home Healthcare in Dubai", then one H2 per service pillar — Blood Tests, IV Drips, Doctor on Call, Weight Loss. One H2 per pillar, no repeats.`,
  },
  {
    priority: "P1",
    action: `Add a top "What we offer in Dubai" block`,
    why: "Strong for extractibility and retrieval. Converts scattered services into a clean semantic list AI can enumerate in one pass.",
    exactIssue: "Valeo already contains blood tests, IV drips, newborn care, doctor consultations, supplements, and weight management — but they are spread across cards, links, and embedded component output.",
    specificFix: "Add a short visible service summary block near the top using a simple unordered list or clear service grid. Plain HTML, not JS-rendered.",
  },
  {
    priority: "P2",
    action: "Add a visible trust / proof strip near top",
    why: "Helps models attach reliable qualifiers to the brand (licensed, location, hours), not just services.",
    exactIssue: "Schema already exposes phone, email, Dubai locality, UAE, opening hours, and languages spoken — but this is under-leveraged in visible top-of-page copy.",
    specificFix: "Surface those schema facts in plain HTML text: DHA-licensed team, Dubai service area, 7-day availability, booking modes. One strip, near the top, always visible.",
  },
  {
    priority: "P2",
    action: "Make weight loss a first-class pillar, not a buried link",
    why: "If weight loss (GLP-1 program) is strategically important, it should not appear as just one item in a long service sentence.",
    exactIssue: "Weight loss and GLP-1 program are present in body content but not reflected in title, H1, or top page structure.",
    specificFix: "Give it a dedicated H2 section above the fold, or elevate it into the service summary block with a one-line description.",
  },
  {
    priority: "P2",
    action: "Make blood tests one pillar, not the whole identity of the page",
    why: "This lets Valeo rank and extract for blood tests without collapsing the entire page into a single-intent landing page.",
    exactIssue: "Blood tests currently dominate title and metadata too much versus the broader healthcare proposition.",
    specificFix: "Keep a strong blood-test section and internal links, but reposition it as one of several pillars — not the defining title of the page.",
  },
  {
    priority: "P2",
    action: `Add a "Why choose Valeo in Dubai" section`,
    why: "Improves trust extraction and brand memory for AI models making recommendation decisions.",
    exactIssue: `Valeo has trust language like "trusted by thousands" and "licensed team" but it is scattered and unstructured.`,
    specificFix: "Add 4–6 concise proof bullets: DHA-licensed team, home sample collection, turnaround time, booking options, city coverage, years operating.",
  },
  {
    priority: "P3",
    action: "Make visible copy mirror schema",
    why: "Good cleanup fix. Helps consistency across machine-readable and human-readable layers — LLMs use both.",
    exactIssue: `Schema says "Healthcare services at your doorstep in Dubai… lab tests, health packages, and medical services at home." Visible top copy should say essentially the same.`,
    specificFix: "Reuse schema facts in body copy. If schema says doorstep delivery in Dubai, the first paragraph should say the same thing.",
  },
  {
    priority: "P3",
    action: "Reduce JS / config noise around key messages",
    why: "Helps text-to-noise ratio for crawlers and extractors, but lower priority than messaging alignment.",
    exactIssue: "A lot of useful content is embedded in Next.js app output and script tags rather than simple editorial HTML.",
    specificFix: "Ensure hero, service summary, trust strip, and pillar headings are plain HTML — server-rendered, not JS-injected — so they are immediately available to any crawler or model.",
  },
];

/* ─── Helpers ─────────────────────────────────────────── */

function ScoreArc({ score, color, max = 10 }: { score: number; color: string; max?: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / max);
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="shrink-0">
      <circle cx="48" cy="48" r={r} fill="none" stroke="#e5e7eb" strokeWidth="7" />
      <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 48 48)" />
      <text x="48" y="44" textAnchor="middle" fontSize="20" fontWeight="700" fill={color} fontFamily="Inter, sans-serif">{score}</text>
      <text x="48" y="60" textAnchor="middle" fontSize="11" fill="#9ca3af" fontFamily="Inter, sans-serif">/ {max}</text>
    </svg>
  );
}

const WINNER_STYLE: Record<Winner, { label: string; bg: string; text: string; border: string }> = {
  frh:   { label: "First Response", bg: "bg-indigo-50",  text: "text-indigo-700",  border: "border-indigo-200" },
  valeo: { label: "Valeo",          bg: "bg-teal-50",    text: "text-teal-700",    border: "border-teal-200"   },
  tie:   { label: "Tie",            bg: "bg-slate-100",  text: "text-slate-500",   border: "border-slate-200"  },
};

function WinnerBadge({ winner }: { winner: Winner }) {
  const s = WINNER_STYLE[winner];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.bg} ${s.text} ${s.border}`}>
      {s.label}
    </span>
  );
}

const PRIORITY_STYLE: Record<Priority, { bg: string; text: string; border: string }> = {
  P1: { bg: "bg-rose-600",   text: "text-white",         border: "" },
  P2: { bg: "bg-orange-500", text: "text-white",         border: "" },
  P3: { bg: "bg-amber-400",  text: "text-amber-900",     border: "" },
};


function ScoreBar({ value, max = 10, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-sm font-bold w-7 shrink-0 text-right" style={{ color }}>{value}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${(value / max) * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────── */

export default function GeoLandingPageReport() {
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        @media print {
          * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-break-inside-avoid { break-inside: avoid; }
          .print-break-before { break-before: page; }
          body { background: white; }
          @page { size: A4 portrait; margin: 12mm 14mm; }
        }
      `}</style>

      {/* PDF button */}
      <div className="no-print fixed top-4 right-4 z-50">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl shadow-lg hover:bg-slate-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
          </svg>
          Download PDF
        </button>
      </div>

      {/* Header */}
      <div className="bg-slate-900 px-8 py-6">
        <div className="max-w-5xl mx-auto flex items-end justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">GEO Audit · Dubai Home Healthcare</p>
            <h1 className="text-white text-2xl font-bold">Landing Page GEO Readiness</h1>
            <p className="text-slate-400 text-sm mt-1">
              Valeo Health vs First Response Healthcare — AI retrievability of the Dubai city landing page
            </p>
          </div>
          <p className="text-slate-500 text-xs hidden print:block">{today} · Confidential</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 pb-12">

        {/* ── Overall score cards ───────────────────────────── */}
        {(() => {
          const overall = {
            valeo: avg(FACTOR_ROWS.map((r) => r.valeo)),
            frh:   avg(FACTOR_ROWS.map((r) => r.frh)),
          };
          return (
            <div className="grid grid-cols-2 gap-4 pt-6 pb-6">
              {[
                {
                  name: "First Response Healthcare",
                  domain: "firstresponsehealthcare.com/ae/dubai",
                  score: overall.frh,
                  color: FRH_COLOR,
                  verdict: "Clear page identity, strong local proof, and consistent medical-at-home framing make this an LLM-friendly page.",
                },
                {
                  name: "Valeo Health",
                  domain: "feelvaleo.com/en-ae/dubai",
                  score: overall.valeo,
                  color: VALEO_COLOR,
                  verdict: "Mixed page job, misaligned title/H1/intro, and heavy catalog content reduce AI extractability significantly.",
                },
              ].map((b) => (
                <div key={b.name} className="print-break-inside-avoid bg-white rounded-2xl border border-slate-200 p-5 flex items-start gap-5 shadow-sm">
                  <ScoreArc score={b.score} color={b.color} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                      <span className="font-bold text-slate-800 text-base leading-tight">{b.name}</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{b.domain}</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{b.verdict}</p>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* ── Section 1: AI Search Factor Analysis ─────────── */}
        <div className="print-break-before mb-2">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">01 — AI Search Factor Analysis</h2>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          {/* Headers */}
          <div className="grid grid-cols-[200px_120px_120px_100px] border-b border-slate-100 bg-slate-50">
            <div className="px-4 py-3 border-r border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Factor</span>
            </div>
            <div className="px-4 py-3 border-r border-slate-100" style={{ borderTop: `3px solid ${VALEO_COLOR}` }}>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: VALEO_COLOR }} />
                <span className="font-semibold text-slate-700 text-xs">Valeo</span>
              </div>
            </div>
            <div className="px-4 py-3 border-r border-slate-100" style={{ borderTop: `3px solid ${FRH_COLOR}` }}>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: FRH_COLOR }} />
                <span className="font-semibold text-slate-700 text-xs">First Response</span>
              </div>
            </div>
            <div className="px-4 py-3" style={{ borderTop: "3px solid #94a3b8" }}>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Winner</span>
            </div>
          </div>

          {FACTOR_ROWS.map((row, i) => (
            <div key={row.factor} className={i < FACTOR_ROWS.length - 1 ? "border-b border-slate-100" : ""}>
              {/* Main row */}
              <div className="grid grid-cols-[200px_120px_120px_100px] hover:bg-slate-50/40 transition-colors">
                <div className="px-4 py-3 border-r border-slate-100 bg-slate-50/40 flex flex-col justify-center">
                  <p className="text-xs font-semibold text-slate-700 leading-snug">{row.factor}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{row.why}</p>
                </div>
                <div className="px-4 py-3 border-r border-slate-100 flex items-center">
                  <div className="w-full">
                    <ScoreBar value={row.valeo} color={VALEO_COLOR} />
                  </div>
                </div>
                <div className="px-4 py-3 border-r border-slate-100 flex items-center">
                  <div className="w-full">
                    <ScoreBar value={row.frh} color={FRH_COLOR} />
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center">
                  <WinnerBadge winner={row.winner} />
                </div>
              </div>
              {/* Evidence sub-row */}
              <div className={`border-t border-slate-100 ${row.richEvidence ? "px-4 py-3 bg-white" : "px-4 py-2 bg-slate-50/70"}`}>
                {row.richEvidence
                  ? row.richEvidence
                  : <p className="text-xs text-slate-500 leading-relaxed italic">{row.evidence}</p>
                }
              </div>
            </div>
          ))}

          {/* Overall footer — computed from factor data */}
          {(() => {
            const fAvg = {
              valeo: avg(FACTOR_ROWS.map((r) => r.valeo)),
              frh:   avg(FACTOR_ROWS.map((r) => r.frh)),
            };
            return (
              <div className="grid grid-cols-[200px_120px_120px_100px] bg-slate-900">
                <div className="px-4 py-4 border-r border-slate-700 flex flex-col justify-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Factor average</span>
                  <span className="text-[10px] text-slate-600 mt-0.5">across {FACTOR_ROWS.length} LLM factors</span>
                </div>
                <div className="px-4 py-4 border-r border-slate-700 flex items-center gap-2">
                  <span className="text-2xl font-black" style={{ color: VALEO_COLOR }}>{fAvg.valeo}</span>
                  <span className="text-slate-500 text-xs">/ 10</span>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden ml-1">
                    <div className="h-full rounded-full" style={{ width: `${fAvg.valeo * 10}%`, backgroundColor: VALEO_COLOR }} />
                  </div>
                </div>
                <div className="px-4 py-4 border-r border-slate-700 flex items-center gap-2">
                  <span className="text-2xl font-black" style={{ color: FRH_COLOR }}>{fAvg.frh}</span>
                  <span className="text-slate-500 text-xs">/ 10</span>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden ml-1">
                    <div className="h-full rounded-full" style={{ width: `${fAvg.frh * 10}%`, backgroundColor: FRH_COLOR }} />
                  </div>
                </div>
                <div className="px-4 py-4 flex items-center">
                  <WinnerBadge winner={fAvg.frh > fAvg.valeo ? "frh" : fAvg.valeo > fAvg.frh ? "valeo" : "tie"} />
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── Section 2: Priority Actions ──────────────────── */}
        <div className="print-break-before mb-2">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">02 — Priority Actions for Valeo</h2>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          {/* Headers */}
          <div className="grid grid-cols-[52px_1fr_2fr_2fr] border-b border-slate-100 bg-slate-50">
            <div className="px-3 py-3 border-r border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">#</span>
            </div>
            <div className="px-4 py-3 border-r border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</span>
            </div>
            <div className="px-4 py-3 border-r border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Why it matters for LLM visibility</span>
            </div>
            <div className="px-4 py-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Exact issue in current HTML</span>
            </div>
          </div>

          {ACTIONS.map((row, i) => {
            const ps = PRIORITY_STYLE[row.priority];
            return (
              <div key={i} className={i < ACTIONS.length - 1 ? "border-b border-slate-100" : ""}>
                {/* Main row */}
                <div className="grid grid-cols-[52px_1fr_2fr_2fr] hover:bg-slate-50/40 transition-colors">
                  <div className="px-3 py-4 border-r border-slate-100 flex items-start justify-center pt-3.5">
                    <span className={`inline-flex items-center justify-center w-8 h-6 rounded-md text-xs font-bold ${ps.bg} ${ps.text}`}>
                      {row.priority}
                    </span>
                  </div>
                  <div className="px-4 py-4 border-r border-slate-100 flex items-start">
                    <p className="text-xs font-semibold text-slate-700 leading-snug">{row.action}</p>
                  </div>
                  <div className="px-4 py-4 border-r border-slate-100">
                    <p className="text-xs text-slate-500 leading-relaxed">{row.why}</p>
                  </div>
                  <div className="px-4 py-4">
                    <p className="text-xs text-slate-500 leading-relaxed italic">{row.exactIssue}</p>
                  </div>
                </div>
                {/* Specific fix sub-row */}
                <div className="border-t border-slate-50 px-4 py-2.5 bg-emerald-50/60 flex items-start gap-2">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider shrink-0 mt-0.5">Fix →</span>
                  <p className="text-xs text-emerald-800 leading-relaxed font-medium">{row.specificFix}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 pb-4">
          Session 77 · Valeo Home Healthcare GEO Analysis · Dubai market · {today}
        </p>
      </div>
    </div>
  );
}
