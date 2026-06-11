import Fuse, { type IFuseOptions } from "fuse.js";
import type { Skin } from "@/types/skin";

const FUSE_OPTIONS: IFuseOptions<Skin> = {
  keys: [
    { name: "name", weight: 0.35 },
    { name: "weapon", weight: 0.25 },
    { name: "pattern", weight: 0.25 },
    { name: "category", weight: 0.05 },
    { name: "rarity", weight: 0.05 },
    { name: "paintIndex", weight: 0.03 },
    {
      name: "era",
      getFn: (skin: Skin) => (skin.releasedInCs2 ? "cs2" : "csgo"),
    },
  ],
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

export function createSkinSearchIndex(skins: Skin[]): Fuse<Skin> {
  return new Fuse(skins, FUSE_OPTIONS);
}

export function searchSkins(
  skins: Skin[],
  index: Fuse<Skin>,
  query: string,
): Skin[] {
  const trimmed = query.trim();

  if (!trimmed) {
    return skins;
  }

  const terms = trimmed.split(/\s+/).filter(Boolean);

  if (terms.length === 1) {
    return index.search(terms[0]).map((result) => result.item);
  }

  const matchesByTerm = terms.map(
    (term) => new Set(index.search(term).map((result) => result.item.id)),
  );

  return index
    .search(trimmed)
    .map((result) => result.item)
    .filter((skin) => matchesByTerm.every((ids) => ids.has(skin.id)));
}
