export const LIMITS = Object.freeze({
  maxDimension: 32767,
  maxPixels: 64_000_000,
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
  const pixelWidth = Math.ceil(width * pixelRatio);
  const pixelHeight = Math.ceil(height * pixelRatio);
  if (pixelWidth > LIMITS.maxDimension || pixelHeight > LIMITS.maxDimension ||
      pixelWidth * pixelHeight > LIMITS.maxPixels) {
    throw new Error("This page is too large for one PNG. Reduce the browser zoom and try again.");
  }
  return { x: 0, y: 0, width, height, scale: 1 };
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
