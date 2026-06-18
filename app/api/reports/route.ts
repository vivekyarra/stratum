import { NextResponse } from "next/server";
import { createReport } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const report = await createReport(body);
    return NextResponse.json({
      success: true,
      geohash: report.geohash,
      report
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Invalid report"
      },
      { status: 400 }
    );
  }
}
