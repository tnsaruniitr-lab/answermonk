import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DirectoryTile {
  id: number;
  sessionId: number;
  query: string;
  category: string;
  brandName: string;
  brandDomain: string | null;
  topBrand: string | null;
  topScore: number;
  rivals: { name: string; share: number }[];
  engines: { chatgpt: boolean; gemini: boolean; claude: boolean };
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ACCENT_PALETTE = [
  "#6366f1", "#3b82f6", "#10b981", "#f59e0b",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
];

function accentFor(category: string): string {
  let hash = 0;
  for (const c of (category || "x").toLowerCase()) {
    hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  }
  return ACCENT_PALETTE[Math.abs(hash) % ACCENT_PALETTE.length];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1d ago" : `${days}d ago`;
}

const ENGINES = [
  { key: "chatgpt" as const, short: "CHA", color: "#10b981" },
  { key: "gemini"  as const, short: "GEM", color: "#3b82f6" },
  { key: "claude"  as const, short: "CLA", color: "#f59e0b" },
];

// ── Score Ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, accent }: { score: number; accent: string }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const label = score === 0 ? "—" : `${score}`;
  return (
    <div style={{ position: "relative", width: 50, height: 50, flexShrink: 0 }}>
      <svg viewBox="0 0 50 50" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx="25" cy="25" r={r} fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
        {score > 0 && (
          <circle
            cx="25" cy="25" r={r} fill="none"
            stroke={accent} strokeWidth="3.5"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - score / 100)}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${accent}80)`, transition: "stroke-dashoffset 0.6s ease" }}
          />
        )}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: score > 0 ? accent : "#9ca3af", fontSize: score > 0 ? 13 : 17, fontWeight: 900, lineHeight: 1 }}>{label}</span>
        {score > 0 && <span style={{ color: "#9ca3af", fontSize: 7, fontWeight: 600, marginTop: 1 }}>/ 100</span>}
      </div>
    </div>
  );
}

// ── Skeleton tile ─────────────────────────────────────────────────────────────

function SkeletonTile() {
  return (
    <div style={{
      background: "rgba(255,255,255,0.88)",
      border: "1px solid rgba(0,0,0,0.07)",
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 2px 12px rgba(99,102,241,0.06), 0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div style={{ height: 3, background: "rgba(99,102,241,0.15)" }} />
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ height: 18, width: 90, background: "rgba(0,0,0,0.06)", borderRadius: 4 }} />
          <div style={{ height: 10, width: 40, background: "rgba(0,0,0,0.04)", borderRadius: 3 }} />
        </div>
        <div style={{ height: 13, width: "90%", background: "rgba(0,0,0,0.05)", borderRadius: 4, marginBottom: 5 }} />
        <div style={{ height: 13, width: "65%", background: "rgba(0,0,0,0.04)", borderRadius: 4, marginBottom: 10 }} />
        <div style={{ background: "rgba(0,0,0,0.025)", borderRadius: 10, padding: "9px 10px", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
            <div style={{ width: 50, height: 50, borderRadius: "50%", background: "rgba(0,0,0,0.06)", flexShrink: 0 }} />
            <div>
              <div style={{ height: 10, width: 80, background: "rgba(0,0,0,0.06)", borderRadius: 3, marginBottom: 5 }} />
              <div style={{ height: 9, width: 110, background: "rgba(0,0,0,0.04)", borderRadius: 3 }} />
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: 7, display: "flex", flexDirection: "column" as const, gap: 5 }}>
            <div style={{ height: 20, width: "75%", background: "rgba(0,0,0,0.04)", borderRadius: 4 }} />
            <div style={{ height: 20, width: "60%", background: "rgba(0,0,0,0.04)", borderRadius: 4 }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ flex: 1, height: 24, background: "rgba(0,0,0,0.04)", borderRadius: 6 }} />
          ))}
        </div>
        <div style={{ height: 30, background: "rgba(0,0,0,0.03)", borderRadius: 8 }} />
      </div>
    </div>
  );
}

// ── Tile card ─────────────────────────────────────────────────────────────────

function Tile({ tile, onClick }: { tile: DirectoryTile; onClick: () => void }) {
  const accent = accentFor(tile.category);
  const displayBrand = tile.topBrand || tile.brandDomain || tile.brandName;

  return (
    <div
      data-testid={`card-directory-tile-${tile.id}`}
      style={{
        background: "rgba(255,255,255,0.88)",
        border: "1px solid rgba(0,0,0,0.07)",
        backdropFilter: "blur(12px)",
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: "0 2px 12px rgba(99,102,241,0.06), 0 1px 3px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.2s, border-color 0.2s",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = `0 4px 24px ${accent}20, 0 1px 6px rgba(0,0,0,0.06)`;
        el.style.borderColor = `${accent}40`;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = "0 2px 12px rgba(99,102,241,0.06), 0 1px 3px rgba(0,0,0,0.04)";
        el.style.borderColor = "rgba(0,0,0,0.07)";
      }}
    >
      {/* Top accent stripe */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}44)`, flexShrink: 0 }} />

      <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Category + time */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
            color: accent, background: `${accent}14`,
            padding: "2px 8px", borderRadius: 4,
            maxWidth: 135, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {tile.category.toUpperCase()}
          </span>
          <span style={{ color: "#9ca3af", fontSize: 10, flexShrink: 0 }}>
            {timeAgo(tile.createdAt)}
          </span>
        </div>

        {/* Query headline */}
        <p style={{
          color: "#111827", fontSize: 13, fontWeight: 700,
          margin: "0 0 10px", lineHeight: 1.35,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        } as React.CSSProperties}>
          {tile.query.replace(/^best\s+/i, "")}
        </p>

        {/* Rankings block */}
        <div style={{
          background: "rgba(0,0,0,0.025)", borderRadius: 10,
          padding: "9px 10px", marginBottom: 10, flex: 1,
        }}>
          {/* All rankings — unified row format */}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {[{ rank: 1, name: displayBrand, share: tile.topScore, solid: true }, ...tile.rivals.slice(0, 2).map((r, i) => ({ rank: i + 2, name: r.name, share: r.share, solid: false }))].map((row, i) => (
              <div key={row.rank} style={{ borderTop: i > 0 ? "1px solid rgba(0,0,0,0.05)" : "none", paddingTop: i > 0 ? 6 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: row.share > 0 ? 4 : 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: row.solid ? "#fff" : "#6b7280", background: row.solid ? accent : "#f3f4f6", border: row.solid ? "none" : "1px solid #e5e7eb", borderRadius: 4, padding: "2px 6px", flexShrink: 0 }}>
                    #{row.rank}
                  </span>
                  <span style={{ color: "#111827", fontSize: 12.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
                    {row.name}
                  </span>
                  {row.share > 0 && (
                    <span style={{ fontSize: 10.5, fontWeight: 800, flexShrink: 0, color: accent, background: `${accent}15`, border: `1px solid ${accent}30`, borderRadius: 20, padding: "2px 7px" }}>
                      {row.share}%
                    </span>
                  )}
                </div>
                {row.share > 0 && (
                  <div style={{ height: 3, borderRadius: 99, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 99, width: `${row.share}%`, background: `linear-gradient(90deg, ${accent}88, ${accent})` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Engine badges — always visible, fixed per-engine colors */}
        <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
          {ENGINES.map(e => {
            const on = tile.engines[e.key];
            return (
              <div key={e.key} style={{
                flex: 1, height: 24, borderRadius: 6,
                background: on ? `${e.color}12` : "#f3f4f6",
                border: `1.5px solid ${on ? e.color + "50" : "#e5e7eb"}`,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: on ? e.color : "#d1d5db" }} />
                <span style={{ color: on ? e.color : "#9ca3af", fontSize: 9, fontWeight: 700, letterSpacing: "0.04em" }}>
                  {e.short}
                </span>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <button
          onClick={onClick}
          data-testid={`button-view-analysis-${tile.id}`}
          style={{
            width: "100%", padding: "7px 0", borderRadius: 8,
            border: `1.5px solid ${accent}33`,
            background: `${accent}08`,
            color: accent, fontSize: 11, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 5, letterSpacing: "0.01em",
            transition: "background 0.15s, border-color 0.15s",
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = `${accent}14`;
            el.style.borderColor = `${accent}55`;
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = `${accent}08`;
            el.style.borderColor = `${accent}33`;
          }}
        >
          View full analysis
          <span style={{ fontSize: 13, lineHeight: 1 }}>→</span>
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const INITIAL_COUNT = 6;

interface RecentAnalysisTilesProps {
  onSelect?: (sessionId: number) => void;
}

export function RecentAnalysisTiles({ onSelect }: RecentAnalysisTilesProps) {
  const [, navigate] = useLocation();
  const [expanded, setExpanded] = useState(false);

  const { data: tiles = [], isLoading } = useQuery<DirectoryTile[]>({
    queryKey: ["/api/directory/recent"],
    staleTime: 60_000,
  });

  const visible = expanded ? tiles : tiles.slice(0, INITIAL_COUNT);
  const hiddenCount = tiles.length - INITIAL_COUNT;

  if (!isLoading && tiles.length === 0) return null;

  function handleTileClick(tile: DirectoryTile) {
    if (onSelect) {
      onSelect(tile.sessionId);
    } else {
      navigate(`/v2/${tile.sessionId}`);
    }
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", marginTop: 56 }}>
      {/* Section header */}
      <div style={{ textAlign: "center", marginBottom: 24, position: "relative" }}>
        {!isLoading && tiles.length > INITIAL_COUNT && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            data-testid="button-directory-view-all"
            style={{
              position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
              color: "#6366f1", fontSize: 12, fontWeight: 600,
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 8, padding: "5px 14px", cursor: "pointer",
            }}
          >
            View all {tiles.length}
          </button>
        )}
      </div>

      {/* Responsive grid — 3-col desktop, 2-col tablet, 1-col mobile */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
        {isLoading
          ? Array.from({ length: INITIAL_COUNT }, (_, i) => <SkeletonTile key={i} />)
          : visible.map(tile => (
              <Tile
                key={tile.id}
                tile={tile}
                onClick={() => handleTileClick(tile)}
              />
            ))}
      </div>

      {/* Expand / collapse */}
      {!isLoading && tiles.length > INITIAL_COUNT && (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            onClick={() => setExpanded(x => !x)}
            data-testid="button-directory-expand"
            style={{
              background: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(99,102,241,0.2)",
              color: "#6b7280", fontSize: 12,
              padding: "9px 28px", borderRadius: 10, cursor: "pointer",
            }}
          >
            {expanded
              ? "Show less ↑"
              : `Show ${hiddenCount} more analyses ↓`}
          </button>
        </div>
      )}
    </div>
  );
}
