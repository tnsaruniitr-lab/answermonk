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
  if (anchors.workplaces[1]) parts.push(`previously ${anchors.workplaces[1]}`);
  if (anchors.education[0]) parts.push(anchors.education[0]);
  return parts.join(", ");
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
  };

  // Use config templates if present, otherwise fall back to default single prompt
  const template = trackATemplates[0];
  if (template) {
    return [{ index: template.index, angle: template.angle, text: fillTemplate(template.template, vars) }];
  }

  const identityString = buildIdentityString(name, anchors);
  return [
    {
      index: 1,
      angle: "Identity & profile",
      text: `Tell me about ${identityString}. Who are they, what are they known for, and what is their professional background? Also provide: (1) a one-sentence definition of who this person is, (2) their key achievements, (3) their professional green flags, and (4) their professional red flags.`,
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
