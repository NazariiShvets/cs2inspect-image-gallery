export type Skin = {
  id: string;
  name: string;
  weapon: string;
  weaponKey: string;
  weaponDefIndex: number;
  category: string;
  pattern: string;
  paintIndex: string;
  rarity: string;
  rarityColor: string;
  releasedInCs2: boolean;
  /** CDN render variant resolved at build time (0 = CS2-era, 1 = CSGO-era). */
  inspectVariant: 0 | 1;
};

export const CATEGORIES = [
  "All",
  "Rifles",
  "Pistols",
  "SMGs",
  "Heavy",
] as const;

export type CategoryFilter = (typeof CATEGORIES)[number];
