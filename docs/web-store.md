# Publish Full Page in the Chrome Web Store

Checked on 5 September 2026 against the official sources below.

Brave can install Chrome Web Store extensions through **Add to Brave**. Users do not need Developer mode for that installation. Store publication is separate from a public GitHub repository. [Brave installation instructions](https://support.brave.app/hc/en-us/articles/360017909112-How-can-I-add-extensions-to-Brave).

## Account requirements

1. Register a Google account in the [Chrome Web Store developer dashboard](https://chrome.google.com/webstore/devconsole). Agree to the store terms and pay the one-time registration fee. Google's support form states a $5 fee. Check the amount shown during registration. [Registration](https://developer.chrome.com/docs/webstore/register), [official fee statement](https://support.google.com/chrome_webstore/contact/one_stop_support?hl=en).
2. Turn on Google **2-Step Verification**. It is required before publication or updates. [Account security rule](https://developer.chrome.com/docs/webstore/program-policies/two-step-verification).
3. Set the publisher name and verify the contact email address. [Account setup](https://developer.chrome.com/docs/webstore/set-up-account).
4. Declare **Trader** or **Non-Trader** status. Each publisher must decide their correct status. Traders must provide and verify their legal name, address, and contact phone number. Google displays these trader details on the listing. Do not assume that a free extension makes its publisher a Non-Trader. [Trader requirements](https://developer.chrome.com/docs/webstore/program-policies/trader-verification-faq).

## Files and store images

After you resolve the submission issues below, run `bun run package`. Upload `dist/full-page-1.0.0.zip` as a new item. The ZIP must contain `manifest.json` at its root. [Package preparation](https://developer.chrome.com/docs/webstore/prepare), [ZIP upload](https://developer.chrome.com/docs/webstore/publish).

| Asset | Required size and format |
| --- | --- |
| Extension icon | 128 × 128 pixels, PNG. This project provides `icons/128.png`. |
| Small promotional image | 440 × 280 pixels, PNG or JPEG. |
| Store screenshots | At least one, maximum five. Use 1280 × 800 pixels. The image guide also permits 640 × 400. |
| Optional marquee image | 1400 × 560 pixels, PNG or JPEG. |

Screenshots must show the actual extension. Use square corners with no padding. For square icon artwork, the image guide recommends 96 × 96 pixels within the 128 × 128 file. [Image requirements](https://developer.chrome.com/docs/webstore/images), [listing fields](https://developer.chrome.com/docs/webstore/cws-dashboard-listing).

## Text for the store listing

Use **Full Page** as the name and **English** as the language. Select the category that best fits screenshot tools.

Copy this description:

> Capture a complete web page in Brave and save it as a PNG.
>
> Open a website, click Full Page, then click Capture full page. Inspect the result in the preview. Choose Fit width, Fit page, or Actual size. Click Download PNG to keep the image.
>
> The Load page images option scrolls the page before capture. Full Page then restores the original scroll position. Brave shows a debugging banner while the capture runs.
>
> Full Page handles the selected page's image, address, and title on your device. It keeps local previews and the image-loading setting. It has no server, analytics, or uploads. The website can load its own content during capture.
>
> Each completed capture removes saved previews older than seven days and keeps the newest ten. Cleanup runs when you make another capture. Downloaded files remain until you delete them.
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
| `activeTab` | Read the selected tab's address and title after the user opens the extension. Show this information so the user can identify the page to capture. This uses temporary tab access. |
| `debugger` | Attach to the selected tab when the user starts a capture. Use the Chrome DevTools Protocol to measure the page, prepare its images, and create one full-page PNG with Page.captureScreenshot and captureBeyondViewport. Run the packaged page-preparation functions through Runtime.evaluate in an isolated world. Restore the page and detach when capture ends. |
| `storage` | Save the Load page images setting in chrome.storage.local. Keep capture progress and the latest preview link in chrome.storage.session so the popup can close during capture. PNG previews use a separate local IndexedDB database. |

The code review supports **No, I am not using remote code**. All page-preparation functions ship in the ZIP. `Runtime.evaluate` receives those functions and local arguments. It does not fetch executable code. See [capture code](../lib/capture.js) and [page code](../lib/page.js).

Declare website content and web browsing activity, including the captured page's address and title. Explain that handling is local. Screenshots can include information visible in signed-in pages. Do not claim that the extension handles no user data. The current FAQ explicitly includes local processing and storage. [Local data disclosure](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq).

Provide the public privacy-policy URL. The policy must explain collection, use, sharing, and local retention. [Privacy policy rule](https://developer.chrome.com/docs/webstore/program-policies/privacy). Include a statement that the extension follows the store's Limited Use requirements. Complete the dashboard certifications only when they match the code and policy. [Limited Use rule](https://developer.chrome.com/docs/webstore/program-policies/limited-use).

## Current data handling

These statements come from [capture.js](../lib/capture.js), [page.js](../lib/page.js), [storage.js](../lib/storage.js), [background.js](../background.js), and [popup.js](../popup.js).

- The extension stores the PNG, page address and title, capture time, image dimensions, file size, filename, and image-load status in IndexedDB.
- The stored address can include a query string or fragment.
- After a successful capture, cleanup removes previews older than seven days and keeps at most the newest ten. There is no seven-day deletion timer. Without another capture, old records can remain.
- The image-loading setting remains in local extension storage. Capture progress and the last preview link use session storage. Chrome clears session storage on restart, extension disable, reload, or update. [Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage#storage-areas).
- The extension has no server, telemetry, upload, or browser-sync code. Its content security policy blocks network connections from extension pages. The source website can still load resources during capture. See [manifest.json](../manifest.json).
- Removing the extension removes its saved previews and settings. Downloaded PNG files are separate files and remain on the device.

## Submission issues to resolve

The current popup does not explain all saved data before use. FAQ section 10 requires a prominent disclosure and an affirmative action inside the extension before data handling. Store text alone is insufficient. Add this first-use flow before submission. It must precede the tab metadata read, which currently runs when the popup opens. [Disclosure and consent requirements](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq).

The extension stores plain IndexedDB records and PNG blobs without application encryption. FAQ section 9 requires encryption at rest and gives no local-storage exception. Resolve this storage issue before submission, or obtain clarification from store support. The review outcome is not known. [Encryption requirement](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq), [handling rule](https://developer.chrome.com/docs/webstore/program-policies/data-handling).

There is no documented blanket ban on `debugger` for this implementation. The API supports the Page and Runtime domains. The protocol documents full-page capture. MV3 policy explicitly recognizes debugger API use. [Debugger API](https://developer.chrome.com/docs/extensions/reference/api/debugger), [capture command](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-captureScreenshot), [MV3 rules](https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements).

This is an assessment from the code and documentation, not store approval. Explain why this native full-page capture needs `debugger`. The reviewer must still assess the permission against the minimum-permission and API-use rules. [API-use rule](https://developer.chrome.com/docs/webstore/program-policies/api-use).

## Submit and install

1. Complete the account requirements and resolve the submission issues above.
2. Upload the ZIP, listing images, description, privacy fields, and policy URL.
3. Select **Public** for a searchable store listing. Select **Unlisted** for installation through its direct store URL. Both require the same review and policy compliance. [Distribution options](https://developer.chrome.com/docs/webstore/cws-dashboard-distribution).
4. Add the reviewer steps below. Click **Submit for Review**. Choose automatic publication or publication after approval. [Submission process](https://developer.chrome.com/docs/webstore/publish).
5. Wait for Google's review. Reviews usually take a few days but can take weeks. Powerful permissions can extend review time. Approval is not guaranteed. [Review process](https://developer.chrome.com/docs/webstore/review-process).
6. After publication, open the store URL in Brave. Click **Add to Brave** and accept the permission prompt.

Copy these reviewer steps:

> No account, payment, or test credentials are needed to use the extension.
>
> Open https://github.com/jewei and wait for the page to load. Open Full Page from the browser toolbar. Keep Load page images enabled. Click Capture full page.
>
> The browser shows a debugging banner during capture. The preview opens in a new tab. Select Fit page to inspect the complete image. Select Actual size to inspect its details. Click Download PNG. The file must include the bottom of the page. Return to the source tab and check that its original scroll position is restored.
>
> Close developer tools before capture. Browser settings and store pages cannot be captured. For a page that keeps growing, turn off Load page images and capture its current content.
