module.exports = {
  '**/*': ['pnpm format:files'],

  '**/*.{ts,tsx,js,cjs,mjs}': ['pnpm lint:fix'],

  'frontend/**/*.{ts,tsx}': [() => 'pnpm --filter @chainlit/app type-check'],

  'libs/react-client/**/*.{ts,tsx}': [
    () => 'pnpm --filter @chainlit/react-client type-check'
  ],

  // TODO: Re-enable copilot type-check after fixing cross-project path alias mismatch.
  // See docs/research/copilot-type-checking.md for analysis and proposed solutions.
  // 'libs/copilot/**/*.{ts,tsx}': [
  //   () => 'pnpm --filter @chainlit/copilot type-check'
  // ],

  'backend/**/*.py': [
    'uv run scripts/lint.py',
    'uv run scripts/format.py --check',
    () => 'uv run scripts/type_check.py'
  ],

  '.github/workflows/**': ['uv run actionlint']
};
