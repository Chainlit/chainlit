import { defineConfig } from "cypress";

export default defineConfig({
  projectId: "ij1tyk",
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },

  e2e: {
    supportFile: false,
    defaultCommandTimeout: 10000,
    video: false,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
