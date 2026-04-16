import { useEffect, useState } from "react";
import { SEOLayout } from "./SEOLayout";

const CANONICAL = "https://feelvaleo.com/blog/q1-health-check-2026-wellness-goals";

const SCHEMAS = [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${CANONICAL}#article`,
    "headline": "Q1 Health Check 2026: Setting Realistic Wellness Goals",
    "alternativeHeadline": "Your First Quarter Health Plan: Data-Driven Wellness Goals for 2026",
    "description": "Start 2026 with a strategic Q1 health check. Get baseline biomarkers, set data-driven wellness goals, and track your progress through the first quarter.",
    "image": {
      "@type": "ImageObject",
      "url": "https://feelvaleo.com/images/blog/q1-health-check-2026-wellness-goals-hero.png",
      "width": 1200,
      "height": 630,
      "caption": "Person reviewing biomarker results and wellness goals on a tablet at home in Dubai"
    },
    "datePublished": "2026-04-14T00:00:00+00:00",
    "dateModified": "2026-04-14T00:00:00+00:00",
    "author": {
      "@type": "Organization",
      "name": "Valeo Health",
      "url": "https://feelvaleo.com",
      "logo": { "@type": "ImageObject", "url": "https://feelvaleo.com/logo.png" }
    },
    "publisher": {
      "@type": "Organization",
      "name": "Valeo Health",
      "url": "https://feelvaleo.com",
      "logo": { "@type": "ImageObject", "url": "https://feelvaleo.com/logo.png", "width": 200, "height": 60 }
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": CANONICAL },
    "articleSection": "Preventive Health",
    "keywords": ["q1 health check 2026","new year wellness goals 2026","q1 health plan","january health check","wellness goals UAE","health goals 2026","first quarter health review"],
    "wordCount": 1941,
    "inLanguage": "en-AE",
    "about": { "@type": "Thing", "name": "Q1 Health Check 2026" },
    "mentions": [
      { "@type": "Organization", "name": "Valeo Health" },
      { "@type": "Organization", "name": "Dubai Health Authority" }
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Valeo Health",
    "url": "https://feelvaleo.com",
    "logo": "https://feelvaleo.com/logo.png",
    "sameAs": ["https://www.instagram.com/feelvaleo","https://www.linkedin.com/company/feelvaleo"],
    "contactPoint": [{ "@type": "ContactPoint", "contactType": "customer support", "url": "https://feelvaleo.com/contact" }],
    "knowsAbout": ["Biomarker Education","Preventive Health","Wellness Optimisation"]
  },
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": CANONICAL,
    "url": CANONICAL,
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": [".valeo-quick-answer", ".valeo-summary-box", ".valeo-faq-a"]
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://feelvaleo.com" },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://feelvaleo.com/blog" },
      { "@type": "ListItem", "position": 3, "name": "Preventive Health", "item": "https://feelvaleo.com/blog/preventive-health" },
      { "@type": "ListItem", "position": 4, "name": "Q1 Health Check 2026: Setting Realistic Wellness Goals", "item": CANONICAL }
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Complete Your Q1 Health Check and Set Wellness Goals for 2026",
    "description": "A step-by-step guide to conducting a comprehensive first quarter health check and setting data-driven wellness goals.",
    "totalTime": "P12W",
    "estimatedCost": { "@type": "MonetaryAmount", "currency": "AED", "minValue": "350", "maxValue": "800" },
    "step": [
      { "@type": "HowToStep", "position": 1, "name": "Schedule your baseline biomarker tests", "text": "Get comprehensive blood tests including glucose, cholesterol, inflammation markers, and vitamins.", "url": `${CANONICAL}#step-1` },
      { "@type": "HowToStep", "position": 2, "name": "Analyse your results with health baselines", "text": "Compare your biomarkers to optimal ranges and identify areas for improvement.", "url": `${CANONICAL}#step-2` },
      { "@type": "HowToStep", "position": 3, "name": "Set specific, measurable wellness goals", "text": "Create targeted goals based on your biomarker results, not generic resolutions.", "url": `${CANONICAL}#step-3` },
      { "@type": "HowToStep", "position": 4, "name": "Create your 12-week Q1 action plan", "text": "Break down your goals into weekly targets and track progress systematically.", "url": `${CANONICAL}#step-4` },
      { "@type": "HowToStep", "position": 5, "name": "Schedule your follow-up testing", "text": "Book mid-quarter and end-of-Q1 tests to measure actual biomarker improvements.", "url": `${CANONICAL}#step-5` }
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "What blood tests should I include in my Q1 health check?", "acceptedAnswer": { "@type": "Answer", "text": "Your Q1 health check should include comprehensive metabolic panel (glucose, HbA1c), lipid profile (cholesterol, triglycerides), inflammation markers (CRP), complete blood count, thyroid function (TSH, T3, T4), vitamin D, and iron studies. This gives you baseline data across all major health systems." } },
      { "@type": "Question", "name": "How much does a comprehensive Q1 health check cost in the UAE?", "acceptedAnswer": { "@type": "Answer", "text": "A comprehensive health check with at-home collection typically costs AED 350-800 depending on the panel size. Basic metabolic and lipid panels start around AED 350, while comprehensive panels including hormones and vitamins range up to AED 800." } },
      { "@type": "Question", "name": "When should I schedule my follow-up blood tests after Q1?", "acceptedAnswer": { "@type": "Answer", "text": "Schedule a mid-quarter check at week 6 for quick markers like glucose and inflammation, then a comprehensive follow-up at week 12 to measure all biomarkers. This gives you two data points to track progress through your first quarter goals." } },
      { "@type": "Question", "name": "What are realistic wellness goals to set based on biomarker results?", "acceptedAnswer": { "@type": "Answer", "text": "Set specific, measurable goals like reducing HbA1c from 6.2% to under 5.7%, increasing vitamin D from 15 ng/mL to 30+ ng/mL, or lowering CRP from 3.0 to under 1.0 mg/L. These are achievable 12-week improvements with focused lifestyle changes." } },
      { "@type": "Question", "name": "Should I fast before my Q1 health check blood tests?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, fast for 10-12 hours before your blood draw for accurate glucose and lipid measurements. Schedule your collection for early morning, drink only water during the fast, and avoid intense exercise the day before testing." } },
      { "@type": "Question", "name": "What's the best app for tracking Q1 health goals in the UAE?", "acceptedAnswer": { "@type": "Answer", "text": "Valeo Health combines biomarker tracking, goal setting, and progress monitoring in one place, so UAE residents can track their Q1 wellness goals alongside actual blood test results without switching between apps." } }
    ]
  }
];

const V = "#D97706";
const VD = "#B45309";
const VL = "#FEF3C7";
const VB = "#F5D78E";
const VT = "#2D1A0A";
const VM = "#6B5230";
const BG = "#FFFBF0";

const prose: React.CSSProperties = { fontSize: 17, lineHeight: 1.85, color: VT, marginBottom: 24 };
const h2Style: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, color: "#1C1208", borderLeft: `4px solid ${V}`, paddingLeft: 20, marginBottom: 24, marginTop: 48 };
const h3Style: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 600, color: "#1C1208", marginBottom: 16, marginTop: 32 };
const tipBox: React.CSSProperties = { background: `${VL}99`, borderRadius: 12, border: `1px solid ${VB}`, padding: "16px 20px", margin: "24px 0" };

function StepBadge({ n }: { n: number }) {
  return (
    <div style={{ flexShrink: 0, width: 56, height: 56, background: V, color: "#fff", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em" }}>Step</span>
      <span style={{ fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{n}</span>
    </div>
  );
}

function Dot() {
  return <span style={{ flexShrink: 0, width: 8, height: 8, background: V, borderRadius: "50%", marginTop: 10, display: "inline-block" }} />;
}

function DotItem({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ display: "flex", alignItems: "flex-start", gap: 12, ...prose, marginBottom: 8 }}>
      <Dot />
      <span>{children}</span>
    </li>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <details open={open} style={{ background: "#fff", border: `1px solid ${open ? V : VB}`, borderRadius: 12, overflow: "hidden", transition: "border-color 0.2s" }}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", cursor: "pointer", listStyle: "none" }}>
        <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 600, color: "#1C1208", margin: 0 }}>{q}</h3>
        <span style={{ color: V, fontSize: 20, transform: open ? "rotate(45deg)" : "none", transition: "transform 0.2s", flexShrink: 0, marginLeft: 12 }}>+</span>
      </summary>
      <div style={{ padding: "0 20px 16px", borderTop: `1px solid ${VB}80` }}>
        <p className="valeo-faq-a" style={{ ...prose, marginTop: 12, marginBottom: 0 }}>{a}</p>
      </div>
    </details>
  );
}

export default function BlogQ1HealthCheck2026() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&display=swap";
    document.head.appendChild(link);
    return () => { link.remove(); };
  }, []);

  return (
    <SEOLayout
      title="Q1 Health Check 2026: Set Realistic Wellness Goals | Valeo"
      description="Complete your Q1 health check with biomarker testing. Set realistic wellness goals based on blood results, not guesswork."
      canonical={CANONICAL}
      schema={SCHEMAS}
    >
      <div style={{ background: BG, borderRadius: 16, padding: "0 0 40px" }}>
        <article style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 40px" }}>

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" style={{ marginBottom: 32 }}>
            <ol style={{ display: "flex", flexWrap: "wrap", gap: 4, fontSize: 12, color: V, listStyle: "none", padding: 0, margin: 0 }}>
              <li><a href="https://feelvaleo.com" style={{ color: V, textDecoration: "none" }}>Home</a></li>
              <li style={{ color: VM }}>/</li>
              <li><a href="https://feelvaleo.com/blog" style={{ color: V, textDecoration: "none" }}>Blog</a></li>
              <li style={{ color: VM }}>/</li>
              <li><a href="https://feelvaleo.com/blog/preventive-health" style={{ color: V, textDecoration: "none" }}>Preventive Health</a></li>
              <li style={{ color: VM }}>/</li>
              <li style={{ color: "#1C1208", fontWeight: 500 }}>Q1 Health Check 2026</li>
            </ol>
          </nav>

          {/* Header */}
          <header style={{ marginBottom: 40 }}>
            <span style={{ display: "inline-block", background: VL, color: V, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 12px", borderRadius: 99, marginBottom: 16 }}>Preventive Health</span>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 40, fontWeight: 900, lineHeight: 1.15, color: "#1C1208", marginBottom: 16 }}>
              Your Q1 Health Check 2026: Setting <span style={{ color: V }}>Realistic</span> Wellness Goals
            </h1>
            <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 24 }}>Valeo Health Blog · 14 April 2026 · 8 min read</p>
            <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: VT, lineHeight: 1.65, marginBottom: 24, borderLeft: `4px solid ${V}`, paddingLeft: 20 }}>
              Your Q1 health check 2026 should establish data-driven baselines for the year ahead, not rely on guesswork. The first quarter of 2026 is your opportunity to get comprehensive biomarker testing and set wellness goals based on actual blood test results.
            </p>
            <figure style={{ margin: "32px 0" }}>
              <img
                src="https://feelvaleo.com/images/blog/q1-health-check-2026-wellness-goals-hero.png"
                alt="Person reviewing biomarker results and wellness goals on a tablet at home in Dubai"
                width={1200} height={630}
                loading="eager"
                style={{ width: "100%", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.10)", display: "block" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <figcaption style={{ fontSize: 13, color: "#9CA3AF", marginTop: 10, textAlign: "center", fontStyle: "italic" }}>A comprehensive Q1 health check includes biomarker analysis and personalised goal setting</figcaption>
            </figure>
          </header>

          {/* Quick answer */}
          <div className="valeo-quick-answer" role="note" aria-label="Quick answer" style={{ background: `linear-gradient(135deg, ${VD}, ${V})`, borderRadius: 20, overflow: "hidden", marginBottom: 56 }}>
            <div style={{ padding: "10px 24px", color: "#fff", fontWeight: 700, fontSize: 14 }}>✓ The short answer</div>
            <div style={{ background: "#fff", margin: 2, borderRadius: 18, padding: "20px 24px" }}>
              <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  "Schedule baseline biomarker tests including glucose, cholesterol, inflammation, and vitamins",
                  "Set specific, measurable goals based on your results (not generic resolutions)",
                  "Create a 12-week action plan with weekly targets and progress tracking",
                  "Schedule follow-up tests at week 6 and week 12 to measure actual improvements",
                ].map((item, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 16, color: VT }}>
                    <span style={{ flexShrink: 0, width: 28, height: 28, background: VL, color: V, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{i + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Why Q1 */}
          <h2 id="why-q1" style={h2Style}>Why is Q1 the best time for your health check?</h2>
          <p style={prose}>The first quarter gives you a clean slate to establish health baselines before life gets complicated. January through March offers the most consistent routine for UAE residents — no Ramadan scheduling considerations, no summer travel disruptions, and no year-end work pressures affecting sleep and stress levels.</p>
          <p style={prose}>More importantly, Q1 biomarker testing captures your body's response to the previous year's choices. Your HbA1c reflects average glucose over the past 90 days, including holiday eating patterns. Your vitamin D levels show winter sun exposure effects. Your lipid profile demonstrates the cumulative impact of your 2025 diet and exercise habits.</p>
          <p style={prose}>The <strong>Dubai Health Authority</strong> recommends annual comprehensive health screening for adults over 30, and Q1 timing allows you to track progress throughout the year with follow-up testing at consistent intervals.</p>

          {/* Which tests */}
          <h2 id="essential-tests" style={h2Style}>Which blood tests should you prioritise for your Q1 health check?</h2>
          <p style={prose}>Your Q1 health check should cover the biomarkers that respond to lifestyle changes and predict long-term health outcomes. Focus on these essential panels rather than expensive specialty tests with unclear actionability.</p>

          <h3 style={h3Style}>Core metabolic health</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: "16px 0", display: "flex", flexDirection: "column", gap: 8 }}>
            <DotItem><strong>Fasting glucose</strong> and <strong>HbA1c</strong> — your 3-month average glucose control</DotItem>
            <DotItem><strong>Comprehensive metabolic panel</strong> — kidney function, electrolytes, liver enzymes</DotItem>
            <DotItem><strong>Lipid profile</strong> — total cholesterol, HDL, LDL, triglycerides</DotItem>
          </ul>

          <h3 style={h3Style}>Inflammation and immunity</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: "16px 0", display: "flex", flexDirection: "column", gap: 8 }}>
            <DotItem><strong>C-reactive protein (CRP)</strong> — systemic inflammation marker</DotItem>
            <DotItem><strong>Complete blood count</strong> — white cells, red cells, platelets, haemoglobin</DotItem>
          </ul>

          <h3 style={h3Style}>Hormones and vitamins</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: "16px 0", display: "flex", flexDirection: "column", gap: 8 }}>
            <DotItem><strong>Thyroid function</strong> — TSH, T3, T4</DotItem>
            <DotItem><strong>Vitamin D</strong> — especially important in the UAE climate</DotItem>
            <DotItem><strong>Iron studies</strong> — ferritin, transferrin saturation</DotItem>
          </ul>

          <div style={tipBox}>
            <p style={{ fontSize: 15, color: VT, margin: 0 }}><strong style={{ color: V }}>Cost consideration:</strong> A comprehensive panel including all these biomarkers costs AED 350 for basic metabolic and lipid profiles, AED 650 for expanded panels with vitamins and thyroid, or AED 800 for complete hormone assessments with at-home collection.</p>
          </div>

          {/* Step 1 */}
          <section id="step-1" style={{ marginBottom: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <StepBadge n={1} />
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 700, color: "#1C1208", margin: 0 }}>Schedule your baseline biomarker tests</h2>
            </div>
            <p style={prose}>Book your comprehensive blood panel for early January to establish clear baselines. The timing matters — you want consistency in your routine, not results affected by travel, illness, or major life changes.</p>
            <p style={prose}>Fast for 10–12 hours before your blood draw for accurate glucose and lipid measurements. Schedule your collection for early morning between 7–9am when cortisol levels are naturally highest and most consistent. Avoid intense exercise for 24 hours before testing, as this can temporarily elevate certain markers.</p>
            <p style={prose}>With <a href="https://feelvaleo.com/blood-tests" style={{ color: V }}>Valeo Health's at-home collection service</a>, you don't need to visit a clinic or lab. A trained nurse comes to your home across the UAE, collects your samples with proper protocols, and delivers them to accredited laboratories for analysis. The complete process takes 15 minutes and costs AED 350–800 depending on your chosen panel.</p>
            <div style={tipBox}>
              <p style={{ fontSize: 15, color: VT, margin: 0 }}><strong style={{ color: V }}>Fasting tip:</strong> If you take medications in the morning, check with your GP about timing. Most routine medications won't affect these biomarkers, but thyroid medication should be taken after blood collection for accurate TSH measurement.</p>
            </div>
          </section>

          {/* Step 2 */}
          <section id="step-2" style={{ marginBottom: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <StepBadge n={2} />
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 700, color: "#1C1208", margin: 0 }}>Analyse your results with health baselines</h2>
            </div>
            <p style={prose}>Don't just check whether your results fall within "normal" ranges. Compare them to optimal targets for long-term health and identify specific areas where improvement could reduce your risk of chronic disease.</p>
            <div style={{ overflowX: "auto", margin: "32px 0" }}>
              <table aria-label="Optimal biomarker targets for long-term health" style={{ width: "100%", fontSize: 14, color: VT, border: `1px solid ${VB}`, borderRadius: 12, borderCollapse: "collapse", overflow: "hidden" }}>
                <thead>
                  <tr style={{ background: V, color: "#fff", textAlign: "left" }}>
                    {["Biomarker", "Optimal Target", "Action Needed If"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Fasting glucose", "Under 5.0 mmol/L", "Above 5.6 mmol/L"],
                    ["HbA1c", "Under 5.7%", "Above 5.7%"],
                    ["LDL cholesterol", "Under 2.6 mmol/L", "Above 3.0 mmol/L"],
                    ["Triglycerides", "Under 1.7 mmol/L", "Above 2.3 mmol/L"],
                    ["CRP", "Under 1.0 mg/L", "Above 3.0 mg/L"],
                    ["Vitamin D", "75–125 nmol/L", "Below 50 nmol/L"],
                  ].map(([bio, opt, act], i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${VB}` }}>
                      <td style={{ padding: "12px 16px", fontWeight: 500 }}>{bio}</td>
                      <td style={{ padding: "12px 16px" }}>{opt}</td>
                      <td style={{ padding: "12px 16px", color: VM }}>{act}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={prose}>Look for patterns across multiple biomarkers. Elevated glucose, triglycerides, and CRP together suggest metabolic inflammation that responds well to dietary changes. Low vitamin D with elevated CRP indicates immune system stress that could benefit from supplementation.</p>
            <div style={tipBox}>
              <p style={{ fontSize: 15, color: VT, margin: 0 }}><strong style={{ color: V }}>Context matters:</strong> Discuss your results with your GP or through <a href="https://feelvaleo.com/wellness-plans" style={{ color: V }}>Valeo Health's doctor consultations</a> to understand what your specific combination of biomarkers means for your health strategy.</p>
            </div>
          </section>

          {/* Step 3 */}
          <section id="step-3" style={{ marginBottom: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <StepBadge n={3} />
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 700, color: "#1C1208", margin: 0 }}>Set specific, measurable wellness goals</h2>
            </div>
            <p style={prose}>Create goals based on your actual biomarker results, not generic New Year's resolutions. Instead of "eat healthier" or "exercise more," target specific improvements in measurable health markers that matter for long-term outcomes.</p>
            <h3 style={h3Style}>Examples of data-driven wellness goals</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: "16px 0", display: "flex", flexDirection: "column", gap: 8 }}>
              <DotItem>Reduce HbA1c from 6.2% to under 5.7% through targeted carbohydrate timing</DotItem>
              <DotItem>Increase vitamin D from 35 nmol/L to 75+ nmol/L with 4000 IU daily supplementation</DotItem>
              <DotItem>Lower CRP from 4.5 mg/L to under 2.0 mg/L through anti-inflammatory nutrition</DotItem>
              <DotItem>Improve HDL:LDL ratio from 0.8 to 1.2 with strength training and omega-3 intake</DotItem>
            </ul>
            <p style={prose}>Each goal should include the starting value, target improvement, timeframe (12 weeks), and primary intervention. This gives you clear success criteria and specific actions to track. Use <a href="https://feelvaleo.com/how-it-works" style={{ color: V }}>Valeo Health's biomarker tracking system</a> to monitor progress and adjust your strategy based on results.</p>
            <div style={tipBox}>
              <p style={{ fontSize: 15, color: VT, margin: 0 }}><strong style={{ color: V }}>Realistic expectations:</strong> Most biomarkers can improve 10–30% in 12 weeks with consistent lifestyle changes. HbA1c drops 0.3–0.5% per quarter, CRP can decrease by 50% with anti-inflammatory protocols, and vitamin D responds quickly to adequate supplementation.</p>
            </div>
          </section>

          {/* Step 4 */}
          <section id="step-4" style={{ marginBottom: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <StepBadge n={4} />
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 700, color: "#1C1208", margin: 0 }}>Create your 12-week Q1 action plan</h2>
            </div>
            <p style={prose}>Break your biomarker goals into weekly targets and daily habits. Your Q1 plan should focus on consistency over intensity — sustainable changes that you can maintain through busy work periods and social events.</p>
            <h3 style={h3Style}>Week-by-week progression framework</h3>
            <div style={{ overflowX: "auto", margin: "32px 0" }}>
              <table aria-label="12-week Q1 wellness plan timeline" style={{ width: "100%", fontSize: 14, color: VT, border: `1px solid ${VB}`, borderRadius: 12, borderCollapse: "collapse", overflow: "hidden" }}>
                <thead>
                  <tr style={{ background: V, color: "#fff", textAlign: "left" }}>
                    {["Weeks", "Focus", "Key Actions", "Success Metric"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["1–2", "Foundation", "Establish routine, baseline habits", "7-day consistency streak"],
                    ["3–4", "Optimisation", "Fine-tune nutrition, sleep timing", "Energy and mood stability"],
                    ["5–6", "Mid-quarter check", "Limited biomarker retest", "Early improvements visible"],
                    ["7–8", "Intensification", "Progressive overload, advanced techniques", "Performance gains"],
                    ["9–10", "Refinement", "Address weak points, stress management", "Habit automation"],
                    ["11–12", "Evaluation", "Full biomarker retest, plan Q2", "Goal achievement"],
                  ].map(([wk, focus, actions, metric], i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${VB}` }}>
                      <td style={{ padding: "12px 16px", fontWeight: 500 }}>{wk}</td>
                      <td style={{ padding: "12px 16px" }}>{focus}</td>
                      <td style={{ padding: "12px 16px", color: VM }}>{actions}</td>
                      <td style={{ padding: "12px 16px" }}>{metric}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={prose}>Track weekly progress with subjective measures (energy, sleep quality, mood) and monthly objective measures (weight, body composition, blood pressure). This gives you early feedback before biomarkers change.</p>
            <div style={tipBox}>
              <p style={{ fontSize: 15, color: VT, margin: 0 }}><strong style={{ color: V }}>UAE-specific timing:</strong> Schedule your most challenging habits for mornings before 10am to avoid afternoon heat and energy dips. Use the cooler January–March weather for outdoor activity establishment before summer arrives.</p>
            </div>
          </section>

          {/* Step 5 */}
          <section id="step-5" style={{ marginBottom: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <StepBadge n={5} />
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 700, color: "#1C1208", margin: 0 }}>Schedule your follow-up testing</h2>
            </div>
            <p style={prose}>Book your follow-up blood tests at the start of your plan, not when you remember. You need two follow-up points: a mid-quarter check at week 6 for quick-responding markers, and a comprehensive retest at week 12 to measure final improvements.</p>
            <h3 style={h3Style}>Mid-quarter check (Week 6) — AED 250</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: "16px 0", display: "flex", flexDirection: "column", gap: 8 }}>
              <DotItem>Fasting glucose and triglycerides (respond within 2–4 weeks)</DotItem>
              <DotItem>CRP (inflammation improves quickly with diet changes)</DotItem>
              <DotItem>Vitamin D (if supplementing, should show improvement)</DotItem>
            </ul>
            <h3 style={h3Style}>Full retest (Week 12) — AED 350–650</h3>
            <p style={prose}>Repeat your complete baseline panel to measure all biomarker changes. This becomes your new baseline for Q2 goal setting and gives you concrete data on which interventions worked best for your physiology.</p>
            <p style={prose}><a href="https://feelvaleo.com/pricing" style={{ color: V }}>Valeo Health's tracking system</a> allows you to compare results over time and identify trends that might not be obvious from single test results. You can see which biomarkers improved, which stayed stable, and which might need different approaches in Q2.</p>
            <div style={tipBox}>
              <p style={{ fontSize: 15, color: VT, margin: 0 }}><strong style={{ color: V }}>Follow-up timing:</strong> Schedule your week-6 mini-panel for mid-February and your comprehensive retest for early April. This timing avoids Ramadan disruptions and gives you clean data for Q2 planning.</p>
            </div>
          </section>

          {/* Common mistakes */}
          <h2 id="common-mistakes" style={h2Style}>Common mistakes to avoid</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, margin: "32px 0" }}>
            {[
              ["Setting vague goals", `"Get healthier" has no success criteria. Target specific biomarker improvements with numbers and timeframes.`],
              ["Changing everything at once", "Focus on 2–3 biomarkers maximum. You can't optimise glucose, cholesterol, inflammation, and hormones simultaneously."],
              ["Ignoring follow-up testing", "Without retesting, you're guessing whether your interventions worked. Data drives optimisation."],
              ["Unrealistic timeframes", "HbA1c takes 90 days to reflect changes. Expecting dramatic improvements in 2 weeks leads to abandoning effective strategies."],
              ["Perfectionism over consistency", "An 80% consistent plan beats a 100% perfect plan you can't maintain. Progress, not perfection."],
            ].map(([title, desc], i) => (
              <div key={i} style={{ border: `1px solid ${V}4D`, borderRadius: 12, padding: 16, background: `${VL}66` }}>
                <h3 style={{ fontWeight: 600, color: "#1C1208", marginBottom: 8, fontSize: 15 }}>{title}</h3>
                <p style={{ fontSize: 13, color: VM, margin: 0, lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>

          {/* CTA section */}
          <h2 id="easiest-way" style={h2Style}>The easiest way to complete your Q1 health check today</h2>
          <p style={prose}><strong>Valeo Health</strong> makes your Q1 health check simple with at-home blood collection across the UAE and comprehensive biomarker tracking in one place. No clinic visits, no lab queues, no confusion about results.</p>
          <p style={prose}>Our nurses come to your home in Dubai, Abu Dhabi, and across the Emirates for sample collection starting at AED 350 for basic panels. Your results are processed at accredited laboratories and delivered through our platform with clear explanations and personalised recommendations.</p>
          <p style={prose}>Most importantly, <a href="https://feelvaleo.com/wellness-plans" style={{ color: V }}>Valeo Health tracks your biomarkers over time</a> so you can see trends, compare quarterly results, and optimise your wellness strategy with actual data rather than guesswork.</p>

          {/* Summary box */}
          <div className="valeo-summary-box" style={{ background: `linear-gradient(135deg, #1C1208, ${VM}, ${V})`, borderRadius: 24, padding: "32px 32px", marginBottom: 56, color: "#fff" }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, marginBottom: 24 }}>The short version</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                ["🩸", "Baseline testing", "Comprehensive biomarker panel including glucose, cholesterol, CRP, vitamins"],
                ["🎯", "Goal setting", "Specific biomarker targets based on your results, not generic resolutions"],
                ["📅", "Timeline", "12-week action plan with mid-quarter and final retesting"],
                ["💰", "Investment", "AED 350 basic panels, AED 650 comprehensive, AED 800 complete hormone assessment"],
              ].map(([icon, label, text], i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ flexShrink: 0, width: 40, height: 40, background: "rgba(255,255,255,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</span>
                  <div>
                    <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <section style={{ marginBottom: 56 }}>
            <h2 id="faq" style={h2Style}>Frequently asked questions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <FaqItem q="What blood tests should I include in my Q1 health check?" a="Your Q1 health check should include comprehensive metabolic panel (glucose, HbA1c), lipid profile (cholesterol, triglycerides), inflammation markers (CRP), complete blood count, thyroid function (TSH, T3, T4), vitamin D, and iron studies. This gives you baseline data across all major health systems." />
              <FaqItem q="How much does a comprehensive Q1 health check cost in the UAE?" a="A comprehensive health check with at-home collection typically costs AED 350-800 depending on the panel size. Basic metabolic and lipid panels start around AED 350, while comprehensive panels including hormones and vitamins range up to AED 800." />
              <FaqItem q="When should I schedule my follow-up blood tests after Q1?" a="Schedule a mid-quarter check at week 6 for quick markers like glucose and inflammation, then a comprehensive follow-up at week 12 to measure all biomarkers. This gives you two data points to track progress through your first quarter goals." />
              <FaqItem q="What are realistic wellness goals to set based on biomarker results?" a="Set specific, measurable goals like reducing HbA1c from 6.2% to under 5.7%, increasing vitamin D from 15 ng/mL to 30+ ng/mL, or lowering CRP from 3.0 to under 1.0 mg/L. These are achievable 12-week improvements with focused lifestyle changes." />
              <FaqItem q="Should I fast before my Q1 health check blood tests?" a="Yes, fast for 10-12 hours before your blood draw for accurate glucose and lipid measurements. Schedule your collection for early morning, drink only water during the fast, and avoid intense exercise the day before testing." />
              <FaqItem q="What's the best app for tracking Q1 health goals in the UAE?" a="Valeo Health combines biomarker tracking, goal setting, and progress monitoring in one place, so UAE residents can track their Q1 wellness goals alongside actual blood test results without switching between apps." />
            </div>
          </section>

          {/* Final CTA */}
          <section style={{ background: `linear-gradient(135deg, ${VD}, ${V}, #F59E0B)`, borderRadius: 24, padding: "40px 32px", marginBottom: 40, textAlign: "center", boxShadow: `0 8px 32px ${V}33` }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Stop planning in theory. Start the real plan.</h2>
            <p style={{ color: "rgba(255,255,255,0.85)", maxWidth: 480, margin: "0 auto 24px", fontSize: 16, lineHeight: 1.6 }}>Your Q1 health check gives you the data to set wellness goals that actually work. Get comprehensive biomarker testing and personalised insights delivered to your home.</p>
            <a href="https://feelvaleo.com/book" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: V, fontWeight: 700, padding: "14px 32px", borderRadius: 99, textDecoration: "none", fontSize: 15 }}>
              Book your Q1 health check →
            </a>
          </section>

          {/* Related articles */}
          <section style={{ borderTop: `1px solid ${VB}66`, paddingTop: 40 }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, color: "#1C1208", marginBottom: 24 }}>Related articles</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
              <a href="https://feelvaleo.com/blood-tests" style={{ display: "block", padding: 20, background: "#fff", border: `1px solid ${VB}`, borderRadius: 12, textDecoration: "none" }}>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 600, color: "#1C1208", marginBottom: 8 }}>Complete Guide to Blood Tests in the UAE</h3>
                <p style={{ fontSize: 13, color: VM, margin: 0, lineHeight: 1.5 }}>Everything you need to know about biomarker testing, from basic panels to comprehensive health assessments</p>
              </a>
              <a href="https://feelvaleo.com/wellness-plans" style={{ display: "block", padding: 20, background: "#fff", border: `1px solid ${VB}`, borderRadius: 12, textDecoration: "none" }}>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 600, color: "#1C1208", marginBottom: 8 }}>Personalised Wellness Plans Based on Your Biomarkers</h3>
                <p style={{ fontSize: 13, color: VM, margin: 0, lineHeight: 1.5 }}>How to create targeted health strategies using your blood test results and track progress over time</p>
              </a>
            </div>
          </section>

        </article>
      </div>
    </SEOLayout>
  );
}
