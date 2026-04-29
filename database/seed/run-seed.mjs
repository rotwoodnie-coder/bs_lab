import fs from "node:fs";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const sqlPath = new URL("init-full-seed.sql", import.meta.url);
const sql = fs.readFileSync(sqlPath, "utf8");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true,
  charset: "utf8mb4",
});

try {
  // Split by semicolons and execute each statement separately
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("--") && !s.startsWith("/*"));

  let total = 0;
  for (const stmt of statements) {
    try {
      await pool.query(stmt);
      total++;
    } catch (e) {
      console.error(`[ERROR]`, e.message?.slice(0, 120));
    }
  }
  console.log(`[OK] Executed ${total} statements`);
} finally {
  await pool.end();
}
