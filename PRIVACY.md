# Full Page privacy policy

Effective date: 5 September 2026. This policy describes version 1.1.0.

[Jewei Mak](https://github.com/jewei) maintains Full Page. The browser extension captures a selected web page, shows a local preview, and lets you download a PNG.

## Data the extension handles

Before first use, the popup describes how the extension uses data and asks you to agree. The extension does not read tab details or capture a page before you agree. Select **Not now** to close the popup without agreement.

After you agree, the extension reads the selected tab's title and address when you open the popup. If the tab API does not supply those details, the extension finds the selected tab in the browser's debugger target list. That list can contain details about other open tabs. The extension selects the matching tab and does not save the list.

When you start a capture, the extension reads the page size and rendered content to create an image. The image can contain any information visible on that page. The extension saves a local preview record with the PNG and these details:

- Page address and title.
- Capture time and identifier.
- Image dimensions and file size.
- Generated filename and image loading status.

The extension also saves your agreement to the data use notice and your image loading preference. It keeps capture progress, the selected tab identifier, and the latest preview link in session storage.

## Purpose and sharing

The extension uses page data only to identify the selected tab, capture the page, and let you preview and download the image. It does not upload screenshots or page data to the developer or another service. It has no analytics, advertisements, or tracking code. It does not sell user data or use it for advertising, profiling, or credit decisions. The developer does not receive or read your captures through the extension.

Full Page follows the Chrome Web Store User Data Policy, including its Limited Use requirements. It uses page data only for the screenshot features described here. It does not transfer that data to the developer or third parties.

The source website can make its normal network requests when the extension scrolls the page or loads images. Opening a source page or a support link also contacts that website. Those websites have their own privacy policies.

## Storage and retention

The extension encrypts the PNG and page details with a 256-bit AES-GCM key before saving them in its IndexedDB database. Each record has a new random initialization vector. The capture identifier, capture time, and random session identifier remain unencrypted so the extension can find and remove records.

The encryption key stays in browser memory through `chrome.storage.session`. The extension does not write the key to disk or send it over the network. The browser clears the key when it restarts or you update, disable, or reload the extension. Old previews then become unreadable. Encryption does not prevent access by someone who controls your device or an open preview.

After each successful capture, the extension removes previews from past sessions and previews older than seven days. It keeps at most the ten newest records. Opening an expired preview also deletes its record. At startup and installation, the extension removes records that no longer have a session key.

There is no daily deletion timer. Encrypted records can remain on disk until cleanup runs. An open preview can keep its image in memory until you close or reload the page. **Clear saved previews** also removes images from open previews.

An update from version 1.0.0 removes its unencrypted preview database records. The extension does not encrypt downloaded PNG files. Their names can contain the source hostname and path. The names omit the address query string and fragment.

Your agreement and image loading preference stay in local extension storage until you remove them or uninstall the extension. Capture status stays in session storage until the session ends or you clear saved previews.

## Access and deletion

Use the preview to view and download a screenshot. Select **Clear saved previews** to delete all preview records and the session encryption key. Uninstall the extension to remove its preferences and saved agreement.

Downloaded PNG files remain in the folder that you selected. Delete those files through your operating system if you no longer need them.

## Contact

For questions about this extension or its data handling, use the [project issue tracker](https://github.com/jewei/browser-screenshot/issues). Issues are public. Do not attach a private screenshot, password, or other sensitive information.

## Changes

The maintainer will update this policy if the extension changes how it handles data. The effective date and extension version will appear at the top of this file.
