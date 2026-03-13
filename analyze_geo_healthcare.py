"""
GEO Healthcare Citation Analysis — v2
Calibrated keywords, word-boundary matching, full diagnostics output.
"""

import pandas as pd
import json
import re
import math
from urllib.parse import urlparse
from collections import Counter
from pathlib import Path

# ─── CONFIG ───────────────────────────────────────────────────────────────────

INPUT_CSV = "citation_page_mentions_77.csv"
INCLUDE_AI_FALLBACK = False

TARGET_BRANDS = [
    "Emirates Home Nursing",
    "First Response Healthcare",
    "Nightingale Health Services",
    "Vesta Care",
    "Manzil Health",
    "Call Doctor",
]

# Own-domain override — verified against actual data
OWN_DOMAIN_OVERRIDES = {
    "Emirates Home Nursing":       "emirateshomenursing.ae",
    "First Response Healthcare":   "firstresponsehealthcare.com",
    "Nightingale Health Services": "nightingaledubai.com",
    "Vesta Care":                  "vestacare.ae",
    "Manzil Health":               "manzilhealth.com",
    "Call Doctor":                 "emahs.ae",
}

OUTPUT_DIR = Path("outputs")
OUTPUT_DIR.mkdir(exist_ok=True)


# ─── HELPERS ──────────────────────────────────────────────────────────────────

def get_host(url: str) -> str:
    try:
        return urlparse(str(url)).hostname or ""
    except Exception:
        return ""


def normalize_context(text: str) -> str:
    if not text or pd.isna(text):
        return ""
    return re.sub(r"\s+", " ", str(text).lower().strip())


def parse_array_col(val) -> list:
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return []
    if isinstance(val, list):
        return val
    s = str(val).strip()
    if s.startswith("["):
        try:
            return json.loads(s)
        except Exception:
            pass
    return [s] if s else []


def kw_match_single(text: str, kw: str) -> bool:
    """
    Match keyword in text. Uses word-boundary for short single words to avoid
    partial matches (e.g. 'iso' in 'isobar'). Multi-word phrases use substring.
    """
    if " " in kw or "-" in kw:
        # Multi-word or hyphenated: substring match
        return kw in text
    elif len(kw) <= 4:
        # Short word: word-boundary match
        return bool(re.search(r'\b' + re.escape(kw) + r'\b', text))
    else:
        # Longer single word: substring (to catch plurals etc.)
        return kw in text


def keyword_match(text: str, keywords: list) -> bool:
    t = normalize_context(text)
    return any(kw_match_single(t, kw) for kw in keywords)


def keywords_matched(text: str, keywords: list) -> list:
    """Return which keywords actually fired."""
    t = normalize_context(text)
    return [kw for kw in keywords if kw_match_single(t, kw)]


def prevalence_score(matched_snippets: int, total_snippets: int,
                     matched_hosts: int, total_hosts: int) -> float:
    sp = matched_snippets / total_snippets if total_snippets else 0
    dp = matched_hosts / total_hosts if total_hosts else 0
    return round(100 * (0.7 * sp + 0.3 * dp), 2)


# ─── CALIBRATED KEYWORD SETS ─────────────────────────────────────────────────

KW_CATEGORY_CLARITY = [
    # Core category labels
    "home healthcare",
    "home health care",          # 3-word variant (common in text)
    "home nursing",
    "home nursing services",
    "home care",
    "home care provider",
    "home care services",
    # In-home / at-home framing
    "in-home healthcare",
    "in-home care",
    "in-home visit",
    "in-home nursing",
    "at-home healthcare",
    "at-home care",
    "at-home care provider",
    # Provider identity
    "home healthcare provider",
    "home nursing provider",
    "healthcare provider",
    "provider in dubai",
    "based in dubai",
    # Personalized framing (common in provider descriptions)
    "personalized home care",
    "personalized healthcare",
    "personalized care",
    "personalized medical",
    "home medical care",
    "medical care at home",
    "care at home",
]

KW_TRUST = [
    # Regulatory / licensing
    "dha",
    "dha-licensed",
    "dha licensed",
    "licensed",
    "license",
    "certified",
    "certification",
    "accredited",
    "accreditation",
    "jci",
    "iso",
    # Quality signals
    "trained",
    "qualified",
    "highly qualified",
    "quality care",
    "quality healthcare",
    "quality services",
    "excellence",
    "award",
    "registered",
    "compliance",
    # Professional staff framing
    "professional",
    "professionals",
    "doctor-led",
    "licensed professionals",
    "certified professionals",
    "trained caregivers",
    "skilled nurses",
    "qualified nurses",
    "qualified staff",
    # Trust-building language
    "trusted",
    "reputable provider",
    "verified",
]

KW_SERVICE_BUCKETS = {
    "home_nursing": [
        "home nursing",
        "home health care",
        "home healthcare",
        "nurse at home",
        "nursing care",
        "nursing services",
        "skilled nursing",
        "home nurse",
        "caregiving",
        "caregiver",
        "wound care",
        "wound dressing",
        "injections at home",
        "iv therapy",
        "iv drip",
        "post-operative care",
        "post operative",
        "post-op",
        "surgical care",
    ],
    "physiotherapy": [
        "physiotherapy",
        "physical therapy",
        "physiotherapist",
        "rehabilitation",
        "rehab at home",
        "occupational therapy",
        "speech therapy",
        "speech language",
        "speech pathology",
    ],
    "doctor_support": [
        "doctor on call",
        "doctor at home",
        "gp at home",
        "physician at home",
        "medical consultation",
        "home visit doctor",
        "teleconsultation",
        "telemedicine",
        "online consultation",
        "virtual consultation",
    ],
    "diagnostics": [
        "diagnostics",
        "blood test",
        "blood tests",
        "lab test",
        "lab tests",
        "laboratory",
        "sample collection",
        "home sample",
        "diagnostic services",
        "pathology",
        "radiology",
    ],
}

KW_CARE_DEPTH = [
    # Age-related / elderly
    "elderly",
    "elderly care",
    "elder care",
    "senior care",
    "geriatric",
    "geriatric care",
    "aging",
    "ageing",
    # Chronic / complex conditions
    "chronic",
    "chronic disease",
    "chronic condition",
    "disease management",
    "complex care",
    "specialized medical",
    # Post-acute
    "post-op",
    "post operative",
    "post-operative",
    "post-hospital",
    "post-surgical",
    "recovery",
    # Long-term / end of life
    "dementia",
    "alzheimer",
    "palliative",
    "palliative care",
    "long-term care",
    "long term care",
]

KW_DELIVERY_RELIABILITY = [
    "24/7",
    "24 hours",
    "around the clock",
    "on-call",
    "on call",
    "same-day",
    "same day",
    "doorstep",
    "responsive",
    "rapid response",
    "home visit",
    "home visits",
    "at your door",
    "available anytime",
]

KW_AUTHORITY_REPUTATION = [
    "established",
    "founded",
    "since",
    "recognized",
    "most recognized",
    "well-known",
    "well known",
    "reputable",
    "leading",
    "largest",
    "trusted",
    "top-rated",
    "top rated",
    "award-winning",
    "award winning",
    "pioneer",
]

KW_IC_CATEGORY = KW_CATEGORY_CLARITY
KW_IC_TRUST    = KW_TRUST
KW_IC_BREADTH  = [kw for bucket in KW_SERVICE_BUCKETS.values() for kw in bucket]
KW_IC_DEPTH    = KW_CARE_DEPTH


# ─── LOAD & PREPARE ───────────────────────────────────────────────────────────

print(f"\n[1] Loading {INPUT_CSV} ...")
raw = pd.read_csv(INPUT_CSV, low_memory=False)
print(f"    Raw rows: {len(raw)}")

# Filter fetch status
if not INCLUDE_AI_FALLBACK:
    df = raw[raw["fetch_status"] == "crawled"].copy()
    print(f"    Filtered to crawled only: {len(df)} rows")
else:
    df = raw.copy()
    print(f"    Using all rows (including ai_fallback): {len(df)}")

# Filter to target brands
df = df[df["brand"].isin(TARGET_BRANDS)].copy()
print(f"    After brand filter: {len(df)} rows")

# Derived columns
df["host"] = df["resolved_url"].apply(get_host)
df["host"] = df["host"].where(df["host"] != "", df["url"].apply(get_host))
df["norm_context"] = df["context"].apply(normalize_context)
df["persona_0"] = df["segment_personas"].apply(lambda v: parse_array_col(v)[0] if parse_array_col(v) else "")

# Deduplication
dedup_cols = ["brand", "host", "norm_context", "persona_0"]
df_dedup = df.drop_duplicates(subset=dedup_cols).copy()
print(f"    After dedup: {len(df_dedup)} rows")

# Own-site flag
def is_own_site(row) -> bool:
    own = OWN_DOMAIN_OVERRIDES.get(row["brand"], "").lower()
    if not own:
        return False
    host = (row["host"] or "").lower()
    return own in host or host.endswith(own) or host == own

df_dedup["is_own"] = df_dedup.apply(is_own_site, axis=1)

print(f"\n[2] Brand snippet counts after dedup:")
for b in TARGET_BRANDS:
    sub = df_dedup[df_dedup["brand"] == b]
    own_ct = sub["is_own"].sum()
    ext_ct = len(sub) - own_ct
    print(f"    {b:<35} {len(sub):>3} snippets, {sub['host'].nunique():>2} hosts  "
          f"(own: {own_ct}, ext: {ext_ct})")


# ─── SCORING HELPERS ──────────────────────────────────────────────────────────

def score_keyword_metric(bdf: pd.DataFrame, keywords: list) -> float:
    if bdf.empty:
        return 0.0
    matched = bdf["norm_context"].apply(lambda t: keyword_match(t, keywords))
    return prevalence_score(
        matched.sum(), len(bdf),
        bdf[matched]["host"].nunique(), bdf["host"].nunique()
    )


def keyword_metric_breakdown(bdf: pd.DataFrame, keywords: list) -> dict:
    if bdf.empty:
        return dict(own_sn=0, own_sd=0, own_dn=0, own_dd=0,
                    ext_sn=0, ext_sd=0, ext_dn=0, ext_dd=0)
    own = bdf[bdf["is_own"]]
    ext = bdf[~bdf["is_own"]]
    def _calc(sub):
        matched = sub["norm_context"].apply(lambda t: keyword_match(t, keywords))
        return (int(matched.sum()), len(sub),
                sub[matched]["host"].nunique(), sub["host"].nunique())
    osn, osd, odn, odd = _calc(own)
    esn, esd, edn, edd = _calc(ext)
    return dict(own_sn=osn, own_sd=osd, own_dn=odn, own_dd=odd,
                ext_sn=esn, ext_sd=esd, ext_dn=edn, ext_dd=edd)


def score_service_breadth(bdf: pd.DataFrame) -> tuple:
    if bdf.empty:
        return 0.0, {}
    bucket_scores = {b: score_keyword_metric(bdf, kws) for b, kws in KW_SERVICE_BUCKETS.items()}
    return round(sum(bucket_scores.values()) / len(bucket_scores), 2), bucket_scores


def score_authority_source(bdf: pd.DataFrame, all_hosts_freq: Counter) -> float:
    if bdf.empty:
        return 0.0
    brand_hosts = set(bdf["host"])
    winner_hosts = {h for h, c in all_hosts_freq.items() if c >= 3}
    winner_score = len(brand_hosts & winner_hosts) / max(len(winner_hosts), 1)
    host_div = bdf["host"].nunique()
    cat_div = bdf["domain_category"].nunique() if "domain_category" in bdf.columns else 1
    ext_share = (~bdf["is_own"]).sum() / len(bdf)
    return round(100 * (
        0.40 * winner_score +
        0.25 * min(host_div / 20, 1.0) +
        0.20 * min(cat_div / 6, 1.0) +
        0.15 * ext_share
    ), 2)


def score_identity_consistency(bdf: pd.DataFrame) -> float:
    if bdf.empty:
        return 0.0
    def make_packet(row):
        t = row["norm_context"]
        return (
            keyword_match(t, KW_IC_CATEGORY),
            keyword_match(t, KW_IC_TRUST),
            keyword_match(t, KW_IC_BREADTH),
            keyword_match(t, KW_IC_DEPTH),
        )
    bdf = bdf.copy()
    bdf["packet"] = bdf.apply(make_packet, axis=1)
    packet_counts = Counter(bdf["packet"])
    total = len(bdf)
    dominant_packet, dominant_count = packet_counts.most_common(1)[0]
    dominant_strength = dominant_count / total
    dom_hosts = bdf[bdf["packet"] == dominant_packet]["host"].nunique()
    cross_domain_stability = dom_hosts / max(bdf["host"].nunique(), 1)
    probs = [c / total for c in packet_counts.values()]
    entropy = -sum(p * math.log2(p) for p in probs if p > 0)
    max_entropy = math.log2(max(len(packet_counts), 2))
    inv_drift = 1 - (entropy / max_entropy)
    return round(100 * (
        0.50 * dominant_strength +
        0.30 * cross_domain_stability +
        0.20 * inv_drift
    ), 2)


# ─── BUILD HOST FREQUENCY MAP ─────────────────────────────────────────────────

host_brand_map: dict = {}
for _, row in df_dedup.iterrows():
    h, b = row["host"], row["brand"]
    if h:
        host_brand_map.setdefault(h, set()).add(b)

all_hosts_brand_freq = Counter({h: len(brands) for h, brands in host_brand_map.items()})


# ─── COMPUTE METRICS ──────────────────────────────────────────────────────────

print("\n[3] Computing metrics ...")

records_scores = []
records_cat_clarity = []
records_trust = []
records_service_breadth = []
records_care_depth = []

METRICS_FOR_DIAG = {
    "category_clarity":   KW_CATEGORY_CLARITY,
    "trust":              KW_TRUST,
    "care_depth":         KW_CARE_DEPTH,
    "delivery_reliability": KW_DELIVERY_RELIABILITY,
    "authority_reputation": KW_AUTHORITY_REPUTATION,
}

diag_lines = ["# GEO Metric Diagnostics — v2\n"]

for brand in TARGET_BRANDS:
    bdf = df_dedup[df_dedup["brand"] == brand]
    diag_lines.append(f"\n{'='*70}")
    diag_lines.append(f"BRAND: {brand}  ({len(bdf)} snippets, {bdf['host'].nunique()} hosts)")
    diag_lines.append(f"  Own-domain: {OWN_DOMAIN_OVERRIDES.get(brand, 'none')}  "
                      f"(own snippets: {bdf['is_own'].sum()}, ext: {(~bdf['is_own']).sum()})")
    diag_lines.append("")

    # A. Numerators / denominators per metric
    diag_lines.append("  A. NUMERATORS / DENOMINATORS")
    for metric, kws in METRICS_FOR_DIAG.items():
        matched = bdf["norm_context"].apply(lambda t: keyword_match(t, kws))
        m_hosts = bdf[matched]["host"].nunique()
        t_hosts = bdf["host"].nunique()
        sp = f"{matched.sum()}/{len(bdf)}"
        dp = f"{m_hosts}/{t_hosts}"
        score = prevalence_score(matched.sum(), len(bdf), m_hosts, t_hosts)
        diag_lines.append(f"    {metric:<28} snippets={sp:<8}  domains={dp:<6}  → {score:.1f}")

    # B. Top matched keywords per metric
    diag_lines.append("")
    diag_lines.append("  B. TOP MATCHED KEYWORDS")
    for metric, kws in METRICS_FOR_DIAG.items():
        all_fired = []
        for t in bdf["norm_context"]:
            all_fired.extend(keywords_matched(t, kws))
        top = Counter(all_fired).most_common(8)
        if top:
            top_str = ", ".join(f'"{k}"({n})' for k, n in top)
        else:
            top_str = "(none)"
        diag_lines.append(f"    {metric:<28} {top_str}")

    # C. 5 matched + 5 missed snippets for category_clarity
    diag_lines.append("")
    diag_lines.append("  C. SAMPLE SNIPPETS — Category Clarity")
    cat_match = bdf["norm_context"].apply(lambda t: keyword_match(t, KW_CATEGORY_CLARITY))
    matched_texts = bdf[cat_match]["norm_context"].tolist()
    missed_texts  = bdf[~cat_match]["norm_context"].tolist()
    diag_lines.append("  MATCHED (up to 5):")
    for txt in matched_texts[:5]:
        diag_lines.append(f"    + {txt[:140]}")
    diag_lines.append("  MISSED (up to 5):")
    for txt in missed_texts[:5]:
        diag_lines.append(f"    - {txt[:140]}")

    # C2. 5 matched + 5 missed for trust
    diag_lines.append("")
    diag_lines.append("  C2. SAMPLE SNIPPETS — Trust")
    tr_match = bdf["norm_context"].apply(lambda t: keyword_match(t, KW_TRUST))
    matched_tr = bdf[tr_match]["norm_context"].tolist()
    missed_tr  = bdf[~tr_match]["norm_context"].tolist()
    diag_lines.append("  MATCHED (up to 5):")
    for txt in matched_tr[:5]:
        diag_lines.append(f"    + {txt[:140]}")
    diag_lines.append("  MISSED (up to 5):")
    for txt in missed_tr[:5]:
        diag_lines.append(f"    - {txt[:140]}")

    # Compute scores
    authority_source  = score_authority_source(bdf, all_hosts_brand_freq)
    category_clarity  = score_keyword_metric(bdf, KW_CATEGORY_CLARITY)
    trust             = score_keyword_metric(bdf, KW_TRUST)
    service_breadth, bucket_scores = score_service_breadth(bdf)
    care_depth        = score_keyword_metric(bdf, KW_CARE_DEPTH)
    delivery_rel      = score_keyword_metric(bdf, KW_DELIVERY_RELIABILITY)
    authority_rep     = score_keyword_metric(bdf, KW_AUTHORITY_REPUTATION)
    identity_con      = score_identity_consistency(bdf)

    records_scores.append({
        "brand":                     brand,
        "authority_source_presence": authority_source,
        "category_clarity":          category_clarity,
        "trust":                     trust,
        "service_breadth":           service_breadth,
        "care_depth":                care_depth,
        "delivery_reliability":      delivery_rel,
        "authority_reputation":      authority_rep,
        "identity_consistency":      identity_con,
    })

    # Breakdowns
    cc = keyword_metric_breakdown(bdf, KW_CATEGORY_CLARITY)
    records_cat_clarity.append({"brand": brand, **{k: v for k, v in cc.items()}})
    tr = keyword_metric_breakdown(bdf, KW_TRUST)
    records_trust.append({"brand": brand, **{k: v for k, v in tr.items()}})
    cd = keyword_metric_breakdown(bdf, KW_CARE_DEPTH)
    records_care_depth.append({"brand": brand, **{k: v for k, v in cd.items()}})

    sb_row = {"brand": brand}
    for bkt, bkt_score in bucket_scores.items():
        bkt_kws = KW_SERVICE_BUCKETS[bkt]
        bkt_own = bdf[bdf["is_own"]]
        bkt_ext = bdf[~bdf["is_own"]]
        def _prev(sub, kws):
            if sub.empty:
                return 0.0
            matched = sub["norm_context"].apply(lambda t: keyword_match(t, kws))
            return prevalence_score(matched.sum(), len(sub),
                                    sub[matched]["host"].nunique(), sub["host"].nunique())
        sb_row[f"{bkt}_score"]    = bkt_score
        sb_row[f"{bkt}_own_prev"] = _prev(bkt_own, bkt_kws)
        sb_row[f"{bkt}_ext_prev"] = _prev(bkt_ext, bkt_kws)
    records_service_breadth.append(sb_row)


# ─── TOP AUTHORITY SOURCES ────────────────────────────────────────────────────

auth_records = []
for host, brands_set in host_brand_map.items():
    host_rows = df_dedup[df_dedup["host"] == host]
    total_mentions = len(host_rows)
    distinct_brands = len(brands_set)
    dom_cat = (host_rows["domain_category"].mode()[0]
               if "domain_category" in host_rows.columns and not host_rows.empty else "")
    weighted = total_mentions * (1 + 0.2 * (distinct_brands - 1))
    auth_records.append({
        "host": host,
        "domain_category": dom_cat,
        "total_mentions": total_mentions,
        "distinct_brands": distinct_brands,
        "weighted_source_score": round(weighted, 2),
    })

df_authority = pd.DataFrame(auth_records).sort_values("weighted_source_score", ascending=False)


# ─── RANK TABLE ───────────────────────────────────────────────────────────────

df_scores = pd.DataFrame(records_scores)
metrics = [c for c in df_scores.columns if c != "brand"]

diag_lines.append("\n\n" + "="*70)
diag_lines.append("E. RANK ORDER BY METRIC")
diag_lines.append("")
for m in metrics:
    ranked = df_scores.sort_values(m, ascending=False)[["brand", m]].values
    diag_lines.append(f"  {m}")
    for rank, (b, v) in enumerate(ranked, 1):
        diag_lines.append(f"    {rank}. {b:<35} {v:.1f}")
    diag_lines.append("")


# ─── WRITE OUTPUTS ────────────────────────────────────────────────────────────

print("\n[4] Writing outputs ...")

df_scores.to_csv(OUTPUT_DIR / "brand_scores.csv", index=False)
print(f"    ✓ {OUTPUT_DIR}/brand_scores.csv")

pd.DataFrame(records_cat_clarity).to_csv(OUTPUT_DIR / "category_clarity_breakdown.csv", index=False)
pd.DataFrame(records_trust).to_csv(OUTPUT_DIR / "trust_breakdown.csv", index=False)
pd.DataFrame(records_service_breadth).to_csv(OUTPUT_DIR / "service_breadth_breakdown.csv", index=False)
pd.DataFrame(records_care_depth).to_csv(OUTPUT_DIR / "care_depth_breakdown.csv", index=False)
df_authority.head(50).to_csv(OUTPUT_DIR / "top_authority_sources.csv", index=False)

(OUTPUT_DIR / "diagnostics.txt").write_text("\n".join(diag_lines))
print(f"    ✓ {OUTPUT_DIR}/diagnostics.txt")

# ─── MARKDOWN REPORT ─────────────────────────────────────────────────────────

strongest = {m: df_scores.loc[df_scores[m].idxmax(), "brand"] for m in metrics}
weakest   = {m: df_scores.loc[df_scores[m].idxmin(), "brand"] for m in metrics}
top_brand = df_scores.set_index("brand")[metrics].mean(axis=1).idxmax()

col_labels = {
    "authority_source_presence": "Auth Src",
    "category_clarity":           "Category",
    "trust":                      "Trust",
    "service_breadth":            "Breadth",
    "care_depth":                 "Depth",
    "delivery_reliability":       "Delivery",
    "authority_reputation":       "Reputation",
    "identity_consistency":       "Identity",
}

header = "| Brand | " + " | ".join(col_labels[m] for m in metrics) + " |"
sep    = "|---|" + "|".join(["---"] * len(metrics)) + "|"
rows_md = []
for _, row in df_scores.iterrows():
    vals = " | ".join(f"{row[m]:.1f}" for m in metrics)
    rows_md.append(f"| {row['brand']} | {vals} |")

most_trusted  = df_scores.loc[df_scores["trust"].idxmax(), "brand"]
widest        = df_scores.loc[df_scores["service_breadth"].idxmax(), "brand"]

report = f"""# GEO Healthcare Citation Analysis — Session 77 (v2)
*Scores are relative to this dataset only, not universal market truth.*
*Data: crawled pages only · {len(df_dedup)} deduped snippets · v2 calibrated keywords*

## Summary Scores (0–100)

{header}
{sep}
{chr(10).join(rows_md)}

## Key Insights

- **Overall leader:** {top_brand} leads on average across all 8 dimensions.
- **Widest service messaging:** {widest} covers the most service categories in cited content.
- **Trust signal density:** {most_trusted} has the highest trust/accreditation language.

## Strongest / Weakest by Metric

| Metric | Strongest | Weakest |
|---|---|---|
"""
for m in metrics:
    report += f"| {col_labels[m]} | {strongest[m]} | {weakest[m]} |\n"

report += f"""
---
> Scores derived from {len(df_dedup)} deduplicated snippets from AI-cited URLs.
> Run `outputs/diagnostics.txt` for per-brand keyword hit counts and sample snippets.
"""

(OUTPUT_DIR / "report.md").write_text(report)
print(f"    ✓ {OUTPUT_DIR}/report.md")

# ─── PRINT SCORES ────────────────────────────────────────────────────────────

print("\n[5] Final scores (v2):")
print(df_scores.to_string(index=False))
print("\nDone.")
