# ESLint v9 Flat Config Migration + lint-staged Unification

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate ESLint from v8 (`.eslintrc`) to v9 (flat config) so that `eslint` with no args defaults to `.` (all files), while explicit file args override this — enabling lint-staged to pass staged files via `pnpm --filter` without linting the entire package.

**Architecture:** Replace the JSON `.eslintrc` + `.eslintignore` + `cypress/.eslintrc` with a single `eslint.config.mjs` at the repo root. Update all package `lint` scripts to bare `eslint` (no `--ext`, no directory). Update `lint-staged.config.js` to use package-scoped globs with `pnpm --filter` for ESLint and type-check.

**Tech Stack:** ESLint 9, typescript-eslint (unified package), @eslint/js, eslint-plugin-cypress 6, eslint-plugin-chai-friendly

**Key behavior (verified empirically on this repo):**

- ESLint v9 flat config: `eslint` (no args) = lints `.` (current directory)
- ESLint v9 flat config: `eslint file1.ts file2.ts` = lints **only** those files
- ESLint v8: no such behavior exists (no args = 0 files, silent exit 0)

---

## File Map

| Action | File                             | Responsibility                                                                 |
| ------ | -------------------------------- | ------------------------------------------------------------------------------ |
| Create | `eslint.config.mjs`              | Single flat config replacing `.eslintrc`, `.eslintignore`, `cypress/.eslintrc` |
| Delete | `.eslintrc`                      | Replaced by `eslint.config.mjs`                                                |
| Delete | `.eslintignore`                  | Merged into `ignores` array in `eslint.config.mjs`                             |
| Delete | `cypress/.eslintrc`              | Merged into `eslint.config.mjs` with `files: ['cypress/**/*.ts']`              |
| Modify | `package.json`                   | Update ESLint deps                                                             |
| Modify | `frontend/package.json`          | Remove `--ext` and `./src` from lint script                                    |
| Modify | `libs/react-client/package.json` | Remove `--ext` and `./src` from lint script                                    |
| Modify | `libs/copilot/package.json`      | Remove `--ext` and `./src` from lint script                                    |
| Modify | `lint-staged.config.js`          | Package-scoped globs with `pnpm --filter`                                      |

---

## Task 1: Update Dependencies

**Files:**

- Modify: `package.json` (devDependencies)
- **Step 1: Remove old ESLint packages and add new ones**

```bash
pnpm remove @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint eslint-plugin-cypress
```

- **Step 2: Install ESLint v9 and new packages**

```bash
pnpm add -Dw eslint@^9 @eslint/js typescript-eslint eslint-plugin-cypress@^6
```

> `eslint-plugin-chai-friendly@^1.1.1` stays — its peer dep is `eslint>=3.0.0` and it exports `configs.recommendedFlat` (verified at runtime).

- **Step 3: Verify installation**

```bash
npx eslint --version
```

Expected: `v9.x.x`

- **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: upgrade eslint to v9, add typescript-eslint unified package"
```

---

## Task 2: Create Flat Config

**Files:**

- Create: `eslint.config.mjs`

This replaces three files: `.eslintrc`, `.eslintignore`, `cypress/.eslintrc`.

- **Step 1: Create `eslint.config.mjs`**

```js
import eslint from '@eslint/js';
import chaiFriendly from 'eslint-plugin-chai-friendly';
import cypressPlugin from 'eslint-plugin-cypress/flat';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Global ignores (replaces .eslintignore + ignorePatterns)
  {
    ignores: ['**/node_modules/', '**/dist/', '**/*.jsx']
  },

  // Base configs (replaces "extends" in .eslintrc)
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // Project rules (replaces "rules" in .eslintrc)
  {
    linterOptions: {
      reportUnusedDisableDirectives: true
    },
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ]
    }
  },

  // Cypress overrides (replaces cypress/.eslintrc)
  {
    files: ['cypress/**/*.ts'],
    ...cypressPlugin.configs.recommended,
    plugins: {
      'chai-friendly': chaiFriendly
    },
    rules: {
      ...chaiFriendly.configs.recommendedFlat.rules
    }
  }
);
```

> **Why `.mjs`:** Root `package.json` has no `"type": "module"`, so ESM requires the `.mjs` extension.
>
> **What's gone:**
>
> - `"root": true` — flat config doesn't cascade from parent dirs
> - `"parser"` — `tseslint.configs.recommended` sets the parser automatically
> - `--ext .ts,.tsx` — flat config uses `files` patterns in config objects
> - `.eslintignore` — replaced by `ignores` array
> - `cypress/.eslintrc` — merged with `files: ['cypress/**/*.ts']`

- **Step 2: Verify the config loads**

```bash
npx eslint --print-config frontend/src/App.tsx
```

Expected: JSON output showing merged config with `@typescript-eslint/*` rules.

- **Step 3: Commit**

```bash
git add eslint.config.mjs
git commit -m "chore: add eslint v9 flat config"
```

---

## Task 3: Delete Old Config Files

**Files:**

- Delete: `.eslintrc`
- Delete: `.eslintignore`
- Delete: `cypress/.eslintrc`
- **Step 1: Delete the old files**

```bash
rm .eslintrc .eslintignore cypress/.eslintrc
```

- **Step 2: Verify ESLint still works with flat config only**

```bash
npx eslint frontend/src/App.tsx
```

Expected: no errors (or only pre-existing lint errors, not config errors).

- **Step 3: Commit**

```bash
git add .eslintrc .eslintignore cypress/.eslintrc
git commit -m "chore: remove legacy eslintrc config files"
```

---

## Task 4: Update Package Lint Scripts

**Files:**

- Modify: `frontend/package.json:10` — `"lint"` script
- Modify: `libs/react-client/package.json:9` — `"lint"` script
- Modify: `libs/copilot/package.json:10` — `"lint"` script

In flat config, `eslint` with no args defaults to `.` and file type matching is handled by config objects (no `--ext` needed).

- **Step 1: Update frontend lint script**

In `frontend/package.json`, change:

```diff
-    "lint": "eslint ./src --ext .ts,.tsx",
+    "lint": "eslint",
```

- **Step 2: Update react-client lint script**

In `libs/react-client/package.json`, change:

```diff
-    "lint": "eslint ./src --ext .ts,.tsx",
+    "lint": "eslint",
```

- **Step 3: Update copilot lint script**

In `libs/copilot/package.json`, change:

```diff
-    "lint": "eslint ./src --ext .ts,.tsx",
+    "lint": "eslint",
```

- **Step 4: Verify each package lints correctly**

```bash
pnpm --filter @chainlit/app lint
pnpm --filter @chainlit/react-client lint
pnpm --filter @chainlit/copilot lint
```

Expected: each lints its own directory (`.` = package root). No config errors.

> **Note:** This now also lints files outside `src/` (e.g. `vite.config.ts`, test files, storybook files). This is intentional and improves coverage. If any new lint errors surface in those files, fix them before proceeding.

- **Step 5: Verify root lint script still works**

```bash
pnpm lint
```

Expected: runs all three packages' lint in parallel, same as before.

- **Step 6: Commit**

```bash
git add frontend/package.json libs/react-client/package.json libs/copilot/package.json
git commit -m "chore: simplify package lint scripts for eslint v9 flat config"
```

---

## Task 5: Update lint-staged Config

**Files:**

- Modify: `lint-staged.config.js`

This is the payoff: package-scoped globs with `pnpm --filter` for ESLint. Prettier stays as direct invocation (it already uses the root `.prettierrc` and lint-staged passes staged files directly).

- **Step 1: Replace `lint-staged.config.js` contents**

```js
export default {
  // ── Frontend ──────────────────────────────────────
  'frontend/**/*.{ts,tsx}': [
    'pnpm --filter @chainlit/app lint -- --fix',
    'prettier --write',
    () => 'pnpm --filter @chainlit/app type-check'
  ],

  // ── React Client ──────────────────────────────────
  'libs/react-client/**/*.{ts,tsx}': [
    'pnpm --filter @chainlit/react-client lint -- --fix',
    'prettier --write',
    () => 'pnpm --filter @chainlit/react-client type-check'
  ],

  // ── Copilot ───────────────────────────────────────
  'libs/copilot/**/*.{ts,tsx}': [
    'pnpm --filter @chainlit/copilot lint -- --fix',
    'prettier --write',
    () => 'pnpm --filter @chainlit/copilot type-check'
  ],

  // ── Cypress (not a workspace package) ─────────────
  'cypress/**/*.ts': ['eslint --fix', 'prettier --write'],

  // ── Root config files ─────────────────────────────
  '*.{js,cjs,mjs}': ['eslint --fix', 'prettier --write'],

  // ── Python ────────────────────────────────────────
  'backend/**/*.py': [
    'uv run ruff check',
    'uv run ruff format --check',
    () => 'uv run dmypy run -- backend/'
  ],

  // ── GitHub Actions ────────────────────────────────
  '.github/workflows/**': ['actionlint']
};
```

> **How `pnpm --filter @chainlit/app lint -- --fix` works with lint-staged:**
>
> 1. lint-staged matches staged files against the glob (e.g. `frontend/**/*.{ts,tsx}`)
> 2. For string commands, lint-staged appends matched file paths as arguments
> 3. Command becomes: `pnpm --filter @chainlit/app lint -- --fix /abs/path/to/file1.tsx /abs/path/to/file2.tsx`
> 4. pnpm passes everything after `--` to the package's `lint` script
> 5. Script expands to: `eslint --fix /abs/path/to/file1.tsx /abs/path/to/file2.tsx`
> 6. ESLint v9: explicit file args override the default `.` — lints **only** the staged files
>
> **Why prettier stays as direct invocation:** Prettier doesn't have a "default to `.`" mode. The root `.prettierrc` is already the single source of config. lint-staged passes staged files directly — no benefit from `pnpm --filter` indirection.
>
> **Why** `backend/**/*.py` **instead of** `**/*.py`: Scopes Python linting to backend only, consistent with the package-scoped approach for JS/TS.

- **Step 2: Verify lint-staged config is valid**

```bash
npx lint-staged --debug 2>&1 | head -20
```

Expected: no syntax/parse errors.

- **Step 3: Test with a staged file**

```bash
# Stage a minor whitespace change in a frontend file, then:
npx lint-staged --verbose
```

Expected: runs `pnpm --filter @chainlit/app lint -- --fix` with only the staged file, NOT the entire package.

- **Step 4: Commit**

```bash
git add lint-staged.config.js
git commit -m "chore: scope lint-staged to packages with pnpm --filter"
```

---

## Task 6: Fix Lint Errors in Newly Covered Files

ESLint now covers files outside `src/` (config files, tests, storybook). Some may have pre-existing lint issues.

**Files:**

- Varies — depends on what ESLint reports
- **Step 1: Run full lint to find new errors**

```bash
pnpm lint 2>&1
```

- **Step 2: Fix any errors**

Most likely candidates:

- `vite.config.ts` files — may use `require()` or have unused imports
- `frontend/tests/*.spec.tsx` — may have unused variables in test helpers
- `libs/copilot/.storybook/*.ts` — may have `any` types (but rule is off)why
- `libs/copilot/stories/*.ts` — storybook conventions

Fix each file. If a file genuinely shouldn't be linted (e.g. auto-generated), add it to the `ignores` array in `eslint.config.mjs`.

- **Step 3: Verify clean lint**

```bash
pnpm lint
```

Expected: exit 0, no errors.

- **Step 4: Commit**

```bash
git add -A
git commit -m "fix: resolve lint errors in newly covered files"
```

---

## Task 7: Final Verification

- **Step 1: Run full CI-equivalent checks**

```bash
pnpm lint && pnpm type-check && pnpm --filter @chainlit/app test
```

Expected: all pass.

- **Step 2: Test lint-staged end-to-end**

Make a trivial change to a file in each package, stage it, and run:

```bash
npx lint-staged --verbose
```

Verify:

- Frontend file change triggers only `@chainlit/app` lint + type-check
- react-client file change triggers only `@chainlit/react-client` lint + type-check
- A Python file change triggers only ruff + dmypy
- No cross-package lint runs
- **Step 3: Commit any remaining changes**

```bash
git add -A
git commit -m "chore: complete eslint v9 migration and lint-staged unification"
```

---

## Risk Checklist

| Risk                                                      | Mitigation                                                                                                                                             |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `eslint-plugin-chai-friendly` doesn't work in flat config | It exports `configs.recommendedFlat` (verified at runtime). If it fails, wrap with `FlatCompat` from `@eslint/eslintrc`.                               |
| `eslint-plugin-cypress` v6 breaking changes               | The v6 `/flat` export is documented. The plugin only adds 2 rules (`no-assigning-return-values`, `no-unnecessary-waiting`). Verify they still trigger. |
| New lint errors in previously unlinted files              | Task 6 handles this. Scope is small: ~10 files outside `src/` across all packages.                                                                     |
| `pnpm --filter` + lint-staged file passing                | Verified empirically: lint-staged appends absolute paths, pnpm passes them after `--`, ESLint v9 lints only those files.                               |
