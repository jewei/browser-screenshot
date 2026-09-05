# Full Page privacy policy

Effective date: 5 September 2026. This policy describes version 1.1.0.

Full Page is a browser extension maintained by [Jewei Mak](https://github.com/jewei). Its purpose is to capture a selected web page, show a local preview, and let you download a PNG.

## Data the extension handles

Before first use, the popup describes its data use and asks you to agree. It does not read tab details or capture a page before you agree. Select **Not now** to close it without agreement.

After agreement, opening the popup reads the selected tab's title and address to identify the page. If the tab API does not supply those details, the extension uses the browser's debugger target list to find the selected tab. That list can contain details about other open tabs. The extension selects the matching tab and does not save the list.

When you start a capture, the extension reads the page size and rendered content. It creates an image of the page. The image can contain any information visible on that page. The extension stores the PNG, page address, title, capture time, image dimensions, file size, generated filename, and capture identifier in a local preview record.

The extension also stores your agreement to the data use notice and your image loading preference. It keeps capture progress and the selected tab identifier in session storage.

## Purpose and sharing

The extension uses page data only to identify the selected tab, create its screenshot, and provide the preview and download. It does not upload screenshots or page data to the developer or another service. It does not include analytics, advertisements, or tracking code. It does not sell user data or use it for advertising, profiling, or credit decisions. The developer does not receive or read your captures through the extension.

Full Page follows the Chrome Web Store User Data Policy, including its Limited Use requirements. It uses page data only for the screenshot features described here. It does not transfer that data to the developer or third parties.

The source website can make its normal network requests when the extension scrolls the page or loads images. Opening a source page or a support link also contacts that website. Those websites have their own privacy policies.

## Storage and retention

The PNG and page details are encrypted with AES-GCM using a 256-bit key before storage in the extension's IndexedDB database. Each record has a new random initialization vector. The capture identifier, capture time, and random session identifier remain outside the encrypted content to support lookup and cleanup.

The encryption key stays in browser memory through chrome.storage.session. The extension does not write the key to disk or send it over the network. A browser restart, extension update, disable, or reload clears that key. Old previews then become unreadable. Encryption does not prevent access from someone who controls your device or an open preview.

Each successful new capture removes previews from past sessions, removes previews older than seven days, and keeps at most the ten newest records. Opening an expired preview also deletes its record. Startup and installation events remove records that no longer have a session key. There is no fixed daily deletion timer. Encrypted records can remain on disk until cleanup runs. An open preview can keep its image in memory until the page closes or reloads. **Clear saved previews** also closes those image views.

An update from version 1.0.0 removes its unencrypted preview database records. Downloaded PNG files are not encrypted by the extension. Their names can contain the source hostname and path, but omit the address query string and fragment.

Your agreement and image loading preference stay in local extension storage until you remove them or uninstall the extension. Capture status is stored for the browser session.

## Access and deletion

Use the preview to view and download a screenshot. Select **Clear saved previews** in a preview to delete all preview records and the session encryption key. Removing the extension also removes its preferences and saved agreement. Downloaded PNG files remain in the folder that you selected. Delete those files through your operating system if you no longer need them.

## Contact

For questions about this extension or its data handling, use the [project issue tracker](https://github.com/jewei/browser-screenshot/issues). Issues are public. Do not attach a private screenshot, password, or other sensitive information.

## Changes

This policy will be updated if the extension's data handling changes. The effective date and applicable extension version will appear at the top of this file.
