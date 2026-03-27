import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Fuse from "fuse.js";

function toReportSlug(text: string, id: number): string {
  const base = (text || String(id))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base}-${id}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface DirectoryTile {
  id: number;
  sessionId: number;
  slug: string | null;
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

interface SearchIndexEntry {
  id: number;
  slug: string | null;
  category: string;
  query: string;
  ownBrand: string;
  domain: string;
  domainRoot: string;
  topBrands: string[];
  otherBrands: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
      background: "#fff",
      border: "1px solid rgba(99,102,241,0.12)",
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 2px 16px rgba(55,48,163,0.08)",
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{
        background: "linear-gradient(110deg, #3730a3 0%, #4f46e5 50%, #6d28d9 100%)",
        padding: "11px 14px 10px",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
          <div>
            <div style={{ height: 12, width: 130, background: "rgba(255,255,255,0.25)", borderRadius: 4, marginBottom: 5 }} />
            <div style={{ height: 9, width: 60, background: "rgba(255,255,255,0.15)", borderRadius: 3 }} />
          </div>
          <div style={{ height: 9, width: 32, background: "rgba(255,255,255,0.15)", borderRadius: 3, marginTop: 2 }} />
        </div>
      </div>
      <div style={{ padding: "10px 14px 6px" }}>
        <div style={{ background: "linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%)", border: "1px solid rgba(99,102,241,0.12)", borderRadius: 9, padding: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 28, height: 18, background: "rgba(99,102,241,0.2)", borderRadius: 4 }} />
            <div style={{ height: 12, flex: 1, background: "rgba(0,0,0,0.07)", borderRadius: 3 }} />
            <div style={{ height: 20, width: 40, background: "rgba(255,255,255,0.6)", borderRadius: 20 }} />
          </div>
          <div style={{ height: 3, background: "rgba(99,102,241,0.12)", borderRadius: 2, marginTop: 10 }} />
        </div>
      </div>
      <div style={{ padding: "4px 14px 10px", flex: 1 }}>
        {[1, 2].map(i => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 0", borderBottom: i === 1 ? "1px solid rgba(99,102,241,0.07)" : "none" }}>
            <div style={{ width: 16, height: 10, background: "rgba(0,0,0,0.05)", borderRadius: 3 }} />
            <div style={{ height: 11, flex: 1, background: "rgba(0,0,0,0.05)", borderRadius: 3 }} />
            <div style={{ height: 11, width: 28, background: "rgba(0,0,0,0.04)", borderRadius: 3 }} />
          </div>
        ))}
      </div>
      <div style={{ padding: "0 14px 12px" }}>
        <div style={{ height: 30, background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.1)", borderRadius: 8 }} />
      </div>
    </div>
  );
}

// ── Tile card ─────────────────────────────────────────────────────────────────

function Tile({ tile, onClick }: { tile: DirectoryTile; onClick: () => void }) {
  const displayBrand = tile.topBrand || tile.brandDomain || tile.brandName;

  // Parse location from query (text after " in ")
  const queryLabel = tile.query.replace(/^best\s+/i, "");
  const inIdx = queryLabel.lastIndexOf(" in ");
  const location = inIdx > 0 ? queryLabel.slice(inIdx + 4) : "";

  return (
    <div
      data-testid={`card-directory-tile-${tile.id}`}
      style={{
        background: "#fff",
        border: "1px solid rgba(99,102,241,0.12)",
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: "0 2px 16px rgba(55,48,163,0.08)",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.18s, transform 0.15s",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = "0 6px 28px rgba(55,48,163,0.18), 0 1px 6px rgba(99,102,241,0.1)";
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = "0 2px 16px rgba(55,48,163,0.08)";
        el.style.transform = "translateY(0)";
      }}
      onClick={onClick}
    >
      {/* Deep indigo header band */}
      <div style={{
        background: "linear-gradient(110deg, #3730a3 0%, #4f46e5 50%, #6d28d9 100%)",
        padding: "11px 14px 10px",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: 12.5, fontWeight: 700, color: "#fff", lineHeight: 1.3,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              textAlign: "left",
            }}>
              {tile.category}
            </div>
            {location && (
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.88)", marginTop: 3, textAlign: "left" }}>{location}</div>
            )}
          </div>
          <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.5)", flexShrink: 0, marginTop: 1 }}>
            {timeAgo(tile.createdAt)}
          </span>
        </div>
      </div>

      {/* Winner bubble */}
      <div style={{ padding: "10px 14px 6px" }}>
        <div style={{
          background: "linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%)",
          border: "1px solid rgba(99,102,241,0.18)",
          borderRadius: 9,
          padding: "8px 10px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{
              fontSize: 9, fontWeight: 800, color: "#fff",
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              borderRadius: 4, padding: "2px 6px", flexShrink: 0,
            }}>
              #1
            </span>
            <span style={{
              flex: 1, fontSize: 13, fontWeight: 700, color: "#1e1b4b",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {displayBrand}
            </span>
            <span style={{
              fontSize: 13, fontWeight: 800,
              color: "#4f46e5",
              background: "rgba(255,255,255,0.85)", border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 20, padding: "1px 8px", flexShrink: 0,
            }}>
              {tile.topScore}%
            </span>
          </div>
          <div style={{ height: 3, background: "rgba(99,102,241,0.15)", borderRadius: 2, marginTop: 8 }}>
            <div style={{ height: "100%", width: `${tile.topScore}%`, background: "linear-gradient(90deg, #4f46e5, #6d28d9)", borderRadius: 2 }} />
          </div>
        </div>
      </div>

      {/* #2 / #3 challengers */}
      <div style={{ padding: "4px 14px 10px", flex: 1 }}>
        {tile.rivals.slice(0, 2).map((r, i) => (
          <div
            key={r.name}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 0",
              borderBottom: i === 0 ? "1px solid rgba(99,102,241,0.07)" : "none",
            }}
          >
            <span style={{
              fontSize: 10, fontWeight: 700, color: "#4f46e5",
              background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.18)",
              borderRadius: 4, padding: "1px 5px", flexShrink: 0,
            }}>
              #{i + 2}
            </span>
            <span style={{
              flex: 1, fontSize: 12.5, color: "#111827", fontWeight: 600,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              textAlign: "left",
            }}>
              {r.name}
            </span>
            {r.share > 0 && (
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#374151", flexShrink: 0 }}>
                {r.share}%
              </span>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: "0 14px 12px" }}>
        <button
          data-testid={`button-view-analysis-${tile.id}`}
          onClick={e => { e.stopPropagation(); onClick(); }}
          style={{
            width: "100%", padding: "7px 0", borderRadius: 8,
            border: "1px solid rgba(99,102,241,0.18)",
            background: "rgba(99,102,241,0.06)",
            color: "#4f46e5", fontSize: 12, fontWeight: 600,
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 5,
            transition: "background 0.15s, border-color 0.15s",
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = "rgba(99,102,241,0.12)";
            el.style.borderColor = "rgba(99,102,241,0.3)";
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = "rgba(99,102,241,0.06)";
            el.style.borderColor = "rgba(99,102,241,0.18)";
          }}
        >
          View full analysis →
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const INITIAL_COUNT = 6;

const FUSE_OPTIONS: Fuse.IFuseOptions<SearchIndexEntry> = {
  keys: [
    { name: "category",    weight: 0.30 },
    { name: "query",       weight: 0.20 },
    { name: "ownBrand",    weight: 0.20 },
    { name: "domainRoot",  weight: 0.15 },
    { name: "domain",      weight: 0.10 },
    { name: "topBrands",   weight: 0.04 },
    { name: "otherBrands", weight: 0.01 },
  ],
  threshold: 0.35,
  includeScore: false,
  minMatchCharLength: 2,
};

interface RecentAnalysisTilesProps {
  onSelect?: (sessionId: number, tile: DirectoryTile) => void;
}

export function RecentAnalysisTiles({ onSelect }: RecentAnalysisTilesProps) {
  const [, navigate] = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchIndex, setSearchIndex] = useState<SearchIndexEntry[]>([]);
  const [indexReady, setIndexReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: tiles = [], isLoading } = useQuery<DirectoryTile[]>({
    queryKey: ["/api/directory/recent"],
    staleTime: 60_000,
  });

  // Deferred background fetch — starts after tiles render
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      fetch("/api/directory/search-index")
        .then(r => r.json())
        .then((data: SearchIndexEntry[]) => {
          if (!cancelled) {
            setSearchIndex(Array.isArray(data) ? data : []);
            setIndexReady(true);
          }
        })
        .catch(() => { if (!cancelled) setIndexReady(true); });
    }, 800);
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  const fuse = useMemo(
    () => indexReady ? new Fuse(searchIndex, FUSE_OPTIONS) : null,
    [searchIndex, indexReady],
  );

  const matchedOrder = useMemo<Map<number, number> | null>(() => {
    const q = searchQuery.trim();
    if (!q || !fuse) return null;
    const results = fuse.search(q);
    const order = new Map<number, number>();
    results.forEach((r, i) => order.set(r.item.id, i));
    return order;
  }, [searchQuery, fuse]);

  const visible = useMemo(() => {
    if (matchedOrder !== null) {
      return tiles
        .filter(t => matchedOrder.has(t.id))
        .sort((a, b) => (matchedOrder.get(a.id) ?? 999) - (matchedOrder.get(b.id) ?? 999));
    }
    return expanded ? tiles : tiles.slice(0, INITIAL_COUNT);
  }, [tiles, matchedOrder, expanded]);

  const extraIndexMatches = useMemo(() => {
    if (!matchedOrder || !fuse) return [];
    const tileIdSet = new Set(tiles.map(t => t.id));
    const q = searchQuery.trim();
    if (!q) return [];
    return fuse.search(q)
      .filter(r => !tileIdSet.has(r.item.id))
      .map(r => r.item);
  }, [matchedOrder, fuse, tiles, searchQuery]);

  const hiddenCount = tiles.length - INITIAL_COUNT;
  const isSearching = searchQuery.trim().length > 0;
  const totalResults = visible.length + extraIndexMatches.length;

  if (!isLoading && tiles.length === 0) return null;

  function handleTileClick(tile: DirectoryTile) {
    if (onSelect) {
      onSelect(tile.sessionId, tile);
      return;
    }
    const path = tile.slug
      ? `/reports/${tile.slug}`
      : `/reports/${toReportSlug(tile.query || tile.category, tile.sessionId)}`;
    navigate(path);
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", marginTop: 56 }}>

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontSize: 13, fontWeight: 800, color: "#1e1b4b",
            background: "rgba(55,48,163,0.08)", border: "1px solid rgba(55,48,163,0.16)",
            borderRadius: 20, padding: "5px 13px",
            whiteSpace: "nowrap", flexShrink: 0,
          }}>
            Top cited companies by AI
          </span>
          {indexReady && searchIndex.length > 0 && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: 12, fontWeight: 600, color: "#4f46e5",
              background: "rgba(99,102,241,0.07)",
              border: "1px solid rgba(99,102,241,0.18)",
              borderRadius: 20, padding: "5px 12px",
              whiteSpace: "nowrap", flexShrink: 0,
            }}>
              <span style={{ color: "#6366f1", fontWeight: 800, fontSize: 11 }}>✓</span>
              {searchIndex.length.toLocaleString()} audits completed
            </span>
          )}

          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "rgba(255,255,255,0.85)",
            border: `1px solid ${isSearching ? "rgba(99,102,241,0.4)" : "rgba(0,0,0,0.1)"}`,
            borderRadius: 20, padding: "5px 12px",
            boxShadow: isSearching ? "0 0 0 3px rgba(99,102,241,0.1)" : "0 1px 4px rgba(0,0,0,0.06)",
            transition: "border-color 0.15s, box-shadow 0.15s",
            backdropFilter: "blur(8px)",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={isSearching ? "#6366f1" : "#9ca3af"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              ref={inputRef}
              data-testid="input-search-directory"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={indexReady ? "Search category or brand…" : "Loading search…"}
              disabled={!indexReady}
              style={{
                border: "none", outline: "none", background: "transparent",
                fontSize: 12, color: "#111827", width: 180,
                fontFamily: "system-ui, sans-serif",
              }}
            />
            {isSearching && (
              <button
                onClick={() => setSearchQuery("")}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#9ca3af", fontSize: 14, lineHeight: 1 }}
              >×</button>
            )}
          </div>

          {isSearching && (
            <span style={{ fontSize: 11, color: "#6b7280" }}>
              {totalResults === 0 ? "No results" : `${totalResults} result${totalResults === 1 ? "" : "s"}`}
            </span>
          )}
        </div>

        {!isLoading && tiles.length > INITIAL_COUNT && !expanded && !isSearching && (
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
            View all
          </button>
        )}
      </div>

      {/* Grid */}
      <div
        style={expanded && !isSearching ? {
          maxHeight: 520,
          overflowY: "auto",
          overflowX: "hidden",
          borderRadius: 12,
          paddingRight: 4,
        } : undefined}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
          {isLoading
            ? Array.from({ length: INITIAL_COUNT }, (_, i) => <SkeletonTile key={i} />)
            : totalResults === 0 && isSearching
              ? (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>No analyses found</div>
                  <div style={{ fontSize: 12 }}>Try a different brand name or category</div>
                </div>
              )
              : visible.map(tile => (
                <Tile
                  key={tile.id}
                  tile={tile}
                  onClick={() => handleTileClick(tile)}
                />
              ))}
        </div>
      </div>

      {/* Extra search results */}
      {isSearching && extraIndexMatches.length > 0 && (
        <div style={{ marginTop: visible.length > 0 ? 16 : 0 }}>
          {visible.length > 0 && (
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
              More matching analyses
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {extraIndexMatches.map(entry => (
              <button
                key={entry.id}
                onClick={() => navigate(entry.slug ? `/reports/${entry.slug}` : `/reports/${toReportSlug(entry.category || entry.ownBrand, entry.id)}`)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "rgba(255,255,255,0.85)", border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 10, padding: "10px 14px", cursor: "pointer",
                  textAlign: "left", width: "100%",
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                    {entry.category || entry.query}
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                    {entry.ownBrand} · {entry.domain}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: "#6366f1", fontWeight: 600, flexShrink: 0 }}>View →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Collapse button */}
      {expanded && !isSearching && (
        <button
          onClick={() => setExpanded(false)}
          style={{
            display: "block", margin: "16px auto 0",
            fontSize: 12, fontWeight: 600, color: "#6b7280",
            background: "none", border: "none", cursor: "pointer", padding: "4px 8px",
          }}
        >
          Show less ↑
        </button>
      )}
    </div>
  );
}
