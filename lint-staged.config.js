// eslint-disable-next-line no-undef
module.exports = {
  '**/*.{js,jsx,ts,tsx}': ['npx prettier --write', 'npx eslint --fix'],
  '**/*.{ts,tsx}': [() => 'tsc --skipLibCheck --noEmit'],
  '**/*.py': [
    'uv run --directory backend ruff check --fix',
    'uv run --directory backend ruff format',
    () => 'pnpm run lintPython'
  ]
};
