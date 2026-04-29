# new-core frontend

Frontend shell rebuilt for Big Bang migration.

## Run

1. 在仓库根目录执行 `pnpm install`（勿使用 npm）。
2. Ensure backend runs on `http://localhost:4100` or set `NEXT_PUBLIC_NEW_CORE_API_BASE`.
3. 在本目录执行 `pnpm run dev`，或在根目录执行 `pnpm dev:frontend`。

## Notes

- This shell intentionally keeps only baseline structure and API binding.
- Existing style system can be migrated incrementally as reusable UI primitives.

## 教学维度（控制台「学科 / 年级」）

- **主库表（真源）**：`database/migrations/0024_v2_full_schema_init.sql` 中的 `data_school_level`、`data_school_grade`、`data_school_subject`、`data_school_grade_subject`。
- **BFF**：在目标库配置根目录 **`DATABASE_URL`** 后，Next Route Handler 为 **`/api/edu/*`**（见 `src/app/api/edu/`）。
- **前端类型**：聚合快照为 **`SchoolDimensionSnapshot`**（`src/app/(dashboard)/console/resources/subject-grades/page.types.ts`），字段名与库列 camelCase 对齐，例如 `levels`（`levelId` / `levelName`）、`levelSubjects`（`linkKey`、`lineActive`）、`levelGrades`、`gradeSubjectMatrix`（`seqId`、`lineActive`）。请求体优先使用 **`levelId`**；部分路由仍兼容 **`stageId`** 别名。
- **契约清单**：`src/lib/edu-dimension-v2-api.ts`（`EDU_DIMENSION_V2_ROUTE_REGISTRY`）；页面与实验页调用：`src/app/(dashboard)/console/resources/subject-grades/page.api.ts`（含 `normalizeSchoolDimensionSnapshot`）。
- **可选环境变量**：根目录 `.env.example` 中 **`NEXT_PUBLIC_EDU_DIMENSION_API_ORIGIN`**（跨域指向 BFF 时设置；本地同源可留空）。

## Media (MinIO) local / dev server

This repo includes Next.js API routes for **presigned upload/download** (S3 compatible). Configure these env vars (suggested in root `.env.example`):

- `MINIO_ENDPOINT`: S3 API endpoint, e.g. `http://localhost:9000` or `http://<dev-server-ip>:9000`
- `MINIO_BUCKET`: e.g. `bs-media`
- `MEDIA_APP_ACCESS_KEY`: access key for an app user (NOT root)
- `MEDIA_APP_SECRET_KEY`: secret key for that app user

API routes:

- `POST /api/media/presign-upload` → returns `{ url, method: "PUT", headers, objectKey }`
- `POST /api/media/presign-download` → returns `{ url }` for a short-lived GET
