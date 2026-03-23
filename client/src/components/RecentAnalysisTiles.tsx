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

const G1_MAP: Record<string, string> = {
  "#6366f1": "#ede9fe",
  "#3b82f6": "#dbeafe",
  "#10b981": "#d1fae5",
  "#f59e0b": "#fef9c3",
  "#8b5cf6": "#ede9fe",
  "#ec4899": "#fce7f3",
  "#14b8a6": "#ccfbf1",
  "#f97316": "#ffedd5",
};

const G2_MAP: Record<string, string> = {
  "#6366f1": "#dbeafe",
  "#3b82f6": "#ede9fe",
  "#10b981": "#ecfdf5",
  "#f59e0b": "#fef3c7",
  "#8b5cf6": "#fce7f3",
  "#ec4899": "#ede9fe",
  "#14b8a6": "#d1fae5",
  "#f97316": "#fef9c3",
};

function accentFor(category: string): string {
  let hash = 0;
  for (const c of (category || "x").toLowerCase()) {
    hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  }
  return ACCENT_PALETTE[Math.abs(hash) % ACCENT_PALETTE.length];
}

function g1For(accent: string): string { return G1_MAP[accent] ?? "#ede9fe"; }
function g2For(accent: string): string { return G2_MAP[accent] ?? "#dbeafe"; }

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

// ── Skeleton tile ─────────────────────────────────────────────────────────────

function SkeletonTile() {
  return (
    <div style={{
      background: "linear-gradient(160deg, #ffffff 0%, #ede9fe33 100%)",
      border: "1px solid rgba(99,102,241,0.1)",
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 1px 8px rgba(99,102,241,0.08)",
      display: "flex",
    }}>
      <div style={{ width: 4, flexShrink: 0, background: "linear-gradient(180deg, rgba(99,102,241,0.3) 0%, rgba(99,102,241,0.08) 100%)" }} />
      <div style={{ padding: "12px 14px", flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
          <div style={{ height: 9, width: 110, background: "rgba(0,0,0,0.07)", borderRadius: 4 }} />
          <div style={{ height: 9, width: 36, background: "rgba(0,0,0,0.04)", borderRadius: 3 }} />
        </div>
        <div style={{ height: 13, width: "90%", background: "rgba(0,0,0,0.06)", borderRadius: 4, marginBottom: 5 }} />
        <div style={{ height: 13, width: "65%", background: "rgba(0,0,0,0.04)", borderRadius: 4, marginBottom: 12 }} />
        <div style={{ borderRadius: 9, padding: "8px 9px", background: "rgba(99,102,241,0.05)", border: "1.5px solid rgba(99,102,241,0.1)", marginBottom: 10 }}>
          <div style={{ height: 8, width: 55, background: "rgba(0,0,0,0.05)", borderRadius: 3, marginBottom: 6 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 30, height: 20, background: "rgba(0,0,0,0.06)", borderRadius: 4 }} />
            <div style={{ height: 12, flex: 1, background: "rgba(0,0,0,0.05)", borderRadius: 3 }} />
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: 7, marginBottom: 5 }}>
          <div style={{ height: 12, width: "70%", background: "rgba(0,0,0,0.04)", borderRadius: 3 }} />
        </div>
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: 7, marginBottom: 10 }}>
          <div style={{ height: 12, width: "55%", background: "rgba(0,0,0,0.04)", borderRadius: 3 }} />
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
  const g1 = g1For(accent);
  const g2 = g2For(accent);
  const displayBrand = tile.topBrand || tile.brandDomain || tile.brandName;

  return (
    <div
      data-testid={`card-directory-tile-${tile.id}`}
      style={{
        background: `linear-gradient(160deg, #ffffff 0%, ${g1}55 100%)`,
        border: `1px solid ${accent}18`,
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: `0 1px 8px ${accent}14`,
        display: "flex",
        transition: "box-shadow 0.18s, transform 0.15s",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = `0 6px 28px ${accent}28, 0 1px 6px ${accent}12`;
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = `0 1px 8px ${accent}14`;
        el.style.transform = "translateY(0)";
      }}
    >
      {/* Left accent bar */}
      <div style={{ width: 4, flexShrink: 0, background: `linear-gradient(180deg, ${accent} 0%, ${accent}33 100%)` }} />

      <div style={{ padding: "12px 13px", flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

        {/* Category + time */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: accent, flexShrink: 0 }} />
          <span style={{
            fontSize: 9.5, fontWeight: 700, letterSpacing: "0.07em",
            color: accent, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {tile.category.toUpperCase()}
          </span>
          <span style={{ color: "#9ca3af", fontSize: 9.5, marginLeft: "auto", flexShrink: 0 }}>
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

        {/* Rankings */}
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 10, flex: 1 }}>
          {[
            { rank: 1, name: displayBrand, share: tile.topScore, solid: true },
            ...tile.rivals.slice(0, 2).map((r, i) => ({ rank: i + 2, name: r.name, share: r.share, solid: false })),
          ].map(row => (
            row.solid ? (
              /* Winner gradient bubble */
              <div key={row.rank} style={{ position: "relative", marginBottom: 10 }}>
                <div style={{
                  background: `linear-gradient(135deg, ${accent}20 0%, ${g1}cc 60%, ${g2}88 100%)`,
                  border: `1.5px solid ${accent}35`,
                  borderRadius: 9, padding: "7px 9px",
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 6px ${accent}12`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: row.share > 0 ? 5 : 0 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800, color: "#fff",
                      background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                      borderRadius: 4, padding: "2px 6px", flexShrink: 0,
                      boxShadow: `0 1px 4px ${accent}50`,
                    }}>
                      #1
                    </span>
                    <span style={{ color: "#111827", fontSize: 12.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
                      {row.name}
                    </span>
                    {row.share > 0 && (
                      <span style={{
                        fontSize: 10.5, fontWeight: 800, flexShrink: 0, color: accent,
                        background: "rgba(255,255,255,0.7)", border: `1px solid ${accent}35`,
                        borderRadius: 20, padding: "2px 7px",
                      }}>
                        {row.share}%
                      </span>
                    )}
                  </div>
                  {row.share > 0 && (
                    <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.4)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 99, width: `${row.share}%`, background: `linear-gradient(90deg, ${accent}80, ${accent})`, boxShadow: `0 0 6px ${accent}60` }} />
                    </div>
                  )}
                </div>
                {/* Bubble pointer */}
                <div style={{ position: "absolute", bottom: -7, left: 18, width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderTop: `7px solid ${accent}35` }} />
                <div style={{ position: "absolute", bottom: -5, left: 19, width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: `6px solid ${g1}` }} />
              </div>
            ) : (
              /* #2 / #3 rows */
              <div key={row.rank} style={{ borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: row.share > 0 ? 4 : 0 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800, color: "#6b7280",
                    background: `linear-gradient(135deg, #f3f4f6, ${g1}66)`,
                    border: "1px solid #e5e7eb", borderRadius: 4, padding: "2px 6px", flexShrink: 0,
                  }}>
                    #{row.rank}
                  </span>
                  <span style={{ color: "#374151", fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
                    {row.name}
                  </span>
                  {row.share > 0 && (
                    <span style={{
                      fontSize: 10.5, fontWeight: 800, flexShrink: 0, color: accent,
                      background: `linear-gradient(135deg, ${accent}12, ${g1}80)`,
                      border: `1px solid ${accent}25`, borderRadius: 20, padding: "2px 7px",
                    }}>
                      {row.share}%
                    </span>
                  )}
                </div>
                {row.share > 0 && (
                  <div style={{ height: 3, borderRadius: 99, background: `linear-gradient(90deg, rgba(0,0,0,0.04), ${g1}88)`, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 99, width: `${row.share}%`, background: `linear-gradient(90deg, ${accent}70, ${accent}cc)` }} />
                  </div>
                )}
              </div>
            )
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onClick}
          data-testid={`button-view-analysis-${tile.id}`}
          style={{
            width: "100%", padding: "7px 0", borderRadius: 8,
            border: `1.5px solid ${accent}30`,
            background: `linear-gradient(135deg, ${accent}10, ${g1}66)`,
            color: accent, fontSize: 11, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 5, letterSpacing: "0.01em",
            transition: "background 0.15s, border-color 0.15s",
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = `linear-gradient(135deg, ${accent}1a, ${g1}99)`;
            el.style.borderColor = `${accent}55`;
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = `linear-gradient(135deg, ${accent}10, ${g1}66)`;
            el.style.borderColor = `${accent}30`;
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

      {/* Responsive grid */}
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
            {expanded ? "Show less ↑" : `Show ${hiddenCount} more analyses ↓`}
          </button>
        </div>
      )}
    </div>
  );
}
