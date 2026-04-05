# PR Split Plan for `feat/refactor-scripts`

Branch `feat/refactor-scripts` has **179 files changed** vs `main`. This document proposes splitting it into 8 focused PRs.

## PR 1: ESLint v9 migration (~10 files)

**Dependency:** none — merge first

| File                                             | Change                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------- |
| `eslint.config.mjs`                              | New flat config                                                             |
| `.eslintrc`                                      | Deleted                                                                     |
| `.eslintignore`                                  | Deleted                                                                     |
| `frontend/.eslintignore`                         | Deleted                                                                     |
| `package.json`                                   | eslint deps (`eslint`, `typescript-eslint`, removed `@typescript-eslint/*`) |
| `frontend/package.json`                          | `lint` script change                                                        |
| `libs/copilot/package.json`                      | `lint` script change                                                        |
| `libs/react-client/package.json`                 | `lint` script change                                                        |
| `libs/react-client/src/wavtools/wav_recorder.js` | eslint-disable update                                                       |
| `pnpm-lock.yaml`                                 | Lockfile                                                                    |
| `docs/plans/2026-03-31-eslint-v9-migration.md`   | Migration plan doc                                                          |

## PR 2: Prettier v3 + JS/TS/JSON/YAML/MD reformat (~95 files)

**Dependency:** after PR 1 (so lint config is stable)

All auto-applied. Config files:

- `.prettierrc`, `.prettierignore`, `.editorconfig`, `.gitattributes`, `tsconfig.json`
- `package.json` (prettier dep only)
- `lint-staged.config.js` (prettier integration)

Auto-formatted (reviewer just spot-checks):

- 21 `backend/chainlit/translations/*.json`
- ~20 `frontend/src/**/*.tsx` + `frontend/tests/*`, `frontend/*.json/html/js`
- ~15 `libs/**` (copilot config, css, ts; react-client ts)
- ~10 `cypress/**/*.ts` + `cypress/support/*`
- 5 markdown files (CHANGELOG, PRIVACY_POLICY, RELENG, backend/README, cypress readme)
- ~5 `.github/` yaml files (pure formatting, no workflow logic changes)

## PR 3: Python ruff/isort formatting (~35 files)

**Dependency:** none (independent of PR 1-2)

All from commit `b8f4461e` — removing blank lines between stdlib and third-party imports:

- 29 `backend/tests/**/*.py` files
- 6 `cypress/e2e/*/main.py` files

Every diff is a single removed blank line. Trivially reviewable.

## PR 4: AI agent configs (~4 files)

**Dependency:** none

| File                              | Change                                            |
| --------------------------------- | ------------------------------------------------- |
| `.claude/settings.json`           | New                                               |
| `.cursor/settings.json`           | New                                               |
| `.serena/project.yml`             | Updated                                           |
| `.github/copilot-instructions.md` | Updated (content changes, after prettier in PR 2) |

## PR 5: Research docs + context7 IDs (~4 files)

**Dependency:** none

| File                                      | Change          |
| ----------------------------------------- | --------------- |
| `docs/research/copilot-type-checking.md`  | New             |
| `docs/research/e2e-parallel-execution.md` | New             |
| `docs/README.md`                          | Index update    |
| `docs/context7.md`                        | New library IDs |

## PR 6: Cypress E2E functional fixes (~13 files)

**Dependency:** after PR 2 (formatting) if spec files overlap, otherwise independent

From commits `35b1df78` and `6e36c25f` — actual test logic changes:

- 11 `cypress/e2e/*/spec.cy.ts` files (eslint-plugin-cypress fixes, window_message readiness)
- `cypress/e2e/window_message/main.py`, `cypress/e2e/custom_element_auth/main.py`
- `package.json` (cypress dep if applicable)

## PR 7: pdfjs-dist fix (~3 files)

**Dependency:** none

| File                      | Change         |
| ------------------------- | -------------- |
| `frontend/package.json`   | pdfjs-dist dep |
| `frontend/pnpm-lock.yaml` | Lockfile       |
| `.npmrc`                  | New            |

## PR 8 (this branch): Scripts + CI + related docs (~25 files)

**Dependency:** after PR 1 (ESLint), PR 3 (Python fmt) — CI workflows reference new scripts

### New centralized scripts

- `pyproject.toml` (root workspace)
- `scripts/lint.py`, `scripts/format.py`, `scripts/type_check.py`
- `uv.lock` (moved from `backend/uv.lock`)

### Backend build changes

- `backend/pyproject.toml` (script/dep changes)
- `backend/build.py`
- `backend/chainlit/sync.py` (type-check fix)

### CI workflows

- `.github/workflows/check-backend.yaml` (new)
- `.github/workflows/check-frontend.yaml` (new)
- `.github/workflows/ci.yaml` (refactored)
- `.github/workflows/tests.yaml` (renamed from `pytest.yaml`)
- `.github/workflows/e2e-tests.yaml`
- `.github/workflows/publish.yaml`
- `.github/workflows/publish-libs.yaml`
- `.github/workflows/close_stale.yml`
- `.github/workflows/copilot-setup-steps.yaml`
- `.github/workflows/lint-backend.yaml` (deleted)
- `.github/workflows/lint-ui.yaml` (deleted)
- `.github/actions/pnpm-node-install/action.yaml`
- `.github/actions/uv-python-install/action.yaml`

### Package.json script entries

- `package.json` (script-only changes)
- `.gitignore`

### Related docs

- `AGENTS.md` (commands tables)
- `CONTRIBUTING.md` (commands tables)
- `CLAUDE.md`

## Dependency graph and merge order

```
Independent (merge anytime):
  PR 3  Python ruff formatting  (35 files)
  PR 4  AI agent configs        (4 files)
  PR 5  Research docs           (4 files)
  PR 7  pdfjs-dist fix          (3 files)

Sequential chain:
  PR 1  ESLint v9        (10 files)
    ↓
  PR 2  Prettier v3      (95 files)
    ↓
  PR 6  Cypress E2E fixes (13 files)
    ↓
  PR 8  Scripts + CI     (25 files)  ← this branch
```

## Notes

- **Shared files**: `package.json`, `pnpm-lock.yaml`, and `lint-staged.config.js` are touched by ESLint, Prettier, and Scripts. Each PR owns specific sections. The lockfile goes in whichever PR lands first; subsequent PRs rebase and regenerate.
- **PR 2 is 95 files but ~5 minutes to review**: every code file diff is indentation/semicolons/trailing commas. The real review is 5 config files.
- **PR 3 (35 files) is even simpler**: every diff is one removed blank line per file. Could be squashed into PR 2 as "apply all formatting" (~130 files) if fewer PRs are preferred.
