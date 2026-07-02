import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
let port;
let baseUrl;
let server;
let stoppingServer = false;

async function findFreePort() {
  const probe = createServer();
  probe.listen(0, "127.0.0.1");
  await once(probe, "listening");
  const address = probe.address();
  if (!address || typeof address === "string") {
    probe.close();
    throw new Error("Could not allocate a local test port");
  }
  const freePort = address.port;
  probe.close();
  await once(probe, "close");
  return freePort;
}

async function waitForServer(url, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url, { method: "HEAD" });
      if (response.ok) return;
    } catch {
      // Vite is still starting.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

test.beforeAll(async () => {
  port = await findFreePort();
  baseUrl = `http://127.0.0.1:${port}/`;
  server = spawn(
    "node",
    ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
    { cwd: root, stdio: "pipe" }
  );
  server.once("exit", (code) => {
    if (!stoppingServer && code !== null && code !== 0) {
      console.error(`Vite exited early with code ${code}`);
    }
  });
  await waitForServer(baseUrl);
});

test.afterAll(async () => {
  if (!server || server.killed) return;
  stoppingServer = true;
  server.kill("SIGTERM");
  await Promise.race([
    once(server, "exit"),
    new Promise((resolveWait) => setTimeout(resolveWait, 2000))
  ]);
});

test("renal guardian interactive risk flow", async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(baseUrl);
  await expect(page).toHaveTitle("腎安｜洗腎返家恢復期風險監測");
  await expect(page.getByRole("heading", { name: "腎安" })).toBeVisible();
  await expect(page.getByText("洗腎返家恢復期照護協作系統").first()).toBeVisible();
  await expect(page.getByText("不作為診斷、治療或緊急醫療決策依據")).toBeVisible();
  await expect(page.getByRole("region", { name: "系統總覽" })).toBeVisible();
  await expect(page.getByRole("region", { name: "照護端風險隊列" })).toContainText("A-203");

  const consoleNav = page.getByRole("navigation", { name: "Demo Console 導覽" });
  await consoleNav.getByRole("button", { name: "串聯流程" }).click();
  const stage = page.locator(".care-process-canvas");
  await expect(stage).toBeVisible();
  await expect
    .poll(async () =>
      stage.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        return Math.round(rect.width * rect.height);
      })
    )
    .toBeGreaterThan(200000);
  await expect(stage.getByText("Patient Signals").first()).toBeVisible();
  await expect(stage.getByText("Telemetry / event packet").first()).toBeVisible();
  await expect(stage.getByText("Risk engine pipeline").first()).toBeVisible();
  await expect(stage.getByText("Care Coordination").first()).toBeVisible();
  await expect(stage.getByText("Feedback").first()).toBeVisible();

  await expect(page.getByText("A-203").first()).toBeVisible();
  await expect(page.getByText("A-118").first()).toBeVisible();
  await expect(page.getByText("A-076").first()).toBeVisible();
  await expect(page.getByText("100").first()).toBeVisible();
  await expect(page.getByText("Critical｜已分派照護人員").first()).toBeVisible();
  await expect(page.getByText("caregiver update").first()).toBeVisible();

  const modeTabs = page.getByRole("navigation", { name: "流程視角" });
  await modeTabs.getByRole("button", { name: "手環監測" }).click();
  await expect(stage).toHaveClass(/mode-wearable/);
  await expect(page.getByText("手環低資料量監測").first()).toBeVisible();
  await expect(page.getByText("0.8 KB").first()).toBeVisible();
  await expect(page.getByText(/"patientId": "A-203"/).first()).toBeVisible();

  await modeTabs.getByRole("button", { name: "床邊求助" }).click();
  await expect(stage).toHaveClass(/mode-bedside/);
  await expect(page.getByText("床邊求助事件").first()).toBeVisible();
  await expect(page.getByText(/"source": "wristband"/).first()).toBeVisible();
  await expect(page.getByText(/"priority": "urgent"/).first()).toBeVisible();

  await modeTabs.getByRole("button", { name: "照護團隊處理" }).click();
  await expect(stage).toHaveClass(/mode-team/);
  await expect(page.getByText("照護協調隊列").first()).toBeVisible();
  await expect(page.getByText(/A-203｜Critical｜已分派照護人員/).first()).toBeVisible();

  await consoleNav.getByRole("button", { name: "風險引擎" }).click();
  const scoreCard = page.getByRole("region", { name: "風險分數" });
  await expect(scoreCard).toContainText("100");
  await expect(scoreCard).toContainText("Critical｜最高照護協作優先級｜已分派照護人員");
  await expect(scoreCard).toContainText("展示分數封頂為 100");

  await page.getByRole("button", { name: "A-118 70" }).click();
  await expect(scoreCard).toContainText("70");
  await expect(scoreCard).toContainText("30 分鐘內追蹤");

  await page.getByRole("button", { name: "A-076 0" }).click();
  await expect(scoreCard).toContainText("0");
  await expect(scoreCard).toContainText("例行觀察");
});
