import type { PeopleConfig, PeoplePromptTemplate } from "./config";
import { fillTemplate } from "./config";

export interface TrackAQuery {
  index: number;
  text: string;
  angle: string;
}

export interface TrackBQuery {
  index: number;
  text: string;
  type: "landscape";
}

function buildIdentityString(
  name: string,
  anchors: { workplaces: string[]; roles: string[]; education: string[] }
): string {
  const parts: string[] = [name];
  if (anchors.roles[0]) parts.push(anchors.roles[0]);
  if (anchors.workplaces[0]) parts.push(`at ${anchors.workplaces[0]}`);
  if (anchors.workplaces[1]) parts.push(`(previously ${anchors.workplaces[1]})`);
  if (anchors.education[0]) parts.push(anchors.education[0]);
  return parts.join(", ");
}

// Builds a structured paragraph listing every known anchor so the AI can
// identify exactly the right person rather than the most famous name-sharer.
function buildIdentityBlock(
  name: string,
  anchors: { workplaces: string[]; roles: string[]; education: string[] },
  industry?: string | null
): string {
  const lines: string[] = [];
  lines.push(`- Full name: ${name}`);
  if (anchors.roles[0])       lines.push(`- Current role: ${anchors.roles[0]}`);
  if (anchors.roles[1])       lines.push(`- Previous role: ${anchors.roles[1]}`);
  if (anchors.workplaces[0])  lines.push(`- Current company / organisation: ${anchors.workplaces[0]}`);
  if (anchors.workplaces[1])  lines.push(`- Previous company: ${anchors.workplaces[1]}`);
  if (anchors.workplaces[2])  lines.push(`- Also worked at: ${anchors.workplaces.slice(2).join(", ")}`);
  if (anchors.education[0])   lines.push(`- Education: ${anchors.education.join(", ")}`);
  if (industry)               lines.push(`- Industry: ${industry}`);

  // If we have at least one anchor beyond the name, wrap in a block
  if (lines.length > 1) {
    return `To help identify the right person, here are their known details:\n${lines.join("\n")}`;
  }

  // Name only — warn the AI that disambiguation is limited
  return `Note: only a name is available for this person — no role, company, or education data was provided. Please be explicit if you cannot confidently identify them.`;
}

export function buildTrackAQueries(
  name: string,
  anchors: { workplaces: string[]; roles: string[]; education: string[] },
  industry: string | null | undefined,
  templates?: PeoplePromptTemplate[]
): TrackAQuery[] {
  const trackATemplates = (templates ?? []).filter((t) => t.track === "A");

  const vars = {
    name,
    role: anchors.roles[0] ?? "",
    company: anchors.workplaces[0] ?? "",
    past_company: anchors.workplaces[1] ?? "",
    education: anchors.education[0] ?? "",
    industry: industry ?? "their industry",
    identity_string: buildIdentityString(name, anchors),
    identity_block: buildIdentityBlock(name, anchors, industry),
  };

  // Use config templates if present, otherwise fall back to default single prompt
  const template = trackATemplates[0];
  if (template) {
    return [{ index: template.index, angle: template.angle, text: fillTemplate(template.template, vars) }];
  }

  const identityString = buildIdentityString(name, anchors);
  const identityBlock = buildIdentityBlock(name, anchors, industry);
  return [
    {
      index: 1,
      angle: "Identity & profile",
      text: `Tell me about ${identityString}. Who are they, what are they known for professionally, and what is their professional background?\n\n${identityBlock}\n\nPlease provide:\n1. A one-sentence definition of who this specific person is\n2. Their key professional achievements\n3. Their professional green flags (recognised expertise, notable work, public credibility)\n4. Their professional red flags (limited public presence, incorrect attributions, gaps in record)\n\nImportant: if you cannot find information specifically about this person, say so clearly rather than describing someone else with the same name.`,
    },
  ];
}

export function buildTrackBQueries(
  name: string,
  industry: string | null | undefined,
  templates?: PeoplePromptTemplate[]
): TrackBQuery[] {
  const trackBTemplates = (templates ?? []).filter((t) => t.track === "B");

  const vars = { name, industry: industry ?? "business and technology", identity_string: name };

  const template = trackBTemplates[0];
  if (template) {
    return [{ index: template.index, type: "landscape", text: fillTemplate(template.template, vars) }];
  }

  return [
    {
      index: 1,
      type: "landscape",
      text: `Who are the most well-known and notable people named ${name}? List as many as you can confidently identify, up to 10 people, numbered in order of prominence. For each person write their full name with a parenthetical disambiguator (e.g. "Jake Stein (Australian footballer)"), their profession, and 1-2 sentences on what they are known for.`,
    },
  ];
}
