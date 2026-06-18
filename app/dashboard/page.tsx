import { ArrowUpRight, KeyRound, Lock, Server, TrendingUp } from "lucide-react";
import Link from "next/link";
import { ExportAnalyticsButton } from "@/components/ExportAnalyticsButton";
import { ScoreBar } from "@/components/ScoreBar";
import { DEFAULT_CITY_ID } from "@/lib/constants";
import { getDashboardSession } from "@/lib/auth";
import { getDashboardSnapshot, getCityLabel } from "@/lib/data-store";
import { compactNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getDashboardSession();
  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-night px-5 text-slate-50">
        <section className="w-full max-w-lg rounded-lg border border-slate-800 bg-panel p-6 text-center">
          <Lock className="mx-auto h-10 w-10 text-violet-300" />
          <h1 className="mt-5 font-display text-3xl">Sign in required</h1>
          <p className="mt-3 leading-7 text-slate-400">The B2B dashboard requires a NextAuth session.</p>
          <Link href="/signin?callbackUrl=/dashboard" className="focus-ring mt-6 inline-flex rounded-md bg-violet px-5 py-3 font-semibold text-white">
            Sign in
          </Link>
        </section>
      </main>
    );
  }

  const snapshot = await getDashboardSnapshot(DEFAULT_CITY_ID);
  const primaryCell = snapshot.cells[0];
  const demoApiKey = process.env.DEMO_API_KEY ?? "sk_stratum_demo_live";
  const callsThisMonth = 1842;
  const callLimit = 10000;

  return (
    <main className="min-h-screen bg-night px-5 py-6 text-slate-50">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-300">B2B intelligence</p>
            <h1 className="mt-2 font-display text-4xl text-slate-50">API Dashboard</h1>
            <p className="mt-2 text-slate-400">Signed in as {session.user?.email}</p>
          </div>
          <form action="/api/billing/checkout" method="POST">
            <button className="focus-ring inline-flex items-center gap-2 rounded-md bg-violet px-5 py-3 font-semibold text-white hover:bg-violet/90">
              Upgrade plan
              <ArrowUpRight className="h-5 w-5" />
            </button>
          </form>
        </header>

        <section className="grid min-w-0 gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="min-w-0 space-y-5">
            <div className="rounded-lg border border-slate-800 bg-panel p-6">
              <div className="flex items-center gap-3">
                <KeyRound className="h-6 w-6 text-violet-300" />
                <h2 className="font-display text-2xl">API key</h2>
              </div>
              <div className="mt-5 overflow-x-auto rounded-md border border-slate-700 bg-slate-950 p-4 font-mono text-sm text-emerald-200">
                {demoApiKey}
              </div>
              <p className="mt-4 break-words text-sm leading-6 text-slate-400">
                Use as Authorization: Bearer {demoApiKey}
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-panel p-6">
              <div className="flex items-center gap-3">
                <Server className="h-6 w-6 text-blue-300" />
                <h2 className="font-display text-2xl">Usage</h2>
              </div>
              <p className="mt-5 font-display text-4xl">{compactNumber(callsThisMonth)}</p>
              <p className="mt-1 text-sm text-slate-400">of {compactNumber(callLimit)} calls this month</p>
              <div className="mt-5 h-2 overflow-hidden rounded-sm bg-slate-800">
                <div className="h-full rounded-sm bg-violet" style={{ width: `${(callsThisMonth / callLimit) * 100}%` }} />
              </div>
            </div>
          </div>

          <div className="min-w-0 rounded-lg border border-slate-800 bg-panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-300">
                  {getCityLabel(snapshot.city_id)}
                </p>
                <h2 className="mt-2 font-display text-2xl">Neighborhood trend export</h2>
              </div>
              <ExportAnalyticsButton cityId={DEFAULT_CITY_ID} apiKey={demoApiKey} label="Export JSON" />
            </div>

            {primaryCell && (
              <div className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                <div className="rounded-md border border-slate-700 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Top active cell</p>
                  <h3 className="mt-2 font-display text-2xl">{primaryCell.display_name}</h3>
                  <p className="mt-2 text-sm text-slate-400">{primaryCell.geohash_4.toUpperCase()}</p>
                  <p className="mt-5 font-display text-5xl">{primaryCell.scores.overall.toFixed(1)}</p>
                </div>
                <div className="space-y-4">
                  <ScoreBar label="Safety" value={primaryCell.scores.safetyScore} layer="SAFETY" />
                  <ScoreBar label="Vibe" value={primaryCell.scores.vibeScore} layer="VIBE" />
                  <ScoreBar label="Infrastructure" value={primaryCell.scores.infrastructureScore} layer="INFRASTRUCTURE" />
                  <ScoreBar label="Opportunity" value={primaryCell.scores.opportunityScore} layer="OPPORTUNITY" />
                </div>
              </div>
            )}

            <div className="mt-6 overflow-x-auto rounded-lg border border-slate-700">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-950 text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Cell</th>
                    <th className="px-4 py-3">Overall</th>
                    <th className="px-4 py-3">7d reports</th>
                    <th className="px-4 py-3">24h reports</th>
                    <th className="px-4 py-3">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.cells.slice(0, 8).map((cell) => (
                    <tr key={cell.geohash_4} className="border-t border-slate-800">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-100">{cell.display_name}</p>
                        <p className="text-xs text-slate-500">{cell.geohash_4.toUpperCase()}</p>
                      </td>
                      <td className="px-4 py-3 font-display text-slate-50">{cell.scores.overall.toFixed(1)}</td>
                      <td className="px-4 py-3">{cell.scores.reportCount7d}</td>
                      <td className="px-4 py-3">{cell.scores.reportCount24h}</td>
                      <td className="px-4 py-3">
                        <Link href={`/neighborhood/${cell.geohash_4}`} className="inline-flex items-center gap-1 text-violet-200 hover:text-violet-100">
                          Open <TrendingUp className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
