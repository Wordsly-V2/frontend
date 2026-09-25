import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests for pure logic only (`lib/**/*.test.ts`); UI is checked by hand.
export default defineConfig({
    resolve: {
        alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
    },
    test: {
        include: ["lib/**/*.test.ts"],
        environment: "node",
    },
});
