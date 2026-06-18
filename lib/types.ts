export type ReportType = "SAFETY" | "VIBE" | "INFRASTRUCTURE" | "OPPORTUNITY";

export type CityId = "san_francisco" | "new_york_brooklyn" | "austin_tx";

export type ReportRecord = {
  report_id: string;
  geohash: string;
  geohash_4: string;
  timestamp_id: string;
  report_type: ReportType;
  sub_type: string;
  lat: number;
  lng: number;
  severity: number;
  city_id: CityId | string;
  ttl: number;
};

export type LayerScore = {
  safetyScore: number;
  vibeScore: number;
  infrastructureScore: number;
  opportunityScore: number;
  overall: number;
  reportCount24h: number;
  reportCount7d: number;
};

export type TrendPoint = {
  date: string;
  SAFETY: number;
  VIBE: number;
  INFRASTRUCTURE: number;
  OPPORTUNITY: number;
  overall: number;
};

export type NeighborhoodHealth = {
  geohash: string;
  geohash_4: string;
  displayName: string;
  city_id: string;
  centroid: { lat: number; lng: number };
  scores: LayerScore;
  trends: TrendPoint[];
  recentReports: ReportRecord[];
};

export type AnalyticsCell = {
  geohash_4: string;
  display_name: string;
  city_id: string;
  scores: LayerScore;
  trends: TrendPoint[];
};

export type AnalyticsResponse = {
  city_id: string;
  generated_at: string;
  api_key_plan: string;
  cells: AnalyticsCell[];
};

export type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: {
      type: "Point";
      coordinates: [number, number];
    };
    properties: Record<string, string | number | boolean | null>;
  }>;
};
