import { Lock, MapPinned } from "lucide-react";
import Link from "next/link";
import { ExportAnalyticsButton } from "@/components/ExportAnalyticsButton";
import { StratumMap } from "@/components/StratumMap";
import { getDashboardSession } from "@/lib/auth";
import { getDashboardSnapshot, getReportsForCity, getCityLabel } from "@/lib/data-store";
import { titleize } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CityGovernmentPage({ params }: { params: { city_id: string } }) {
  const session = await getDashboardSession();
  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-night px-5 text-slate-50">
        <section className="w-full max-w-lg rounded-lg border border-slate-800 bg-panel p-6 text-center">
          <Lock className="mx-auto h-10 w-10 text-violet-300" />
          <h1 className="mt-5 font-display text-3xl">City auth required</h1>
          <p className="mt-3 leading-7 text-slate-400">This view requires city-level authorization.</p>
          <Link
            href={`/signin?callbackUrl=${encodeURIComponent(`/city/${params.city_id}`)}`}
            className="focus-ring mt-6 inline-flex rounded-md bg-violet px-5 py-3 font-semibold text-white"
          >
            Sign in
          </Link>
        </section>
      </main>
    );
  }

  const [snapshot, reports] = await Promise.all([
    getDashboardSnapshot(params.city_id),
    getReportsForCity(params.city_id, 30)
  ]);
  const demoApiKey = process.env.DEMO_API_KEY ?? "sk_stratum_demo_live";

  const infrastructureQueue = snapshot.cells
    .map((cell) => {
      const density = reports.filter(
        (report) => report.geohash_4 === cell.geohash_4 && report.report_type === "INFRASTRUCTURE"
      ).length;
      return { ...cell, density };
    })
    .filter((cell) => cell.density > 0)
    .sort((a, b) => b.density - a.density)
    .slice(0, 10);

  return (
    <main className="min-h-screen bg-night px-5 py-6 text-slate-50">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-300">City operations</p>
            <h1 className="mt-2 font-display text-4xl">{getCityLabel(params.city_id)}</h1>
            <p className="mt-2 text-slate-400">Heat map, infrastructure priority queue, and exportable report feed.</p>
          </div>
          <ExportAnalyticsButton cityId={params.city_id} apiKey={demoApiKey} />
        </header>

        <section className="grid min-w-0 gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-lg border border-slate-800 bg-panel">
            <div className="border-b border-slate-800 p-5">
              <h2 className="flex items-center gap-2 font-display text-2xl">
                <MapPinned className="h-6 w-6 text-violet-300" />
                Live heat map
              </h2>
            </div>
            <StratumMap mode="city" initialCityId={params.city_id} className="h-[580px] min-h-[580px]" />
          </div>

          <div className="rounded-lg border border-slate-800 bg-panel p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-300">Infrastructure queue</p>
            <h2 className="mt-2 font-display text-2xl">Highest density cells</h2>
            <div className="mt-5 space-y-3">
              {infrastructureQueue.map((cell, index) => (
                <article key={cell.geohash_4} className="rounded-md border border-slate-700 bg-slate-950/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Priority {index + 1}</p>
                      <h3 className="mt-1 font-display text-xl">{cell.display_name}</h3>
                    </div>
                    <p className="font-display text-3xl text-blue-300">{cell.density}</p>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">
                    {cell.geohash_4.toUpperCase()} - Overall {cell.scores.overall.toFixed(1)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-slate-800 bg-panel p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-300">Recent export rows</p>
          <div className="mt-5 overflow-x-auto rounded-lg border border-slate-700">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Layer</th>
                  <th className="px-4 py-3">Subtype</th>
                  <th className="px-4 py-3">Geohash</th>
                  <th className="px-4 py-3">Severity</th>
                </tr>
              </thead>
              <tbody>
                {reports.slice(0, 12).map((report) => (
                  <tr key={report.timestamp_id} className="border-t border-slate-800">
                    <td className="px-4 py-3 text-slate-400">{new Date(report.timestamp_id.split("#")[0]).toLocaleString()}</td>
                    <td className="px-4 py-3">{titleize(report.report_type.toLowerCase())}</td>
                    <td className="px-4 py-3">{titleize(report.sub_type)}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{report.geohash}</td>
                    <td className="px-4 py-3 font-display">{report.severity}/5</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
