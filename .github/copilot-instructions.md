## Purpose

Short, actionable guidance for AI assistants working on this repository. Focus: the small Jest-based API-test harness under `tests/`.

## Big picture

- This repo is a lightweight API testing harness (not a full app). Tests are data-driven: `tests/api.test.js` loads JSON files from `tests/testcases/*.json` and calls a small runner to exercise HTTP endpoints.
- Core components:
  - `tests/api.test.js` — orchestrates test discovery and maps JSON cases to Jest tests.
  - `tests/helpers/requestRunner.js` — the HTTP executor. It builds URLs from `process.env.API_BASE_URL` + `path`, substitutes `${VAR}` placeholders from env, performs fetch, and asserts status/body.
  - `tests/setupTests.js` — loads `.env` via `dotenv` (if available) and sets `jest.setTimeout(10000)`.

## How to run and debug tests

- Run tests: `npm test` (runs `jest`).
- Required environment variables: `API_BASE_URL` (base URL for requests). Tests may reference other env vars (e.g. `TEST_RESTAURANT_ID`) via `${VAR}` in the JSON `path`.
- Node runtime: the helper prefers global `fetch` (Node 18+). If running older Node, install `node-fetch` (already listed in devDependencies) or run tests with Node 18+.
- Typical debug steps:
  1. Ensure `.env` contains `API_BASE_URL` (or export it in shell). `tests/setupTests.js` will load `.env` during Jest startup if `dotenv` is available.
  2. Run `npm test` and inspect thrown errors from `tests/helpers/requestRunner.js` — messages are explicit (e.g. missing `API_BASE_URL`, missing `fetch`, or empty path after substitution).

## Testcase schema (discoverable from `tests/testcases/*.json` and requestRunner)

- Each file is an array of objects. Example (from `tests/testcases/restaurants_by_id.json`):

  {
    "name": "get restaurant by id (external)",
    "method": "GET",
    "path": "/api/v1/restaurants/${TEST_RESTAURANT_ID}",
    "external": true,
    "expectedStatus": 200
  }

- Supported keys and behavior:
  - `name`: test name (becomes the Jest test title).
  - `method`, `headers`, `body`: forwarded to fetch; `Content-Type: application/json` is added if `body` exists and no content-type provided.
  - `path`: concatenated with `API_BASE_URL` (trailing slash trimmed). Supports `${VAR}` env substitution.
  - `expectedStatus`: exact status check.
  - `expectedBody`: checked with full equality by default; if `partialMatch` is true, does an objectContaining match.

## Project-specific conventions & gotchas

- Tests are intentionally data-driven — prefer adding new JSON cases rather than creating new JS test files.
- `external` flag exists but currently unused by runner for behavior branching; treat it as metadata for humans/CI.
- The runner converts response body to JSON when possible, otherwise returns text — assertions must match that behavior.
- Errors thrown by the runner are explicit; use them to determine missing env vars or runtime requirements (e.g., `No fetch available: use Node 18+ or install node-fetch.`).

## Key files to inspect when modifying behavior

- `tests/api.test.js` — test discovery and mapping.
- `tests/helpers/requestRunner.js` — URL building, env substitution, fetch call, and assertion logic.
- `tests/setupTests.js` — dotenv and global Jest setup.
- `package.json` — `test` script (runs `jest`) and devDependencies (e.g. `node-fetch`, `jest`, `dotenv`).

## When updating this file

- If merging with an existing `.github/copilot-instructions.md`, preserve any custom instructions and examples; keep the project-specific sections above and update scripts or env examples if package.json or setup changes.

If anything here is unclear or you'd like a different focus (CI integration, more examples, or an explanation of a specific test case), tell me which areas to expand.
