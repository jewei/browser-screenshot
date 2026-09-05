# Publish Full Page in the Chrome Web Store

Checked on 5 September 2026 against the official sources below.

Brave users can install Chrome Web Store extensions with **Add to Brave**. They do not need Developer mode. Publishing the code on GitHub does not create a store listing. See the [Brave installation instructions](https://support.brave.app/hc/en-us/articles/360017909112-How-can-I-add-extensions-to-Brave).

## Account requirements

1. Use a Google account to register in the [Chrome Web Store developer dashboard](https://chrome.google.com/webstore/devconsole). Agree to the store terms and pay the one-time registration fee. Google's support form lists a $5 fee. Check the amount during registration. [Registration](https://developer.chrome.com/docs/webstore/register), [fee statement](https://support.google.com/chrome_webstore/contact/one_stop_support?hl=en).
2. Turn on Google **2-Step Verification** before you publish or update the extension. [Account security rule](https://developer.chrome.com/docs/webstore/program-policies/two-step-verification).
3. Set the publisher name and verify the contact email address. [Account setup](https://developer.chrome.com/docs/webstore/set-up-account).
4. Declare **Trader** or **Non-Trader** status. Choose the status that applies to your activity. Traders must provide and verify their legal name, address, and contact phone number. Google displays these details on the listing. A free extension does not by itself make its publisher a Non-Trader. [Trader requirements](https://developer.chrome.com/docs/webstore/program-policies/trader-verification-faq).

## Files and store images

Run `bun run store:bundle`, then upload `dist/web-store-1.1.0/full-page-1.1.0.zip` as a new item. The output folder also contains the listing text, privacy policy, and required images. The ZIP contains `manifest.json` at its root. [Package preparation](https://developer.chrome.com/docs/webstore/prepare), [ZIP upload](https://developer.chrome.com/docs/webstore/publish).

| Asset | Required size and format |
| --- | --- |
| Extension icon | `images/icon-128.png`, 128 × 128 pixels with 16-pixel transparent padding. |
| Small promotional image | `images/small-promo.png`, 440 × 280 pixels. |
| Store screenshots | `images/01-full-page.png` and `images/02-page-detail.png`, both 1280 × 800 pixels. |
| Optional marquee image | 1400 × 560 pixels, PNG or JPEG. |

Screenshots must show the extension in use. Use square corners with no padding. For a square icon, the image guide recommends 96 × 96 pixels within the 128 × 128 file. [Image requirements](https://developer.chrome.com/docs/webstore/images), [listing fields](https://developer.chrome.com/docs/webstore/cws-dashboard-listing).

The supplied screenshots show the extension capturing the included sample page. The page uses fictional content and contains no account data. Run `bun run store:assets` to regenerate the images in [store/assets](../store/assets).

## Text for the store listing

Use **Full Page** as the name and **English** as the language. Select the category that best fits screenshot tools.

You can also copy the fields and reviewer instructions from [store/listing.txt](../store/listing.txt) into the dashboard.

Copy this description:

> Capture a complete web page in Brave and save it as a PNG.
>
> Open a website and click Full Page. On first use, read the data use notice and select Agree and continue. Click Capture full page. Check the preview in Fit width, Fit page, or Actual size mode. Click Download PNG to keep the image.
>
> The Load page images option scrolls the page before capture. Full Page then restores the original scroll position. Brave shows a debugging banner while the capture runs.
>
> Full Page handles the selected page's image, address, and title on your device. It saves local previews and the Load page images setting. It has no server, analytics, or uploads. The website can load its own content during capture.
>
> Full Page encrypts previews with a key in browser memory. They expire when the browser restarts or you update, disable, or reload the extension. After each successful capture, Full Page removes expired previews and keeps at most the ten newest previews for up to seven days. Clear saved previews removes local previews and their key. Downloaded files remain until you delete them.
>
> Full Page supports HTTP and HTTPS websites. It cannot capture browser settings or protected pages. Content inside separate scrolling panels stays as displayed. Expand hidden sections before capture.

Use these listing links after the files are public:

| Field | URL |
| --- | --- |
| Homepage | <https://github.com/jewei/browser-screenshot> |
| Support | <https://github.com/jewei/browser-screenshot/issues> |
| Privacy policy | <https://github.com/jewei/browser-screenshot/blob/main/PRIVACY.md> |

## Privacy fields

The store requires a single purpose and a reason for each permission. Request only the permissions that the extension needs for its current functions. [Privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy), [permission rule](https://developer.chrome.com/docs/webstore/program-policies/permissions).

Copy this single-purpose description:

> Capture the user's selected page as a complete PNG. Let the user preview and download the image on their device.

Copy these permission reasons:

| Permission | Reason |
| --- | --- |
| `activeTab` | After the user agrees to the data use notice, read the selected tab's address and title when they open the popup. Show these details so the user can identify the page to capture. This uses temporary tab access. |
| `debugger` | Attach to the selected tab when the user starts a capture. Use the Chrome DevTools Protocol to measure the page and prepare its images. Create one full-page PNG with `Page.captureScreenshot` and `captureBeyondViewport`. Run the included page preparation functions through `Runtime.evaluate` in an isolated world. Restore the page and detach when capture ends. |
| `storage` | Save consent and the Load page images setting in `chrome.storage.local`. Keep capture progress, the latest preview link, and the encryption key in `chrome.storage.session`. Encrypt PNG previews and page details before saving them in local IndexedDB. |

Select **No, I am not using remote code**. All page preparation functions ship in the ZIP. `Runtime.evaluate` receives those functions and local arguments. It does not fetch executable code. See [capture code](../lib/capture.js) and [page code](../lib/page.js).

Declare website content and web browsing activity, including the captured page's address and title. Explain that the extension handles this data on the user's device. Screenshots can include information from pages that require sign-in. The FAQ requires disclosure of local processing and storage, so do not claim that the extension handles no user data. [Local data disclosure](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq).

Provide the public privacy policy URL. The supplied policy explains what data the extension collects, how it uses and shares that data, and how long it keeps it. The policy also includes the Limited Use statement. The extension uses data only for screenshots. It does not sell or transfer the data, use it for unrelated purposes, or use it for credit decisions. [Privacy policy rule](https://developer.chrome.com/docs/webstore/program-policies/privacy), [Limited Use rule](https://developer.chrome.com/docs/webstore/program-policies/limited-use).

## Data handling

These statements come from [capture.js](../lib/capture.js), [page.js](../lib/page.js), [storage.js](../lib/storage.js), [background.js](../background.js), and [popup.js](../popup.js).

- The extension encrypts the PNG and page details before saving them in IndexedDB. These details include the page address and title, image dimensions, file size, filename, and image loading status. Capture ID, time, and random session ID remain unencrypted so the extension can find and remove records.
- The stored address can include a query string or fragment.
- The 256-bit AES-GCM key stays in `chrome.storage.session`. Chrome keeps this storage in memory. It clears the key when the browser restarts or the user disables, reloads, or updates the extension. Previews from earlier sessions then become unreadable. [Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage#storage-areas).
- After a successful capture, the extension removes previews from past sessions and previews older than seven days. It keeps at most the ten newest previews. Startup and installation events also run cleanup. Opening an expired preview deletes it. There is no daily deletion timer. Encrypted records can remain until cleanup runs.
- Consent and the Load page images setting remain in local extension storage. Capture progress and the latest preview link use session storage.
- The extension has no server, telemetry, upload, or browser sync code. Its content security policy blocks network connections from extension pages. The source website can still load resources during capture. See [manifest.json](../manifest.json).
- Clear saved previews deletes all stored previews and the session key. It also removes images from open previews. Uninstalling the extension removes settings and consent. Downloaded PNG files remain on the device without encryption.

## Version 1.1.0 changes

Version 1.1.0 shows a data use notice before reading tab details. The user must select **Agree and continue** to proceed. **Not now** closes the popup. The background worker also checks consent before capture. This addresses the prominent disclosure requirement in FAQ section 10. [Disclosure and consent requirements](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq).

The extension encrypts page content and metadata with AES-GCM before saving them in the database. It uses a random initialization vector for each record and keeps the key only in memory. The database upgrade removes unencrypted records from version 1.0.0. This addresses the storage requirement in FAQ section 9. Encryption does not prevent access by someone who controls the device or an open preview. [Encryption requirement](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq), [handling rule](https://developer.chrome.com/docs/webstore/program-policies/data-handling).

The debugger API supports the Page and Runtime domains. The protocol documents full-page capture, and MV3 policy recognizes debugger API use. [Debugger API](https://developer.chrome.com/docs/extensions/reference/api/debugger), [capture command](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-captureScreenshot), [MV3 rules](https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements).

These changes do not confirm store approval. Explain why full-page capture needs `debugger`. Google must review the permission against its rules for minimum permissions and API use. [API-use rule](https://developer.chrome.com/docs/webstore/program-policies/api-use).

## Submit and install

1. Complete the account requirements above, including email verification, two-step verification, and trader status.
2. Upload the ZIP, listing images, description, privacy fields, and policy URL.
3. Select **Public** so users can find the listing in store searches. Select **Unlisted** for installation through a direct store URL. Both options require the same review and policy compliance. [Distribution options](https://developer.chrome.com/docs/webstore/cws-dashboard-distribution).
4. Add the reviewer steps below. Click **Submit for Review**. Choose automatic publication or publication after approval. [Submission process](https://developer.chrome.com/docs/webstore/publish).
5. Wait for Google's review. Reviews usually take a few days but can take weeks. Permissions that give broad access can extend the review time. Google may reject the submission. [Review process](https://developer.chrome.com/docs/webstore/review-process).
6. After publication, open the store URL in Brave. Click **Add to Brave** and accept the permission prompt.

Copy these reviewer steps:

> You do not need an account, payment, or test credentials to use the extension.
>
> Open https://github.com/jewei and wait for the page to load. Open Full Page from the browser toolbar. On first use, read the notice and click Agree and continue. Keep Load page images on. Click Capture full page.
>
> The browser shows a debugging banner during capture. The preview opens in a new tab. Select Fit page to check the complete image. Select Actual size to check its details. Click Download PNG. The file must include the bottom of the page. Return to the source tab and check that the extension restored the original scroll position.
>
> Close developer tools before capture. The extension cannot capture browser settings or store pages. For a page that keeps growing, turn off Load page images and capture its current content.
>
> Reload the preview during the same browser session. The image remains available. Click Clear saved previews. The extension deletes all saved previews and their session key. It also removes images from open previews. Restarting the browser expires previews because the key stays only in memory.
