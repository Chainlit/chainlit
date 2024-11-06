// eslint-disable-next-line no-undef
module.exports = {
  '**/*.{js,jsx,ts,tsx}': ['npx prettier --write', 'npx eslint --fix'],
  '**/*.{ts,tsx}': [() => 'tsc --skipLibCheck --noEmit'],
  '**/*.py': [
    'cd backend && poetry run ruff check --fix',
    'cd backend && poetry run ruff format',
    () => 'pnpm run lintPython'
  ],
  '.github/{workflows,actions}/**': ['actionlint']
};
