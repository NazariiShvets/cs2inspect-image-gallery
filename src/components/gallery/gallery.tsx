"use client";

import { useMemo, useState } from "react";
import { FilterBar } from "@/components/gallery/filter-bar";
import { SkinCard } from "@/components/gallery/skin-card";
import { Badge } from "@/components/ui/badge";
import { downloadSkinImage, downloadSkins } from "@/lib/download";
import { openSkinPreview } from "@/lib/inspect";
import { CATEGORIES, type CategoryFilter, type Skin } from "@/types/skin";

type GalleryProps = {
  skins: Skin[];
  generatedAt: string;
};

function matchesQuery(skin: Skin, query: string): boolean {
  const haystack = [
    skin.name,
    skin.weapon,
    skin.pattern,
    skin.category,
    skin.rarity,
    skin.paintIndex,
    String(skin.weaponDefIndex),
    skin.releasedInCs2 ? "cs2" : "csgo",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.trim().toLowerCase());
}

export function Gallery({ skins, generatedAt }: GalleryProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [downloadingAll, setDownloadingAll] = useState(false);

  const counts = useMemo(() => {
    const next: Record<string, number> = { All: skins.length };

    for (const item of CATEGORIES.slice(1)) {
      next[item] = skins.filter((skin) => skin.category === item).length;
    }

    return next;
  }, [skins]);

  const filteredSkins = useMemo(() => {
    return skins.filter((skin) => {
      const categoryMatches = category === "All" || skin.category === category;
      return categoryMatches && matchesQuery(skin, query);
    });
  }, [skins, category, query]);

  async function handleDownloadAll(): Promise<void> {
    setDownloadingAll(true);

    try {
      await downloadSkins(skins);
    } finally {
      setDownloadingAll(false);
    }
  }

  return (
    <div className="mx-auto px-4 md:px-6 py-6 w-full max-w-7xl">
      <header className="flex md:flex-row flex-col md:justify-between md:items-start gap-4 mb-6">
        <div className="space-y-2">
          <p className="font-medium text-primary text-sm uppercase tracking-wide">
            CS2 Skins Preview
          </p>
          <h1 className="font-bold text-3xl md:text-4xl tracking-tight">
            Inspect gallery
          </h1>
          <p className="max-w-2xl text-muted-foreground text-sm md:text-base">
            Browse weapon skin renders from cs2inspects.com and download
            previews.
          </p>
        </div>
        <div className="flex flex-col items-start gap-1">
          <span className="text-muted-foreground text-xs">
            Catalog from {new Date(generatedAt).toLocaleDateString("en-US")}
          </span>
        </div>
      </header>

      <FilterBar
        query={query}
        category={category}
        categories={CATEGORIES}
        counts={counts}
        downloadingAll={downloadingAll}
        onQueryChange={setQuery}
        onCategoryChange={(value) => setCategory(value as CategoryFilter)}
        onDownloadAll={handleDownloadAll}
      />

      <section className="items-stretch gap-4 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] mt-6">
        {filteredSkins.length === 0 ? (
          <p className="col-span-full text-muted-foreground text-sm">
            No skins match your filters.
          </p>
        ) : (
          filteredSkins.map((skin) => (
            <SkinCard
              key={skin.id}
              skin={skin}
              onPreview={() => openSkinPreview(skin)}
              onDownload={() => void downloadSkinImage(skin)}
            />
          ))
        )}
      </section>
    </div>
  );
}
