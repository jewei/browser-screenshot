import { isCapturableUrl } from "./lib/shared.js";

const captureButton = document.querySelector("#capture");
const loadImages = document.querySelector("#load-images");
const statusBox = document.querySelector("#status-box");
const status = document.querySelector("#status");
const progress = document.querySelector("#progress");
const lastPreview = document.querySelector("#last-preview");
let tab;
let allowed = false;

function showState(state) {
  if (!state) return;
  const working = state.status === "working";
  captureButton.disabled = working || !allowed;
  loadImages.disabled = working;
  captureButton.textContent = working ? "Capturing page" : "Capture full page";
  captureButton.setAttribute("aria-busy", String(working));
  statusBox.hidden = false;
  statusBox.dataset.state = state.status;
  status.textContent = state.message || (state.status === "complete" ? "Your screenshot is ready." : "");
  progress.hidden = !working;
  progress.value = state.progress || 0;
  if (state.previewUrl) {
    lastPreview.href = state.previewUrl;
    lastPreview.target = "_blank";
    lastPreview.hidden = false;
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "CAPTURE_STATE") showState(message.state);
});

captureButton.addEventListener("click", async () => {
  showState({ status: "working", message: "Starting capture", progress: 0 });
  try {
    const result = await chrome.runtime.sendMessage({ type: "START_CAPTURE", tabId: tab.id, loadImages: loadImages.checked });
    if (!result.ok) throw new Error(result.error);
  } catch (error) {
    showState({ status: "error", message: error.message });
  }
});

loadImages.addEventListener("change", () => {
  chrome.storage.local.set({ loadImages: loadImages.checked }).catch((error) => {
    showState({ status: "error", message: `The setting was not saved. ${error.message}` });
  });
});

async function init() {
  const [tabs, settings] = await Promise.all([
    chrome.tabs.query({ active: true, currentWindow: true }),
    chrome.storage.local.get("loadImages"),
  ]);
  tab = tabs[0];
  // A programmatically opened popup does not receive an activeTab grant.
  // The debugger permission already allows metadata for the selected target.
  if (tab?.id && !tab.url) {
    const target = (await chrome.debugger.getTargets()).find((target) => target.tabId === tab.id);
    tab = { ...tab, url: target?.url, title: target?.title };
  }
  allowed = Boolean(tab?.id) && isCapturableUrl(tab?.url);
  document.querySelector("#page-title").textContent = tab?.title || "No website selected";
  document.querySelector("#page-url").textContent = allowed ? new URL(tab.url).hostname : "Open an HTTP or HTTPS website";
  loadImages.checked = settings.loadImages !== false;
  captureButton.disabled = !allowed;
  if (/Mac/i.test(navigator.platform)) document.querySelector("#shortcut").textContent = "⌥ + ⇧ + S";
  const { state, error } = await chrome.runtime.sendMessage({ type: "GET_STATE" });
  if (error) throw new Error(error);
  if (state?.status === "working" || state?.status === "complete" || state?.tabId === tab?.id) showState(state);
  if (!allowed && state?.status !== "working") {
    showState({ status: "error", message: "Open a website tab, then open Full Page again." });
  }
}

init().catch((error) => showState({ status: "error", message: error.message }));
