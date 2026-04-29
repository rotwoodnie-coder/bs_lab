# Integration Baseline (MVP)

## Scope

This baseline freezes field-level behavior for current MVP integration across frontend and backend skeleton.

## Unified Response

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Error:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "..."
  }
}
```

## Core Workflow Example

1) Student creates work (`POST /v1/works`)
2) Admin/supervisor executes AI precheck (`POST /v1/works/:id/ai-precheck`)
3) Admin/supervisor reviews (`POST /v1/works/:id/review`)
4) Admin/supervisor publishes (`POST /v1/works/:id/publish`)
5) Teacher/parent/student reads feed (`GET /v1/feed`)

## Request Samples

- AI precheck body:
  - `overall`: `pass|review|reject`
  - `dimensions`: object
  - `suggestions`: string[]
- Review body:
  - `decision`: `approved|rejected`
  - `reviewerId`: string
  - `reason`: optional string
- Feed query:
  - `limit` default 20, max 50
  - `cursor` optional work id

## Temporary Auth Convention

Use headers until real IAM is integrated:

- `x-role`
- `x-user-id`

## Error Contract

- `VALIDATION_FAILED` for schema/query validation errors (`422`)
- `PERMISSION_DENIED` for policy violations (`403`)
- domain errors such as `WORK_NOT_FOUND`, `WORKFLOW_INVALID_TRANSITION` (`400`)
