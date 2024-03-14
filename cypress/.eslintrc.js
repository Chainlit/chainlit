module.exports = {
  rules: {
    'no-undef': 'warn',
    '@typescript-eslint/no-var-requires': 'warn',
    'cypress/no-unnecessary-waiting': 'warn',
    'cypress/unsafe-to-chain-command': 'warn',
    'cypress/no-assigning-return-values': 'warn',
    'no-sparse-arrays': 'warn'
  },
  env: {
    node: true,
    'cypress/globals': true
  },
  extends: ['plugin:cypress/recommended']
};
