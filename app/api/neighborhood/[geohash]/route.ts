import { NextResponse } from "next/server";
import { getNeighborhoodHealth } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { geohash: string } }) {
  const geohash = params.geohash.toLowerCase();
  if (!/^[0-9bcdefghjkmnpqrstuvwxyz]{4,12}$/.test(geohash)) {
    return NextResponse.json({ error: "Invalid geohash" }, { status: 400 });
  }

  const health = await getNeighborhoodHealth(geohash);
  return NextResponse.json(health, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
