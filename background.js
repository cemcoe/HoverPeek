// background.js

// 当用户点击扩展图标时，打开 side panel
chrome.action.onClicked.addListener((tab) => {
  console.log(tab);
  chrome.sidePanel.open({ tabId: tab.id });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "PREVIEW_REQUEST") {
    (async () => {
      try {
        const res = await fetch(msg.url, { credentials: "omit" });
        const html = await res.text();
        const baseUrl = new URL(msg.url).origin + "/";
        sendResponse({ ok: true, html, baseUrl });
      } catch (err) {
        sendResponse({ ok: false, error: err.toString() });
      }
    })();
    return true; // 异步 sendResponse
  }
});
