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
  "#3b82f6", "#6366f1", "#10b981", "#f59e0b",
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
  { key: "chatgpt" as const, label: "ChatGPT", color: "#10b981" },
  { key: "gemini"  as const, label: "Gemini",  color: "#3b82f6" },
  { key: "claude"  as const, label: "Claude",  color: "#f59e0b" },
];

// ── Score Ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, accent }: { score: number; accent: string }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
      <svg viewBox="0 0 48 48" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx="24" cy="24" r={r} fill="none" stroke="#0a1628" strokeWidth="4" />
        <circle
          cx="24" cy="24" r={r} fill="none"
          stroke={accent} strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - score / 100)}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${accent})`, transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: accent, fontSize: 11, fontWeight: 800, lineHeight: 1 }}>{score}</span>
      </div>
    </div>
  );
}

// ── Skeleton tile ─────────────────────────────────────────────────────────────

function SkeletonTile() {
  return (
    <div style={{ background: "#060f1e", border: "1px solid #1e3a5f", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ height: 3, background: "#1e3a5f" }} />
      <div style={{ padding: "16px 18px" }}>
        <div style={{ height: 10, width: 60, background: "#1e3a5f", borderRadius: 4, marginBottom: 12 }} />
        <div style={{ height: 14, width: "85%", background: "#0f1e35", borderRadius: 4, marginBottom: 6 }} />
        <div style={{ height: 14, width: "65%", background: "#0f1e35", borderRadius: 4, marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#1e3a5f" }} />
          <div>
            <div style={{ height: 11, width: 80, background: "#1e3a5f", borderRadius: 3, marginBottom: 6 }} />
            <div style={{ height: 9,  width: 55, background: "#0f1e35", borderRadius: 3 }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ flex: 1, height: 24, background: "#0f1e35", borderRadius: 5 }} />
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
        background: "#060f1e",
        border: "1px solid #1e3a5f",
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = `${accent}55`;
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 20px ${accent}18`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "#1e3a5f";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Accent top bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}44)` }} />

      <div style={{ padding: "16px 18px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 1,
            color: accent, background: `${accent}15`,
            padding: "2px 8px", borderRadius: 4,
            maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {tile.category.toUpperCase()}
          </span>
          <span style={{ color: "#1e3a5f", fontSize: 9, flexShrink: 0, marginLeft: 8 }}>
            {timeAgo(tile.createdAt)}
          </span>
        </div>

        {/* Query headline */}
        <p style={{
          color: "#e2e8f0", fontSize: 13, fontWeight: 700,
          margin: "0 0 14px", lineHeight: 1.35,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {tile.query}
        </p>

        {/* Score ring + top brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <ScoreRing score={tile.topScore} accent={accent} />
          <div style={{ minWidth: 0 }}>
            <div style={{
              color: tile.topBrand ? "#94a3b8" : "#334155",
              fontSize: 11, fontFamily: "monospace",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {tile.topBrand || tile.brandDomain || tile.brandName}
            </div>
            <div style={{ color: "#334155", fontSize: 10, marginTop: 2 }}>Top ranked</div>
          </div>
        </div>

        {/* Rivals */}
        {tile.rivals.length > 0 && (
          <div style={{ display: "flex", gap: 5, marginBottom: 14, flexWrap: "wrap" }}>
            {tile.rivals.map((r, i) => (
              <span key={r} style={{
                fontSize: 9, color: "#475569",
                background: "#0a1628", border: "1px solid #1e3a5f",
                borderRadius: 4, padding: "2px 7px", fontFamily: "monospace",
                overflow: "hidden", textOverflow: "ellipsis", maxWidth: 100, whiteSpace: "nowrap",
              }}>
                #{i + 2} {r}
              </span>
            ))}
          </div>
        )}
        {tile.rivals.length === 0 && <div style={{ marginBottom: 14 }} />}

        {/* Engine badges */}
        <div style={{ display: "flex", gap: 6 }}>
          {ENGINES.map(e => (
            <div key={e.key} style={{
              flex: 1, height: 24, borderRadius: 5,
              background: tile.engines[e.key] ? `${e.color}15` : "#0a1628",
              border: `1px solid ${tile.engines[e.key] ? e.color + "33" : "#0f1e35"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: tile.engines[e.key] ? 1 : 0.4,
            }}>
              <span style={{
                color: tile.engines[e.key] ? e.color : "#334155",
                fontSize: 8, fontWeight: 600,
              }}>
                {e.label.slice(0, 3).toUpperCase()}
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
        <div>
          <h2 style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>
            Recent Analyses
          </h2>
          <p style={{ color: "#475569", fontSize: 12, margin: 0 }}>
            Live rankings across every category — updated as analyses complete
          </p>
        </div>
        {!isLoading && tiles.length > INITIAL_COUNT && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            data-testid="button-directory-view-all"
            style={{
              color: "#3b82f6", fontSize: 12, background: "none",
              border: "1px solid #1e3a5f", borderRadius: 7,
              padding: "5px 12px", cursor: "pointer", flexShrink: 0,
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
              background: "linear-gradient(135deg, #0f172a, #1e293b)",
              border: "1px solid #334155",
              color: "#64748b", fontSize: 12,
              padding: "10px 32px", borderRadius: 10, cursor: "pointer",
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
