import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';

function requiredEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) throw new Error(`MISSING_ENV:${name}`);
  return value.trim();
}

function resolvePoolConfig() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw || !raw.startsWith('mysql://')) {
    throw new Error('MISSING_ENV:DATABASE_URL');
  }
  const normalized = raw.replace(/^mysql:\/\//i, 'http://');
  const u = new URL(normalized);
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 3306,
    user: decodeURIComponent(u.username || ''),
    password: decodeURIComponent(u.password || ''),
    database: u.pathname.replace(/^\//, '').split('/')[0]?.split('?')[0] || '',
  };
}

function toSqlDateTime(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
}

const outFile = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve('TEMP_ERRORS.md');
const cfg = resolvePoolConfig();
const pool = mysql.createPool({
  host: cfg.host,
  port: cfg.port,
  user: cfg.user,
  password: cfg.password,
  database: cfg.database,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE ?? 4),
  queueLimit: 0,
  charset: 'utf8mb4',
});

const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
const sinceSql = toSqlDateTime(since);

const [rows] = await pool.query(
  `SELECT log_id, user_id, log_type, log_time, log_data_type, log_data_id
   FROM sys_log
   WHERE log_time >= ?
     AND (
       log_type LIKE '%BLOCKED%'
       OR log_type LIKE '%VIOLATION%'
       OR log_type LIKE '%401%'
     )
   ORDER BY log_time DESC`,
  [sinceSql],
);

const items = rows || [];
const lines = [];
lines.push('# TEMP_ERRORS');
lines.push('');
lines.push(`- generated_at: ${new Date().toISOString()}`);
lines.push(`- window_start: ${since.toISOString()}`);
lines.push(`- total: ${items.length}`);
lines.push('');

for (const row of items) {
  lines.push(`## ${row.log_id}`);
  lines.push(`- user_id: ${row.user_id ?? ''}`);
  lines.push(`- log_type: ${row.log_type ?? ''}`);
  lines.push(`- log_time: ${row.log_time instanceof Date ? row.log_time.toISOString() : String(row.log_time ?? '')}`);
  lines.push(`- log_data_type: ${row.log_data_type ?? ''}`);
  lines.push(`- log_data_id: ${row.log_data_id ?? ''}`);
  lines.push('');
}

await fs.writeFile(outFile, lines.join('\n'), 'utf8');
await pool.end();
console.log(`WROTE ${outFile} (${items.length} rows)`);
