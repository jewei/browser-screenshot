import { launchBrave } from "./browser.mjs";
import { isCapturableUrl } from "../lib/shared.js";

const url = process.argv[2] || "https://github.com/jewei";
if (!isCapturableUrl(url)) throw new Error("Use an HTTP or HTTPS page URL.");
const browser = await launchBrave({ headless: false });
const closed = new Promise((resolve) => browser.context.once("close", resolve));
const stop = () => { browser.context.close().catch(() => {}); };
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
try {
  const page = browser.context.pages()[0];
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.bringToFront();
  await browser.worker.evaluate(() => chrome.action.openPopup());
  console.log("Brave is open with Full Page loaded. Select 'Capture full page'.");
  console.log("This demo uses a temporary profile. Close its Brave window to stop it.");
  console.log("For daily use, load this project folder at brave://extensions. See README.md.");
  await closed;
} finally {
  process.removeListener("SIGINT", stop);
  process.removeListener("SIGTERM", stop);
  await browser.close();
}
