// eslint-disable-next-line no-undef
module.exports = {
  '**/*.{js,jsx,ts,tsx}': ['npx prettier --write', 'npx eslint --fix'],
  '**/*.{ts,tsx}': [() => 'tsc --skipLibCheck --noEmit'],
  '**/*.py': ['ruff check --fix', 'ruff format', () => 'pnpm run lintPython'],
  '.github/{workflows,actions}/**': ['actionlint']
};
