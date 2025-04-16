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
    svgr({
      svgrOptions: {
        svgo: true,
        replaceAttrValues: { 'black': 'currentColor' }
      }
    }),
    // sentryVitePlugin({
    //   org: "insign",
    //   project: "avaia-chat",
    //   authToken: process.env.REACT_APP_SOURCE_MAP_AUTH
    // }),
  ],
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        creator: path.resolve(__dirname, 'index.tsx')
      },
      output: [
        {
          name: 'creator',
          dir: '../../../avaia-chat/src/avaia_chat/public/evoya-creator',
          format: 'iife',
          entryFileNames: 'index.js',
          inlineDynamicImports: true
        }
      ]
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    }
  }
});
