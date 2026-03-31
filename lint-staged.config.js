// eslint-disable-next-line no-undef
module.exports = {
  '**/*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '**/*.{ts,tsx}': [() => 'pnpm type-check'],
  '**/*.py': [
    'uv run ruff check',
    'uv run ruff format --check',
    () => 'uv run dmypy run -- backend/'
  ],
  '.github/workflows/**': ['actionlint']
};
