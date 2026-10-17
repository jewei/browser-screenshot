# Full Page

Full Page captures a complete web page in Brave as a PNG. Open the toolbar popup and select **Capture full page**. Check the preview, then download the image. The extension uses the open tab's sign-in state, zoom, and theme.

## Chrome Web Store

This extension is not yet in the Chrome Web Store. Use the local installation steps below. After publication, you can install it with **Add to Brave** without Developer mode. See the [Brave installation instructions](https://support.brave.app/hc/en-us/articles/360017909112-How-can-I-add-extensions-to-Brave).

The [publishing guide](docs/web-store.md) lists the upload files, listing text, and reasons for each permission.

## Install locally for development

You do not need to install packages or build the extension. The project includes the fonts and icons.

1. Open `brave://extensions` in Brave.
2. Turn on **Developer mode**.
3. Click **Load unpacked**. Select this project folder, which contains `manifest.json`.
4. Open the extensions menu in the toolbar. Pin **Full Page**.
5. Open the HTTP or HTTPS page that you want to capture. Wait for it to load.
6. Click **Full Page**. On first use, read the data use notice and select **Agree and continue**. Click **Capture full page**.
7. The preview opens in a new tab. Click **Download PNG**.

The shortcut is **Option + Shift + S** on macOS, or **Alt + Shift + S** on Windows and Linux. Change it at `brave://extensions/shortcuts` if another extension uses it.

Keep the extension folder in place. If you edit its files, click **Reload** for Full Page at `brave://extensions`.

## Run a separate Brave demo

Install Bun 1.4.1 or later, then run:

```sh
bun install --frozen-lockfile
bun run brave
```

This opens Brave with the extension loaded and a public GitHub page open. The popup opens automatically. The demo uses a temporary browser profile with separate tabs and sign-in data. Close the demo window to remove that profile.

To use a different page:

```sh
bun run brave https://example.com
```

The launcher finds Brave in the normal macOS, Linux, or Windows installation path. Set `BRAVE_PATH` to the executable if Brave is installed elsewhere.

## How capture works

The extension uses Manifest V3 and [`chrome.debugger`](https://developer.chrome.com/docs/extensions/reference/api/debugger). It reads the document size, then calls [`Page.captureScreenshot`](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-captureScreenshot) with `captureBeyondViewport: true`. This captures one PNG at the browser's pixel density.

**Load page images** is on by default. The extension scrolls through the page and waits for images and fonts to load. It returns to the top for capture. It pauses CSS animations during capture, then restores the original scroll position, image loading attributes, and styles. Capture continues if you close the popup.

Brave displays a debugging banner during capture. This is part of the browser API. The extension detaches when capture ends. If you cancel the banner or close the source tab, capture stops. If Brave disconnects before cleanup, a page timer restores temporary changes within 60 seconds.

The preview has **Fit width**, **Fit page**, and **Actual size** modes. The download contains the full image at its original resolution in every mode.

## Local data and permissions

The [privacy policy](PRIVACY.md) describes the data that the extension handles and how to remove it.

The extension has no server, analytics, remote scripts, or image uploads. All fonts ship with it. A content security policy blocks network connections from extension pages. The source website can still load its own content during capture.

| Permission | Use |
| --- | --- |
| `activeTab` | Identify the tab selected with the toolbar button. |
| `debugger` | Read the selected page's size, prepare the page, and capture its full image. Brave gives this permission broad access. The code attaches only to the selected tab. |
| `storage` | Store consent and the image loading preference. Keep capture progress and the encryption key in browser memory. |

The extension encrypts PNG previews and page details with AES-GCM before saving them in local IndexedDB. The key stays in `chrome.storage.session`, which the browser keeps in memory. Previews expire when the browser restarts or you update, disable, or reload the extension.

After each successful capture, the extension removes previews from past sessions and previews older than seven days. It keeps at most the ten newest previews. An open preview can keep its image in memory until you close or reload it.

Select **Clear saved previews** to remove all previews and their key. This also clears open preview pages. Download an image to keep a separate PNG file. An update from version 1.0.0 removes its old unencrypted previews. Uninstall the extension to remove stored settings and consent.

## Limits

- The extension supports HTTP and HTTPS pages. It cannot capture Brave settings, extension pages, local files, or pages that the browser protects from capture.
- Brave cannot capture an image taller or wider than 16,384 pixels. A PNG can also have at most 64 million pixels. If a page is larger, the extension scales the PNG down to fit, and the preview tells you. The extension shows an error if the PNG must be smaller than half a pixel for each page pixel. Reduce browser zoom, or turn off **Load page images**, to capture a larger document.
- Page preparation stops after 25 seconds or 100 scroll steps. For a page that keeps growing, turn off **Load page images** to capture its current content.
- The extension captures the outer document. Scroll areas inside panels remain as the page displays them. Expand collapsed sections and content behind a **Show more** button before capture.
- To render virtual lists, such as X replies, the extension makes the browser viewport as tall as the page during capture. Sticky sidebars can stretch to the page height. If the page grows with the viewport, the extension uses the normal viewport, and virtual lists can show blank areas.
- An image can remain blank if it is unavailable or blocked. The preview reports images that did not load. Video frames and other page content can change during capture.
- Close developer tools or other debugging extensions if Brave refuses the connection.

## Verify or package

Run these commands from the project folder:

```sh
bun install --frozen-lockfile
bun test
bun run test:browser
bun run capture:github
bun run package
bun run store:assets
```

The browser tests use Playwright with the installed Brave executable in a temporary profile. See the [extension test setup](https://playwright.dev/docs/chrome-extensions). They check consent before metadata access, encrypted storage, deletion, and session expiry. They also click the capture button and download the PNG through its preview.

The local page test checks the bottom row, an image loaded on scroll, and a fixed header. It also checks scroll restoration, error cleanup, horizontal capture, preview reload, view modes, and narrow layouts. `capture:github` adds a live GitHub page check. It saves the captured PNG and a preview screenshot in `artifacts/`, with test results in `artifacts/verification.json`.

Pass `--headed` to either browser test command to show the test browser. `bun run brave` always shows it.

The package command needs the `zip` program. It writes `dist/full-page-1.1.0.zip` with the extension files, README, privacy policy, fonts, and icons. Upload this ZIP through the Chrome Web Store developer dashboard.

`bun run store:assets` creates the store icon, promotional image, and two screenshots in `store/assets/`. The screenshots show the extension capturing the included sample page. `bun run store:bundle` creates `dist/web-store-1.1.0/` with all upload files and listing text.

`bun run assets` regenerates the included icons and copies local fonts from development dependencies. Font licenses are in `fonts/`.
