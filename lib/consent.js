export const DISCLOSURE_VERSION = 1;

export async function hasConsent() {
  const { disclosureVersion } = await chrome.storage.local.get("disclosureVersion");
  return disclosureVersion === DISCLOSURE_VERSION;
}

export function acceptDisclosure() {
  return chrome.storage.local.set({ disclosureVersion: DISCLOSURE_VERSION });
}
