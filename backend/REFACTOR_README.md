# REFACTOR_README

This document summarizes the refactor standards established for the V2 modules: `ExpService`, `MaterialService`, and `QuestionService`.

## 1. Core principles

- Prefer deterministic logic over semantic inference.
- Keep SQL joins explicit and stable.
- Always use transaction boundaries for save/update workflows.
- Use UUID-like 32-char primary keys through the existing ID resolver helpers.
- Fail fast on invalid business input with explicit service-level error codes.
- Return unified API response envelopes for all V2 endpoints.

## 2. Shared service rules

### 2.1 Validation

- Rich text must be sanitized through `sanitizeAndNormalizeRichText()`.
- Length limits must be enforced in the service layer before persistence.
- Empty titles/names/content must be rejected with business errors.

### 2.2 Persistence

- `save*` methods must use transactions.
- Update paths must verify existence and, when applicable, ownership.
- Delete/replace child collections must be done in a controlled overwrite flow.
- List queries must use stable ordering for pagination.

### 2.3 Timestamps

- Persist timestamps with a consistent string format when the schema expects text timestamps.
- Do not mix ad hoc time formats inside the same module.

## 3. Response contract

All V2 routes must return:

```json
{
  "success": true,
  "data": {},
  "message": "ok",
  "error": null
}
```

For failures, return a structured business error object with a numeric `code` and readable `message`.

## 4. Module-specific rules

### 4.1 Experiment module

- `exp_step.step_comments` is rich text and must be sanitized and length-checked.
- Experimental detail responses should include nested child collections.
- Use `display_owner_id` and `display_owner_name` in API responses for frontend display consistency.

### 4.2 Material module

- `material_type_id` must be joined to `data_material_type`.
- `material_unit_id` must be joined to `data_material_unit`.
- Detail responses should include material pictures and security links as nested arrays.
- Ownership checks are required when updating private materials.

### 4.3 Question module

- Question type resolution must use the explicit config map only.
- `question_content` is rich text and must pass sanitization and length checks.
- Question options must be filtered so empty options are never persisted.
- Detail responses must include nested options.

## 5. Naming standards

- Audit fields:
  - `create_user_id`
  - `create_time`
  - `update_user_id`
  - `update_time`
- Display fields:
  - `display_owner_id`
  - `display_owner_name`
- Business ownership fields may remain module-specific (`owner_user_id`, `teacher_user_id`) in storage, but API responses should prefer the unified display fields.

## 6. Error code map

- `4001` — `CONTENT_TOO_LONG`
- `4002` — `NAME_EMPTY`
- `4003` — `INVALID_TYPE_ID`
- `4004` — `OPTION_EMPTY`

## 7. Frontend integration standards (must match V2 contract)

This section documents the frontend-side rules that must mirror the V2 backend rules, so invalid payloads are blocked before they reach the service layer.

### 7.1 Unified V2 request wrapper (`apiService`)

- Use `frontend/src/lib/v2/apiService.ts` (`createV2ApiService`) for all V2 calls.
- Backend failure must be surfaced as `V2ApiServiceError` which carries:
  - `code` (business error code from `error.code`)
  - `message` (business message)
- UI error mapping should prefer:
  - `V2ApiService.getBusinessCode(error)` for code routing
  - `V2ApiService.getBusinessMessage(error)` for fallback descriptions

### 7.2 Display name consistency (`displayOwnerName`)

- Lists and details must display the unified field `displayOwnerName` (API: `display_owner_name`).
- Do not use internal ids (e.g. `createUserId`, `teacherUserId`) as the primary display field.
- When mapping DTO → UI model, always keep `displayOwnerName` available end-to-end (list rows, detail panels, and debug/meta sections).

### 7.3 “Preflight validation” (frontend must fail fast)

Frontend save entrypoints must run **sanitization + length gates** before sending requests:

- **Experiment editor**:
  - Sanitize rich text blocks via `sanitizeAndNormalizeRichText(...)`.
  - Step content gate: any step正文 length > 2000 → block with “步骤内容过长，请精简（限2000字）”.

- **Experimental materials library**:
  - Text gates: `remark` and `safetyNote` length > 2000 → block with “内容过长，请精简（限2000字）”.

- **Question bank editor / management**:
  - Stem gate: `questionContent` must be sanitized via `sanitizeAndNormalizeRichText(...)`, then if length > 10000 → block with “题干内容过长（限10000字）”.
  - Options gate: each `selectContent` trimmed length > 1000 → block with “选项内容过长（限1000字）”.

These rules are not optional: backend will still validate, but frontend must keep the first gate for UX and to reduce invalid traffic.

### 7.4 Error code “radio mapping” (frontend toast copy)

Save flows should not show only a generic “保存失败”. Map error codes to user-facing copy:

- `4001` → “内容超过字符上限（请检查题干或选项）”
- `4002` → “题干不能为空”
- `4003` → “非法的题目类型”
- `4004` → “选项不能为空”
- Others → fallback to generic error (or `error.message`)

## 7. Refactor workflow for future modules

1. Inspect SQL schema and migration baseline.
2. Define exact field mapping and nested relations.
3. Build service layer with validation and transaction boundaries.
4. Standardize route envelopes and business error mapping.
5. Run lint/self-check.
6. Document final API examples for frontend integration.
