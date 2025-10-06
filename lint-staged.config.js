// eslint-disable-next-line no-undef
module.exports = {
  '**/*.{js,jsx,ts,tsx}': ['pnpm lint --fix', 'pnpm format --fix'],
  '**/*.{ts,tsx}': [() => 'pnpm type-check'],
  '**/*.py': [
    'uv run scripts/lint.py',
    'uv run scripts/format.py --check',
    'uv run scripts/type_check.py',
  ],
  '.github/workflows/**': ['actionlint']
};
