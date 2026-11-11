/** Display-only formatting; stored names and access checks remain untouched. */
export function personDisplayName(name: string) {
  return name.replace(/\s*(?:[·—–-]\s*)?\bdemo\b\s*/gi, " ").trim();
}

export const DEMO_PERSON_IDS = {
  carmen: "d0000000-0000-4000-8000-000000000001",
  antonio: "d0000000-0000-4000-8000-000000000002",
} as const;