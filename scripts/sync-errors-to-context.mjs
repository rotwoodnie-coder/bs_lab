import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let mysql;
try {
  mysql = await import('mysql2/promise');
} catch {
  const backendMysqlPath = path.resolve(process.cwd(), 'backend/node_modules/mysql2/promise.js');
  try {
    mysql = await import(backendMysqlPath);
  } catch {
    mysql = require(path.resolve(process.cwd(), 'backend/node_modules/mysql2/promise.js'));
  }
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) throw new Error(`MISSING_ENV:${name}`);
  return String(value).trim();
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

function normalizeStack(value) {
  return String(value ?? '').trim();
}

function classifyIssue(row) {
  const t = String(row.log_type ?? '').toUpperCase();
  if (t.includes('BLOCKED')) return '权限越权问题';
  if (t.includes('VIOLATION')) return '权限越权问题';
  return '逻辑 Bug';
}

function classifyEvidence(category) {
  switch (category) {
    case '权限越权问题':
      return '对照 `CURRENT_SYSTEM_STATE.md` 中“授权链路”“数据锁定与一致性机制”，该告警说明后端安全边界已拦截异常操作。';
    case '环境配置问题':
      return '对照 `CURRENT_SYSTEM_STATE.md` 中“认证链路”“静态资源路径”与 `backend/src/http/server.ts`，该告警更像部署参数或运行时配置缺失。';
    default:
      return '对照 `CURRENT_SYSTEM_STATE.md` 中“数据锁定与一致性机制”“认证链路”，该告警表现为业务状态或事务一致性异常。';
  }
}

async function main() {
  const outFile = path.resolve(process.cwd(), 'SELF_HEALING_LOG.md');
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

  const since = new Date(Date.now() - 60 * 60 * 1000);
  const sinceSql = toSqlDateTime(since);

  const [rows] = await pool.query(
    `SELECT log_id, user_id, log_type, log_time, log_data_type, log_data_id, log_data_content
     FROM sys_log
     WHERE log_time >= ?
       AND (
         UPPER(IFNULL(log_type, '')) LIKE '%BLOCKED%'
         OR UPPER(IFNULL(log_type, '')) LIKE '%VIOLATION%'
       )
     ORDER BY log_time DESC`,
    [sinceSql],
  );

  const items = Array.isArray(rows) ? rows : [];
  const existing = await fs.readFile(outFile, 'utf8').catch(() => '# SELF_HEALING_LOG\n\n> 目的：记录由 `SystemLogService` 产生的告警（特征码：`[SENTINEL_ISSUE]`），并基于 `CURRENT_SYSTEM_STATE.md` 进行归因分析。\n\n---\n\n## 当前记录\n\n> 暂无记录。\n');

  const seen = new Set();
  for (const row of items) {
    const key = `${row.log_id}|${row.log_time}`;
    if (existing.includes(`### ${row.log_time}`) && existing.includes(String(row.log_id))) continue;
    if (seen.has(key)) continue;
    seen.add(key);

    const category = classifyIssue(row);
    const stack = normalizeStack(row.log_data_content);
    const title = `[SENTINEL_ISSUE] ${String(row.log_type ?? 'UNKNOWN').slice(0, 80)}`;

    const block = `
### ${row.log_time instanceof Date ? row.log_time.toISOString() : String(row.log_time ?? '')} ${title}

- **来源**：` + "sys_log" + `
- **特征码**：` + "[SENTINEL_ISSUE]" + `
- **错误堆栈**：
  ```text
  ${stack || String(row.log_type ?? '')}
  ```
- **上下文**：
  - 当前页面 / API / 操作：` + String(row.log_data_type ?? '') + `
  - 当前用户角色：` + String(row.user_id ?? '') + `
  - 目标对象：` + String(row.log_data_id ?? '') + `
  - 触发条件：` + String(row.log_type ?? '') + `
- **归因分析**：
  - 分类：${category}
  - 依据：${classifyEvidence(category)}
  - 结论：该告警已被系统哨兵捕获，建议按上述分类继续追溯。
- **处理建议**：
  - 是否阻断上线：是
  - 是否需要回滚：视具体堆栈而定
  - 建议修复路径：优先检查 `CURRENT_SYSTEM_STATE.md` 中对应的安全边界与运行配置。
`;

    if (existing.includes('> 暂无记录.')) {
      // 兼容旧文档：先替换占位段
    }
    if (!existing.includes('## 当前记录')) continue;
    if (!existing.includes('> 暂无记录。')) {
      // no-op
    }
    existing = existing.replace('\n> 暂无记录。\n', `\n${block}\n`);
  }

  let updated = existing;
  if (updated.includes('> 暂无记录。') && items.length === 0) {
    updated = existing;
  } else if (items.length > 0 && updated.includes('> 暂无记录。')) {
    // already replaced above if possible
  }

  await fs.writeFile(outFile, updated, 'utf8');
  await pool.end();
  console.log(`SYNCED ${items.length} rows -> ${outFile}`);
}

await main();
