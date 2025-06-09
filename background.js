chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ checked: true }); // default ON
});