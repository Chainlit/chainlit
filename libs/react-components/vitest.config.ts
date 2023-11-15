/// <reference types="vitest" />
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup-tests.ts',
    include: ['./**/*.{test,spec}.?(c|m)[jt]s?(x)']
  },
  resolve: {
    alias: {
      recoil: path.resolve(__dirname, './node_modules/recoil')
    }
  }
});
