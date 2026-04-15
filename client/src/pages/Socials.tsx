import { useQuery } from "@tanstack/react-query";
import { Globe, Linkedin, Twitter, Instagram, Facebook, Youtube, ExternalLink } from "lucide-react";
import { MonkWordmark } from "@/components/MonkWordmark";
import type { Brand } from "@shared/schema";

function domain(url: string) {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

function SocialLink({ href, icon: Icon, label }: { href: string | null; icon: any; label: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 32, height: 32, borderRadius: 8,
        background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)",
        color: "#6366f1", textDecoration: "none", flexShrink: 0,
        transition: "background 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.18)")}
      onMouseLeave={e => (e.currentTarget.style.background = "rgba(99,102,241,0.08)")}
    >
      <Icon size={15} />
    </a>
  );
}

function BrandCard({ brand }: { brand: Brand }) {
  const hasSocials = brand.linkedin || brand.twitter || brand.instagram || brand.facebook || brand.youtube || brand.tiktok;
  return (
    <div
      data-testid={`card-brand-${brand.id}`}
      style={{
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14,
        padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {brand.brandName || domain(brand.websiteUrl)}
          </div>
          <a
            href={brand.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, color: "#6366f1", textDecoration: "none", display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}
          >
            <Globe size={11} />
            {domain(brand.websiteUrl)}
            <ExternalLink size={10} />
          </a>
        </div>
        <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap", flexShrink: 0, marginTop: 2 }}>
          {brand.confirmedAt ? new Date(brand.confirmedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}
        </span>
      </div>

      {brand.tagline && (
        <p style={{ fontSize: 13, color: "#6b7280", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
          "{brand.tagline}"
        </p>
      )}

      {brand.description && (
        <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {brand.description}
        </p>
      )}

      {brand.positioningStatement && (
        <p style={{ fontSize: 12, color: "#6b7280", margin: 0, lineHeight: 1.4, padding: "8px 10px", background: "rgba(99,102,241,0.05)", borderRadius: 6, borderLeft: "3px solid #6366f1" }}>
          {brand.positioningStatement}
        </p>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
        {brand.voiceArchetype && (
          <span style={{ fontSize: 11, fontWeight: 600, color: "#7c3aed", background: "rgba(124,58,237,0.08)", borderRadius: 100, padding: "2px 8px", border: "1px solid rgba(124,58,237,0.15)" }}>
            {brand.voiceArchetype}
          </span>
        )}
        {brand.companySize && (
          <span style={{ fontSize: 11, color: "#6b7280", background: "#f9fafb", borderRadius: 100, padding: "2px 8px", border: "1px solid #e5e7eb" }}>
            {brand.companySize}
          </span>
        )}
        {brand.founded && (
          <span style={{ fontSize: 11, color: "#6b7280", background: "#f9fafb", borderRadius: 100, padding: "2px 8px", border: "1px solid #e5e7eb" }}>
            Est. {brand.founded}
          </span>
        )}
      </div>

      {brand.primaryKeywords && brand.primaryKeywords.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {brand.primaryKeywords.slice(0, 5).map((kw, i) => (
            <span key={i} style={{ fontSize: 11, color: "#374151", background: "#f3f4f6", borderRadius: 4, padding: "2px 7px" }}>
              {kw}
            </span>
          ))}
        </div>
      )}

      {hasSocials && (
        <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
          <SocialLink href={brand.linkedin} icon={Linkedin} label="LinkedIn" />
          <SocialLink href={brand.twitter} icon={Twitter} label="X / Twitter" />
          <SocialLink href={brand.instagram} icon={Instagram} label="Instagram" />
          <SocialLink href={brand.facebook} icon={Facebook} label="Facebook" />
          <SocialLink href={brand.youtube} icon={Youtube} label="YouTube" />
        </div>
      )}
    </div>
  );
}

export default function Socials() {
  const { data: brandList, isLoading } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)", fontFamily: "inherit" }}>
      <nav style={{ padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(99,102,241,0.1)", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)" }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <MonkWordmark />
        </a>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#6366f1", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 100, padding: "4px 12px" }}>
          Brand Directory
        </span>
      </nav>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ marginBottom: 40, textAlign: "center" }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#111827", margin: "0 0 10px" }}>
            Brand Directory
          </h1>
          <p style={{ fontSize: 15, color: "#6b7280", margin: 0 }}>
            Brands that have confirmed their AI brand profile through BrandSmith
          </p>
        </div>

        {isLoading && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200, color: "#6b7280", gap: 10 }}>
            <div style={{ width: 20, height: 20, border: "2px solid #6366f1", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            Loading brands…
          </div>
        )}

        {!isLoading && (!brandList || brandList.length === 0) && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏷️</div>
            <p style={{ margin: 0, fontSize: 14 }}>No confirmed brands yet. Analyse a brand with BrandSmith to get started.</p>
            <a href="/agents/brandsmith" style={{ display: "inline-block", marginTop: 16, fontSize: 13, fontWeight: 600, color: "#6366f1", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, padding: "8px 16px", textDecoration: "none" }}>
              Go to BrandSmith →
            </a>
          </div>
        )}

        {brandList && brandList.length > 0 && (
          <>
            <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 24, textAlign: "right" }}>
              {brandList.length} brand{brandList.length !== 1 ? "s" : ""} confirmed
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 16 }}>
              {brandList.map(brand => (
                <BrandCard key={brand.id} brand={brand} />
              ))}
            </div>
          </>
        )}
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
