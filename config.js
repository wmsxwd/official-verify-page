// config.js
// 官网访问验证（静态页面）配置
//
// 支持两种方式：
// 1) mode = "redirect" ：验证成功后自动测速，选择最低延迟入口并跳转（跳转模式）
// 2) mode = "list"     ：验证成功后不自动跳转，展示“入口列表（域名打码）”，用户点击进入（如截图）
//
// 注意：浏览器跨域限制下，测速只能做“可达性 + 响应耗时”的近似测量（无法读取跨域响应内容）。
// 建议每个官网提供轻量探测路径（比如 /generate_204 或 /ping.txt），并确保匿名可访问。

window.VERIFY_CONFIG = {
  // "redirect" 或 "list"
  mode: "redirect",

  // 入口列表（redirect 用于测速候选；list 用于展示卡片）
  entries: [
    // { name: "官网入口 1", url: "https://a.example.com", note: "大陆推荐使用，海外网站会提示不安全，无视即可。" },
    // { name: "官网入口 2", url: "https://b.example.com", note: "大陆推荐使用，海外网站会提示不安全，无视即可。" },
    // { name: "官网入口 3", url: "https://c.example.com", note: "海外推荐使用，大陆不可用，自动适配当前网络线路。" },
    // { name: "官网入口 4", url: "https://d.example.com", note: "海外推荐使用，大陆不可用，自动适配当前网络线路。" }
  ],

  // === 跳转模式专用（mode=redirect） ===
  probePath: "/generate_204",
  probeTimeoutMs: 2500,
  probeAttempts: 2,

  // === 列表模式专用（mode=list） ===
  maskDisplay: true,

  // 兜底页
  fallbackUrl: "./success.html",

  // 可选：是否允许 ?pass=xxxx 直接通过（默认关闭）
  allowQueryPass: false
};
