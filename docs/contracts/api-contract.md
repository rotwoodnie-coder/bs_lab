# API Contract (Frozen v1)

## Unified Response

All endpoints return:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Error example:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "WORKFLOW_INVALID_TRANSITION",
    "message": "Cannot publish work before review approval."
  }
}
```

## Core Endpoints

### `POST /v1/works`
- Purpose: create a submitted student work.
- Body:
  - `studentUserId` (string, required)
  - `experimentId` (string, required)
  - `videoUrl` (string, required)
  - `description` (string, optional)

### `POST /v1/works/:workId/ai-precheck`
- Purpose: store AI precheck decision and dimensions.
- Body:
  - `overall` (`pass` | `review` | `reject`)
  - `dimensions` (object)
  - `suggestions` (array of string)

### `POST /v1/works/:workId/review`
- Purpose: admin review decision.
- Body:
  - `decision` (`approved` | `rejected`)
  - `reviewerId` (string)
  - `reason` (string, optional)

### `POST /v1/works/:workId/publish`
- Purpose: publish a work if preconditions pass.
- Body: none

### `GET /v1/feed`
- Purpose: list published works only.
- Query:
  - `cursor` (string, optional)
  - `limit` (number, optional, default 20, max 50)
- Response `data`:
  - `items`: work list
  - `nextCursor`: string | null

### `POST /v1/teacher-assets`
- Purpose: teacher creates a reusable asset baseline.
- Body:
  - `teacherUserId` (string, required)
  - `experimentId` (string, optional)
  - `title` (string, required)
  - `category` (`lesson_plan` | `class_activity` | `assessment` | `media`)
  - `payload` (object, required)

### `GET /v1/teacher-assets`
- Purpose: list teacher assets for reuse.
- Query:
  - `teacherUserId` (string, optional; fallback to `x-user-id`)

### `POST /v1/parent-sessions`
- Purpose: create parent guidance session.
- Body:
  - `parentUserId` (string, required)
  - `studentUserId` (string, required)
  - `experimentId` (string, required)
  - `workId` (string, optional)

### `POST /v1/parent-reports`
- Purpose: generate one report from one session (idempotent on `sessionId`).
- Body:
  - `sessionId` (string, required)
  - `summary` (string, required)
  - `strengths` (array of string, required)
  - `improvements` (array of string, required)
  - `nextRecommendations` (array of string, required)
  - `shareCopy` (string, optional)

### `GET /v1/parent-reports`
- Purpose: read generated report by session.
- Query:
  - `sessionId` (string, required)

## Permission Matrix (MVP)

- `student`: create work, read own work.
- `parent`: read child progress, create/share report.
- `teacher`: create/edit teacher assets.
- `admin`: review and publish works.
- `supervisor`: audit and cross-school governance.

## Current Header-Based Auth (Temporary)

MVP skeleton resolves permissions from headers:

- `x-role`
- `x-user-id`

This will be replaced by production IAM/session middleware before go-live.
