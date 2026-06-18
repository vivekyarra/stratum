import { randomUUID } from "crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  ScanCommand,
  type BatchWriteCommandInput
} from "@aws-sdk/lib-dynamodb";
import * as ngeohash from "ngeohash";
import { CITY_CONFIGS, DEFAULT_CITY_ID, REPORT_SUBTYPES, REPORT_TYPES } from "@/lib/constants";
import { MOCK_REPORTS, cityLabelForId, displayNameForGeohash } from "@/lib/mock-data";
import { hasAuroraConfig, queryAurora } from "@/lib/postgres";
import { calculateNeighborhoodScore, calculateTrends } from "@/lib/scoring";
import { parseBearerToken } from "@/lib/utils";
import type {
  AnalyticsCell,
  AnalyticsResponse,
  CityId,
  GeoJsonFeatureCollection,
  NeighborhoodHealth,
  ReportRecord,
  ReportType
} from "@/lib/types";

type ReportInput = {
  report_type: ReportType;
  sub_type: string;
  lat: number;
  lng: number;
  severity: number;
  city_id?: string;
};

let documentClient: DynamoDBDocumentClient | null = null;
const submittedReports: ReportRecord[] = [];

function hasDynamoConfig() {
  return Boolean(process.env.DYNAMODB_TABLE_NAME && process.env.AWS_REGION && process.env.DISABLE_REMOTE_DB !== "true");
}

function getDynamoDocClient() {
  if (!hasDynamoConfig()) return null;
  if (!documentClient) {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION
    });
    documentClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true }
    });
  }
  return documentClient;
}

function tableName() {
  return process.env.DYNAMODB_TABLE_NAME ?? "stratum-reports";
}

function localReports() {
  return [...submittedReports, ...MOCK_REPORTS];
}

function validateReportInput(input: Partial<ReportInput>): ReportInput {
  if (!input.report_type || !REPORT_TYPES.includes(input.report_type)) {
    throw new Error("report_type must be one of SAFETY, VIBE, INFRASTRUCTURE, OPPORTUNITY");
  }

  const subtypeOptions = REPORT_SUBTYPES[input.report_type];
  if (!input.sub_type || !subtypeOptions.includes(input.sub_type)) {
    throw new Error(`sub_type must be valid for ${input.report_type}`);
  }

  const lat = Number(input.lat);
  const lng = Number(input.lng);
  const severity = Number(input.severity);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new Error("lat must be a valid latitude");
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) throw new Error("lng must be a valid longitude");
  if (!Number.isFinite(severity) || severity < 1 || severity > 5) throw new Error("severity must be between 1 and 5");

  return {
    report_type: input.report_type,
    sub_type: input.sub_type,
    lat,
    lng,
    severity: Math.round(severity),
    city_id: input.city_id ?? DEFAULT_CITY_ID
  };
}

export async function createReport(input: Partial<ReportInput>) {
  const payload = validateReportInput(input);
  const geohash = ngeohash.encode(payload.lat, payload.lng, 6);
  const id = randomUUID();
  const timestamp = new Date().toISOString();
  const report: ReportRecord = {
    report_id: id,
    geohash,
    geohash_4: geohash.slice(0, 4),
    timestamp_id: `${timestamp}#${id}`,
    report_type: payload.report_type,
    sub_type: payload.sub_type,
    lat: payload.lat,
    lng: payload.lng,
    severity: payload.severity,
    city_id: payload.city_id ?? DEFAULT_CITY_ID,
    ttl: Math.floor((Date.now() + 90 * 86400000) / 1000)
  };

  const client = getDynamoDocClient();
  if (client) {
    try {
      await client.send(
        new PutCommand({
          TableName: tableName(),
          Item: report
        })
      );
    } catch (error) {
      console.error("DynamoDB PutCommand failed, keeping local fallback report", error);
    }
  }

  submittedReports.unshift(report);
  return report;
}

export async function batchWriteReports(reports: ReportRecord[]) {
  const client = getDynamoDocClient();
  if (!client) return { remote: false, written: 0 };

  let written = 0;
  for (let i = 0; i < reports.length; i += 25) {
    const chunk = reports.slice(i, i + 25);
    let requestItems: NonNullable<BatchWriteCommandInput["RequestItems"]> = {
      [tableName()]: chunk.map((Item) => ({
        PutRequest: { Item }
      }))
    };

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const result = await client.send(
        new BatchWriteCommand({
          RequestItems: requestItems
        })
      );
      const pending = result.UnprocessedItems?.[tableName()] ?? [];
      if (!pending.length) break;
      if (attempt === 5) throw new Error(`DynamoDB left ${pending.length} seed writes unprocessed`);
      requestItems = { [tableName()]: pending };
      await new Promise((resolve) => setTimeout(resolve, 150 * 2 ** attempt));
    }
    written += chunk.length;
  }
  return { remote: true, written };
}

async function queryDynamoReportsByCity(cityId: string, days = 30) {
  const client = getDynamoDocClient();
  if (!client) return null;

  const since = new Date(Date.now() - days * 86400000).toISOString();
  const result = await client.send(
    new QueryCommand({
      TableName: tableName(),
      IndexName: "city_id-time",
      KeyConditionExpression: "city_id = :city AND timestamp_id >= :since",
      ExpressionAttributeValues: {
        ":city": cityId,
        ":since": since
      },
      Limit: 2000,
      ScanIndexForward: false
    })
  );

  return (result.Items ?? []) as ReportRecord[];
}

async function queryDynamoReportsByGeohash(geohash: string, days = 30) {
  const client = getDynamoDocClient();
  if (!client) return null;

  const since = new Date(Date.now() - days * 86400000).toISOString();
  if (geohash.length >= 5) {
    const result = await client.send(
      new QueryCommand({
        TableName: tableName(),
        KeyConditionExpression: "geohash = :geohash AND timestamp_id >= :since",
        ExpressionAttributeValues: {
          ":geohash": geohash,
          ":since": since
        },
        ScanIndexForward: false
      })
    );
    return (result.Items ?? []) as ReportRecord[];
  }

  const result = await client.send(
    new ScanCommand({
      TableName: tableName(),
      FilterExpression: "begins_with(geohash, :prefix) AND timestamp_id >= :since",
      ExpressionAttributeValues: {
        ":prefix": geohash,
        ":since": since
      },
      Limit: 1000
    })
  );
  return (result.Items ?? []) as ReportRecord[];
}

export async function getReportsForCity(cityId: string, days = 30) {
  try {
    const remote = await queryDynamoReportsByCity(cityId, days);
    if (remote) return remote;
  } catch (error) {
    console.error("DynamoDB city query failed, using local reports", error);
  }

  const since = Date.now() - days * 86400000;
  return localReports().filter(
    (report) => report.city_id === cityId && new Date(report.timestamp_id.split("#")[0]).getTime() >= since
  );
}

export async function getReportsForGeohash(geohash: string, days = 30) {
  try {
    const remote = await queryDynamoReportsByGeohash(geohash, days);
    if (remote) return remote;
  } catch (error) {
    console.error("DynamoDB geohash query failed, using local reports", error);
  }

  const since = Date.now() - days * 86400000;
  return localReports().filter(
    (report) => report.geohash.startsWith(geohash) && new Date(report.timestamp_id.split("#")[0]).getTime() >= since
  );
}

export async function getReportsInBounds(params: {
  bbox?: [number, number, number, number];
  layers: ReportType[];
  city_id?: string;
}) {
  const cityId = params.city_id ?? DEFAULT_CITY_ID;
  const source = await getReportsForCity(cityId, 30);

  return source.filter((report) => {
    const layerMatch = params.layers.includes(report.report_type);
    if (!layerMatch) return false;
    if (!params.bbox) return true;

    const [minLng, minLat, maxLng, maxLat] = params.bbox;
    return report.lng >= minLng && report.lng <= maxLng && report.lat >= minLat && report.lat <= maxLat;
  });
}

export async function getMapClusters(params: {
  bbox?: [number, number, number, number];
  layers: ReportType[];
  city_id?: string;
}): Promise<GeoJsonFeatureCollection> {
  const reports = await getReportsInBounds(params);
  const grouped = new Map<string, ReportRecord[]>();

  reports.forEach((report) => {
    const key = `${report.geohash}:${report.report_type}`;
    const current = grouped.get(key) ?? [];
    current.push(report);
    grouped.set(key, current);
  });

  return {
    type: "FeatureCollection",
    features: Array.from(grouped.entries()).map(([key, bucket]) => {
      const dominant = bucket[0];
      const latestTimestamp = bucket.reduce((latest, report) => {
        const timestamp = report.timestamp_id.split("#")[0];
        return timestamp > latest ? timestamp : latest;
      }, "");
      const avgLat = bucket.reduce((acc, report) => acc + report.lat, 0) / bucket.length;
      const avgLng = bucket.reduce((acc, report) => acc + report.lng, 0) / bucket.length;
      const avgSeverity = bucket.reduce((acc, report) => acc + report.severity, 0) / bucket.length;

      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [avgLng, avgLat]
        },
        properties: {
          id: key,
          geohash: dominant.geohash,
          geohash_4: dominant.geohash_4,
          report_type: dominant.report_type,
          sub_type: dominant.sub_type,
          city_id: dominant.city_id,
          count: bucket.length,
          severity: Number(avgSeverity.toFixed(1)),
          latest_timestamp: latestTimestamp,
          is_recent: new Date(latestTimestamp).getTime() >= Date.now() - 24 * 60 * 60 * 1000
        }
      };
    })
  };
}

export async function getNeighborhoodHealth(geohash: string): Promise<NeighborhoodHealth> {
  const reports = await getReportsForGeohash(geohash, 30);
  const sourceReports = reports.length ? reports : localReports().filter((report) => report.geohash_4 === geohash.slice(0, 4));
  const scores = calculateNeighborhoodScore(sourceReports);
  const latest = sourceReports[0];
  const decoded = safeDecodeGeohash(geohash);
  const cityId = latest?.city_id ?? nearestCity(decoded.lng, decoded.lat);

  return {
    geohash,
    geohash_4: geohash.slice(0, 4),
    displayName: displayNameForGeohash(geohash, cityId),
    city_id: cityId,
    centroid: decoded,
    scores,
    trends: calculateTrends(sourceReports),
    recentReports: sourceReports.slice(0, 12)
  };
}

function safeDecodeGeohash(geohash: string) {
  try {
    const decoded = ngeohash.decode(geohash);
    return { lat: decoded.latitude, lng: decoded.longitude };
  } catch {
    const city = CITY_CONFIGS[DEFAULT_CITY_ID];
    return { lat: city.center[1], lng: city.center[0] };
  }
}

function nearestCity(lng: number, lat: number) {
  const candidates = Object.values(CITY_CONFIGS)
    .map((city) => ({
      city_id: city.id,
      distance: Math.hypot(city.center[0] - lng, city.center[1] - lat)
    }))
    .sort((a, b) => a.distance - b.distance);
  return candidates[0]?.city_id ?? DEFAULT_CITY_ID;
}

async function validateApiKey(rawAuthorizationHeader: string | null) {
  const apiKey = parseBearerToken(rawAuthorizationHeader);
  if (!apiKey) return null;

  if (hasAuroraConfig()) {
    const result = await queryAurora(
      "SELECT api_key, plan_type, monthly_calls_limit, calls_this_month FROM api_subscriptions WHERE api_key = $1 AND active = true LIMIT 1",
      [apiKey]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      api_key: String(row.api_key),
      plan_type: String(row.plan_type),
      monthly_calls_limit: Number(row.monthly_calls_limit),
      calls_this_month: Number(row.calls_this_month)
    };
  }

  const demoKey = process.env.DEMO_API_KEY ?? "sk_stratum_demo_live";
  if (apiKey === demoKey) {
    return {
      api_key: apiKey,
      plan_type: "demo_realtor",
      monthly_calls_limit: 10000,
      calls_this_month: 1842
    };
  }

  return null;
}

async function logApiCall(apiKey: string, endpoint: string, cityId: string, responseMs: number) {
  if (!hasAuroraConfig()) return;

  await queryAurora(
    "INSERT INTO api_call_logs(api_key, endpoint, city_id, response_ms) VALUES ($1, $2, $3, $4)",
    [apiKey, endpoint, cityId, responseMs]
  );
  await queryAurora("UPDATE api_subscriptions SET calls_this_month = calls_this_month + 1 WHERE api_key = $1", [apiKey]);
}

export async function getAnalyticsForCity(cityId: string, authorizationHeader: string | null): Promise<AnalyticsResponse> {
  const startedAt = Date.now();
  const subscription = await validateApiKey(authorizationHeader);
  if (!subscription) {
    throw new Error("UNAUTHORIZED");
  }

  const reports = await getReportsForCity(cityId, 30);
  const groups = new Map<string, ReportRecord[]>();
  reports.forEach((report) => {
    const key = report.geohash_4;
    const current = groups.get(key) ?? [];
    current.push(report);
    groups.set(key, current);
  });

  const cells: AnalyticsCell[] = Array.from(groups.entries())
    .map(([geohash4, bucket]) => ({
      geohash_4: geohash4,
      display_name: displayNameForGeohash(geohash4, cityId),
      city_id: cityId,
      scores: calculateNeighborhoodScore(bucket),
      trends: calculateTrends(bucket)
    }))
    .sort((a, b) => b.scores.reportCount7d - a.scores.reportCount7d);

  await logApiCall(subscription.api_key, "/api/analytics/[city_id]", cityId, Date.now() - startedAt);

  return {
    city_id: cityId,
    generated_at: new Date().toISOString(),
    api_key_plan: subscription.plan_type,
    cells
  };
}

export async function getDashboardSnapshot(cityId: string = DEFAULT_CITY_ID) {
  const demoKey = process.env.DEMO_API_KEY ?? "sk_stratum_demo_live";
  return getAnalyticsForCity(cityId, `Bearer ${demoKey}`);
}

export function cityOptions() {
  return Object.values(CITY_CONFIGS).map((city) => ({
    id: city.id,
    label: city.label,
    center: city.center,
    bbox: city.bbox
  }));
}

export function getCityLabel(cityId: string) {
  return cityLabelForId(cityId);
}
