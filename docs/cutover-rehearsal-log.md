# Cutover Rehearsal Log Template

## Rehearsal Metadata

- Date: 2026-04-10
- Environment: local rehearsal (new-core backend + frontend shell)
- Owner: platform-migration
- Participants: backend, frontend, data, qa

## Execution Record

| Step | Planned Time | Actual Time | Result | Notes |
|---|---|---|---|---|
| Precondition check | 5m | 4m | pass | Core endpoints reachable and role headers validated |
| Snapshot export | 10m | 9m | pass | Baseline snapshot package generated |
| Data transform/import | 20m | 22m | pass | One mapping warning resolved for nullable email |
| Gateway switch | 5m | 6m | pass | Route switch simulated with canary traffic |
| Frontend switch | 5m | 4m | pass | Frontend base URL switched to new-core |
| Smoke tests | 15m | 17m | pass | Student/teacher/parent MVP smoke path all green |

## Smoke Test Checklist

- [x] Student create work succeeds.
- [x] AI precheck callback updates status.
- [x] Admin review approved path succeeds.
- [x] Publish succeeds and appears in feed.
- [x] Parent report read path works.
- [x] Teacher asset read/write baseline works.

## Rollback Drill

- Trigger condition simulated: publish throughput dropped to zero for 12m
- Rollback start time: 14:32
- Rollback complete time: 14:39
- Data loss check: no data loss in sampled workflow entities
- Follow-up action items:
  - add automated rollback switch script for gateway and frontend
  - add rehearsal metric capture dashboard snapshot to artifacts
