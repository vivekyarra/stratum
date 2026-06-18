import { ArrowRight, Building2, Database, Factory, Home, KeyRound, Landmark, Map, Radio } from "lucide-react";
import Link from "next/link";
import { StratumMap } from "@/components/StratumMap";
import { LAYER_META } from "@/lib/constants";

const audiences = [
  {
    icon: Home,
    title: "Resident",
    copy: "Submit a one-tap anonymous signal from the street without creating an account.",
    items: ["No-login reports", "Location confirmation", "Layer-level transparency"]
  },
  {
    icon: Building2,
    title: "Real Estate Agent",
    copy: "Understand block-by-block momentum before a listing, tour, or client advisory.",
    items: ["Health scores", "7-day trend exports", "API access"]
  },
  {
    icon: Landmark,
    title: "City Government",
    copy: "Prioritize infrastructure response from report density, severity, and recency.",
    items: ["Heat maps", "Priority queues", "Exportable reports"]
  }
];

const pricing = [
  {
    name: "Free",
    price: "$0",
    detail: "Resident reporting and public neighborhood map",
    cta: "Try the map",
    href: "/map"
  },
  {
    name: "Realtor",
    price: "$49/mo",
    detail: "API key, neighborhood scores, trend tables, and exports",
    cta: "Open dashboard",
    href: "/dashboard"
  },
  {
    name: "City",
    price: "$299/mo",
    detail: "City-wide heat maps, infrastructure queue, and analytics API",
    cta: "View city tools",
    href: "/city/san_francisco"
  }
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-night text-slate-50">
      <section className="relative min-h-[90vh] overflow-hidden">
        <StratumMap mode="hero" className="absolute inset-0 min-h-full" />
        <nav className="absolute inset-x-0 top-0 z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/" className="font-display text-xl tracking-wide text-slate-50">
            STRATUM
          </Link>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/map" className="focus-ring rounded-md border border-slate-700 bg-panel/70 px-4 py-2 text-sm text-slate-100 backdrop-blur hover:bg-slate-800">
              Live map
            </Link>
            <Link href="/dashboard" className="focus-ring rounded-md bg-violet px-4 py-2 text-sm font-semibold text-white hover:bg-violet/90">
              Dashboard
            </Link>
          </div>
        </nav>
        <div className="relative z-10 flex min-h-[90vh] items-center px-5 pb-16 pt-28">
          <div className="mx-auto w-full max-w-7xl">
            <div className="max-w-3xl">
              <p className="mb-5 inline-flex items-center gap-2 rounded-md border border-slate-700 bg-panel/70 px-3 py-2 text-sm font-semibold uppercase tracking-[0.22em] text-violet-200 backdrop-blur">
                <Radio className="h-4 w-4" />
                Neighborhood intelligence API
              </p>
              <h1 className="font-display text-6xl leading-[0.95] text-slate-50 sm:text-7xl lg:text-8xl">
                STRATUM
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
                Anonymous resident reports become live safety, vibe, infrastructure, and opportunity layers for neighborhoods, cities, and B2B customers.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/map" className="focus-ring inline-flex items-center gap-2 rounded-md bg-violet px-5 py-3 font-semibold text-white shadow-glow hover:bg-violet/90">
                  Try the live demo
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href="/dashboard" className="focus-ring inline-flex items-center gap-2 rounded-md border border-slate-600 bg-panel/70 px-5 py-3 font-semibold text-slate-100 backdrop-blur hover:bg-slate-800">
                  B2B dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-800 bg-night px-5 py-12">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-4">
          {Object.entries(LAYER_META).map(([key, meta]) => (
            <div key={key} className="rounded-lg border border-slate-800 bg-panel p-5">
              <div className="mb-4 h-2 w-14 rounded-sm" style={{ backgroundColor: meta.color }} />
              <h2 className="font-display text-xl text-slate-50">{meta.label}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{meta.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between gap-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-300">Built for three sides</p>
              <h2 className="mt-3 font-display text-4xl text-slate-50">One signal network, three workflows</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {audiences.map((audience) => {
              const Icon = audience.icon;
              return (
                <article key={audience.title} className="rounded-lg border border-slate-800 bg-panel p-6">
                  <Icon className="h-8 w-8 text-violet-300" />
                  <h3 className="mt-5 font-display text-2xl text-slate-50">{audience.title}</h3>
                  <p className="mt-3 leading-7 text-slate-400">{audience.copy}</p>
                  <ul className="mt-5 space-y-2 text-sm text-slate-300">
                    {audience.items.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-violet" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-800 bg-panel/40 px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-300">Production data path</p>
            <h2 className="mt-3 font-display text-4xl text-slate-50">Geohash writes, analytics reads</h2>
            <p className="mt-4 leading-7 text-slate-400">
              Report ingestion is partitioned by geohash in DynamoDB for fast anonymous writes. Aurora PostgreSQL owns users, subscriptions, score snapshots, billing logs, and export-friendly analytics.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr_1fr_0.9fr]">
            <div className="scanline rounded-lg border border-slate-700 bg-slate-950 p-5">
              <Map className="h-7 w-7 text-emerald-300" />
              <h3 className="mt-4 font-display text-xl text-slate-50">Resident report</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">lat/lng, layer, subtype, severity, city_id</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950 p-5">
              <Database className="h-7 w-7 text-blue-300" />
              <h3 className="mt-4 font-display text-xl text-slate-50">DynamoDB</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">PK geohash, SK timestamp_id, GSI city_id-time, TTL 90 days</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950 p-5">
              <Factory className="h-7 w-7 text-amber-300" />
              <h3 className="mt-4 font-display text-xl text-slate-50">Scoring worker</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">Recency-weighted scoring creates health layers and trend windows.</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950 p-5">
              <KeyRound className="h-7 w-7 text-violet-300" />
              <h3 className="mt-4 font-display text-xl text-slate-50">Aurora + API</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">Scores, users, subscriptions, usage logs, and B2B exports.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-300">Pricing</p>
            <h2 className="mt-3 font-display text-4xl text-slate-50">Start public, scale into data access</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {pricing.map((plan) => (
              <article key={plan.name} className="rounded-lg border border-slate-800 bg-panel p-6">
                <h3 className="font-display text-2xl text-slate-50">{plan.name}</h3>
                <p className="mt-4 font-display text-4xl text-slate-50">{plan.price}</p>
                <p className="mt-4 min-h-[56px] leading-7 text-slate-400">{plan.detail}</p>
                <Link href={plan.href} className="focus-ring mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-50 px-4 py-3 font-semibold text-night hover:bg-slate-200">
                  {plan.cta}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
