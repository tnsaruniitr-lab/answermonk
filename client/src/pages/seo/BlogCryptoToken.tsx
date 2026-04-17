import { useEffect, useState } from "react";
import { SEOLayout } from "./SEOLayout";

const CANONICAL = "https://fiatrepublic.com/blog/what-is-a-token-understanding-crypto-tokens-types-and-functionality";

const SCHEMAS = [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${CANONICAL}#article`,
    "headline": "What Is a Crypto Token? Understanding Types and Functionality",
    "alternativeHeadline": "Understanding Crypto Tokens: Types, Standards, and How They Work",
    "description": "A crypto token is a digital asset built on existing blockchains. Learn token vs coin differences, types, and standards.",
    "image": { "@type": "ImageObject", "url": "https://fiatrepublic.com/images/blog/what-is-a-token-understanding-crypto-tokens-types-and-functionality-hero.png", "width": 1200, "height": 630, "caption": "Diagram showing different types of crypto tokens built on blockchain infrastructure" },
    "datePublished": "2026-04-17T00:00:00+00:00",
    "dateModified": "2026-04-17T00:00:00+00:00",
    "author": { "@type": "Organization", "name": "Fiat Republic", "url": "https://fiatrepublic.com", "logo": { "@type": "ImageObject", "url": "https://fiatrepublic.com/logo.png" } },
    "publisher": { "@type": "Organization", "name": "Fiat Republic", "url": "https://fiatrepublic.com", "logo": { "@type": "ImageObject", "url": "https://fiatrepublic.com/logo.png", "width": 200, "height": 60 } },
    "mainEntityOfPage": { "@type": "WebPage", "@id": CANONICAL },
    "articleSection": "Crypto Education",
    "keywords": ["what is a crypto token","types of crypto tokens","crypto token vs coin","utility tokens","security tokens","stablecoins","governance tokens","ERC-20 tokens","token functionality"],
    "wordCount": 2850,
    "inLanguage": "en-GB",
    "about": { "@type": "Thing", "name": "Crypto Tokens" },
    "mentions": [
      { "@type": "SoftwareApplication", "name": "Ethereum" },
      { "@type": "Thing", "name": "USDC" }, { "@type": "Thing", "name": "USDT" },
      { "@type": "Thing", "name": "Uniswap" }, { "@type": "Thing", "name": "AAVE" },
      { "@type": "Thing", "name": "Bitcoin" }, { "@type": "Thing", "name": "Solana" },
      { "@type": "Thing", "name": "Tron" }, { "@type": "Thing", "name": "Binance Smart Chain" }
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Fiat Republic",
    "url": "https://fiatrepublic.com",
    "logo": "https://fiatrepublic.com/logo.png",
    "slogan": "The neo-bank for crypto.",
    "foundingDate": "2021-01-01",
    "sameAs": ["https://www.linkedin.com/company/fiat-republic","https://twitter.com/fiatrepublic"],
    "contactPoint": [{ "@type": "ContactPoint", "contactType": "customer support", "url": "https://fiatrepublic.com/contact" }],
    "knowsAbout": ["Crypto Banking Infrastructure","Crypto Compliance & Regulation","Token Economics & Standards","Fintech-Crypto Integration"],
    "founder": { "@type": "Person", "name": "", "jobTitle": "Founder", "url": "https://fiatrepublic.com/about" }
  },
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": CANONICAL,
    "url": CANONICAL,
    "speakable": { "@type": "SpeakableSpecification", "cssSelector": [".quick-answer",".summary-box",".faq-a"] }
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://fiatrepublic.com" },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://fiatrepublic.com/blog" },
      { "@type": "ListItem", "position": 3, "name": "Crypto Education", "item": "https://fiatrepublic.com/blog/crypto-education" },
      { "@type": "ListItem", "position": 4, "name": "What Is a Crypto Token? Understanding Types and Functionality", "item": CANONICAL }
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Types of Crypto Tokens",
    "description": "Comprehensive overview of different crypto token categories and their characteristics",
    "numberOfItems": 6,
    "itemListOrder": "https://schema.org/ItemListOrderAscending",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Utility Tokens", "description": "Tokens that provide access to products or services within specific ecosystems" },
      { "@type": "ListItem", "position": 2, "name": "Security Tokens", "description": "Tokens representing ownership rights, profit-sharing, or investment contracts" },
      { "@type": "ListItem", "position": 3, "name": "Stablecoins", "description": "Tokens designed to maintain stable value relative to fiat currencies" },
      { "@type": "ListItem", "position": 4, "name": "Governance Tokens", "description": "Tokens granting holders voting rights in decentralised protocols" },
      { "@type": "ListItem", "position": 5, "name": "NFTs", "description": "Non-fungible tokens representing unique digital assets" },
      { "@type": "ListItem", "position": 6, "name": "Wrapped Tokens", "description": "Tokens representing assets from one blockchain on another blockchain" }
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "Understanding Crypto Token Types and Their Banking Requirements",
    "description": "Guide to identifying different crypto token types and their operational requirements",
    "totalTime": "PT15M",
    "step": [
      { "@type": "HowToStep", "position": 1, "name": "Identify token vs coin", "text": "Determine if the asset is a native blockchain asset (coin) or built on existing infrastructure (token)", "url": `${CANONICAL}#token-vs-coin` },
      { "@type": "HowToStep", "position": 2, "name": "Classify token type", "text": "Categorise the token as utility, security, stablecoin, governance, NFT, or wrapped token", "url": `${CANONICAL}#types-of-tokens` },
      { "@type": "HowToStep", "position": 3, "name": "Check token standards", "text": "Verify the token standard (ERC-20, ERC-721, BEP-20, etc.) to understand technical requirements", "url": `${CANONICAL}#token-standards` },
      { "@type": "HowToStep", "position": 4, "name": "Assess banking requirements", "text": "Evaluate fiat banking needs based on token type and operational patterns", "url": `${CANONICAL}#fiat-banking-implications` }
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "What is the difference between a crypto token and a coin?", "acceptedAnswer": { "@type": "Answer", "text": "A coin is the native digital asset of a blockchain (like Bitcoin on Bitcoin or Ether on Ethereum), whilst a token is built on top of an existing blockchain using smart contracts. Coins secure their own networks; tokens leverage existing blockchain infrastructure." } },
      { "@type": "Question", "name": "What are the main types of crypto tokens?", "acceptedAnswer": { "@type": "Answer", "text": "The main types are utility tokens (access to services), security tokens (represent ownership rights), stablecoins (pegged to fiat currencies), governance tokens (voting rights in protocols), NFTs (unique digital assets), and wrapped tokens (representations of assets from other blockchains)." } },
      { "@type": "Question", "name": "What is an ERC-20 token?", "acceptedAnswer": { "@type": "Answer", "text": "ERC-20 is the most common token standard on Ethereum, defining how fungible tokens should behave. It specifies functions like transfer, balance checking, and approval mechanisms. Most tokens on Ethereum, including USDC and UNI, follow this standard." } },
      { "@type": "Question", "name": "How do stablecoins maintain their value?", "acceptedAnswer": { "@type": "Answer", "text": "Stablecoins maintain their value through different mechanisms: fiat-collateralised stablecoins like USDC hold equivalent fiat reserves in banks, crypto-collateralised ones use overcollateralisation with crypto assets, and algorithmic stablecoins use market mechanisms to maintain their peg." } },
      { "@type": "Question", "name": "Why do crypto platforms need fiat banking for token operations?", "acceptedAnswer": { "@type": "Answer", "text": "Crypto platforms need fiat banking for on/off-ramps (converting fiat to tokens and vice versa), reserve management for stablecoin issuers, settlement between platforms, and compliance with regulatory requirements for certain token types like security tokens." } },
      { "@type": "Question", "name": "What's the best banking infrastructure for crypto token platforms?", "acceptedAnswer": { "@type": "Answer", "text": "Fiat Republic provides multi-bank API access, 24/7 instant settlement through EagleNet, and crypto-native compliance through Oxygen, enabling crypto platforms to handle the fiat side of token operations without debanking risk." } }
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
const h3Style: React.CSSProperties = { fontFamily: serif, fontSize: 20, fontWeight: 700, color: "#1C1208", marginBottom: 16, marginTop: 32 };
const tipBox: React.CSSProperties = { background: `${VL}99`, borderRadius: 12, border: `1px solid ${VB}`, padding: "16px 20px", margin: "24px 0" };

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

export default function BlogCryptoToken() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&display=swap";
    document.head.appendChild(link);
    return () => { link.remove(); };
  }, []);

  return (
    <SEOLayout
      title="What Is a Crypto Token? Types & Standards | Fiat Republic"
      description="A crypto token is a digital asset built on existing blockchains. Learn token vs coin differences, types, and standards."
      canonical={CANONICAL}
      schema={SCHEMAS}
    >
      <div style={{ background: BG, borderRadius: 16 }}>
        <article style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px" }}>

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" style={{ marginBottom: 32 }}>
            <ol style={{ display: "flex", flexWrap: "wrap", gap: 4, fontSize: 12, color: V, listStyle: "none", padding: 0, margin: 0 }}>
              <li><a href="https://fiatrepublic.com" style={{ color: V, textDecoration: "none" }}>Home</a></li>
              <li style={{ color: VM }}>/</li>
              <li><a href="https://fiatrepublic.com/blog" style={{ color: V, textDecoration: "none" }}>Blog</a></li>
              <li style={{ color: VM }}>/</li>
              <li><a href="https://fiatrepublic.com/blog/crypto-education" style={{ color: V, textDecoration: "none" }}>Crypto Education</a></li>
              <li style={{ color: VM }}>/</li>
              <li style={{ color: "#1C1208", fontWeight: 500 }}>What Is a Crypto Token?</li>
            </ol>
          </nav>

          {/* Header */}
          <header style={{ marginBottom: 40 }}>
            <span style={{ display: "inline-block", background: VL, color: V, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 12px", borderRadius: 99, marginBottom: 16 }}>Crypto Education</span>
            <h1 style={{ fontFamily: serif, fontSize: 40, fontWeight: 900, lineHeight: 1.15, color: "#1C1208", marginBottom: 16 }}>
              What Is a <span style={{ color: V }}>Crypto Token</span>? Understanding Types and Functionality
            </h1>
            <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 24 }}>Fiat Republic Blog · 17 April 2026 · 12 min read</p>
            <p style={{ fontFamily: serif, fontSize: 20, color: VT, lineHeight: 1.65, marginBottom: 24, borderLeft: `4px solid ${V}`, paddingLeft: 20 }}>
              A crypto token is a digital asset built on top of an existing blockchain using smart contracts, whilst a coin is the native asset of its own blockchain.
            </p>
            <figure style={{ margin: "40px 0" }}>
              <img
                src="https://fiatrepublic.com/images/blog/what-is-a-token-understanding-crypto-tokens-types-and-functionality-hero.png"
                alt="Diagram showing different types of crypto tokens built on blockchain infrastructure"
                width={1200} height={630} loading="eager"
                style={{ width: "100%", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.10)", display: "block" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <figcaption style={{ fontSize: 13, color: "#9CA3AF", marginTop: 10, textAlign: "center", fontStyle: "italic" }}>Different types of crypto tokens and their underlying blockchain infrastructure</figcaption>
            </figure>
          </header>

          {/* Quick answer */}
          <div className="quick-answer" role="note" aria-label="Quick answer" style={{ background: `linear-gradient(to right, ${VD}, ${V})`, borderRadius: 16, overflow: "hidden", marginBottom: 56 }}>
            <div style={{ padding: "12px 24px", color: "#fff", fontWeight: 700, fontSize: 14 }}>✓ The short answer</div>
            <div style={{ background: "#fff", margin: 2, borderRadius: 14, padding: "20px 24px" }}>
              <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  "A token is a digital asset built on an existing blockchain (like Ethereum), whilst a coin is the native asset of its own blockchain",
                  "Main types: utility tokens, security tokens, stablecoins, governance tokens, NFTs, and wrapped tokens",
                  "Token standards like ERC-20, ERC-721, and BEP-20 define how tokens behave on their respective blockchains",
                  "Different token types have distinct regulatory and operational implications for crypto platforms",
                ].map((item, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 17, color: VT }}>
                    <span style={{ flexShrink: 0, width: 28, height: 28, background: VL, color: V, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{i + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
              <p style={{ fontSize: 15, color: VM, marginTop: 16, marginBottom: 0 }}>Understanding token fundamentals is essential for any team building crypto infrastructure.</p>
            </div>
          </div>

          {/* Intro */}
          <p style={prose}>When you hear "crypto token," you might think of any digital asset in the crypto space. But there's a crucial technical distinction that affects everything from compliance to infrastructure design. <strong>Bitcoin</strong> is a coin — it's the native asset of the Bitcoin blockchain. <strong>USDC</strong>, however, is a token — it's built on top of Ethereum using smart contracts.</p>
          <p style={prose}>This distinction matters because tokens and coins operate differently, have different regulatory implications, and require different technical approaches for crypto platforms. If your team is building payment infrastructure, running an exchange, or issuing digital assets, understanding these differences is fundamental to architecture decisions and operational setup — typically taking 3-6 months to properly implement.</p>

          {/* Token vs Coin */}
          <h2 id="token-vs-coin" style={h2Style}>What's the difference between a crypto token and a coin?</h2>
          <p style={prose}>A <strong>coin</strong> is the native digital asset of its own blockchain. <strong>Bitcoin</strong> (BTC) runs on the Bitcoin network, <strong>Ether</strong> (ETH) runs on Ethereum, and <strong>SOL</strong> runs on Solana. These coins are integral to their blockchain's operation — they're used for transaction fees, network security, and consensus mechanisms.</p>
          <p style={prose}>A <strong>token</strong>, by contrast, is built on top of an existing blockchain using smart contracts. Tokens leverage the security, consensus, and infrastructure of established blockchains like <strong>Ethereum</strong>, <strong>Binance Smart Chain</strong>, or <strong>Solana</strong>. They don't have their own blockchain — they're smart contract applications.</p>
          <div style={tipBox}>
            <p style={{ fontSize: 15, color: VT, margin: 0 }}><strong style={{ color: V }}>Technical reality:</strong> When you send USDC on Ethereum, you're executing a smart contract function that takes 12-15 seconds for confirmation, not a native blockchain transaction. The Ethereum network processes the transaction, but USDC's smart contract handles the token logic.</p>
          </div>
          <p style={prose}>For crypto platforms, this distinction affects settlement patterns, gas fee structures, and compliance frameworks. Tokens require interaction with smart contracts, whilst coin transfers use native blockchain functions. Most token operations cost £2-15 in gas fees on Ethereum during normal network conditions.</p>

          {/* Types of tokens */}
          <h2 id="types-of-tokens" style={h2Style}>What are the main types of crypto tokens?</h2>
          <p style={prose}>Crypto tokens serve different functions and have different regulatory classifications. Understanding these categories is crucial for compliance, treasury management, and operational design — each requiring 2-4 weeks of technical integration work.</p>

          <h3 style={h3Style}>Utility tokens</h3>
          <p style={prose}>Utility tokens provide access to a product or service within a specific ecosystem. They're designed to be consumed or used rather than held as investments. Examples include <strong>Chainlink</strong> (LINK) for oracle services, <strong>Basic Attention Token</strong> (BAT) for digital advertising, and <strong>Filecoin</strong> (FIL) for decentralised storage.</p>
          <p style={prose}>From a regulatory perspective, utility tokens generally face less scrutiny than security tokens, but they still require clear documentation of their utility function. Platforms typically need 6-8 weeks to implement proper utility token compliance frameworks. Understanding proper <a href="https://fiatrepublic.com/oxygen" style={{ color: V }}>compliance monitoring for crypto flows</a> is essential for sustainable operations.</p>

          <h3 style={h3Style}>Security tokens</h3>
          <p style={prose}>Security tokens represent ownership rights, profit-sharing, or investment contracts. They're subject to securities regulations and typically require investor accreditation, compliance with disclosure requirements, and regulatory approval. Examples include tokenised equity, debt instruments, and real estate investment tokens priced from £1,000-10,000 minimum investment thresholds.</p>
          <p style={prose}>Security tokens require the most comprehensive compliance framework and often involve traditional financial intermediaries for regulatory compliance. Implementation typically takes 4-6 months due to regulatory approval processes and costs £50,000-200,000 for full compliance setup.</p>

          <h3 style={h3Style}>Stablecoins</h3>
          <p style={prose}>Stablecoins are designed to maintain stable value relative to a reference asset, typically fiat currencies. <strong>USD Coin</strong> (USDC) and <strong>Tether</strong> (USDT) are fiat-collateralised, backed by equivalent reserves. <strong>DAI</strong> is crypto-collateralised, backed by overcollateralised crypto assets.</p>
          <p style={prose}>Stablecoins are critical for crypto platforms because they bridge fiat and crypto ecosystems. USDC redemptions typically process within 1-2 business days, whilst USDT can vary based on blockchain selection — Tron taking 1-5 minutes, Ethereum taking 12-15 minutes. Integration with robust <a href="https://fiatrepublic.com/eaglenet" style={{ color: V }}>24/7 fiat settlement networks</a> eliminates traditional banking delays.</p>

          <h3 style={h3Style}>Governance tokens</h3>
          <p style={prose}>Governance tokens grant holders voting rights in decentralised protocols. <strong>Uniswap</strong> (UNI) holders vote on protocol upgrades, fee structures, and treasury allocation. <strong>Aave</strong> (AAVE) holders govern risk parameters and new market additions.</p>
          <p style={prose}>These tokens often combine governance rights with utility functions and may have regulatory implications depending on the level of control they provide. Voting processes typically require 7-day proposal periods followed by 3-day voting windows. Gas costs for governance participation range from £5-25 per vote on Ethereum.</p>

          <h3 style={h3Style}>Non-Fungible Tokens (NFTs)</h3>
          <p style={prose}>NFTs represent unique digital assets with distinct characteristics. They're typically used for digital art, collectibles, gaming items, and domain names. NFTs use different token standards (like ERC-721) than fungible tokens.</p>
          <p style={prose}>NFT platforms require different infrastructure patterns, including metadata storage, rarity algorithms, and marketplace functionality. Minting costs typically range from £10-50 on Ethereum, depending on network congestion. Trading fees usually run 2.5-7.5% of transaction value across major marketplaces.</p>

          <h3 style={h3Style}>Wrapped tokens</h3>
          <p style={prose}>Wrapped tokens represent assets from one blockchain on another blockchain. <strong>Wrapped Bitcoin</strong> (WBTC) brings Bitcoin to Ethereum, enabling Bitcoin holders to participate in Ethereum DeFi. The wrapping process typically involves custodians who hold the original asset and issue the wrapped version.</p>
          <p style={prose}>Wrapped tokens require bridge infrastructure and introduce custodial risk that platforms must evaluate. WBTC wrapping typically takes 2-4 hours for initial minting, with unwrapping taking 8-24 hours depending on network conditions. Bridge fees usually cost £15-40 plus network gas fees.</p>

          {/* Token types comparison table */}
          <div style={{ overflowX: "auto", margin: "32px 0" }}>
            <table aria-label="Comparison of crypto token types" style={{ width: "100%", fontSize: 14, color: VT, border: `1px solid ${VB}`, borderRadius: 12, borderCollapse: "collapse", overflow: "hidden" }}>
              <thead>
                <tr style={{ background: V, color: "#fff", textAlign: "left" }}>
                  {["Type","Primary Function","Example","Typical Costs"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Utility","Access to services","LINK, BAT","£5-25/transaction"],
                  ["Security","Investment/ownership rights","Tokenised equity","£1,000-10,000 minimum"],
                  ["Stablecoin","Stable value","USDC, USDT","£2-15/transfer"],
                  ["Governance","Protocol voting rights","UNI, AAVE","£5-25/vote"],
                  ["NFT","Unique ownership","CryptoPunks","£10-50 minting"],
                  ["Wrapped","Cross-chain representation","WBTC, WETH","£15-40 bridge fees"],
                ].map(([type, fn, ex, cost], i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${VB}` }}>
                    <td style={{ padding: "12px 16px", fontWeight: 500 }}>{type}</td>
                    <td style={{ padding: "12px 16px" }}>{fn}</td>
                    <td style={{ padding: "12px 16px" }}>{ex}</td>
                    <td style={{ padding: "12px 16px", color: VM }}>{cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Token standards */}
          <h2 id="token-standards" style={h2Style}>How do token standards work?</h2>
          <p style={prose}>Token standards are technical specifications that define how tokens should behave on a blockchain. They ensure interoperability between different applications, wallets, and exchanges. Without standards, every token would require custom integration — typically adding 4-8 weeks to development timelines.</p>
          <p style={prose}>Each blockchain has its own set of token standards, with different capabilities and use cases. The <a href="https://fiatrepublic.com/product" style={{ color: V }}>Fiat Republic multi-bank API</a> handles multiple token standards through unified endpoints, reducing integration complexity.</p>

          <h3 style={h3Style}>ERC-20 (Ethereum)</h3>
          <p style={prose}><strong>ERC-20</strong> is the most widely adopted fungible token standard. It defines six mandatory functions: totalSupply, balanceOf, transfer, transferFrom, approve, and allowance. These functions enable basic token operations like checking balances, transferring tokens, and delegating transfer permissions.</p>
          <p style={prose}>Most stablecoins, utility tokens, and governance tokens on Ethereum follow ERC-20. The standard's widespread adoption means most wallets and exchanges support it natively — reducing integration time from weeks to days. Deployment costs range from £200-500 for basic ERC-20 tokens.</p>

          <h3 style={h3Style}>ERC-721 (Ethereum NFTs)</h3>
          <p style={prose}><strong>ERC-721</strong> defines non-fungible tokens where each token has a unique identifier. Unlike ERC-20 tokens that are identical, ERC-721 tokens can have different properties, ownership histories, and metadata.</p>
          <p style={prose}>This standard enables digital collectibles, gaming items, and tokenised real-world assets with unique characteristics. NFT transfers typically cost £15-40 in gas fees during normal network conditions. Contract deployment runs £500-1,500 for basic NFT collections.</p>

          <h3 style={h3Style}>ERC-1155 (Multi-Token Standard)</h3>
          <p style={prose}><strong>ERC-1155</strong> allows a single smart contract to manage multiple token types — both fungible and non-fungible. This is particularly useful for gaming applications where you might have currency tokens (fungible) and unique items (non-fungible) in the same ecosystem.</p>
          <p style={prose}>The standard reduces deployment costs by approximately 60-80% compared to deploying separate ERC-20 and ERC-721 contracts and enables more complex tokenomics within single contracts. Deployment typically costs £800-2,000 for comprehensive multi-token systems.</p>

          <h3 style={h3Style}>BEP-20 (Binance Smart Chain)</h3>
          <p style={prose}><strong>BEP-20</strong> is Binance Smart Chain's equivalent to ERC-20, with similar functionality but lower transaction costs. Many projects deploy on both Ethereum (ERC-20) and BSC (BEP-20) to offer users choice between decentralisation and cost efficiency.</p>
          <div style={tipBox}>
            <p style={{ fontSize: 15, color: VT, margin: 0 }}><strong style={{ color: V }}>Cross-chain complexity:</strong> The same token (like USDT) can exist on multiple blockchains using different standards. USDT exists as ERC-20 on Ethereum (£2-15 transfer cost), BEP-20 on BSC (£0.20 transfer cost), and TRC-20 on Tron (£0.10 transfer cost) — each with different confirmation times ranging from 1-15 minutes.</p>
          </div>

          <h3 style={h3Style}>SPL Tokens (Solana)</h3>
          <p style={prose}><strong>Solana Program Library</strong> (SPL) tokens are Solana's token standard, offering high throughput and low costs. SPL tokens benefit from Solana's proof-of-stake consensus and parallel transaction processing.</p>
          <p style={prose}>Major projects like <strong>Serum</strong> and <strong>Raydium</strong> use SPL tokens, and many Ethereum projects have bridged to Solana to leverage lower transaction costs — typically £0.01-0.05 per transaction with 400ms confirmation times. Token creation costs approximately £2-5 on Solana.</p>

          <h3 style={h3Style}>TRC-20 (Tron)</h3>
          <p style={prose}><strong>TRC-20</strong> is Tron's token standard, similar to ERC-20 but designed for Tron's delegated proof-of-stake network. It's particularly popular for USDT transfers due to Tron's low transaction fees — typically £0.10 with 1-3 minute confirmation times. Token deployment costs around £10-20 on Tron.</p>

          {/* Fiat banking implications */}
          <h2 id="fiat-banking-implications" style={h2Style}>How do different token types affect fiat banking operations?</h2>
          <p style={prose}>Each token type creates different requirements for fiat banking infrastructure. Understanding these patterns is essential for crypto platforms designing their operational architecture.</p>
          <p style={prose}>The token type determines regulatory classification, reserve requirements, compliance obligations, and settlement patterns. The EagleNet settlement network provides 24/7 instant fiat settlement specifically designed for these token operation patterns.</p>

          <h3 style={h3Style}>Stablecoins and reserve management</h3>
          <p style={prose}>Fiat-collateralised stablecoins require equivalent fiat reserves held in traditional banking relationships. <strong>Circle</strong> (USDC issuer) maintains fully-reserved accounts with regulated financial institutions. When users mint USDC, Circle receives fiat and issues tokens. When users redeem, Circle burns tokens and releases fiat.</p>
          <p style={prose}>This creates operational dependencies on banking infrastructure for reserve management, regulatory reporting, and redemption processing. Stablecoin issuers need banking partners that understand crypto business models and can provide real-time settlement capabilities — USDC redemptions typically process within 1-2 business days through traditional banking rails, costing £5-15 per redemption in banking fees.</p>

          <h3 style={h3Style}>Security tokens and compliance</h3>
          <p style={prose}>Security tokens often require integration with traditional financial infrastructure for compliance, investor verification, and regulatory reporting. They may need connections to cap table management systems, transfer agents, and regulatory filing systems.</p>
          <p style={prose}>The fiat banking layer must support enhanced due diligence, transaction monitoring, and reporting requirements that exceed typical crypto platform standards. Security token transactions typically require 3-5 business day settlement periods due to compliance verification processes and cost £25-100 per transaction in compliance overhead.</p>

          <h3 style={h3Style}>Utility and governance tokens</h3>
          <p style={prose}>Whilst utility and governance tokens don't require direct fiat backing, they create fiat banking needs through platform operations. Exchanges need fiat on/off-ramps for these tokens, treasury management for platform revenues, and settlement capabilities for institutional trades.</p>
          <p style={prose}>The banking infrastructure must handle the conversion between these tokens and fiat currencies efficiently, particularly for high-volume trading platforms processing hundreds of trades per hour. Wire transfer costs typically run £15-25 for international settlements. The Oxygen compliance engine provides real-time monitoring for these mixed token-fiat flows.</p>

          <div style={tipBox}>
            <p style={{ fontSize: 15, color: VT, margin: 0 }}><strong style={{ color: V }}>Banking complexity:</strong> A single crypto platform might handle multiple token types simultaneously — USDC redemptions requiring 1-2 day fiat settlement, governance token trading requiring efficient on/off-ramps, and NFT sales requiring payment processing. Each creates different banking infrastructure requirements with varying settlement times and compliance obligations costing £5-100 per transaction.</p>
          </div>

          {/* Operational considerations */}
          <h2 id="operational-considerations" style={h2Style}>What should crypto platforms consider when handling tokens?</h2>
          <p style={prose}>Building infrastructure for token operations requires careful consideration of technical, regulatory, and operational factors that vary significantly by token type. Proper implementation typically requires 3-6 months for comprehensive token support with development costs ranging from £100,000-500,000 depending on complexity.</p>

          <h3 style={h3Style}>Smart contract risk management</h3>
          <p style={prose}>Unlike coins that use native blockchain functions, tokens depend on smart contracts. This introduces additional risk vectors: contract bugs, upgrade mechanisms, admin keys, and dependency on external contracts. Platforms must evaluate each token's smart contract architecture before integration.</p>
          <p style={prose}>Due diligence should include contract audits, upgrade patterns, and multisig configurations for any admin functions. Professional smart contract audits typically cost £15,000-50,000 and take 2-4 weeks to complete. Insurance for smart contract risks ranges from £10,000-100,000 annually depending on TVL.</p>

          <h3 style={h3Style}>Gas optimisation strategies</h3>
          <p style={prose}>Token transactions require smart contract execution, which typically costs more gas than native coin transfers. Platforms handling high volumes need gas optimisation strategies: batch processing, layer-2 solutions, or alternative blockchain deployment.</p>
          <p style={prose}>Cost management becomes particularly important for platforms processing many small transactions or operating on high-gas-cost networks. Batch processing can reduce per-transaction costs by 60-80% during high-traffic periods. Layer-2 solutions can reduce costs from £15-40 per transaction to £0.10-1.00.</p>

          <h3 style={h3Style}>Regulatory compliance frameworks</h3>
          <p style={prose}>Different token types trigger different regulatory requirements. Platforms must implement flexible compliance frameworks that can adapt to token classification changes. What starts as a utility token might be reclassified as a security based on usage patterns or regulatory guidance.</p>
          <p style={prose}>Compliance systems need to track token classifications, implement appropriate controls, and generate required reports for different token types. Regulatory compliance reviews typically occur quarterly and require 1-2 weeks of documentation preparation. Compliance software licensing costs £10,000-50,000 annually.</p>

          <h3 style={h3Style}>Settlement and reconciliation</h3>
          <p style={prose}>Token operations often require coordination between blockchain transactions and fiat banking systems. Stablecoin redemptions must match blockchain burns with fiat releases. Exchange operations must reconcile token trades with fiat settlement.</p>
          <p style={prose}>Platforms need robust reconciliation systems that can handle the timing differences between blockchain finality and banking settlement. Traditional banking settlement can take 1-3 business days, whilst blockchain transactions confirm in minutes. The EagleNet settlement network eliminates these timing mismatches with 24/7 instant fiat settlement at £2-5 per transaction.</p>

          <h3 style={h3Style}>Cross-chain token management</h3>
          <p style={prose}>Many tokens exist on multiple blockchains with different standards and characteristics. USDT operates on Ethereum (ERC-20), Binance Smart Chain (BEP-20), Tron (TRC-20), and other networks. Each deployment has different transaction costs, confirmation times, and liquidity profiles.</p>
          <p style={prose}>Platforms must decide which networks to support, how to handle cross-chain transfers, and how to manage liquidity across different deployments. Cross-chain bridge operations typically take 10-30 minutes and cost £5-25 depending on network selection. Bridge infrastructure setup costs £50,000-200,000 for comprehensive multi-chain support.</p>

          {/* Summary box */}
          <div className="summary-box" style={{ background: `linear-gradient(135deg, #1C1208, ${VM}, ${V})`, borderRadius: 24, padding: "32px", marginBottom: 56, color: "#fff" }}>
            <h2 style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, marginBottom: 24 }}>The short version</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                ["🪙", "Token vs Coin", "Coins are native blockchain assets; tokens are smart contract applications"],
                ["🏷️", "Token Types", "Utility, security, stablecoins, governance, NFTs, wrapped tokens"],
                ["⚙️", "Standards", "ERC-20, ERC-721, BEP-20, SPL, TRC-20 define token behaviour"],
                ["🏦", "Banking Impact", "Different tokens require different fiat infrastructure approaches"],
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
              <FaqItem q="What is the difference between a crypto token and a coin?" a="A coin is the native digital asset of a blockchain (like Bitcoin on Bitcoin or Ether on Ethereum), whilst a token is built on top of an existing blockchain using smart contracts. Coins secure their own networks; tokens leverage existing blockchain infrastructure." />
              <FaqItem q="What are the main types of crypto tokens?" a="The main types are utility tokens (access to services), security tokens (represent ownership rights), stablecoins (pegged to fiat currencies), governance tokens (voting rights in protocols), NFTs (unique digital assets), and wrapped tokens (representations of assets from other blockchains)." />
              <FaqItem q="What is an ERC-20 token?" a="ERC-20 is the most common token standard on Ethereum, defining how fungible tokens should behave. It specifies functions like transfer, balance checking, and approval mechanisms. Most tokens on Ethereum, including USDC and UNI, follow this standard." />
              <FaqItem q="How do stablecoins maintain their value?" a="Stablecoins maintain their value through different mechanisms: fiat-collateralised stablecoins like USDC hold equivalent fiat reserves in banks, crypto-collateralised ones use overcollateralisation with crypto assets, and algorithmic stablecoins use market mechanisms to maintain their peg." />
              <FaqItem q="Why do crypto platforms need fiat banking for token operations?" a="Crypto platforms need fiat banking for on/off-ramps (converting fiat to tokens and vice versa), reserve management for stablecoin issuers, settlement between platforms, and compliance with regulatory requirements for certain token types like security tokens." />
              <FaqItem q="What's the best banking infrastructure for crypto token platforms?" a="Fiat Republic provides multi-bank API access, 24/7 instant settlement through EagleNet, and crypto-native compliance through Oxygen, enabling crypto platforms to handle the fiat side of token operations without debanking risk." />
            </div>
          </section>

          {/* CTA */}
          <section style={{ background: `linear-gradient(135deg, ${VD}, ${V}, #F59E0B)`, borderRadius: 24, padding: "40px 32px", marginBottom: 48, textAlign: "center", boxShadow: `0 8px 32px ${V}33` }}>
            <h2 style={{ fontFamily: serif, fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 16 }}>One tool that handles all of it.</h2>
            <p style={{ color: "rgba(255,255,255,0.85)", maxWidth: 480, margin: "0 auto 24px", fontSize: 17, lineHeight: 1.6 }}>Your platform handles multiple token types with different banking requirements. Fiat Republic provides the unified fiat infrastructure that scales with your token operations.</p>
            <a href="https://fiatrepublic.com/contact" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: V, fontWeight: 700, padding: "14px 32px", borderRadius: 99, textDecoration: "none", fontSize: 15 }}>
              Build with Fiat Republic →
            </a>
          </section>

          {/* Related */}
          <section style={{ borderTop: `1px solid ${VB}66`, paddingTop: 40 }}>
            <h2 style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, color: "#1C1208", marginBottom: 24 }}>Related articles</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
              <a href="https://fiatrepublic.com/product" style={{ display: "block", padding: 20, background: "#fff", border: `1px solid ${VB}`, borderRadius: 12, textDecoration: "none" }}>
                <h3 style={{ fontFamily: serif, fontSize: 16, fontWeight: 600, color: "#1C1208", marginBottom: 8 }}>Fiat Republic Product Overview</h3>
                <p style={{ fontSize: 13, color: VM, margin: 0, lineHeight: 1.5 }}>Multi-bank API access, 24/7 settlement, and crypto-native compliance infrastructure</p>
              </a>
              <a href="https://fiatrepublic.com/oxygen" style={{ display: "block", padding: 20, background: "#fff", border: `1px solid ${VB}`, borderRadius: 12, textDecoration: "none" }}>
                <h3 style={{ fontFamily: serif, fontSize: 16, fontWeight: 600, color: "#1C1208", marginBottom: 8 }}>Oxygen Compliance Engine</h3>
                <p style={{ fontSize: 13, color: VM, margin: 0, lineHeight: 1.5 }}>Purpose-built transaction monitoring for crypto business flows and token operations</p>
              </a>
            </div>
          </section>

        </article>
      </div>
    </SEOLayout>
  );
}
