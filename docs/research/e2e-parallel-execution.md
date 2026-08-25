# E2E Test Parallel Execution Research

## Current Architecture: Strictly Sequential

The e2e tests **cannot run in parallel** with the current setup. There are four structural reasons.

### 1. Single Hardcoded Port

Every test backend spawns on port `8000` (`backend/chainlit/config.py`):

```python
DEFAULT_PORT = 8000
```

`runChainlit` in `cypress/support/run.ts` invokes `uv run chainlit run <entryPoint> -h --ci` without passing `--port`, so every backend binds to the default.

### 2. Kill-Restart Lifecycle Per Spec File

`cypress.config.ts` orchestrates a strict **kill → start → test → kill** cycle:

```ts
on('before:spec', async (spec) => {
  await killChainlit();
  await runChainlit(spec);
});

on('after:spec', async () => {
  await killChainlit();
});
```

`killChainlit()` uses `fkill(:8000)` — a port-based kill. If two test runners were active, one would kill the other's backend.

### 3. Each Spec Has Its Own Chainlit App

Each test directory (`cypress/e2e/<test_name>/`) contains:

- `main.py` — the Chainlit application for that test
- `.chainlit/config.toml` — per-test configuration

`runChainlit` uses `spec.absolute` to find the test directory and spawns Chainlit with `CHAINLIT_APP_ROOT` set to that directory. Since each test has a completely different backend app, the server must be restarted between specs.

### 4. Cypress Runs Specs Sequentially

Standard `cypress run` processes spec files one at a time in a single browser. Cypress Cloud offers parallelization across multiple CI machines, but the project doesn't use it (no `--parallel` or `--record` flags in `pnpm test:e2e`).

### Special Case: Mid-Test Restarts

The `data_layer` spec calls `cy.task('restartChainlit', Cypress.spec)` to kill and re-launch the backend within a single test to verify thread persistence across server restarts.

---

## Cypress Parallelization Capabilities

### Built-in `--parallel` Flag Requires Cypress Cloud

Cypress does **not** support parallelization out of the box for free.

```bash
cypress run --record --parallel
```

- `--parallel` **must** be used with `--record`, which sends results to Cypress Cloud (paid).
- Cypress Cloud acts as the orchestrator: it dynamically assigns spec files to available CI machines using a load-balancing strategy based on historical run durations.
- There is no local multi-process parallelism — it is **multi-machine** parallelism coordinated by the cloud service.

### Cypress vs Playwright

| Feature           | Cypress                   | Playwright               |
| ----------------- | ------------------------- | ------------------------ |
| Local parallelism | Not supported             | Built-in (`--workers=4`) |
| CI sharding       | Via Cypress Cloud (paid)  | Built-in (`--shard=1/4`) |
| Orchestration     | Dynamic, based on history | Manual split             |

### Free Alternatives for Cypress Parallelization

| Tool                                                           | Description                                                                           |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Manual CI matrix sharding**                                  | Split spec files across GitHub Actions matrix jobs using `--spec`                     |
| **[sorry-cypress](https://sorry-cypress.dev/)**                | Open-source, self-hosted drop-in replacement for Cypress Cloud; supports `--parallel` |
| **[cypress-split](https://github.com/bahmutov/cypress-split)** | Plugin that splits specs across CI machines using `SPLIT`/`SPLIT_INDEX` env vars      |
| **[currents.dev](https://currents.dev/)**                      | Cypress Cloud alternative with a free tier                                            |

---

## What Would It Take to Parallelize

### Bottlenecks and Solutions

| Bottleneck                            | Solution                                                                                                                                      |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Hardcoded port `8000`                 | Assign a unique port per worker (e.g. `8000 + workerIndex`). Pass `--port` to `chainlit run` and configure `baseUrl` dynamically.             |
| Port-based kill (`fkill(:8000)`)      | Switch to PID-based process management — store the child PID from `spawn()` and kill it directly.                                             |
| Single Cypress browser                | Use Cypress Cloud `--parallel`, sorry-cypress, cypress-split, or shard tests across CI matrix jobs.                                           |
| Shared filesystem (`.chainlit/` dirs) | Already isolated per test. Some tests (e.g. `data_layer`) write temp files like `thread_history.pickle` that must remain isolated per worker. |

### Strategy A: CI Matrix Sharding (Simplest)

Split the ~50 spec files into N groups across separate GitHub Actions runners:

1. Add a matrix dimension to the workflow that assigns each group to a separate runner.
2. Each runner uses port `8000` (since they are on separate machines).
3. No changes to Cypress config or `run.ts` — pass `--spec` with the subset.

### Strategy B: Same-Machine Parallelism (More Work)

1. Make `CHAINLIT_APP_PORT` dynamic — read from an env var per worker.
2. Replace `fkill(:port)` with PID tracking (`child.pid` from `spawn`).
3. Use `cypress-split` or `sorry-cypress` to distribute specs across multiple Cypress processes, each with its own `baseUrl`.
4. Each Cypress process gets its own `CYPRESS_BASE_URL` pointing to its dedicated backend port.
