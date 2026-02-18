import { z } from "zod";

export const PersonaTypeEnum = z.enum(["marketing_agency", "automation_consultant"]);
export type PersonaType = z.infer<typeof PersonaTypeEnum>;

export const ClusterEnum = z.enum(["direct", "persona", "budget", "task"]);
export type Cluster = z.infer<typeof ClusterEnum>;

export const ShapeEnum = z.enum(["open", "top3", "top5", "best"]);
export type Shape = z.infer<typeof ShapeEnum>;

export const BudgetTierEnum = z.enum(["budget", "mid", "premium"]);
export type BudgetTier = z.infer<typeof BudgetTierEnum>;

export const BuyerIntentProfileSchema = z.object({
  persona_type: PersonaTypeEnum,
  category: z.string().min(1),
  verticals: z.array(z.string().min(1)).min(1),
  services: z.array(z.string().min(1)).min(2),
  modifiers: z.array(z.string().min(1)).max(6).optional().default([]),
  geo: z.string().optional(),
  budget_tier: BudgetTierEnum.optional().default("mid"),
  modifier_focus: z.boolean().optional().default(false),
  language: z.literal("en").optional().default("en"),
});
export type BuyerIntentProfile = z.infer<typeof BuyerIntentProfileSchema>;

export interface SlotTerm {
  key: string;
  display: string;
  verified: boolean;
  type: "category" | "vertical" | "service" | "modifier" | "geo" | "budget_adj";
  source: "user" | "preset";
}

export interface SlotBank {
  category_terms: SlotTerm[];
  vertical_terms: SlotTerm[];
  service_terms: SlotTerm[];
  modifier_terms: SlotTerm[];
  geo_terms: SlotTerm[];
  budget_adjs: SlotTerm[];
  unverified_modifiers: SlotTerm[];
  persona_mode: "provider_led" | "problem_led";
}

export interface Prompt {
  id: string;
  cluster: Cluster;
  shape: Shape;
  text: string;
  slots_used: Record<string, string>;
  tags: string[];
  modifier_included: boolean;
  geo_included: boolean;
}

export interface PromptSet {
  prompt_set_id: string;
  version: "pg_v1";
  seed_used: number;
  counts: {
    by_cluster: Record<string, number>;
    by_shape: Record<string, number>;
    modifier_prompts: number;
    geo_prompts: number;
  };
  slot_bank: SlotBank;
  prompts: Prompt[];
  unverified_items: SlotTerm[];
}
