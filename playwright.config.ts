import { defineConfig } from "@playwright/test";
import fs from "fs";
import path from "path";

function loadDotEnv(): void {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function normalizeBaseUrl(value: string | undefined): string {
  const fallback = "https://app.actimo.com/admin";
  if (!value) {
    return fallback;
  }

  return value.replace(/\/login\/?$/i, "");
}

loadDotEnv();
const runStamp = new Date().toISOString().replace(/[:.]/g, "-");

export default defineConfig({
  testDir: "./tests",
  outputDir: `./playwright-artifacts/${runStamp}`,
  timeout: 120_000,
  workers: 1,
  expect: {
    timeout: 10_000,
  },
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: normalizeBaseUrl(process.env.ACTIMO_BASE_URL),
    browserName: "chromium",
    channel: "msedge",
    headless: true,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    viewport: { width: 1440, height: 900 },
  },
});
