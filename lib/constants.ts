import type { CityId, ReportType } from "@/lib/types";

export const REPORT_TYPES: ReportType[] = [
  "SAFETY",
  "VIBE",
  "INFRASTRUCTURE",
  "OPPORTUNITY"
];

export const LAYER_META: Record<
  ReportType,
  { label: string; color: string; darkColor: string; description: string }
> = {
  SAFETY: {
    label: "Safety",
    color: "#EF4444",
    darkColor: "rgba(239, 68, 68, 0.22)",
    description: "Noise, lighting, flooding, and street-level incident signals"
  },
  VIBE: {
    label: "Vibe",
    color: "#10B981",
    darkColor: "rgba(16, 185, 129, 0.22)",
    description: "Community activity, street life, public art, and events"
  },
  INFRASTRUCTURE: {
    label: "Infrastructure",
    color: "#3B82F6",
    darkColor: "rgba(59, 130, 246, 0.22)",
    description: "Road, utility, waste, transit, and maintenance patterns"
  },
  OPPORTUNITY: {
    label: "Opportunity",
    color: "#F59E0B",
    darkColor: "rgba(245, 158, 11, 0.22)",
    description: "Development, leasing, openings, and investment activity"
  }
};

export const REPORT_SUBTYPES: Record<ReportType, string[]> = {
  SAFETY: ["noise_complaint", "suspicious_activity", "poor_lighting", "flooding"],
  VIBE: ["new_business", "community_event", "public_art", "street_life"],
  INFRASTRUCTURE: ["pothole", "broken_signal", "utility_issue", "trash_overflow"],
  OPPORTUNITY: ["development_activity", "storefront_opening", "transit_upgrade", "zoning_change"]
};

export const CITY_CONFIGS: Record<
  CityId,
  {
    id: CityId;
    label: string;
    center: [number, number];
    bbox: [number, number, number, number];
    cells: Array<{ name: string; center: [number, number] }>;
  }
> = {
  san_francisco: {
    id: "san_francisco",
    label: "San Francisco",
    center: [-122.4194, 37.7749],
    bbox: [-122.53, 37.70, -122.35, 37.82],
    cells: [
      { name: "Hayes Valley", center: [-122.4242, 37.7767] },
      { name: "Mission Dolores", center: [-122.4268, 37.7617] },
      { name: "SoMa East", center: [-122.3971, 37.7785] },
      { name: "North Beach", center: [-122.4104, 37.8060] },
      { name: "Inner Richmond", center: [-122.4632, 37.7806] }
    ]
  },
  new_york_brooklyn: {
    id: "new_york_brooklyn",
    label: "New York - Brooklyn",
    center: [-73.9442, 40.6782],
    bbox: [-74.04, 40.57, -73.85, 40.74],
    cells: [
      { name: "Williamsburg South", center: [-73.9571, 40.7081] },
      { name: "Fort Greene", center: [-73.9742, 40.6915] },
      { name: "Park Slope", center: [-73.9816, 40.6720] },
      { name: "Bushwick West", center: [-73.9230, 40.6958] },
      { name: "DUMBO", center: [-73.9876, 40.7033] }
    ]
  },
  austin_tx: {
    id: "austin_tx",
    label: "Austin TX",
    center: [-97.7431, 30.2672],
    bbox: [-97.83, 30.20, -97.65, 30.34],
    cells: [
      { name: "East Sixth", center: [-97.7240, 30.2642] },
      { name: "South Congress", center: [-97.7491, 30.2500] },
      { name: "Mueller", center: [-97.7008, 30.2983] },
      { name: "Rainey", center: [-97.7387, 30.2586] },
      { name: "Crestview", center: [-97.7205, 30.3423] }
    ]
  }
};

export const DEFAULT_CITY_ID: CityId = "san_francisco";

export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/dark";
