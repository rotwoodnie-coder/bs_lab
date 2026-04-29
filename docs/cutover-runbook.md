# Big Bang Cutover Runbook

## 1. Preconditions

- Freeze old system write operations or switch to controlled low-write window.
- Confirm new-core schema migrated and seed baseline loaded.
- Confirm core APIs healthy:
  - `POST /v1/works`
  - `POST /v1/works/:id/ai-precheck`
  - `POST /v1/works/:id/review`
  - `POST /v1/works/:id/publish`
  - `GET /v1/feed`
- Confirm frontend shell points to new backend base URL.

## 2. Data Snapshot and Validation

1. Take final snapshot from old production.
2. Run transform scripts to new-core import format.
3. Import into new-core database.
4. Validate:
   - row count checks for users, experiments, works
   - state distribution checks for works status
   - random sample consistency checks for work-review relation

## 3. Cutover Steps

1. Enable maintenance banner for old system.
2. Drain in-flight async jobs (upload and review queues).
3. Switch gateway routes to new-core backend.
4. Switch frontend entry to new-core shell.
5. Monitor first 30 minutes with high-frequency checks:
   - error rate
   - p95 latency
   - publish throughput

## 4. Rollback Criteria

Rollback immediately if one of these conditions persists for 10 minutes:

- Core write endpoint error rate > 5%.
- Publish workflow blocked (no successful publish).
- Data integrity check fails on primary key workflows.

## 5. Rollback Procedure

1. Route traffic back to old backend.
2. Restore old frontend entry.
3. Disable new-core writes.
4. Export failure window logs and diffs for incident review.

## 6. Post-Cutover Checklist

- Verify student, teacher, parent MVP acceptance scripts.
- Verify permission checks by role-based smoke tests.
- Open incident-free confirmation window for 24 hours.
- Schedule deferred non-MVP capabilities into phase 2.
