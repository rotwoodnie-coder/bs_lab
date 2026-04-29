# MVP Freeze (Big Bang)

## Scope

This MVP freezes only the minimum end-to-end chains required for release:

1. Student loop: idea -> method -> upload -> AI precheck -> admin review -> publish.
2. Teacher loop: learn standard assets -> generate class asset -> submit to co-build review -> reusable asset.
3. Parent loop: recommendation -> guided execution -> process capture -> report generation -> social share.

## Out of Scope

- Advanced analytics modeling and AB experiments.
- Cross-region tenancy and multi-cloud failover.
- Low-priority legacy compatibility endpoints.

## Acceptance Cases

### Student
- Student submits a work video with metadata.
- System runs AI precheck and stores structured result.
- Admin approval changes visibility to published.
- Published work appears in feed query only after approval.

### Teacher
- Teacher can query standard assets by grade and subject.
- Teacher-generated asset is versioned and submitted for review.
- Approved asset can be discovered and reused by other teachers.

### Parent
- Parent starts one guided session linked to student and experiment.
- Session records guidance, warnings, and stuck events.
- Report is generated from session and includes next recommendations.
- Parent can share report summary to community.

## Frozen Non-Functional Targets

- P95 API latency for core write endpoints < 400ms (excluding AI and storage callbacks).
- Audit fields (`created_at`, `updated_at`, `operator_id`) mandatory for core workflow tables.
- All core state transitions must be idempotent and traceable.
