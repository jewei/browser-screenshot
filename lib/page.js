// These functions run in an isolated world in the source tab. Keep them self-contained.
export function beginPage() {
  const key = "__fullPageCapture";
  globalThis[key]?.restore();
  const state = {
    x: scrollX,
    y: scrollY,
    url: location.href,
    images: [],
    style: document.createElement("style"),
  };
  state.style.textContent = `
    html, body { scroll-behavior: auto !important; scroll-snap-type: none !important; }
    *, *::before, *::after {
      animation-play-state: paused !important;
      transition: none !important;
      caret-color: transparent !important;
    }
  `;
  state.style.dataset.fullPageCapture = "";
  document.documentElement.append(state.style);
  state.restore = () => {
    clearTimeout(state.timer);
    for (const [image, loading] of state.images) {
      if (loading === null) image.removeAttribute("loading");
      else image.setAttribute("loading", loading);
    }
    scrollTo({ left: state.x, top: state.y, behavior: "instant" });
    state.style.remove();
    delete globalThis[key];
  };
  // Cleanup still runs if the user cancels Brave's debugger banner.
  state.timer = setTimeout(state.restore, 60_000);
  globalThis[key] = state;
  return { url: location.href, title: document.title, pixelRatio: devicePixelRatio };
}

export async function scrollPage(y, loadImages) {
  const state = globalThis.__fullPageCapture;
  if (!state || state.url !== location.href) throw new Error("The page changed during capture.");
  if (loadImages) {
    for (const image of document.images) {
      if (image.getAttribute("loading") === "lazy") {
        state.images.push([image, image.getAttribute("loading")]);
        image.loading = "eager";
      }
    }
  }
  scrollTo({ left: 0, top: y, behavior: "instant" });
  await new Promise((resolve) => setTimeout(resolve, 160));
  return {
    height: Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight || 0),
    width: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0),
    viewport: innerHeight,
    y: scrollY,
    pixelRatio: devicePixelRatio,
  };
}

export async function settlePage() {
  if (!globalThis.__fullPageCapture) throw new Error("Page preparation expired. Try again.");
  const tasks = [...document.images].map((image) => image.decode().catch(() => {}));
  tasks.push(document.fonts.ready);
  let timer;
  await Promise.race([
    Promise.allSettled(tasks),
    new Promise((resolve) => { timer = setTimeout(resolve, 3000); }),
  ]);
  clearTimeout(timer);
  scrollTo({ left: 0, top: 0, behavior: "instant" });
  await new Promise((resolve) => setTimeout(resolve, 250));
  return {
    url: location.href,
    title: document.title,
    pixelRatio: devicePixelRatio,
    incompleteImages: [...document.images].filter((image) => !image.complete || !image.naturalWidth).length,
  };
}

export function restorePage() {
  globalThis.__fullPageCapture?.restore();
}
