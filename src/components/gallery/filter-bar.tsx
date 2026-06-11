"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FilterBarProps = {
  query: string;
  category: string;
  categories: readonly string[];
  counts: Record<string, number>;
  downloadingAll: boolean;
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onDownloadAll: () => void;
};

export function FilterBar({
  query,
  category,
  categories,
  counts,
  downloadingAll,
  onQueryChange,
  onCategoryChange,
  onDownloadAll,
}: FilterBarProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="search"
          placeholder="Search weapon, pattern, rarity..."
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          disabled={downloadingAll}
          onClick={onDownloadAll}
          className="shrink-0"
        >
          {downloadingAll ? "Downloading..." : "Download all"}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((item) => (
          <Button
            key={item}
            type="button"
            variant={category === item ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(item)}
          >
            {item}
            <span className="text-muted-foreground ml-1 text-xs">{counts[item] ?? 0}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
