export const LIMITS = Object.freeze({
  // Chrome fails to capture taller images on common GPUs.
  maxDimension: 16384,
  maxPixels: 64_000_000,
  // Smallest output pixels per CSS pixel before text becomes unreadable.
  minPixelRatio: 0.5,
  maxScrollSteps: 100,
  prepareTimeout: 25_000,
  commandTimeout: 15_000,
});

export function isCapturableUrl(value) {
  try {
    return ["https:", "http:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function captureBounds(size, pixelRatio = 1) {
  const width = Math.ceil(size.width);
  const height = Math.ceil(size.height);
  if (![width, height, pixelRatio].every((n) => Number.isFinite(n) && n > 0)) {
    throw new Error("The page has no valid size. Reload the page and try again.");
  }
  // Scale the PNG down to fit the limits. Round down so rounded output pixels stay inside them.
  const fit = Math.min(
    1,
    LIMITS.maxDimension / (width * pixelRatio),
    LIMITS.maxDimension / (height * pixelRatio),
    Math.sqrt(LIMITS.maxPixels / (width * height * pixelRatio ** 2)),
  );
  const scale = fit < 1 ? Math.floor(fit * 0.999 * 10_000) / 10_000 : 1;
  if (scale * pixelRatio < LIMITS.minPixelRatio) {
    throw new Error("This page is too large for one PNG. Turn off 'Load page images' to capture less of it, or reduce the browser zoom.");
  }
  return { x: 0, y: 0, width, height, scale };
}

export function pngDimensions(base64) {
  const bytes = Uint8Array.from(atob(base64.slice(0, 44)), (char) => char.charCodeAt(0));
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 24 || signature.some((byte, i) => bytes[i] !== byte)) {
    throw new Error("The browser did not return a PNG. Try the capture again.");
  }
  const view = new DataView(bytes.buffer);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

export function pngBlob(base64) {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: "image/png" });
}

export function screenshotFilename(url, date = new Date()) {
  const page = new URL(url);
  const name = `${page.hostname}${page.pathname}`
    .normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "").slice(0, 110) || "page";
  const time = date.toISOString().replace(/[:.]/g, "-");
  return `${name}-${time}.png`;
}

export function readableError(error) {
  const message = error?.message || String(error);
  if (/another debugger|already attached/i.test(message)) {
    return "Another tool is connected to this tab. Close its developer tools and try again.";
  }
  if (/No tab|No target|closed|Cannot find context|context.*destroyed|not attached/i.test(message)) {
    return "The page changed, closed, or stopped the capture. Keep the page open and try again.";
  }
  if (/Cannot access|not allowed|restricted|Cannot attach/i.test(message)) {
    return "Brave blocked capture on this page. Open a normal website tab and try again.";
  }
  return message;
}

export function formatBytes(bytes) {
  return bytes < 1_000_000 ? `${Math.ceil(bytes / 1000)} KB` : `${(bytes / 1_000_000).toFixed(1)} MB`;
}
