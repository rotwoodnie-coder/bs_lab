# Mobile Cursor Protection Rules

## Goal
Prevent any debug-only or mock user logic from leaking into production builds.

## Hard rules

1. **No hard-coded mock identities in business code**
   - Do not hard-code values such as `test_student`, `test_user`, `mock_*`, or similar fallback identities in production-facing code paths.
   - Do not ship code that silently fabricates an authenticated user state when the real API fails.

2. **No production-available API fallback mocks**
   - Any API fallback, mock profile, or simulated login state must be isolated behind:
     - `process.env.NODE_ENV === "development"`
   - If a mock is useful for local development, it must never execute in production bundles.

3. **No silent auth bypasses**
   - Business flows must not auto-login, auto-fill, or auto-switch to a test account in production.
   - API failures in production must surface a real error to the user instead of returning fabricated success data.

4. **Path-scoped mobile-only debug behavior**
   - Any mobile-specific mock behavior must be further restricted to mobile routes only.
   - PC routes must never be affected by mobile debug or profile simulation code.

## Audit checklist

Before merging code that touches auth, profile, or session state:

- Search for `test_student`, `test_user`, `mock-`, `fallback`, `simulate`, and similar terms.
- Verify that every mock or fallback path is gated by `process.env.NODE_ENV === "development"`.
- Verify that no production path fabricates login success or profile data.
- Confirm that any browser storage reads used for mock state are only consulted in development mode.
- Confirm that PC routes cannot trigger mobile-only mock behavior.

## Enforcement expectations

- If a change introduces mock user data, it must be explicitly development-only.
- If a change touches `v2` auth APIs, login pages, profile hydration, or context refresh logic, the reviewer must verify that production behavior always uses real backend responses.
- Treat any production-active debug logic as a release blocker.

## Notes for future changes

- Prefer failing loudly in production instead of auto-recovering with mock identities.
- If development mocking is required, centralize it in one clearly named helper and guard it with `NODE_ENV === "development"`.
- Do not add new business logic that depends on localStorage-backed fake identities unless it is explicitly limited to development-only scenarios.
