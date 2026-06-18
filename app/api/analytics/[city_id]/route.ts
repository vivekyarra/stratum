import { NextResponse } from "next/server";
import { getAnalyticsForCity } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { city_id: string } }) {
  try {
    const analytics = await getAnalyticsForCity(params.city_id, request.headers.get("authorization"));
    return NextResponse.json(analytics, {
      headers: {
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        {
          error: "Valid API key required. Send Authorization: Bearer sk_stratum_demo_live for local demo data."
        },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: "Unable to build analytics response" }, { status: 500 });
  }
}
