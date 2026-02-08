import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
});

(async () => {
    try {
        const client = await pool.connect();
        console.log("✅ PostgreSQL pool initial connection successful");
        client.release();
    } catch (err) {
        console.error("❌ Error connecting to PostgreSQL pool:");
    }
})();

const postgreDb = drizzle({ client: pool });
export default postgreDb;
