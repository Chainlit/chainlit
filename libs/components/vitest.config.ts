/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup-tests.ts',
    include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)']
  }
});
