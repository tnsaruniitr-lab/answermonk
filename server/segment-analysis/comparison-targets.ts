import type { SegmentInput } from "./citation-crawler";

export interface ComparisonTarget {
  name: string;
  appearance_rate: number;
  isBrand: boolean;
}

export interface SegmentComparison {
  segmentId: string;
  brand: ComparisonTarget;
  competitors: [ComparisonTarget, ComparisonTarget];
  topK: ComparisonTarget[];
}

export function selectComparisonTargets(
  segmentId: string,
  brandName: string,
  segment: SegmentInput,
): SegmentComparison {
  const score = segment.scoringResult?.score;
  if (!score) {
    return {
      segmentId,
      brand: { name: brandName, appearance_rate: 0, isBrand: true },
      competitors: [
        { name: "Unknown A", appearance_rate: 0, isBrand: false },
        { name: "Unknown B", appearance_rate: 0, isBrand: false },
      ],
      topK: [{ name: brandName, appearance_rate: 0, isBrand: true }],
    };
  }

  const brandTarget: ComparisonTarget = {
    name: brandName,
    appearance_rate: score.appearance_rate,
    isBrand: true,
  };

  const allCompetitors = (score.competitors || [])
    .map(c => ({
      name: c.name,
      appearance_rate: c.share,
      isBrand: false,
    }))
    .sort((a, b) => b.appearance_rate - a.appearance_rate);

  const allEntries = [brandTarget, ...allCompetitors]
    .sort((a, b) => b.appearance_rate - a.appearance_rate);

  const topK = allEntries.slice(0, 5);

  const brandRank = allEntries.findIndex(e => e.isBrand);
  let rivals: ComparisonTarget[];

  if (brandRank <= 1) {
    rivals = allEntries.filter(e => !e.isBrand).slice(0, 2);
  } else {
    rivals = allEntries.filter(e => !e.isBrand).slice(0, 2);
  }

  while (rivals.length < 2) {
    rivals.push({ name: `Competitor ${rivals.length + 1}`, appearance_rate: 0, isBrand: false });
  }

  return {
    segmentId,
    brand: brandTarget,
    competitors: [rivals[0], rivals[1]],
    topK,
  };
}

export function selectAllComparisonTargets(
  brandName: string,
  segments: SegmentInput[],
): SegmentComparison[] {
  return segments.map(seg => selectComparisonTargets(seg.id, brandName, seg));
}
