# Full Page privacy policy

Effective date: 5 September 2026. This policy describes version 1.0.0.

Full Page is a browser extension maintained by [Jewei Mak](https://github.com/jewei). Its purpose is to capture a selected web page, show a local preview, and let you download a PNG.

## Data the extension handles

When you open the popup, the extension reads the selected tab's title and address to identify the page. If the tab API does not supply those details, the extension uses the browser's debugger target list to find the selected tab. That list can contain details about other open tabs. The extension selects the matching tab and does not save the list.

When you start a capture, the extension reads the page size and rendered content. It creates an image of the page. The image can contain any information visible on that page. The extension stores the PNG, page address, title, capture time, image dimensions, file size, generated filename, and capture identifier in a local preview record.

The extension also stores your image loading preference. It keeps capture progress and the selected tab identifier in session storage.

## Purpose and sharing

The extension uses page data only to identify the selected tab, create its screenshot, and provide the preview and download. It does not upload screenshots or page data to the developer or another service. It does not include analytics, advertisements, or tracking code. It does not sell user data or use it for advertising, profiling, or credit decisions. The developer does not receive or read your captures through the extension.

The source website can make its normal network requests when the extension scrolls the page or loads images. Opening a source page or a support link also contacts that website. Those websites have their own privacy policies.

## Storage and retention

Preview records are stored in the extension's IndexedDB database on your device. Version 1.0.0 does not add application-level encryption to those records. Access is subject to the browser's storage controls and your device security.

Each successful new capture removes preview records older than seven days and keeps at most the ten newest records. This cleanup runs when you capture a page. It does not run on a fixed daily schedule. An open preview can keep its image in memory until the page closes or reloads.

Your image loading preference stays in local extension storage until you remove it or uninstall the extension. Capture status is stored for the browser session.

## Access and deletion

Use the preview to view and download a screenshot. Removing the extension from the browser removes its stored preview records and preferences. Downloaded PNG files remain in the folder that you selected. Delete those files through your operating system if you no longer need them.

## Contact

For questions about this extension or its data handling, use the [project issue tracker](https://github.com/jewei/browser-screenshot/issues). Issues are public. Do not attach a private screenshot, password, or other sensitive information.

## Changes

This policy will be updated if the extension's data handling changes. The effective date and applicable extension version will appear at the top of this file.
