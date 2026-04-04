module.exports = {
  'frontend/**/*.{ts,tsx}': [
    'pnpm --filter @chainlit/app lint --fix',
    'prettier --write',
    () => 'pnpm --filter @chainlit/app type-check'
  ],

  'libs/react-client/**/*.{ts,tsx}': [
    'pnpm --filter @chainlit/react-client lint --fix',
    'prettier --write',
    () => 'pnpm --filter @chainlit/react-client type-check'
  ],

  'libs/copilot/**/*.{ts,tsx}': [
    'pnpm --filter @chainlit/copilot lint --fix',
    'prettier --write',
    () => 'pnpm --filter @chainlit/copilot type-check'
  ],

  'cypress/**/*.ts': ['eslint --fix', 'prettier --write'],

  '*.{js,cjs,mjs}': ['eslint --fix', 'prettier --write'],

  'backend/**/*.py': [
    'uv run scripts/lint.py',
    'uv run scripts/format.py --check',
    () => 'uv run scripts/type_check.py'
  ],

  '.github/workflows/**': ['actionlint']
};
