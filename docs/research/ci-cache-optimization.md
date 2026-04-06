# CI Cache Optimization Research

> Last CI run analyzed: [#5989](https://github.com/Chainlit/chainlit/actions/runs/24017813922) on `feat/parallel-cypress` (2026-04-06, success, 13m 36s wall clock)

## Timing Findings

### Critical Path

The pipeline bottleneck is **Windows E2E shards** (13m 12s worst case). 60% of that time is setup, not tests.

```
e2e-tests / windows-latest-2 (13m 12s) ← CRITICAL PATH

  ┌─ Install Node/pnpm ──── 1m 57s ─┐
  │  Install Cypress ─────── 1m 33s  │
  │  Install Python/uv ──── 2m 50s  │  7m 49s setup (60%)
  │  Build UI ────────────── 1m 29s  │
  └──────────────────────────────────┘
  ┌─ Run tests ───────────── 4m 19s ─┐  4m 19s actual work
  └──────────────────────────────────┘
```

### All Jobs (wall clock)

| Job                    | Total      | pnpm install | Cypress | uv sync    | Build UI | Tests    |
| ---------------------- | ---------- | ------------ | ------- | ---------- | -------- | -------- |
| lint-backend           | 1m 21s     | —            | —       | 11s        | —        | mypy 58s |
| lint-ui                | 1m 52s     | 30s          | —       | —          | 1m 07s   | lint 10s |
| pytest (3.10)          | 3m 09s     | 33s          | —       | 58s        | 1m 07s   | 24s      |
| pytest (3.11)          | 3m 04s     | 33s          | —       | 56s        | 1m 06s   | 23s      |
| pytest (3.12)          | 3m 03s     | 30s          | —       | 53s        | 1m 07s   | 29s      |
| **pytest (3.13)**      | **5m 45s** | 30s          | —       | **3m 40s** | 1m 06s   | 25s      |
| e2e ubuntu (avg of 5)  | ~5m 50s    | ~31s         | ~11s    | ~55s       | ~1m 07s  | ~3m      |
| e2e windows (avg of 5) | ~11m 56s   | ~2m 02s      | ~1m 30s | ~2m 28s    | ~1m 22s  | ~3m 50s  |

### Anomalies

- **pytest (3.13) uv sync: 3m 40s** — vs ~55s for 3.10–3.12. Verified from logs: uv cache save **failed** during this run due to a transient GitHub cache service outage (`"Our services aren't available right now"`). The 3.13 slowness is likely source-building wheels that lack pre-built binaries for Python 3.13. This is a one-time cost that gets cached naturally once the service recovers — not a config issue.
- **Windows pnpm install: ~2m** — vs ~30s on Ubuntu. Disk I/O and process spawning overhead.
- **uv cache save failed across all jobs** in this run — transient outage, not a config problem.

### Redundant Work

The UI build is **not an explicit workflow step** — it's a Hatch build hook (`backend/build.py`) triggered by `uv sync --all-packages`. The hook runs `pnpm build` then copies `frontend/dist` and `libs/copilot/dist` into the backend package. This runs independently in **14 jobs**:

- 5 Ubuntu E2E shards × 1m 07s = 5m 35s
- 5 Windows E2E shards × 1m 22s = 6m 50s
- 4 pytest jobs × 1m 07s = 4m 28s
- **Total: ~17 min of cumulative runner time** rebuilding the same output

The build hook itself provides a skip hint (line 76–77 of `build.py`):

> _"If you don't need to build the frontend and just want dependencies installed, use `uv sync --no-install-project --no-editable`"_

---

## Current Cache Configuration

| Tool                | Action                                                                            | Cache mechanism                                               | Status                                            |
| ------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------- |
| pnpm store          | `actions/setup-node@v6.3.0`                                                       | `cache: 'pnpm'`, `cache-dependency-path: '**/pnpm-lock.yaml'` | ✅ Working (30s installs on Ubuntu)               |
| uv download cache   | `astral-sh/setup-uv@v8.0.0`                                                       | `enable-cache: true`                                          | ✅ Working (55s on Ubuntu), ⚠️ cache miss on 3.13 |
| Cypress binary      | `cypress-io/github-action@v6` (run used v6 despite local file referencing v7.1.9) | Internal (built-in to the action)                             | ✅ Ubuntu (11s), ⚠️ Windows (90s)                 |
| Python installation | `actions/setup-python@v6.2.0`                                                     | Built-in (pre-installed on runners)                           | ✅ Fast on Ubuntu                                 |
| UI build output     | —                                                                                 | **Not cached**                                                | ❌ Rebuilt 14× per run                            |

---

## Research: Recommended Approaches per Tool

### 1. pnpm — `actions/setup-node` and `pnpm/action-setup`

**Source**: [actions/setup-node README](https://github.com/actions/setup-node), [pnpm/action-setup README](https://github.com/pnpm/action-setup)

**What's recommended**:

- `actions/setup-node` with `cache: 'pnpm'` — caches pnpm's content-addressable store. This is **already in use** and is the recommended approach.
- `pnpm/action-setup` also offers `cache: true` but using both is redundant.
- Docs explicitly recommend committing `pnpm-lock.yaml` and using `--frozen-lockfile` in CI.

**What's NOT recommended**:

- Caching `node_modules/` directly. pnpm uses hard-linked content-addressable storage; caching `node_modules` breaks this model and can cause integrity issues.

**Assessment**: Current config is correct. No change needed for pnpm caching itself.

### 2. Cypress binary — `cypress-io/github-action`

**Source**: [cypress-io/github-action README — "Install Cypress only"](https://github.com/cypress-io/github-action#install-cypress-only)

**Recommended pattern** (from the README, section "Install Cypress only"):

```yaml
- uses: actions/cache@v5
  with:
    path: |
      ~/.cache/Cypress
      node_modules
    key: my-cache-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
- run: npm i cypress
- uses: cypress-io/github-action@v7
  with:
    install: false
```

**Key observations**:

1. The README shows explicit `actions/cache` for `~/.cache/Cypress` as the recommended approach when splitting install from test execution.
2. The `cypress-io/github-action` has a `cache-key` input for custom cache keys.
3. For pnpm projects, the README shows: install pnpm → setup-node with `cache: 'pnpm'` → let the Cypress action handle installation.

**Verified from CI logs (Ubuntu shard 1)**:

1. `pnpm install` (03:46:41–03:47:00) runs Cypress's `postinstall` hook, which **fully installs the binary** in ~9s:
   ```
   cypress@14.5.3 postinstall: Installing Cypress (version: 14.5.3)
   cypress@14.5.3 postinstall: Done
   ```
2. `cypress-io/github-action@v6` with `runTests: false` (03:47:00–03:47:11, ~11s) then runs again. Its only log output: `"Skipping running tests: runTests parameter is false"`. It re-runs the install/verify (redundant) and saves the Cypress binary cache in its post-step.

**Conclusion**: The action is **redundant for installation**. Its only value is the **post-step cache save** of `~/.cache/Cypress`. This can be replaced with a plain `actions/cache` step that:

1. Restores `~/.cache/Cypress` BEFORE `pnpm install` (so postinstall skips the download)
2. Saves it after the job completes

This follows the "Install Cypress only" pattern from the action's own README.

**Paths for Windows**: The `~/.cache/Cypress` path is Linux-only. Windows uses `~/AppData/Local/Cypress/Cache`. Both must be listed in the `actions/cache` path, OR use the `CYPRESS_CACHE_FOLDER` env var to standardize.

### 3. uv — `astral-sh/setup-uv`

**Source**: [setup-uv README](https://github.com/astral-sh/setup-uv), [uv GitHub Actions guide](https://github.com/astral-sh/uv/blob/main/docs/guides/integration/github.md), [uv caching concepts](https://github.com/astral-sh/uv/blob/main/docs/concepts/cache.md)

**What's recommended**:

- `enable-cache: true` — caches uv's download cache (wheels, sdists). **Already in use.**
- `cache-python: true` — caches Python installations managed by uv. **Not currently used.** This would help when uv installs Python (vs `actions/setup-python`).
- `cache-dependency-glob` — controls cache key. Defaults to `**/uv.lock` etc. Current config uses defaults.
- Manual approach: `actions/cache` with `UV_CACHE_DIR` + `uv cache prune --ci` for more control.

**What's NOT recommended**:

- Caching `.venv/` directly. The uv docs don't mention or recommend this. uv is designed to be fast at resolving+linking from its cache.
- Caching pre-built wheels. From the uv docs: _"it's often faster to omit pre-built wheels from the cache (and instead re-download them from the registry on each run)."_ Only source-built wheels benefit from caching.

**Verified from CI logs**: The 3.13 outlier coincided with a **transient GitHub cache service outage** (`"Failed to save: Our services aren't available right now"` in the post-step). All pytest jobs in this run failed to save their uv cache. The 3m40s `uv sync` is likely source-building wheels that don't have pre-built binaries for Python 3.13 yet, combined with the cache miss.

**Assessment**: `cache-python: true` would NOT help here — it caches the Python installation binary, not package wheels. The uv download cache (`enable-cache: true`, already in use) is the correct mechanism; it just failed to save in this run due to the outage. No config change needed — this resolves on the next successful cache save.

**Important from uv docs**: _"it's often faster to omit pre-built wheels from the cache (and instead re-download them from the registry on each run)."_ Only source-built wheels benefit from caching. The current `enable-cache: true` already handles this correctly.

### 4. UI build output — no standard tool

**Source**: No specific recommendation from any action. This is a custom optimization.

**Standard GitHub Actions patterns**:

1. **`actions/cache`** — Cache build output keyed on source hash. Pros: simple. Cons: 10GB cache limit shared across all branches; large build outputs can evict other caches.
2. **`actions/upload-artifact` + `actions/download-artifact`** — Build once in a dedicated job, share artifacts with downstream jobs. Pros: no cache eviction issues, guaranteed fresh builds. Cons: adds a sequential dependency (build job must complete before shards start), artifact upload/download overhead.

**Assessment**: A dedicated build job with artifact sharing is the cleaner pattern for this case (14 consumers, deterministic output). But it changes the dependency graph — E2E and pytest jobs would need to wait for the build job.

---

## Proposed Changes

### P1: Replace `cypress-io/github-action` with `actions/cache` for Cypress binary

**Status**: Verified from logs — the action is redundant for installation.

**Why `install: false` + `runTests: false` doesn't help**: The action's cache restore happens in its **main step**, which runs AFTER `pnpm-node-install`. By then, `pnpm install` has already triggered Cypress's `postinstall` hook and downloaded the binary. The cache restore is too late. With both flags off, the action is effectively a no-op during the main step — it only saves the cache in its post-step for future runs.

The README's [`install: false` pattern](https://github.com/cypress-io/github-action#install-cypress-only) assumes the action is still used to **run tests**. We don't — we use `pnpm test:e2e` with `cypress-split`.

**Approach**: Place `actions/cache` **before** `pnpm install` so the Cypress binary is restored before the postinstall hook runs:

1. Add `actions/cache` for Cypress binary dir BEFORE `pnpm-node-install`
2. Remove the `cypress-io/github-action` step entirely
3. Cypress's `postinstall` hook skips download when it finds the binary pre-cached

```yaml
# In e2e-tests.yaml, BEFORE pnpm-node-install:
- name: Cache Cypress binary
  uses: actions/cache@v4
  with:
    path: |
      ~/.cache/Cypress
      ~/AppData/Local/Cypress/Cache
    key: cypress-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}
# Then remove the cypress-io/github-action step entirely.
```

**Cypress version**: `package.json` specifies `^14.5.3`, `pnpm-lock.yaml` resolves to `14.5.4`. Cypress is installed by `pnpm install` (postinstall hook) in both the current and proposed flow — no version change.

**Expected critical-path saving**: ~1m 30s per Windows shard (eliminates the redundant action step AND speeds up postinstall via cache hit on warm cache).

### P2: Build UI once, share via artifacts (E2E)

**Status**: Primary optimization — eliminates ~1m build per shard (×10 E2E jobs).

**Problem**: The UI build is a Hatch build hook (`backend/build.py`) triggered by `uv sync --all-packages`. Every E2E shard independently runs `pnpm build` (~1m) to produce identical output. When all 5 Windows shards start in parallel on a cold cache, they ALL rebuild from scratch — `actions/cache` doesn't help here because no shard finishes and saves before the others start.

**Build output directories**:

- `frontend/dist/` → copied to `backend/chainlit/frontend/dist/`
- `libs/copilot/dist/` → copied to `backend/chainlit/copilot/dist/`

**Approach**: Add a `build-ui` job that runs once, then share output with E2E shards via `actions/upload-artifact` + `actions/download-artifact`:

1. **`build-ui` job**: `pnpm install` → `pnpm build` → upload `frontend/dist` + `libs/copilot/dist` as artifact
2. **E2E shards** (`needs: [prepare, build-ui]`):
   - Download artifact → place in correct paths
   - Copy into `backend/chainlit/{frontend,copilot}/dist/`
   - Use `uv sync --no-install-project --no-editable` (skips Hatch build hook) to install Python deps only
   - Install chainlit separately: `uv pip install -e backend/ --no-build-isolation --no-deps`

**Skipping the build hook**: `build.py` line 76–77 documents the `--no-install-project` flag for this purpose. The hook only runs when Hatch builds the project; `--no-install-project` tells uv to skip that entirely.

**Trade-off**: Adds `build-ui` as a sequential dependency (~1m 30s on Ubuntu). But each shard saves ~1m of build time. Net saving is positive even with a single shard; with 10 shards the gain is ~8m 30s of cumulative runner time.

**Expected critical-path saving**: ~1m 20s per Windows shard (build time eliminated, minus small artifact download overhead). The `build-ui` job itself runs in parallel with `prepare` and doesn't extend the critical path if it completes before the shards' other setup steps.

### P3: Cache UI build output (pytest jobs)

**Approach**: For the 4 pytest jobs (which can't easily use artifact sharing since they're in a separate workflow), use `actions/cache` keyed on frontend/libs source file hashes. Skip the Hatch build hook on cache hit.

**Cache key**: `ui-build-${{ runner.os }}-${{ hashFiles('frontend/src/**', 'libs/react-client/src/**', 'libs/copilot/src/**', 'pnpm-lock.yaml') }}`

**Steps**:

1. Add `actions/cache` targeting `backend/chainlit/frontend/dist` and `backend/chainlit/copilot/dist`
2. On cache hit, use `uv sync --no-install-project` + separate editable install (same pattern as P2)
3. On cache miss, fall through to normal `uv sync --all-packages` (which triggers the build hook)

**Expected saving**: ~1m per pytest job (on cache hit).

### P4: Merge `validate` + `prepare` e2e jobs

**Approach**: Combine the two trivial `ubuntu-slim` jobs into one to eliminate a job startup cycle.

**Expected saving**: ~10-15s.

### ~~P5: Add `cache-python: true` to setup-uv~~ (dropped)

**Reason**: Verified from logs that the Python 3.13 outlier was caused by a transient GitHub cache service outage, not a config issue. `cache-python: true` caches the Python installation binary, which is irrelevant — the slowness came from source-building wheels. The existing `enable-cache: true` already caches built wheels correctly. No change needed.

---

## Estimated Impact on Critical Path

| Change                              | Current (win shard 2)                | After                   | Saving      |
| ----------------------------------- | ------------------------------------ | ----------------------- | ----------- |
| P1: Cypress cache + remove action   | 1m 33s (action) + ~30s (postinstall) | ~5s                     | ~2m         |
| P2: Build UI once + artifacts (E2E) | ~1m 22s (build per shard)            | ~5s (artifact download) | ~1m 17s     |
| P3: UI build cache (pytest)         | ~1m 07s (build per job)              | ~5s (cache hit)         | ~1m 02s     |
| P4: merge validate+prepare          | ~15s overhead                        | 0s                      | ~15s        |
| **Cumulative (critical path)**      | **13m 12s**                          | **~9m 55s**             | **~3m 17s** |

Notes:

- P1 and P2 are the most reliable wins. P2 is especially important for Windows where all 5 shards start cold in parallel — `actions/cache` alone doesn't help because no shard finishes before the others start.
- P2's `build-ui` job adds a sequential dependency (~1m 30s on Ubuntu) but runs in parallel with other setup, so it doesn't extend the critical path unless it's slower than the other pre-shard steps.
- P3 helps pytest jobs which are in a separate workflow and can't use P2's artifact sharing easily.
- Cumulative runner time saved (not just critical path): ~14m across all 14 jobs.

---

## Discarded Ideas (with reasons)

| Idea                             | Why discarded                                                                                                                    | Source                                                                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Cache `node_modules/` directly   | pnpm uses hard-linked content-addressable storage; caching `node_modules` breaks this model                                      | [pnpm docs](https://pnpm.io/faq#why-is-it-recommended-to-not-use-npm-ci-for-pnpm), [actions/setup-node](https://github.com/actions/setup-node) |
| Cache `.venv/` directly          | uv docs don't recommend this; uv is designed to resolve+link fast from its cache                                                 | [uv caching docs](https://github.com/astral-sh/uv/blob/main/docs/concepts/cache.md)                                                            |
| `cache-python: true` in setup-uv | Wouldn't help — 3.13 outlier was source-building wheels (not Python install), and was caused by a transient cache service outage | Verified from CI logs                                                                                                                          |
| Cache pre-built wheels           | uv docs explicitly say _"it's often faster to omit pre-built wheels from the cache"_ — only source-built wheels benefit          | [uv caching docs](https://github.com/astral-sh/uv/blob/main/docs/concepts/cache.md)                                                            |
