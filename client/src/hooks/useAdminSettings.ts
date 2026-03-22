import { useState, useCallback } from "react";

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
  maxServices: 4,
  maxCustomers: 4,
  citationAnalysisMode: "url_rows",
  insightsModel: "claude-sonnet-4-5",
};

function loadSettings(): AdminSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS, engines: { ...DEFAULTS.engines } };
    const parsed = JSON.parse(raw);
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
    };
  } catch {
    return { ...DEFAULTS, engines: { ...DEFAULTS.engines } };
  }
}

export function getAdminSettings(): AdminSettings {
  return loadSettings();
}

export function getEnabledEngines(): Array<"chatgpt" | "gemini" | "claude"> {
  const s = loadSettings();
  const all: Array<"chatgpt" | "gemini" | "claude"> = ["chatgpt", "gemini", "claude"];
  const enabled = all.filter((e) => s.engines[e]);
  return enabled.length > 0 ? enabled : ["chatgpt"];
}

export function useAdminSettings() {
  const [settings, setSettings] = useState<AdminSettings>(loadSettings);

  const update = useCallback((patch: Partial<AdminSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch, engines: { ...prev.engines, ...(patch.engines ?? {}) } };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
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
  }, []);

  return { settings, update, setEngine };
}
