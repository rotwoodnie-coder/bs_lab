import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
let mysql;
try {
  mysql = await import('mysql2/promise');
} catch {
  mysql = require(path.resolve(process.cwd(), 'backend/node_modules/mysql2/promise.js'));
}

async function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const raw = await fs.readFile(envPath, 'utf8').catch(() => '');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex <= 0) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key] || process.env[key].trim() === '') {
      process.env[key] = value;
    }
  }
}

function resolvePoolConfig() {
  const envFailures = [];
  const raw = process.env.DATABASE_URL?.trim();
  if (raw && raw.startsWith('mysql://')) {
    const normalized = raw.replace(/^mysql:\/\//i, 'http://');
    const u = new URL(normalized);
    return {
      host: u.hostname,
      port: u.port ? Number(u.port) : 3306,
      user: decodeURIComponent(u.username || ''),
      password: decodeURIComponent(u.password || ''),
      database: u.pathname.replace(/^\//, '').split('/')[0]?.split('?')[0] || '',
      envFailures,
    };
  }
  envFailures.push('DATABASE_URL missing or invalid');

  const host = process.env.DB_HOST?.trim();
  const user = process.env.DB_USER?.trim();
  const password = (process.env.DB_PASS?.trim() || process.env.DB_PASSWORD?.trim() || '');
  const database = process.env.DB_NAME?.trim();
  if (host && user && password && database) {
    return {
      host,
      port: Number(process.env.DB_PORT ?? 3306),
      user,
      password,
      database,
      envFailures,
    };
  }

  if (!host) envFailures.push('DB_HOST missing');
  if (!user) envFailures.push('DB_USER missing');
  if (!password) envFailures.push('DB_PASS/DB_PASSWORD missing');
  if (!database) envFailures.push('DB_NAME missing');

  return { envFailures };
}

function sqlDatetime(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
}

function extractErrorType(row) {
  return String(row.error_type ?? row.log_type ?? row.build_error_tag ?? row.issue_class ?? '').trim();
}

function classifyRootCause(errorType) {
  const t = errorType.toUpperCase();
  if (t.includes('BUILD_') || t.includes('NEXT_BUILD') || t.includes('TURBOPACK') || t.includes('TYPECHECK') || t.includes('IMPORT_EXPORT') || t.includes('MODULE_RESOLUTION') || t.includes('HOOK_RULES')) return 'Build';
  if (t.includes('CORS') || t.includes('ACCESS_CONTROL_ALLOW_ORIGIN') || t.includes('FAILED_TO_FETCH') || t.includes('NET::ERR_FAILED') || t.includes('NETWORK')) return 'Env';
  if (t.includes('401_RETRY_FAIL')) return 'Env';
  if (t.includes('BLOCKED')) return 'Logic';
  return 'Logic';
}

const FIX_SUGGESTIONS = [
  {
    match: (t) => t.includes('HOOK_RULES') || t.includes('INVALID HOOK') || t.includes('RENDERED FEWER HOOKS'),
    hint: '@file:frontend/src/** 检查 early return / hooks 顺序；确保所有 hooks 先于条件分支执行。',
    action: '检查 early return / hooks 顺序',
  },
  {
    match: (t) => t.includes('IMPORT_EXPORT') || t.includes('DOES NOT PROVIDE AN EXPORT') || t.includes('IS NOT EXPORTED'),
    hint: '@file:frontend/src/** 检查导入路径与导出名；优先核对默认导出/具名导出是否匹配。',
    action: '检查导入路径',
  },
  {
    match: (t) => t.includes('CORS') || t.includes('ACCESS_CONTROL_ALLOW_ORIGIN') || t.includes('FAILED_TO_FETCH') || t.includes('NET::ERR_FAILED'),
    hint: '@file:backend/src/http/server.ts 检查 allow-origin / allowed-origins 配置；开发环境需回显请求 Origin。',
    action: '检查 allow-origin',
  },
  {
    match: (t) => t.includes('MODULE_RESOLUTION') || t.includes('MODULE NOT FOUND') || t.includes("CAN'T RESOLVE") || t.includes('CANNOT FIND MODULE'),
    hint: '@file:frontend/tsconfig.json 与 @file:frontend/src/** 检查依赖安装、路径别名与相对路径。',
    action: '检查依赖或路径别名',
  },
  {
    match: (t) => t.includes('TYPECHECK') || t.includes('TYPE ERROR') || t.includes('TS'),
    hint: '@file:frontend/src/** 检查类型签名、返回值与空值分支；优先修复编译器指向的文件。',
    action: '检查类型签名',
  },
  {
    match: (t) => t.includes('BUILD_') || t.includes('NEXT_BUILD') || t.includes('TURBOPACK') || t.includes('BUILD ERROR') || t.includes('SYNTAX_ERROR'),
    hint: '@file:frontend/scripts/build-with-feedback.mjs 检查构建失败分类与反馈上报；必要时回溯具体文件。',
    action: '检查构建脚本与最近变更',
  },
  {
    match: (t) => t.includes('401_RETRY_FAIL'),
    hint: '@file:frontend/src/lib/v2/apiService.ts 检查 refreshSessionOnce 的重试计数器与失败上报。',
    action: '检查刷新重试链路',
  },
  {
    match: (t) => t.includes('SYS_ORG_DELETE_BLOCKED'),
    hint: '@file:backend/src/infrastructure/repositories/v2-sys-org-repository.ts 检查删除事务顶层的阻断上报是否只触发一次。',
    action: '检查删除事务阻断',
  },
  {
    match: (t) => t.includes('AUTH_VIOLATION'),
    hint: '@file:backend/src/services/TeacherClassService.ts 检查归属权校验前是否已插入 reportIssue。',
    action: '检查权限校验上报',
  },
];

function getFixSuggestion(errorType) {
  const t = String(errorType ?? '').toUpperCase();
  return FIX_SUGGESTIONS.find((x) => x.match(t)) ?? {
    hint: '@file:CURRENT_SYSTEM_STATE.md 继续对照架构边界与当前故障画像。',
    action: '继续对照系统状态与错误画像',
  };
}

function buildRepairTask(errorType, issue) {
  const suggestion = getFixSuggestion(errorType);
  return {
    type: errorType,
    action: suggestion.action,
    hint: suggestion.hint,
    summary: `针对 ${errorType} 的自动修复任务`,
    steps: [
      '读取错误堆栈与当前源码位置',
      `按建议动作执行：${suggestion.action}`,
      `定位建议文件：${suggestion.hint}`,
      '完成最小修复并重新运行相关验证',
    ],
    issueType: issue?.type ?? null,
    fingerprint: issue?.fingerprint ?? null,
  };
}

function findCodebaseHint(errorType) {
  return getFixSuggestion(errorType).hint;
}

function inferFileLine(errorType) {
  const t = errorType.toUpperCase();
  if (t.includes('HOOK_RULES')) return 'frontend/src/**';
  if (t.includes('BUILD_') || t.includes('NEXT_BUILD') || t.includes('TURBOPACK') || t.includes('TYPECHECK') || t.includes('IMPORT_EXPORT')) return 'frontend/scripts/build-with-feedback.mjs';
  if (t.includes('CORS') || t.includes('ACCESS_CONTROL_ALLOW_ORIGIN') || t.includes('FAILED_TO_FETCH') || t.includes('NET::ERR_FAILED')) return 'frontend/src/components/common/GlobalErrorSentinel.tsx';
  if (t.includes('MODULE_RESOLUTION')) return 'frontend/tsconfig.json';
  if (t.includes('401_RETRY_FAIL')) return 'frontend/src/lib/v2/apiService.ts';
  if (t.includes('SYS_ORG_DELETE_BLOCKED')) return 'backend/src/infrastructure/repositories/v2-sys-org-repository.ts';
  if (t.includes('AUTH_VIOLATION')) return 'backend/src/services/TeacherClassService.ts';
  return 'unknown';
}

function buildAgentInstruction(errorType) {
  const suggestion = getFixSuggestion(errorType);
  if (suggestion.action !== '继续对照系统状态与错误画像') {
    return `${suggestion.action}，并按代码提示文件定位最小修复点。`;
  }
  if (errorType.includes('401_RETRY_FAIL')) {
    return '检查 `frontend/src/lib/v2/apiService.ts` 的 refresh/retry 分支，补齐静默刷新失败后的自动上报与防抖。';
  }
  if (errorType.includes('SYS_ORG_DELETE_BLOCKED')) {
    return '检查 `backend/src/infrastructure/repositories/v2-sys-org-repository.ts` 删除事务，确认阻断前是否已执行 `SystemLogService.reportIssue()`。';
  }
  if (errorType.includes('AUTH_VIOLATION')) {
    return '检查 `backend/src/services/TeacherClassService.ts` 归属权校验与告警上报，确认无权绑定是否已被后端阻断。';
  }
  return '结合 `CURRENT_SYSTEM_STATE.md` 对应架构模块，继续向下追溯代码与环境配置。';
}

function buildIssueTitleLine(item, fingerprint) {
  return `### 故障 [${item.type}] \`#${fingerprint}\``;
}

async function upsertDashboard(reportTime, highCount, mediumCount, triagedCount, recentFingerprints = []) {
  const stateFile = path.resolve(process.cwd(), 'CURRENT_SYSTEM_STATE.md');
  let content = await fs.readFile(stateFile, 'utf8').catch(() => '# CURRENT_SYSTEM_STATE\n');
  const dashboard = [
    '<!-- AUTO_HEAL_DASHBOARD_START -->',
    '> [!CAUTION] **数字医生巡检看板**',
    `> - **最新报告**: [[AUTO_HEAL_AUDIT.md]] (生成时间: ${reportTime})`,
    `> - **系统体征**: 发现 [${highCount}] 个高频阻断，[${mediumCount}] 个待自愈项。`,
    `> - **治理视图**: 待处理人工反馈: [${mediumCount}]，已关联自愈项: [${triagedCount}] 条。`,
    `> - **治理看板**:`,
    `>   - [💜] 已分诊反馈: ${triagedCount} 条 (${recentFingerprints.join(', ') || '无'})`,
    `>   - [🔍] 活跃指纹: ${recentFingerprints.length > 0 ? recentFingerprints.join('; ') : '[无活跃指纹]'}`, 
    '> - **即时指令**: 运行 `npm run heal:doctor` 获取修复建议。',
    '<!-- AUTO_HEAL_DASHBOARD_END -->',
  ].join('\n');

  if (content.includes('<!-- AUTO_HEAL_DASHBOARD_START -->') && content.includes('<!-- AUTO_HEAL_DASHBOARD_END -->')) {
    content = content.replace(/<!-- AUTO_HEAL_DASHBOARD_START -->[\s\S]*?<!-- AUTO_HEAL_DASHBOARD_END -->/m, dashboard);
  } else {
    const idx = content.indexOf('# CURRENT_SYSTEM_STATE');
    if (idx >= 0) {
      const nl = content.indexOf('\n', idx);
      const insertAt = nl >= 0 ? nl + 1 : content.length;
      content = `${content.slice(0, insertAt)}\n${dashboard}\n${content.slice(insertAt)}`;
    } else {
      content = `# CURRENT_SYSTEM_STATE\n\n${dashboard}\n\n${content}`;
    }
  }

  await fs.writeFile(stateFile, content, 'utf8');
}

async function main() {
  await loadEnvLocal();
  const outFile = path.resolve(process.cwd(), 'AUTO_HEAL_AUDIT.md');
  const poolCfg = resolvePoolConfig();
  const reportTime = new Date().toISOString().slice(0, 16).replace('T', ' ');

  if (!poolCfg.host) {
    const failMd = `# AUTO_HEAL_AUDIT\n\n## 环境检查失败清单\n\n- 数据库未连接：缺少可用连接信息。\n- 需要至少提供：\`DATABASE_URL\` 或 \`DB_HOST + DB_USER + DB_PASS/DB_PASSWORD + DB_NAME\`。\n- 当前运行目录：\`${process.cwd()}\`\n`;
    await fs.writeFile(outFile, failMd, 'utf8');
    console.log('❌ 环境检查失败，已生成 AUTO_HEAL_AUDIT.md（仅包含失败清单）');
    console.log(`- ${poolCfg.envFailures.join('\n- ')}`);
    return;
  }

  const pool = mysql.createPool({
    host: poolCfg.host,
    port: poolCfg.port,
    user: poolCfg.user,
    password: poolCfg.password,
    database: poolCfg.database,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_SIZE ?? 4),
    queueLimit: 0,
    charset: 'utf8mb4',
  });

  const since = sqlDatetime(new Date(Date.now() - 24 * 60 * 60 * 1000));
  let rows = [];
  try {
    const result = await pool.query(
      `SELECT
         log_id,
         user_id,
         log_type AS errorType,
         log_time,
         log_data_type,
         log_data_id
       FROM sys_log
       WHERE log_time >= ?
         AND UPPER(IFNULL(log_type, '')) LIKE '%BLOCKED%'
       ORDER BY log_time DESC`,
      [since],
    );
    rows = Array.isArray(result?.[0]) ? result[0] : [];
  } catch (err) {
    const failMd = `# AUTO_HEAL_AUDIT\n\n## 环境检查失败清单\n\n- 数据库连接成功，但查询失败。\n- 原因：${err instanceof Error ? err.message : String(err)}\n- 需要检查：\`sys_log\` 表结构、账号权限，或目标字段是否不存在。\n`;
    await fs.writeFile(outFile, failMd, 'utf8');
    console.log('❌ 环境检查失败，已生成 AUTO_HEAL_AUDIT.md（仅包含失败清单）');
    console.log(`- ${err instanceof Error ? err.message : String(err)}`);
    await pool.end();
    return;
  }

  const items = Array.isArray(rows) ? rows : [];
  const freq = new Map();
  const grouped = new Map();

  for (const row of items) {
    const type = extractErrorType(row);
    const key = type || 'UNKNOWN';
    freq.set(key, (freq.get(key) ?? 0) + 1);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }

  const top = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([type, count]) => ({ type, count, rows: grouped.get(type) ?? [] }));

  const feedbackQuery = `SELECT feedback_id, type, title, content, reporter, env, status, issue_fingerprint, create_time
    FROM sys_feedback
    WHERE is_deleted = 0
      AND type = 'BUG'
    ORDER BY create_time DESC
    LIMIT 80`;
  let feedbackRows = [];
  try {
    const result = await pool.query(feedbackQuery);
    feedbackRows = Array.isArray(result?.[0]) ? result[0] : [];
  } catch {
    feedbackRows = [];
  }

  const generateFingerprint = (input) => {
    const raw = [input.title ?? '', input.content ?? '', input.url ?? '', input.ua ?? '', input.role ?? '', input.errorStack ?? ''].join('|');
    let h1 = 0x811c9dc5;
    for (let i = 0; i < raw.length; i += 1) {
      h1 ^= raw.charCodeAt(i);
      h1 = Math.imul(h1, 0x01000193);
    }
    return (`0000000${(h1 >>> 0).toString(16)}`).slice(-8);
  };

  const feedbacks = feedbackRows.map((row) => {
    let reporter = null;
    let env = null;
    try { reporter = typeof row.reporter === 'string' ? JSON.parse(row.reporter) : row.reporter; } catch {}
    try { env = typeof row.env === 'string' ? JSON.parse(row.env) : row.env; } catch {}
    const issueFingerprint = row.issue_fingerprint ? String(row.issue_fingerprint) : generateFingerprint({
      title: String(row.title ?? ''),
      content: String(row.content ?? ''),
      url: env?.url ?? '',
      ua: env?.ua ?? '',
      role: reporter?.role ?? '',
      errorStack: env?.errorStack ?? '',
    });
    return { ...row, reporter, env, issueFingerprint };
  });

  const correlated = [];

  for (const fb of feedbacks) {
    const env = fb.env ?? {};
    const title = String(fb.title ?? '').toUpperCase();
    const content = String(fb.content ?? '').toUpperCase();
    const errorStack = String(env.errorStack ?? env.error_stack_brief ?? '').toUpperCase();
    const isBuildLike = title.includes('BUILD') || content.includes('BUILD') || errorStack.includes('BUILD') || errorStack.includes('TURBOPACK') || errorStack.includes('NEXT') || errorStack.includes('IMPORT') || errorStack.includes('EXPORT') || errorStack.includes('TYPEERROR') || errorStack.includes('SYNTAXERROR');
    if (!isBuildLike) continue;
    const matched = top.find((item) => String(fb.issueFingerprint ?? '').trim() && String(fb.issueFingerprint ?? '').trim() === generateFingerprint({
      title: item.type,
      content: `${item.rows.map((r) => String(r.log_data_type ?? '')).join(' ')} ${item.rows.map((r) => String(r.log_data_id ?? '')).join(' ')}`,
      url: '',
      ua: '',
      role: '',
      errorStack: `${item.rows.map((r) => String(r.log_data_type ?? '')).join(' ')} ${item.rows.map((r) => String(r.log_data_id ?? '')).join(' ')}`,
    }));
    if (matched) correlated.push({ feedback: fb, issue: matched });
  }

  let md = `# AUTO_HEAL_AUDIT\n\n`;
  md += `> 生成时间：${new Date().toISOString()}\n`;
  md += `> 数据来源：sys_log（最近 24 小时）\n`;
  md += `> 规则：仅基于真实日志，不凭空猜测。\n\n`;

  md += `## 一、故障画像 Top 10\n\n`;
  if (top.length === 0) {
    md += `> 暂无命中 \`BLOCKED\` / \`401_RETRY_FAIL\` 的记录。\n\n`;
  } else {
    top.forEach((item, idx) => {
      const rootCause = classifyRootCause(item.type);
      const fileLine = inferFileLine(item.type);
      const users = [...new Set(item.rows.map((r) => String(r.user_id ?? '').trim()).filter(Boolean))].slice(0, 8);
      const severityTag = item.count >= 5 ? '[🔥 紧急]' : item.count >= 2 ? '[⚠️ 预警]' : '[ℹ️ 提示]';
      const fingerprint = String(item.rows[0]?.log_id ?? item.type ?? idx).slice(0, 8);
      md += `${buildIssueTitleLine(item, fingerprint)} ${severityTag} @Codebase ${findCodebaseHint(item.type)}\n`;
      md += `- **报错频率**：${item.count}\n`;
      md += `- **受影响用户 ID**：${users.length > 0 ? users.join(', ') : '未知'}\n`;
      md += `- **故障文件/行号**：${fileLine}\n`;
      md += `- **根因推测**：${rootCause === 'Env' ? '环境配置（Env）' : '业务逻辑（Logic）'}\n`;
      md += `- **依据**：${rootCause === 'Env' ? '更符合环境变量 / 域名 / Session / CORS / DB 配置异常特征。' : '更符合业务阻断、权限校验或事务一致性保护。'}\n`;
      md += `- **建议修复动作**：${getFixSuggestion(item.type).action}\n`;
      md += `- **建议修复位置**：${findCodebaseHint(item.type)}\n`;
      md += `- **自动修复任务**：\`${JSON.stringify(buildRepairTask(item.type, { type: item.type, fingerprint }))}\`\n`;
      md += `- **修复约束**：严禁破坏相关事务锁与安全边界；修复后必须同步更新本报告状态，并在完成后将关联反馈单状态改为 FIXED。\n\n`;
    });
  }

  md += `## 👤 人工反馈与系统告警关联区\n\n`;
  if (correlated.length === 0) {
    md += `> 暂未发现可稳定关联的构建/运行时反馈与系统告警。\n\n`;
  } else {
    correlated.slice(0, 20).forEach(({ feedback, issue }) => {
      md += `- **feedbackId**: ${feedback.feedbackId} → **关联告警**: ${issue.type}\n`;
    });
    md += `\n`;
  }

  md += `## 二、前三个高频故障的 Cursor Agent 修复指令\n\n`;
  top.slice(0, 3).forEach((item, idx) => {
    md += `### 指令 ${idx + 1}\n`;
    md += `- 目标错误：${item.type}\n`;
    md += `- 建议操作：${buildAgentInstruction(item.type)}\n`;
    md += `- 修改后必须：运行 lint / test，并确认不会破坏 \`CURRENT_SYSTEM_STATE.md\` 中已确认的安全边界。\n`;
    md += `- 闭环提醒：修复完成后，请手动或运行脚本将关联的反馈单状态改为 FIXED。\n\n`;
  });

  md += `## 三、自动修复协议说明\n\n`;
  md += `- 轮次 1：先在 dev 分支尝试应用补丁。\n`;
  md += `- 轮次 2：执行现有 lint 与测试。\n`;
  md += `- 轮次 3：若校验通过，再更新 \`CURRENT_SYSTEM_STATE.md\` 为“已自动巡检修复”。\n`;
  md += `- 约束：必须先读取真实 sys_log，再决定是否修复。\n`;

  await fs.writeFile(outFile, md, 'utf8');
  const backwriteTasks = correlated.map(({ feedback }) => {
    const adminNote = `[AI 分诊] 关联审计报告 ID: ${feedback.issueFingerprint}`;
    return Promise.resolve().then(async () => {
      try {
        const feedbackRepoPath = path.resolve(process.cwd(), 'backend/src/infrastructure/repositories/v2-sys-feedback-repository.ts');
        const repo = await import(pathToFileURL(feedbackRepoPath).href);
        if (feedback.status === 'TODO' || feedback.status === 'NEW') {
          console.log('[auto-heal] 拟回写列表', feedback.feedbackId, feedback.issueFingerprint);
          await repo.markAsAutoTriaged(feedback.feedbackId, outFile, feedback.issueFingerprint);
        }
        return { feedbackId: feedback.feedbackId, ok: true, adminNote };
      } catch (err) {
        console.error('提示：数据库回写失败，请检查 backend 路径配置，但审计报告已保留。', err instanceof Error ? err.message : String(err));
        return { feedbackId: feedback.feedbackId, ok: false, adminNote };
      }
    });
  });
  const backwriteResults = await Promise.allSettled(backwriteTasks);
  const recentFeedbackIds = correlated.slice(0, 3).map(({ feedback }) => feedback.feedbackId);
  const recentFingerprints = correlated.slice(0, 3).map(({ feedback }) => feedback.issueFingerprint).filter(Boolean);
  console.log(`✅ 看板已更新，已自动关联反馈：${recentFeedbackIds.join(', ')}`);
  await upsertDashboard(reportTime, top.length, Math.max(0, top.length - 3), correlated.length, recentFingerprints);
  await pool.end();
  console.log(`AUTO_HEAL_AUDIT generated: ${outFile}`);
  console.log('✅ 审计报告已更新。，请直接输入：根据最新的 AUTO_HEAL_AUDIT.md 修复高频故障 来启动自愈。');
}

await main();
