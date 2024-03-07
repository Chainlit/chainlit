import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), svgr()],
  build: {
    rollupOptions: {
      input: {
        copilot: path.resolve(__dirname, 'index.tsx')
      },
      output: [
        {
          name: 'copilot',
          dir: '../../../avaia-chat/src/avaia_chat/public/copilot',
          format: 'iife',
          entryFileNames: 'index.js',
          inlineDynamicImports: true
        }
      ]
    }
  },
  resolve: {
    alias: {
      // To prevent conflicts with packages in @chainlit/react-components, we need to specify the resolution paths for these dependencies.
      react: path.resolve(__dirname, './node_modules/react'),
      '@mui/material': path.resolve(__dirname, './node_modules/@mui/material'),
      i18next: path.resolve(__dirname, './node_modules/i18next'),
      'react-i18next': path.resolve(__dirname, './node_modules/react-i18next'),
      '@mui/icons-material': path.resolve(
        __dirname,
        './node_modules/@mui/icons-material'
      ),
      '@mui/lab': path.resolve(__dirname, './node_modules/@mui/lab'),
      '@emotion/react': path.resolve(
        __dirname,
        './node_modules/@emotion/react'
      ),
      '@emotion/styled': path.resolve(
        __dirname,
        './node_modules/@emotion/styled'
      ),
      formik: path.resolve(__dirname, './node_modules/formik'),
      'usehooks-ts': path.resolve(__dirname, './node_modules/usehooks-ts'),
      lodash: path.resolve(__dirname, './node_modules/lodash'),
      recoil: path.resolve(__dirname, './node_modules/recoil')
    }
  }
});
