"use client";

import {
  buildInspectUrl,
  getFallbackVariant,
} from "@/lib/inspect";
import type { Skin } from "@/types/skin";

type InspectImageProps = {
  skin: Skin;
  className?: string;
  alt: string;
  loading?: "lazy" | "eager";
};

export function InspectImage({
  skin,
  className,
  alt,
  loading = "lazy",
}: InspectImageProps) {
  const fallback = getFallbackVariant(skin.inspectVariant);
  const imageUrl = buildInspectUrl(
    skin.weaponDefIndex,
    skin.paintIndex,
    skin.inspectVariant,
  );
  const fallbackUrl = buildInspectUrl(
    skin.weaponDefIndex,
    skin.paintIndex,
    fallback,
  );

  function handleError(event: React.SyntheticEvent<HTMLImageElement>) {
    const image = event.currentTarget;

    if (image.src !== fallbackUrl) {
      image.src = fallbackUrl;
    }
  }

  return (
    <img
      key={skin.id}
      src={imageUrl}
      alt={alt}
      loading={loading}
      className={className}
      onError={handleError}
    />
  );
}
