/**
 * 使用大模型（通义兼容接口：项目根 `.env.local` 中 `AI_CHAT_*`）对 **初中段** 已入库的
 * `edu_standard_experiments` 按名称推断学科（物理 / 化学 / 生物 / 科学综合）。
 *
 * 仅处理：`STAGE_JUNIOR` 且当前学科为 `SUB_SCIENCE` 的记录。
 *
 * 用法：
 *   node --env-file ../.env.local --experimental-strip-types backend/scripts/classify-junior-science-subjects.mjs
 */
const TENANT_ID = process.env.SEED_TENANT_ID?.trim() || "district-001";
const APP_ID = process.env.SEED_APP_ID?.trim() || "console";

const SUBJECT_MAP = {
  SUB_PHYSICS: "物理",
  SUB_CHEMISTRY: "化学",
  SUB_BIOLOGY: "生物",
  SUB_SCIENCE: "科学",
};

const CHUNK = 40;

function heuristicSubjectCode(name) {
  const s = name.trim();
  const chemistry =
    /氧|二氧化碳|氯化钠|溶液|溶质|酸碱|pH|燃烧|提纯|粗盐|化学|物质分离|鉴别|电解|蒸馏/i;
  const physics =
    /电路|电流|电压|电阻|伏安|电磁|磁场|感应|透镜|成像|平面镜|针孔|杠杆|滑轮|斜面|机械效率|摩擦力|浮力|压强|密度|天平|光学|光纤|声学|声/i;
  const biology =
    /细胞|装片|显微镜|组织|器官|花|果实|种子|叶|淀粉|光合作用|呼吸|心跳|血液|血管|反射|膝跳|细菌|孢子|酶|种群|群落|植被|尾鳍/i;
  if (/(地球自转|月相|星座|地震|火山|岩石|水火箭)/i.test(s)) return "SUB_SCIENCE";
  if (chemistry.test(s)) {
    if (/密度/.test(s) && !/营养|淀粉/.test(s)) return "SUB_PHYSICS";
    return "SUB_CHEMISTRY";
  }
  if (biology.test(s)) return "SUB_BIOLOGY";
  if (physics.test(s)) return "SUB_PHYSICS";
  return "SUB_SCIENCE";
}

async function loadSubjectIds(pool) {
  const [rows] = await pool.query(`SELECT id, code FROM edu_subjects WHERE code IN (?,?,?,?)`, [
    "SUB_PHYSICS",
    "SUB_CHEMISTRY",
    "SUB_BIOLOGY",
    "SUB_SCIENCE",
  ]);
  const map = new Map();
  for (const r of rows) map.set(r.code, String(r.id));
  return map;
}

async function fetchJuniorScienceRows(pool, scienceId) {
  const [rows] = await pool.query(
    `SELECT e.id, e.display_name
     FROM edu_standard_experiments e
     JOIN edu_stages st ON st.id = e.stage_id
     WHERE e.tenant_id = ? AND e.app_id = ?
       AND e.deleted_at IS NULL
       AND st.code = 'STAGE_JUNIOR'
       AND e.subject_id = ?
     ORDER BY e.id`,
    [TENANT_ID, APP_ID, scienceId],
  );
  return rows.map((r) => ({ id: String(r.id), displayName: String(r.display_name) }));
}

async function classifyChunkWithLlm(items, apiKey, baseUrl, model) {
  const payload = items.map((x) => ({ id: x.id, name: x.displayName }));
  const body = {
    model,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `你是熟悉中国初中科学与分科（物理、化学、生物）课程的教研助手。
仅根据「实验名称」判断最主要归属学科。
输出必须是 JSON：{"items":[{"id":"...","code":"SUB_PHYSICS|SUB_CHEMISTRY|SUB_BIOLOGY|SUB_SCIENCE"}]}。
SUB_SCIENCE 表示跨学科综合或无法明确归入物化生。不要输出其它文字。`,
      },
      { role: "user", content: JSON.stringify(payload) },
    ],
  };
  const url = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`LLM_HTTP_${res.status}:${t.slice(0, 500)}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("LLM_EMPTY");
  const parsed = JSON.parse(text);
  const out = new Map();
  for (const row of parsed.items ?? []) {
    if (!row?.id || !row?.code) continue;
    out.set(String(row.id), String(row.code));
  }
  return out;
}

async function llmClassifyAll(rows, apiKey, baseUrl, model) {
  const merged = new Map();
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const part = await classifyChunkWithLlm(slice, apiKey, baseUrl, model);
    for (const [k, v] of part) merged.set(k, v);
  }
  return merged;
}

async function main() {
  const { getMysqlPool } = await import("../src/infrastructure/mysql/mysql-client.ts");
  const pool = getMysqlPool();
  const subjectIds = await loadSubjectIds(pool);
  const scienceId = subjectIds.get("SUB_SCIENCE");
  if (!scienceId) throw new Error("SUB_SCIENCE_NOT_FOUND");

  const rows = await fetchJuniorScienceRows(pool, scienceId);
  if (rows.length === 0) {
    console.log("[classify] no junior science rows to update.");
    return;
  }

  const apiKey = process.env.AI_CHAT_QWEN_API_KEY?.trim();
  const baseUrl =
    process.env.AI_CHAT_BASE_URL?.trim() || "https://dashscope.aliyuncs.com/compatible-mode/v1";
  const model = process.env.AI_CHAT_MODEL?.trim() || "qwen-turbo";

  let assigned = new Map();
  try {
    if (!apiKey) throw new Error("NO_AI_KEY");
    assigned = await llmClassifyAll(rows, apiKey, baseUrl, model);
    console.log(`[classify] LLM returned ${assigned.size} mappings for ${rows.length} rows.`);
  } catch (e) {
    console.warn("[classify] LLM failed, using heuristic:", e instanceof Error ? e.message : e);
    for (const r of rows) assigned.set(r.id, heuristicSubjectCode(r.displayName));
  }

  const [metaRows] = await pool.query(
    `SELECT e.id, e.stage_id, e.name_fingerprint
     FROM edu_standard_experiments e
     WHERE e.tenant_id = ? AND e.app_id = ? AND e.id IN (${rows.map(() => "?").join(",")})`,
    [TENANT_ID, APP_ID, ...rows.map((r) => r.id)],
  );
  const meta = new Map(metaRows.map((m) => [String(m.id), m]));

  let updated = 0;
  let skippedDup = 0;
  for (const r of rows) {
    const rawCode = assigned.get(r.id) ?? heuristicSubjectCode(r.displayName);
    const targetCode = SUBJECT_MAP[rawCode] ? rawCode : "SUB_SCIENCE";
    const newSid = subjectIds.get(targetCode);
    if (!newSid) continue;
    if (newSid === scienceId) continue;

    const m = meta.get(r.id);
    if (!m) continue;
    const [dup] = await pool.query(
      `SELECT id FROM edu_standard_experiments
       WHERE tenant_id = ? AND app_id = ? AND stage_id = ? AND subject_id = ? AND name_fingerprint = ?
         AND id <> ? AND deleted_at IS NULL
       LIMIT 1`,
      [TENANT_ID, APP_ID, m.stage_id, newSid, m.name_fingerprint, r.id],
    );
    if (dup.length) {
      console.warn(`[classify] skip id=${r.id} (unique conflict with subject ${targetCode})`);
      skippedDup += 1;
      continue;
    }

    const [res] = await pool.query(
      `UPDATE edu_standard_experiments
       SET subject_id = ?, updated_by_actor_id = 'llm-classify', updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND tenant_id = ? AND app_id = ?`,
      [newSid, r.id, TENANT_ID, APP_ID],
    );
    if (res.affectedRows) updated += 1;
  }

  console.log(
    `[classify] updated=${updated} skipped_dup=${skippedDup} (tenant=${TENANT_ID}, app=${APP_ID}).`,
  );
}

main().catch((err) => {
  console.error("[classify] failed:", err);
  process.exit(1);
});
