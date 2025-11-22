import { query } from "./_generated/server";

export const get = query({
  handler: async () => {
    return {
      status: "ok",
      message: "ARA Voice Form Convex backend is running",
      timestamp: Date.now(),
    };
  },
});