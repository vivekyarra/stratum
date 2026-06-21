"use client";

import {
  ArrowRight,
  Building2,
  Database,
  Factory,
  Home,
  KeyRound,
  Landmark,
  Map,
  Radio
} from "lucide-react";
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { StratumMap } from "@/components/StratumMap";
import { CITY_CONFIGS, LAYER_META, REPORT_TYPES } from "@/lib/constants";
import styles from "./landing.module.css";

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

const stats = [
  {
    value: Object.keys(CITY_CONFIGS).length,
    suffix: "",
    label: "Live city configurations"
  },
  {
    value: REPORT_TYPES.length,
    suffix: "",
    label: "Intelligence layers"
  },
  {
    value: 90,
    suffix: " days",
    label: "Resident signal horizon"
  }
];

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.08
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

type CountUpProps = {
  value: number;
  suffix?: string;
};

function CountUp({ value, suffix = "" }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(shouldReduceMotion ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (shouldReduceMotion) {
      setDisplayValue(value);
      return;
    }

    let frameId = 0;
    let startTime: number | null = null;
    const duration = 1200;

    const update = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * easedProgress));

      if (progress < 1) {
        frameId = requestAnimationFrame(update);
      }
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [inView, shouldReduceMotion, value]);

  return (
    <span ref={ref}>
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function LandingPage() {
  const shouldReduceMotion = useReducedMotion();
  const revealProps = shouldReduceMotion
    ? { initial: false as const }
    : {
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: { once: true, margin: "-100px" }
      };

  return (
    <main className="min-h-screen overflow-hidden bg-night text-slate-50">
      <section className="relative min-h-[90vh] overflow-hidden">
        <motion.div
          className="absolute -inset-[1%]"
          animate={shouldReduceMotion ? undefined : { scale: [1, 1.02, 1] }}
          transition={{
            duration: 4,
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY
          }}
        >
          <StratumMap mode="hero" className="min-h-full" />
        </motion.div>

        <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
          <span className={`${styles.orb} ${styles.orbOne}`} />
          <span className={`${styles.orb} ${styles.orbTwo}`} />
          <span className={`${styles.orb} ${styles.orbThree}`} />
        </div>

        <nav className="absolute inset-x-0 top-0 z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/" className="font-display text-xl tracking-wide text-slate-50">
            STRATUM
          </Link>
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/map"
              className="focus-ring rounded-md border border-slate-700 bg-panel/70 px-4 py-2 text-sm text-slate-100 backdrop-blur transition-colors hover:bg-slate-800"
            >
              Live map
            </Link>
            <Link
              href="/dashboard"
              className="focus-ring rounded-md bg-violet px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet/90"
            >
              Dashboard
            </Link>
          </div>
        </nav>

        <div className="relative z-10 flex min-h-[90vh] items-center px-5 pb-16 pt-28">
          <div className="mx-auto w-full max-w-7xl">
            <div className="max-w-3xl">
              <motion.p
                className="mb-5 inline-flex items-center gap-2 rounded-md border border-slate-700 bg-panel/70 px-3 py-2 text-sm font-semibold uppercase tracking-[0.22em] text-violet-200 backdrop-blur"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <Radio className="h-4 w-4" />
                Neighborhood intelligence API
              </motion.p>
              <motion.h1
                className="font-display text-6xl leading-[0.95] text-slate-50 sm:text-7xl lg:text-8xl"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: shouldReduceMotion ? 0 : 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                STRATUM
              </motion.h1>
              <motion.p
                className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: shouldReduceMotion ? 0 : 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                Anonymous resident reports become live safety, vibe, infrastructure, and opportunity layers for neighborhoods, cities, and B2B customers.
              </motion.p>
              <motion.div
                className="mt-8 flex flex-wrap gap-3"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: shouldReduceMotion ? 0 : 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  whileHover={
                    shouldReduceMotion
                      ? undefined
                      : {
                          scale: 1.03,
                          boxShadow: "0 0 32px rgba(124, 58, 237, 0.48)"
                        }
                  }
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="rounded-md"
                >
                  <Link
                    href="/map"
                    className="focus-ring inline-flex items-center gap-2 rounded-md bg-violet px-5 py-3 font-semibold text-white shadow-glow transition-colors hover:bg-violet/90"
                  >
                    Try the live demo
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </motion.div>
                <Link
                  href="/dashboard"
                  className="focus-ring inline-flex items-center gap-2 rounded-md border border-slate-600 bg-panel/70 px-5 py-3 font-semibold text-slate-100 backdrop-blur transition-colors hover:bg-slate-800"
                >
                  B2B dashboard
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <motion.section
        className="border-y border-slate-800 bg-night px-5 py-12"
        variants={sectionVariants}
        {...revealProps}
      >
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-4">
          {Object.entries(LAYER_META).map(([key, meta]) => (
            <motion.div key={key} variants={itemVariants}>
              <article className={`${styles.card} h-full rounded-lg border border-slate-800 bg-panel p-5`}>
                <div className="mb-4 h-2 w-14 rounded-sm" style={{ backgroundColor: meta.color }} />
                <h2 className="font-display text-xl text-slate-50">{meta.label}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{meta.description}</p>
              </article>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section className="px-5 py-20" variants={sectionVariants} {...revealProps}>
        <div className="mx-auto max-w-7xl">
          <motion.div className="mb-8 flex items-end justify-between gap-5" variants={itemVariants}>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-300">Built for three sides</p>
              <h2 className="mt-3 font-display text-4xl text-slate-50">One signal network, three workflows</h2>
            </div>
          </motion.div>
          <div className="grid gap-4 md:grid-cols-3">
            {audiences.map((audience) => {
              const Icon = audience.icon;
              return (
                <motion.div key={audience.title} variants={itemVariants}>
                  <article className={`${styles.card} h-full rounded-lg border border-slate-800 bg-panel p-6`}>
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
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      <motion.section
        className="border-y border-slate-800 bg-panel/40 px-5 py-20"
        variants={sectionVariants}
        {...revealProps}
      >
        <div className="mx-auto max-w-7xl">
          <motion.div className="mb-10 max-w-3xl" variants={itemVariants}>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-300">Production data path</p>
            <h2 className="mt-3 font-display text-4xl text-slate-50">Geohash writes, analytics reads</h2>
            <p className="mt-4 leading-7 text-slate-400">
              Report ingestion is partitioned by geohash in DynamoDB for fast anonymous writes. Aurora PostgreSQL owns users, subscriptions, score snapshots, billing logs, and export-friendly analytics.
            </p>
          </motion.div>
          <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr_1fr_0.9fr]">
            <motion.div variants={itemVariants}>
              <article className={`${styles.card} scanline h-full rounded-lg border border-slate-700 bg-slate-950 p-5`}>
                <Map className="h-7 w-7 text-emerald-300" />
                <h3 className="mt-4 font-display text-xl text-slate-50">Resident report</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">lat/lng, layer, subtype, severity, city_id</p>
              </article>
            </motion.div>
            <motion.div variants={itemVariants}>
              <article className={`${styles.card} h-full rounded-lg border border-slate-700 bg-slate-950 p-5`}>
                <Database className="h-7 w-7 text-blue-300" />
                <h3 className="mt-4 font-display text-xl text-slate-50">DynamoDB</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">PK geohash, SK timestamp_id, GSI city_id-time, TTL 90 days</p>
              </article>
            </motion.div>
            <motion.div variants={itemVariants}>
              <article className={`${styles.card} h-full rounded-lg border border-slate-700 bg-slate-950 p-5`}>
                <Factory className="h-7 w-7 text-amber-300" />
                <h3 className="mt-4 font-display text-xl text-slate-50">Scoring worker</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">Recency-weighted scoring creates health layers and trend windows.</p>
              </article>
            </motion.div>
            <motion.div variants={itemVariants}>
              <article className={`${styles.card} h-full rounded-lg border border-slate-700 bg-slate-950 p-5`}>
                <KeyRound className="h-7 w-7 text-violet-300" />
                <h3 className="mt-4 font-display text-xl text-slate-50">Aurora + API</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">Scores, users, subscriptions, usage logs, and B2B exports.</p>
              </article>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <motion.section id="live-metrics" className="px-5 py-16" variants={sectionVariants} {...revealProps}>
        <div className="mx-auto grid max-w-7xl gap-px overflow-hidden rounded-lg border border-slate-800 bg-slate-800 md:grid-cols-3">
          {stats.map((stat) => (
            <motion.div key={stat.label} className="bg-night px-6 py-8 text-center" variants={itemVariants}>
              <p className="font-display text-4xl text-slate-50">
                <CountUp value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-2 text-sm uppercase tracking-[0.18em] text-slate-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section className="px-5 pb-20 pt-4" variants={sectionVariants} {...revealProps}>
        <div className="mx-auto max-w-7xl">
          <motion.div className="mb-10" variants={itemVariants}>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-300">Pricing</p>
            <h2 className="mt-3 font-display text-4xl text-slate-50">Start public, scale into data access</h2>
          </motion.div>
          <div className="grid gap-4 md:grid-cols-3">
            {pricing.map((plan) => (
              <motion.div key={plan.name} variants={itemVariants}>
                <article className={`${styles.card} h-full rounded-lg border border-slate-800 bg-panel p-6`}>
                  <h3 className="font-display text-2xl text-slate-50">{plan.name}</h3>
                  <p className="mt-4 font-display text-4xl text-slate-50">{plan.price}</p>
                  <p className="mt-4 min-h-[56px] leading-7 text-slate-400">{plan.detail}</p>
                  <Link
                    href={plan.href}
                    className="focus-ring mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-50 px-4 py-3 font-semibold text-night transition-colors hover:bg-slate-200"
                  >
                    {plan.cta}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </article>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
    </main>
  );
}
