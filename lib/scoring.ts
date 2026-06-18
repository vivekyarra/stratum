import { clamp } from "@/lib/utils";
import type { LayerScore, ReportRecord, ReportType, TrendPoint } from "@/lib/types";

function daysAgoFromTimestampId(timestampId: string, now: number) {
  const timestamp = timestampId.split("#")[0];
  const parsed = new Date(timestamp).getTime();
  if (!Number.isFinite(parsed)) return 30;
  return Math.max(0, (now - parsed) / 86400000);
}

function recencyWeight(daysAgo: number) {
  if (daysAgo <= 1) return 1.0;
  if (daysAgo <= 7) return 0.7;
  if (daysAgo <= 14) return 0.4;
  return 0.2;
}

function impactScore(reports: ReportRecord[], type: ReportType, now: number) {
  return reports
    .filter((report) => report.report_type === type)
    .reduce((acc, report) => {
      const daysAgo = daysAgoFromTimestampId(report.timestamp_id, now);
      return acc + report.severity * recencyWeight(daysAgo);
    }, 0);
}

export function calculateNeighborhoodScore(reports: ReportRecord[], now = Date.now()): LayerScore {
  const safetyImpact = impactScore(reports, "SAFETY", now);
  const infrastructureImpact = impactScore(reports, "INFRASTRUCTURE", now);
  const vibeImpact = impactScore(reports, "VIBE", now);
  const opportunityImpact = impactScore(reports, "OPPORTUNITY", now);

  const safetyScore = clamp(100 - safetyImpact * 3, 0, 100);
  const infrastructureScore = clamp(100 - infrastructureImpact * 2.6, 0, 100);
  const vibeScore = clamp(50 + vibeImpact * 2, 0, 100);
  const opportunityScore = clamp(45 + opportunityImpact * 2.2, 0, 100);
  const overall = clamp(
    safetyScore * 0.35 + infrastructureScore * 0.3 + vibeScore * 0.2 + opportunityScore * 0.15,
    0,
    100
  );

  const reportCount24h = reports.filter((report) => daysAgoFromTimestampId(report.timestamp_id, now) <= 1).length;
  const reportCount7d = reports.filter((report) => daysAgoFromTimestampId(report.timestamp_id, now) <= 7).length;

  return {
    safetyScore: Number(safetyScore.toFixed(1)),
    vibeScore: Number(vibeScore.toFixed(1)),
    infrastructureScore: Number(infrastructureScore.toFixed(1)),
    opportunityScore: Number(opportunityScore.toFixed(1)),
    overall: Number(overall.toFixed(1)),
    reportCount24h,
    reportCount7d
  };
}

export function calculateTrends(reports: ReportRecord[], now = new Date()): TrendPoint[] {
  const points: TrendPoint[] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const end = new Date(now);
    end.setUTCHours(23, 59, 59, 999);
    end.setUTCDate(end.getUTCDate() - offset);

    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 30);

    const windowReports = reports.filter((report) => {
      const timestamp = new Date(report.timestamp_id.split("#")[0]).getTime();
      return timestamp >= start.getTime() && timestamp <= end.getTime();
    });
    const scores = calculateNeighborhoodScore(windowReports, end.getTime());

    points.push({
      date: end.toISOString().slice(5, 10),
      SAFETY: scores.safetyScore,
      VIBE: scores.vibeScore,
      INFRASTRUCTURE: scores.infrastructureScore,
      OPPORTUNITY: scores.opportunityScore,
      overall: scores.overall
    });
  }

  return points;
}
