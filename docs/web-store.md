# Publish Full Page in the Chrome Web Store

Checked on 5 September 2026 against the official sources below.

Brave can install Chrome Web Store extensions through **Add to Brave**. Users do not need Developer mode for that installation. Store publication is separate from a public GitHub repository. [Brave installation instructions](https://support.brave.app/hc/en-us/articles/360017909112-How-can-I-add-extensions-to-Brave).

## Account requirements

1. Register a Google account in the [Chrome Web Store developer dashboard](https://chrome.google.com/webstore/devconsole). Agree to the store terms and pay the one-time registration fee. Google's support form states a $5 fee. Check the amount shown during registration. [Registration](https://developer.chrome.com/docs/webstore/register), [official fee statement](https://support.google.com/chrome_webstore/contact/one_stop_support?hl=en).
2. Turn on Google **2-Step Verification**. It is required before publication or updates. [Account security rule](https://developer.chrome.com/docs/webstore/program-policies/two-step-verification).
3. Set the publisher name and verify the contact email address. [Account setup](https://developer.chrome.com/docs/webstore/set-up-account).
4. Declare **Trader** or **Non-Trader** status. Each publisher must decide their correct status. Traders must provide and verify their legal name, address, and contact phone number. Google displays these trader details on the listing. Do not assume that a free extension makes its publisher a Non-Trader. [Trader requirements](https://developer.chrome.com/docs/webstore/program-policies/trader-verification-faq).

## Files and store images

Run `bun run store:bundle`. Upload `dist/web-store-1.1.0/full-page-1.1.0.zip` as a new item. The same folder contains the listing text, privacy policy, and all required images. The ZIP contains `manifest.json` at its root. [Package preparation](https://developer.chrome.com/docs/webstore/prepare), [ZIP upload](https://developer.chrome.com/docs/webstore/publish).

| Asset | Required size and format |
| --- | --- |
| Extension icon | `images/icon-128.png`, 128 × 128 pixels with 16-pixel transparent padding. |
| Small promotional image | `images/small-promo.png`, 440 × 280 pixels. |
| Store screenshots | `images/01-full-page.png` and `images/02-page-detail.png`, both 1280 × 800 pixels. |
| Optional marquee image | 1400 × 560 pixels, PNG or JPEG. |

Screenshots must show the actual extension. Use square corners with no padding. For square icon artwork, the image guide recommends 96 × 96 pixels within the 128 × 128 file. [Image requirements](https://developer.chrome.com/docs/webstore/images), [listing fields](https://developer.chrome.com/docs/webstore/cws-dashboard-listing).

The supplied screenshots show the actual extension capturing the included fictional sample page. They contain no account data. Regenerate them with `bun run store:assets`. Source assets are in [store/assets](../store/assets).

## Text for the store listing

Use **Full Page** as the name and **English** as the language. Select the category that best fits screenshot tools.

All fields and reviewer instructions are also available in [store/listing.txt](../store/listing.txt) for copying into the dashboard.

Copy this description:

> Capture a complete web page in Brave and save it as a PNG.
>
> Open a website and click Full Page. On first use, read the data use notice and select Agree and continue. Click Capture full page. Inspect the result in the preview. Choose Fit width, Fit page, or Actual size. Click Download PNG to keep the image.
>
> The Load page images option scrolls the page before capture. Full Page then restores the original scroll position. Brave shows a debugging banner while the capture runs.
>
> Full Page handles the selected page's image, address, and title on your device. It keeps local previews and the image-loading setting. It has no server, analytics, or uploads. The website can load its own content during capture.
>
> Previews use encryption with a key held in browser memory. They expire when the browser restarts or the extension updates, disables, or reloads. Each new capture removes old previews and keeps the latest ten for up to seven days. Clear saved previews removes local previews and their key. Downloaded files remain until you delete them.
>
> HTTP and HTTPS websites are supported. Browser settings and protected pages cannot be captured. Content inside separate scrolling panels stays as displayed. Expand hidden sections before capture.

Use these listing links after the files are public:

| Field | URL |
| --- | --- |
| Homepage | <https://github.com/jewei/browser-screenshot> |
| Support | <https://github.com/jewei/browser-screenshot/issues> |
| Privacy policy | <https://github.com/jewei/browser-screenshot/blob/main/PRIVACY.md> |

## Privacy fields

The store requires a narrow single purpose and a reason for each requested permission. Request only the permissions needed by the current feature. [Privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy), [permission rule](https://developer.chrome.com/docs/webstore/program-policies/permissions).

Copy this single-purpose description:

> Capture the complete page selected by the user as a PNG, then let the user preview and download that image on their device.

Copy these permission reasons:

| Permission | Reason |
| --- | --- |
| `activeTab` | After agreement to the data use notice, read the selected tab's address and title when the user opens the extension. Show this information so the user can identify the page to capture. This uses temporary tab access. |
| `debugger` | Attach to the selected tab when the user starts a capture. Use the Chrome DevTools Protocol to measure the page, prepare its images, and create one full-page PNG with Page.captureScreenshot and captureBeyondViewport. Run the packaged page-preparation functions through Runtime.evaluate in an isolated world. Restore the page and detach when capture ends. |
| `storage` | Save consent and the Load page images setting in chrome.storage.local. Keep capture progress, the latest preview link, and the encryption key in chrome.storage.session. PNG previews and page details use encrypted local IndexedDB records. |

The code review supports **No, I am not using remote code**. All page-preparation functions ship in the ZIP. `Runtime.evaluate` receives those functions and local arguments. It does not fetch executable code. See [capture code](../lib/capture.js) and [page code](../lib/page.js).

Declare website content and web browsing activity, including the captured page's address and title. Explain that handling is local. Screenshots can include information visible in signed-in pages. Do not claim that the extension handles no user data. The current FAQ explicitly includes local processing and storage. [Local data disclosure](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq).

Provide the public privacy-policy URL. The supplied policy explains collection, use, sharing, and local retention. It also contains the Limited Use statement. The extension uses data only for its screenshot purpose and does not sell or transfer it, use it for unrelated purposes, or use it for credit decisions. [Privacy policy rule](https://developer.chrome.com/docs/webstore/program-policies/privacy), [Limited Use rule](https://developer.chrome.com/docs/webstore/program-policies/limited-use).

## Current data handling

These statements come from [capture.js](../lib/capture.js), [page.js](../lib/page.js), [storage.js](../lib/storage.js), [background.js](../background.js), and [popup.js](../popup.js).

- The extension encrypts the PNG, page address and title, image dimensions, file size, filename, and image-load status before writing them to IndexedDB. Capture ID, time, and random session ID remain readable for lookup and cleanup.
- The stored address can include a query string or fragment.
- The 256-bit AES-GCM key stays in chrome.storage.session. Chrome keeps this storage in memory and clears it on restart, extension disable, reload, or update. Previews from earlier sessions then become unreadable. [Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage#storage-areas).
- After a successful capture, cleanup removes past-session previews and those older than seven days, then keeps at most the newest ten. Startup and installation events also run cleanup. Opening an expired preview deletes it. There is no daily deletion timer. Encrypted records can remain until cleanup runs.
- Consent and the image-loading setting remain in local extension storage. Capture progress and the last preview link use session storage.
- The extension has no server, telemetry, upload, or browser-sync code. Its content security policy blocks network connections from extension pages. The source website can still load resources during capture. See [manifest.json](../manifest.json).
- Clear saved previews removes all stored previews and the session key, and clears open image views. Removing the extension also removes settings and consent. Downloaded PNG files are separate, unencrypted files and remain on the device.

## Changes made for submission

Version 1.1.0 includes a first-use notice and an **Agree and continue** action before tab metadata access. **Not now** closes the popup. The background worker also checks consent before capture. This addresses the prominent disclosure requirement in FAQ section 10. [Disclosure and consent requirements](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq).

The extension encrypts page content and metadata with AES-GCM before database writes. It uses a random IV for each record and keeps the key only in memory. It removes old unencrypted version 1.0.0 records on database upgrade. This addresses the storage requirement in FAQ section 9. Browser controls and device security still matter. [Encryption requirement](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq), [handling rule](https://developer.chrome.com/docs/webstore/program-policies/data-handling).

There is no documented blanket ban on `debugger` for this implementation. The API supports the Page and Runtime domains. The protocol documents full-page capture. MV3 policy explicitly recognizes debugger API use. [Debugger API](https://developer.chrome.com/docs/extensions/reference/api/debugger), [capture command](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-captureScreenshot), [MV3 rules](https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements).

This is an assessment from the code and documentation, not store approval. Explain why this native full-page capture needs `debugger`. The reviewer must still assess the permission against the minimum-permission and API-use rules. [API-use rule](https://developer.chrome.com/docs/webstore/program-policies/api-use).

## Submit and install

1. Complete the account requirements above. Registration alone does not confirm email verification, two-step verification, or trader status.
2. Upload the ZIP, listing images, description, privacy fields, and policy URL.
3. Select **Public** for a searchable store listing. Select **Unlisted** for installation through its direct store URL. Both require the same review and policy compliance. [Distribution options](https://developer.chrome.com/docs/webstore/cws-dashboard-distribution).
4. Add the reviewer steps below. Click **Submit for Review**. Choose automatic publication or publication after approval. [Submission process](https://developer.chrome.com/docs/webstore/publish).
5. Wait for Google's review. Reviews usually take a few days but can take weeks. Powerful permissions can extend review time. Approval is not guaranteed. [Review process](https://developer.chrome.com/docs/webstore/review-process).
6. After publication, open the store URL in Brave. Click **Add to Brave** and accept the permission prompt.

Copy these reviewer steps:

> No account, payment, or test credentials are needed to use the extension.
>
> Open https://github.com/jewei and wait for the page to load. Open Full Page from the browser toolbar. On first use, read the notice and click Agree and continue. Keep Load page images enabled. Click Capture full page.
>
> The browser shows a debugging banner during capture. The preview opens in a new tab. Select Fit page to inspect the complete image. Select Actual size to inspect its details. Click Download PNG. The file must include the bottom of the page. Return to the source tab and check that its original scroll position is restored.
>
> Close developer tools before capture. Browser settings and store pages cannot be captured. For a page that keeps growing, turn off Load page images and capture its current content.
>
> Reload the preview during the same browser session. The image remains available. Click Clear saved previews. All saved previews and their session key are removed, and open image views clear. Restarting the browser also expires previews because the key stays only in memory.
