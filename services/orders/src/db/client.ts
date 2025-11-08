import { Pool } from "pg";
import { DATABASE_URL } from "../config/config";

export const pool = new Pool({
  connectionString: DATABASE_URL,
});

pool.on("error", (err) => {
  console.error("Unexpected Postgres error:", err);
});
