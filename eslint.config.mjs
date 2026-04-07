import { includeIgnoreFile } from '@eslint/compat';
import eslint from '@eslint/js';
import chaiFriendly from 'eslint-plugin-chai-friendly';
import cypressPlugin from 'eslint-plugin-cypress';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

export default defineConfig([
  includeIgnoreFile(gitignorePath),

  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  {
    linterOptions: {
      reportUnusedDisableDirectives: true
    },
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ]
    }
  },

  {
    files: ['*.config.{js,mjs,cjs,ts}', 'scripts/**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: globals.node
    }
  },

  {
    files: ['libs/react-client/**/*.js'],
    languageOptions: {
      globals: globals.browser
    }
  },

  {
    files: ['cypress/**/*.ts'],
    ...cypressPlugin.configs.recommended,
    plugins: {
      ...cypressPlugin.configs.recommended.plugins,
      ...chaiFriendly.configs.recommendedFlat.plugins
    },
    rules: {
      ...cypressPlugin.configs.recommended.rules,
      ...chaiFriendly.configs.recommendedFlat.rules
    }
  }
]);
