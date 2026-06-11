import { buildDownloadFileName } from "@/lib/inspect";
import type { Skin } from "@/types/skin";

function buildSkinImageProxyUrl(skin: Skin, fileName: string): string {
  const params = new URLSearchParams({
    weaponDefIndex: String(skin.weaponDefIndex),
    paintIndex: skin.paintIndex,
    inspectVariant: String(skin.inspectVariant),
    filename: fileName,
  });

  return `/api/skin-image?${params.toString()}`;
}

async function triggerFileDownload(blob: Blob, fileName: string): Promise<void> {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

export async function downloadSkinImage(skin: Skin): Promise<void> {
  const fileName = buildDownloadFileName(skin.weapon, skin.pattern);
  const response = await fetch(buildSkinImageProxyUrl(skin, fileName));

  if (!response.ok) {
    throw new Error(`Failed to download ${fileName}`);
  }

  await triggerFileDownload(await response.blob(), fileName);
}

export async function downloadSkins(
  skins: Skin[],
  onProgress?: (completed: number, total: number) => void,
): Promise<void> {
  for (const [index, skin] of skins.entries()) {
    await downloadSkinImage(skin);
    onProgress?.(index + 1, skins.length);
    await new Promise((resolve) => window.setTimeout(resolve, 150));
  }
}
