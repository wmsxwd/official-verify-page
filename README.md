# 官网访问验证（静态页面）

一个纯前端静态项目，用于“官网访问验证码验证”场景。
- 随机 4 位验证码
- 可换一组验证码
- 输入错误提示
- 亮/暗/跟随主题切换（记忆保存）
- 验证成功跳转到 success.html（可自行替换为真实官网/最新地址页）

## 运行方式

### 1) 本地打开（最简单）
直接双击 `index.html` 即可（推荐用 Chrome/Edge）。

### 2) 本地静态服务器（更接近线上）
在当前目录执行：
- Python:
  ```bash
  python -m http.server 8000
  ```
然后访问：
- http://127.0.0.1:8000

### 3) 部署
把整个目录上传到：
- GitHub Pages / Cloudflare Pages
- 你自己的 Nginx 静态站点目录

## 配置跳转地址
编辑 `config.js`：
- `redirectUrl`: 验证通过后跳转到的地址（默认 `./success.html`）



## 两种工作方式（跳转 / 列表打码）

在 `config.js` 里设置：

- 跳转模式（验证后自动测速最低延迟并跳转）：
  ```js
  mode: "redirect"
  ```

- 列表模式（验证后展示“入口列表（域名打码）”，用户点击进入）：
  ```js
  mode: "list",
  maskDisplay: true
  ```

入口列表在 `entries` 中配置：
```js
entries: [
  { name: "官网入口 1", url: "https://a.xxx.com", note: "大陆推荐使用，海外网站会提示不安全，无视即可。" },
  { name: "官网入口 2", url: "https://b.xxx.com", note: "大陆推荐使用，海外网站会提示不安全，无视即可。" },
  { name: "官网入口 3", url: "https://c.xxx.com", note: "海外推荐使用，大陆不可用，自动适配当前网络线路。" }
]
```
