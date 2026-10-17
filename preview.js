import { getCapture } from "./lib/storage.js";
import { formatBytes, isCapturableUrl } from "./lib/shared.js";

const stage = document.querySelector("#preview-stage");
const image = document.querySelector("#screenshot");
const viewMode = document.querySelector("#view-mode");
let objectUrl;

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "session" && changes.captureSession?.oldValue) location.reload();
});

document.querySelector("#clear-previews").addEventListener("click", async (event) => {
  event.target.disabled = true;
  try {
    const result = await chrome.runtime.sendMessage({ type: "CLEAR_CAPTURES" });
    if (!result.ok) throw new Error(result.error);
    location.reload();
  } catch (error) {
    document.querySelector("#clear-status").textContent = error.message;
    event.target.disabled = false;
  }
});

viewMode.addEventListener("change", () => {
  stage.dataset.view = viewMode.value;
  stage.scrollTo({ top: 0, left: 0, behavior: "instant" });
  document.querySelector("#view-hint").textContent = viewMode.value === "page" ? "The complete image" : "Scroll to inspect the image";
});

new ResizeObserver(() => {
  stage.style.setProperty("--stage-height", `${Math.max(160, stage.clientHeight - 48)}px`);
}).observe(stage);

window.addEventListener("pagehide", () => { if (objectUrl) URL.revokeObjectURL(objectUrl); });

async function init() {
  const id = new URL(location.href).searchParams.get("id");
  const capture = id ? await getCapture(id) : undefined;
  if (!capture) {
    document.querySelector("#capture-label").textContent = "No saved preview";
    document.querySelector("#empty-message").textContent = "This screenshot is no longer stored.";
    document.querySelector("#empty-help").textContent = "Open a website and use the Full Page extension to capture it.";
    return;
  }
  objectUrl = URL.createObjectURL(capture.blob);
  image.src = objectUrl;
  image.alt = `Full-page screenshot of ${capture.title || capture.url}`;
  image.width = capture.width;
  image.height = capture.height;
  await image.decode();
  stage.style.setProperty("--image-width", `${capture.width}px`);
  document.title = `${capture.title || "Screenshot"} · Full Page`;
  document.querySelector("#capture-title").textContent = capture.title || "Your full page.";
  document.querySelector("#capture-label").textContent = "Capture complete";
  document.querySelector("#source-url").textContent = capture.url;
  document.querySelector("#dimensions").textContent = `${capture.width.toLocaleString()} × ${capture.height.toLocaleString()} px`;
  document.querySelector("#file-size").textContent = formatBytes(capture.bytes);
  document.querySelector("#captured-at").textContent = new Date(capture.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  document.querySelector("#metadata").hidden = false;
  document.querySelector("#image-caption").textContent = `${capture.width.toLocaleString()} × ${capture.height.toLocaleString()} px · PNG`;
  const download = document.querySelector("#download");
  download.href = objectUrl;
  download.download = capture.filename;
  download.hidden = false;
  document.querySelector("#clear-previews").hidden = false;
  const source = document.querySelector("#open-source");
  if (isCapturableUrl(capture.url)) { source.href = capture.url; source.hidden = false; }
  const warnings = [];
  if (capture.scaledDown) {
    warnings.push("The page was too large for one full-resolution PNG. The image is scaled down to fit.");
  }
  if (capture.incompleteImages) {
    warnings.push(`${capture.incompleteImages} page image${capture.incompleteImages === 1 ? " did" : "s did"} not load. Check the preview before you save it.`);
  }
  if (warnings.length) {
    const warning = document.querySelector("#image-warning");
    warning.textContent = warnings.join(" ");
    warning.hidden = false;
  }
  document.querySelector("#empty-state").hidden = true;
  document.querySelector("#image-frame").hidden = false;
  viewMode.disabled = false;
}

init().catch((error) => {
  document.querySelector("#capture-label").textContent = "Preview unavailable";
  document.querySelector("#empty-message").textContent = "The screenshot could not be opened.";
  document.querySelector("#empty-help").textContent = `${error.message} Capture the page again.`;
});
