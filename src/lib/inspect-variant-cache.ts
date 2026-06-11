import { mkdir } from "node:fs/promises";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  resolveInspectVariant,
  type InspectVariant,
} from "@/lib/inspect";

export type InspectVariantCache = {
  generatedAt: string;
  variants: Record<string, InspectVariant>;
};

export type InspectVariantEntry = {
  weaponDefIndex: number;
  paintIndex: string;
  releasedInCs2: boolean;
};

export const INSPECT_VARIANT_CACHE_PATH = join(
  process.cwd(),
  "src/data/inspect-variants.json",
);

const PROBE_CONCURRENCY = 24;

export function buildInspectVariantKey(
  weaponDefIndex: number,
  paintIndex: string,
): string {
  return `${weaponDefIndex}_${paintIndex}`;
}

export async function readInspectVariantCache(): Promise<InspectVariantCache> {
  try {
    const raw = await readFile(INSPECT_VARIANT_CACHE_PATH, "utf8");
    const parsed = JSON.parse(raw) as InspectVariantCache;

    return {
      generatedAt: parsed.generatedAt ?? "",
      variants: parsed.variants ?? {},
    };
  } catch {
    return {
      generatedAt: "",
      variants: {},
    };
  }
}

export async function writeInspectVariantCache(
  variants: Record<string, InspectVariant>,
): Promise<void> {
  const payload: InspectVariantCache = {
    generatedAt: new Date().toISOString(),
    variants,
  };

  await mkdir(dirname(INSPECT_VARIANT_CACHE_PATH), { recursive: true });
  await writeFile(
    INSPECT_VARIANT_CACHE_PATH,
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8",
  );
}

async function probeInspectVariants(
  entries: InspectVariantEntry[],
): Promise<InspectVariant[]> {
  const variants = new Array<InspectVariant>(entries.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < entries.length) {
      const index = nextIndex;
      nextIndex += 1;
      const entry = entries[index];

      if (!entry) {
        continue;
      }

      variants[index] = await resolveInspectVariant(entry);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(PROBE_CONCURRENCY, entries.length) }, () => worker()),
  );

  return variants;
}

function entriesToRecord(
  entries: InspectVariantEntry[],
  variants: InspectVariant[],
): Record<string, InspectVariant> {
  const record: Record<string, InspectVariant> = {};

  for (const [index, entry] of entries.entries()) {
    const variant = variants[index];

    if (variant === undefined) {
      continue;
    }

    record[buildInspectVariantKey(entry.weaponDefIndex, entry.paintIndex)] =
      variant;
  }

  return record;
}

export async function resolveInspectVariantsFromCache(
  entries: InspectVariantEntry[],
): Promise<InspectVariant[]> {
  const cache = await readInspectVariantCache();
  const missing: string[] = [];

  const results = entries.map((entry) => {
    const key = buildInspectVariantKey(entry.weaponDefIndex, entry.paintIndex);
    const variant = cache.variants[key];

    if (variant !== 0 && variant !== 1) {
      missing.push(key);
      return 0;
    }

    return variant;
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing ${missing.length} inspect variant(s) in src/data/inspect-variants.json. Run pnpm refresh-inspect-cache.`,
    );
  }

  return results;
}

export async function resolveInspectVariantsWithCache(
  entries: InspectVariantEntry[],
  options?: { writeMissing?: boolean },
): Promise<InspectVariant[]> {
  const cache = await readInspectVariantCache();
  const merged = { ...cache.variants };
  const results = new Array<InspectVariant>(entries.length);
  const missingEntries: InspectVariantEntry[] = [];
  const missingIndexes: number[] = [];

  for (const [index, entry] of entries.entries()) {
    const key = buildInspectVariantKey(entry.weaponDefIndex, entry.paintIndex);
    const cached = merged[key];

    if (cached === 0 || cached === 1) {
      results[index] = cached;
      continue;
    }

    missingEntries.push(entry);
    missingIndexes.push(index);
  }

  if (missingEntries.length > 0) {
    const probed = await probeInspectVariants(missingEntries);

    for (const [missingIndex, variant] of probed.entries()) {
      const entry = missingEntries[missingIndex];
      const resultIndex = missingIndexes[missingIndex];

      if (!entry || resultIndex === undefined || variant === undefined) {
        continue;
      }

      merged[buildInspectVariantKey(entry.weaponDefIndex, entry.paintIndex)] =
        variant;
      results[resultIndex] = variant;
    }

    if (options?.writeMissing !== false) {
      await writeInspectVariantCache(merged);
    }
  }

  return results.map((variant, index) => variant ?? 0);
}

export async function refreshInspectVariantCache(
  entries: InspectVariantEntry[],
): Promise<InspectVariantCache> {
  const variants = await probeInspectVariants(entries);
  const record = entriesToRecord(entries, variants);

  await writeInspectVariantCache(record);

  return {
    generatedAt: new Date().toISOString(),
    variants: record,
  };
}
