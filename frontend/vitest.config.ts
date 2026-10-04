/// <reference types="vitest" />
import path from 'path';
import { mergeConfig } from 'vite';
import { defineConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    resolve: {
      alias: {
        '@chainlit/react-client': path.resolve(
          __dirname,
          '../libs/react-client/src/index.ts'
        )
      }
    },
    test: {
      environment: 'jsdom',
      setupFiles: './tests/setup-tests.ts',
      include: ['./**/*.{test,spec}.?(c|m)[jt]s?(x)']
    }
  })
);
