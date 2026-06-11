import { collectInspectVariantEntries } from "@/lib/build-skins-catalog";
import { refreshInspectVariantCache } from "@/lib/inspect-variant-cache";

async function main(): Promise<void> {
  const entries = await collectInspectVariantEntries();
  const cache = await refreshInspectVariantCache(entries);

  console.log(
    `Wrote ${Object.keys(cache.variants).length} inspect variants to src/data/inspect-variants.json`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
