import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: "sqlite",
    schema: "./src/db/schema.ts",
    out: "./drizzle/migrations",
    driver: "d1-http",
    dbCredentials: {
        accountId: process.env.CF_ACCOUNT_ID || 'invalid',
        databaseId: process.env.CF_DATABASE_ID || 'invalid',
        token: process.env.CF_D1_TOKEN || 'invalid',
    },
});
