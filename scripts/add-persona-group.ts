#!/usr/bin/env tsx
/**
 * scripts/add-persona-group.ts
 *
 * Deterministically adds new personas to the B2B SaaS – Collections group
 * (the CM persona family) across every relevant codebase file.
 *
 * All new personas share the existing CM services/modifiers/budget structure.
 * You may optionally supply extra services and customers to append to the
 * CREDIT_MANAGEMENT_SERVICES / CREDIT_MANAGEMENT_VERTICALS arrays.
 *
 * Usage:
 *   npx tsx scripts/add-persona-group.ts <input-file.txt>
 *   cat input.txt | npx tsx scripts/add-persona-group.ts
 *
 * Input format (plain text, section headers case-insensitive):
 *
 *   Personas
 *   Invoice Reminder Software
 *   Payment Reminder Software
 *
 *   Services
 *   invoice reminder automation
 *   automated payment reminders
 *
 *   Customers
 *   Consumer-facing SMEs
 *   Mid-market companies
 */

import fs from "fs";
import path from "path";

// ── helpers ───────────────────────────────────────────────────────────────────

function toSnakeCase(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

interface ParsedInput {
  personas: Array<{ key: string; label: string }>;
  services: string[];
  customers: string[];
}

function parseInput(text: string): ParsedInput {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const sections: Record<string, string[]> = {};
  let currentSection = "";
  const headers = ["personas", "services", "customers"];

  for (const line of lines) {
    if (headers.includes(line.toLowerCase())) {
      currentSection = line.toLowerCase();
      sections[currentSection] = [];
    } else if (currentSection) {
      sections[currentSection].push(line);
    }
  }

  return {
    personas: (sections.personas ?? []).map((label) => ({
      key: toSnakeCase(label),
      label,
    })),
    services: sections.services ?? [],
    customers: sections.customers ?? [],
  };
}

function insertAfterSentinel(
  content: string,
  sentinel: string,
  newLines: string
): string {
  if (!content.includes(sentinel)) {
    throw new Error(`Sentinel not found: "${sentinel}"`);
  }
  return content.replace(sentinel, `${sentinel}\n${newLines}`);
}

function patchFile(filePath: string, fn: (c: string) => string): void {
  const abs = path.resolve(filePath);
  const original = fs.readFileSync(abs, "utf-8");
  const updated = fn(original);
  if (updated === original) {
    console.log(`  (no-op)   ${filePath}`);
    return;
  }
  fs.writeFileSync(abs, updated, "utf-8");
  console.log(`  (updated) ${filePath}`);
}

// ── file-specific patchers ─────────────────────────────────────────────────────

function patchTypesTs(
  personas: Array<{ key: string; label: string }>
): void {
  patchFile("server/promptgen/types.ts", (c) => {
    const toAdd = personas
      .filter(({ key }) => !c.includes(`"${key}"`))
      .map(({ key }) => `  "${key}",`)
      .join("\n");
    if (!toAdd) return c;
    return insertAfterSentinel(c, "  // [PG:ENUM_INSERT]", toAdd);
  });
}

function patchPresetsTs(
  personas: Array<{ key: string; label: string }>,
  services: string[],
  customers: string[]
): void {
  patchFile("server/promptgen/presets.ts", (c) => {
    // CM_PERSONAS list
    const newKeys = personas
      .filter(({ key }) => !c.includes(`"${key}"`))
      .map(({ key }) => `  "${key}",`)
      .join("\n");
    if (newKeys) c = insertAfterSentinel(c, "  // [PG:CM_PERSONAS_INSERT]", newKeys);

    // CREDIT_MANAGEMENT_SERVICES (deduplicated)
    const newSvcs = services
      .filter((s) => !c.includes(`"${s}"`))
      .map((s) => `  "${s}",`)
      .join("\n");
    if (newSvcs) c = insertAfterSentinel(c, "  // [PG:CM_SERVICES_INSERT]", newSvcs);

    // CREDIT_MANAGEMENT_VERTICALS (deduplicated)
    const newVerts = customers
      .filter((s) => !c.includes(`"${s}"`))
      .map((s) => `  "${s}",`)
      .join("\n");
    if (newVerts) c = insertAfterSentinel(c, "  // [PG:CM_VERTICALS_INSERT]", newVerts);

    // BUDGET_ADJECTIVES – same CM pattern
    const newBudget = personas
      .filter(({ key }) => !c.includes(`  ${key}: { budget:`))
      .map(
        ({ key }) =>
          `  ${key}: { budget: ["affordable", "per-invoice", "no-commitment"], mid: ["scalable", "cost-effective", "flexible"], premium: ["enterprise-grade", "white-label", "full-featured"] },`
      )
      .join("\n");
    if (newBudget) c = insertAfterSentinel(c, "  // [PG:CM_BUDGET_ADJ_INSERT]", newBudget);

    // SERVICE_VERB_PREFIXES – same CM pattern
    const newVerbs = personas
      .filter(({ key }) => !c.includes(`  ${key}: ["automate"`))
      .map(({ key }) => `  ${key}: ["automate", "reduce", "manage"],`)
      .join("\n");
    if (newVerbs) c = insertAfterSentinel(c, "  // [PG:CM_VERB_INSERT]", newVerbs);

    // PERSONA_CATEGORY_LABELS – same CM label
    const newCatLabels = personas
      .filter(({ key }) => !c.includes(`  ${key}: "credit management`))
      .map(
        ({ key }) =>
          `  ${key}: "credit management software, payment reminder platforms, or collections automation solutions",`
      )
      .join("\n");
    if (newCatLabels) c = insertAfterSentinel(c, "  // [PG:CM_CAT_LABEL_INSERT]", newCatLabels);

    // getModifierKnownList switch – new cases → CREDIT_MANAGEMENT_MODIFIERS
    const newCases = personas
      .filter(({ key }) => !c.includes(`case "${key}"`))
      .map(({ key }) => `    case "${key}": return CREDIT_MANAGEMENT_MODIFIERS;`)
      .join("\n");
    if (newCases) c = insertAfterSentinel(c, "    // [PG:CM_MODIFIER_CASE_INSERT]", newCases);

    return c;
  });
}

function patchSegmentAnalysis(
  personas: Array<{ key: string; label: string }>
): void {
  patchFile("server/segment-analysis/index.ts", (c) => {
    const newEntries = personas
      .filter(({ key }) => !c.includes(`  ${key}: `))
      .map(({ key }) => `  ${key}: "credit management",`)
      .join("\n");
    if (!newEntries) return c;
    return insertAfterSentinel(c, "  // [PG:SEGMENT_CAT_INSERT]", newEntries);
  });
}

function patchReportGenerator(
  personas: Array<{ key: string; label: string }>
): void {
  patchFile("server/report/generator.ts", (c) => {
    const newEntries = personas
      .filter(({ key }) => !c.includes(`  ${key}: `))
      .map(({ key, label }) => `  ${key}: "${label}",`)
      .join("\n");
    if (!newEntries) return c;
    return insertAfterSentinel(c, "  // [PG:REPORT_LABEL_INSERT]", newEntries);
  });
}

function patchHistory(
  personas: Array<{ key: string; label: string }>
): void {
  patchFile("client/src/pages/History.tsx", (c) => {
    const indent = "                            ";
    const newEntries = personas
      .filter(({ key }) => !c.includes(`${key}: `))
      .map(({ key, label }) => `${indent}${key}: "${label}",`)
      .join("\n");
    if (!newEntries) return c;
    return insertAfterSentinel(
      c,
      `${indent}// [PG:HISTORY_LABEL_INSERT]`,
      newEntries
    );
  });
}

function patchPromptGenerator(
  personas: Array<{ key: string; label: string }>
): void {
  patchFile("client/src/pages/PromptGenerator.tsx", (c) => {
    // ── Dropdown 1 (single-segment / quick mode) ──────────────────────────
    const dd1 = personas
      .filter(({ key }) => !c.includes(`value="${key}"`))
      .map(
        ({ key, label }) =>
          `                              <SelectItem value="${key}">${label}</SelectItem>`
      )
      .join("\n");
    if (dd1)
      c = insertAfterSentinel(
        c,
        "                              {/* [PG:DD1_CM_TAIL] */}",
        dd1
      );

    // ── Dropdown 2 (multi-segment) ────────────────────────────────────────
    const dd2 = personas
      .filter(({ key }) => !c.includes(`value="${key}"`))
      .map(
        ({ key, label }) =>
          `                                          <SelectItem value="${key}">${label}</SelectItem>`
      )
      .join("\n");
    if (dd2)
      c = insertAfterSentinel(
        c,
        "                                          {/* [PG:DD2_CM_TAIL] */}",
        dd2
      );

    // ── Dropdown 3 (advanced mode) ────────────────────────────────────────
    const dd3 = personas
      .filter(({ key }) => !c.includes(`value="${key}"`))
      .map(
        ({ key, label }) =>
          `                            <SelectItem value="${key}">${label}</SelectItem>`
      )
      .join("\n");
    if (dd3)
      c = insertAfterSentinel(
        c,
        "                            {/* [PG:DD3_CM_TAIL] */}",
        dd3
      );

    // ── seedType condition array ──────────────────────────────────────────
    // The line contains a big array ending with ..."eu_payment_link_software"]
    // We grab that line, check which keys are missing, and prepend them.
    const seedTypeAnchor = `"eu_payment_link_software"].includes(v)`;
    if (c.includes(seedTypeAnchor)) {
      const lineWithAnchor = c
        .split("\n")
        .find((l) => l.includes(seedTypeAnchor)) ?? "";
      const missingKeys = personas
        .filter(({ key }) => !lineWithAnchor.includes(`"${key}"`))
        .map(({ key }) => `"${key}",`)
        .join("");
      if (missingKeys) {
        c = c.replace(seedTypeAnchor, `${missingKeys}${seedTypeAnchor}`);
      }
    }

    return c;
  });
}

// ── entry point ───────────────────────────────────────────────────────────────

async function main() {
  let inputText = "";
  if (process.argv[2]) {
    inputText = fs.readFileSync(path.resolve(process.argv[2]), "utf-8");
  } else {
    inputText = fs.readFileSync(0, "utf-8"); // stdin fd
  }

  const { personas, services, customers } = parseInput(inputText);

  if (!personas.length) {
    console.error(
      "No personas found in input.\n" +
      "Make sure your input has a 'Personas' section header.\n" +
      "See the script header comment for the expected format."
    );
    process.exit(1);
  }

  console.log(
    `\nAdding ${personas.length} persona(s) to B2B SaaS – Collections:`
  );
  personas.forEach(({ key, label }) =>
    console.log(`  • "${label}" → ${key}`)
  );
  if (services.length)
    console.log(`\n${services.length} service(s) to append to CM_SERVICES.`);
  if (customers.length)
    console.log(`${customers.length} customer(s) to append to CM_VERTICALS.`);
  console.log();

  patchTypesTs(personas);
  patchPresetsTs(personas, services, customers);
  patchSegmentAnalysis(personas);
  patchReportGenerator(personas);
  patchHistory(personas);
  patchPromptGenerator(personas);

  console.log(
    "\nAll done. Restart the dev server to pick up changes.\n"
  );
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
