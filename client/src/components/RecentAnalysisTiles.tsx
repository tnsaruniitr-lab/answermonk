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
  rivals: string[];
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
  { key: "chatgpt" as const, short: "CHA" },
  { key: "gemini"  as const, short: "GEM" },
  { key: "claude"  as const, short: "CLA" },
];

// ── Score Ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, accent }: { score: number; accent: string }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
      <svg viewBox="0 0 44 44" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="3.5" />
        <circle
          cx="22" cy="22" r={r} fill="none"
          stroke={accent} strokeWidth="3.5"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - score / 100)}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${accent}80)`, transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: accent, fontSize: 12, fontWeight: 900, lineHeight: 1 }}>{score}</span>
      </div>
    </div>
  );
}

// ── Skeleton tile ─────────────────────────────────────────────────────────────

function SkeletonTile() {
  return (
    <div style={{
      background: "rgba(255,255,255,0.7)",
      border: "1px solid rgba(255,255,255,0.9)",
      backdropFilter: "blur(12px)",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 2px 16px rgba(99,102,241,0.07), 0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div style={{ height: 3, background: "rgba(99,102,241,0.15)" }} />
      <div style={{ padding: "14px 16px" }}>
        <div style={{ height: 9, width: 70, background: "rgba(0,0,0,0.06)", borderRadius: 4, marginBottom: 10 }} />
        <div style={{ height: 13, width: "85%", background: "rgba(0,0,0,0.05)", borderRadius: 4, marginBottom: 5 }} />
        <div style={{ height: 13, width: "60%", background: "rgba(0,0,0,0.04)", borderRadius: 4, marginBottom: 14 }} />
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(0,0,0,0.06)" }} />
          <div>
            <div style={{ height: 10, width: 80, background: "rgba(0,0,0,0.06)", borderRadius: 3, marginBottom: 5 }} />
            <div style={{ height: 9, width: 55, background: "rgba(0,0,0,0.04)", borderRadius: 3 }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
          {[70, 55].map((w, i) => (
            <div key={i} style={{ height: 18, width: w, background: "rgba(0,0,0,0.04)", borderRadius: 4 }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ flex: 1, height: 22, background: "rgba(0,0,0,0.04)", borderRadius: 5 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tile card ─────────────────────────────────────────────────────────────────

function Tile({ tile, onClick }: { tile: DirectoryTile; onClick: () => void }) {
  const accent = accentFor(tile.category);
  return (
    <div
      onClick={onClick}
      data-testid={`card-directory-tile-${tile.id}`}
      style={{
        background: "rgba(255,255,255,0.75)",
        border: "1px solid rgba(255,255,255,0.9)",
        backdropFilter: "blur(12px)",
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: "0 2px 16px rgba(99,102,241,0.07), 0 1px 3px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.2s, border-color 0.2s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 24px ${accent}1e, 0 1px 3px rgba(0,0,0,0.06)`;
        (e.currentTarget as HTMLDivElement).style.borderColor = `${accent}44`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 16px rgba(99,102,241,0.07), 0 1px 3px rgba(0,0,0,0.04)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.9)";
      }}
    >
      {/* Accent top bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}44)` }} />

      <div style={{ padding: "14px 16px" }}>
        {/* Category + time */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
            color: accent, background: `${accent}14`,
            padding: "3px 8px", borderRadius: 5,
            maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {tile.category.toUpperCase()}
          </span>
          <span style={{ color: "#9ca3af", fontSize: 10, flexShrink: 0, marginLeft: 6 }}>
            {timeAgo(tile.createdAt)}
          </span>
        </div>

        {/* Query headline */}
        <p style={{
          color: "#111827", fontSize: 14, fontWeight: 700,
          margin: "0 0 12px", lineHeight: 1.4,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        } as React.CSSProperties}>
          {tile.query.replace(/^best\s+/i, "")}
        </p>

        {/* Score ring + top brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <ScoreRing score={tile.topScore} accent={accent} />
          <div style={{ minWidth: 0 }}>
            <div style={{
              color: "#111827", fontSize: 13, fontWeight: 700,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {tile.topBrand || tile.brandDomain || tile.brandName}
            </div>
            <div style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>Top ranked</div>
          </div>
        </div>

        {/* Rivals */}
        {tile.rivals.length > 0 && (
          <div style={{ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap" }}>
            {tile.rivals.map((r, i) => (
              <span key={r} style={{
                fontSize: 10, color: "#4b5563",
                background: "rgba(0,0,0,0.05)",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 4, padding: "2px 8px",
                overflow: "hidden", textOverflow: "ellipsis", maxWidth: 110, whiteSpace: "nowrap",
              }}>
                #{i + 2} {r}
              </span>
            ))}
          </div>
        )}
        {tile.rivals.length === 0 && <div style={{ marginBottom: 10 }} />}

        {/* Engine badges */}
        <div style={{ display: "flex", gap: 5 }}>
          {ENGINES.map(e => (
            <div key={e.key} style={{
              flex: 1, height: 24, borderRadius: 6,
              background: tile.engines[e.key] ? `${accent}14` : "rgba(0,0,0,0.03)",
              border: `1px solid ${tile.engines[e.key] ? accent + "40" : "rgba(0,0,0,0.07)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: tile.engines[e.key] ? 1 : 0.35,
            }}>
              <span style={{
                color: tile.engines[e.key] ? accent : "#9ca3af",
                fontSize: 9, fontWeight: 700, letterSpacing: "0.04em",
              }}>
                {e.short}
              </span>
            </div>
          ))}
        </div>
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

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", marginTop: 56 }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ color: "#1e1b4b", fontSize: 16, fontWeight: 700, margin: 0 }}>
          Recent reports on most cited businesses
        </h2>
        {!isLoading && tiles.length > INITIAL_COUNT && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            data-testid="button-directory-view-all"
            style={{
              color: "#6366f1", fontSize: 12, fontWeight: 600,
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 8, padding: "5px 14px", cursor: "pointer", flexShrink: 0,
            }}
          >
            View all {tiles.length}
          </button>
        )}
      </div>

      {/* 3-column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {isLoading
          ? Array.from({ length: INITIAL_COUNT }, (_, i) => <SkeletonTile key={i} />)
          : visible.map(tile => (
              <Tile
                key={tile.id}
                tile={tile}
                onClick={() => onSelect ? onSelect(tile.sessionId) : navigate(`/v2/${tile.sessionId}`)}
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
              background: "rgba(255,255,255,0.7)",
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
