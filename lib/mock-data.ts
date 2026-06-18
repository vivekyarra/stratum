import * as ngeohash from "ngeohash";
import { CITY_CONFIGS, REPORT_SUBTYPES, REPORT_TYPES } from "@/lib/constants";
import type { CityId, ReportRecord, ReportType } from "@/lib/types";

const distribution: Array<{ type: ReportType; weight: number }> = [
  { type: "INFRASTRUCTURE", weight: 0.4 },
  { type: "SAFETY", weight: 0.3 },
  { type: "VIBE", weight: 0.2 },
  { type: "OPPORTUNITY", weight: 0.1 }
];

function mulberry32(seed: number) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weightedType(random: () => number) {
  const pick = random();
  let cursor = 0;
  for (const item of distribution) {
    cursor += item.weight;
    if (pick <= cursor) return item.type;
  }
  return REPORT_TYPES[0];
}

function jitterCoordinate(center: [number, number], random: () => number): [number, number] {
  const lng = center[0] + (random() - 0.5) * 0.018;
  const lat = center[1] + (random() - 0.5) * 0.014;
  return [lng, lat];
}

export function generateMockReports(total = 900, now = new Date()): ReportRecord[] {
  const random = mulberry32(424242);
  const cities = Object.keys(CITY_CONFIGS) as CityId[];
  const reports: ReportRecord[] = [];

  for (let i = 0; i < total; i += 1) {
    const cityId = cities[i % cities.length];
    const city = CITY_CONFIGS[cityId];
    const cell = city.cells[Math.floor(random() * city.cells.length)];
    const [lng, lat] = jitterCoordinate(cell.center, random);
    const reportType = weightedType(random);
    const subtypeOptions = REPORT_SUBTYPES[reportType];
    const subType = subtypeOptions[Math.floor(random() * subtypeOptions.length)];
    const isFreshDemoSignal = i < Math.ceil(total * 0.12);
    const ageMinutes = isFreshDemoSignal
      ? random() * 23 * 60
      : 24 * 60 + random() * 29 * 24 * 60;
    const occurredAt = new Date(now.getTime() - ageMinutes * 60000);
    const hash = ngeohash.encode(lat, lng, 6);
    const timestamp = occurredAt.toISOString();
    const ttl = Math.floor((occurredAt.getTime() + 90 * 86400000) / 1000);

    reports.push({
      report_id: `mock_${String(i + 1).padStart(4, "0")}`,
      geohash: hash,
      geohash_4: hash.slice(0, 4),
      timestamp_id: `${timestamp}#mock_${String(i + 1).padStart(4, "0")}`,
      report_type: reportType,
      sub_type: subType,
      lat,
      lng,
      severity: Math.max(1, Math.min(5, Math.round(1 + random() * 4))),
      city_id: cityId,
      ttl
    });
  }

  return reports.sort((a, b) => b.timestamp_id.localeCompare(a.timestamp_id));
}

export const MOCK_REPORTS = generateMockReports();

export function cityLabelForId(cityId: string) {
  return CITY_CONFIGS[cityId as CityId]?.label ?? cityId.replaceAll("_", " ");
}

export function displayNameForGeohash(geohash: string, cityId?: string) {
  const prefix = geohash.slice(0, 4);
  const reportsInCell = MOCK_REPORTS.filter((report) => report.geohash.startsWith(prefix));
  if (!reportsInCell.length) return `Cell ${prefix.toUpperCase()}`;

  const cityReports = cityId ? reportsInCell.filter((report) => report.city_id === cityId) : reportsInCell;
  const sample = cityReports[0] ?? reportsInCell[0];
  const city = CITY_CONFIGS[sample.city_id as CityId];
  if (!city) return `Cell ${prefix.toUpperCase()}`;

  const nearest = city.cells
    .map((cell) => ({
      name: cell.name,
      distance: Math.hypot(cell.center[0] - sample.lng, cell.center[1] - sample.lat)
    }))
    .sort((a, b) => a.distance - b.distance)[0];

  return nearest ? `${nearest.name} - ${prefix.toUpperCase()}` : `Cell ${prefix.toUpperCase()}`;
}
