// content.js content script 只负责把 hover 到的链接告诉 sidepanel：

let hoverTimer = null;
let lastLink = null;
const HOVER_DELAY = 500; // 500ms 延迟，可调整

document.addEventListener("mouseover", (e) => {
  const a = e.target.closest("a");
  if (!a) return;

  // 如果同一个链接重复 hover，重置定时器
  if (lastLink === a.href) return;

  lastLink = a.href;

  if (hoverTimer) clearTimeout(hoverTimer);

  hoverTimer = setTimeout(() => {
    console.log("hover:", a.href);
    chrome.runtime.sendMessage({ type: "HOVER_LINK", url: a.href });
  }, HOVER_DELAY);
});

document.addEventListener("mouseout", (e) => {
  const a = e.target.closest("a");
  if (!a) return;

  // 鼠标离开链接，取消定时器
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
  lastLink = null;
});
