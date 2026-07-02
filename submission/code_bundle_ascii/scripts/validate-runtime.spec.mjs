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
  await expect(page.getByText("不作為醫療診斷")).toBeVisible();

  const canvas = page.locator(".care-scene-frame canvas");
  await expect(canvas).toBeVisible();
  await expect
    .poll(async () =>
      canvas.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        return Math.round(rect.width * rect.height);
      })
    )
    .toBeGreaterThan(200000);

  await expect(page.getByText("A-203").first()).toBeVisible();
  await expect(page.getByText("A-118").first()).toBeVisible();
  await expect(page.getByText("A-076").first()).toBeVisible();
  await expect(page.getByText("100").first()).toBeVisible();
  await expect(page.getByText("Critical｜立即關注").first()).toBeVisible();
  await expect(page.getByText("最終分數上限封頂為 100").first()).toBeVisible();

  await page.getByLabel("三端模組 3D 展示").getByRole("button", { name: "手環監測" }).click();
  await expect(page.getByText("手環低資料量監測")).toBeVisible();
  await expect(page.getByText("0.8 KB").first()).toBeVisible();
  await expect(page.getByText("device packet → API").first()).toBeVisible();

  await page.getByRole("button", { name: "手環資料" }).click();
  await expect(page.getByText("已接收 A-203 手環封包").first()).toBeVisible();

  await page.getByLabel("三端模組 3D 展示").getByRole("button", { name: "床邊求助" }).click();
  await expect(page.getByText("床邊求助事件 +40").first()).toBeVisible();
  await expect(page.getByText("呼叫訊號送出").first()).toBeVisible();

  await page.getByRole("button", { name: "床邊求助" }).last().click();
  await expect(page.getByText("已建立床邊求助事件").first()).toBeVisible();

  await page.getByLabel("三端模組 3D 展示").getByRole("button", { name: "照護團隊處理" }).click();
  await expect(page.getByText("照護端風險分流").first()).toBeVisible();
  await expect(page.getByText(/HR 低於個人基準/).first()).toBeVisible();
  await expect(page.getByText("通知家屬").first()).toBeVisible();

  await page.getByRole("button", { name: "立即關注" }).first().click();
  await expect(page.getByText("已通知照護端與家屬").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "已分派" }).first()).toBeVisible();
});
