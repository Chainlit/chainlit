// eslint-disable-next-line no-undef
module.exports = {
  "**/*.{js,jsx,ts,tsx}": ["npx prettier --write", "npx eslint --fix"],
  "**/*.{ts,tsx}": [() => "tsc --skipLibCheck --noEmit"],
  "**/*.py": ["black", "isort --profile=black"],
};
