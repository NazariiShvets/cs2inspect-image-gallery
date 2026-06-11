import { NextResponse } from "next/server";
import { buildInspectUrl } from "@/lib/inspect";

export const dynamic = "force-dynamic";

function parseSkinParams(searchParams: URLSearchParams) {
  const weaponDefIndex = Number(searchParams.get("weaponDefIndex"));
  const paintIndex = searchParams.get("paintIndex");
  const inspectVariant = Number(searchParams.get("inspectVariant"));
  const filename = searchParams.get("filename") ?? "skin.webp";

  if (
    !Number.isFinite(weaponDefIndex) ||
    !paintIndex ||
    !/^\d+$/.test(paintIndex) ||
    (inspectVariant !== 0 && inspectVariant !== 1)
  ) {
    return null;
  }

  return {
    weaponDefIndex,
    paintIndex,
    inspectVariant: inspectVariant as 0 | 1,
    filename,
  };
}

export async function GET(request: Request): Promise<NextResponse> {
  const params = parseSkinParams(new URL(request.url).searchParams);

  if (!params) {
    return new NextResponse("Invalid parameters", { status: 400 });
  }

  const { weaponDefIndex, paintIndex, inspectVariant, filename } = params;
  const url = buildInspectUrl(weaponDefIndex, paintIndex, inspectVariant);
  const response = await fetch(url);

  if (!response.ok) {
    return new NextResponse("Image not found", { status: 404 });
  }

  const buffer = await response.arrayBuffer();
  const encodedFilename = encodeURIComponent(filename);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/webp",
      "Content-Disposition": `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
    },
  });
}
