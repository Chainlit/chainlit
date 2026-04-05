# Copilot Type Checking — Research & Proposed Solutions

## Problem Statement

Running `tsc --noemit` in `libs/copilot/` fails because copilot **directly imports source files from `@chainlit/app` (the frontend)**, and those source files rely on path aliases/baseUrl settings defined in the frontend's own `tsconfig.json` — settings that are **not available** when TypeScript runs under copilot's `tsconfig.json`.

The goal is to make `pnpm --filter @chainlit/copilot type-check` work correctly with minimal changes to copilot source code and, if possible, `tsconfig.json`.

---

## Architecture Summary

### Monorepo Workspace (pnpm)

```
pnpm-workspace.yaml:
  - frontend/          → @chainlit/app     (private, no exports/main/types)
  - libs/react-client/ → @chainlit/react-client (published, has main/types → dist/)
  - libs/copilot/      → @chainlit/copilot  (private)
```

### Dependency Graph

```
@chainlit/copilot
  ├── @chainlit/app          (workspace:^)  ← imports SOURCE files
  └── @chainlit/react-client (workspace:^)  ← imports from dist/ (proper library)
```

### How Copilot Imports from `@chainlit/app`

Copilot reaches **directly into frontend source** via deep path imports:

```typescript
// libs/copilot/src/chat/body.tsx
import Alert from '@chainlit/app/src/components/Alert';
import ChatSettingsModal from '@chainlit/app/src/components/ChatSettings';
import { ErrorBoundary } from '@chainlit/app/src/components/ErrorBoundary';
import { TaskList } from '@chainlit/app/src/components/Tasklist';
import ChatFooter from '@chainlit/app/src/components/chat/Footer';
import MessagesContainer from '@chainlit/app/src/components/chat/MessagesContainer';
import ScrollContainer from '@chainlit/app/src/components/chat/ScrollContainer';
import Translator from '@chainlit/app/src/components/i18n/Translator';
import { useLayoutMaxWidth } from '@chainlit/app/src/hooks/useLayoutMaxWidth';
import { useUpload } from '@chainlit/app/src/hooks/useUpload';
import { IAttachment, attachmentsState } from '@chainlit/app/src/state/chat';
```

Full list of imported modules across all copilot files (25 import lines, 22 unique paths, 7 files):

| Copilot File                     | Imported from `@chainlit/app/src/...`                                                                                                                                                                                                                                                        |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `widget.tsx`                     | `components/Alert`, `components/ui/button`, `components/ui/popover`                                                                                                                                                                                                                          |
| `components/WelcomeScreen.tsx`   | `components/chat/Starters`, `lib/utils`                                                                                                                                                                                                                                                      |
| `components/Header.tsx`          | `components/AudioPresence`, `components/Logo`, `components/header/ChatProfiles`, `components/header/NewChat`, `components/ui/button`                                                                                                                                                         |
| `components/ElementSideView.tsx` | `components/Elements`, `components/ui/dialog`                                                                                                                                                                                                                                                |
| `appWrapper.tsx`                 | `i18n`                                                                                                                                                                                                                                                                                       |
| `app.tsx`                        | `components/i18n/Translator`                                                                                                                                                                                                                                                                 |
| `chat/body.tsx`                  | `components/Alert`, `components/ChatSettings`, `components/ErrorBoundary`, `components/Tasklist`, `components/chat/Footer`, `components/chat/MessagesContainer`, `components/chat/ScrollContainer`, `components/i18n/Translator`, `hooks/useLayoutMaxWidth`, `hooks/useUpload`, `state/chat` |

### Import Categories

Not just UI components — copilot imports 6 distinct categories:

| Category                 | Count | Imports                                                                                                                                                         |
| ------------------------ | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UI components**        | 13    | `Alert`, `AudioPresence`, `ChatSettings`, `Elements`, `ErrorBoundary`, `Logo`, `Tasklist`, `Starters`, `button`, `dialog`, `popover`, `ChatProfiles`, `NewChat` |
| **Composite chat views** | 4     | `Footer`, `MessagesContainer`, `ScrollContainer`, `Translator`                                                                                                  |
| **Hooks**                | 2     | `useLayoutMaxWidth`, `useUpload`                                                                                                                                |
| **Recoil state**         | 1     | `state/chat` (`IAttachment`, `attachmentsState`)                                                                                                                |
| **Utilities**            | 1     | `lib/utils` (`cn`, `hasMessage`)                                                                                                                                |
| **i18n config**          | 1     | `i18n` (`i18nSetupLocalization`)                                                                                                                                |

### Contrasted with `@chainlit/react-client` (works correctly)

`react-client` is a properly published library:

- `package.json` has `"main": "dist/index.js"` and `"types": "dist/index.d.ts"`
- Built with `tsup`, emits `.d.ts` declarations
- Copilot imports from the package root: `import { useConfig } from '@chainlit/react-client'`

---

## How Copilot Is Used

Copilot is **NOT a published npm package**. It is a **self-contained IIFE bundle** that gets embedded into the Python backend and served as a drop-in embeddable widget.

### Build & Distribution Flow

```
libs/copilot/
  index.tsx          ← Vite entry point
  vite.config.ts     ← builds as IIFE format (not ESM/CJS library)
      ↓ vite build (rollup, inlineDynamicImports: true)
  dist/
    index.js         ← 8.5 MB single IIFE bundle (everything inlined)
    assets/          ← static assets (pdf.worker.min.mjs ~1 MB)
      ↓ backend/build.py:copy_copilot()
  backend/chainlit/copilot/dist/
    index.js         ← copied into the Python package
      ↓ FastAPI serves at /copilot/*
  End user loads <script src="https://your-chainlit-app/copilot/index.js">
      ↓ IIFE self-executes
  window.mountChainlitWidget(config)  ← injects Shadow DOM chat widget
```

### Key Properties

- **Format**: IIFE with `inlineDynamicImports: true` — no code splitting possible
- **Rendering**: Uses Shadow DOM (`attachShadow({ mode: 'open' })`) with inlined CSS
- **Global API**: Exposes `window.mountChainlitWidget()`, `window.unmountChainlitWidget()`, `window.sendChainlitMessage()`, etc.
- **No TypeScript consumers**: Nobody imports from `@chainlit/copilot` — the type-check is purely a development-time quality gate
- **Vite resolves successfully**: The build uses `vite-tsconfig-paths` plugin + explicit `resolve.alias` entries, so the IIFE builds correctly despite tsc failing

### Vite Config Resolution

```typescript
// libs/copilot/vite.config.ts
resolve: {
  alias: {
    react: path.resolve(__dirname, './node_modules/react'),
    '@chainlit': path.resolve(__dirname, './node_modules/@chainlit'),
    postcss: path.resolve(__dirname, './node_modules/postcss'),
    tailwindcss: path.resolve(__dirname, './node_modules/tailwindcss'),
    i18next: path.resolve(__dirname, './node_modules/i18next'),
    sonner: path.resolve(__dirname, './node_modules/sonner'),
    'highlight.js': path.resolve(__dirname, './node_modules/highlight.js'),
    'react-i18next': path.resolve(__dirname, './node_modules/react-i18next'),
    'usehooks-ts': path.resolve(__dirname, './node_modules/usehooks-ts'),
    lodash: path.resolve(__dirname, './node_modules/lodash'),
    recoil: path.resolve(__dirname, './node_modules/recoil')
  }
}
```

The `@chainlit` alias points to `node_modules/@chainlit`, which pnpm symlinks:

```
libs/copilot/node_modules/@chainlit/app → ../../../../frontend
libs/copilot/node_modules/@chainlit/react-client → ../../../react-client
```

This means Vite follows symlinks into the actual source directories — `@chainlit/app/src/components/Alert` resolves to `frontend/src/components/Alert.tsx` via filesystem. Vite resolves each file's imports independently using the `vite-tsconfig-paths` plugin, which can apply different tsconfig settings per file. **tsc cannot do this** — it uses a single tsconfig for all files in its program.

---

## Actual Error Analysis (Verified)

Running `pnpm --filter @chainlit/copilot type-check` produces **243 errors** across **35 unique frontend source files**.

### Error Categories

| Category                          | Example Error                                                  | Count | Root Cause                                                                      |
| --------------------------------- | -------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------- |
| **`@/` alias misresolution**      | `Cannot find module '@/components/ui/button'`                  | ~180  | Copilot's `@/*` → `./src/*` resolves to `libs/copilot/src/` not `frontend/src/` |
| **`@/` false match**              | `Module '"@/types"' has no exported member 'IInput'`           | ~20   | Same-named file exists in copilot's src with different exports                  |
| **Bare `baseUrl` imports**        | `Cannot find module 'components/i18n/Translator'`              | ~40   | Frontend's `baseUrl: "./src"` doesn't apply under copilot's tsconfig            |
| **`client-types/` alias missing** | `Cannot find module 'client-types/*'`                          | 3     | Copilot has no mapping for frontend's `client-types/*` path                     |
| **Vite-specific import**          | `Cannot find module 'pdfjs-dist/build/pdf.worker.min.mjs?url'` | 1     | tsc doesn't understand Vite's `?url` import suffix                              |

### Top Missing Modules (by frequency)

```
19× @/components/ui/button
13× @/components/ui/tooltip
 6× @/components/ui/dialog
 6× @/components/ui/command
 5× @/components/ui/skeleton
 5× @/components/ui/badge
 5× components/i18n              (bare import)
 4× @/components/ui/select
 4× @/components/ui/input
 4× @/components/Markdown
 4× @/components/Icon
 4× components/i18n/Translator   (bare import)
 3× types/Input                  (bare import)
 3× @/state/chat
 3× client-types/                (missing alias)
 2× hooks/useFetch               (bare import)
```

### All Bare Module Imports (non-`@/`, non-`client-types/`)

These rely on `baseUrl` resolution and **cannot** be fixed via `paths` mappings alone:

```
components/i18n
components/i18n/Translator
contexts/MessageContext
hooks/useFetch
state/chat
state/project
types/Input
```

### Transitive Fan-Out

The 22 direct imports from copilot fan out into 35 unique frontend files with errors. The heaviest fan-out comes from three entry points:

1. **`ChatSettings`** → pulls in 12 sub-components (`CheckboxInput`, `SelectInput`, `DatePickerInput`, `MultiSelectInput`, `RadioButtonGroup`, `SliderInput`, `SwitchInput`, `TagsInput`, `TextInput`, `FormInput`, `InputStateHandler`) each importing 3-6 UI primitives
2. **`Elements`** → pulls in `Plotly.tsx`, `PDF.tsx`, `LazyDataframe.tsx`, `CustomElement/`, `File.tsx`, `Image.tsx`, `Text.tsx`
3. **`MessagesContainer`** → pulls in `MessageComposer/` (10+ subfiles: `Input`, `SubmitButton`, `UploadButton`, `VoiceButton`, `ModePicker`, `CommandButtons`, `Mcp/`, etc.)

---

## Root Cause Analysis

### The Core Problem: Cross-Project Path Alias Mismatch

When `tsc` runs with `libs/copilot/tsconfig.json`, it follows imports into `frontend/src/...` files. Those files are type-checked using copilot's path mappings, not frontend's. TypeScript has **no mechanism to apply different tsconfig settings to different source files within a single compilation**.

#### Copilot's tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": { "@/*": ["./*"] },
    "moduleResolution": "Node",
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["./src"]
}
```

#### Frontend's tsconfig.json

```json
{
  "compilerOptions": {
    "composite": true,
    "baseUrl": "./src",
    "paths": {
      "client-types/*": ["../../libs/react-client/dist"],
      "@/*": ["./*"]
    },
    "moduleResolution": "Node",
    "noEmit": true
  },
  "include": ["./src"]
}
```

#### Three categories of internal imports that fail:

1. **`@/` Path Alias** (130+ frontend files use this)
   - Frontend: `@/lib/utils` → `frontend/src/lib/utils`
   - Under copilot's tsconfig: `@/lib/utils` → `libs/copilot/src/lib/utils` (WRONG)

2. **`client-types/` Path Alias** (8 frontend files)
   - Frontend: `client-types/*` → `../../libs/react-client/dist`
   - Under copilot's tsconfig: not mapped → module not found

3. **Bare Module Imports via `baseUrl`** (33+ frontend files)
   - Frontend: `components/Alert` → `frontend/src/components/Alert` (via `baseUrl: "./src"`)
   - Under copilot's tsconfig: `components/Alert` → `libs/copilot/src/components/Alert` (WRONG)

### Why Frontend Type-Check Passes

`pnpm --filter @chainlit/app type-check` succeeds because tsc uses the frontend's own tsconfig where all aliases resolve correctly. The problem only manifests when **copilot's** tsc follows imports into frontend files.

### CI Impact

```yaml
# .github/workflows/check-frontend.yaml
- name: 'Type checking: frontend'
  run: pnpm type-check # runs: pnpm run --parallel type-check
```

Root `package.json`: `"type-check": "pnpm run --parallel type-check"` — runs all three packages in parallel. Frontend and react-client pass; copilot fails. **CI is currently broken for copilot type-checking.**

---

## Bundle Size Analysis

### Methodology

Bundle analyzed using `rollup-plugin-visualizer` (v7.0.1, March 2026) with treemap template and gzip size calculation, integrated as a Vite plugin during a one-off build.

### Overview

| Metric                      | Size                              |
| --------------------------- | --------------------------------- |
| Rendered (pre-minification) | 20.0 MB                           |
| Minified                    | 8,551.6 KB (8.3 MB)               |
| Gzipped                     | 2,518.7 KB (2.5 MB)               |
| Module count                | 3,053                             |
| Additional asset            | `pdf.worker.min.mjs` — 1,046.2 KB |

### Bundle Composition by Package

```
10900.4 KB (53.2%)  plotly.js
 1672.1 KB ( 8.2%)  highlight.js
  938.5 KB ( 4.6%)  lucide-react
  780.9 KB ( 3.8%)  pdfjs-dist
  673.3 KB ( 3.3%)  lodash
  612.9 KB ( 3.0%)  katex
  459.6 KB ( 2.2%)  sucrase
  331.6 KB ( 1.6%)  date-fns
  327.4 KB ( 1.6%)  @chainlit/app (frontend source)
  281.9 KB ( 1.4%)  parse5
  268.2 KB ( 1.3%)  react-dom
  193.2 KB ( 0.9%)  recoil
  162.0 KB ( 0.8%)  other
  154.6 KB ( 0.8%)  zod
  145.9 KB ( 0.7%)  tailwind-merge
  134.0 KB ( 0.7%)  react-day-picker
  129.6 KB ( 0.6%)  react-player
  118.2 KB ( 0.6%)  micromark-core-commonmark
  112.9 KB ( 0.6%)  @tanstack/table-core
   99.3 KB ( 0.5%)  react-hook-form
   94.8 KB ( 0.5%)  swr
   89.4 KB ( 0.4%)  i18next
   66.9 KB ( 0.3%)  entities
   57.3 KB ( 0.3%)  react-pdf
   49.6 KB ( 0.2%)  react-dropzone
   48.8 KB ( 0.2%)  @radix-ui/react-select
   48.4 KB ( 0.2%)  embla-carousel
   48.2 KB ( 0.2%)  engine.io-client
   42.0 KB ( 0.2%)  @chainlit/react-client
```

### Top 30 Individual Modules

```
 1. 10900.3 KB  plotly.js/dist/plotly.js
 2.   780.9 KB  pdfjs-dist/build/pdf.mjs
 3.   612.9 KB  katex/dist/katex.mjs
 4.   562.8 KB  lodash/lodash.js
 5.   193.2 KB  recoil/es/index.js
 6.   159.0 KB  highlight.js/lib/languages/mathematica.js
 7.   154.6 KB  zod/lib/index.mjs
 8.   136.2 KB  react-dom/cjs/react-dom.production.min.js (copilot copy)
 9.   130.8 KB  react-dom/cjs/react-dom.production.min.js (frontend copy)
10.   112.9 KB  @tanstack/table-core/build/lib/index.mjs
11.   111.8 KB  highlight.js/lib/languages/isbl.js
12.   109.6 KB  parse5/dist/tokenizer/index.js
13.   107.1 KB  parse5/dist/parser/index.js
14.    99.3 KB  react-hook-form/dist/index.esm.mjs
15.    89.4 KB  i18next/dist/esm/i18next.js
16.    82.2 KB  highlight.js/lib/languages/gml.js
17.    80.4 KB  copilot src/index.css (inlined Tailwind CSS)
18.    76.4 KB  highlight.js/lib/core.js
19.    73.2 KB  tailwind-merge (copilot copy)
20.    72.8 KB  tailwind-merge (frontend copy)
21.    64.5 KB  highlight.js/lib/languages/1c.js
22.    62.7 KB  highlight.js/lib/languages/sqf.js
23.    48.8 KB  @radix-ui/react-select/dist/index.mjs
24.    48.4 KB  embla-carousel/esm/embla-carousel.esm.js
25.    47.1 KB  sucrase/dist/esm/parser/plugins/typescript.js
26.    46.6 KB  entities/lib/esm/generated/decode-data-html.js
27.    43.0 KB  sucrase/dist/esm/parser/tokenizer/readWordTree.js
28.    42.0 KB  @chainlit/react-client/dist/index.mjs
29.    37.2 KB  react-dropzone/dist/es/index.js
30.    34.1 KB  @radix-ui/react-menu/dist/index.mjs
```

### Dependency Origin Split

| Source                                 | Size        | %     |
| -------------------------------------- | ----------- | ----- |
| Frontend's `node_modules` (transitive) | 16,952.9 KB | 82.7% |
| Copilot's own `node_modules` (direct)  | 3,554.7 KB  | 17.3% |

**82.7% of the copilot bundle comes from frontend's transitive dependencies.**

### Duplicate Packages

Several packages are bundled **twice** — once resolved from `frontend/node_modules` and once from `libs/copilot/node_modules` — because pnpm's strict module isolation creates separate copies:

| Package                      | Frontend copy | Copilot copy | Waste       |
| ---------------------------- | ------------- | ------------ | ----------- |
| react-dom                    | 131.4 KB      | 136.9 KB     | 131.4 KB    |
| tailwind-merge               | 72.8 KB       | 73.2 KB      | 72.8 KB     |
| swr                          | 46.4 KB       | 48.5 KB      | 46.4 KB     |
| lucide-react                 | 934.6 KB      | 3.9 KB       | 3.9 KB      |
| scheduler                    | 4.4 KB        | 4.4 KB       | 4.4 KB      |
| uuid                         | 2.3 KB        | 4.8 KB       | 2.3 KB      |
| **Total duplicate overhead** |               |              | **~263 KB** |

Note: The `vite.config.ts` `resolve.alias` entries try to deduplicate `react`, `react-dom`, `recoil`, etc. but don't cover all packages (notably `tailwind-merge`, `swr` are missing).

### Packages Copilot Probably Doesn't Need

These are pulled in transitively via `Elements`, `ChatSettings`, and `MessagesContainer` and may not be necessary for a widget:

| Package              | Size           | Pulled in by                                            |
| -------------------- | -------------- | ------------------------------------------------------- |
| plotly.js            | 10,900 KB      | `Elements` → `Plotly.tsx` → `react-plotly.js`           |
| pdfjs-dist           | 781 KB         | `Elements` → `PDF.tsx` → `react-pdf`                    |
| katex                | 613 KB         | `MessagesContainer` → Markdown → `rehype-katex`         |
| sucrase              | 460 KB         | Tailwind CSS (runtime processor?)                       |
| date-fns             | 332 KB         | `ChatSettings` → `DatePickerInput` → `react-day-picker` |
| parse5               | 282 KB         | Markdown → `rehype-raw` (HTML parser)                   |
| zod                  | 155 KB         | Frontend form validation                                |
| @tanstack/table-core | 113 KB         | `Elements` → `LazyDataframe`                            |
| react-hook-form      | 99 KB          | `ChatSettings` form management                          |
| react-player         | 130 KB         | `Elements` → video player                               |
| embla-carousel       | 48 KB          | `ChatSettings` → carousel component                     |
| **Subtotal**         | **~13,913 KB** | **67.9% of total bundle**                               |

---

## Proposed Solutions

### Solution 1: Add Frontend Path Mappings to Copilot's tsconfig

**Approach**: Duplicate the frontend's path mappings in copilot's tsconfig, adjusted for the relative directory difference.

```jsonc
// libs/copilot/tsconfig.json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*": [
        "./*", // copilot's own @/ imports
        "../../frontend/src/*" // frontend's @/ imports
      ],
      "client-types/*": [
        "../../libs/react-client/dist/*" // frontend's client-types alias
      ]
    }
  }
}
```

**Pros**:

- Minimal change (only `tsconfig.json`)
- No source code changes
- Quick to implement

**Cons**:

- `@/*` becomes ambiguous — TypeScript tries copilot path first, then frontend path; potential false resolution if both have a file with the same name
- **Does NOT solve bare module imports** (`components/...`, `hooks/...`) because those rely on `baseUrl` and there's only one `baseUrl` per tsconfig (~40 errors remain)
- Fragile: any new path alias in frontend must be duplicated in copilot
- Couples copilot's tsconfig to frontend's internal structure

**Verdict**: Partial fix (~75% of errors). Handles `@/` and `client-types/` but not bare imports.

---

### Solution 2: TypeScript Project References (`tsc -b`)

**Approach**: Use TypeScript's composite project references so that copilot references the frontend project. The frontend would emit `.d.ts` declarations that copilot consumes.

```jsonc
// libs/copilot/tsconfig.json
{
  "references": [
    { "path": "../../frontend" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

Frontend tsconfig already has `"composite": true`. Would need to remove `"noEmit": true` from frontend and configure `declarationDir`.

**Pros**:

- Architecturally correct TypeScript solution
- Each project uses its own tsconfig
- Incremental builds

**Cons**:

- **Does not help here** because copilot doesn't import from `@chainlit/app` (the package root) — it imports from `@chainlit/app/src/components/...` (deep source paths). Project references resolve the _package root_ to declaration output, not source sub-paths.
- Requires frontend to emit declarations (non-trivial for a complex app)
- Would need the frontend to define an `exports` map or copilot to change all import paths

**Verdict**: Only works if combined with changing import paths (see Solution 5 or 6).

---

### Solution 3: Separate Type-Check tsconfig for Copilot

**Approach**: Create a `tsconfig.typecheck.json` in copilot that extends the base config but adjusts resolution specifically for type-checking. Use `rootDirs` to create a virtual merged directory.

```jsonc
// libs/copilot/tsconfig.typecheck.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDirs": ["./src", "../../frontend/src"],
    "paths": {
      "@/*": ["./*", "../../frontend/src/*"],
      "client-types/*": ["../../libs/react-client/dist/*"]
    }
  }
}
```

Update `package.json`:

```json
"type-check": "tsc --noemit -p tsconfig.typecheck.json"
```

**Pros**:

- No changes to production tsconfig (IDE, Vite still use `tsconfig.json`)
- Can be as hacky as needed without affecting build
- `rootDirs` can help with bare module resolution

**Cons**:

- `rootDirs` doesn't change module resolution — it only affects output directory structure and relative import resolution between the listed roots. It won't make `components/Alert` resolve to `frontend/src/components/Alert`.
- Still can't solve bare imports via `baseUrl` (~40 errors remain)
- Extra config file to maintain

**Verdict**: Marginal improvement over Solution 1. Keeps production config clean but same fundamental limits.

---

### Solution 4: Frontend Barrel Exports (Source-Level)

**Approach**: Have the frontend expose an explicit public API that copilot imports, instead of reaching into source files.

Create `frontend/src/copilot-exports.ts`:

```typescript
// Explicit re-exports for copilot consumption
export { default as Alert } from './components/Alert';
export { Button } from './components/ui/button';
export {
  Popover,
  PopoverContent,
  PopoverTrigger
} from './components/ui/popover';
export { default as Starters } from './components/chat/Starters';
export { cn, hasMessage } from './lib/utils';
// ... all other components copilot needs
```

Add to `frontend/package.json`:

```json
{
  "exports": {
    "./copilot": "./src/copilot-exports.ts"
  }
}
```

Then copilot imports:

```typescript
import { Alert, Button, cn } from '@chainlit/app/copilot';
```

**Pros**:

- Clean API boundary
- Frontend controls what's public
- Single file to maintain
- tsc resolves it through one entry point

**Cons**:

- **Does NOT solve the transitive resolution problem**: tsc still follows imports inside `copilot-exports.ts` into the rest of the frontend source, hitting the same path alias issues in all 35 downstream files
- Requires changing copilot import paths (moderate source changes)
- Must keep the barrel file in sync

**Verdict**: Doesn't solve the root cause unless combined with declaration generation.

---

### Solution 5: Build Frontend Declarations (tsup) + Barrel Export

**Approach**: Build the frontend components that copilot needs into a declaration file (`.d.ts`) using tsup. Copilot consumes built type artifacts rather than source. This follows the same proven pattern as `@chainlit/react-client`.

#### Implementation

**1. Barrel file** — `frontend/src/copilot-exports.ts` (22 re-export lines):

```typescript
export { default as Alert } from './components/Alert';
export { default as ChatSettingsModal } from './components/ChatSettings';
export { ErrorBoundary } from './components/ErrorBoundary';
export { TaskList } from './components/Tasklist';
export { default as ChatFooter } from './components/chat/Footer';
export { default as MessagesContainer } from './components/chat/MessagesContainer';
export { default as ScrollContainer } from './components/chat/ScrollContainer';
export {
  default as Translator,
  useTranslation
} from './components/i18n/Translator';
export { default as Starters } from './components/chat/Starters';
export { Element } from './components/Elements';
export { default as AudioPresence } from './components/AudioPresence';
export { Logo } from './components/Logo';
export { default as ChatProfiles } from './components/header/ChatProfiles';
export { default as NewChatButton } from './components/header/NewChat';
export { Button } from './components/ui/button';
export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from './components/ui/dialog';
export {
  Popover,
  PopoverContent,
  PopoverTrigger
} from './components/ui/popover';
export { useLayoutMaxWidth } from './hooks/useLayoutMaxWidth';
export { useUpload } from './hooks/useUpload';
export { type IAttachment, attachmentsState } from './state/chat';
export { cn, hasMessage } from './lib/utils';
export { i18nSetupLocalization } from './i18n';
```

**2. Build script** — `frontend/package.json`:

```json
{
  "scripts": {
    "build:copilot-types": "tsup src/copilot-exports.ts --dts-only --outDir copilot-dist"
  }
}
```

**3. Path redirect** — `libs/copilot/tsconfig.json`:

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@chainlit/app/copilot": [
        "../../frontend/copilot-dist/copilot-exports.d.ts"
      ]
    }
  }
}
```

**4. Copilot imports** — 25 import lines across 7 files become ~7 consolidated imports:

```typescript
// Before (body.tsx — 11 lines):
import Alert from '@chainlit/app/src/components/Alert';
import ChatSettingsModal from '@chainlit/app/src/components/ChatSettings';
// ... 9 more

// After (body.tsx — 1 line):
import { Alert, ChatSettingsModal, ErrorBoundary, TaskList, ChatFooter,
  MessagesContainer, ScrollContainer, Translator, useLayoutMaxWidth,
  useUpload, IAttachment, attachmentsState } from '@chainlit/app/copilot';
```

#### Why Barrel + tsup (not multi-entry, not raw tsc)

- **TypeScript has no glob re-export syntax** — `export * from './**/*'` doesn't exist. The barrel must be an explicit list.
- **tsup bundles declarations** (via `rollup-plugin-dts`) — the output `.d.ts` is **self-contained**, all types inlined, no `@/` or `client-types/` imports leak through. Raw `tsc --emitDeclarationOnly` preserves original import paths, so the same alias mismatch would reappear.
- **`moduleResolution: "Node"`** (used by both projects) **ignores `exports` field** in `package.json`. Multi-entry approaches relying on `exports` maps would not work without upgrading `moduleResolution` to `"Node16"`/`"NodeNext"`/`"Bundler"` across the entire monorepo.
- **Single barrel = 1 entry point, 1 output file, 1 path mapping**. Multi-entry would need 22 tsup entry points + 22 path mappings.

**Pros**:

- **Fully solves the problem**: copilot sees `.d.ts` files, no transitive source resolution. `skipLibCheck: true` (already set) skips checking inside declarations.
- Follows the same pattern as `@chainlit/react-client` (proven in this repo)
- Clean architecture with explicit API boundary
- Frontend controls what's public

**Cons**:

- Requires a build step: `pnpm --filter @chainlit/app build:copilot-types` must run before copilot type-check
- ~25 import line changes in 7 copilot source files
- CI pipeline needs ordering
- tsup must handle the transitive dependency tree for `.d.ts` generation — may need config tuning for path aliases
- Must keep barrel file in sync when adding new imports

**Verdict**: Architecturally clean and fully solves the problem. Moderate effort. **Recommended for proper fix.**

---

### Solution 6: Extract `@chainlit/ui` Shared Package

**Approach**: Create a new workspace package `libs/ui/` containing the shared components (Alert, Button, Popover, etc.). Both frontend and copilot depend on it.

```
libs/ui/           → @chainlit/ui
  src/
    components/
      Alert.tsx
      ui/button.tsx
      ui/popover.tsx
      ui/dialog.tsx
      ...
    lib/utils.ts
    hooks/useLayoutMaxWidth.ts
    hooks/useUpload.tsx
    ...
  package.json     (with main/types pointing to dist/)
  tsconfig.json
```

**Pros**:

- Architecturally the "right" solution
- Clean dependency graph: `copilot → ui`, `frontend → ui`
- Each package has its own tsconfig, fully independent type checking
- Reusable for future packages

**Cons**:

- **Significant refactoring effort**: need to extract ~25 components/hooks, resolve their dependencies (some depend on `@chainlit/react-client` state atoms, Recoil, etc.)
- Some components (e.g., `MessagesContainer`, `ChatFooter`, `ChatSettings`) are deeply coupled to frontend state — may not be easily extractable
- Would also need to extract hooks (`useUpload`), state atoms (`attachmentsState`), and i18n config
- Risk of circular dependencies
- High risk of breaking changes

**Verdict**: Best long-term architecture but highest implementation cost. Not suitable for a quick fix.

---

### Solution 7: Use `paths` to Redirect `@chainlit/app/src/*` + Eliminate Conflicting Aliases

**Approach**: Instead of copilot's imports going through node_modules, map the entire `@chainlit/app/src/*` prefix in copilot's tsconfig, AND change frontend's internal imports to not conflict with copilot's aliases.

Step 1 — In copilot's tsconfig, map:

```jsonc
{
  "paths": {
    "@chainlit/app/src/*": ["../../frontend/src/*"],
    "@/*": ["./*"]
  }
}
```

Step 2 — Change frontend files imported by copilot to use **relative imports** instead of `@/` aliases.

**Pros**:

- Works with existing import structure in copilot (no copilot source changes)
- Relative imports in frontend are more portable

**Cons**:

- Must change 35+ frontend files to use relative imports
- `client-types/` and bare imports still need addressing
- Goes against the frontend's established code style

**Verdict**: Partial solution with significant frontend churn.

---

### Solution 8: Vite-Based Type Checking (`vite-plugin-checker`)

**Approach**: Replace `tsc --noemit` with Vite-integrated type checking.

**Verdict**: **Does not work** — `vite-plugin-checker` runs `tsc` under the hood in a worker. It does NOT use Vite's resolver for tsc. Same errors.

---

### Solution 9: Skip Copilot Type-Checking Entirely

**Approach**: Remove copilot from `type-check` or set it to always pass.

```json
"type-check": "echo 'Skipped: cross-project path alias conflict'"
```

**Pros**:

- Zero effort, zero risk
- Vite build already validates copilot compiles correctly
- Copilot has **no downstream TypeScript consumers** — it's an IIFE bundle
- IDE still provides type hints via `vite-tsconfig-paths`

**Cons**:

- Loses compile-time type safety for copilot
- CI won't catch type errors until build step
- Technical debt accumulates silently

**Verdict**: Pragmatic stopgap. More defensible than usual since copilot is a build artifact, not a library.

---

### Solution 10: Frontend Switches to Relative Imports Everywhere

**Approach**: Remove all `@/`, `client-types/`, and bare `baseUrl` imports from the frontend source, replacing with relative imports.

**Pros**:

- **Completely solves the problem** with zero changes to copilot
- Most portable and tool-agnostic approach

**Cons**:

- **170+ files** need changing in frontend
- Long relative paths hurt readability (`../../../../lib/utils`)
- Goes against modern frontend conventions
- High merge conflict risk

**Verdict**: Solves the problem completely but very high cost and DX regression.

---

### Solution 11: Aggressive Path Mapping (All Categories)

**Approach**: Map every import pattern the frontend uses — `@/`, `client-types/`, and all bare module prefixes — in copilot's tsconfig.

```jsonc
// libs/copilot/tsconfig.json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*", "../../frontend/src/*"],
      "client-types/*": ["../../libs/react-client/dist/*"],
      "components/*": ["../../frontend/src/components/*"],
      "hooks/*": ["../../frontend/src/hooks/*"],
      "state/*": ["../../frontend/src/state/*"],
      "types/*": ["../../frontend/src/types/*"],
      "contexts/*": ["../../frontend/src/contexts/*"]
    }
  }
}
```

**Pros**:

- Could resolve **all** error categories through tsconfig alone
- No source code changes in either project
- Quick to try

**Cons**:

- **Extremely fragile**: every bare import pattern in frontend must be mapped
- Copilot's own files could be shadowed if names collide
- `@/` dual resolution has silent false-match risk
- Vite-specific `?url` import still fails
- Any new import pattern in frontend breaks copilot's type-check

**Verdict**: Might work for ~95% of errors. Hacky but zero-source-change. Best option for "make CI green fast."

---

## Solution Comparison Matrix

| #   | Solution                           | Copilot Source Changes | Copilot tsconfig Changes | Frontend Changes   | Fully Solves?                     | Effort      | Fragility |
| --- | ---------------------------------- | ---------------------- | ------------------------ | ------------------ | --------------------------------- | ----------- | --------- |
| 1   | Add paths to copilot tsconfig      | None                   | Moderate                 | None               | **Partial** (~75%)                | Low         | Medium    |
| 2   | Project references                 | None                   | Small                    | Moderate           | **No** (deep imports bypass refs) | Medium      | Low       |
| 3   | Separate typecheck tsconfig        | None                   | New file                 | None               | **Partial** (~75%)                | Low         | Medium    |
| 4   | Frontend barrel exports (source)   | ~15 import changes     | None                     | New barrel file    | **No** (transitive issue)         | Medium      | Low       |
| 5   | **Compiled declarations + barrel** | ~25 import lines       | Small                    | Barrel + tsup step | **Yes**                           | Medium      | Low       |
| 6   | **Extract `@chainlit/ui`**         | ~25 import lines       | Small                    | Major refactor     | **Yes**                           | High        | Very Low  |
| 7   | Redirect paths + relative imports  | None                   | Small                    | 35+ files          | **Partial**                       | Medium-High | Medium    |
| 8   | Vite-based type checking           | None                   | None                     | None               | **No**                            | Low         | N/A       |
| 9   | Skip type-check                    | Script change          | None                     | None               | **N/A** (bypass)                  | None        | N/A       |
| 10  | All-relative imports in frontend   | None                   | None                     | 170+ files         | **Yes**                           | High        | Low       |
| 11  | **Aggressive path mapping**        | None                   | tsconfig only            | None               | **~95%**                          | Low         | High      |

---

## Recommended Approaches (Ranked)

### Tier 1 — Immediate (make CI green now)

**Solution 11** (aggressive path mapping) or **Solution 9** (skip type-check). These buy time with minimal risk.

### Tier 2 — Proper Fix, Moderate Effort

**Solution 5** (compiled declarations + barrel). Follows the `@chainlit/react-client` pattern already proven in this repo. Creates a clean API boundary. ~25 import line changes in copilot, one barrel file in frontend, one tsup build script.

### Tier 3 — Long-Term Architecture

**Solution 6** (extract `@chainlit/ui` shared package). Do this when the monorepo grows or when copilot needs more independence.

---

## Bundle Optimization Opportunities

Independent of type-checking, the bundle analysis reveals significant optimization potential:

### High Impact (if copilot doesn't need these features)

| Action                              | Savings (rendered) | Approach                                                 |
| ----------------------------------- | ------------------ | -------------------------------------------------------- |
| Exclude plotly.js                   | ~10,900 KB (53%)   | Lazy-load or exclude `Plotly.tsx` from `Elements` barrel |
| Exclude pdfjs-dist                  | ~781 KB (3.8%)     | Lazy-load or exclude `PDF.tsx` from `Elements` barrel    |
| Exclude katex                       | ~613 KB (3.0%)     | Use plain markdown without math rendering                |
| Exclude date-fns + react-day-picker | ~466 KB (2.3%)     | Simplify ChatSettings (no date picker)                   |
| Exclude sucrase + parse5            | ~742 KB (3.6%)     | Review if needed at runtime                              |

### Medium Impact

| Action                  | Savings  | Approach                                                                          |
| ----------------------- | -------- | --------------------------------------------------------------------------------- |
| Tree-shake lodash       | ~500 KB  | `import pick from 'lodash/pick'` instead of `import { pick } from 'lodash'`       |
| Deduplicate packages    | ~263 KB  | Add missing entries to `vite.config.ts` `resolve.alias` (`tailwind-merge`, `swr`) |
| Tree-shake highlight.js | Variable | Import only needed languages instead of all                                       |

### Relationship to Type-Checking Solutions

**Solution 5 (barrel export)** naturally enables bundle optimization: the barrel controls exactly what copilot imports at the type level, and a corresponding change at the Vite level (e.g., re-exporting a lightweight `Element` component that lazy-loads heavy renderers) would reduce bundle size without changing copilot's source code.

**Solution 6 (extract `@chainlit/ui`)** would inherently solve both problems — shared UI components wouldn't carry heavyweight dependencies like plotly.js.

---

## Open Questions / Next Steps

1. **Which tier to pursue?** Quick fix (Solution 11/9), proper fix (Solution 5), or long-term (Solution 6)?
2. **Bundle optimization scope**: Should copilot support Plotly/PDF/video rendering, or should those be frontend-only? This determines whether `Elements` needs to be included as-is or refactored.
3. **CI pipeline ordering**: If Solution 5 is chosen, the `build:copilot-types` step needs to run before `type-check`. Can this be integrated into the existing `pnpm type-check` script or does it need a separate CI step?
4. **`moduleResolution` upgrade**: Is upgrading from `"Node"` to `"Node16"` or `"Bundler"` on the roadmap? This would unlock `exports` map support and simplify cross-package resolution.
