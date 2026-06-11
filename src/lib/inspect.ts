const CDN_BASE = "https://cdn.cs2inspects.com/customizer";

/** 0 = CS2-era render, 1 = CSGO-era render (cs2inspects CDN convention). */
export type InspectVariant = 0 | 1;

export function buildInspectUrl(
  weaponDefIndex: number,
  paintIndex: string,
  variant: InspectVariant,
): string {
  return `${CDN_BASE}/${weaponDefIndex}_${paintIndex}_${variant}.webp`;
}

export function getPreferredVariant(releasedInCs2: boolean): InspectVariant {
  return releasedInCs2 ? 0 : 1;
}

export function getFallbackVariant(variant: InspectVariant): InspectVariant {
  return variant === 0 ? 1 : 0;
}

export function buildDownloadFileName(weapon: string, pattern: string): string {
  return `${weapon} - ${pattern}.webp`;
}

async function probeImageUrlWithHead(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });

    return response.ok;
  } catch {
    return false;
  }
}

export async function resolveInspectVariant(skin: {
  weaponDefIndex: number;
  paintIndex: string;
  releasedInCs2: boolean;
}): Promise<InspectVariant> {
  const preferred = getPreferredVariant(skin.releasedInCs2);
  const fallback = getFallbackVariant(preferred);

  for (const variant of [preferred, fallback]) {
    const url = buildInspectUrl(skin.weaponDefIndex, skin.paintIndex, variant);

    if (await probeImageUrlWithHead(url)) {
      return variant;
    }
  }

  return preferred;
}

export async function resolveSkinInspectUrlServer(skin: {
  weaponDefIndex: number;
  paintIndex: string;
  releasedInCs2: boolean;
  inspectVariant?: InspectVariant;
}): Promise<string> {
  if (skin.inspectVariant !== undefined) {
    return buildInspectUrl(skin.weaponDefIndex, skin.paintIndex, skin.inspectVariant);
  }

  const variant = await resolveInspectVariant(skin);

  return buildInspectUrl(skin.weaponDefIndex, skin.paintIndex, variant);
}

async function probeImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = url;
  });
}

export async function resolveSkinInspectUrl(skin: {
  weaponDefIndex: number;
  paintIndex: string;
  releasedInCs2: boolean;
  inspectVariant?: InspectVariant;
}): Promise<string> {
  if (skin.inspectVariant !== undefined) {
    return buildInspectUrl(skin.weaponDefIndex, skin.paintIndex, skin.inspectVariant);
  }

  const preferred = getPreferredVariant(skin.releasedInCs2);
  const fallback = getFallbackVariant(preferred);

  for (const variant of [preferred, fallback]) {
    const url = buildInspectUrl(skin.weaponDefIndex, skin.paintIndex, variant);

    if (await probeImageUrl(url)) {
      return url;
    }
  }

  return buildInspectUrl(skin.weaponDefIndex, skin.paintIndex, preferred);
}

export function openSkinPreview(skin: {
  weaponDefIndex: number;
  paintIndex: string;
  inspectVariant: InspectVariant;
}): void {
  window.open(
    buildInspectUrl(skin.weaponDefIndex, skin.paintIndex, skin.inspectVariant),
    "_blank",
    "noopener,noreferrer",
  );
}
