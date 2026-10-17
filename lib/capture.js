import { beginPage, scrollPage, settlePage, restorePage } from "./page.js";
import { captureBounds, isCapturableUrl, LIMITS, pngBlob, pngDimensions, screenshotFilename } from "./shared.js";

export async function captureFullPage(tabId, { loadImages = true, onProgress = async () => {} } = {}) {
  const target = { tabId };
  let attached = false;
  let emulated = false;
  let contextId;

  async function command(method, params = {}) {
    let timer;
    try {
      return await Promise.race([
        chrome.debugger.sendCommand(target, method, params),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error("The page did not respond. Reload it and try again.")), LIMITS.commandTimeout);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  async function evaluate(fn, ...args) {
    const response = await command("Runtime.evaluate", {
      expression: `(${fn.toString()})(...${JSON.stringify(args)})`,
      contextId,
      awaitPromise: true,
      returnByValue: true,
    });
    if (response.exceptionDetails) {
      throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
    }
    return response.result.value;
  }

  try {
    await onProgress("Connecting to the page", 5);
    await chrome.debugger.attach(target, "1.3");
    attached = true;
    await command("Page.enable");
    const { frameTree } = await command("Page.getFrameTree");
    if (!isCapturableUrl(frameTree.frame.url)) {
      throw new Error("Open an HTTP or HTTPS website to capture it. Browser settings pages cannot be captured.");
    }
    ({ executionContextId: contextId } = await command("Page.createIsolatedWorld", {
      frameId: frameTree.frame.id,
      worldName: "full-page-capture",
    }));
    const original = await evaluate(beginPage);
    const deadline = Date.now() + LIMITS.prepareTimeout;
    let page = await evaluate(scrollPage, 0, loadImages);
    // Browser device emulation can differ from the native capture scale, so measure it.
    const { data: sample } = await command("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      clip: { x: 0, y: page.y, width: 10, height: 10, scale: 1 },
    });
    const pixelRatio = pngDimensions(sample).width / 10;
    captureBounds(page, pixelRatio);
    if (loadImages) {
      let stableBottom = 0;
      let finished = false;
      for (let step = 0; step < LIMITS.maxScrollSteps && Date.now() < deadline; step++) {
        const bottom = Math.max(0, page.height - page.viewport);
        const nextY = Math.min(page.y + Math.max(200, page.viewport * 0.8), bottom);
        const previousHeight = page.height;
        page = await evaluate(scrollPage, nextY, true);
        // Stop at the PNG height limit. Feeds can keep growing as they scroll.
        const { height: limit } = captureBounds(page, pixelRatio);
        if (limit < Math.ceil(page.height) && page.y + page.viewport >= limit) { finished = true; break; }
        await onProgress("Loading page images", 10 + Math.round(55 * Math.min(1, (page.y + page.viewport) / page.height)));
        stableBottom = page.y + page.viewport >= page.height - 2 && page.height === previousHeight ? stableBottom + 1 : 0;
        if (stableBottom >= 3) { finished = true; break; }
      }
      if (!finished) {
        throw new Error("The page keeps growing or is too long to prepare. Turn off 'Load page images' to capture its current content.");
      }
    }
    await onProgress("Preparing the full page", 72);
    let details = await evaluate(settlePage);
    if (details.url !== original.url) throw new Error("The page changed during capture. Try again.");
    let { cssContentSize, cssLayoutViewport } = await command("Page.getLayoutMetrics");
    // Virtual lists, such as X replies, render only rows near the viewport. Make the viewport as tall as the capture.
    const tallHeight = captureBounds(cssContentSize, pixelRatio).height;
    const viewportGrowth = tallHeight - cssLayoutViewport.clientHeight;
    if (viewportGrowth > 0) {
      await command("Emulation.setDeviceMetricsOverride", {
        width: cssLayoutViewport.clientWidth,
        height: tallHeight,
        deviceScaleFactor: 0,
        mobile: false,
      });
      emulated = true;
      details = await evaluate(settlePage);
      const { cssContentSize: tallSize } = await command("Page.getLayoutMetrics");
      // Sections sized to the viewport grow with it. Capture those pages with the normal viewport.
      if (tallSize.height - cssContentSize.height > viewportGrowth / 2) {
        await command("Emulation.clearDeviceMetricsOverride");
        emulated = false;
        details = await evaluate(settlePage);
        ({ cssContentSize } = await command("Page.getLayoutMetrics"));
      } else {
        cssContentSize = tallSize;
      }
    }
    const clip = captureBounds(cssContentSize, pixelRatio);
    await onProgress("Capturing the PNG", 85);
    const { data } = await command("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      fromSurface: true,
      clip,
    });
    const dimensions = pngDimensions(data);
    if (captureBounds(dimensions, 1).scale < 1) {
      throw new Error("The browser returned a PNG larger than expected. Reduce the browser zoom and try again.");
    }
    const blob = pngBlob(data);
    return {
      id: crypto.randomUUID(),
      ...details,
      ...dimensions,
      pixelRatio: dimensions.width / clip.width,
      pageWidth: clip.width,
      pageHeight: clip.height,
      scaledDown: clip.scale < 1,
      truncated: clip.height < Math.ceil(cssContentSize.height),
      createdAt: new Date().toISOString(),
      filename: screenshotFilename(details.url),
      blob,
      bytes: blob.size,
    };
  } finally {
    if (attached) {
      try { if (emulated) await command("Emulation.clearDeviceMetricsOverride"); } catch { /* Detaching also clears the override. */ }
      try { if (contextId) await evaluate(restorePage); } catch { /* Page closed or debugger canceled; page watchdog restores it. */ }
      try { await chrome.debugger.detach(target); } catch { /* The browser may have already detached. */ }
    }
  }
}
