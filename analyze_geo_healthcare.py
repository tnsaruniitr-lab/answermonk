"""
GEO Healthcare Citation Analysis
Computes 8 brand-level metrics for 6 Dubai home healthcare brands
from citation_page_mentions data.
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

# Set to True to include ai_fallback rows; False = crawled pages only
INCLUDE_AI_FALLBACK = False

TARGET_BRANDS = [
    "Emirates Home Nursing",
    "First Response Healthcare",
    "Nightingale Health Services",
    "Vesta Care",
    "Manzil Health",
    "Call Doctor",
]

# Manual brand → own-domain override (auto-detected otherwise)
OWN_DOMAIN_OVERRIDES = {
    "Emirates Home Nursing":     "emirateshomenursing.ae",
    "First Response Healthcare": "firstresponsehealthcare.com",
    "Nightingale Health Services": "nightingaledubai.com",
    "Vesta Care":                "vestacare.ae",
    "Manzil Health":             "manzilhealth.com",
    "Call Doctor":               "emahs.ae",
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


def keyword_match(text: str, keywords: list) -> bool:
    t = normalize_context(text)
    return any(kw in t for kw in keywords)


def prevalence_score(matched_snippets: int, total_snippets: int,
                     matched_hosts: int, total_hosts: int) -> float:
    sp = matched_snippets / total_snippets if total_snippets else 0
    dp = matched_hosts / total_hosts if total_hosts else 0
    return round(100 * (0.7 * sp + 0.3 * dp), 2)


# ─── LOAD & PREPARE DATA ──────────────────────────────────────────────────────

print(f"\n[1] Loading {INPUT_CSV} ...")
raw = pd.read_csv(INPUT_CSV, low_memory=False)
print(f"    Raw rows: {len(raw)}")
print(f"    Columns:  {list(raw.columns)}")

# Column mapping (spec names → actual names)
COL_MAP = {
    "brand":            "brand",
    "context":          "context",
    "resolved_url":     "resolved_url",
    "domain_category":  "domain_category",
    "segment_personas": "segment_personas",
    "segment_queries":  "segment_queries",
    "source_type":      "source_type",
    "fetch_status":     "fetch_status",
    "url":              "url",
    "domain":           "domain",
}

# Auto-map if column names differ slightly
for spec_col, actual_col in list(COL_MAP.items()):
    if actual_col not in raw.columns:
        candidates = [c for c in raw.columns if spec_col.replace("_", "") in c.replace("_", "")]
        if candidates:
            COL_MAP[spec_col] = candidates[0]
            print(f"    Mapped {spec_col!r} → {candidates[0]!r}")

print(f"\n    Mapped columns: {COL_MAP}")

df = raw.rename(columns={v: k for k, v in COL_MAP.items() if v in raw.columns}).copy()

# Filter fetch status
if not INCLUDE_AI_FALLBACK:
    before = len(df)
    df = df[df.get("fetch_status", pd.Series("crawled", index=df.index)) == "crawled"]
    print(f"\n[2] Filtered to crawled only: {before} → {len(df)} rows")
else:
    print(f"\n[2] Using all rows (including ai_fallback): {len(df)}")

# Filter to target brands only
df = df[df["brand"].isin(TARGET_BRANDS)].copy()
print(f"    After brand filter: {len(df)} rows across {df['brand'].nunique()} brands")

# Derived columns
df["host"] = df["resolved_url"].apply(get_host)
df["host"] = df["host"].where(df["host"] != "", df["url"].apply(get_host))
df["norm_context"] = df["context"].apply(normalize_context)
df["persona_0"] = df["segment_personas"].apply(lambda v: parse_array_col(v)[0] if parse_array_col(v) else "")

# Deduplication: brand + host + norm_context + persona
dedup_cols = ["brand", "host", "norm_context", "persona_0"]
df_dedup = df.drop_duplicates(subset=dedup_cols).copy()
print(f"    After dedup: {len(df_dedup)} rows")

# Own-site flag
def is_own_site(row) -> bool:
    own = OWN_DOMAIN_OVERRIDES.get(row["brand"], "").lower()
    if not own:
        return False
    host = (row["host"] or "").lower()
    return own in host or host in own

df_dedup["is_own"] = df_dedup.apply(is_own_site, axis=1)

print(f"\n    Brands present after dedup:")
for b in TARGET_BRANDS:
    sub = df_dedup[df_dedup["brand"] == b]
    print(f"      {b}: {len(sub)} snippets, {sub['host'].nunique()} hosts")


# ─── KEYWORD SETS ─────────────────────────────────────────────────────────────

KW_CATEGORY_CLARITY = [
    "at-home healthcare", "in-home healthcare", "home healthcare", "care at home",
    "home care", "home care provider", "at-home care provider", "home nursing provider",
    "healthcare provider", "provider in dubai", "based in dubai",
]

KW_TRUST = [
    "dha", "licensed", "certified", "accredited", "jci", "iso",
    "trained", "qualified", "professional", "professionals",
    "doctor-led", "licensed professionals", "certified professionals",
    "trained caregivers", "dha-licensed",
]

KW_SERVICE_BUCKETS = {
    "home_nursing":    ["home nursing", "nurse at home", "nursing care", "nursing services",
                        "skilled nursing", "home nurse", "wound care", "wound dressing",
                        "injections at home", "iv therapy"],
    "physiotherapy":   ["physiotherapy", "physical therapy", "physiotherapist",
                        "rehabilitation", "rehab at home", "occupational therapy",
                        "speech therapy"],
    "doctor_support":  ["doctor on call", "doctor at home", "gp at home", "physician at home",
                        "medical consultation", "home visit doctor", "teleconsultation",
                        "telemedicine"],
    "diagnostics":     ["diagnostics", "blood test", "blood tests", "lab test", "lab tests",
                        "sample collection", "home sample", "diagnostic services",
                        "laboratory"],
}

KW_CARE_DEPTH = [
    "elderly", "geriatric", "chronic", "chronic disease", "post-op",
    "post operative", "post-hospital", "recovery", "dementia", "palliative",
    "long-term",
]

KW_DELIVERY_RELIABILITY = [
    "24/7", "on-call", "same-day", "doorstep", "responsive",
    "rapid response", "home visit",
]

KW_AUTHORITY_REPUTATION = [
    "established", "founded", "since", "recognized", "reputable", "leading", "trusted",
]

# Combined marker sets for Identity Consistency
KW_IC_CATEGORY = KW_CATEGORY_CLARITY
KW_IC_TRUST    = KW_TRUST
KW_IC_BREADTH  = [kw for bucket in KW_SERVICE_BUCKETS.values() for kw in bucket]
KW_IC_DEPTH    = KW_CARE_DEPTH


# ─── SCORING FUNCTIONS ────────────────────────────────────────────────────────

def score_keyword_metric(bdf: pd.DataFrame, keywords: list) -> float:
    if bdf.empty:
        return 0.0
    matched = bdf["norm_context"].apply(lambda t: keyword_match(t, keywords))
    matched_hosts = bdf[matched]["host"].nunique()
    total_hosts   = bdf["host"].nunique()
    return prevalence_score(matched.sum(), len(bdf), matched_hosts, total_hosts)


def keyword_metric_breakdown(bdf: pd.DataFrame, keywords: list) -> dict:
    if bdf.empty:
        return dict(own_sn=0, own_sd=0, own_dn=0, own_dd=0,
                    ext_sn=0, ext_sd=0, ext_dn=0, ext_dd=0)
    own = bdf[bdf["is_own"]]
    ext = bdf[~bdf["is_own"]]
    def _calc(sub):
        matched = sub["norm_context"].apply(lambda t: keyword_match(t, keywords))
        return (matched.sum(), len(sub),
                sub[matched]["host"].nunique(), sub["host"].nunique())
    osn, osd, odn, odd = _calc(own)
    esn, esd, edn, edd = _calc(ext)
    return dict(own_sn=osn, own_sd=osd, own_dn=odn, own_dd=odd,
                ext_sn=esn, ext_sd=esd, ext_dn=edn, ext_dd=edd)


def score_authority_source(bdf: pd.DataFrame, all_hosts_freq: Counter) -> float:
    if bdf.empty:
        return 0.0
    brand_hosts = set(bdf["host"])
    # Repeated winner hosts = hosts that appear for ≥ 3 brands overall
    winner_hosts = {h for h, c in all_hosts_freq.items() if c >= 3}
    # 40% repeated winner-host presence
    winner_overlap = len(brand_hosts & winner_hosts)
    winner_score = winner_overlap / max(len(winner_hosts), 1)
    # 25% host diversity (normalised by max across brands)
    host_div = bdf["host"].nunique()
    # 20% domain category diversity
    cat_div = bdf["domain_category"].nunique() if "domain_category" in bdf.columns else 1
    # 15% external share
    ext_count = (~bdf["is_own"]).sum()
    ext_share = ext_count / len(bdf)
    return round(
        100 * (0.40 * winner_score +
               0.25 * min(host_div / 20, 1.0) +
               0.20 * min(cat_div / 6, 1.0) +
               0.15 * ext_share),
        2
    )


def score_service_breadth(bdf: pd.DataFrame) -> tuple:
    if bdf.empty:
        return 0.0, {}
    bucket_scores = {}
    for bucket, kws in KW_SERVICE_BUCKETS.items():
        bucket_scores[bucket] = score_keyword_metric(bdf, kws)
    final = round(sum(bucket_scores.values()) / len(bucket_scores), 2)
    return final, bucket_scores


def score_identity_consistency(bdf: pd.DataFrame) -> float:
    if bdf.empty:
        return 0.0
    # Build boolean packet vector per snippet
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

    # 50% dominant packet strength
    dominant_strength = dominant_count / total

    # 30% cross-domain packet stability
    dominant_rows = bdf[bdf["packet"] == dominant_packet]
    dom_hosts = dominant_rows["host"].nunique()
    all_hosts  = bdf["host"].nunique()
    cross_domain_stability = dom_hosts / max(all_hosts, 1)

    # 20% inverse drift = 1 - normalized entropy
    probs = [c / total for c in packet_counts.values()]
    entropy = -sum(p * math.log2(p) for p in probs if p > 0)
    max_entropy = math.log2(16) if len(packet_counts) > 1 else 1
    inv_drift = 1 - (entropy / max_entropy)

    return round(100 * (0.50 * dominant_strength +
                         0.30 * cross_domain_stability +
                         0.20 * inv_drift), 2)


# ─── BUILD ALL-BRANDS HOST FREQUENCY MAP ──────────────────────────────────────

# For authority source: count how many distinct brands each host serves
host_brand_map: dict = {}
for _, row in df_dedup.iterrows():
    h = row["host"]
    b = row["brand"]
    if h:
        if h not in host_brand_map:
            host_brand_map[h] = set()
        host_brand_map[h].add(b)

all_hosts_brand_freq = Counter({h: len(brands) for h, brands in host_brand_map.items()})


# ─── COMPUTE METRICS PER BRAND ────────────────────────────────────────────────

print("\n[3] Computing metrics ...")

records_scores = []
records_cat_clarity = []
records_trust = []
records_service_breadth = []
records_care_depth = []

for brand in TARGET_BRANDS:
    bdf = df_dedup[df_dedup["brand"] == brand]
    print(f"    {brand}: {len(bdf)} deduped snippets")

    authority_source  = score_authority_source(bdf, all_hosts_brand_freq)
    category_clarity  = score_keyword_metric(bdf, KW_CATEGORY_CLARITY)
    trust             = score_keyword_metric(bdf, KW_TRUST)
    service_breadth, bucket_scores = score_service_breadth(bdf)
    care_depth        = score_keyword_metric(bdf, KW_CARE_DEPTH)
    delivery_rel      = score_keyword_metric(bdf, KW_DELIVERY_RELIABILITY)
    authority_rep     = score_keyword_metric(bdf, KW_AUTHORITY_REPUTATION)
    identity_con      = score_identity_consistency(bdf)

    records_scores.append({
        "brand":                    brand,
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
    records_cat_clarity.append({"brand": brand,
        "own_snippet_num": cc["own_sn"], "own_snippet_den": cc["own_sd"],
        "own_domain_num":  cc["own_dn"], "own_domain_den":  cc["own_dd"],
        "ext_snippet_num": cc["ext_sn"], "ext_snippet_den": cc["ext_sd"],
        "ext_domain_num":  cc["ext_dn"], "ext_domain_den":  cc["ext_dd"],
    })

    tr = keyword_metric_breakdown(bdf, KW_TRUST)
    records_trust.append({"brand": brand,
        "own_snippet_num": tr["own_sn"], "own_snippet_den": tr["own_sd"],
        "own_domain_num":  tr["own_dn"], "own_domain_den":  tr["own_dd"],
        "ext_snippet_num": tr["ext_sn"], "ext_snippet_den": tr["ext_sd"],
        "ext_domain_num":  tr["ext_dn"], "ext_domain_den":  tr["ext_dd"],
    })

    cd = keyword_metric_breakdown(bdf, KW_CARE_DEPTH)
    records_care_depth.append({"brand": brand,
        "own_snippet_num": cd["own_sn"], "own_snippet_den": cd["own_sd"],
        "own_domain_num":  cd["own_dn"], "own_domain_den":  cd["own_dd"],
        "ext_snippet_num": cd["ext_sn"], "ext_snippet_den": cd["ext_sd"],
        "ext_domain_num":  cd["ext_dn"], "ext_domain_den":  cd["ext_dd"],
    })

    sb_row = {"brand": brand}
    for bkt, bkt_score in bucket_scores.items():
        bkt_bdf = bdf.copy()
        bkt_kws = KW_SERVICE_BUCKETS[bkt]
        bkt_own = bdf[bdf["is_own"]]
        bkt_ext = bdf[~bdf["is_own"]]
        def _prev(sub, kws):
            matched = sub["norm_context"].apply(lambda t: keyword_match(t, kws))
            return prevalence_score(matched.sum(), len(sub),
                                    sub[matched]["host"].nunique(), sub["host"].nunique())
        sb_row[f"{bkt}_score"] = bkt_score
        sb_row[f"{bkt}_own_prev"] = _prev(bkt_own, bkt_kws) if not bkt_own.empty else 0.0
        sb_row[f"{bkt}_ext_prev"] = _prev(bkt_ext, bkt_kws) if not bkt_ext.empty else 0.0
    records_service_breadth.append(sb_row)


# ─── TOP AUTHORITY SOURCES ────────────────────────────────────────────────────

print("\n[4] Building top authority sources ...")
auth_records = []
for host, brands_set in host_brand_map.items():
    host_rows = df_dedup[df_dedup["host"] == host]
    total_mentions = len(host_rows)
    distinct_brands = len(brands_set)
    dom_cat = host_rows["domain_category"].mode()[0] if "domain_category" in host_rows.columns and not host_rows.empty else ""
    # Weighted source score: mentions * brand diversity bonus
    weighted = total_mentions * (1 + 0.2 * (distinct_brands - 1))
    auth_records.append({
        "host":                host,
        "domain_category":     dom_cat,
        "total_mentions":      total_mentions,
        "distinct_brands":     distinct_brands,
        "weighted_source_score": round(weighted, 2),
    })

df_authority = pd.DataFrame(auth_records).sort_values("weighted_source_score", ascending=False)


# ─── WRITE OUTPUTS ────────────────────────────────────────────────────────────

print("\n[5] Writing output files ...")

df_scores = pd.DataFrame(records_scores)
df_scores.to_csv(OUTPUT_DIR / "brand_scores.csv", index=False)
print(f"    ✓ {OUTPUT_DIR}/brand_scores.csv")

pd.DataFrame(records_cat_clarity).to_csv(OUTPUT_DIR / "category_clarity_breakdown.csv", index=False)
print(f"    ✓ {OUTPUT_DIR}/category_clarity_breakdown.csv")

pd.DataFrame(records_trust).to_csv(OUTPUT_DIR / "trust_breakdown.csv", index=False)
print(f"    ✓ {OUTPUT_DIR}/trust_breakdown.csv")

pd.DataFrame(records_service_breadth).to_csv(OUTPUT_DIR / "service_breadth_breakdown.csv", index=False)
print(f"    ✓ {OUTPUT_DIR}/service_breadth_breakdown.csv")

pd.DataFrame(records_care_depth).to_csv(OUTPUT_DIR / "care_depth_breakdown.csv", index=False)
print(f"    ✓ {OUTPUT_DIR}/care_depth_breakdown.csv")

df_authority.head(50).to_csv(OUTPUT_DIR / "top_authority_sources.csv", index=False)
print(f"    ✓ {OUTPUT_DIR}/top_authority_sources.csv")


# ─── MARKDOWN REPORT ──────────────────────────────────────────────────────────

print("\n[6] Generating report ...")

metrics = [c for c in df_scores.columns if c != "brand"]
strongest = {m: df_scores.loc[df_scores[m].idxmax(), "brand"] for m in metrics}
weakest   = {m: df_scores.loc[df_scores[m].idxmin(), "brand"] for m in metrics}

# Summary table
col_labels = {
    "authority_source_presence": "Auth Source",
    "category_clarity":           "Cat Clarity",
    "trust":                      "Trust",
    "service_breadth":            "Svc Breadth",
    "care_depth":                 "Care Depth",
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

# Top 3 insights
top_brand_overall = df_scores.set_index("brand")[metrics].mean(axis=1).idxmax()
most_consistent   = df_scores.loc[df_scores["identity_consistency"].idxmax(), "brand"]
widest_service    = df_scores.loc[df_scores["service_breadth"].idxmax(), "brand"]
most_trusted      = df_scores.loc[df_scores["trust"].idxmax(), "brand"]

mode_val = INCLUDE_AI_FALLBACK
data_note = "all snippets (crawled + AI fallback)" if mode_val else "crawled pages only (fetch_status=crawled)"

report = f"""# GEO Healthcare Citation Analysis — Session 77
*Scores are relative to this dataset only, not universal market truth.*
*Data source: {data_note} — {len(df_dedup)} deduped snippets across {TARGET_BRANDS}*

## Summary Scores (0–100)

{header}
{sep}
{chr(10).join(rows_md)}

## Key Insights

- **Broadest AI citation presence:** {top_brand_overall} leads overall when averaging all 8 metrics, reflecting the widest and most consistent footprint across crawled citation pages.
- **Most service-rich messaging:** {widest_service} covers the most service categories in its cited content, suggesting stronger service breadth signalling to AI engines.
- **Trust signal density:** {most_trusted} has the highest density of trust/accreditation language across its cited pages — a key driver of AI authority scoring.

## Strongest Brand by Metric

| Metric | Strongest Brand |
|---|---|
"""
for m, b in strongest.items():
    report += f"| {col_labels[m]} | {b} |\n"

report += "\n## Weakest Brand by Metric\n\n| Metric | Weakest Brand |\n|---|---|\n"
for m, b in weakest.items():
    report += f"| {col_labels[m]} | {b} |\n"

report += f"""
---
> **Note:** These scores are derived from {len(df_dedup)} deduplicated snippets extracted from AI-cited URLs for session 77 (Valeo home healthcare Dubai competitor analysis).
> Scores reflect AI citation context — not clinical quality, market share, or consumer ratings.
"""

(OUTPUT_DIR / "report.md").write_text(report)
print(f"    ✓ {OUTPUT_DIR}/report.md")

print("\n[7] Final scores:")
print(df_scores.to_string(index=False))
print("\nDone.")
