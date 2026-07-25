import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL || "postgres://postgres:1234@localhost:5432/placement_tracker";

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, { schema });

export * from "./schema";
