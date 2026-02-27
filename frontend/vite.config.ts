import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { defineConfig } from 'vite';
import viteCompression from 'vite-plugin-compression';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-accordion',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch',
            '@radix-ui/react-slider',
            '@radix-ui/react-scroll-area',
            'lucide-react'
          ],
          'vendor-markdown': [
            'react-markdown',
            'rehype-katex',
            'rehype-raw',
            'remark-gfm',
            'remark-math',
            'remark-directive',
            'highlight.js'
          ],
          'vendor-utils': ['lodash', 'uuid', 'zod', 'i18next', 'react-i18next']
        }
      }
    }
  },
  plugins: [
    react(),
    tsconfigPaths(),
    svgr(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
      deleteOriginFile: false
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      deleteOriginFile: false
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // To prevent conflicts with packages in @chainlit/react-client, we need to specify the resolution paths for these dependencies.
      react: path.resolve(__dirname, './node_modules/react'),
      'usehooks-ts': path.resolve(__dirname, './node_modules/usehooks-ts'),
      sonner: path.resolve(__dirname, './node_modules/sonner'),
      lodash: path.resolve(__dirname, './node_modules/lodash'),
      recoil: path.resolve(__dirname, './node_modules/recoil')
    }
  }
});
