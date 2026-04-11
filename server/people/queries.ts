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
  type: "default" | "landscape" | "industry";
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

  if (trackATemplates.length > 0) {
    return trackATemplates.map((t) => ({
      index: t.index,
      angle: t.angle,
      text: fillTemplate(t.template, vars),
    }));
  }

  const role = anchors.roles[0] ?? "";
  const company = anchors.workplaces[0] ?? "";
  const pastCompany = anchors.workplaces[1] ?? "";
  const industryLabel = industry ?? "their industry";
  const identityString = buildIdentityString(name, anchors);

  return [
    {
      index: 1,
      angle: "Full identity",
      text: `Tell me about ${identityString}. Who are they, what are they known for, and what is their professional background?`,
    },
    {
      index: 2,
      angle: "Role-first",
      text: role
        ? `Who is ${name}, the ${role}? What is their background and what are they known for professionally?`
        : `Who is ${name}? Describe their professional background and what they are best known for.`,
    },
    {
      index: 3,
      angle: "Company-first",
      text: company
        ? `Tell me about ${name} from ${company}. What is their role, background, and what have they accomplished?`
        : `Search for ${name} and tell me about their current professional role, company, and key accomplishments.`,
    },
    {
      index: 4,
      angle: "Expertise framing",
      text: `What is ${name} known for in ${industryLabel}? What are their main contributions, expertise areas, and professional reputation?`,
    },
  ];
}

export function buildTrackBQueries(
  name: string,
  industry: string | null | undefined,
  templates?: PeoplePromptTemplate[]
): TrackBQuery[] {
  const trackBTemplates = (templates ?? []).filter((t) => t.track === "B");
  const industryLabel = industry ?? "business and technology";

  const vars = {
    name,
    industry: industryLabel,
    identity_string: name,
  };

  if (trackBTemplates.length > 0) {
    return trackBTemplates.map((t) => ({
      index: t.index,
      type: (t.angle === "Default recognition"
        ? "default"
        : t.angle === "Name landscape"
        ? "landscape"
        : "industry") as "default" | "landscape" | "industry",
      text: fillTemplate(t.template, vars),
    }));
  }

  return [
    {
      index: 1,
      type: "default",
      text: `Who is ${name}? Tell me who this person is, what they do, and what they are best known for.`,
    },
    {
      index: 2,
      type: "landscape",
      text: `Who are the most well-known and notable people named ${name}? List up to 10 people, numbered 1 through 10 in order of prominence. For each person include their full name, profession, and what they are specifically known for.`,
    },
    {
      index: 3,
      type: "industry",
      text: `Who are the leading ${name}s in ${industryLabel}? Are there any prominent professionals, entrepreneurs, or public figures with this name in this field?`,
    },
  ];
}
