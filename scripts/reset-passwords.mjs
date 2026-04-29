/**
 * 存量用户密码重置脚本
 *
 * 背景：审计修复后将密码哈希从 SHA-256（无盐）升级为 bcrypt，
 * 存量用户的 login_pwd 仍是 SHA-256 哈希，与新代码不兼容。
 *
 * 本脚本将：
 *   - admin 用户密码设为 admin@123
 *   - 其余所有未删除用户密码设为 123456
 *
 * 用法：
 *   1. 确保后端停服（避免写入冲突）
 *   2. 修改下方 DB_CONFIG 或设置环境变量
 *   3. npx tsx scripts/reset-passwords.mjs
 *      或：node scripts/reset-passwords.mjs
 *
 * 安全提醒：运行后请立即删除此脚本或限制文件权限。
 */

import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

// ── 数据库连接配置（优先读取环境变量，与 mysql-client.ts 对齐）──
function resolveConfig() {
  const raw = process.env.DATABASE_URL?.trim();
  if (raw && raw.startsWith("mysql://")) {
    const normalized = raw.replace(/^mysql:\/\//i, "http://");
    const u = new URL(normalized);
    return {
      host: u.hostname,
      port: u.port ? Number(u.port) : 3306,
      user: decodeURIComponent(u.username || ""),
      password: decodeURIComponent(u.password || ""),
      database: u.pathname.replace(/^\//, "").split("/")[0]?.split("?")[0] ?? "",
    };
  }
  return {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "bs_lab",
  };
}

async function main() {
  const cfg = resolveConfig();
  console.log(`[reset-passwords] 连接数据库: ${cfg.host}:${cfg.port}/${cfg.database}`);

  const conn = await mysql.createConnection(cfg);

  try {
    // 1. 计算目标哈希
    const adminPwd = bcrypt.hashSync("admin@123", 10);
    const normalPwd = bcrypt.hashSync("123456", 10);

    console.log("[reset-passwords] admin 密码 → admin@123");
    console.log("[reset-passwords] 其他用户密码 → 123456");

    // 2. 更新 admin 用户
    const [adminResult] = await conn.execute(
      `UPDATE sys_user SET login_pwd = ? WHERE login_name = 'admin' AND is_deleted = 0`,
      [adminPwd],
    );
    console.log(`[reset-passwords] admin 用户受影响行数: ${adminResult.affectedRows}`);

    // 3. 更新其他用户
    const [normalResult] = await conn.execute(
      `UPDATE sys_user SET login_pwd = ? WHERE login_name != 'admin' AND is_deleted = 0`,
      [normalPwd],
    );
    console.log(`[reset-passwords] 其他用户受影响行数: ${normalResult.affectedRows}`);

    // 4. 验证：列出所有用户（不输出密码本身）
    const [rows] = await conn.execute(
      `SELECT user_id, user_name, login_name, LENGTH(login_pwd) AS pwd_len FROM sys_user WHERE is_deleted = 0 ORDER BY login_name`,
    );
    console.log("\n[reset-passwords] 当前用户列表：");
    console.table(rows);

    console.log("\n[reset-passwords] 密码重置完成！");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[reset-passwords] 失败:", err);
  process.exit(1);
});
