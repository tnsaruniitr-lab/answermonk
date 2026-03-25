// Cavity options — robot ears are FIXED, only M and n letter walls change.
// Each option shows a different notch/slot shape cut into the letter walls
// so the existing ears tuck in, closing the gap.

const BG = "#f0eef8";
const LETTER = "#1e1b4b";
const EAR_FILL = "#6d28d9";
const EAR_LED  = "#a5b4fc";
const NOTCH_TINT = "rgba(129,140,248,0.20)";

// ─── Geometry ────────────────────────────────────────────────────────────────
// Panel: 320 × 140
// Robot: cx=160, cy=72, r=26
// Ears: 10px wide, 16px tall — fixed, unchanged, flush against body
// Letter walls: M right wall and n left wall drawn as angled sections
// Gap (current): 10px air between wall and ear

const PW = 320;
const PH = 140;
const CX  = 160;
const CY  = 76;
const R   = 26;
const EW  = 10;  // ear width
const EH  = 16;  // ear height
const EY  = CY - EH / 2;  // = 68

// Ear x positions (snug against robot body — NEVER CHANGE)
const LE_X = CX - R - EW;  // left ear x  = 124  (right edge = 134)
const RE_X = CX + R;        // right ear x = 186  (right edge = 196)

// Gap in "current" state
const GAP = 10;

// Letter wall positions — tight (touching ear)
const M_RIGHT_TIGHT  = LE_X;         // = 124 (M wall right edge, zero-gap)
const N_LEFT_TIGHT   = RE_X + EW;    // = 196 (n wall left edge, zero-gap)

// Letter wall positions — current (with gap)
const M_RIGHT_GAP = LE_X - GAP;      // = 114
const N_LEFT_GAP  = RE_X + EW + GAP; // = 206

// Width of the letter section shown
const LSEC = 80;

// ─── Robot (fixed, never changes) ────────────────────────────────────────────

function Robot() {
  return (
    <g>
      <defs>
        <radialGradient id="rg-cv" cx="38%" cy="32%" r="65%">
          <stop offset="0%"   stopColor="#818cf8" />
          <stop offset="100%" stopColor="#7c3aed" />
        </radialGradient>
      </defs>
      {/* Antenna */}
      <line x1={CX} y1={CY - R - 5} x2={CX} y2={CY - R + 5}
        stroke="#a5b4fc" strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={CX} cy={CY - R - 8} r={4.5} fill="#c4b5fd" />
      {/* Body */}
      <circle cx={CX} cy={CY} r={R} fill="url(#rg-cv)" />
      {/* Eyes */}
      <rect x={CX - 17} y={CY - 11} width={13} height={5.5} rx={2.5} fill="white" opacity={0.92} />
      <rect x={CX + 4}  y={CY - 11} width={13} height={5.5} rx={2.5} fill="white" opacity={0.92} />
      {/* Mouth */}
      <rect x={CX - 11} y={CY + 7} width={22} height={4} rx={2} fill="white" opacity={0.36} />
    </g>
  );
}

// Ears — fixed shape, only their relationship to the letter walls changes
function Ears() {
  return (
    <g>
      {/* Left ear */}
      <rect x={LE_X} y={EY} width={EW} height={EH} rx={2.5} fill={EAR_FILL} />
      <rect x={LE_X + 2} y={EY + 5} width={6} height={2.5} rx={1} fill={EAR_LED} opacity={0.85} />
      {/* Right ear */}
      <rect x={RE_X} y={EY} width={EW} height={EH} rx={2.5} fill={EAR_FILL} />
      <rect x={RE_X + 2} y={EY + 5} width={6} height={2.5} rx={1} fill={EAR_LED} opacity={0.85} />
    </g>
  );
}

// ─── Letter wall shapes ───────────────────────────────────────────────────────

// M's right section — shows the two right legs of a bold M
// rightEdge: where the right stroke of M ends (x position)
function MSection({ rightEdge, notch }: { rightEdge: number; notch?: React.ReactNode }) {
  const left = rightEdge - LSEC;
  const mid  = left + LSEC * 0.45;
  // Outer right leg (vertical)
  // Inner V — right diagonal, roughly 55% across, goes to mid-bottom
  return (
    <g>
      {/* Outer right leg of M (vertical stroke) */}
      <rect x={rightEdge - 16} y={8} width={16} height={PH - 16} fill={LETTER} />
      {/* Inner right diagonal of M (goes from mid-top to center-bottom) */}
      <polygon
        points={`${rightEdge - 16},8 ${rightEdge - 30},8 ${mid},${PH * 0.58} ${mid + 10},${PH * 0.58}`}
        fill={LETTER}
      />
      {/* Left portion fill so it reads as "M wall" */}
      <rect x={left} y={8} width={18} height={PH - 16} fill={LETTER} />
      {/* Notch overlay */}
      {notch}
      {/* "M" label at top */}
      <text x={left + LSEC / 2 - 6} y={22} fontSize={11} fill="white" opacity={0.55}
        fontWeight="700" fontFamily="sans-serif">M</text>
    </g>
  );
}

// n's left section — shows left stroke + arch of a bold lowercase n
// leftEdge: where the left stroke of n starts
function NSection({ leftEdge, notch }: { leftEdge: number; notch?: React.ReactNode }) {
  const archEnd = leftEdge + LSEC;
  const archMid = leftEdge + 30;
  return (
    <g>
      {/* Left vertical stroke of n */}
      <rect x={leftEdge} y={8} width={16} height={PH - 16} fill={LETTER} />
      {/* Arch top */}
      <rect x={leftEdge + 16} y={8} width={LSEC - 16} height={18} fill={LETTER} rx={6} />
      {/* Right leg of n (partial, just to show letter form) */}
      <rect x={archEnd - 16} y={8} width={16} height={PH * 0.7} fill={LETTER} />
      {/* Notch overlay */}
      {notch}
      {/* "n" label at top */}
      <text x={leftEdge + LSEC / 2 - 3} y={22} fontSize={11} fill="white" opacity={0.55}
        fontWeight="700" fontFamily="sans-serif">n</text>
    </g>
  );
}

// ─── Panel wrapper ────────────────────────────────────────────────────────────

function Panel({ label, sublabel, accent, children }: {
  label: string; sublabel: string; accent: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: "0 0 auto" }}>
      <div style={{
        border: `2px solid ${accent}`,
        borderRadius: 14,
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 2px 14px rgba(99,102,241,0.10)",
      }}>
        <svg viewBox={`0 0 ${PW} ${PH}`} width={PW} height={PH} style={{ display: "block" }}>
          <rect width={PW} height={PH} fill={BG} />
          {children}
        </svg>
      </div>
      <div style={{ maxWidth: PW }}>
        <div style={{ fontWeight: 800, fontSize: 13, color: "#1e1b4b", letterSpacing: "-0.01em" }}>
          {label}
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, lineHeight: 1.45 }}>
          {sublabel}
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function CavityOptions() {
  // M right outer leg right edge when tight
  const M_OL_RIGHT = M_RIGHT_TIGHT;     // = 124

  return (
    <div style={{
      background: BG,
      padding: 28,
      fontFamily: "'Inter', system-ui, sans-serif",
      minHeight: "100vh",
    }}>
      <div style={{ fontSize: 11, color: "#6366f1", fontWeight: 700, letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>
        Cavity Options
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#1e1b4b", letterSpacing: "-0.03em", marginBottom: 4 }}>
        Robot ears tuck into M and n — 4 notch shapes
      </div>
      <div style={{ fontSize: 11.5, color: "#64748b", marginBottom: 28 }}>
        Robot is <strong>unchanged</strong>. Only the letter walls gain a notch to receive the existing ears.
        Shaded area = material removed from letter.
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>

        {/* ── CURRENT ──────────────────────────────────────────────── */}
        <Panel label="Current — gap visible" accent="#ef4444"
          sublabel="Ears float in open air. 10px gap between M's wall and ear, same on n side.">
          <MSection rightEdge={M_RIGHT_GAP} />
          {/* Red gap zone left */}
          <rect x={M_RIGHT_GAP} y={EY - 2} width={GAP} height={EH + 4} fill="#ef4444" opacity={0.18} />
          <text x={M_RIGHT_GAP + GAP / 2} y={EY - 5} fontSize={7.5} fill="#ef4444"
            textAnchor="middle" fontWeight="700" fontFamily="sans-serif">gap</text>
          <Robot />
          <Ears />
          {/* Red gap zone right */}
          <rect x={RE_X + EW} y={EY - 2} width={GAP} height={EH + 4} fill="#ef4444" opacity={0.18} />
          <text x={RE_X + EW + GAP / 2} y={EY - 5} fontSize={7.5} fill="#ef4444"
            textAnchor="middle" fontWeight="700" fontFamily="sans-serif">gap</text>
          <NSection leftEdge={N_LEFT_GAP} />
        </Panel>

        {/* ── OPTION A — flat rectangular slot ─────────────────────── */}
        <Panel label="A — Flat rectangular slot" accent="#6366f1"
          sublabel="Rect notch cut in M's outer right leg + n's left stroke. Ear slots in with clean square edges.">
          {/* M with rectangular notch at ear height */}
          <MSection rightEdge={M_OL_RIGHT}>
            <rect x={M_OL_RIGHT - GAP} y={EY} width={GAP} height={EH} fill={BG} />
            <rect x={M_OL_RIGHT - GAP} y={EY} width={GAP} height={EH} fill={NOTCH_TINT} />
          </MSection>
          <Robot />
          <Ears />
          {/* n with rectangular notch */}
          <NSection leftEdge={N_LEFT_TIGHT}>
            <rect x={N_LEFT_TIGHT} y={EY} width={GAP} height={EH} fill={BG} />
            <rect x={N_LEFT_TIGHT} y={EY} width={GAP} height={EH} fill={NOTCH_TINT} />
          </NSection>
        </Panel>

        {/* ── OPTION B — rounded arch slot ─────────────────────────── */}
        <Panel label="B — Rounded arch slot" accent="#7c3aed"
          sublabel="Semicircular cutout matching ear's rx corners. Cavity and ear share the same visual curve.">
          <MSection rightEdge={M_OL_RIGHT}>
            <rect x={M_OL_RIGHT - GAP} y={EY} width={GAP} height={EH}
              rx={GAP * 0.55} fill={BG} />
            <rect x={M_OL_RIGHT - GAP} y={EY} width={GAP} height={EH}
              rx={GAP * 0.55} fill={NOTCH_TINT} />
          </MSection>
          <Robot />
          <Ears />
          <NSection leftEdge={N_LEFT_TIGHT}>
            <rect x={N_LEFT_TIGHT} y={EY} width={GAP} height={EH}
              rx={GAP * 0.55} fill={BG} />
            <rect x={N_LEFT_TIGHT} y={EY} width={GAP} height={EH}
              rx={GAP * 0.55} fill={NOTCH_TINT} />
          </NSection>
        </Panel>

        {/* ── OPTION C — M only ────────────────────────────────────── */}
        <Panel label="C — M only, n untouched" accent="#059669"
          sublabel="Only M gets the notch. Robot sits slightly left so right ear skims n's stroke naturally.">
          <MSection rightEdge={M_OL_RIGHT}>
            <rect x={M_OL_RIGHT - GAP} y={EY} width={GAP} height={EH} fill={BG} />
            <rect x={M_OL_RIGHT - GAP} y={EY} width={GAP} height={EH} fill={NOTCH_TINT} />
          </MSection>
          <Robot />
          <Ears />
          {/* n untouched — small remaining gap shown in green */}
          <NSection leftEdge={N_LEFT_GAP} />
          <rect x={RE_X + EW} y={EY} width={GAP} height={EH} fill="#d1fae5" opacity={0.55} />
          <text x={RE_X + EW + GAP / 2} y={EY - 5} fontSize={7.5} fill="#059669"
            textAnchor="middle" fontWeight="700" fontFamily="sans-serif">~gap</text>
        </Panel>

        {/* ── OPTION D — tapered / dovetail ────────────────────────── */}
        <Panel label="D — Tapered / dovetail slot" accent="#d97706"
          sublabel="Slot widens at opening, tapers inward. Ear appears to snap in. Geometric, techy feel.">
          {/* M tapered notch: wide at right (ear entry), narrow inside M */}
          <MSection rightEdge={M_OL_RIGHT}>
            <polygon
              points={`
                ${M_OL_RIGHT},${EY}
                ${M_OL_RIGHT},${EY + EH}
                ${M_OL_RIGHT - GAP},${EY + EH / 2 + 3}
                ${M_OL_RIGHT - GAP},${EY + EH / 2 - 3}
              `}
              fill={BG}
            />
            <polygon
              points={`
                ${M_OL_RIGHT},${EY}
                ${M_OL_RIGHT},${EY + EH}
                ${M_OL_RIGHT - GAP},${EY + EH / 2 + 3}
                ${M_OL_RIGHT - GAP},${EY + EH / 2 - 3}
              `}
              fill={NOTCH_TINT}
            />
          </MSection>
          <Robot />
          <Ears />
          {/* n tapered notch: wide at left edge (ear entry), narrows rightward */}
          <NSection leftEdge={N_LEFT_TIGHT}>
            <polygon
              points={`
                ${N_LEFT_TIGHT},${EY}
                ${N_LEFT_TIGHT},${EY + EH}
                ${N_LEFT_TIGHT + GAP},${EY + EH / 2 + 3}
                ${N_LEFT_TIGHT + GAP},${EY + EH / 2 - 3}
              `}
              fill={BG}
            />
            <polygon
              points={`
                ${N_LEFT_TIGHT},${EY}
                ${N_LEFT_TIGHT},${EY + EH}
                ${N_LEFT_TIGHT + GAP},${EY + EH / 2 + 3}
                ${N_LEFT_TIGHT + GAP},${EY + EH / 2 - 3}
              `}
              fill={NOTCH_TINT}
            />
          </NSection>
        </Panel>

      </div>

      {/* Note */}
      <div style={{
        marginTop: 28,
        padding: "13px 16px",
        background: "rgba(99,102,241,0.07)",
        border: "1px solid rgba(99,102,241,0.18)",
        borderRadius: 10,
        fontSize: 11.5,
        color: "#4338ca",
        maxWidth: 1340,
        lineHeight: 1.6,
      }}>
        <strong>B recommended:</strong> The robot ears already have rounded corners (rx=2.5), so a rounded arch 
        cavity in M and n echoes the same curve — cavity and ear are visually the same shape. 
        A is cleaner to execute in font software (straight cuts). D is visually striking but may be hard to read at badge/favicon size.
      </div>
    </div>
  );
}
