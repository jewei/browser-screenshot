# Full Page

A Brave extension that captures a complete web page as a PNG. Click the extension button, inspect the image, and download it. It runs in your browser and uses the open tab's sign-in state, zoom, and theme.

## Chrome Web Store

This extension is not yet published in the Chrome Web Store. A store listing will allow installation with **Add to Brave**. Developer mode is only needed for the local installation described below. See the [publishing guide](docs/web-store.md) for upload files, listing text, and permission explanations. [Brave store installation instructions](https://support.brave.app/hc/en-us/articles/360017909112-How-can-I-add-extensions-to-Brave).

Version 1.1.0 asks for consent before reading page details. It encrypts saved previews with a key held in browser memory. The ZIP is prepared for submission and has not received store approval.

## Install locally for development

No package installation or build is needed to use the extension. The fonts and icons are included.

1. Open `brave://extensions` in Brave.
2. Turn on **Developer mode**.
3. Click **Load unpacked**. Select this project folder, which contains `manifest.json`.
4. Open the extensions menu in the toolbar. Pin **Full Page**.
5. Open <https://github.com/jewei>. Wait for the page to load.
6. Click **Full Page**. On first use, read the data use notice and select **Agree and continue**. Click **Capture full page**.
7. The preview opens in a new tab. Click **Download PNG**.

The shortcut is **Option + Shift + S** on macOS, or **Alt + Shift + S** on Windows and Linux. Change it at `brave://extensions/shortcuts` if another extension uses it.

Keep the extension folder in place. If you edit its files, click **Reload** for Full Page at `brave://extensions`.

## Run a separate Brave demo

With Bun 1.4.1 or later installed:

```sh
bun install --frozen-lockfile
bun run brave
```

This opens the installed Brave browser with the extension loaded and the GitHub profile open. The popup opens automatically. The demo uses a temporary profile. It has its own tabs and sign-in state. Close the demo window to remove that profile.

To use a different page:

```sh
bun run brave https://example.com
```

The launcher finds Brave in the normal macOS, Linux, or Windows installation path. Set `BRAVE_PATH` to the executable if Brave is installed elsewhere.

## How capture works

The extension uses Manifest V3 and `chrome.debugger`. It gets the document size, then uses `Page.captureScreenshot` with `captureBeyondViewport: true`. This captures one PNG at the browser's pixel density.

**Load page images** is on by default. The tool scrolls through the page, gives images and fonts time to load, and returns to the top for capture. It pauses CSS animations during capture. It then restores the original scroll position, image loading attributes, and styles. Capture continues if you close the popup.

Brave displays a debugging banner during capture. This is part of the browser API. The extension detaches when capture ends. If you cancel the banner or close the source tab, capture stops. If Brave disconnects before cleanup, a page timer restores temporary changes within 60 seconds.

The preview supports **Fit width**, **Fit page**, and **Actual size**. The download contains the full image at its original resolution in all three modes.

## Local data and permissions

See the [privacy policy](PRIVACY.md) for the data handled by this version and how to remove it.

The extension has no server, analytics, remote scripts, or image uploads. All fonts ship with it. A content security policy blocks network connections from extension pages. The source website can still load its own content during capture.

| Permission | Use |
| --- | --- |
| `activeTab` | Identify the tab selected with the toolbar button. |
| `debugger` | Read the selected page's size, prepare the page, and capture its full image. Brave gives this permission broad access. The code attaches only to the selected tab. |
| `storage` | Store consent and the image loading preference. Keep capture progress and the encryption key in browser memory. |

PNG previews and page details use AES-GCM encryption in local IndexedDB. The key stays in `chrome.storage.session`, which the browser keeps in memory. Previews expire when the browser restarts or the extension updates, disables, or reloads. Each new capture removes previews from past sessions and previews older than seven days, then retains the newest ten. An open preview can keep its image in memory until you close or reload it.

Select **Clear saved previews** to remove all previews and their key. This also clears open preview pages. Download an image to keep a separate PNG file. An update from version 1.0.0 removes its old unencrypted previews. Uninstall the extension to remove stored settings and consent.

## Limits

- HTTP and HTTPS pages are supported. Brave settings, extension pages, local files, and browser-protected pages are not supported.
- A PNG can have at most 32,767 pixels on either side and 64 million total pixels. The tool shows an error if the image exceeds these limits. Reduce browser zoom to capture a larger document.
- Page preparation stops after 25 seconds or 100 scroll steps. For a page that keeps growing, turn off **Load page images** to capture its current content.
- The tool captures the outer document. Scroll areas inside panels remain as the page displays them. Virtual lists, collapsed sections, and content behind a **Show more** button must be expanded by the user first.
- An unavailable image or a blocked resource can remain blank. The preview reports images that did not load. Video frames and changes made by the website during capture can still vary.
- Close developer tools or other debugging extensions if Brave refuses the connection.

## Verify or package

Run these commands from the source project. The ZIP contains only the files needed to use the extension.

```sh
bun install --frozen-lockfile
bun test
bun run test:browser
bun run capture:github
bun run package
bun run store:assets
```

The browser tests run against the installed Brave executable in a temporary profile. They check consent before metadata access, encrypted storage, deletion, and session expiry. They click the capture button and download the result through its preview. The local page test checks the bottom row, an image loaded on scroll, a fixed header, scroll restoration, error cleanup, horizontal capture, preview reload, view modes, and narrow layouts. `capture:github` also tests the live GitHub profile and writes `artifacts/github-jewei-full-page.png` and `artifacts/verification.json`.

Pass `--headed` to either browser test command to show the test browser. `bun run brave` always shows it.

The package command writes `dist/full-page-1.1.0.zip`. It includes only the extension files, documentation, privacy policy, fonts, and icons. Upload it through the Chrome Web Store developer dashboard. The package command needs the `zip` program.

`bun run store:assets` creates the store icon, promotional image, and two screenshots in `store/assets/`. It captures the actual extension against the included sample page. `bun run store:bundle` creates `dist/web-store-1.1.0/` with all upload files and listing text.

`bun run assets` regenerates the included icons and copies local fonts from development dependencies. Font licenses are in `fonts/`.

## Why an extension

An extension uses the tab you already have open in Brave. It can capture the same page that you see while signed in. It needs no local web server for daily use. Brave supports Chromium extensions, and the browser protocol provides capture beyond the visible area.

Sources: [Brave extension support](https://support.brave.app/hc/en-us/articles/360017909112-How-can-I-add-extensions-to-Brave), [Chrome debugger API](https://developer.chrome.com/docs/extensions/reference/api/debugger), [full-page capture parameters](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-captureScreenshot), [extension test setup](https://playwright.dev/docs/chrome-extensions).
