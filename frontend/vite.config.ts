import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';
import { sentryVitePlugin } from "@sentry/vite-plugin";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tsconfigPaths(), 
    svgr(),
    sentryVitePlugin({
      org: "insign",
      project: "avaia-chat",
      authToken: process.env.REACT_APP_SOURCE_MAP_AUTH
    }),
  ],
  build: {
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      // input: {
      //   copilot: path.resolve(__dirname, 'index.tsx')
      // },
      output: [
        {
          name: 'chatpage',
          dir: '../../avaia-chat/src/avaia_chat/public/chatpage',
          format: 'iife',
          entryFileNames: 'assets/index.js',
          inlineDynamicImports: true,
        }
      ]
    }
  },
  resolve: {
    alias: {
      // To prevent conflicts with packages in @chainlit/react-components, we need to specify the resolution paths for these dependencies.
      react: path.resolve(__dirname, './node_modules/react'),
      '@mui/material': path.resolve(__dirname, './node_modules/@mui/material'),
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
