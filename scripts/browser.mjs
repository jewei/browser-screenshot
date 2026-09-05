import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

export const root = fileURLToPath(new URL("../", import.meta.url));

async function bravePath() {
  const candidates = process.env.BRAVE_PATH ? [process.env.BRAVE_PATH] : {
    darwin: ["/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"],
    linux: ["/usr/bin/brave-browser", "/usr/bin/brave", "/opt/brave.com/brave/brave-browser"],
    win32: [
      path.join(process.env.PROGRAMFILES || "C:\\Program Files", "BraveSoftware/Brave-Browser/Application/brave.exe"),
      path.join(process.env.LOCALAPPDATA || "", "BraveSoftware/Brave-Browser/Application/brave.exe"),
    ],
  }[process.platform] || [];
  for (const candidate of candidates) {
    try { await access(candidate); return candidate; } catch { /* Try the next installation. */ }
  }
  throw new Error("Brave was not found. Set BRAVE_PATH to the Brave executable.");
}

export async function launchBrave({ headless = true, deviceScaleFactor = 1, viewport = { width: 1440, height: 900 } } = {}) {
  const executablePath = await bravePath();
  const profile = await mkdtemp(path.join(tmpdir(), "full-page-brave-"));
  let context;
  try {
    context = await chromium.launchPersistentContext(profile, {
      executablePath,
      channel: "chromium",
      headless,
      viewport,
      deviceScaleFactor,
      acceptDownloads: true,
      ignoreDefaultArgs: ["--disable-extensions"],
      args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`, "--no-first-run", "--no-default-browser-check"],
    });
    const worker = context.serviceWorkers()[0] || await context.waitForEvent("serviceworker", { timeout: 15_000 });
    const extensionId = new URL(worker.url()).host;
    return {
      context,
      worker,
      extensionId,
      async close() {
        await context.close();
        await rm(profile, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await context?.close();
    await rm(profile, { recursive: true, force: true });
    throw error;
  }
}
