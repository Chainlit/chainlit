// eslint-disable-next-line no-undef
module.exports = {
  '**/*.{js,jsx,ts,tsx}': ['npx prettier --write', 'npx eslint --fix'],
  '**/*.{ts,tsx}': [() => 'tsc --skipLibCheck --noEmit'],
  '**/*.py': [
    'poetry run -C backend ruff check --fix',
    'poetry run -C backend ruff format',
    () => 'pnpm run lintPython'
  ],
  '.github/{workflows,actions}/**': ['actionlint']
};
