import type { Skin } from "@/types/skin";
import {
  resolveInspectVariantsFromCache,
  type InspectVariantEntry,
} from "@/lib/inspect-variant-cache";

const SKINS_API_URL =
  "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json";
const CRATES_API_URL =
  "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/crates.json";

const CS2_LAUNCH_DATE = new Date("2023-09-27");
const WEAPON_CATEGORIES = new Set(["Pistols", "Rifles", "SMGs", "Heavy"]);

type ApiSkin = {
  id: string;
  name: string;
  weapon?: {
    id: string;
    weapon_id?: number;
    name: string;
  };
  category?: {
    name: string;
  };
  pattern?: {
    name: string;
  };
  paint_index?: string;
  rarity?: {
    name: string;
    color: string;
  };
  crates?: Array<{ id: string }>;
};

type ApiCrate = {
  id: string;
  first_sale_date?: string | null;
};

export type SkinsCatalog = {
  generatedAt: string;
  skins: Skin[];
};

function parseSaleDate(value: string): Date {
  return new Date(value.replace(/\//g, "-"));
}

/** Used for search/filter labels only — CDN variant comes from inspect-variants.json. */
function inferReleasedInCs2(
  entry: ApiSkin,
  crateDates: Map<string, string | null | undefined>,
): boolean {
  const dates = (entry.crates ?? [])
    .map((crate) => crateDates.get(crate.id))
    .filter((date): date is string => Boolean(date))
    .map(parseSaleDate);

  if (dates.length === 0) {
    return false;
  }

  return dates.every((date) => date >= CS2_LAUNCH_DATE);
}

function toSkin(
  entry: ApiSkin,
  crateDates: Map<string, string | null | undefined>,
  inspectVariant: 0 | 1,
): Skin | null {
  const weaponDefIndex = entry.weapon?.weapon_id;
  const paintIndex = entry.paint_index;
  const category = entry.category?.name;

  if (
    !weaponDefIndex ||
    !paintIndex ||
    !category ||
    !WEAPON_CATEGORIES.has(category) ||
    !entry.weapon?.name ||
    !entry.pattern?.name ||
    !entry.rarity
  ) {
    return null;
  }

  return {
    id: entry.id,
    name: entry.name,
    weapon: entry.weapon.name,
    weaponKey: entry.weapon.id,
    weaponDefIndex,
    category,
    pattern: entry.pattern.name,
    paintIndex,
    rarity: entry.rarity.name,
    rarityColor: entry.rarity.color,
    releasedInCs2: inferReleasedInCs2(entry, crateDates),
    inspectVariant,
  };
}

export async function collectInspectVariantEntries(): Promise<InspectVariantEntry[]> {
  const [skinsResponse, cratesResponse] = await Promise.all([
    fetch(SKINS_API_URL),
    fetch(CRATES_API_URL),
  ]);

  if (!skinsResponse.ok) {
    throw new Error(`Failed to load skin catalog (${skinsResponse.status})`);
  }

  if (!cratesResponse.ok) {
    throw new Error(`Failed to load crate catalog (${cratesResponse.status})`);
  }

  const catalog = (await skinsResponse.json()) as ApiSkin[];
  const crates = (await cratesResponse.json()) as ApiCrate[];
  const crateDates = new Map(crates.map((crate) => [crate.id, crate.first_sale_date]));

  return catalog
    .map((entry) => {
      const weaponDefIndex = entry.weapon?.weapon_id;
      const paintIndex = entry.paint_index;
      const category = entry.category?.name;

      if (
        !weaponDefIndex ||
        !paintIndex ||
        !category ||
        !WEAPON_CATEGORIES.has(category) ||
        !entry.weapon?.name ||
        !entry.pattern?.name ||
        !entry.rarity
      ) {
        return null;
      }

      return {
        weaponDefIndex,
        paintIndex,
        releasedInCs2: inferReleasedInCs2(entry, crateDates),
      };
    })
    .filter((entry): entry is InspectVariantEntry => entry !== null);
}

export async function buildSkinsCatalog(): Promise<SkinsCatalog> {
  const [skinsResponse, cratesResponse] = await Promise.all([
    fetch(SKINS_API_URL),
    fetch(CRATES_API_URL),
  ]);

  if (!skinsResponse.ok) {
    throw new Error(`Failed to load skin catalog (${skinsResponse.status})`);
  }

  if (!cratesResponse.ok) {
    throw new Error(`Failed to load crate catalog (${cratesResponse.status})`);
  }

  const catalog = (await skinsResponse.json()) as ApiSkin[];
  const crates = (await cratesResponse.json()) as ApiCrate[];
  const crateDates = new Map(crates.map((crate) => [crate.id, crate.first_sale_date]));

  const mappedEntries: InspectVariantEntry[] = [];
  const mappedSkins: Array<{
    entry: ApiSkin;
    weaponDefIndex: number;
    paintIndex: string;
  }> = [];

  for (const entry of catalog) {
    const weaponDefIndex = entry.weapon?.weapon_id;
    const paintIndex = entry.paint_index;
    const category = entry.category?.name;

    if (
      !weaponDefIndex ||
      !paintIndex ||
      !category ||
      !WEAPON_CATEGORIES.has(category) ||
      !entry.weapon?.name ||
      !entry.pattern?.name ||
      !entry.rarity
    ) {
      continue;
    }

    mappedEntries.push({
      weaponDefIndex,
      paintIndex,
      releasedInCs2: inferReleasedInCs2(entry, crateDates),
    });
    mappedSkins.push({ entry, weaponDefIndex, paintIndex });
  }

  const inspectVariants = await resolveInspectVariantsFromCache(mappedEntries);

  const skins = mappedSkins
    .map(({ entry, weaponDefIndex, paintIndex }, index) =>
      toSkin(entry, crateDates, inspectVariants[index] ?? 0),
    )
    .filter((skin): skin is Skin => skin !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    generatedAt: new Date().toISOString(),
    skins,
  };
}
