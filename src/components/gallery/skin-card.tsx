"use client";

import { InspectImage } from "@/components/gallery/inspect-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Skin } from "@/types/skin";

type SkinCardProps = {
  skin: Skin;
  onPreview: () => void;
  onDownload: () => void;
};

export function SkinCard({ skin, onPreview, onDownload }: SkinCardProps) {
  return (
    <Card className="flex h-full flex-col gap-3 py-3">
      <CardContent className="px-3">
        <div className="flex aspect-video items-center justify-center rounded-lg bg-black p-3">
          <InspectImage
            skin={skin}
            alt={skin.name}
            className="max-h-full w-full object-contain"
          />
        </div>
      </CardContent>

      <CardHeader className="gap-2 px-3">
        <Badge variant="outline">{skin.category}</Badge>
        <CardTitle className="text-base leading-snug">{skin.name}</CardTitle>
      </CardHeader>

      <CardContent className="px-3 text-sm">
        <p style={{ color: skin.rarityColor }}>{skin.rarity}</p>
      </CardContent>

      <CardFooter className="mt-auto grid w-full grid-cols-2 gap-2 px-3">
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={onPreview}>
          Preview
        </Button>
        <Button type="button" variant="secondary" size="sm" className="w-full" onClick={onDownload}>
          Download
        </Button>
      </CardFooter>
    </Card>
  );
}
