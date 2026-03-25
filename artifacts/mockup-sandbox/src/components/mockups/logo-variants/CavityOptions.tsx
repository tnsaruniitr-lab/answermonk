// Cavity options for fitting robot ears into M and n letter walls
// Shows: current gap problem + 4 cavity/notch approaches

const BG = "#f5f3ff";
const LETTER = "#1e1b4b";
const EAR_BODY = "#6d28d9";
const EAR_LED = "#a5b4fc";
const CAVITY_TINT = "rgba(129,140,248,0.18)";

// ─── Shared geometry ───────────────────────────────────────────────
// Panel: 260 × 130
// Robot: cx=130, cy=68, r=28
// Ears: 11px wide, 18px tall, snug against robot body
// Letter blocks: 54px wide on each side
// GAP: 8px gap between letter block and ear (in "current" state)

const PW = 260;
const PH = 130;
const CX = 130;
const CY = 68;
const R = 28;
const EW = 11; const EH = 18;
const EY = CY - EH / 2; // ear y = 59

// Ear x positions (flush against robot body, no gap)
const LE_X = CX - R - EW; // left ear x  = 91
const RE_X = CX + R;       // right ear x  = 158

// Letter block x positions (tight = touching ear)
const M_TIGHT  = LE_X;        // = 91  (right edge of M block when tight)
const N_TIGHT  = RE_X + EW;   // = 169 (left edge of n block when tight)

// Letter block x positions (current = 8px gap each side)
const GAP = 8;
const M_GAP = M_TIGHT - GAP;  // = 83
const N_GAP = N_TIGHT + GAP;  // = 177

// Letter block width (constant 54px)
const LW = 54;

// ─── Sub-components ────────────────────────────────────────────────

function RobotBody() {
  return (
    <g>
      <defs>
        <radialGradient id="rg-cav" cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#7c3aed" />
        </radialGradient>
      </defs>
      {/* Antenna */}
      <line x1={CX} y1={CY - R - 4} x2={CX} y2={CY - R + 4}
        stroke="#a5b4fc" strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={CX} cy={CY - R - 7} r={4} fill="#c4b5fd" />
      {/* Body */}
      <circle cx={CX} cy={CY} r={R} fill="url(#rg-cav)" />
      {/* Eyes */}
      <rect x={CX - 16} y={CY - 11} width={12} height={5} rx={2.5} fill="white" opacity={0.92} />
      <rect x={CX + 4}  y={CY - 11} width={12} height={5} rx={2.5} fill="white" opacity={0.92} />
      {/* Mouth */}
      <rect x={CX - 10} y={CY + 7} width={20} height={3.5} rx={1.75} fill="white" opacity={0.38} />
    </g>
  );
}

function Ear({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y={EY} width={EW} height={EH} rx={2.5} fill={EAR_BODY} />
      <rect x={x + 2} y={EY + 5} width={7} height={2.5} rx={1} fill={EAR_LED} opacity={0.85} />
    </g>
  );
}

// Filled letter block (left side = M right leg, right side = n left leg)
function MBlock({ rightEdge }: { rightEdge: number }) {
  return <rect x={rightEdge - LW} y={0} width={LW} height={PH} fill={LETTER} />;
}
function NBlock({ leftEdge }: { leftEdge: number }) {
  return <rect x={leftEdge} y={0} width={LW} height={PH} fill={LETTER} />;
}

// ─── Option panels ─────────────────────────────────────────────────

type PanelProps = {
  label: string;
  sublabel: string;
  accentColor: string;
  children: React.ReactNode;
};

function Panel({ label, sublabel, accentColor, children }: PanelProps) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{
        background: "#fff",
        border: `2px solid ${accentColor}`,
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(99,102,241,0.10)",
      }}>
        <svg viewBox={`0 0 ${PW} ${PH}`} width={PW} height={PH}
          style={{ display: "block" }}>
          <rect width={PW} height={PH} fill={BG} />
          {children}
        </svg>
      </div>
      <div>
        <div style={{ fontWeight: 800, fontSize: 13, color: "#1e1b4b", letterSpacing: "-0.02em" }}>
          {label}
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, lineHeight: 1.4 }}>
          {sublabel}
        </div>
      </div>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────

export function CavityOptions() {
  return (
    <div style={{
      background: BG,
      padding: 32,
      fontFamily: "'Inter', sans-serif",
      minHeight: "100vh",
    }}>
      <div style={{ fontSize: 11, color: "#6366f1", fontWeight: 700, letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" }}>
        Logo Ear Fit — 5 Options
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#1e1b4b", letterSpacing: "-0.03em", marginBottom: 4 }}>
        Fitting robot ears into M and n
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 32 }}>
        Top of each diagram = letter wall · Robot ears = purple rectangles · Shaded area = material removed
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>

        {/* ── CURRENT ── */}
        <Panel
          label="Current — gap visible"
          sublabel="8px air gap on each side of the ear. Letters look separated from robot."
          accentColor="#ef4444"
        >
          {/* M block with visible gap */}
          <MBlock rightEdge={M_GAP} />
          {/* Gap highlight left */}
          <rect x={M_GAP} y={EY} width={GAP} height={EH} fill="#ef4444" opacity={0.22} />
          <Ear x={LE_X} />
          <RobotBody />
          <Ear x={RE_X} />
          {/* Gap highlight right */}
          <rect x={RE_X + EW} y={EY} width={GAP} height={EH} fill="#ef4444" opacity={0.22} />
          <NBlock leftEdge={N_GAP} />
          {/* Gap arrows */}
          <text x={M_GAP + GAP / 2} y={EY - 4} fontSize={7} fill="#ef4444" textAnchor="middle" fontWeight="700">←8px→</text>
          <text x={RE_X + EW + GAP / 2} y={EY - 4} fontSize={7} fill="#ef4444" textAnchor="middle" fontWeight="700">←8px→</text>
        </Panel>

        {/* ── OPTION A — flat rectangular notches ── */}
        <Panel
          label="A — Flat rectangular notch"
          sublabel="Rect slot in M right wall + n left wall. Ear slots in flush. Clean, precise look."
          accentColor="#6366f1"
        >
          {/* M block — full width, cavity cut in right side at ear height */}
          <MBlock rightEdge={M_TIGHT} />
          {/* Cavity: rectangular, bg colour */}
          <rect x={M_TIGHT - GAP} y={EY} width={GAP} height={EH} fill={BG} />
          <rect x={M_TIGHT - GAP} y={EY} width={GAP} height={EH} fill={CAVITY_TINT} />
          <Ear x={LE_X} />
          <RobotBody />
          <Ear x={RE_X} />
          {/* n block with flat rectangular cavity */}
          <NBlock leftEdge={N_TIGHT} />
          <rect x={N_TIGHT} y={EY} width={GAP} height={EH} fill={BG} />
          <rect x={N_TIGHT} y={EY} width={GAP} height={EH} fill={CAVITY_TINT} />
        </Panel>

        {/* ── OPTION B — rounded arch cavities ── */}
        <Panel
          label="B — Rounded arch cavity"
          sublabel="Semicircular cutout matching the ear's rounded profile. Most organic, suits robot character."
          accentColor="#7c3aed"
        >
          <MBlock rightEdge={M_TIGHT} />
          {/* Rounded cavity: bg + tint */}
          <rect x={M_TIGHT - GAP} y={EY} width={GAP} height={EH} rx={GAP / 2} fill={BG} />
          <rect x={M_TIGHT - GAP} y={EY} width={GAP} height={EH} rx={GAP / 2} fill={CAVITY_TINT} />
          <Ear x={LE_X} />
          <RobotBody />
          <Ear x={RE_X} />
          <NBlock leftEdge={N_TIGHT} />
          <rect x={N_TIGHT} y={EY} width={GAP} height={EH} rx={GAP / 2} fill={BG} />
          <rect x={N_TIGHT} y={EY} width={GAP} height={EH} rx={GAP / 2} fill={CAVITY_TINT} />
        </Panel>

        {/* ── OPTION C — M only, n untouched ── */}
        <Panel
          label="C — M only, n untouched"
          sublabel="Only M gets a notch. Robot sits slightly left. n's left stroke skims the ear naturally."
          accentColor="#059669"
        >
          {/* M with cavity */}
          <MBlock rightEdge={M_TIGHT} />
          <rect x={M_TIGHT - GAP} y={EY} width={GAP} height={EH} fill={BG} />
          <rect x={M_TIGHT - GAP} y={EY} width={GAP} height={EH} fill={CAVITY_TINT} />
          <Ear x={LE_X} />
          <RobotBody />
          <Ear x={RE_X} />
          {/* n block — no cavity, with small remaining gap shown */}
          <NBlock leftEdge={N_GAP} />
          {/* Small gap indicator on right */}
          <rect x={RE_X + EW} y={EY} width={GAP} height={EH} fill="#d1fae5" opacity={0.6} />
          <text x={RE_X + EW + GAP / 2} y={EY - 4} fontSize={7} fill="#059669" textAnchor="middle" fontWeight="700">~8px</text>
        </Panel>

        {/* ── OPTION D — tapered / dovetail ── */}
        <Panel
          label="D — Tapered / dovetail"
          sublabel="Slot wider at opening, narrows inward. Ear snaps in. Very geometric, techy — reads small scale."
          accentColor="#d97706"
        >
          <MBlock rightEdge={M_TIGHT} />
          {/* Tapered cavity: wider at right opening (x=M_TIGHT), narrower inward */}
          {/* Using polygon: opening 8px full height taper to 3px at depth */}
          <polygon
            points={`
              ${M_TIGHT},${EY}
              ${M_TIGHT},${EY + EH}
              ${M_TIGHT - GAP},${EY + EH / 2 - 3}
              ${M_TIGHT - GAP},${EY + EH / 2 + 3}
            `}
            fill={BG}
          />
          <polygon
            points={`
              ${M_TIGHT},${EY}
              ${M_TIGHT},${EY + EH}
              ${M_TIGHT - GAP},${EY + EH / 2 - 3}
              ${M_TIGHT - GAP},${EY + EH / 2 + 3}
            `}
            fill={CAVITY_TINT}
          />
          <Ear x={LE_X} />
          <RobotBody />
          <Ear x={RE_X} />
          <NBlock leftEdge={N_TIGHT} />
          {/* Mirrored tapered cavity for n */}
          <polygon
            points={`
              ${N_TIGHT},${EY}
              ${N_TIGHT},${EY + EH}
              ${N_TIGHT + GAP},${EY + EH / 2 - 3}
              ${N_TIGHT + GAP},${EY + EH / 2 + 3}
            `}
            fill={BG}
          />
          <polygon
            points={`
              ${N_TIGHT},${EY}
              ${N_TIGHT},${EY + EH}
              ${N_TIGHT + GAP},${EY + EH / 2 - 3}
              ${N_TIGHT + GAP},${EY + EH / 2 + 3}
            `}
            fill={CAVITY_TINT}
          />
        </Panel>

      </div>

      {/* Recommendation note */}
      <div style={{
        marginTop: 32,
        padding: "14px 18px",
        background: "rgba(99,102,241,0.08)",
        border: "1px solid rgba(99,102,241,0.2)",
        borderRadius: 10,
        fontSize: 12,
        color: "#4338ca",
        maxWidth: 860,
        lineHeight: 1.6,
      }}>
        <strong>Note on Option B:</strong> Since the robot ears already have rounded corners (rx=2.5), 
        matching them with a rounded arch in M and n creates the most cohesive result — the cavity and 
        the ear speak the same visual language. Option D is the most distinctive but may lose definition at 
        small sizes (&lt;24px height).
      </div>
    </div>
  );
}
