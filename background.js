import { captureFullPage } from "./lib/capture.js";
import { clearCaptures, pruneCaptures, saveCapture } from "./lib/storage.js";
import { hasConsent } from "./lib/consent.js";
import { readableError } from "./lib/shared.js";

let activeTask = null;

async function updateState(state) {
  await chrome.storage.session.set({ captureState: state });
  await chrome.runtime.sendMessage({ type: "CAPTURE_STATE", state }).catch(() => {});
}

async function runCapture(tabId, loadImages) {
  try {
    if (!await hasConsent()) throw new Error("Open Full Page and agree to the data use notice before capture.");
    const capture = await captureFullPage(tabId, {
      loadImages,
      onProgress: (message, progress) => updateState({ status: "working", tabId, message, progress }),
    });
    await updateState({ status: "working", tabId, message: "Opening the preview", progress: 96 });
    await saveCapture(capture);
    await pruneCaptures();
    const previewUrl = chrome.runtime.getURL(`preview.html?id=${encodeURIComponent(capture.id)}`);
    await updateState({ status: "complete", tabId, captureId: capture.id, previewUrl, progress: 100 });
    await chrome.tabs.create({ url: previewUrl });
  } catch (error) {
    await updateState({ status: "error", tabId, message: readableError(error) });
  } finally {
    activeTask = null;
  }
}

chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (sender.id !== chrome.runtime.id || !sender.url?.startsWith(chrome.runtime.getURL(""))) return;
  if (message.type === "START_CAPTURE") {
    if (!Number.isInteger(message.tabId) || message.tabId < 0) {
      reply({ ok: false, error: "No page is selected. Open a website and try again." });
    } else if (activeTask) {
      reply({ ok: false, error: "A capture is in progress. Wait for it to finish." });
    } else {
      activeTask = runCapture(message.tabId, message.loadImages !== false);
      reply({ ok: true });
    }
    return;
  }
  if (message.type === "GET_STATE") {
    (async () => {
      const { captureState } = await chrome.storage.session.get("captureState");
      if (captureState?.status === "working" && !activeTask) {
        const state = { ...captureState, status: "error", message: "The capture was interrupted. Try again." };
        await updateState(state);
        reply({ state });
      } else reply({ state: captureState });
    })().catch((error) => reply({ error: readableError(error) }));
    return true;
  }
  if (message.type === "CLEAR_CAPTURES") {
    if (activeTask) {
      reply({ ok: false, error: "Wait for the capture to finish, then clear previews." });
      return;
    }
    activeTask = (async () => {
      try {
        await clearCaptures();
        await chrome.storage.session.remove(["captureSession", "captureState"]);
        reply({ ok: true });
      } catch (error) {
        reply({ ok: false, error: readableError(error) });
      } finally {
        activeTask = null;
      }
    })();
    return true;
  }
});

// Clear unreadable previews when a browser session starts. Updating or reloading
// the extension also prunes legacy records and records from the previous session.
chrome.runtime.onStartup.addListener(() => { pruneCaptures().catch(() => {}); });
chrome.runtime.onInstalled.addListener(() => { pruneCaptures().catch(() => {}); });
