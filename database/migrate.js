import { readFileSync, readdirSync } from "fs";
import pg from "pg";
const pool = new pg.Pool({ connectionString: process.env.DB_URL });
for (const f of readdirSync("./database/migrations")) {
  await pool.query(readFileSync(`./database/migrations/${f}`, "utf8"));
}
await pool.end();
console.log("DB migrated");
