import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

type SmokeResult = {
  name: string;
  ok: boolean;
  detail: string;
};

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const demoApiKey = process.env.DEMO_API_KEY ?? "sk_stratum_demo_live";
const readOnly = process.env.SMOKE_READ_ONLY === "true";
const results: SmokeResult[] = [];

function record(name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail });
}

async function request(path: string, init?: RequestInit) {
  return fetch(`${baseUrl}${path}`, init);
}

async function expectStatus(path: string, expected: number) {
  const response = await request(path);
  record(`GET ${path}`, response.status === expected, `status=${response.status}`);
}

async function main() {
  await expectStatus("/", 200);
  await expectStatus("/map", 200);
  await expectStatus("/dashboard", 200);
  await expectStatus("/city/san_francisco", 200);
  await expectStatus("/neighborhood/9q8y", 200);

  const clusters = await request(
    "/api/map/clusters?bbox=-122.53,37.70,-122.35,37.82&layers=SAFETY,VIBE,INFRASTRUCTURE,OPPORTUNITY&city_id=san_francisco"
  );
  const clusterJson = await clusters.json();
  record(
    "GET /api/map/clusters",
    clusters.ok && clusterJson.type === "FeatureCollection" && clusterJson.features.length > 0,
    `status=${clusters.status} features=${clusterJson.features?.length ?? 0}`
  );

  const noAuth = await request("/api/analytics/san_francisco");
  record("GET /api/analytics without auth", noAuth.status === 401, `status=${noAuth.status}`);

  const analytics = await request("/api/analytics/san_francisco", {
    headers: { Authorization: `Bearer ${demoApiKey}` }
  });
  const analyticsJson = await analytics.json();
  record(
    "GET /api/analytics with demo auth",
    analytics.ok && analyticsJson.cells.length > 0,
    `status=${analytics.status} cells=${analyticsJson.cells?.length ?? 0}`
  );

  if (!readOnly) {
    const report = await request("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        report_type: "OPPORTUNITY",
        sub_type: "storefront_opening",
        lat: 30.2672,
        lng: -97.7431,
        severity: 3,
        city_id: "austin_tx"
      })
    });
    const reportJson = await report.json();
    record("POST /api/reports valid", report.ok && reportJson.success && Boolean(reportJson.geohash), `status=${report.status}`);

    const badReport = await request("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        report_type: "SAFETY",
        sub_type: "not_real",
        lat: 37.7,
        lng: -122.4,
        severity: 3,
        city_id: "san_francisco"
      })
    });
    record("POST /api/reports invalid subtype", badReport.status === 400, `status=${badReport.status}`);
  }

  console.table(results);
  if (results.some((result) => !result.ok)) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
