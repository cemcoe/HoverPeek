# HoverPeek Sidepanel

**HoverPeek Sidepanel** 是一个浏览器扩展 / 插件，允许用户在 **hover（悬停）链接时**，在侧边面板预览网页内容。它支持跨域预览，保留网页样式和脚本，并美化滚动条。

---

## 功能特性

* **悬停预览**：在页面中 hover 链接即可在侧边面板显示目标网页内容。
* **跨域支持**：即使目标网页设置了 X-Frame-Options 或 CSP 限制，也能通过后台 fetch 获取 HTML 并显示。
* **保留网页样式与脚本**：使用 `<base>` 标签确保 CSS / JS 相对路径加载正常。
* **滚动条美化**：sidepanel 自身不显示滚动条，iframe 滚动条视觉美观。
* **错误提示**：加载失败或网络错误时显示 toast 提示。
* **轻量、无侵入**：不修改页面原有 DOM 样式或 JS 行为。

---

## 技术原理

1. **Hover 捕获（content.js）**

   * 内容脚本监听页面 `mouseover` 事件，当鼠标悬停在 `<a>` 标签上时捕获链接。
   * 通过 `chrome.runtime.sendMessage` 向 `background.js` 发送消息 `{ type: "PREVIEW_REQUEST", url }`，请求后台抓取网页 HTML。

2. **后台 Fetch HTML（background.js）**

   * `background.js` 接收到 hover 消息后，使用 `fetch(url)` 获取目标网页 HTML。
   * **注意**：fetch 不携带用户 cookie，这样即使目标页面设置了 X-Frame-Options 或 CSP，也能顺利获取 HTML。
   * 获取成功后，将 HTML 包装在消息中返回给 sidepanel：

     ```js
     sendResponse({ ok: true, html: htmlContent, base: url });
     ```
   * 如果 fetch 失败或异常，则返回错误消息：

     ```js
     sendResponse({ ok: false, error: "网络或跨域错误" });
     ```
   * `return true` 保证异步 `sendResponse` 在 fetch 完成后仍有效。

3. **Sidepanel 展示（sidepanel.html + sidepanel.js）**

   * `sidepanel.js` 通过 `chrome.runtime.onMessage.addListener` 接收后台返回的 HTML 消息。
   * 成功接收后，将 HTML 注入 `<iframe srcdoc>` 展示：

     ```js
     const blob = new Blob([`<base href="${base}">` + html], { type: "text/html" });
     iframe.src = URL.createObjectURL(blob);
     ```
   * `<base>` 标签确保相对路径 CSS / JS / 图片等资源能够正常加载。
   * iframe 高度自适应内容，并美化滚动条，避免 sidepanel 本身滚动条重复显示。
   * 如果 fetch 失败或 HTML 异常，则显示 toast 提示错误信息。

4. **容错处理**

   * fetch 失败、HTML 解析异常或 URL 无效时，toast 提示用户。
   * 避免 inline script / style，以防止 CSP 报错。

---

## 数据通信

HoverPeek 使用 **异步消息传递** 在 content script、background script 和 sidepanel 之间交换数据：

| 发送方                           | 接收方             | 数据内容                                                | 说明                       |
| ----------------------------- | --------------- | --------------------------------------------------- | ------------------------ |
| `content.js`                  | `background.js` | `{ type: "PREVIEW_REQUEST", url }`                  | 请求后台抓取 HTML              |
| `background.js`               | `sidepanel.js`  | `{ ok: true, html, base }` 或 `{ ok: false, error }` | 返回网页 HTML 或错误信息          |
| `content.js` → `sidepanel.js` | -               | `{ type: "HOVER_LINK", url }`                       | 告知 sidepanel 当前 hover 链接 |

* 异步通信通过 **`chrome.runtime.sendMessage` / `onMessage`** 完成。
* `return true` 用于保持异步回调 `sendResponse` 有效。
* toast 提示在 sidepanel 内显示操作或错误信息。

---

## 工作流程图示意

```text
+----------------+         +----------------+         +----------------+
|                | hover   |                | fetch   |                |
| content.js     | ------> | background.js  | ------> | sidepanel.js   |
| 捕获链接        |         | 请求网页 HTML   |         | 展示 HTML     |
+----------------+         +----------------+         +----------------+
        ^                           |                          |
        |                           | sendResponse             |
        +---------------------------+--------------------------+
                    异步消息传递 HTML 或错误信息
```

1. 用户 hover 页面中的链接
2. content script 捕获事件并向 background 发送请求
3. background fetch 目标网页 HTML
4. HTML 返回 sidepanel，由 sidepanel.js 渲染显示
5. 异常或失败通过 toast 提示

---

## 安装方式

1. 下载插件文件：

   * `manifest.json`
   * `sidepanel.html`
   * `sidepanel.css`
   * `sidepanel.js`
   * `background.js`
   * `content.js`

2. 在 Chrome / Edge 浏览器打开扩展管理：

   * 地址栏输入 `chrome://extensions/`
   * 打开 **开发者模式**
   * 点击 **加载已解压的扩展程序**
   * 选择插件所在目录

3. 确认插件已启用。

---

## 使用方法

1. 打开任意网页。
2. 将鼠标悬停在页面中的链接上。
3. 侧边面板会自动显示预览内容。
4. 支持操作：

   * 点击 iframe 右上按钮打开 **新标签** 或 **新窗口**
   * 点击 **复制** 按钮复制当前预览链接
   * **toast** 提示操作结果
5. 滚动条：

   * iframe 内部滚动条可用
   * sidepanel 外部无滚动条，更美观

---

## 插件文件说明

| 文件               | 说明                                |
| ---------------- | --------------------------------- |
| `manifest.json`  | Chrome / Edge 扩展配置文件              |
| `sidepanel.html` | 插件的侧边面板 HTML                      |
| `sidepanel.css`  | 样式文件，控制 iframe 和面板样式              |
| `sidepanel.js`   | 面板逻辑，包括接收消息、显示 HTML、toast 提示等     |
| `background.js`  | 后台脚本，负责 fetch 目标网页 HTML           |
| `content.js`     | 内容脚本，捕获 hover 事件并向 sidepanel 发送消息 |

---

## 注意事项

* **跨域限制**：

  * 插件使用后台 fetch 获取 HTML，不携带用户 cookie，部分页面可能显示不完全。
  * 对完全依赖 JS 渲染的 SPA 页面（如部分 Discourse / React 页面），可能需要额外代理或解析。

* **CSP 限制**：

  * 插件使用 `<base>` 保留网页相对路径，避免 CSP 拒绝 inline style / script。

* **滚动条**：

  * iframe 高度自适应，但跨域页面无法精确计算内容高度，滚动条显示可能与原站略有差异。

* **性能**：

  * 悬停预览有一定延迟（默认 0.8 秒），可在 content script 中修改。

---

## 贡献

欢迎提交 issues 或 pull requests，改进以下功能：

* 完整代理 CSS/JS，实现高保真网页预览
* 支持 SPA 页面动态渲染
* 自定义 hover 延迟、面板位置和大小

---

## License

MIT License

---

