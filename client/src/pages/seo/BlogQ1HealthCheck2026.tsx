import { useEffect, useState } from "react";
import { SEOLayout } from "./SEOLayout";

const CANONICAL = "https://feelvaleo.com/blog/q1-health-check-2026-wellness-goals";

const SCHEMAS = [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${CANONICAL}#article`,
    "headline": "Your Q1 Health Check: Setting Realistic Wellness Goals for 2026",
    "alternativeHeadline": "Q1 Health Check 2026: Setting Realistic Wellness Goals",
    "description": "Get your Q1 health check 2026 with blood tests, biomarker goals, and 12-week action plan. AED 299-599 UAE pricing.",
    "image": {
      "@type": "ImageObject",
      "url": "https://feelvaleo.com/images/blog/q1-health-check-2026-wellness-goals-hero.png",
      "width": 1200,
      "height": 630,
      "caption": "Person reviewing blood test results with wellness planning materials on a desk"
    },
    "datePublished": "2026-04-16T00:00:00+00:00",
    "dateModified": "2026-04-16T00:00:00+00:00",
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
    "keywords": ["q1 health check 2026","new year wellness goals 2026","q1 health plan","january health check","wellness goals UAE","health goals 2026"],
    "wordCount": 2850,
    "inLanguage": "en-AE",
    "about": { "@type": "Thing", "name": "Q1 Health Check Planning" },
    "mentions": [
      { "@type": "Organization", "name": "DHA" },
      { "@type": "Organization", "name": "Valeo Health" }
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Valeo Health",
    "url": "https://feelvaleo.com",
    "logo": "https://feelvaleo.com/logo.png",
    "slogan": "",
    "foundingDate": "",
    "sameAs": ["https://www.instagram.com/feelvaleo","https://www.linkedin.com/company/feelvaleo"],
    "contactPoint": [{ "@type": "ContactPoint", "contactType": "customer support", "url": "https://feelvaleo.com/contact" }],
    "knowsAbout": ["Biomarker Education","Preventive Health","Wellness Optimisation"],
    "founder": { "@type": "Person", "name": "", "jobTitle": "Founder", "url": "https://feelvaleo.com/about" }
  },
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": CANONICAL,
    "url": CANONICAL,
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": [".quick-answer", ".summary-box", ".faq-a"]
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://feelvaleo.com" },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://feelvaleo.com/blog" },
      { "@type": "ListItem", "position": 3, "name": "Your Q1 Health Check: Setting Realistic Wellness Goals for 2026", "item": CANONICAL }
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Set Up Your Q1 Health Check for 2026",
    "description": "A complete guide to planning and executing your first quarter health check with realistic wellness goals",
    "totalTime": "P12W",
    "estimatedCost": { "@type": "MonetaryAmount", "currency": "AED", "minValue": "299", "maxValue": "599" },
    "step": [
      { "@type": "HowToStep", "position": 1, "name": "Plan your baseline blood test", "text": "Book comprehensive panels including CBC, lipids, glucose, and vitamins for January testing", "url": `${CANONICAL}#step-1` },
      { "@type": "HowToStep", "position": 2, "name": "Set realistic wellness goals", "text": "Use your baseline biomarkers to establish specific, measurable health targets", "url": `${CANONICAL}#step-2` },
      { "@type": "HowToStep", "position": 3, "name": "Create your 12-week action plan", "text": "Map out weekly milestones focusing on lifestyle changes that impact your biomarkers", "url": `${CANONICAL}#step-3` },
      { "@type": "HowToStep", "position": 4, "name": "Track your progress weekly", "text": "Monitor symptoms, energy levels, and habits while working towards your Q1 goals", "url": `${CANONICAL}#step-4` },
      { "@type": "HowToStep", "position": 5, "name": "Schedule your follow-up test", "text": "Book your 12-week retest to measure biomarker changes and adjust your wellness plan", "url": `${CANONICAL}#step-5` }
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "What blood tests should I include in my Q1 health check?", "acceptedAnswer": { "@type": "Answer", "text": "Your Q1 health check should include a complete blood count (CBC), comprehensive metabolic panel, lipid profile (cholesterol and triglycerides), HbA1c, vitamin D, vitamin B12, iron studies, and inflammatory markers like CRP. This combination gives you a complete picture of your metabolic health, nutritional status, and inflammation levels." } },
      { "@type": "Question", "name": "How much does a comprehensive Q1 health check cost in the UAE?", "acceptedAnswer": { "@type": "Answer", "text": "A comprehensive Q1 health check including all essential biomarkers typically costs AED 299-599 in the UAE, depending on the number of tests included. At-home collection services may add AED 50-100 to the total cost but save you time and clinic visits." } },
      { "@type": "Question", "name": "When should I book my Q1 health check for best results?", "acceptedAnswer": { "@type": "Answer", "text": "Book your Q1 health check during the second or third week of January 2026. This timing allows your body to recover from any holiday indulgences whilst giving you a true baseline before you start implementing new wellness habits." } },
      { "@type": "Question", "name": "How do I set realistic wellness goals based on my blood test results?", "acceptedAnswer": { "@type": "Answer", "text": "Focus on 2-3 biomarkers that are outside optimal ranges and set specific targets. For example, if your LDL cholesterol is 3.8 mmol/L, aim to reduce it to below 3.4 mmol/L through diet and exercise. Choose lifestyle changes that directly impact those specific markers rather than vague goals like 'eat better'." } },
      { "@type": "Question", "name": "What's the best app for tracking my Q1 health goals in the UAE?", "acceptedAnswer": { "@type": "Answer", "text": "Valeo Health combines at-home blood testing, biomarker tracking over time, and personalised wellness recommendations in one platform, so UAE residents can monitor their health progress without switching between apps or visiting multiple clinics." } },
      { "@type": "Question", "name": "How often should I retest my biomarkers during Q1?", "acceptedAnswer": { "@type": "Answer", "text": "Retest key biomarkers after 12 weeks (end of March 2026) to measure the impact of your wellness changes. Some markers like vitamin D or iron may need 8-10 weeks to show improvement, whilst lipid panels typically show changes within 6-8 weeks of dietary modifications." } },
      { "@type": "Question", "name": "Can I do my Q1 health check at home in Dubai?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, at-home health checks are available throughout Dubai and the UAE. Services like Valeo Health send qualified nurses to collect your blood samples at your home or office, making it convenient to get comprehensive testing without clinic visits." } }
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

const serif = "'Playfair Display', Georgia, serif";
const prose: React.CSSProperties = { fontSize: 17, lineHeight: 1.85, color: VT, marginBottom: 24 };
const h2Style: React.CSSProperties = { fontFamily: serif, fontSize: 26, fontWeight: 700, color: "#1C1208", borderLeft: `4px solid ${V}`, paddingLeft: 20, marginBottom: 24, marginTop: 48 };
const tipBox: React.CSSProperties = { background: `${VL}99`, borderRadius: 12, border: `1px solid ${VB}`, padding: "16px 20px", margin: "24px 0" };

function StepBadge({ n }: { n: number }) {
  return (
    <div style={{ flexShrink: 0, width: 56, height: 56, background: V, color: "#fff", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em" }}>Step</span>
      <span style={{ fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{n}</span>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ display: "flex", alignItems: "flex-start", gap: 12, ...prose, marginBottom: 8 }}>
      <span style={{ flexShrink: 0, width: 8, height: 8, background: V, borderRadius: "50%", marginTop: 10, display: "inline-block" }} />
      <span>{children}</span>
    </li>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <details style={{ background: "#fff", border: `1px solid ${open ? V : VB}`, borderRadius: 12, overflow: "hidden", transition: "border-color 0.2s" }}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", cursor: "pointer", listStyle: "none" }}>
        <h3 style={{ fontFamily: serif, fontSize: 17, fontWeight: 600, color: "#1C1208", margin: 0 }}>{q}</h3>
        <span style={{ color: V, fontSize: 20, transform: open ? "rotate(45deg)" : "none", transition: "transform 0.2s", flexShrink: 0, marginLeft: 12 }}>+</span>
      </summary>
      <div style={{ padding: "0 20px 16px", borderTop: `1px solid ${VB}80` }}>
        <p className="faq-a" style={{ ...prose, marginTop: 12, marginBottom: 0 }}>{a}</p>
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
      title="Q1 Health Check 2026: Realistic Wellness Goals | Valeo"
      description="Get your Q1 health check 2026 with blood tests, biomarker goals, and 12-week action plan. AED 299-599 UAE pricing."
      canonical={CANONICAL}
      schema={SCHEMAS}
    >
      <div style={{ background: BG, borderRadius: 16 }}>
        <article style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px" }}>

          {/* Skip link */}
          <a href="#main-content" style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", borderWidth: 0 }}>Skip to main content</a>

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" style={{ marginBottom: 32 }}>
            <ol style={{ display: "flex", flexWrap: "wrap", gap: 4, fontSize: 12, color: V, listStyle: "none", padding: 0, margin: 0 }}>
              <li><a href="https://feelvaleo.com" style={{ color: V, textDecoration: "none" }}>Home</a></li>
              <li style={{ color: VM }}>/</li>
              <li><a href="https://feelvaleo.com/blog" style={{ color: V, textDecoration: "none" }}>Blog</a></li>
              <li style={{ color: VM }}>/</li>
              <li style={{ color: "#1C1208", fontWeight: 500 }}>Q1 Health Check 2026: Realistic Wellness Goals</li>
            </ol>
          </nav>

          {/* Header */}
          <header id="main-content" style={{ marginBottom: 40 }}>
            <span style={{ display: "inline-block", background: VL, color: V, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 12px", borderRadius: 99, marginBottom: 16 }}>Preventive Health</span>
            <h1 style={{ fontFamily: serif, fontSize: 40, fontWeight: 900, lineHeight: 1.15, color: "#1C1208", marginBottom: 16 }}>
              How to Complete Your <span style={{ color: V }}>Q1 Health Check 2026</span> with Realistic Wellness Goals
            </h1>
            <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 24 }}>Valeo Health Blog · 16 April 2026 · 12 min read</p>
            <p style={{ fontFamily: serif, fontSize: 20, color: VT, lineHeight: 1.65, marginBottom: 24, borderLeft: `4px solid ${V}`, paddingLeft: 20 }}>
              You've made it to a new year — and whether you went hard on the holiday buffets or started a gym routine on 2 January, your body has a story to tell. A proper Q1 health check 2026 gives you the baseline to understand that story and set wellness goals that actually work.
            </p>
            <figure style={{ margin: "40px 0" }}>
              <img
                src="https://feelvaleo.com/images/blog/q1-health-check-2026-wellness-goals-hero.png"
                alt="Person reviewing blood test results with wellness planning materials on a desk"
                width={1200} height={630} loading="eager"
                style={{ width: "100%", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.10)", display: "block" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <figcaption style={{ fontSize: 13, color: "#9CA3AF", marginTop: 10, textAlign: "center", fontStyle: "italic" }}>Planning your Q1 health check with baseline biomarkers and wellness goals</figcaption>
            </figure>
          </header>

          {/* Quick answer */}
          <div className="quick-answer" role="note" aria-label="Quick answer" style={{ background: `linear-gradient(to right, ${VD}, ${V})`, borderRadius: 16, overflow: "hidden", marginBottom: 56 }}>
            <div style={{ padding: "12px 24px", color: "#fff", fontWeight: 700, fontSize: 14 }}>✓ The short answer</div>
            <div style={{ background: "#fff", margin: 2, borderRadius: 14, padding: "20px 24px" }}>
              <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  "Book comprehensive blood tests (CBC, lipids, glucose, vitamins) in mid-January for AED 299-599",
                  "Set 2-3 specific biomarker targets based on your results",
                  "Create a 12-week action plan with weekly milestones",
                  "Track progress and symptoms weekly",
                  "Retest key biomarkers at week 12 (end of March) for AED 150-250",
                ].map((item, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 17, color: VT }}>
                    <span style={{ flexShrink: 0, width: 28, height: 28, background: VL, color: V, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{i + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
              <p style={{ fontSize: 15, color: VM, marginTop: 16, marginBottom: 0, fontStyle: "italic" }}>Most people set wellness goals based on guesswork. Your Q1 health check 2026 biomarkers tell you exactly where to focus your energy.</p>
            </div>
          </div>

          {/* Intro paragraphs */}
          <p style={prose}>Here's the thing about new year wellness goals 2026: 92% of them fail by February because they're based on what we think we should do, not what our body actually needs. You might be focusing on weight loss when your real issue is iron deficiency costing AED 95/test to identify. Or pushing cardio when your cholesterol is already perfect but your vitamin D is dangerously low.</p>
          <p style={prose}>A Q1 health check changes that conversation entirely. Instead of guessing, you get data. Instead of generic advice from <a href="https://feelvaleo.com/wellness-plans" style={{ color: V }}>personalised wellness plans</a>, you get biomarker-based targets. Instead of hoping for the best, you track actual progress through <a href="https://feelvaleo.com/blood-tests" style={{ color: V }}>comprehensive blood testing</a>.</p>
          <p style={{ ...prose, marginBottom: 56 }}>The entire process — baseline test, action plan, and follow-up — costs AED 450-850 across 12 weeks. Compare that to months of trial-and-error with supplements and gym memberships that don't address your actual needs. <a href="https://feelvaleo.com/how-it-works" style={{ color: V }}>At-home collection</a> makes it convenient throughout Dubai and the UAE, and <a href="https://feelvaleo.com/pricing" style={{ color: V }}>transparent pricing</a> means no hidden costs or surprise fees.</p>

          {/* Before you start */}
          <h2 id="what-you-need-before-you-start" style={h2Style}>What do you need before starting your Q1 health check?</h2>
          <p style={prose}>Before diving into your Q1 health check, gather a few essentials that will make the process smoother and more effective.</p>
          <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 40px", display: "flex", flexDirection: "column", gap: 8 }}>
            <Bullet>Your previous blood test results (if available from the last 12 months)</Bullet>
            <Bullet>List of current medications and supplements</Bullet>
            <Bullet>Family health history (diabetes, heart disease, autoimmune conditions)</Bullet>
            <Bullet>Current symptoms or health concerns you've noticed</Bullet>
            <Bullet>Budget for initial tests (AED 299-599) and follow-up testing (AED 150-250)</Bullet>
          </ul>

          {/* Step 1 */}
          <section id="step-1" style={{ marginBottom: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <StepBadge n={1} />
              <h2 style={{ fontFamily: serif, fontSize: 24, fontWeight: 700, color: "#1C1208", margin: 0 }}>Plan your baseline blood test</h2>
            </div>
            <p style={prose}>Your baseline blood test is the foundation of everything that follows. Book it for mid-January — this timing gives your body enough time to recover from holiday indulgences whilst still capturing your true starting point before new habits take effect.</p>
            <p style={prose}>The <strong>Dubai Health Authority (DHA)</strong> recommends comprehensive screening for adults over 25, and your Q1 health check should include the essential panels that give you actionable insights.</p>
            <div style={tipBox}>
              <p style={{ fontSize: 15, color: VT, margin: 0 }}><strong style={{ color: V }}>Timing matters:</strong> Book your test for the second or third week of January. Avoid the first week (still recovering from holidays) and don't wait until February (you'll want results before setting your action plan).</p>
            </div>
            <p style={prose}>Here's exactly what your comprehensive Q1 health check should include:</p>
            <div style={{ overflowX: "auto", margin: "32px 0" }}>
              <table aria-label="Q1 health check test panel breakdown" style={{ width: "100%", fontSize: 14, color: VT, border: `1px solid ${VB}`, borderRadius: 12, borderCollapse: "collapse", overflow: "hidden" }}>
                <thead>
                  <tr style={{ background: V, color: "#fff", textAlign: "left" }}>
                    {["Test Panel", "Key Markers", "Cost (AED)", "Why It Matters"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Complete Blood Count", "Haemoglobin, WBC, platelets", "AED 45", "Detects anaemia, infections"],
                    ["Lipid Profile", "Total cholesterol, LDL, HDL, triglycerides", "AED 65", "Heart disease risk"],
                    ["Glucose & HbA1c", "Fasting glucose, 3-month average", "AED 55", "Diabetes screening"],
                    ["Vitamin D", "25-hydroxyvitamin D", "AED 85", "Bone health, immunity"],
                    ["Iron Studies", "Ferritin, transferrin saturation", "AED 95", "Energy levels, fatigue"],
                    ["Inflammatory Markers", "CRP, ESR", "AED 75", "Chronic inflammation"],
                  ].map(([panel, markers, cost, why], i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${VB}` }}>
                      <td style={{ padding: "12px 16px", fontWeight: 500 }}>{panel}</td>
                      <td style={{ padding: "12px 16px" }}>{markers}</td>
                      <td style={{ padding: "12px 16px" }}>{cost}</td>
                      <td style={{ padding: "12px 16px", color: VM }}>{why}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: VL, borderTop: `2px solid ${V}`, fontWeight: 700 }}>
                    <td style={{ padding: "12px 16px" }}>Total Package</td>
                    <td style={{ padding: "12px 16px" }}>15+ biomarkers</td>
                    <td style={{ padding: "12px 16px" }}>AED 420</td>
                    <td style={{ padding: "12px 16px" }}>Complete baseline</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p style={prose}>Many clinics in <strong>Dubai</strong> and <strong>Abu Dhabi</strong> offer package deals for comprehensive panels starting at AED 299 for basic screening up to AED 599 for premium packages. <a href="https://feelvaleo.com/blood-tests" style={{ color: V }}>Valeo Health's at-home collection service</a> brings the test to you, which saves time and ensures you're fasting properly without the stress of clinic visits.</p>
          </section>

          {/* Step 2 */}
          <section id="step-2" style={{ marginBottom: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <StepBadge n={2} />
              <h2 style={{ fontFamily: serif, fontSize: 24, fontWeight: 700, color: "#1C1208", margin: 0 }}>Set realistic wellness goals</h2>
            </div>
            <p style={prose}>This is where most people get it wrong. They look at their blood test results and panic, or they ignore them completely and stick to generic goals like "lose weight" or "exercise more". Sound familiar?</p>
            <p style={prose}>Your biomarkers tell you exactly where to focus your energy. If your vitamin D is 18 ng/ml (45 nmol/L) — well below the optimal range of 30-50 ng/ml (75-125 nmol/L) — that's your priority, not cardio workouts.</p>
            <div style={tipBox}>
              <p style={{ fontSize: 15, color: VT, margin: 0 }}><strong style={{ color: V }}>The 2-3 rule:</strong> Choose maximum 2-3 biomarkers to focus on during Q1. Trying to fix everything at once leads to overwhelm and nothing actually improving.</p>
            </div>
            <p style={prose}>Here's how to prioritise your wellness goals based on common biomarker patterns:</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              <Bullet><strong>High LDL cholesterol (&gt;3.4 mmol/L):</strong> Focus on Mediterranean-style eating and 150 minutes weekly cardio. Target: reduce LDL by 15-20% in 12 weeks.</Bullet>
              <Bullet><strong>Low vitamin D (&lt;75 nmol/L):</strong> Supplement 4000 IU daily (AED 35/month) + 20 minutes morning sun. Target: reach 100-125 nmol/L range.</Bullet>
              <Bullet><strong>Elevated HbA1c (&gt;5.7%):</strong> Prioritise protein at meals, reduce refined carbs, walk after eating. Target: reduce HbA1c by 0.3-0.5%.</Bullet>
              <Bullet><strong>Low iron/ferritin:</strong> Iron-rich foods daily + vitamin C, avoid tea with meals. Iron supplements cost AED 45/month. Target: increase ferritin by 30-50 ng/ml.</Bullet>
            </ul>
            <p style={prose}>Notice how specific these targets are? That's what makes them achievable. "Lower my cholesterol" is vague. "Reduce LDL from 3.8 to 3.2 mmol/L through diet and exercise" is a plan.</p>
          </section>

          {/* Step 3 */}
          <section id="step-3" style={{ marginBottom: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <StepBadge n={3} />
              <h2 style={{ fontFamily: serif, fontSize: 24, fontWeight: 700, color: "#1C1208", margin: 0 }}>Create your 12-week action plan</h2>
            </div>
            <p style={prose}>Twelve weeks — that's your Q1 window. Long enough to see real biomarker changes, short enough to stay motivated. Most wellness goals fail because people think in terms of "forever" instead of focused sprints.</p>
            <p style={prose}>Your 12-week plan should break down into weekly milestones, each building on the previous week. This prevents overwhelm and gives you regular wins to celebrate.</p>
            <div style={tipBox}>
              <p style={{ fontSize: 15, color: VT, margin: 0 }}><strong style={{ color: V }}>Week-by-week approach:</strong> Week 1 focuses on establishing one habit. Week 2 maintains that habit and adds another. By week 4, you're tracking 3-4 consistent behaviours that directly impact your target biomarkers.</p>
            </div>
            <p style={prose}>Here's a sample 12-week progression for someone targeting high cholesterol and low vitamin D:</p>
            <div role="list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, margin: "32px 0" }}>
              {[
                { label: "Weeks 1–3", badge: V, title: "Foundation Phase", desc: "Start 4000 IU vitamin D daily (AED 35/month), add 20-minute morning walks, replace refined snacks with nuts and fruit" },
                { label: "Weeks 4–6", badge: VM, title: "Building Phase", desc: "Add 2 cardio sessions weekly (gym membership AED 200/month), increase omega-3 rich foods (salmon, walnuts), track daily steps" },
                { label: "Weeks 7–9", badge: VM, title: "Optimisation Phase", desc: "Fine-tune portions, add strength training, experiment with meal timing for better energy" },
                { label: "Weeks 10–12", badge: VM, title: "Maintenance Phase", desc: "Sustain all habits, prepare for retest week, plan next quarter based on progress" },
              ].map(({ label, badge, title, desc }, i) => (
                <div key={i} role="listitem" style={{ border: `1px solid ${i === 0 ? `${V}4D` : VB}`, borderRadius: 12, padding: 16, background: i === 0 ? `${VL}66` : "#fff" }}>
                  <span style={{ display: "inline-block", background: badge, color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, marginBottom: 8 }}>{label}</span>
                  <p style={{ fontWeight: 600, color: "#1C1208", marginBottom: 6, fontSize: 15 }}>{title}</p>
                  <p style={{ fontSize: 13, color: VM, margin: 0, lineHeight: 1.6 }}>{desc}</p>
                </div>
              ))}
            </div>
            <p style={prose}>The key is connecting each weekly action to your specific biomarker targets. Random exercise won't move the needle — but 150 minutes of cardio weekly will measurably reduce LDL cholesterol in 8-10 weeks.</p>
          </section>

          {/* Step 4 */}
          <section id="step-4" style={{ marginBottom: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <StepBadge n={4} />
              <h2 style={{ fontFamily: serif, fontSize: 24, fontWeight: 700, color: "#1C1208", margin: 0 }}>Track your progress weekly</h2>
            </div>
            <p style={prose}>You can't manage what you don't measure. But here's the thing about tracking health progress — most people focus on the wrong metrics. Daily weight fluctuations tell you nothing about cholesterol improvement. Step counts don't reveal vitamin D status.</p>
            <p style={prose}>Instead, track the leading indicators — the behaviours and symptoms that predict biomarker changes before your next blood test confirms them.</p>
            <div style={tipBox}>
              <p style={{ fontSize: 15, color: VT, margin: 0 }}><strong style={{ color: V }}>Weekly check-ins:</strong> Every Sunday, spend 10 minutes reviewing the past week. What worked? What didn't? How did your energy levels change? Which habits felt sustainable?</p>
            </div>
            <p style={prose}>Track these leading indicators based on your target biomarkers:</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              <Bullet><strong>For cholesterol goals:</strong> Days you hit 150+ minutes cardio, meals with omega-3 foods, mornings you feel energetic</Bullet>
              <Bullet><strong>For vitamin D goals:</strong> Days taking supplement (AED 35/month cost), minutes of morning sun, improvements in mood or sleep quality</Bullet>
              <Bullet><strong>For glucose control:</strong> Post-meal walks, protein-first meals, steady energy without afternoon crashes</Bullet>
              <Bullet><strong>For iron/energy:</strong> Iron-rich meals, vitamin C with iron foods, mornings waking refreshed (iron supplements AED 45/month)</Bullet>
            </ul>
            <p style={prose}>By week 6-8, you should notice symptom improvements that correlate with your biomarker targets. More energy usually means better iron status. Stable mood often reflects improved vitamin D. These leading indicators predict what your follow-up blood test will confirm.</p>
          </section>

          {/* Step 5 */}
          <section id="step-5" style={{ marginBottom: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <StepBadge n={5} />
              <h2 style={{ fontFamily: serif, fontSize: 24, fontWeight: 700, color: "#1C1208", margin: 0 }}>Schedule your follow-up test</h2>
            </div>
            <p style={prose}>Week 12 — the moment of truth. This isn't just another blood test; it's your progress report. Did your targeted approach work? Which biomarkers improved? What needs adjustment for Q2?</p>
            <p style={prose}>Book your follow-up test for the last week of March or first week of April. This timing gives you a full 12 weeks of consistent habits whilst still being early enough in Q2 to adjust your approach if needed.</p>
            <div style={tipBox}>
              <p style={{ fontSize: 15, color: VT, margin: 0 }}><strong style={{ color: V }}>Selective retesting:</strong> You don't need to repeat every biomarker. Focus on retesting the 2-3 markers you targeted, plus any that were significantly abnormal in your baseline test.</p>
            </div>
            <p style={prose}>Your follow-up panel should include:</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 24px", display: "flex", flexDirection: "column", gap: 8 }}>
              <Bullet>Your 2-3 target biomarkers (e.g., lipid profile AED 65 if targeting cholesterol)</Bullet>
              <Bullet>Any markers that were critically low or high (vitamin D AED 85, iron AED 95, HbA1c AED 55)</Bullet>
              <Bullet>Basic metabolic panel AED 40 to ensure no unexpected changes</Bullet>
            </ul>
            <p style={prose}>Total follow-up testing typically costs AED 150-250 depending on which biomarkers you're tracking. Expect to see measurable improvements in 8-12 weeks for most biomarkers. Vitamin D typically responds fastest (4-6 weeks), whilst lipid changes need 8-10 weeks, and HbA1c requires the full 12 weeks to reflect accurately.</p>
            <p style={prose}>If you've been consistent with your targeted approach, seeing a 15-25% improvement in your focus biomarkers is realistic and clinically significant. <a href="https://feelvaleo.com/wellness-plans" style={{ color: V }}>Valeo Health's follow-up consultations</a> help you interpret these changes and plan your Q2 strategy based on your results.</p>
          </section>

          {/* Common mistakes */}
          <h2 id="common-mistakes-to-avoid" style={h2Style}>What are the most common Q1 health check mistakes to avoid?</h2>
          <p style={prose}>Even with the best intentions, most people make predictable mistakes that sabotage their Q1 health check progress. Here are the five biggest ones and how to avoid them:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, margin: "32px 0" }}>
            {[
              ["Trying to fix everything at once", "Focus on 2-3 biomarkers maximum. Attempting to address every abnormal result leads to overwhelm and nothing improving meaningfully."],
              ["Setting vague goals instead of specific targets", `"Improve my health" isn't actionable. "Reduce LDL cholesterol from 3.8 to 3.2 mmol/L" gives you something measurable to work towards.`],
              ["Ignoring symptom changes during the 12 weeks", "Biomarkers improve before blood tests confirm it. Track energy levels, sleep quality, and mood — they predict your success."],
              ["Skipping the follow-up test", "Without retesting (AED 150-250), you'll never know if your approach worked. The follow-up test validates your efforts and guides your next steps."],
              ["Comparing yourself to others instead of your baseline", "Your Q1 success is measured against your January baseline, not your colleague's results. Focus on your own progress trajectory."],
            ].map(([title, desc], i) => (
              <div key={i} style={{ background: "#fff", border: `1px solid ${VB}`, borderRadius: 12, padding: 20 }}>
                <h3 style={{ fontWeight: 700, color: "#1C1208", marginBottom: 8, fontSize: 15 }}>{title}</h3>
                <p style={{ fontSize: 13, color: VM, margin: 0, lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>

          {/* Easiest way */}
          <h2 id="the-easiest-way" style={h2Style}>What's the easiest way to complete your Q1 health check today?</h2>
          <p style={prose}>Planning is one thing. Execution is another. You could spend weeks researching labs in Dubai, comparing prices, booking appointments, and trying to coordinate fasting schedules around your work calendar.</p>
          <p style={prose}>Or you could have <strong>Valeo Health</strong> handle the logistics whilst you focus on the results. Our at-home collection service brings comprehensive biomarker testing to your location across the UAE for AED 299-599. Book online, a qualified nurse arrives at your chosen time, and your results are ready within 48 hours with personalised recommendations.</p>
          <p style={prose}>The comprehensive Q1 panel includes all the biomarkers mentioned in this guide — CBC, lipids, glucose, HbA1c, vitamin D, iron studies, and inflammatory markers. One booking, one collection, complete baseline data for your wellness goals. Your 12-week follow-up test uses the same convenient process for AED 150-250, making it easy to track your actual progress.</p>
          <p style={prose}><a href="https://feelvaleo.com/how-it-works" style={{ color: V }}>The process takes less than 15 minutes</a>, and you'll have your results analysed by licensed doctors who understand the GCC health context and can interpret your biomarkers within regional reference ranges.</p>

          {/* Summary box */}
          <div className="summary-box" style={{ background: `linear-gradient(135deg, #1C1208, ${VM}, ${V})`, borderRadius: 24, padding: "32px", marginBottom: 56, color: "#fff" }}>
            <h2 style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, marginBottom: 24 }}>The short version</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                ["🩸", "Baseline test timing", "Mid-January 2026 (weeks 2-3)"],
                ["🎯", "Focus strategy", "2-3 biomarkers maximum"],
                ["📊", "Action plan duration", "12 weeks (full Q1)"],
                ["🔄", "Follow-up test", "End of March / early April"],
                ["💰", "Total investment", "AED 450-850 (tests + follow-up)"],
              ].map(([icon, label, value], i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ flexShrink: 0, width: 40, height: 40, background: "rgba(255,255,255,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</span>
                  <div>
                    <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <section style={{ marginBottom: 56 }}>
            <h2 id="faq" style={h2Style}>Frequently asked questions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <FaqItem q="What blood tests should I include in my Q1 health check?" a="Your Q1 health check should include a complete blood count (CBC), comprehensive metabolic panel, lipid profile (cholesterol and triglycerides), HbA1c, vitamin D, vitamin B12, iron studies, and inflammatory markers like CRP. This combination gives you a complete picture of your metabolic health, nutritional status, and inflammation levels." />
              <FaqItem q="How much does a comprehensive Q1 health check cost in the UAE?" a="A comprehensive Q1 health check including all essential biomarkers typically costs AED 299-599 in the UAE, depending on the number of tests included. At-home collection services may add AED 50-100 to the total cost but save you time and clinic visits." />
              <FaqItem q="When should I book my Q1 health check for best results?" a="Book your Q1 health check during the second or third week of January 2026. This timing allows your body to recover from any holiday indulgences whilst giving you a true baseline before you start implementing new wellness habits." />
              <FaqItem q="How do I set realistic wellness goals based on my blood test results?" a="Focus on 2-3 biomarkers that are outside optimal ranges and set specific targets. For example, if your LDL cholesterol is 3.8 mmol/L, aim to reduce it to below 3.4 mmol/L through diet and exercise. Choose lifestyle changes that directly impact those specific markers rather than vague goals like 'eat better'." />
              <FaqItem q="What's the best app for tracking my Q1 health goals in the UAE?" a="Valeo Health combines at-home blood testing, biomarker tracking over time, and personalised wellness recommendations in one platform, so UAE residents can monitor their health progress without switching between apps or visiting multiple clinics." />
              <FaqItem q="How often should I retest my biomarkers during Q1?" a="Retest key biomarkers after 12 weeks (end of March 2026) to measure the impact of your wellness changes. Some markers like vitamin D or iron may need 8-10 weeks to show improvement, whilst lipid panels typically show changes within 6-8 weeks of dietary modifications." />
              <FaqItem q="Can I do my Q1 health check at home in Dubai?" a="Yes, at-home health checks are available throughout Dubai and the UAE. Services like Valeo Health send qualified nurses to collect your blood samples at your home or office, making it convenient to get comprehensive testing without clinic visits." />
            </div>
          </section>

          {/* CTA */}
          <section style={{ background: `linear-gradient(135deg, ${VD}, ${V}, #F59E0B)`, borderRadius: 24, padding: "40px 32px", marginBottom: 48, textAlign: "center", boxShadow: `0 8px 32px ${V}33` }}>
            <h2 style={{ fontFamily: serif, fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Your body already knows how it's doing</h2>
            <p style={{ color: "rgba(255,255,255,0.85)", maxWidth: 480, margin: "0 auto 24px", fontSize: 17, lineHeight: 1.6 }}>A simple blood test lets you in on the conversation. Stop guessing about your health and start working with real data that shows you exactly where to focus your energy.</p>
            <a href="https://feelvaleo.com/book" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: V, fontWeight: 700, padding: "14px 32px", borderRadius: 99, textDecoration: "none", fontSize: 15 }}>
              Book your Q1 health check →
            </a>
          </section>

          {/* Related */}
          <section style={{ borderTop: `1px solid ${VB}66`, paddingTop: 40 }}>
            <h2 style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, color: "#1C1208", marginBottom: 24 }}>Related articles</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
              <a href="https://feelvaleo.com/blood-tests" style={{ display: "block", padding: 20, background: "#fff", border: `1px solid ${VB}`, borderRadius: 12, textDecoration: "none" }}>
                <h3 style={{ fontFamily: serif, fontSize: 16, fontWeight: 600, color: "#1C1208", marginBottom: 8 }}>Complete Guide to Blood Tests in the UAE</h3>
                <p style={{ fontSize: 13, color: VM, margin: 0, lineHeight: 1.5 }}>Everything you need to know about comprehensive health screening options available across Dubai and Abu Dhabi</p>
              </a>
              <a href="https://feelvaleo.com/wellness-plans" style={{ display: "block", padding: 20, background: "#fff", border: `1px solid ${VB}`, borderRadius: 12, textDecoration: "none" }}>
                <h3 style={{ fontFamily: serif, fontSize: 16, fontWeight: 600, color: "#1C1208", marginBottom: 8 }}>Personalised Wellness Plans Based on Your Biomarkers</h3>
                <p style={{ fontSize: 13, color: VM, margin: 0, lineHeight: 1.5 }}>Learn how to create actionable health strategies using your blood test results as a foundation</p>
              </a>
            </div>
          </section>

        </article>
      </div>
    </SEOLayout>
  );
}
