import { useState } from "react";
import { AggregateResponse } from "@shared/schema";
import { ScoreCircle } from "./ui/score-circle";
import { motion } from "framer-motion";
import { Check, X, Minus, ChevronDown, ChevronRight } from "lucide-react";

interface Props {
  data: AggregateResponse;
}

const ENGINE_DISPLAY: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
  deepseek: "DeepSeek",
};

function PresenceIndicator({ state }: { state: number }) {
  if (state === 2) return <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium"><Check className="w-3.5 h-3.5" /> Strong</span>;
  if (state === 1) return <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-sm font-medium"><Minus className="w-3.5 h-3.5" /> Weak</span>;
  return <span className="flex items-center gap-1.5 text-muted-foreground text-sm"><X className="w-3.5 h-3.5" /> Absent</span>;
}

function EngineRow({ engine, presence, position, rawText }: {
  engine: string;
  presence: number;
  position: number | null | undefined;
  rawText?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasRaw = rawText && rawText.length > 0;

  return (
    <div data-testid={`row-engine-${engine}`}>
      <button
        type="button"
        onClick={() => hasRaw && setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left ${hasRaw ? 'cursor-pointer' : 'cursor-default'}`}
        data-testid={`button-expand-${engine}`}
      >
        <div className="flex items-center gap-2">
          {hasRaw && (
            expanded
              ? <ChevronDown className="w-3 h-3 text-muted-foreground" />
              : <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">{ENGINE_DISPLAY[engine] || engine}</span>
        </div>
        <div className="flex items-center gap-4">
          {position !== null && position !== undefined && (
            <span className="text-xs text-muted-foreground tabular-nums">#{position}</span>
          )}
          <PresenceIndicator state={presence} />
        </div>
      </button>
      {expanded && rawText && (
        <div className="px-4 pb-3">
          <pre className="text-xs text-muted-foreground bg-secondary/50 rounded-md p-3 overflow-x-auto whitespace-pre-wrap font-[inherit] leading-relaxed max-h-64 overflow-y-auto" data-testid={`text-raw-${engine}`}>
            {rawText}
          </pre>
        </div>
      )}
    </div>
  );
}

export function AnalysisResults({ data }: Props) {
  const engines = Object.entries(data.perEngine.presenceByEngine);
  const rawResponses = data.perEngine.rawResponses || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-10 pb-12"
    >
      <div className="flex items-center justify-center gap-12 sm:gap-16 py-4" data-testid="section-scores">
        <ScoreCircle
          score={data.presenceScore}
          label="Presence"
          subLabel="Visibility across engines"
        />
        <ScoreCircle
          score={data.rankingScore}
          label="Ranking"
          subLabel="Position-weighted score"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Engine Breakdown</h3>
          <span className="text-xs text-muted-foreground">Click to view response</span>
        </div>
        <div className="border border-border rounded-md divide-y divide-border" data-testid="section-engines">
          {engines.map(([engine, presence], i) => (
            <motion.div
              key={engine}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.08 }}
            >
              <EngineRow
                engine={engine}
                presence={presence}
                position={data.perEngine.posByEngine[engine]}
                rawText={rawResponses[engine]}
              />
            </motion.div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Competitive Landscape</h3>
        <div className="border border-border rounded-md overflow-hidden" data-testid="section-leaderboard">
          <div className="grid grid-cols-[2rem_1fr_repeat(4,2.5rem)_3rem] gap-0 px-3 py-2 border-b border-border bg-secondary/30">
            <span className="text-[10px] text-muted-foreground font-medium">#</span>
            <span className="text-[10px] text-muted-foreground font-medium">Brand</span>
            {["GPT", "Gem", "Cld", "DS"].map((e) => (
              <span key={e} className="text-[10px] text-muted-foreground font-medium text-center">{e}</span>
            ))}
            <span className="text-[10px] text-muted-foreground font-medium text-right">Avg</span>
          </div>
          <div className="divide-y divide-border">
            {data.leaderboard.map((item, idx) => {
              const isTarget = item.name.toLowerCase().includes(data.brand.toLowerCase()) ||
                               data.brand.toLowerCase().includes(item.name.toLowerCase());
              const engineOrder = ["chatgpt", "gemini", "claude", "deepseek"];

              return (
                <div
                  key={idx}
                  className={`grid grid-cols-[2rem_1fr_repeat(4,2.5rem)_3rem] gap-0 px-3 py-2.5 items-center ${isTarget ? 'bg-foreground/[0.04]' : ''}`}
                  data-testid={`row-brand-${idx}`}
                >
                  <span className="text-xs text-muted-foreground tabular-nums">{idx + 1}</span>
                  <span className={`text-sm truncate pr-2 ${isTarget ? 'font-semibold' : ''}`}>
                    {item.name}
                  </span>
                  {engineOrder.map((eng) => {
                    const pos = item.engines?.[eng]?.position ?? null;
                    return (
                      <span
                        key={eng}
                        className={`text-xs tabular-nums text-center ${pos ? 'text-foreground' : 'text-muted-foreground/40'}`}
                      >
                        {pos ? `#${pos}` : "—"}
                      </span>
                    );
                  })}
                  <span className="text-xs tabular-nums text-right font-medium">
                    {item.avgRank != null ? `#${item.avgRank}` : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
