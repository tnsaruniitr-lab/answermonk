import { useState } from "react";

const DEFAULT_QUALIFIERS = [
  "most trusted","most reliable","most affordable","highest rated",
  "most experienced","best reviewed","most recommended","top rated",
];

type Chip = { label: string; on: boolean };
type Blocks = { 1: Chip[]; 2: Chip[]; 3: Chip[]; 4: Chip[] };
type Competitor = { name: string; location: string; known_for: string };
type Prompt = { verb: string; text: string };
type V2ServiceGroup = { service: string; prompts: Prompt[] };
type V2CustomerGroup = { customer: string; prompts: Prompt[] };
type V2Result = {
  business_name: string;
  total_prompts: number;
  by_service: V2ServiceGroup[];
  by_customer: V2CustomerGroup[];
};
type CostEntry = {
  label: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
};

const makeDefaultBlocks = (): Blocks => ({
  1: [], 2: [], 3: [],
  4: DEFAULT_QUALIFIERS.map((v) => ({ label: v, on: true })),
});

function verbClass(verb: string) {
  if (verb === "Find") return "bg-blue-900/60 text-blue-300";
  if (verb === "List") return "bg-teal-900/60 text-teal-300";
  return "bg-amber-900/60 text-amber-300";
}

function blockColors(n: 1 | 2 | 3 | 4) {
  const map = {
    1: { num: "bg-blue-900/40 text-blue-300", chipOn: "bg-blue-400 border-transparent text-black", dot: "bg-blue-400" },
    2: { num: "bg-teal-900/40 text-teal-300", chipOn: "bg-teal-400 border-transparent text-black", dot: "bg-teal-400" },
    3: { num: "bg-pink-900/40 text-pink-300", chipOn: "bg-pink-400 border-transparent text-black", dot: "bg-pink-400" },
    4: { num: "bg-amber-900/40 text-amber-300", chipOn: "bg-amber-400 border-transparent text-black", dot: "bg-amber-400" },
  };
  return map[n];
}

function cpText(text: string, btn: EventTarget & HTMLButtonElement, resetLabel: string) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => { btn.textContent = resetLabel || orig || ""; }, 1600);
  });
}

export default function PncCreator() {
  const [url, setUrl] = useState("");
  const [tab, setTab] = useState<"v1" | "v2">("v1");
  const [err, setErr] = useState("");

  const [v1Loading, setV1Loading] = useState(false);
  const [v1LoaderMsg, setV1LoaderMsg] = useState("Fetching website\u2026");
  const [v1Loaded, setV1Loaded] = useState(false);
  const [blocks, setBlocks] = useState<Blocks>(makeDefaultBlocks());
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [locMode, setLocMode] = useState<"city" | "country" | "global">("city");
  const [locCity, setLocCity] = useState("");
  const [locCountry, setLocCountry] = useState("");
  const [custToggle, setCustToggle] = useState(false);
  const [addInputs, setAddInputs] = useState<Record<number, string>>({ 1: "", 2: "", 3: "", 4: "" });
  const [v1Generating, setV1Generating] = useState(false);
  const [v1GenMsg, setV1GenMsg] = useState("Curating best combinations\u2026");
  const [v1Prompts, setV1Prompts] = useState<Prompt[]>([]);

  const [v2LocMode, setV2LocMode] = useState<"city" | "country" | "global">("city");
  const [v2LocCity, setV2LocCity] = useState("");
  const [v2LocCountry, setV2LocCountry] = useState("");
  const [v2Loading, setV2Loading] = useState(false);
  const [v2LoaderMsg, setV2LoaderMsg] = useState("Reading website\u2026");
  const [v2Result, setV2Result] = useState<V2Result | null>(null);
  const [v2View, setV2View] = useState<"service" | "customer">("service");

  const [costs, setCosts] = useState<CostEntry[]>([]);

  function getLoc(mode: string, city: string, country: string) {
    if (mode === "global") return "globally";
    if (mode === "city") return city ? `in ${city}` : "in [city]";
    return country ? `in ${country}` : "in [country]";
  }
  const v1GetLoc = () => getLoc(locMode, locCity, locCountry);
  const v2GetLoc = () => getLoc(v2LocMode, v2LocCity, v2LocCountry);

  const toggleChip = (n: 1 | 2 | 3 | 4, i: number) => {
    setBlocks((prev) => ({ ...prev, [n]: prev[n].map((c, idx) => idx === i ? { ...c, on: !c.on } : c) }));
  };

  const toggleAll = (n: 1 | 2 | 3 | 4) => {
    setBlocks((prev) => {
      const allOn = prev[n].every((c) => c.on);
      return { ...prev, [n]: prev[n].map((c) => ({ ...c, on: !allOn })) };
    });
  };

  const addChip = (n: 1 | 2 | 3 | 4) => {
    const val = (addInputs[n] || "").trim();
    if (!val) return;
    setBlocks((prev) => ({ ...prev, [n]: [...prev[n], { label: val, on: true }] }));
    setAddInputs((prev) => ({ ...prev, [n]: "" }));
    if (v1Prompts.length) v1Generate();
  };

  const v1Extract = async () => {
    if (!url) { setErr("Please enter a URL first."); return; }
    if (!url.startsWith("http")) { setErr("URL must start with https://"); return; }
    setErr(""); setV1Loaded(false); setV1Loading(true);
    const steps = ["Fetching website\u2026", "Reading services\u2026", "Identifying customer types\u2026", "Building blocks\u2026"];
    let si = 0;
    setV1LoaderMsg(steps[0]);
    const iv = setInterval(() => { si = (si + 1) % steps.length; setV1LoaderMsg(steps[si]); }, 2000);
    try {
      const res = await fetch("/api/pnc/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      clearInterval(iv);
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || "API error " + res.status); }
      const data = await res.json();
      setBlocks({
        1: (data.business_type_variants || []).map((v: string) => ({ label: v, on: true })),
        2: (data.service_types || []).map((v: string) => ({ label: v, on: true })),
        3: (data.customer_types || []).map((v: string) => ({ label: v, on: true })),
        4: DEFAULT_QUALIFIERS.map((v) => ({ label: v, on: true })),
      });
      setCompetitors(data.competitors || []);
      setLocCity(data.city || "");
      setLocCountry(data.country || "");
      setV2LocCity(data.city || "");
      setV2LocCountry(data.country || "");
      if (data._cost) setCosts((prev) => [...prev, { label: "Extract blocks (web search)", ...data._cost }]);
      setV1Loading(false);
      setV1Loaded(true);
    } catch (e: any) {
      clearInterval(iv);
      setV1Loading(false);
      setErr("Error: " + (e.message || "Something went wrong."));
    }
  };

  const v1Generate = async () => {
    const b1 = blocks[1].filter((c) => c.on).map((c) => c.label);
    const b2 = blocks[2].filter((c) => c.on).map((c) => c.label);
    const b3 = blocks[3].filter((c) => c.on).map((c) => c.label);
    const b4 = blocks[4].filter((c) => c.on).map((c) => c.label);
    const loc = v1GetLoc();
    setErr(""); setV1Prompts([]); setV1Generating(true);
    const steps = ["Curating best combinations\u2026", "Applying qualifiers\u2026", "Writing prompts\u2026"];
    let si = 0;
    setV1GenMsg(steps[0]);
    const iv = setInterval(() => { si = (si + 1) % steps.length; setV1GenMsg(steps[si]); }, 1800);
    try {
      const res = await fetch("/api/pnc/v1-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ b1, b2, b3, b4, inclCust: custToggle, loc }),
      });
      clearInterval(iv);
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || "API error"); }
      const data = await res.json();
      setV1Prompts(data.prompts || []);
      if (data._cost) setCosts((prev) => [...prev, { label: "Generate prompts (Block Builder)", ...data._cost }]);
      setV1Generating(false);
    } catch (e: any) {
      clearInterval(iv);
      setV1Generating(false);
      setErr("Error: " + (e.message || "Please try again."));
    }
  };

  const v2Generate = async () => {
    if (!url) { setErr("Please enter a URL first."); return; }
    if (!url.startsWith("http")) { setErr("URL must start with https://"); return; }
    const loc = v2GetLoc();
    setErr(""); setV2Result(null); setV2Loading(true);
    const steps = ["Reading website\u2026", "Identifying services & customers\u2026", "Writing grouped prompts\u2026", "Grouping by service & customer\u2026"];
    let si = 0;
    setV2LoaderMsg(steps[0]);
    const iv = setInterval(() => { si = (si + 1) % steps.length; setV2LoaderMsg(steps[si]); }, 2200);
    try {
      const res = await fetch("/api/pnc/v2-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, loc }),
      });
      clearInterval(iv);
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || "API error " + res.status); }
      const data = await res.json();
      if (data._cost) setCosts((prev) => [...prev, { label: "Auto Groups (web search)", ...data._cost }]);
      setV2Loading(false);
      setV2Result(data);
    } catch (e: any) {
      clearInterval(iv);
      setV2Loading(false);
      setErr("Error: " + (e.message || "Something went wrong."));
    }
  };

  const handleExtractClick = () => { if (tab === "v1") v1Extract(); else v2Generate(); };

  const blockMeta: Record<number, { title: string; sub: string; placeholder: string }> = {
    1: { title: "Business type variants", sub: "Different ways to describe what this business is.", placeholder: "Add variant\u2026" },
    2: { title: "Service type variants", sub: "Each service offered.", placeholder: "Add service\u2026" },
    3: { title: "Customer type variants", sub: "Who searches for this.", placeholder: "Add customer type\u2026" },
    4: { title: "Qualifiers", sub: "What makes this business stand out.", placeholder: "Add qualifier\u2026" },
  };

  const summary = () => {
    const b1 = blocks[1].filter((c) => c.on).length;
    const b2 = blocks[2].filter((c) => c.on).length;
    const b3 = blocks[3].filter((c) => c.on).length;
    const b4 = blocks[4].filter((c) => c.on).length;
    return { b1, b2, b3, b4, loc: v1GetLoc() };
  };

  const renderBlock = (n: 1 | 2 | 3 | 4) => {
    const colors = blockColors(n);
    const meta = blockMeta[n];
    const chips = blocks[n];
    const allOn = chips.length > 0 && chips.every((c) => c.on);
    return (
      <div key={n} className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2.5">
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono flex-shrink-0 ${colors.num}`}>{n}</span>
          <span className="text-xs font-semibold tracking-wide">{meta.title}</span>
          <button type="button" className="ml-auto text-[10px] px-2.5 py-0.5 border border-border rounded-full text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors whitespace-nowrap" onClick={() => toggleAll(n)}>
            {allOn ? "Deselect all" : "Select all"}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground mb-2.5 leading-relaxed">{meta.sub}</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {chips.map((c, i) => (
            <span
              key={i}
              onClick={() => toggleChip(n, i)}
              className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border cursor-pointer select-none transition-all ${c.on ? colors.chipOn : "border-border bg-card text-muted-foreground hover:border-muted-foreground hover:text-foreground"}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.dot}`} style={c.on ? { opacity: 0.5 } : {}} />
              {c.label}
            </span>
          ))}
        </div>
        {n === 3 && (
          <div className="flex items-center gap-2.5 mt-1 mb-2">
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input type="checkbox" className="sr-only" checked={custToggle} onChange={(e) => setCustToggle(e.target.checked)} />
              <div className={`w-8 h-4 rounded-full border transition-colors ${custToggle ? "bg-lime-400 border-lime-400" : "bg-card border-border"}`} />
              <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-transform ${custToggle ? "translate-x-4 bg-black" : "bg-muted-foreground"}`} />
            </label>
            <span className="text-[11px] text-muted-foreground">Include customer type in prompts</span>
          </div>
        )}
        <div className="flex gap-1.5 mt-1">
          <input
            className="flex-1 bg-muted/30 border border-border rounded text-[11px] px-2.5 h-7 text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-muted-foreground transition-colors"
            placeholder={meta.placeholder}
            value={addInputs[n]}
            onChange={(e) => setAddInputs((prev) => ({ ...prev, [n]: e.target.value }))}
            onKeyDown={(e) => { if (e.key === "Enter") addChip(n); }}
          />
          <button type="button" className="h-7 px-3 bg-card border border-border rounded text-[11px] text-muted-foreground hover:border-muted-foreground hover:text-foreground transition-colors whitespace-nowrap" onClick={() => addChip(n)}>
            + Add
          </button>
        </div>
      </div>
    );
  };

  const renderLocationBlock = (
    mode: "city" | "country" | "global",
    setMode: (m: "city" | "country" | "global") => void,
    city: string, setCity: (v: string) => void,
    country: string, setCountry: (v: string) => void,
    onLocChange?: () => void
  ) => (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between flex-wrap gap-2.5 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono bg-orange-900/40 text-orange-300">Z</span>
            <span className="text-xs font-semibold tracking-wide">Location</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Toggle scope — prompts update automatically</p>
        </div>
        <div className="flex gap-1.5">
          {(["city", "country", "global"] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={`text-[12px] px-3.5 py-1 border rounded-full transition-all capitalize ${mode === m ? "bg-lime-400/10 border-lime-400 text-lime-400" : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"}`}
              onClick={() => { setMode(m); if (onLocChange) onLocChange(); }}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {mode !== "global" && (
        <div className="flex gap-2 flex-wrap mt-2">
          <div>
            <div className="text-[10px] text-muted-foreground/50 font-mono mb-1">CITY</div>
            <input className="bg-muted/30 border border-border rounded text-[11px] px-2.5 h-7 w-36 text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-muted-foreground" placeholder="e.g. Dubai" value={city} onChange={(e) => setCity(e.target.value)} onBlur={onLocChange} />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground/50 font-mono mb-1">COUNTRY</div>
            <input className="bg-muted/30 border border-border rounded text-[11px] px-2.5 h-7 w-36 text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-muted-foreground" placeholder="e.g. UAE" value={country} onChange={(e) => setCountry(e.target.value)} onBlur={onLocChange} />
          </div>
        </div>
      )}
    </div>
  );

  const renderPromptRow = (p: Prompt, i: number) => (
    <div key={i} className="flex items-start gap-2.5 bg-card border border-border rounded-xl px-3.5 py-2.5 hover:border-muted-foreground/50 transition-colors">
      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0 ${verbClass(p.verb)}`}>{p.verb}</span>
      <span className="flex-1 text-[13px] font-mono leading-relaxed">{p.text.replace(/^(Find|List|Rank)\s+/i, "")}</span>
      <button type="button" className="text-[10px] px-2 py-0.5 border border-border rounded text-muted-foreground hover:border-lime-400 hover:text-lime-400 transition-colors flex-shrink-0 mt-0.5" onClick={(e) => cpText(p.text, e.currentTarget, "Copy")}>Copy</button>
    </div>
  );

  const { b1, b2, b3, b4, loc } = summary();

  return (
    <div className="space-y-4 pb-16">

      {/* Shared URL row */}
      <div className="flex gap-2">
        <input
          className="flex-1 bg-card border border-border rounded-xl px-4 h-11 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-lime-400 transition-colors"
          placeholder="https://yourbusiness.com"
          value={url}
          autoComplete="off"
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleExtractClick(); }}
          data-testid="input-pnc-url"
        />
        <button
          type="button"
          className="h-11 px-5 bg-lime-400 hover:bg-lime-300 active:scale-[.98] text-black text-xs font-semibold rounded-xl transition-all disabled:bg-lime-900 disabled:text-lime-700 disabled:cursor-not-allowed whitespace-nowrap"
          onClick={handleExtractClick}
          disabled={v1Loading || v2Loading}
          data-testid="button-pnc-extract"
        >
          {tab === "v1" ? "Extract blocks \u2197" : "Analyze \u2197"}
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground/50">Works with any service business, agency, clinic, SaaS or local company</p>

      {/* Error */}
      {err && <div className="bg-red-950 border border-red-900 rounded-md px-3 py-2 text-[12px] text-red-400">{err}</div>}

      {/* Tab bar */}
      <div className="flex border-b border-border">
        {[
          { key: "v1", label: "Block Builder", desc: "Extract \u2192 curate chips \u2192 generate" },
          { key: "v2", label: "Auto Groups", desc: "URL \u2192 prompts grouped by service & customer" },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            className={`text-[12px] font-medium px-5 py-2.5 border-b-2 -mb-px transition-all text-left ${tab === t.key ? "text-lime-400 border-lime-400" : "text-muted-foreground border-transparent hover:text-foreground"}`}
            onClick={() => setTab(t.key as "v1" | "v2")}
            data-testid={`button-pnc-tab-${t.key}`}
          >
            {t.label}
            <span className="text-[10px] text-muted-foreground/40 font-mono block mt-0.5">{t.desc}</span>
          </button>
        ))}
      </div>

      {/* ══ TAB 1 — BLOCK BUILDER ══ */}
      {tab === "v1" && (
        <div>
          {v1Loading && (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-border border-t-lime-400 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[11px] text-muted-foreground font-mono">{v1LoaderMsg}</p>
            </div>
          )}

          {v1Loaded && !v1Loading && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {renderBlock(1)}
                {renderBlock(2)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {renderBlock(3)}
                {renderBlock(4)}
              </div>

              {/* Competitors */}
              {competitors.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono bg-violet-900/40 text-violet-300">5</span>
                    <span className="text-xs font-semibold tracking-wide">Top competitors</span>
                    <span className="ml-auto text-[10px] text-muted-foreground/40 font-mono">display only — not used in prompts yet</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {competitors.map((c, i) => (
                      <div key={i} className="bg-muted/20 border border-border rounded-md p-2.5">
                        <div className="text-[13px] font-medium mb-0.5">{c.name}</div>
                        <div className="text-[10px] font-mono text-muted-foreground mb-1.5">{c.location}</div>
                        <div className="text-[11px] text-muted-foreground">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40 block mb-0.5">Known for</span>
                          {c.known_for}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Location */}
              {renderLocationBlock(
                locMode, setLocMode, locCity, setLocCity, locCountry, setLocCountry,
                () => { if (v1Prompts.length) v1Generate(); }
              )}

              {/* Generate bar */}
              <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between flex-wrap gap-2.5">
                <div className="text-[12px] text-muted-foreground">
                  <strong className="text-foreground font-medium">{b1}</strong> business ·{" "}
                  <strong className="text-foreground font-medium">{b2}</strong> services ·{" "}
                  <strong className="text-foreground font-medium">{b3}</strong> customers{" "}
                  <span className={custToggle ? "text-lime-400" : "text-muted-foreground/40"}>{custToggle ? "(on)" : "(off)"}</span>{" "}
                  · <strong className="text-foreground font-medium">{b4}</strong> qualifiers ·{" "}
                  <strong className="text-foreground font-medium">{loc}</strong>
                </div>
                <button
                  type="button"
                  className="h-9 px-5 bg-lime-400 hover:bg-lime-300 active:scale-[.98] text-black text-xs font-semibold rounded-xl transition-all disabled:bg-lime-900 disabled:text-lime-700 disabled:cursor-not-allowed"
                  onClick={v1Generate}
                  disabled={v1Generating}
                  data-testid="button-pnc-v1-generate"
                >
                  Generate prompts ↗
                </button>
              </div>

              {/* Gen loader */}
              {v1Generating && (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-border border-t-lime-400 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-[11px] text-muted-foreground font-mono">{v1GenMsg}</p>
                </div>
              )}

              {/* Prompts output */}
              {v1Prompts.length > 0 && !v1Generating && (
                <div>
                  <div className="flex items-center justify-between flex-wrap gap-2.5 mb-3">
                    <span className="font-mono text-[11px] text-muted-foreground">{v1Prompts.length} prompts generated</span>
                    <button type="button" className="text-[11px] px-3.5 py-1 border border-border rounded-full text-muted-foreground hover:border-lime-400 hover:text-lime-400 transition-colors" onClick={(e) => cpText(v1Prompts.map((p) => p.text).join("\n"), e.currentTarget, "Copy all prompts")}>
                      Copy all prompts
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {v1Prompts.map((p, i) => renderPromptRow(p, i))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 2 — AUTO GROUPS ══ */}
      {tab === "v2" && (
        <div className="space-y-4">
          {renderLocationBlock(v2LocMode, setV2LocMode, v2LocCity, setV2LocCity, v2LocCountry, setV2LocCountry)}

          <div className="flex justify-end">
            <button
              type="button"
              className="h-9 px-5 bg-lime-400 hover:bg-lime-300 active:scale-[.98] text-black text-xs font-semibold rounded-xl transition-all disabled:bg-lime-900 disabled:text-lime-700 disabled:cursor-not-allowed"
              onClick={v2Generate}
              disabled={v2Loading}
              data-testid="button-pnc-v2-generate"
            >
              Generate grouped prompts ↗
            </button>
          </div>

          {v2Loading && (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-border border-t-lime-400 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[11px] text-muted-foreground font-mono">{v2LoaderMsg}</p>
            </div>
          )}

          {v2Result && !v2Loading && (
            <div>
              <div className="flex items-center justify-between flex-wrap gap-2.5 mb-4">
                <span className="font-mono text-[11px] text-muted-foreground">
                  {v2Result.business_name} · {v2Result.by_service.reduce((a, g) => a + g.prompts.length, 0)} prompts across {v2Result.by_service.length} services & {v2Result.by_customer.length} customer types
                </span>
                <button
                  type="button"
                  className="text-[11px] px-3.5 py-1 border border-border rounded-full text-muted-foreground hover:border-lime-400 hover:text-lime-400 transition-colors"
                  onClick={(e) => {
                    const all = [...v2Result.by_service.flatMap((g) => g.prompts), ...v2Result.by_customer.flatMap((g) => g.prompts)];
                    cpText(all.map((p) => p.text).join("\n"), e.currentTarget, "Copy all");
                  }}
                >
                  Copy all
                </button>
              </div>

              {/* View switcher */}
              <div className="flex gap-1.5 mb-5">
                {[{ key: "service", label: "By service type" }, { key: "customer", label: "By customer type" }].map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    className={`text-[12px] px-4 py-1 border rounded-full transition-all ${v2View === v.key ? "bg-lime-400/10 border-lime-400 text-lime-400" : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"}`}
                    onClick={() => setV2View(v.key as "service" | "customer")}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              {/* Service panel */}
              {v2View === "service" && (
                <div className="space-y-6">
                  {v2Result.by_service.map((g, gi) => (
                    <div key={gi}>
                      <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold tracking-widest uppercase font-mono text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                        {g.service}
                        <span className="flex-1 h-px bg-border ml-1" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {g.prompts.map((p, pi) => renderPromptRow(p, pi))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Customer panel */}
              {v2View === "customer" && (
                <div className="space-y-6">
                  {v2Result.by_customer.map((g, gi) => (
                    <div key={gi}>
                      <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold tracking-widest uppercase font-mono text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400 flex-shrink-0" />
                        {g.customer}
                        <span className="flex-1 h-px bg-border ml-1" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {g.prompts.map((p, pi) => renderPromptRow(p, pi))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ COST TRACKER ══ */}
      {costs.length > 0 && (
        <div className="mt-6 border-t border-border pt-4">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <span className="text-[10px] font-mono font-semibold tracking-widest uppercase text-muted-foreground/50">Session cost — claude-sonnet-4-5</span>
            <button
              type="button"
              className="text-[10px] px-2.5 py-0.5 border border-border rounded-full text-muted-foreground/40 hover:border-red-900 hover:text-red-400 transition-colors"
              onClick={() => setCosts([])}
            >
              Clear
            </button>
          </div>
          <div className="space-y-1.5">
            {costs.map((c, i) => (
              <div key={i} className="flex items-center gap-3 text-[11px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 flex-shrink-0" />
                <span className="flex-1 text-muted-foreground truncate">{c.label}</span>
                <span className="text-muted-foreground/50 tabular-nums">{c.input_tokens.toLocaleString()} in</span>
                <span className="text-muted-foreground/50 tabular-nums">{c.output_tokens.toLocaleString()} out</span>
                <span className="text-foreground/70 tabular-nums w-20 text-right">${c.cost_usd.toFixed(4)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <span className="text-[11px] font-mono text-muted-foreground/50">
              {costs.reduce((a, c) => a + c.input_tokens, 0).toLocaleString()} in ·{" "}
              {costs.reduce((a, c) => a + c.output_tokens, 0).toLocaleString()} out ·{" "}
              {costs.length} {costs.length === 1 ? "call" : "calls"}
            </span>
            <span className="text-[13px] font-mono font-semibold text-foreground tabular-nums">
              ${costs.reduce((a, c) => a + c.cost_usd, 0).toFixed(4)} total
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
