# CI Cache Optimization P2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the frontend artifact that CI still duplicates today exactly once per commit and restore it in downstream jobs, cutting repeated `@chainlit/react-client` builds from the `check-frontend` matrix.

**Architecture:** On the current `feat/refactor-scripts` branch, P1 is already implemented and P3 has already collapsed the old `prepare`/`validate` split in `e2e-tests`. The original P2 write-up in `docs/research/ci-cache-optimization.md` assumes `pnpm run buildUi` still runs in `tests` and `e2e-tests`, but that is no longer true in the current workflows. The remaining explicit duplicated frontend build is `pnpm --filter @chainlit/react-client build` inside the three-leg `check-frontend` matrix, so this plan seeds `libs/react-client/dist` once in `ci.yaml`, restores it in `check-frontend.yaml`, and leaves `tests`, `e2e-tests`, and backend checks untouched.

**Tech Stack:** GitHub Actions reusable workflows, `actions/cache@v5`, pnpm 9, TypeScript 5, tsup

## Assumptions

- P1 is already merged on this branch: `e2e-tests.yaml` uses `actions/cache@v5` for the Cypress binary and no longer uses `cypress-io/github-action`.
- P3 is already merged on this branch: `e2e-tests.yaml` has a single `prepare` job and no separate `validate` job.
- Backward compatibility matters more than theoretical optimality. Do not rename existing top-level CI jobs that branch protection may already depend on.
- The cache boundary for this iteration is only `libs/react-client/dist`. Do not broaden scope to `frontend/dist` or `libs/copilot/dist` unless a fresh measurement proves they are still rebuilt in CI.

## Success Criteria

- `check-frontend` no longer runs `pnpm --filter @chainlit/react-client build` in each matrix job.
- A new cache-seeding job restores or builds `libs/react-client/dist` once per `github.sha`.
- `check-frontend` fails fast if the expected cache is missing, instead of silently rebuilding.
- `check-backend`, `tests`, and `e2e-tests` keep their current behavior.
- A second CI run for the same commit shows a cache hit in the seed job and no rebuild.

---

## File Map

| Action | File                                     | Responsibility                                                                     |
| ------ | ---------------------------------------- | ---------------------------------------------------------------------------------- |
| Modify | `.github/workflows/ci.yaml`              | Add a one-time cache-seeding job and wire existing jobs to depend on it            |
| Modify | `.github/workflows/check-frontend.yaml`  | Restore `libs/react-client/dist` from cache and remove the duplicated inline build |
| Modify | `docs/research/ci-cache-optimization.md` | Update P2 notes so the research doc matches the current branch reality             |

---

## Task 1: Seed `@chainlit/react-client` Build Cache Once

**Files:**

- Modify: `.github/workflows/ci.yaml`

- [ ] **Step 1: Add a dedicated cache-seeding job**

Insert this job above `check-frontend` in `.github/workflows/ci.yaml`:

```yaml
build-react-client:
  name: Build @chainlit/react-client once
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v6
    - uses: ./.github/actions/pnpm-node-install
      name: Install Node, pnpm and dependencies.
    - name: Cache @chainlit/react-client dist
      id: react-client-dist
      uses: actions/cache@v5
      with:
        path: libs/react-client/dist
        key: react-client-build-${{ github.sha }}
    - name: Build @chainlit/react-client
      if: steps.react-client-dist.outputs.cache-hit != 'true'
      run: pnpm --filter @chainlit/react-client build
```

Why this exact shape:

- `github.sha` is the safest cache key for compiled output because it matches the exact source tree used by downstream jobs.
- `actions/cache@v5` restores immediately and saves at job completion, so downstream jobs can rely on the cache after `needs: build-react-client`.
- `ubuntu-latest` matches the current `check-frontend` runner, so no cross-OS cache settings are needed.

- [ ] **Step 2: Wire `check-frontend` and the CI aggregator to the new job**

In `.github/workflows/ci.yaml`, change the existing jobs to:

```yaml
check-frontend:
  needs: [build-react-client]
  uses: ./.github/workflows/check-frontend.yaml
  secrets: inherit

ci:
  runs-on: ubuntu-slim
  name: Run CI
  if: always()
  needs: [check-backend, build-react-client, check-frontend, tests, e2e-tests]
```

The extra `build-react-client` entry in `ci.needs` is required. Without it, a failed seed job can cause `check-frontend` to be skipped and the final `ci` job would not treat that upstream failure as a hard failure.

- [ ] **Step 3: Verify the workflow file still formats cleanly**

Run:

```bash
pnpm format-check:files .github/workflows/ci.yaml
```

Expected: exit code `0` and no output complaining about YAML formatting.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yaml
git commit -m "ci: seed react-client build cache once per commit"
```

---

## Task 2: Restore the Cache in `check-frontend`

**Files:**

- Modify: `.github/workflows/check-frontend.yaml`

- [ ] **Step 1: Replace the inline build step with cache restore + explicit failure**

In `.github/workflows/check-frontend.yaml`, replace:

```yaml
- name: Build @chainlit/react-client
  run: pnpm --filter @chainlit/react-client build
```

with:

```yaml
- name: Restore @chainlit/react-client dist
  id: react-client-dist
  uses: actions/cache@v5
  with:
    path: libs/react-client/dist
    key: react-client-build-${{ github.sha }}

- name: Fail if @chainlit/react-client dist cache is missing
  if: steps.react-client-dist.outputs.cache-hit != 'true'
  run: |
    echo "❌ Error: expected react-client build cache for ${GITHUB_SHA}"
    exit 1
```

Do **not** add a fallback rebuild here. The point of P2 is to prove the seed job is the single source of truth for this build artifact. Silent rebuilds would hide broken cache wiring.

- [ ] **Step 2: Keep the matrix commands unchanged**

After the cache restore, the job should still run the existing commands exactly as they are today:

```yaml
- name: ${{ matrix.name }}
  run: ${{ matrix.command }}
```

This preserves the existing job names:

- `Linting: frontend`
- `Formatting: frontend`
- `Type checking: frontend`

and avoids unnecessary branch-protection churn.

- [ ] **Step 3: Run the local smoke checks in the same order CI depends on**

Run:

```bash
pnpm --filter @chainlit/react-client build
pnpm lint
pnpm format-check
pnpm type-check
```

Expected:

- `pnpm --filter @chainlit/react-client build` writes `libs/react-client/dist`
- `pnpm lint` passes
- `pnpm format-check` passes
- `pnpm type-check` passes

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/check-frontend.yaml
git commit -m "ci: restore react-client build output in frontend checks"
```

---

## Task 3: Update the Research Doc So P2 Is No Longer Stale

**Files:**

- Modify: `docs/research/ci-cache-optimization.md`

- [ ] **Step 1: Rewrite the P2 problem statement to match the current branch**

Update the P2 section so it says the following, in substance:

```md
### P2: Build `@chainlit/react-client` once at CI startup, share via cache

**Status**: Still useful on `feat/refactor-scripts`, but the scope is narrower than the original draft.

**Current reality on this branch**:

- `tests.yaml` no longer runs `pnpm run buildUi`
- `e2e-tests.yaml` no longer runs `pnpm run buildUi`
- `check-frontend.yaml` still runs `pnpm --filter @chainlit/react-client build` once per matrix leg

**Approach**: Seed `libs/react-client/dist` once in `ci.yaml` with `actions/cache`, then restore it in `check-frontend.yaml` and fail on cache miss instead of rebuilding.
```

Keep the rest of the research document intact. This is a surgical doc correction, not a fresh rewrite.

- [ ] **Step 2: Update the expected impact table**

Change the P2 estimate from the old “buildUi in 7 jobs” numbers to the narrower current branch estimate:

```md
| Change                                                       | Current                | After       | Saving                        |
| ------------------------------------------------------------ | ---------------------- | ----------- | ----------------------------- |
| P2: cache `@chainlit/react-client` build in `check-frontend` | ~20-40s per matrix leg | ~5s restore | ~45-90s cumulative per CI run |
```

Use the final measured numbers from the first successful CI run if they differ materially from this estimate.

- [ ] **Step 3: Verify markdown formatting**

Run:

```bash
pnpm format-check:files docs/research/ci-cache-optimization.md
```

Expected: exit code `0`.

- [ ] **Step 4: Commit**

```bash
git add docs/research/ci-cache-optimization.md
git commit -m "docs: narrow P2 cache optimization scope to current workflows"
```

---

## Task 4: Verify the New Workflow Behavior in CI

**Files:**

- No file changes

- [ ] **Step 1: Push the branch and wait for the `CI` workflow to finish**

Run:

```bash
git push
```

Expected: a new `CI` workflow run starts for the current commit.

- [ ] **Step 2: Inspect the first run**

Verify in the GitHub Actions UI:

- `build-react-client` shows either:
  - cache miss + one `pnpm --filter @chainlit/react-client build`, or
  - cache hit + skipped build on a rerun of the same commit
- each `check-frontend` matrix job restores `react-client-build-${{ github.sha }}`
- no `check-frontend` matrix job logs an inline `pnpm --filter @chainlit/react-client build`

- [ ] **Step 3: Re-run the same commit once**

Use the GitHub Actions UI to re-run the workflow for the same SHA.

Expected:

- `build-react-client` shows `cache-hit: true`
- the build step is skipped
- all `check-frontend` matrix jobs still restore the cache and pass

- [ ] **Step 4: Record the measured timings in the research doc**

If the measured timing differs from the estimate in Task 3, update the numbers in `docs/research/ci-cache-optimization.md` before merging.

- [ ] **Step 5: Commit**

```bash
git add docs/research/ci-cache-optimization.md
git commit -m "docs: record measured P2 CI cache results"
```

---

## Non-Goals

- Do not reintroduce a full `buildUi` job unless fresh evidence shows `tests` or `e2e-tests` need it again.
- Do not cache `frontend/dist` or `libs/copilot/dist` in this change.
- Do not change `pnpm-node-install` or `uv-python-install`; P2 does not require action-level abstraction.
- Do not change publish workflows as part of this task.

## Self-Review

**Spec coverage:** This plan covers P2 only and explicitly adapts it to the current branch state after P1 and P3. It does not assume the stale “buildUi in 7 jobs” model from the research draft.

**Placeholder scan:** No `TODO`, `TBD`, or “handle appropriately” placeholders remain. Each workflow edit has exact YAML and each verification step has an exact command or a concrete UI check.

**Consistency:** The cache key is consistently `react-client-build-${{ github.sha }}` and the cached path is consistently `libs/react-client/dist` in both producer and consumer jobs.
