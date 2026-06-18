"use client";

import { Activity, Layers, MapPin, Plus, Radio, X } from "lucide-react";
import maplibregl, { type GeoJSONSource, type MapLayerMouseEvent } from "maplibre-gl";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CITY_CONFIGS, DEFAULT_CITY_ID, LAYER_META, MAP_STYLE_URL, REPORT_TYPES } from "@/lib/constants";
import { cn, titleize } from "@/lib/utils";
import { ReportModal } from "@/components/ReportModal";
import { ScoreBar } from "@/components/ScoreBar";
import type { CityId, GeoJsonFeatureCollection, NeighborhoodHealth, ReportRecord, ReportType } from "@/lib/types";

type StratumMapProps = {
  mode?: "hero" | "public" | "city";
  initialCityId?: CityId | string;
  className?: string;
};

const emptyCollection: GeoJsonFeatureCollection = {
  type: "FeatureCollection",
  features: []
};

export function StratumMap({ mode = "public", initialCityId = DEFAULT_CITY_ID, className }: StratumMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const pulseFrameRef = useRef<number | null>(null);
  const [cityId, setCityId] = useState<CityId | string>(initialCityId);
  const [layers, setLayers] = useState<Record<ReportType, boolean>>({
    SAFETY: true,
    VIBE: true,
    INFRASTRUCTURE: true,
    OPPORTUNITY: true
  });
  const [liveCount, setLiveCount] = useState(0);
  const [mapCenter, setMapCenter] = useState(() => {
    const city = CITY_CONFIGS[initialCityId as CityId] ?? CITY_CONFIGS[DEFAULT_CITY_ID];
    return { lat: city.center[1], lng: city.center[0] };
  });
  const [selectedHealth, setSelectedHealth] = useState<NeighborhoodHealth | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "fallback">("loading");

  const activeLayerList = useMemo(
    () => REPORT_TYPES.filter((type) => layers[type]),
    [layers]
  );
  const activeLayerKey = activeLayerList.join(",");
  const city = CITY_CONFIGS[cityId as CityId] ?? CITY_CONFIGS[DEFAULT_CITY_ID];
  const interactive = mode !== "hero";

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: city.center,
      zoom: mode === "hero" ? 12.4 : 13,
      pitch: mode === "hero" ? 54 : 38,
      bearing: mode === "hero" ? -18 : 0,
      attributionControl: false,
      interactive
    });

    mapRef.current = map;

    if (interactive) {
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    }

    map.on("load", () => {
      setLoadState("ready");
      map.addSource("reports", {
        type: "geojson",
        data: emptyCollection
      });

      map.addLayer({
        id: "report-heat",
        type: "heatmap",
        source: "reports",
        maxzoom: 15,
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "severity"], 1, 0.2, 5, 1],
          "heatmap-intensity": mode === "hero" ? 1.2 : 0.65,
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(10,14,26,0)",
            0.18,
            "rgba(59,130,246,0.34)",
            0.42,
            "rgba(16,185,129,0.45)",
            0.72,
            "rgba(245,158,11,0.55)",
            1,
            "rgba(239,68,68,0.68)"
          ],
          "heatmap-radius": mode === "hero" ? 42 : 26,
          "heatmap-opacity": mode === "hero" ? 0.76 : 0.42
        }
      });

      map.addLayer({
        id: "recent-report-pulse",
        type: "circle",
        source: "reports",
        filter: ["==", ["get", "is_recent"], true],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "count"], 1, 11, 6, 19, 20, 33],
          "circle-color": [
            "match",
            ["get", "report_type"],
            "SAFETY",
            LAYER_META.SAFETY.color,
            "VIBE",
            LAYER_META.VIBE.color,
            "INFRASTRUCTURE",
            LAYER_META.INFRASTRUCTURE.color,
            "OPPORTUNITY",
            LAYER_META.OPPORTUNITY.color,
            "#7C3AED"
          ],
          "circle-opacity": 0.34,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#F8FAFC",
          "circle-stroke-opacity": 0.25
        }
      });

      map.addLayer({
        id: "report-points",
        type: "circle",
        source: "reports",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "count"], 1, 7, 6, 15.4, 20, 28],
          "circle-color": [
            "match",
            ["get", "report_type"],
            "SAFETY",
            LAYER_META.SAFETY.color,
            "VIBE",
            LAYER_META.VIBE.color,
            "INFRASTRUCTURE",
            LAYER_META.INFRASTRUCTURE.color,
            "OPPORTUNITY",
            LAYER_META.OPPORTUNITY.color,
            "#7C3AED"
          ],
          "circle-opacity": 0.86,
          "circle-stroke-color": "#F8FAFC",
          "circle-stroke-width": 1.2,
          "circle-stroke-opacity": 0.42
        }
      });

      map.addLayer({
        id: "report-labels",
        type: "symbol",
        source: "reports",
        layout: {
          "text-field": ["to-string", ["get", "count"]],
          "text-size": 11,
          "text-font": ["Noto Sans Regular"],
          "text-allow-overlap": true
        },
        paint: {
          "text-color": "#F8FAFC"
        }
      });

      const animatePulse = (timestamp: number) => {
        if (!map.getLayer("recent-report-pulse")) return;
        const progress = (timestamp % 1800) / 1800;
        const expansion = progress * 13;
        const opacity = 0.38 * (1 - progress);

        map.setPaintProperty("recent-report-pulse", "circle-radius", [
          "+",
          ["interpolate", ["linear"], ["get", "count"], 1, 8, 6, 16.4, 20, 29],
          expansion
        ]);
        map.setPaintProperty("recent-report-pulse", "circle-opacity", opacity);
        map.setPaintProperty("recent-report-pulse", "circle-stroke-opacity", opacity * 0.8);
        pulseFrameRef.current = requestAnimationFrame(animatePulse);
      };
      pulseFrameRef.current = requestAnimationFrame(animatePulse);

      if (interactive) {
        map.on("click", "report-points", handleFeatureClick);
        map.on("mouseenter", "report-points", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "report-points", () => {
          map.getCanvas().style.cursor = "";
        });
      }
    });

    map.on("error", () => setLoadState("fallback"));

    let heroTimer: ReturnType<typeof setInterval> | null = null;
    if (mode === "hero") {
      heroTimer = setInterval(() => {
        const cells = city.cells;
        const cell = cells[Math.floor(Math.random() * cells.length)];
        map.easeTo({
          center: cell.center,
          bearing: -18 + Math.random() * 36,
          duration: 2800
        });
      }, 4200);
    }

    return () => {
      if (heroTimer) clearInterval(heroTimer);
      if (pulseFrameRef.current !== null) {
        cancelAnimationFrame(pulseFrameRef.current);
        pulseFrameRef.current = null;
      }
      if (interactive) {
        map.off("click", "report-points", handleFeatureClick);
      }
      map.remove();
      mapRef.current = null;
    };
    // The map should only be constructed once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.flyTo({
      center: city.center,
      zoom: mode === "hero" ? 12.4 : 13,
      duration: 900,
      essential: true
    });
  }, [city.center, mode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    async function refreshReports() {
      const currentMap = mapRef.current;
      if (!currentMap || !currentMap.getSource("reports")) return;
      const bounds = currentMap.getBounds();
      setMapCenter({ lat: currentMap.getCenter().lat, lng: currentMap.getCenter().lng });

      const params = new URLSearchParams({
        bbox: `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`,
        layers: activeLayerKey,
        city_id: cityId
      });
      const response = await fetch(`/api/map/clusters?${params.toString()}`, { cache: "no-store" });
      const collection = (await response.json()) as GeoJsonFeatureCollection;
      const source = currentMap.getSource("reports") as GeoJSONSource;
      source.setData(collection);
      setLiveCount(collection.features.reduce((acc, feature) => acc + Number(feature.properties.count ?? 1), 0));
    }

    if (map.loaded()) {
      void refreshReports();
    } else {
      map.once("load", refreshReports);
    }
    map.on("moveend", refreshReports);

    const interval = setInterval(refreshReports, mode === "hero" ? 6500 : 12000);
    return () => {
      map.off("moveend", refreshReports);
      clearInterval(interval);
    };
  }, [activeLayerKey, cityId, mode]);

  async function handleFeatureClick(event: MapLayerMouseEvent) {
    const feature = event.features?.[0];
    const geohash = feature?.properties?.geohash;
    if (!geohash || typeof geohash !== "string") return;

    try {
      const response = await fetch(`/api/neighborhood/${geohash}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Neighborhood request failed with status ${response.status}`);
      }
      const health = (await response.json()) as NeighborhoodHealth;
      setSelectedHealth(health);
    } catch (error) {
      console.error("Unable to load neighborhood score card", error);
    }
  }

  function toggleLayer(type: ReportType) {
    setLayers((current) => ({ ...current, [type]: !current[type] }));
  }

  function handleSubmitted(report: ReportRecord) {
    setSelectedHealth(null);
    const map = mapRef.current;
    if (map) {
      map.flyTo({ center: [report.lng, report.lat], zoom: 13.8, duration: 700 });
    }
  }

  return (
    <div className={cn("relative h-full min-h-[520px] overflow-hidden bg-night", className)}>
      <div ref={containerRef} className="absolute inset-0" />
      {loadState === "fallback" && (
        <div className="city-grid absolute inset-0 bg-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_45%,rgba(124,58,237,0.22),transparent_52%)]" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,14,26,0.2),rgba(10,14,26,0.72))]" />

      {mode !== "hero" && (
        <>
          <div className="absolute left-4 top-4 z-10 flex max-w-[calc(100%-2rem)] flex-wrap items-center gap-3">
            <div className="rounded-lg border border-slate-700 bg-panel/90 p-2 shadow-lg backdrop-blur">
              <label className="sr-only" htmlFor="city-selector">
                City
              </label>
              <select
                id="city-selector"
                value={cityId}
                onChange={(event) => setCityId(event.target.value)}
                className="focus-ring rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              >
                {Object.values(CITY_CONFIGS).map((option) => (
                  <option value={option.id} key={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2 rounded-lg border border-slate-700 bg-panel/90 p-2 shadow-lg backdrop-blur">
              {REPORT_TYPES.map((type) => (
                <button
                  type="button"
                  key={type}
                  aria-pressed={layers[type]}
                  onClick={() => toggleLayer(type)}
                  className={cn(
                    "focus-ring inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium",
                    layers[type] ? "border-slate-500 bg-slate-800 text-slate-50" : "border-slate-700 text-slate-400"
                  )}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: LAYER_META[type].color }} />
                  {LAYER_META[type].label}
                </button>
              ))}
            </div>
          </div>

          <div className="absolute right-4 top-4 z-10 rounded-lg border border-slate-700 bg-panel/90 px-4 py-3 shadow-lg backdrop-blur">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Radio className="h-4 w-4 text-violet-300" />
              <span>Live signals</span>
            </div>
            <p className="font-display text-2xl text-slate-50">{liveCount}</p>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="focus-ring absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-md bg-violet px-5 py-3 font-semibold text-white shadow-glow hover:bg-violet/90"
          >
            <Plus className="h-5 w-5" />
            Add Report
          </button>
        </>
      )}

      {mode === "hero" && (
        <div className="absolute bottom-5 right-5 z-10 hidden rounded-lg border border-slate-700 bg-panel/80 p-4 backdrop-blur md:block">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Activity className="h-4 w-4 text-violet-300" />
            <span>Live cluster stream</span>
          </div>
          <p className="mt-1 font-display text-3xl text-slate-50">{liveCount}</p>
        </div>
      )}

      {selectedHealth && (
        <div className="absolute bottom-24 right-4 z-20 w-[min(390px,calc(100%-2rem))] rounded-lg border border-slate-700 bg-panel/95 p-4 shadow-2xl backdrop-blur">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm text-slate-400">
                <MapPin className="h-4 w-4 text-violet-300" />
                {selectedHealth.geohash.toUpperCase()}
              </p>
              <h3 className="font-display text-2xl text-slate-50">{selectedHealth.displayName}</h3>
            </div>
            <button
              type="button"
              className="focus-ring rounded-md border border-slate-700 p-2 text-slate-300 hover:bg-slate-800"
              onClick={() => setSelectedHealth(null)}
              aria-label="Close neighborhood card"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-md border border-slate-700 bg-slate-950/40 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Overall</p>
              <p className="font-display text-3xl text-slate-50">{selectedHealth.scores.overall.toFixed(1)}</p>
            </div>
            <div className="rounded-md border border-slate-700 bg-slate-950/40 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">7 day reports</p>
              <p className="font-display text-3xl text-slate-50">{selectedHealth.scores.reportCount7d}</p>
            </div>
          </div>
          <div className="space-y-3">
            <ScoreBar label="Safety" value={selectedHealth.scores.safetyScore} layer="SAFETY" />
            <ScoreBar label="Vibe" value={selectedHealth.scores.vibeScore} layer="VIBE" />
            <ScoreBar label="Infrastructure" value={selectedHealth.scores.infrastructureScore} layer="INFRASTRUCTURE" />
            <ScoreBar label="Opportunity" value={selectedHealth.scores.opportunityScore} layer="OPPORTUNITY" />
          </div>
          <Link
            href={`/neighborhood/${selectedHealth.geohash}`}
            className="focus-ring mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800"
          >
            <Layers className="h-4 w-4" />
            Open detail
          </Link>
        </div>
      )}

      {mode !== "hero" && (
        <ReportModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          cityId={cityId}
          location={mapCenter}
          onSubmitted={handleSubmitted}
        />
      )}

      {mode === "hero" && (
        <div className="absolute left-5 top-24 z-10 flex max-w-[calc(100%-2.5rem)] flex-wrap gap-2">
          {REPORT_TYPES.map((type) => (
            <span
              key={type}
              className="rounded-md border border-slate-700 bg-panel/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 backdrop-blur"
            >
              <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: LAYER_META[type].color }} />
              {titleize(type.toLowerCase())}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
