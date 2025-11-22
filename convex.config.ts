import { defineConfig } from "convex-dev";

export default defineConfig({
  server: {
    // Enable functions for production
    functions: {
      // All functions in convex/ directory
      "convex/*": {
        // Configure any function-specific options here
      },
    },
  },
  // External packages to make available in functions
  externalPackages: ["@rork-ai/toolkit-sdk"],
});