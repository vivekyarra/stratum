import { ArrowLeft, Share2 } from "lucide-react";
import Link from "next/link";
import { ScoreBar } from "@/components/ScoreBar";
import { TrendChart } from "@/components/TrendChart";
import { LAYER_META } from "@/lib/constants";
import { getNeighborhoodHealth } from "@/lib/data-store";
import { titleize } from "@/lib/utils";

export default async function NeighborhoodPage({ params }: { params: { geohash: string } }) {
  const health = await getNeighborhoodHealth(params.geohash.toLowerCase());

  return (
    <main className="min-h-screen bg-night px-5 py-6 text-slate-50">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/map" className="focus-ring inline-flex items-center gap-2 rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800">
            <ArrowLeft className="h-4 w-4" />
            Back to map
          </Link>
          <button className="focus-ring inline-flex items-center gap-2 rounded-md bg-violet px-4 py-2 text-sm font-semibold text-white hover:bg-violet/90">
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>

        <section className="rounded-lg border border-slate-800 bg-panel p-6">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-300">
                {health.geohash.toUpperCase()} - {health.city_id.replaceAll("_", " ")}
              </p>
              <h1 className="mt-3 font-display text-5xl text-slate-50">{health.displayName}</h1>
              <p className="mt-5 max-w-xl leading-7 text-slate-400">
                Recency-weighted health score from anonymous reports in the last 30 days. Negative layers reduce health as severity rises; positive layers lift the score.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-slate-700 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Overall</p>
                  <p className="font-display text-4xl text-slate-50">{health.scores.overall.toFixed(1)}</p>
                </div>
                <div className="rounded-md border border-slate-700 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">24h</p>
                  <p className="font-display text-4xl text-slate-50">{health.scores.reportCount24h}</p>
                </div>
                <div className="rounded-md border border-slate-700 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">7d</p>
                  <p className="font-display text-4xl text-slate-50">{health.scores.reportCount7d}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <ScoreBar label="Safety" value={health.scores.safetyScore} layer="SAFETY" />
              <ScoreBar label="Vibe" value={health.scores.vibeScore} layer="VIBE" />
              <ScoreBar label="Infrastructure" value={health.scores.infrastructureScore} layer="INFRASTRUCTURE" />
              <ScoreBar label="Opportunity" value={health.scores.opportunityScore} layer="OPPORTUNITY" />
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-lg border border-slate-800 bg-panel p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-300">7 day trends</p>
                <h2 className="mt-2 font-display text-2xl text-slate-50">Layer score movement</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(LAYER_META).map(([key, meta]) => (
                  <span key={key} className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-300">
                    <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
                    {meta.label}
                  </span>
                ))}
              </div>
            </div>
            <TrendChart data={health.trends} />
          </div>

          <div className="rounded-lg border border-slate-800 bg-panel p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-300">Recent reports</p>
            <div className="mt-5 space-y-3">
              {health.recentReports.map((report) => (
                <article key={report.timestamp_id} className="rounded-md border border-slate-700 bg-slate-950/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold" style={{ color: LAYER_META[report.report_type].color }}>
                      {LAYER_META[report.report_type].label}
                    </span>
                    <span className="font-display text-sm text-slate-300">{report.severity}/5</span>
                  </div>
                  <p className="mt-2 text-slate-100">{titleize(report.sub_type)}</p>
                  <p className="mt-2 text-xs text-slate-500">{new Date(report.timestamp_id.split("#")[0]).toLocaleString()}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
