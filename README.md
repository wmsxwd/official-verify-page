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

## 多个官网地址轮询 + 自动选择最低延迟并跳转

编辑 `config.js`：

```js
window.VERIFY_CONFIG = {
  redirectCandidates: [
    "https://a.yourdomain.com",
    "https://b.yourdomain.com",
    "https://c.yourdomain.com"
  ],
  probePath: "/generate_204",
  probeTimeoutMs: 2500,
  probeAttempts: 2,
  fallbackUrl: "./success.html"
};
```

### 关于测速准确性（重要）
纯前端静态页面受浏览器跨域限制，测速只能做“请求可达 + 大致耗时”的近似测量（`fetch no-cors`）。
为了更稳定，建议你的每个官网都提供一个轻量探测路径，例如：
- `/generate_204`（返回 204）
- `/ping.txt`（返回简单文本）

并确保该路径允许匿名访问、响应尽量轻量。
