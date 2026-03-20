/**
 * Step 7 — Static methodology pages.
 *
 * Three non-optional trust anchors linked from every query page:
 *   /methodology
 *   /about-the-data
 *   /how-rankings-work
 *
 * All return complete server-rendered HTML (not React SPA).
 * Cache-Control: public, max-age=86400 (24 h — content rarely changes)
 */

import type { Express, Request, Response } from "express";

// ─── Shared CSS ───────────────────────────────────────────────────

const BASE_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #070d1a; color: #e2e8f0; font-family: Inter, system-ui, sans-serif; line-height: 1.7; }
  a { color: #818cf8; text-decoration: none; }
  a:hover { color: #a5b4fc; }
  nav { border-bottom: 1px solid rgba(255,255,255,0.06); padding: 14px 28px; display: flex; align-items: center; gap: 8px; }
  .logo-icon { width: 28px; height: 28px; border-radius: 7px; background: linear-gradient(135deg,#3b82f6,#7c3aed); display: flex; align-items: center; justify-content: center; font-size: 14px; }
  .brand { font-weight: 600; font-size: 14px; color: #fff; }
  .brand span { color: #60a5fa; font-weight: 300; }
  .breadcrumb { padding: 12px 28px; font-size: 12px; color: #475569; }
  .breadcrumb a { color: #475569; }
  main { max-width: 780px; margin: 0 auto; padding: 32px 28px 80px; }
  h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; color: #f8fafc; margin-bottom: 6px; }
  .lead { font-size: 15px; color: #64748b; margin-bottom: 36px; }
  h2 { font-size: 15px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin: 32px 0 12px; }
  p { font-size: 14px; color: #94a3b8; margin-bottom: 14px; line-height: 1.75; }
  .card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 20px 24px; margin-bottom: 16px; }
  .card h3 { font-size: 14px; font-weight: 600; color: #e2e8f0; margin-bottom: 8px; }
  .card p { margin: 0; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
  th { text-align: left; padding: 8px 12px; background: rgba(255,255,255,0.03); color: #475569; font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.06); }
  td { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #94a3b8; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  .score-row td:nth-child(2) { color: #a5b4fc; font-family: monospace; }
  .tag { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; background: rgba(99,102,241,0.1); color: #818cf8; border: 1px solid rgba(99,102,241,0.15); margin-right: 4px; }
  .meth-nav { display: flex; gap: 12px; margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.05); flex-wrap: wrap; }
  .meth-nav a { font-size: 12px; color: #374151; }
  .meth-nav a:hover { color: #64748b; }
  .meth-nav a.active { color: #818cf8; }
`;

function shell(opts: {
  title: string;
  canonical: string;
  activePath: string;
  body: string;
}): string {
  const { title, canonical, activePath, body } = opts;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | AnswerMonk</title>
  <meta name="description" content="${title} — how AnswerMonk measures AI search visibility and produces rankings.">
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="${canonical}">
  <style>${BASE_CSS}</style>
</head>
<body>
  <nav>
    <div class="logo-icon">✦</div>
    <span class="brand">AnswerMonk</span>
  </nav>
  <div class="breadcrumb">
    <a href="/">Home</a> › <a href="/directory">Directory</a> › ${title}
  </div>
  <main>
    ${body}
    <div class="meth-nav">
      <a href="/methodology" ${activePath === "/methodology" ? 'class="active"' : ""}>Methodology</a>
      <a href="/about-the-data" ${activePath === "/about-the-data" ? 'class="active"' : ""}>About the Data</a>
      <a href="/how-rankings-work" ${activePath === "/how-rankings-work" ? 'class="active"' : ""}>How Rankings Work</a>
    </div>
  </main>
</body>
</html>`;
}

// ─── /methodology ─────────────────────────────────────────────────

function methodologyHtml(base: string): string {
  return shell({
    title: "Methodology",
    canonical: `${base}/methodology`,
    activePath: "/methodology",
    body: `
<h1>Methodology</h1>
<p class="lead">How AnswerMonk measures AI search visibility across ChatGPT, Claude, Gemini and Perplexity.</p>

<h2>Overview</h2>
<p>AnswerMonk runs structured prompt sets across four major AI engines and records which brands appear, their position, and the sources cited. Rankings are derived from appearance frequency — not paid placement or manual curation.</p>

<h2>Prompt Design</h2>
<div class="card">
  <h3>Intent-based prompt sets</h3>
  <p>Each segment is tested with 18 intent-based queries spanning awareness, consideration, and decision stages. Prompts are written to reflect real buyer language — not keyword-stuffed test queries.</p>
</div>
<div class="card">
  <h3>Engine rotation</h3>
  <p>The same prompts are run across ChatGPT, Claude, Gemini, and Perplexity in the same cohort window. This captures engine-specific biases and surfaces brands that appear consistently vs. those that rely on a single engine.</p>
</div>

<h2>Scoring</h2>
<table>
  <thead><tr><th>Signal</th><th>Weight</th><th>What it captures</th></tr></thead>
  <tbody class="score-row">
    <tr><td>Appearance rate</td><td>+2</td><td>% of prompts the brand appeared in (primary signal)</td></tr>
    <tr><td>Authority source present</td><td>+2</td><td>A recognised authority domain cited the brand</td></tr>
    <tr><td>Repeated appearance (3+ prompts)</td><td>+2</td><td>Consistency across prompt variants</td></tr>
    <tr><td>Structured entity signals</td><td>+1</td><td>Brand has extractable metadata across engines</td></tr>
  </tbody>
</table>

<h2>Publication threshold</h2>
<p>A query page is eligible for publication only when <code>evidence_score ≥ 3</code> AND <code>brand_count ≥ 3</code>. Pages that fail the gate are kept as drafts and may be published manually with a logged reason.</p>

<h2>Authority domains</h2>
<p>AnswerMonk recognises a curated set of authority domains — regulatory bodies, established review platforms, government health authorities, and major media — as high-signal citation sources. These include: <span class="tag">dha.gov.ae</span><span class="tag">g2.com</span><span class="tag">reddit.com</span><span class="tag">capterra.com</span><span class="tag">haad.ae</span> and others.</p>
`,
  });
}

// ─── /about-the-data ──────────────────────────────────────────────

function aboutTheDataHtml(base: string): string {
  return shell({
    title: "About the Data",
    canonical: `${base}/about-the-data`,
    activePath: "/about-the-data",
    body: `
<h1>About the Data</h1>
<p class="lead">What the data is, where it comes from, what it does not claim to measure, and how it is versioned.</p>

<h2>What this data is</h2>
<p>Every ranking on this platform is derived from structured AI prompt analysis. When you see "Vestacare — 83% AI visibility", it means: across the 18 prompts run in this cohort, Vestacare appeared in 83% of AI responses for that query segment.</p>
<p>This is a measure of AI search visibility — not market share, revenue, customer satisfaction, or any other business metric.</p>

<h2>What this data is not</h2>
<div class="card">
  <h3>Not an endorsement</h3>
  <p>Ranking highly in AI search results does not mean a brand is better than its competitors. It means the brand has stronger digital visibility signals that AI engines currently favour.</p>
</div>
<div class="card">
  <h3>Not real-time</h3>
  <p>Each dataset has an analysis window (e.g. "February – March 2026"). Rankings reflect AI behaviour during that window. AI engines change their training and retrieval behaviour frequently — a brand ranked #1 today may rank differently next quarter.</p>
</div>
<div class="card">
  <h3>Not exhaustive</h3>
  <p>AnswerMonk analyses the brands that appear in AI responses. Brands not mentioned by AI engines are not ranked — their absence is itself a signal of low AI visibility, not necessarily low quality.</p>
</div>

<h2>Data versioning</h2>
<p>Every published page includes a <strong>data version</strong> identifier (e.g. <code>v3 · Cohort 03-2026</code>). When rankings are updated, a new version is created rather than overwriting old data. Historical versions are retained for comparison.</p>

<h2>Analysis engines</h2>
<table>
  <thead><tr><th>Engine</th><th>Type</th></tr></thead>
  <tbody>
    <tr><td>ChatGPT (GPT-4o)</td><td>Generative — synthesis</td></tr>
    <tr><td>Claude (Sonnet)</td><td>Generative — synthesis</td></tr>
    <tr><td>Gemini</td><td>Generative — retrieval-augmented</td></tr>
    <tr><td>Perplexity</td><td>Retrieval-augmented — source-cited</td></tr>
  </tbody>
</table>
`,
  });
}

// ─── /how-rankings-work ───────────────────────────────────────────

function howRankingsWorkHtml(base: string): string {
  return shell({
    title: "How Rankings Work",
    canonical: `${base}/how-rankings-work`,
    activePath: "/how-rankings-work",
    body: `
<h1>How Rankings Work</h1>
<p class="lead">A step-by-step explanation of how a brand moves from AI response to a ranked position on this platform.</p>

<h2>Step 1 — Prompt generation</h2>
<p>For each query segment (e.g. "home healthcare dubai"), 18 intent-based prompts are generated spanning awareness, comparison, and decision intent. Prompts use real buyer language — no keyword manipulation.</p>

<h2>Step 2 — Multi-engine execution</h2>
<p>All 18 prompts are run across ChatGPT, Claude, Gemini and Perplexity within the same analysis window. Each response is parsed to extract brand mentions, position, and cited sources.</p>

<h2>Step 3 — Appearance rate calculation</h2>
<div class="card">
  <h3>Formula</h3>
  <p><code>appearance_rate = prompts_brand_appeared_in ÷ total_prompts_run</code></p>
  <p style="margin-top:10px;">Example: if Vestacare appeared in 15 of 18 prompts → <strong>83% appearance rate</strong>.</p>
</div>

<h2>Step 4 — Evidence scoring</h2>
<table>
  <thead><tr><th>Signal</th><th>Points</th></tr></thead>
  <tbody class="score-row">
    <tr><td>Citation frequency data present</td><td>+2</td></tr>
    <tr><td>Named authority-source cited</td><td>+2</td></tr>
    <tr><td>Brand appears in 3+ distinct prompts</td><td>+2</td></tr>
    <tr><td>Structured entity signals detected</td><td>+1</td></tr>
  </tbody>
</table>
<p>Maximum possible score: <strong>7</strong>. Publication threshold: <strong>≥ 3</strong>.</p>

<h2>Step 5 — Quality gate</h2>
<p>A query page only publishes when <strong>both</strong> conditions are met:</p>
<div class="card">
  <h3>Condition 1 — Evidence score ≥ 3</h3>
  <p>At least one strong signal (authority source or repeated appearance) must be present.</p>
</div>
<div class="card">
  <h3>Condition 2 — Brand count ≥ 3</h3>
  <p>At least 3 distinct brands must appear in the results. Single-brand pages are not published.</p>
</div>

<h2>Step 6 — Slug locking</h2>
<p>Once a page is published, its URL (<code>/best-home-healthcare-dubai</code>) is locked permanently. If normalisation rules change in future, existing published pages retain their original URL to preserve all external citations and inbound links.</p>

<h2>Step 7 — Versioning</h2>
<p>When rankings are updated (new analysis cohort), a new version row is created. The page displays the latest version. Historical data is retained — older rankings are never deleted.</p>

<h2>Ranking tiers</h2>
<table>
  <thead><tr><th>Appearance rate</th><th>Label</th></tr></thead>
  <tbody>
    <tr><td>75% +</td><td>High Visibility</td></tr>
    <tr><td>50% – 74%</td><td>Moderate</td></tr>
    <tr><td>Below 50%</td><td>Low Visibility</td></tr>
  </tbody>
</table>
`,
  });
}

// ─── Route registration ───────────────────────────────────────────

export function registerMethodologyRoutes(app: Express): void {
  const respond = (html: string, res: Response) =>
    res
      .set("Content-Type", "text/html; charset=utf-8")
      .set("Cache-Control", "public, max-age=86400")
      .status(200)
      .send(html);

  app.get("/methodology", (req: Request, res: Response) => {
    const base = `${req.protocol}://${req.headers.host}`;
    respond(methodologyHtml(base), res);
  });

  app.get("/about-the-data", (req: Request, res: Response) => {
    const base = `${req.protocol}://${req.headers.host}`;
    respond(aboutTheDataHtml(base), res);
  });

  app.get("/how-rankings-work", (req: Request, res: Response) => {
    const base = `${req.protocol}://${req.headers.host}`;
    respond(howRankingsWorkHtml(base), res);
  });
}
