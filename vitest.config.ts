import { defineConfig } from "vitest/config";
import { config } from "dotenv";

// Next.js auto-loads .env.local; Vitest doesn't. Several lib/ modules create
// a Supabase client at import time (matching the rest of the codebase), so
// tests importing them need these vars present even when only exercising
// pure functions from the same file.
config({ path: ".env.local" });

export default defineConfig({
  test: {
    environment: "node",
  },
});
