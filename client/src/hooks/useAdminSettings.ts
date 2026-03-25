import { useState, useCallback, useEffect, useRef } from "react";

export interface AdminSettings {
  engines: {
    chatgpt: boolean;
    gemini: boolean;
    claude: boolean;
    deepseek: boolean;
  };
  useHeuristicClassification: boolean;
  showDevRerunButton: boolean;
  maxServices: number;
  maxCustomers: number;
  citationAnalysisMode: "url_rows" | "domain_aggregated";
  insightsModel: "claude-sonnet-4-5" | "claude-haiku-4-5";
  chatgptModel: "gpt-5.2" | "gpt-4o" | "gpt-4o-mini";
  searchContextSize: "low" | "medium" | "high";
  forceFreshRun: boolean;
}

const STORAGE_KEY = "answermonk_admin_settings";

const DEFAULTS: AdminSettings = {
  engines: {
    chatgpt: true,
    gemini: true,
    claude: true,
    deepseek: false,
  },
  useHeuristicClassification: false,
  showDevRerunButton: true,
  maxServices: 3,
  maxCustomers: 2,
  citationAnalysisMode: "url_rows",
  insightsModel: "claude-sonnet-4-5",
  chatgptModel: "gpt-5.2",
  searchContextSize: "medium",
  forceFreshRun: false,
};

export function mergeSettings(parsed: Partial<AdminSettings>): AdminSettings {
  return {
    engines: { ...DEFAULTS.engines, ...parsed.engines },
    useHeuristicClassification: parsed.useHeuristicClassification ?? DEFAULTS.useHeuristicClassification,
    showDevRerunButton: parsed.showDevRerunButton ?? DEFAULTS.showDevRerunButton,
    maxServices: parsed.maxServices ?? DEFAULTS.maxServices,
    maxCustomers: parsed.maxCustomers ?? DEFAULTS.maxCustomers,
    citationAnalysisMode: parsed.citationAnalysisMode ?? DEFAULTS.citationAnalysisMode,
    insightsModel: (parsed.insightsModel === "claude-haiku-4-5" || parsed.insightsModel === "claude-sonnet-4-5")
      ? parsed.insightsModel
      : DEFAULTS.insightsModel,
    chatgptModel: (["gpt-5.2", "gpt-4o", "gpt-4o-mini"] as const).includes(parsed.chatgptModel as any)
      ? parsed.chatgptModel as AdminSettings["chatgptModel"]
      : DEFAULTS.chatgptModel,
    searchContextSize: (["low", "medium", "high"] as const).includes(parsed.searchContextSize as any)
      ? parsed.searchContextSize as AdminSettings["searchContextSize"]
      : DEFAULTS.searchContextSize,
    forceFreshRun: parsed.forceFreshRun ?? DEFAULTS.forceFreshRun,
  };
}

function loadLocalSettings(): AdminSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS, engines: { ...DEFAULTS.engines } };
    return mergeSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULTS, engines: { ...DEFAULTS.engines } };
  }
}

// ── Module-level server cache ────────────────────────────────────────────────
// Populated once on module load by fetching /api/admin/settings.
// All getAdminSettings() calls return from here once available.
// React components subscribe via _subscribers to re-render on update.

let _serverCache: AdminSettings | null = null;
const _subscribers = new Set<() => void>();

async function initServerSettings(): Promise<void> {
  try {
    const r = await fetch("/api/admin/settings");
    if (!r.ok) return;
    const data = await r.json();
    if (data && typeof data === "object" && !data.error) {
      _serverCache = mergeSettings(data);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_serverCache)); } catch {}
      _subscribers.forEach((fn) => fn());
    }
  } catch {}
}

// Kick off immediately when the module is first imported
initServerSettings();

// ── Public sync accessor (used in mutation callbacks, non-hook contexts) ─────
export function getAdminSettings(): AdminSettings {
  return _serverCache ?? loadLocalSettings();
}

export function getEnabledEngines(): Array<"chatgpt" | "gemini" | "claude"> {
  const s = getAdminSettings();
  const all: Array<"chatgpt" | "gemini" | "claude"> = ["chatgpt", "gemini", "claude"];
  const enabled = all.filter((e) => s.engines[e]);
  return enabled.length > 0 ? enabled : ["chatgpt"];
}

// ── Hook: reactive — re-renders when server cache updates ───────────────────
export function useLiveAdminSettings(): AdminSettings {
  const [settings, setSettings] = useState<AdminSettings>(() => _serverCache ?? loadLocalSettings());

  useEffect(() => {
    // If cache already loaded before mount, apply immediately
    if (_serverCache) setSettings({ ..._serverCache });

    const listener = () => {
      if (_serverCache) setSettings({ ..._serverCache });
    };
    _subscribers.add(listener);
    return () => { _subscribers.delete(listener); };
  }, []);

  return settings;
}

// ── Hook: full admin settings panel (with edit controls) ────────────────────
export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useAdminSettings() {
  const [settings, setSettings] = useState<AdminSettings>(() => _serverCache ?? loadLocalSettings());
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const savedRef = useRef<AdminSettings | null>(null);

  useEffect(() => {
    // Subscribe to server cache updates
    if (_serverCache) {
      savedRef.current = _serverCache;
      setSettings({ ..._serverCache });
      setIsDirty(false);
    }

    const listener = () => {
      if (_serverCache) {
        savedRef.current = _serverCache;
        setSettings({ ..._serverCache });
        setIsDirty(false);
      }
    };
    _subscribers.add(listener);

    // Also fetch fresh on mount (in case module loaded before auth cookie was set)
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === "object" && !data.error) {
          const merged = mergeSettings(data);
          _serverCache = merged;
          savedRef.current = merged;
          setSettings(merged);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch {}
          setIsDirty(false);
        }
      })
      .catch(() => {});

    return () => { _subscribers.delete(listener); };
  }, []);

  const update = useCallback((patch: Partial<AdminSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch, engines: { ...prev.engines, ...(patch.engines ?? {}) } };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setIsDirty(true);
    setSaveStatus("idle");
  }, []);

  const setEngine = useCallback((engine: keyof AdminSettings["engines"], value: boolean) => {
    setSettings((prev) => {
      const newEngines = { ...prev.engines, [engine]: value };
      const anyOn = Object.values(newEngines).some(Boolean);
      if (!anyOn) return prev;
      const next = { ...prev, engines: newEngines };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setIsDirty(true);
    setSaveStatus("idle");
  }, []);

  const save = useCallback(async (currentSettings: AdminSettings) => {
    setSaveStatus("saving");
    try {
      const r = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentSettings),
      });
      if (!r.ok) throw new Error("Server error");
      _serverCache = currentSettings;
      savedRef.current = currentSettings;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings)); } catch {}
      _subscribers.forEach((fn) => fn());
      setIsDirty(false);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 4000);
    }
  }, []);

  return { settings, update, setEngine, save, isDirty, saveStatus };
}
