const iframe = document.getElementById("preview-frame");
const toast = document.getElementById("toast");
const urlSpan = document.querySelector(".url");

function showToast(msg) {
  toast.textContent = msg;
  toast.style.opacity = "1";
  setTimeout(() => { toast.style.opacity = "0"; }, 2000);
}

function setUrl(url, html) {
  urlSpan.textContent = url;
  const blob = new Blob([html], { type: "text/html" });
  iframe.src = URL.createObjectURL(blob);
}

document.querySelector(".header").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;

  const act = btn.dataset.act;

  if (act === "copy") {
    try {
      await navigator.clipboard.writeText(urlSpan.textContent);
      showToast("已复制地址");
    } catch (err) {
      showToast("复制失败: " + err);
    }
  } else if (act === "newtab") {
    chrome.tabs.create({ url: urlSpan.textContent, active: false });
  } else if (act === "newwindow") {
    chrome.windows.create({ url: urlSpan.textContent, width: 800, height: 600 });
  } else if (act === "close") {
    window.close();
  }
});


// 收到 content script hover 链接
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "HOVER_LINK") {
    chrome.runtime.sendMessage(
      { type: "PREVIEW_REQUEST", url: msg.url },
      (res) => {
        if (!res) {
          showToast("后台无响应");
          return;
        }
        if (res.ok) {
          // 构造带 <base> 的 HTML
          const html = `<base href="${res.baseUrl}">\n` + res.html;
          iframe.srcdoc = html;
          setUrl(msg.url, html);
        } else {
          showToast("加载失败: " + res.error);
        }
      }
    );
  }
});
