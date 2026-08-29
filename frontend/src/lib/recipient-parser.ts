export interface ParseResult {
  valid: string[];
  invalid: string[];
  duplicates: string[];
}

export function parseRecipients(
  text: string,
): ParseResult {
  const entries = text
    .split(/[\n,;]/)
    .map((value) =>
      value
        .trim()
        .replace(/^["']|["']$/g, "")
        .toLowerCase(),
    )
    .filter(Boolean);

  const valid: string[] = [];
  const invalid: string[] = [];
  const duplicates: string[] = [];

  const seen = new Set<string>();

  for (const email of entries) {
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email,
      )
    ) {
      invalid.push(email);
      continue;
    }

    if (seen.has(email)) {
      duplicates.push(email);
      continue;
    }

    seen.add(email);
    valid.push(email);
  }

  return {
    valid,
    invalid,
    duplicates,
  };
}