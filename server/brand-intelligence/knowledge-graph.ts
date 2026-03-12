import type { AttributeKey } from "./runner";

export interface AttributeNorm {
  tier: "floor" | "signal" | "differentiator";
  frequency: number;
  canonicalValue: string | null;
  alternatives: string[];
  description: string;
}

export interface WinnerWedge {
  brand: string;
  wedge: string;
}

export interface CategoryKnowledgeGraph {
  name: string;
  category: string;
  description: string;
  winnerCount: number;
  winnerNames: string[];
  winnerWedges: WinnerWedge[];
  attributes: Partial<Record<AttributeKey, AttributeNorm>>;
}

export const HEALTHCARE_UAE_GRAPH: CategoryKnowledgeGraph = {
  name: "Home Healthcare — UAE",
  category: "healthcare_uae",
  description:
    "UAE home healthcare market leaders: Manzil Health, Emirates Home Nursing, First Response Healthcare, Vesta Care, Nightingale Health Services, Call Doctor UAE",
  winnerCount: 6,
  winnerNames: [
    "Manzil Health",
    "Emirates Home Nursing",
    "First Response Healthcare",
    "Vesta Care",
    "Nightingale Health Services",
    "Call Doctor UAE",
  ],
  winnerWedges: [
    {
      brand: "Manzil Health",
      wedge: "Top AI recall — #1 most recognized home healthcare brand across all query types",
    },
    {
      brand: "Emirates Home Nursing",
      wedge: "Heritage authority — UAE's first and oldest home healthcare provider (est. 2003)",
    },
    {
      brand: "First Response Healthcare",
      wedge: "JCI Gold Seal — only UAE home healthcare brand with international quality accreditation",
    },
    {
      brand: "Vesta Care",
      wedge: "Alzheimer's and dementia specialist — only brand with clinical dementia care focus",
    },
    {
      brand: "Nightingale Health Services",
      wedge: "Western clinical standards meets Eastern hospitality — British-founded international pedigree",
    },
    {
      brand: "Call Doctor UAE",
      wedge: "Widest age-range coverage — newborns to elderly in one unified brand promise",
    },
  ],
  attributes: {
    primary_credential: {
      tier: "floor",
      frequency: 0.83,
      canonicalValue: "DHA-licensed",
      alternatives: ["JCI Gold Seal of Approval", "MOH-licensed", "British professional standards"],
      description:
        "Floor (5/6 winners): DHA-licensed is the minimum category entry credential. Differentiators: JCI Gold Seal (First Response only — exceeds the DHA floor), MOH/British standards (secondary signals). Unrecognized regulatory status = fundamental gap. Generic 'licensed provider' without DHA specificity = underspecified.",
    },
    years_in_market: {
      tier: "signal",
      frequency: 0.33,
      canonicalValue: "Established provider",
      alternatives: ["Founded 2003 — 20+ years (Emirates)", "Founded 2011 — 14+ years (Manzil)"],
      description:
        "Signal (2/6 winners state founding years): Emirates (2003) and Manzil (2011) use heritage as trust proof. Brands without stated founding years are not penalized. Specific founding year = longevity signal; absence = neutral for category membership.",
    },
    staff_qualification: {
      tier: "floor",
      frequency: 1.0,
      canonicalValue: "Licensed or certified healthcare professionals",
      alternatives: [
        "DHA-licensed nurses (Vesta)",
        "British-trained professionals (Nightingale)",
        "Multilingual trained staff (Emirates)",
        "Licensed nurses, physiotherapists and physicians (Manzil)",
        "Certified professionals with continuous training (First Response)",
      ],
      description:
        "Floor (6/6 winners): licensed or certified healthcare professionals. Signal (3/6): physiotherapists specifically included. Differentiators: British-trained (Nightingale only), multilingual (Emirates only), physicians included (Manzil only). Generic 'qualified carers' without professional licensing = underspecified for this category.",
    },
    geographic_coverage: {
      tier: "floor",
      frequency: 1.0,
      canonicalValue: "Dubai, UAE",
      alternatives: [],
      description:
        "Floor (6/6 winners): Dubai and UAE. This is the absolute category minimum. All winners operate in Dubai at minimum; UAE-wide is equivalent. Geographic scope outside UAE = outside category. No geographic recognition = fundamental absence signal.",
    },
    response_time: {
      tier: "floor",
      frequency: 0.83,
      canonicalValue: "24/7 on-call",
      alternatives: ["24-hour support line (Vesta)", "On-demand at doorstep (Call Doctor)"],
      description:
        "Floor (5/6 winners): 24/7 on-call availability. 'On-demand' without 24/7 specificity (Call Doctor) = borderline. Same-day is implied by 24/7. No availability signal at all = gap vs. category floor. '24-hour support' is equivalent to 24/7.",
    },
    service_model: {
      tier: "floor",
      frequency: 1.0,
      canonicalValue: "On-demand home visits — no clinic required",
      alternatives: [
        "Flexible care plans (Emirates)",
        "Vetted nurse network with transparent processes (Vesta)",
        "Patient-centered comprehensive care (First Response)",
      ],
      description:
        "Floor (6/6 winners): on-demand home visits — care delivered at patient's location without requiring clinic attendance. Variations in model (subscription, flexible plans, vetted networks) are signal-level differentiators. Clinic-based or outpatient model = outside category.",
    },
    service_list: {
      tier: "floor",
      frequency: 1.0,
      canonicalValue: "Nursing care, physiotherapy, elderly care",
      alternatives: [
        "palliative care (3/6)",
        "maternity and newborn care (3/6)",
        "pediatric care (3/6)",
        "post-surgical care (2/6)",
        "wound management (2/6)",
        "doctor home visits (3/6)",
        "IV therapy (2/6)",
        "chronic disease management (2/6)",
        "lab sample collection (2/6)",
        "Alzheimer's and dementia care (1/6 — Vesta differentiator)",
        "home ICU setup (1/6 — Manzil differentiator)",
        "vaccines (1/6 — Nightingale differentiator)",
      ],
      description:
        "Floor services (≥4/6 winners): nursing care (6/6), physiotherapy (4/6), elderly care (4/6). Signal services (2-3/6): palliative care, maternity/newborn, pediatric, post-surgical, wound management, doctor home visits, IV therapy, chronic disease management, lab tests. Differentiators: Alzheimer's care (Vesta only), home ICU (Manzil only), vaccines (Nightingale only). Score based on category signal strength, not raw count — 3 core floor services = strong category signal even without full breadth.",
    },
    target_customer: {
      tier: "floor",
      frequency: 1.0,
      canonicalValue: "Elderly, post-surgical patients, pediatric",
      alternatives: [
        "maternity and newborn (3/6)",
        "chronic illness patients (2/6)",
        "prenatal and postnatal (1/6)",
        "all ages from newborns to elderly (Call Doctor)",
        "Alzheimer's and dementia patients (Vesta only)",
      ],
      description:
        "Floor segments (≥4/6 winners): elderly (4/6), post-surgical (4/6), pediatric/newborn (4/6). Signal segments (2-3/6): maternity, chronic illness. Differentiator: Alzheimer's/dementia (Vesta only). 'Children and adults' maps to pediatric + adult patients = category-appropriate but under-specified for premium segment targeting. Non-human patients or unrelated service recipients = outside category entirely.",
    },
    proof_numbers: {
      tier: "signal",
      frequency: 0.67,
      canonicalValue: "High citation volume, thousands of patients served",
      alternatives: [
        "1,095 citation mentions, rank #1–3 (Vesta)",
        "851 citation mentions, rank #2–6 (Emirates)",
        "595 citation mentions, rank #2–10 (First Response)",
        "576 citation mentions, rank #2–5 (Nightingale)",
        "Most cited across all query segments (Manzil)",
      ],
      description:
        "Signal (4/6 winners have specific proof data): citation volume + LLM list rank + patient volume are the three proof dimensions. Vesta has highest citation volume (1,095). Manzil has highest query breadth. Specific numbers strongly outperform generic claims. No proof data = signal gap, not category exclusion.",
    },
    price_tier: {
      tier: "floor",
      frequency: 0.83,
      canonicalValue: "Premium",
      alternatives: ["Mid-market (Call Doctor UAE only)"],
      description:
        "Floor (5/6 winners): premium pricing with insurance compatibility (Daman, Thiqa, ADNIC). Only Call Doctor UAE positions as mid-market. Budget positioning = outside category norm for leading UAE home healthcare brands. 'Premium' includes insurance-compatible services.",
    },
    brand_wedge: {
      tier: "differentiator",
      frequency: 1.0,
      canonicalValue: null,
      alternatives: [
        "#1 AI recall across all query types (Manzil Health)",
        "Heritage authority — UAE's oldest provider (Emirates Home Nursing)",
        "JCI Gold Seal international accreditation (First Response Healthcare)",
        "Alzheimer's and dementia specialist (Vesta Care)",
        "Western clinical standards meets Eastern hospitality (Nightingale Health Services)",
        "Widest age range: newborns to elderly (Call Doctor UAE)",
      ],
      description:
        "Each of the 6 winners occupies a UNIQUE differentiating position — no two winners share a wedge. Collision risk: if target brand's recognized wedge semantically overlaps with any winner's owned territory, differentiation is lost. Requirement: one distinct positioning not already occupied by a winner. Generic category descriptor as wedge = underspecified. No recognized wedge = absent from differentiation space.",
    },
    closest_competitor: {
      tier: "signal",
      frequency: 0.5,
      canonicalValue: "Manzil Health or Emirates Home Nursing",
      alternatives: [
        "First Response Healthcare",
        "Vesta Care",
        "Nightingale Health Services",
      ],
      description:
        "Signal (3/6 winners reference competitors explicitly): Manzil is the most-cited reference point (appears in 4 winner comparisons). Being cited in relation to a category leader = positive signal confirming category membership. Being compared to brands outside this category = category positioning risk.",
    },
    known_gap: {
      tier: "differentiator",
      frequency: 0.17,
      canonicalValue: null,
      alternatives: ["Lower AI recall vs specialist providers (Call Doctor UAE only)"],
      description:
        "Differentiator: only Call Doctor UAE explicitly states a gap (lower AI recall vs specialists). Leading winners don't publicly state gaps — their positioning is confident. Recognized gap = honest but strategically weak signal. No recognized gap = neutral.",
    },
    identity_summary: {
      tier: "floor",
      frequency: 1.0,
      canonicalValue: "Clear, specific one-sentence identity recognizable in AI memory",
      alternatives: [],
      description:
        "Floor (6/6 winners): all have a clear, specific, consistently recognized identity statement in AI. A vague, generic, contradictory, or missing identity summary = fundamental AI presence gap. Identity should name: the brand + credential + primary services + geography. Sentence like 'Brand X is a well-known healthcare company' = underspecified.",
    },
  },
};

export const KNOWLEDGE_GRAPHS: Record<string, CategoryKnowledgeGraph> = {
  healthcare_uae: HEALTHCARE_UAE_GRAPH,
};

export function getKnowledgeGraph(category: string): CategoryKnowledgeGraph | null {
  return KNOWLEDGE_GRAPHS[category] ?? null;
}
