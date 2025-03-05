// vite.config.ts
import react from "file:///mnt/d/chainlit/libs/copilot/node_modules/.pnpm/@vitejs+plugin-react-swc@3.3.2_vite@5.4.14_@types+node@20.5.7_/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { defineConfig } from "file:///mnt/d/chainlit/libs/copilot/node_modules/.pnpm/vite@5.4.14_@types+node@20.5.7/node_modules/vite/dist/node/index.js";
import svgr from "file:///mnt/d/chainlit/libs/copilot/node_modules/.pnpm/vite-plugin-svgr@4.2.0_rollup@4.24.0_typescript@5.2.2_vite@5.4.14_@types+node@20.5.7_/node_modules/vite-plugin-svgr/dist/index.js";
import tsconfigPaths from "file:///mnt/d/chainlit/libs/copilot/node_modules/.pnpm/vite-tsconfig-paths@4.2.0_typescript@5.2.2_vite@5.4.14_@types+node@20.5.7_/node_modules/vite-tsconfig-paths/dist/index.mjs";
var __vite_injected_original_dirname = "/mnt/d/chainlit/libs/copilot";
var vite_config_default = defineConfig({
  plugins: [react(), tsconfigPaths(), svgr()],
  build: {
    rollupOptions: {
      input: {
        copilot: path.resolve(__vite_injected_original_dirname, "index.tsx")
      },
      output: [
        {
          name: "copilot",
          dir: "/mnt/d/client_works/avaia-chat/src/avaia_chat/public/copilot",
          format: "iife",
          entryFileNames: "index.js",
          inlineDynamicImports: true
        }
      ]
    }
  },
  resolve: {
    alias: {
      // To prevent conflicts with packages in @chainlit/app, we need to specify the resolution paths for these dependencies.
      react: path.resolve(__vite_injected_original_dirname, "./node_modules/react"),
      "@chainlit/copilot": path.resolve(__vite_injected_original_dirname, ""),
      "@chainlit": path.resolve(__vite_injected_original_dirname, "./node_modules/@chainlit"),
      postcss: path.resolve(__vite_injected_original_dirname, "./node_modules/postcss"),
      tailwindcss: path.resolve(__vite_injected_original_dirname, "./node_modules/tailwindcss"),
      i18next: path.resolve(__vite_injected_original_dirname, "./node_modules/i18next"),
      sonner: path.resolve(__vite_injected_original_dirname, "./node_modules/sonner"),
      "highlight.js": path.resolve(__vite_injected_original_dirname, "./node_modules/highlight.js"),
      "react-i18next": path.resolve(__vite_injected_original_dirname, "./node_modules/react-i18next"),
      "usehooks-ts": path.resolve(__vite_injected_original_dirname, "./node_modules/usehooks-ts"),
      lodash: path.resolve(__vite_injected_original_dirname, "./node_modules/lodash"),
      recoil: path.resolve(__vite_injected_original_dirname, "./node_modules/recoil")
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvbW50L2QvY2hhaW5saXQvbGlicy9jb3BpbG90XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvbW50L2QvY2hhaW5saXQvbGlicy9jb3BpbG90L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9tbnQvZC9jaGFpbmxpdC9saWJzL2NvcGlsb3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xyXG5pbXBvcnQgc3ZnciBmcm9tICd2aXRlLXBsdWdpbi1zdmdyJztcclxuaW1wb3J0IHRzY29uZmlnUGF0aHMgZnJvbSAndml0ZS10c2NvbmZpZy1wYXRocyc7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtyZWFjdCgpLCB0c2NvbmZpZ1BhdGhzKCksIHN2Z3IoKV0sXHJcbiAgYnVpbGQ6IHtcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgaW5wdXQ6IHtcclxuICAgICAgICBjb3BpbG90OiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnaW5kZXgudHN4JylcclxuICAgICAgfSxcclxuICAgICAgb3V0cHV0OiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgbmFtZTogJ2NvcGlsb3QnLFxyXG4gICAgICAgICAgZGlyOiAnL21udC9kL2NsaWVudF93b3Jrcy9hdmFpYS1jaGF0L3NyYy9hdmFpYV9jaGF0L3B1YmxpYy9jb3BpbG90JyxcclxuICAgICAgICAgIGZvcm1hdDogJ2lpZmUnLFxyXG4gICAgICAgICAgZW50cnlGaWxlTmFtZXM6ICdpbmRleC5qcycsXHJcbiAgICAgICAgICBpbmxpbmVEeW5hbWljSW1wb3J0czogdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgICAgXVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgLy8gVG8gcHJldmVudCBjb25mbGljdHMgd2l0aCBwYWNrYWdlcyBpbiBAY2hhaW5saXQvYXBwLCB3ZSBuZWVkIHRvIHNwZWNpZnkgdGhlIHJlc29sdXRpb24gcGF0aHMgZm9yIHRoZXNlIGRlcGVuZGVuY2llcy5cclxuICAgICAgcmVhY3Q6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL25vZGVfbW9kdWxlcy9yZWFjdCcpLFxyXG4gICAgICAnQGNoYWlubGl0L2NvcGlsb3QnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnJyksXHJcbiAgICAgICdAY2hhaW5saXQnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9ub2RlX21vZHVsZXMvQGNoYWlubGl0JyksXHJcbiAgICAgIHBvc3Rjc3M6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL25vZGVfbW9kdWxlcy9wb3N0Y3NzJyksXHJcbiAgICAgIHRhaWx3aW5kY3NzOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9ub2RlX21vZHVsZXMvdGFpbHdpbmRjc3MnKSxcclxuICAgICAgaTE4bmV4dDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vbm9kZV9tb2R1bGVzL2kxOG5leHQnKSxcclxuICAgICAgc29ubmVyOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9ub2RlX21vZHVsZXMvc29ubmVyJyksXHJcbiAgICAgICdoaWdobGlnaHQuanMnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9ub2RlX21vZHVsZXMvaGlnaGxpZ2h0LmpzJyksXHJcbiAgICAgICdyZWFjdC1pMThuZXh0JzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vbm9kZV9tb2R1bGVzL3JlYWN0LWkxOG5leHQnKSxcclxuICAgICAgJ3VzZWhvb2tzLXRzJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vbm9kZV9tb2R1bGVzL3VzZWhvb2tzLXRzJyksXHJcbiAgICAgIGxvZGFzaDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vbm9kZV9tb2R1bGVzL2xvZGFzaCcpLFxyXG4gICAgICByZWNvaWw6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL25vZGVfbW9kdWxlcy9yZWNvaWwnKSxcclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXNRLE9BQU8sV0FBVztBQUN4UixPQUFPLFVBQVU7QUFDakIsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxVQUFVO0FBQ2pCLE9BQU8sbUJBQW1CO0FBSjFCLElBQU0sbUNBQW1DO0FBT3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLEdBQUcsY0FBYyxHQUFHLEtBQUssQ0FBQztBQUFBLEVBQzFDLE9BQU87QUFBQSxJQUNMLGVBQWU7QUFBQSxNQUNiLE9BQU87QUFBQSxRQUNMLFNBQVMsS0FBSyxRQUFRLGtDQUFXLFdBQVc7QUFBQSxNQUM5QztBQUFBLE1BQ0EsUUFBUTtBQUFBLFFBQ047QUFBQSxVQUNFLE1BQU07QUFBQSxVQUNOLEtBQUs7QUFBQSxVQUNMLFFBQVE7QUFBQSxVQUNSLGdCQUFnQjtBQUFBLFVBQ2hCLHNCQUFzQjtBQUFBLFFBQ3hCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUE7QUFBQSxNQUVMLE9BQU8sS0FBSyxRQUFRLGtDQUFXLHNCQUFzQjtBQUFBLE1BQ3JELHFCQUFxQixLQUFLLFFBQVEsa0NBQVcsRUFBRTtBQUFBLE1BQy9DLGFBQWEsS0FBSyxRQUFRLGtDQUFXLDBCQUEwQjtBQUFBLE1BQy9ELFNBQVMsS0FBSyxRQUFRLGtDQUFXLHdCQUF3QjtBQUFBLE1BQ3pELGFBQWEsS0FBSyxRQUFRLGtDQUFXLDRCQUE0QjtBQUFBLE1BQ2pFLFNBQVMsS0FBSyxRQUFRLGtDQUFXLHdCQUF3QjtBQUFBLE1BQ3pELFFBQVEsS0FBSyxRQUFRLGtDQUFXLHVCQUF1QjtBQUFBLE1BQ3ZELGdCQUFnQixLQUFLLFFBQVEsa0NBQVcsNkJBQTZCO0FBQUEsTUFDckUsaUJBQWlCLEtBQUssUUFBUSxrQ0FBVyw4QkFBOEI7QUFBQSxNQUN2RSxlQUFlLEtBQUssUUFBUSxrQ0FBVyw0QkFBNEI7QUFBQSxNQUNuRSxRQUFRLEtBQUssUUFBUSxrQ0FBVyx1QkFBdUI7QUFBQSxNQUN2RCxRQUFRLEtBQUssUUFBUSxrQ0FBVyx1QkFBdUI7QUFBQSxJQUN6RDtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
