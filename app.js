// app.js
(() => {
  const $ = (id) => document.getElementById(id);

  const codeEl = $("codeValue");
  const inputEl = $("codeInput");
  const errEl = $("err");
  const btnRefresh = $("btnRefresh");
  const btnGo = $("btnGo");

  const btnLight = $("btnLight");
  const btnDark  = $("btnDark");
  const btnFollow= $("btnFollow");

  const yearEl = $("year");
  yearEl.textContent = new Date().getFullYear();

  // ===== Theme =====
  const THEME_KEY = "verify_theme"; // light/dark/system
  function setTheme(mode){
    localStorage.setItem(THEME_KEY, mode);
    applyTheme(mode);
  }
  function applyTheme(mode){
    const root = document.documentElement;
    const sysDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const actual = (mode === "system") ? (sysDark ? "dark" : "light") : mode;

    if (actual === "dark") root.setAttribute("data-theme","dark");
    else root.removeAttribute("data-theme");

    [btnLight, btnDark, btnFollow].forEach(b => b.classList.remove("active"));
    if (mode === "light") btnLight.classList.add("active");
    else if (mode === "dark") btnDark.classList.add("active");
    else btnFollow.classList.add("active");
  }
  function initTheme(){
    const saved = localStorage.getItem(THEME_KEY) || "system";
    applyTheme(saved);
  }
  initTheme();

  btnLight.addEventListener("click", () => setTheme("light"));
  btnDark.addEventListener("click",  () => setTheme("dark"));
  btnFollow.addEventListener("click",() => setTheme("system"));

  if (window.matchMedia){
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      const saved = localStorage.getItem(THEME_KEY) || "system";
      if (saved === "system") applyTheme("system");
    });
  }

  // ===== Verify code =====
  function randomCode(){
    return String(Math.floor(1000 + Math.random()*9000));
  }

  let currentCode = randomCode();
  function renderCode(){
    codeEl.textContent = currentCode.split("").join(" ");
    errEl.textContent = "";
    inputEl.value = "";
    inputEl.focus();
  }

  function refreshCode(){
    currentCode = randomCode();
    btnRefresh.classList.add("rot");
    setTimeout(() => btnRefresh.classList.remove("rot"), 350);
    renderCode();
  }

  btnRefresh.addEventListener("click", refreshCode);

  function normalizeInput(v){
    return (v || "").replace(/\D/g,"").slice(0,4);
  }

  inputEl.addEventListener("input", () => {
    const v = normalizeInput(inputEl.value);
    if (inputEl.value !== v) inputEl.value = v;
    errEl.textContent = "";
  });

  // ===== Smart redirect (latency test) =====
  function nowMs(){ return (performance && performance.now) ? performance.now() : Date.now(); }

  function joinUrl(base, path){
    if (!path) return base;
    const b = base.replace(/\/+$/,"");
    const p = path.startsWith("/") ? path : ("/" + path);
    return b + p;
  }

  async function probeOnce(url, timeoutMs){
    const controller = new AbortController();
    const t0 = nowMs();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    // no-cors：允许跨域“发出去”，但拿不到响应内容；我们只计时 promise resolve/reject
    // cache: 'no-store' 避免缓存干扰
    try{
      await fetch(url, {
        method: "GET",
        mode: "no-cors",
        cache: "no-store",
        signal: controller.signal
      });
      const t1 = nowMs();
      return { ok: true, rtt: Math.round(t1 - t0) };
    }catch(e){
      return { ok: false, rtt: Infinity };
    }finally{
      clearTimeout(timer);
    }
  }

  async function probeUrl(baseUrl, cfg){
    const attempts = Math.max(1, Number(cfg.probeAttempts || 1));
    const timeoutMs = Math.max(500, Number(cfg.probeTimeoutMs || 2500));
    const probePath = cfg.probePath || "/";
    const probeUrl = joinUrl(baseUrl, probePath);

    let best = Infinity;
    for (let i=0;i<attempts;i++){
      const res = await probeOnce(probeUrl, timeoutMs);
      if (res.ok && res.rtt < best) best = res.rtt;
    }
    return best;
  }

  async function pickBestCandidate(cfg){
    const list = Array.isArray(cfg.redirectCandidates) ? cfg.redirectCandidates.filter(Boolean) : [];
    if (list.length === 0) return null;

    // 并发测速，避免整体等待过长
    const results = await Promise.all(list.map(async (u) => {
      const rtt = await probeUrl(u, cfg);
      return { url: u, rtt };
    }));

    results.sort((a,b) => a.rtt - b.rtt);
    const best = results[0];
    if (!best || !isFinite(best.rtt)) return null;
    return best.url;
  }

  async function successRedirectSmart(){
    const cfg = window.VERIFY_CONFIG || {};
    const fallback = cfg.fallbackUrl || "./success.html";

    // 给用户一点提示
    errEl.style.color = "var(--muted)";
    errEl.textContent = "验证通过，正在为你选择延迟最低的官网入口…";

    const best = await pickBestCandidate(cfg);
    if (best){
      // 记录给 success 页面展示
      try{
        sessionStorage.setItem("official_best_url", best);
        sessionStorage.setItem("official_candidates", JSON.stringify(cfg.redirectCandidates || []));
      }catch{}
      window.location.href = best;
      return;
    }

    // 没有可用候选：跳到本地 success.html
    try{
      sessionStorage.setItem("official_candidates", JSON.stringify(cfg.redirectCandidates || []));
    }catch{}
    window.location.href = fallback;
  }

  function check(){
    const v = normalizeInput(inputEl.value);
    if (v.length !== 4){
      errEl.style.color = "var(--red)";
      errEl.textContent = "请输入 4 位验证码。";
      return;
    }
    if (v !== currentCode){
      errEl.style.color = "var(--red)";
      errEl.textContent = "验证码不正确，请重试。";
      return;
    }
    sessionStorage.setItem("official_verify_passed","1");
    successRedirectSmart();
  }

  btnGo.addEventListener("click", check);
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") check();
  });

  // Optional: query pass (OFF by default)
  try{
    const cfg = window.VERIFY_CONFIG || {};
    const params = new URLSearchParams(window.location.search);
    if (cfg.allowQueryPass && params.has("pass")){
      sessionStorage.setItem("official_verify_passed","1");
      successRedirectSmart();
      return;
    }
  }catch{}

  renderCode();
})();
