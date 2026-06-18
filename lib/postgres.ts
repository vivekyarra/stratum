import {
  ExecuteStatementCommand,
  RDSDataClient,
  type Field,
  type SqlParameter
} from "@aws-sdk/client-rds-data";
import { Pool } from "pg";

type AuroraValue = string | number | boolean | Date | null;

export type AuroraQueryResult = {
  rows: Array<Record<string, unknown>>;
  rowCount: number;
};

let pool: Pool | null = null;
let dataClient: RDSDataClient | null = null;

function hasDirectPostgresConfig() {
  return Boolean(
    process.env.AURORA_HOST &&
      process.env.AURORA_DATABASE &&
      process.env.AURORA_USER &&
      process.env.AURORA_PASSWORD
  );
}

function hasDataApiConfig() {
  return Boolean(
    process.env.AURORA_RESOURCE_ARN &&
      process.env.AURORA_SECRET_ARN &&
      process.env.AURORA_DATABASE
  );
}

export function hasAuroraConfig() {
  return hasDirectPostgresConfig() || hasDataApiConfig();
}

function getPgPool() {
  if (!hasDirectPostgresConfig()) return null;
  if (!pool) {
    pool = new Pool({
      host: process.env.AURORA_HOST,
      port: Number(process.env.AURORA_PORT ?? 5432),
      database: process.env.AURORA_DATABASE,
      user: process.env.AURORA_USER,
      password: process.env.AURORA_PASSWORD,
      ssl: process.env.AURORA_SSL === "false" ? false : { rejectUnauthorized: false },
      max: 8
    });
  }
  return pool;
}

function getDataClient() {
  if (!hasDataApiConfig()) return null;
  if (!dataClient) {
    dataClient = new RDSDataClient({
      region: process.env.AWS_REGION ?? "us-east-1"
    });
  }
  return dataClient;
}

function toSqlParameter(name: string, value: AuroraValue): SqlParameter {
  if (value === null) return { name, value: { isNull: true } };
  if (value instanceof Date) return { name, value: { stringValue: value.toISOString() }, typeHint: "TIMESTAMP" };
  if (typeof value === "boolean") return { name, value: { booleanValue: value } };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { name, value: { longValue: value } }
      : { name, value: { doubleValue: value } };
  }
  return { name, value: { stringValue: value } };
}

function fromField(field: Field | undefined): unknown {
  if (!field || field.isNull) return null;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.longValue !== undefined) return field.longValue;
  if (field.doubleValue !== undefined) return field.doubleValue;
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.blobValue !== undefined) return Buffer.from(field.blobValue);
  if (field.arrayValue !== undefined) return field.arrayValue;
  return null;
}

function convertPlaceholders(sql: string, values: AuroraValue[]) {
  const used = new Set<number>();
  const convertedSql = sql.replace(/\$(\d+)/g, (_match, indexText: string) => {
    const index = Number(indexText);
    used.add(index);
    return `:p${index}`;
  });

  const parameters = Array.from(used)
    .sort((a, b) => a - b)
    .map((index) => toSqlParameter(`p${index}`, values[index - 1] ?? null));

  return { sql: convertedSql, parameters };
}

export async function queryAurora(sql: string, values: AuroraValue[] = []): Promise<AuroraQueryResult> {
  const directPool = getPgPool();
  if (directPool) {
    const result = await directPool.query(sql, values);
    return {
      rows: result.rows,
      rowCount: result.rowCount ?? 0
    };
  }

  const client = getDataClient();
  if (!client) throw new Error("Aurora is not configured");

  const converted = convertPlaceholders(sql, values);
  const result = await client.send(
    new ExecuteStatementCommand({
      resourceArn: process.env.AURORA_RESOURCE_ARN,
      secretArn: process.env.AURORA_SECRET_ARN,
      database: process.env.AURORA_DATABASE,
      sql: converted.sql,
      parameters: converted.parameters,
      includeResultMetadata: true
    })
  );

  const columns = (result.columnMetadata ?? []).map((column, index) => column.name ?? `column_${index}`);
  const rows = (result.records ?? []).map((record) =>
    Object.fromEntries(columns.map((column, index) => [column, fromField(record[index])]))
  );

  return {
    rows,
    rowCount: Number(result.numberOfRecordsUpdated ?? rows.length)
  };
}

export async function closeAurora() {
  if (pool) {
    await pool.end();
    pool = null;
  }
  if (dataClient) {
    dataClient.destroy();
    dataClient = null;
  }
}
