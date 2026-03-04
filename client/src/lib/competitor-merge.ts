interface RawRunCandidate {
  name_raw?: string;
  name_norm?: string;
  rank?: number;
  domain?: string | null;
}

interface RawRun {
  candidates: (string | RawRunCandidate)[];
  [key: string]: any;
}

interface CompetitorEntry {
  name: string;
  share: number;
  appearances: number;
}

function shouldMergeNames(a: string, b: string): boolean {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  if (na === nb) return true;
  const ta = na.split(/\s+/);
  const tb = nb.split(/\s+/);
  if (ta.every(t => tb.includes(t))) return true;
  if (tb.every(t => ta.includes(t))) return true;
  if (na.length >= 4) {
    const re = new RegExp(`\\b${na.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (re.test(nb)) return true;
  }
  if (nb.length >= 4) {
    const re = new RegExp(`\\b${nb.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (re.test(na)) return true;
  }
  return false;
}

export function deduplicateStoredCompetitors(
  competitors: CompetitorEntry[]
): CompetitorEntry[] {
  const sorted = [...competitors].sort((a, b) => b.appearances - a.appearances);
  const merged: CompetitorEntry[] = [];
  const consumed = new Set<number>();

  for (let i = 0; i < sorted.length; i++) {
    if (consumed.has(i)) continue;
    const entry = { ...sorted[i] };

    for (let j = i + 1; j < sorted.length; j++) {
      if (consumed.has(j)) continue;
      if (shouldMergeNames(entry.name, sorted[j].name)) {
        entry.appearances += sorted[j].appearances;
        entry.share = Math.min(entry.share + sorted[j].share, 1);
        if (sorted[j].name.length < entry.name.length) {
          entry.name = sorted[j].name;
        }
        consumed.add(j);
      }
    }

    consumed.add(i);
    merged.push(entry);
  }

  return merged.sort((a, b) => b.appearances - a.appearances);
}

export function mergeCompetitors(
  rawRuns: RawRun[] | undefined,
  storedCompetitors: CompetitorEntry[],
  validRuns: number
): CompetitorEntry[] {
  if (!rawRuns || rawRuns.length === 0) return storedCompetitors;

  const allNames = new Set<string>();
  for (const run of rawRuns) {
    for (const c of run.candidates || []) {
      const name = typeof c === 'string' ? c : (c as RawRunCandidate)?.name_raw;
      if (name) allNames.add(name);
    }
  }

  const nameArr = Array.from(allNames);
  const nameToGroup = new Map<string, string>();
  const assigned = new Set<string>();
  for (let i = 0; i < nameArr.length; i++) {
    if (assigned.has(nameArr[i])) continue;
    const group = [nameArr[i]];
    assigned.add(nameArr[i]);
    for (let j = i + 1; j < nameArr.length; j++) {
      if (assigned.has(nameArr[j])) continue;
      if (group.some(g => shouldMergeNames(g, nameArr[j]))) {
        group.push(nameArr[j]);
        assigned.add(nameArr[j]);
      }
    }
    const canonical = group.reduce((a, b) => a.length <= b.length ? a : b);
    for (const name of group) {
      nameToGroup.set(name.toLowerCase(), canonical);
    }
  }

  const counts = new Map<string, number>();
  for (const run of rawRuns) {
    const seenGroups = new Set<string>();
    for (const c of run.candidates || []) {
      const name = typeof c === 'string' ? c : (c as RawRunCandidate)?.name_raw;
      if (!name) continue;
      const group = nameToGroup.get(name.toLowerCase()) || name;
      if (seenGroups.has(group)) continue;
      seenGroups.add(group);
      counts.set(group, (counts.get(group) || 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([name, appearances]) => ({
      name,
      share: validRuns > 0 ? appearances / validRuns : 0,
      appearances,
    }))
    .sort((a, b) => b.appearances - a.appearances);
}
