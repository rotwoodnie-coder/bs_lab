# new-core backend

MVP backend skeleton for Big Bang migration.

## Run

1. 在仓库根目录执行 `pnpm install`（勿使用 npm）。
2. 在本目录执行 `pnpm run dev`，或在根目录执行 `pnpm dev:backend`。

## Implemented core flow

- `POST /v1/works`
- `POST /v1/works/:workId/ai-precheck`
- `POST /v1/works/:workId/review`
- `POST /v1/works/:workId/publish`
- `GET /v1/feed`
- `POST /v1/teacher-assets`
- `GET /v1/teacher-assets`
- `POST /v1/parent-sessions`
- `POST /v1/parent-reports`
- `GET /v1/parent-reports`

## Quality baseline

- request trace id is emitted as `x-trace-id` and boot logs include method/status/latency.
- `pnpm test` runs workflow contract and permission regression tests.

Permission is resolved from headers:

- `x-role`
- `x-user-id`
