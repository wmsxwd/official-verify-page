// config.js
// 你可以在这里配置验证通过后跳转到哪里。
// 支持：多个官网地址轮询 + 自动测速选择最低延迟并跳转（纯前端静态）
//
// 注意：浏览器跨域限制下，测速只能做“可达性 + 响应耗时”的近似测量（无法读取跨域响应内容）。
// 建议让每个官网都提供一个轻量探测路径（比如 /generate_204 或 /ping.txt），并确保可被匿名访问。

window.VERIFY_CONFIG = {
  // 方案A：验证成功后先测速，从下面列表选最低延迟并跳转
  redirectCandidates: [
    // "https://site-c.example.com"
    // "https://site-c.example.com"
    // "https://site-c.example.com"
  ],

  // 可选：测速时拼接的探测路径（不填则用根路径 /）
  // 例如："/generate_204" 或 "/ping.txt"
  probePath: "/generate_204",

  // 单次探测超时（毫秒）
  probeTimeoutMs: 2500,

  // 每个候选地址探测次数（取最小值，减小抖动）
  probeAttempts: 2,

  // 都失败时的兜底：跳转到本地 success.html（可展示手动入口列表）
  fallbackUrl: "./success.html",

  // 可选：是否允许 ?pass=xxxx 这种方式直接通过（默认关闭）
  allowQueryPass: false
};
