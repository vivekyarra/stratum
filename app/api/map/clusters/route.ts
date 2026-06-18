import { NextResponse } from "next/server";
import { REPORT_TYPES } from "@/lib/constants";
import { getMapClusters } from "@/lib/data-store";
import type { ReportType } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseBbox(raw: string | null): [number, number, number, number] | undefined {
  if (!raw) return undefined;
  const values = raw.split(",").map(Number);
  if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) return undefined;
  return values as [number, number, number, number];
}

function parseLayers(raw: string | null): ReportType[] {
  if (!raw) return REPORT_TYPES;
  const requested = raw
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter((value): value is ReportType => REPORT_TYPES.includes(value as ReportType));
  return requested.length ? requested : REPORT_TYPES;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const clusters = await getMapClusters({
    bbox: parseBbox(url.searchParams.get("bbox")),
    layers: parseLayers(url.searchParams.get("layers")),
    city_id: url.searchParams.get("city_id") ?? undefined
  });

  return NextResponse.json(clusters, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
