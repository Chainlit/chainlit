import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    emptyOutDir: true,
    rollupOptions: {
      // input: {
      //   copilot: path.resolve(__dirname, 'index.tsx')
      // },
      output: [
        {
          name: 'chatpage',
          dir: '/mnt/d/client_works/avaia-chat/src/avaia_chat/public/chatpage',
          format: 'iife',
          entryFileNames: 'assets/index.js',
          inlineDynamicImports: true,
        }
      ]
    }
  },
  plugins: [react(), tsconfigPaths(), svgr()],
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
