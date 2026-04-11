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

export function buildTrackAQueries(
  name: string,
  anchors: { workplaces: string[]; roles: string[]; education: string[] },
  industry?: string | null
): TrackAQuery[] {
  const role = anchors.roles[0] ?? "";
  const company = anchors.workplaces[0] ?? "";
  const pastCompany = anchors.workplaces[1] ?? "";
  const school = anchors.education[0] ?? "";
  const industryLabel = industry ?? "their industry";

  const identityParts: string[] = [name];
  if (role) identityParts.push(role);
  if (company) identityParts.push(`at ${company}`);
  if (pastCompany) identityParts.push(`previously ${pastCompany}`);
  if (school) identityParts.push(school);

  const queries: TrackAQuery[] = [
    {
      index: 1,
      angle: "Full identity string",
      text: `Tell me about ${identityParts.join(", ")}. Who are they, what are they known for, and what is their professional background?`,
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

  return queries;
}

export function buildTrackBQueries(name: string, industry?: string | null): TrackBQuery[] {
  const industryLabel = industry ?? "business and technology";

  return [
    {
      index: 1,
      type: "default",
      text: `Who is ${name}? Tell me who this person is, what they do, and what they are best known for.`,
    },
    {
      index: 2,
      type: "landscape",
      text: `Who are the most well-known and notable people named ${name}? List them with their backgrounds, professions, and what each is known for. Rank them by how prominent or well-known they are.`,
    },
    {
      index: 3,
      type: "industry",
      text: `Who are the leading ${name}s in ${industryLabel}? Are there any prominent professionals, entrepreneurs, or public figures with this name in this field?`,
    },
  ];
}
