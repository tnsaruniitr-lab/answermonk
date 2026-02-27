import valeoLogoPath from "@assets/valeo-logo.png";

export interface BrandConfig {
  logoUrl: string;
  primaryColor: string;
  accentBg: string;
  displayName: string;
}

const brandConfigs: Record<string, BrandConfig> = {
  valeo: {
    logoUrl: valeoLogoPath,
    primaryColor: "#32445B",
    accentBg: "#f4f2ef",
    displayName: "Valeo Health",
  },
};

export function getBrandConfig(brandName: string): BrandConfig | null {
  const key = brandName.toLowerCase().trim();
  return brandConfigs[key] || null;
}
