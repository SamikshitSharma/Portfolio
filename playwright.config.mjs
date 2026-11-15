import { defineConfig } from "@playwright/test";

const external = process.env.PORTFOLIO_TEST_URL;

export default defineConfig({
  testDir: "./tests",
  workers: 1,
  timeout: 90_000,
  use: {
    baseURL: external ?? "http://127.0.0.1:4380",
    channel: "chrome",
    colorScheme: "dark",
    viewport: { width: 1440, height: 900 },
    launchOptions: { args: ["--enable-unsafe-swiftshader"] },
  },
  webServer: external ? undefined : {
    command: "node ./node_modules/astro/bin/astro.mjs preview --host 127.0.0.1 --port 4380",
    url: "http://127.0.0.1:4380",
    reuseExistingServer: !process.env.CI,
  },
});
