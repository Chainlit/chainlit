/// <reference types="vitest" />
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: './setup-tests.ts',
    include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)']
  },
  plugins: [react(), tsconfigPaths()]
});
