import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import * as schema from "./schema.js";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

(async () => {
  try {
    const client = await pool.connect();
    logger.info("PostgreSQL pool connected");
    client.release();
  } catch (err) {
    logger.error({ err }, "Failed to connect to PostgreSQL pool");
  }
})();

export const db = drizzle({ client: pool, schema });
