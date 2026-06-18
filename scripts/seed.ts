import { writeFile } from "fs/promises";
import path from "path";
import { loadEnvConfig } from "@next/env";
import { batchWriteReports } from "../lib/data-store";
import { generateMockReports, displayNameForGeohash } from "../lib/mock-data";
import { closeAurora, hasAuroraConfig, queryAurora } from "../lib/postgres";
import { calculateNeighborhoodScore } from "../lib/scoring";

loadEnvConfig(process.cwd());

const reports = generateMockReports(900, new Date());

async function seedAurora() {
  if (!hasAuroraConfig()) return { remote: false, rows: 0 };

  const groups = new Map<string, typeof reports>();
  reports.forEach((report) => {
    const current = groups.get(report.geohash_4) ?? [];
    current.push(report);
    groups.set(report.geohash_4, current);
  });

  let rows = 0;
  for (const [geohash4, bucket] of groups.entries()) {
    const cityId = bucket[0].city_id;
    const displayName = displayNameForGeohash(geohash4, cityId);
    const scores = calculateNeighborhoodScore(bucket);

    await queryAurora(
      `INSERT INTO neighborhoods(geohash_4, city_id, display_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (geohash_4) DO UPDATE SET city_id = EXCLUDED.city_id, display_name = EXCLUDED.display_name`,
      [geohash4, cityId, displayName]
    );
    await queryAurora(
      `INSERT INTO neighborhood_scores(
        geohash_4, safety_score, vibe_score, infrastructure_score, opportunity_score,
        overall_score, report_count_24h, report_count_7d
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        geohash4,
        scores.safetyScore,
        scores.vibeScore,
        scores.infrastructureScore,
        scores.opportunityScore,
        scores.overall,
        scores.reportCount24h,
        scores.reportCount7d
      ]
    );
    rows += 1;
  }

  const apiKey = process.env.DEMO_API_KEY ?? "sk_stratum_demo_live";
  const user = await queryAurora(
    `INSERT INTO users(email, name, plan_type)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, plan_type = EXCLUDED.plan_type
     RETURNING id`,
    ["operator@stratum.local", "STRATUM Demo Operator", "realtor"]
  );
  const userId = String(user.rows[0]?.id);
  await queryAurora(
    `INSERT INTO api_subscriptions(user_id, org_name, plan_type, api_key, monthly_calls_limit, active)
     VALUES ($1::uuid, $2, $3, $4, $5, true)
     ON CONFLICT (api_key) DO UPDATE SET user_id = EXCLUDED.user_id, plan_type = EXCLUDED.plan_type, active = true`,
    [userId, "STRATUM Demo", "realtor", apiKey, 10000]
  );

  await closeAurora();
  return { remote: true, rows };
}

async function main() {
  const skipDynamo = process.env.SEED_SKIP_DYNAMO === "true";
  const dynamo = skipDynamo ? { remote: true, written: 0 } : await batchWriteReports(reports);
  const aurora = await seedAurora();

  if (skipDynamo) {
    console.log("Skipped DynamoDB seed for this retry.");
  } else if (!dynamo.remote) {
    const output = path.join(process.cwd(), "scripts", "generated-seed-reports.json");
    await writeFile(output, JSON.stringify(reports, null, 2));
    console.log(`DynamoDB env not configured. Wrote seed preview to ${output}`);
  } else {
    console.log(`Seeded ${dynamo.written} reports into DynamoDB.`);
  }

  if (!aurora.remote) {
    console.log("Aurora env not configured. Skipped neighborhood score inserts.");
  } else {
    console.log(`Seeded ${aurora.rows} Aurora neighborhood score rows.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
