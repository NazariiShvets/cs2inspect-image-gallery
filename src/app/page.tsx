import { Gallery } from "@/components/gallery/gallery";
import { buildSkinsCatalog } from "@/lib/build-skins-catalog";

export const dynamic = "force-static";

export default async function HomePage() {
  const catalog = await buildSkinsCatalog();

  return <Gallery skins={catalog.skins} generatedAt={catalog.generatedAt} />;
}
