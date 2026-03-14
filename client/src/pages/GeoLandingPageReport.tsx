import type { ReactNode } from "react";

const FRH_COLOR = "#4f46e5";
const VALEO_COLOR = "#0d9488";

/* ─── Scorecard data ──────────────────────────────────── */
const SCORES = [
  { area: "Single page job clarity",          valeo: 4.5, frh: 8.0 },
  { area: "Title / H1 / intro alignment",     valeo: 4.5, frh: 8.0 },
  { area: "Local proof block",                valeo: 5.0, frh: 8.5 },
  { area: "Visible trust markers",            valeo: 7.0, frh: 8.5 },
  { area: "Service breadth",                  valeo: 8.0, frh: 8.0 },
  { area: "Internal linking quality",         valeo: 7.5, frh: 8.0 },
  { area: "Query fan-out coverage",           valeo: 8.0, frh: 8.0 },
  { area: "Specificity of copy",              valeo: 5.5, frh: 8.0 },
  { area: "Duplication / cleanliness",        valeo: 4.0, frh: 6.5 },
];
const OVERALL = { valeo: 6.3, frh: 8.0 };

/* ─── Comparison data ─────────────────────────────────── */
type Winner = "frh" | "tie" | "valeo";
type CompRow = { check: string; valeo: string; frh: string; winner: Winner };

const COMP_ROWS: CompRow[] = [
  {
    check: "Single page job",
    frh: "Much clearer: Dubai home healthcare page with consistent medical-at-home framing.",
    valeo: "Mixed: blood test landing + healthcare hub + longevity/wellness marketplace + catalog.",
    winner: "frh",
  },
  {
    check: "Title / H1 / intro alignment",
    frh: `Title is "24/7 Home Healthcare Services in Dubai"; visible intro copy repeatedly frames the page as quality home healthcare in Dubai.`,
    valeo: `Title is blood-test-led; H1 is "At-Home Healthcare"; intro is "Built for prevention, optimisation, & longevity."`,
    winner: "frh",
  },
  {
    check: "Local proof near top",
    frh: `Near the top: Available 24/7, JCI Accreditation, Dubai Health Authority, and "We reach anywhere in Dubai in under 30 mins."`,
    valeo: "Has trust bullets like DHA-licensed professionals and convenient home service, but not one tight local-operational proof block.",
    winner: "frh",
  },
  {
    check: "Trust markers in visible text",
    frh: "24/7, JCI accreditation, Dubai Health Authority, DHA-licensed doctors, 300,000+ patients, 20,000+ children served, 180+ premium brands.",
    valeo: "DHA-licensed professionals, licensed team, DHA-approved results, trusted lab partners, established in 2021, trusted by thousands.",
    winner: "frh",
  },
  {
    check: "Breadth of service coverage",
    frh: "Also broad: doctor on call, physiotherapy, home nursing, elderly care, palliative care, checkups, PCR, corporate wellness, teleconsultation, pediatrics, vaccines, ambulance.",
    valeo: "Very broad: blood tests, DNA tests, IV therapy, doctor on call, newborn care, supplements, GLP-1 weight loss, consultations, programs.",
    winner: "tie",
  },
  {
    check: "Query fan-out coverage",
    frh: "Strong across home healthcare, urgent care, nursing, physiotherapy, pediatrics, wellness, diagnostics.",
    valeo: "Strong across preventive/longevity + at-home diagnostics + weight loss.",
    winner: "tie",
  },
  {
    check: "Internal-link breadth",
    frh: "Strong and service-led, with many child medical services in navigation.",
    valeo: "Strong, but leans into product/program cards and commerce blocks.",
    winner: "frh",
  },
  {
    check: "Specificity of copy",
    frh: "More concrete: home healthcare in Dubai, available 24/7, under 30 mins, DHA-licensed, JCI-accredited, non-emergency care scope.",
    valeo: "Mixed: some concrete claims, but much of the opening copy is brand-language and wellness-language.",
    winner: "frh",
  },
  {
    check: "Duplication / content cleanliness",
    frh: "Also repetitive in places, but repetition is mostly around trust/location blocks and service navigation — not multiple competing page identities.",
    valeo: "Significant duplication: H1 repeated, intro repeated, journey sections repeated, press mentions repeated.",
    winner: "frh",
  },
  {
    check: "Product / catalog spillover",
    frh: "Lower: feels like a service-led healthcare site, not a storefront.",
    valeo: "High: supplements, SKUs, pricing, programs, consultations, products are all mixed into one city page.",
    winner: "frh",
  },
];

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
    factor: "Title / H1 intent alignment",
    why: "Models classify page purpose from title + H1 + intro alignment",
    valeo: 3, frh: 8, winner: "frh",
    evidence: `Valeo: title = "Blood Lab Test At Home in Dubai…" but H1 = "At-Home Healthcare" twice — a direct intent mismatch. FRH: title = "Home Healthcare Services Available 24x7 in UAE & Qatar", H1 = "24x7 Expert Home Healthcare Services with Tailored Solutions" — fully aligned.`,
    richEvidence: (
      <div className="grid grid-cols-2 gap-3">
        {/* Valeo column */}
        <div className="rounded-xl border border-rose-200 bg-rose-50 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-100 border-b border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Valeo</span>
            <span className="ml-auto text-[10px] font-semibold text-rose-500 bg-rose-200 px-2 py-0.5 rounded-full">❌ Misaligned</span>
          </div>
          <div className="px-3 py-2.5 space-y-2">
            <div>
              <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider mb-0.5">Title tag</p>
              <p className="text-sm font-bold text-rose-800 leading-snug bg-rose-100 px-2 py-1 rounded-lg border border-rose-200">
                Blood Lab Test At Home in Dubai — Free Sample Collection
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider mb-0.5">H1 (appears twice)</p>
              <p className="text-sm font-bold text-rose-800 leading-snug bg-rose-100 px-2 py-1 rounded-lg border border-rose-200">
                At-Home Healthcare
              </p>
            </div>
            <p className="text-[11px] text-rose-600 italic">Title signals blood tests; H1 signals broad healthcare — two different intents on one URL.</p>
          </div>
        </div>
        {/* FRH column */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 border-b border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">First Response</span>
            <span className="ml-auto text-[10px] font-semibold text-emerald-600 bg-emerald-200 px-2 py-0.5 rounded-full">✓ Aligned</span>
          </div>
          <div className="px-3 py-2.5 space-y-2">
            <div>
              <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-0.5">Title tag</p>
              <p className="text-sm font-bold text-emerald-800 leading-snug bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200">
                Home Healthcare Services Available 24x7 in UAE & Qatar
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-0.5">H1</p>
              <p className="text-sm font-bold text-emerald-800 leading-snug bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200">
                24x7 Expert Home Healthcare Services with Tailored Solutions
              </p>
            </div>
            <p className="text-[11px] text-emerald-700 italic">Title and H1 both say home healthcare — consistent intent signal for AI classification.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    factor: "Heading cleanliness",
    why: "Clean heading hierarchy makes extraction more reliable",
    valeo: 3, frh: 9, winner: "frh",
    evidence: `Valeo: H1 appears twice ("At-Home Healthcare"), H2 duplicates also ("Your Health, Reimagined" ×2, "Lab Test at Home in Dubai" ×2, "Comprehensive Healthcare, Right at Home" ×2). FRH: one H1, three H2s, one H3 — clean.`,
  },
  {
    factor: "Page focus",
    why: "Mixed pages are harder for AI to summarise and rank for one intent",
    valeo: 2, frh: 8, winner: "frh",
    evidence: `Valeo: same page contains At-home IV Therapy, At-home Blood Testing, Weight Loss Program, Doctor on Call, Physiotherapy, Supplements, Newborn Care, Peptides — too many top-level intents on one URL. FRH: homepage is a broad brand page but coherent as home healthcare.`,
  },
  {
    factor: "Extractable text depth",
    why: "More plain text gives AI more retrieval surface",
    valeo: 9, frh: 5, winner: "valeo",
    evidence: `Valeo textLength: 10,150 chars. FRH textLength: 2,892 chars. Valeo exposes significantly more textual surface for retrieval-augmented generation.`,
  },
  {
    factor: "Service breadth visible in HTML",
    why: "More visible service entities can match more query variants",
    valeo: 10, frh: 8, winner: "valeo",
    evidence: `Valeo links/categories: Women's Health, Men's Health, DNA Tests, Hormone Tests, Sexual Health, Physiotherapy, IV Therapy, GLP-1 Weight Loss, Doctor on Call, Newborn Care, Peptides. FRH: also broad, but less dense on the homepage.`,
  },
  {
    factor: "Internal link graph",
    why: "Strong internal linking helps crawlers and models traverse the service graph",
    valeo: 9, frh: 8, winner: "valeo",
    evidence: `Valeo: extensive link set across categories, services, consultations, products, and city/service routes. FRH: also strong — doctor-on-call, home-nursing-services, physiotherapy, health-checkup, corporate-wellness — but less extensive overall.`,
  },
  {
    factor: "Schema quality",
    why: "Good schema strengthens entity confidence and local / service understanding",
    valeo: 7, frh: 8, winner: "frh",
    evidence: `Valeo: has Organization, WebPage, LocalBusiness, MedicalBusiness, Breadcrumb — but includes a duplicate Organization schema and geo coordinates of latitude:0, longitude:0. FRH: LocalBusiness includes full street address and real geo coords (25.1093436, 55.183759) — a cleaner trust signal.`,
  },
  {
    factor: "Local trust / entity grounding",
    why: "Real local business details increase confidence for local healthcare queries",
    valeo: 5, frh: 8, winner: "frh",
    evidence: `Valeo: city-specific schema exists, but geo is placeholder 0,0; page leans more catalog than grounded local medical entity. FRH: full Dubai address, phone, 24x7 opening hours, and real geo coordinates present.`,
  },
  {
    factor: "Content discipline",
    why: "Less noise = easier extraction of key facts",
    valeo: 3, frh: 8, winner: "frh",
    evidence: `Valeo: page includes supplements (Valeo Hair+, Shilajit, Creatine, Matcha), consultations, ambassador program, press, app download — all mixed into a city healthcare page. FRH: much less merchandising clutter in headings and visible copy.`,
  },
  {
    factor: "Entity / service extraction ease",
    why: "Simple DOM makes it easier to infer brand = category + services + location",
    valeo: 7, frh: 8, winner: "frh",
    evidence: `Valeo: lots of entities but many are mixed — lab tests, supplements, consultations, programs, affiliate, ambassador. Strong breadth, weaker clarity. FRH: fewer headings but cleaner medical business identity.`,
  },
  {
    factor: "Commercial discoverability breadth",
    why: "Broad service catalog helps appear across many long-tail prompts",
    valeo: 9, frh: 7, winner: "valeo",
    evidence: `Valeo: many long-tail service URLs — comprehensive-std-test, advanced-female-blood-test, gut-health-package, doctor-at-hotel, physiotherapy-at-home, hpv-vaccine-at-home, etc. — providing extensive query coverage.`,
  },
  {
    factor: "AI search readiness overall",
    why: "Balance of clarity + coverage + trust",
    valeo: 6, frh: 8, winner: "frh",
    evidence: `Valeo's problem is not lack of content; it is conflicted signals. Best proof: title says blood test, H1 says at-home healthcare, body sells everything from blood tests to supplements to peptides. That contradiction weakens AI confidence.`,
  },
];

/* ─── Priority action data ────────────────────────────── */
type Priority = "P1" | "P2" | "P3";
type Impact  = "Very high" | "High" | "Medium-high" | "Medium";
type Effort  = "Low" | "Medium" | "High";

type ActionRow = {
  priority: Priority;
  action: string;
  why: string;
  impact: Impact;
  effort: Effort;
};

const ACTIONS: ActionRow[] = [
  {
    priority: "P1",
    action: "Choose one page job for /en-ae/dubai",
    why: "Right now the page mixes blood tests, general at-home healthcare, longevity, supplements, and consults. That weakens clarity for both users and AI engines.",
    impact: "Very high",
    effort: "Medium",
  },
  {
    priority: "P1",
    action: "Fix title / H1 / intro alignment",
    why: `Title is blood-test-focused, H1 is "At-Home Healthcare," intro is "Built for prevention, optimisation, & longevity." These are related but not the same intent.`,
    impact: "Very high",
    effort: "Low",
  },
  {
    priority: "P1",
    action: "Add one local proof block near the top",
    why: "Put Dubai service area, DHA-licensed professionals, core services, turnaround, booking modes, and support number together. Right now these signals are scattered.",
    impact: "High",
    effort: "Low",
  },
  {
    priority: "P1",
    action: "Remove duplicated hero / repeated sections",
    why: `"At-Home Healthcare," "Built for prevention...," "Your Personalized Health Journey," and "Your Health, Reimagined" are repeated. That hurts hierarchy.`,
    impact: "High",
    effort: "Low",
  },
  {
    priority: "P2",
    action: "Separate hub content from commerce / catalog content",
    why: "Supplements, product cards, doctor consult SKUs, and programs make the city landing page feel like a storefront, confusing AI intent mapping.",
    impact: "High",
    effort: "Medium",
  },
  {
    priority: "P2",
    action: "Standardize child service pages",
    why: "Use one template: city + service in title, clean H1, one-line summary, local proof, FAQ, CTA. The parent page suggests inconsistency deeper in the site.",
    impact: "Medium-high",
    effort: "Medium",
  },
  {
    priority: "P3",
    action: "Replace vague brand language with specific retrieval text",
    why: `"Smart Health Insights" and "Science-Backed Journeys" are weak compared with concrete phrases like turnaround, DHA-licensed team, city coverage, service types.`,
    impact: "Medium",
    effort: "Low",
  },
  {
    priority: "P3",
    action: "Tighten press / social-proof section",
    why: "Keep one proof section, not repeated blurbs. Repetition lowers trust density and reduces the signal-to-noise ratio AI models extract.",
    impact: "Medium",
    effort: "Low",
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

const IMPACT_STYLE: Record<Impact, string> = {
  "Very high":   "bg-rose-50 text-rose-700 border-rose-200",
  "High":        "bg-orange-50 text-orange-700 border-orange-200",
  "Medium-high": "bg-amber-50 text-amber-700 border-amber-200",
  "Medium":      "bg-slate-100 text-slate-600 border-slate-200",
};

const EFFORT_STYLE: Record<Effort, string> = {
  "Low":    "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Medium": "bg-amber-50 text-amber-700 border-amber-200",
  "High":   "bg-rose-50 text-rose-700 border-rose-200",
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
        <div className="grid grid-cols-2 gap-4 pt-6 pb-6">
          {[
            {
              name: "First Response Healthcare",
              domain: "firstresponsehealthcare.com/ae/dubai",
              score: OVERALL.frh,
              color: FRH_COLOR,
              verdict: "Clear page identity, strong local proof, and consistent medical-at-home framing make this an LLM-friendly page.",
            },
            {
              name: "Valeo Health",
              domain: "feelvaleo.com/en-ae/dubai",
              score: OVERALL.valeo,
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

        {/* ── Section 1: Score Breakdown ───────────────────── */}
        <div className="mb-2">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">01 — Score Breakdown</h2>
        </div>

        <div className="print-break-inside-avoid bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_180px_180px] border-b border-slate-100">
            <div className="px-5 py-3 bg-slate-50 border-r border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Area</span>
            </div>
            <div className="px-5 py-3 border-r border-slate-100" style={{ borderTop: `3px solid ${FRH_COLOR}` }}>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: FRH_COLOR }} />
                <span className="font-semibold text-slate-700 text-xs">First Response</span>
              </div>
            </div>
            <div className="px-5 py-3" style={{ borderTop: `3px solid ${VALEO_COLOR}` }}>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: VALEO_COLOR }} />
                <span className="font-semibold text-slate-700 text-xs">Valeo</span>
              </div>
            </div>
          </div>

          {SCORES.map((row, i) => (
            <div
              key={row.area}
              className={`grid grid-cols-[1fr_180px_180px] hover:bg-slate-50/60 transition-colors ${i < SCORES.length - 1 ? "border-b border-slate-50" : ""}`}
            >
              <div className="px-5 py-3 border-r border-slate-100 bg-slate-50/40 flex items-center">
                <span className="text-sm font-medium text-slate-700">{row.area}</span>
              </div>
              <div className="px-5 py-3 border-r border-slate-100 flex items-center">
                <ScoreBar value={row.frh} color={FRH_COLOR} />
              </div>
              <div className="px-5 py-3 flex items-center">
                <ScoreBar value={row.valeo} color={VALEO_COLOR} />
              </div>
            </div>
          ))}

          {/* Overall footer */}
          <div className="grid grid-cols-[1fr_180px_180px] bg-slate-900">
            <div className="px-5 py-4 border-r border-slate-700 flex items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall GEO Readiness</span>
            </div>
            <div className="px-5 py-4 border-r border-slate-700 flex items-center gap-3">
              <span className="text-2xl font-black" style={{ color: FRH_COLOR }}>{OVERALL.frh}</span>
              <span className="text-slate-500 text-xs">/ 10</span>
              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden ml-1">
                <div className="h-full rounded-full" style={{ width: `${OVERALL.frh * 10}%`, backgroundColor: FRH_COLOR }} />
              </div>
            </div>
            <div className="px-5 py-4 flex items-center gap-3">
              <span className="text-2xl font-black" style={{ color: VALEO_COLOR }}>{OVERALL.valeo}</span>
              <span className="text-slate-500 text-xs">/ 10</span>
              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden ml-1">
                <div className="h-full rounded-full" style={{ width: `${OVERALL.valeo * 10}%`, backgroundColor: VALEO_COLOR }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 2: Detailed Comparison ──────────────── */}
        <div className="print-break-before mb-2">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">02 — Detailed Comparison</h2>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          {/* Headers */}
          <div className="grid grid-cols-[160px_1fr_1fr_110px] border-b border-slate-100">
            <div className="px-4 py-3 bg-slate-50 border-r border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Check</span>
            </div>
            <div className="px-4 py-3 border-r border-slate-100" style={{ borderTop: `3px solid ${FRH_COLOR}` }}>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: FRH_COLOR }} />
                <span className="font-semibold text-slate-700 text-xs">First Response</span>
              </div>
            </div>
            <div className="px-4 py-3 border-r border-slate-100" style={{ borderTop: `3px solid ${VALEO_COLOR}` }}>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: VALEO_COLOR }} />
                <span className="font-semibold text-slate-700 text-xs">Valeo</span>
              </div>
            </div>
            <div className="px-4 py-3 bg-slate-50" style={{ borderTop: "3px solid #94a3b8" }}>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Winner</span>
            </div>
          </div>

          {COMP_ROWS.map((row, i) => (
            <div
              key={row.check}
              className={`grid grid-cols-[160px_1fr_1fr_110px] hover:bg-slate-50/60 transition-colors ${i < COMP_ROWS.length - 1 ? "border-b border-slate-50" : ""}`}
            >
              <div className="px-4 py-3.5 border-r border-slate-100 bg-slate-50/40 flex items-start">
                <span className="text-xs font-semibold text-slate-700 leading-snug">{row.check}</span>
              </div>
              <div className="px-4 py-3.5 border-r border-slate-100">
                <p className="text-xs text-slate-500 leading-relaxed">{row.frh}</p>
              </div>
              <div className="px-4 py-3.5 border-r border-slate-100">
                <p className="text-xs text-slate-500 leading-relaxed">{row.valeo}</p>
              </div>
              <div className="px-4 py-3.5 flex items-start">
                <WinnerBadge winner={row.winner} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Section 3: Priority Actions ──────────────────── */}
        <div className="print-break-before mb-2">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">03 — Priority Actions for Valeo</h2>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          {/* Headers */}
          <div className="grid grid-cols-[48px_1fr_2fr_100px_80px] border-b border-slate-100 bg-slate-50">
            <div className="px-3 py-3 border-r border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">#</span>
            </div>
            <div className="px-4 py-3 border-r border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</span>
            </div>
            <div className="px-4 py-3 border-r border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Why it matters</span>
            </div>
            <div className="px-4 py-3 border-r border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Impact</span>
            </div>
            <div className="px-4 py-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Effort</span>
            </div>
          </div>

          {ACTIONS.map((row, i) => {
            const ps = PRIORITY_STYLE[row.priority];
            return (
              <div
                key={i}
                className={`grid grid-cols-[48px_1fr_2fr_100px_80px] hover:bg-slate-50/60 transition-colors ${i < ACTIONS.length - 1 ? "border-b border-slate-50" : ""}`}
              >
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
                <div className="px-4 py-4 border-r border-slate-100 flex items-start">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${IMPACT_STYLE[row.impact]}`}>
                    {row.impact}
                  </span>
                </div>
                <div className="px-4 py-4 flex items-start">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${EFFORT_STYLE[row.effort]}`}>
                    {row.effort}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Section 4: AI Search Factor Analysis ─────────── */}
        <div className="print-break-before mb-2">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">04 — AI Search Factor Analysis</h2>
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

          {/* Overall footer */}
          <div className="grid grid-cols-[200px_120px_120px_100px] bg-slate-900">
            <div className="px-4 py-4 border-r border-slate-700 flex items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Search Readiness</span>
            </div>
            <div className="px-4 py-4 border-r border-slate-700 flex items-center gap-2">
              <span className="text-2xl font-black" style={{ color: VALEO_COLOR }}>6</span>
              <span className="text-slate-500 text-xs">/ 10</span>
              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden ml-1">
                <div className="h-full rounded-full" style={{ width: "60%", backgroundColor: VALEO_COLOR }} />
              </div>
            </div>
            <div className="px-4 py-4 border-r border-slate-700 flex items-center gap-2">
              <span className="text-2xl font-black" style={{ color: FRH_COLOR }}>8</span>
              <span className="text-slate-500 text-xs">/ 10</span>
              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden ml-1">
                <div className="h-full rounded-full" style={{ width: "80%", backgroundColor: FRH_COLOR }} />
              </div>
            </div>
            <div className="px-4 py-4 flex items-center">
              <WinnerBadge winner="frh" />
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 pb-4">
          Session 77 · Valeo Home Healthcare GEO Analysis · Dubai market · {today}
        </p>
      </div>
    </div>
  );
}
