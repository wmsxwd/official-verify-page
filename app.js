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

  const resultSection = $("resultSection");
  const resultList = $("resultList");

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
    errEl.style.color = "";
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
    errEl.style.color = "";
    errEl.textContent = "";
  });

  // ===== Masking (list mode) =====
  function maskHost(host){
    if (!host) return host;

    // IPv4
    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)){
      const p = host.split(".");
      const a2 = p[0].length >= 2 ? p[0].slice(0,2) : p[0];
      return `${a2}******${p[2]}.${p[3]}`; // e.g. 14******3.128
    }

    // Domain
    const keepHead = 2;
    const keepTail = 5; // e.g. o.com
    if (host.length <= keepHead + keepTail) return host;
    return host.slice(0, keepHead) + "****" + host.slice(-keepTail);
  }

  function maskUrl(url){
    try{
      const u = new URL(url);
      const maskedHost = maskHost(u.host);
      return `${u.protocol}//${maskedHost}${(u.pathname && u.pathname !== "/") ? u.pathname : ""}`;
    }catch{
      return url;
    }
  }

  function escapeHtml(s){
    return String(s)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#39;");
  }

  // ===== Redirect mode (latency test) =====
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
    const url = joinUrl(baseUrl, probePath);

    let best = Infinity;
    for (let i=0;i<attempts;i++){
      const res = await probeOnce(url, timeoutMs);
      if (res.ok && res.rtt < best) best = res.rtt;
    }
    return best;
  }

  async function pickBest(cfg){
    const entries = Array.isArray(cfg.entries) ? cfg.entries : [];
    const urls = entries.map(e => e && e.url).filter(Boolean);
    if (!urls.length) return null;

    const results = await Promise.all(urls.map(async (u) => ({ url: u, rtt: await probeUrl(u, cfg) })));
    results.sort((a,b) => a.rtt - b.rtt);
    const best = results[0];
    if (!best || !isFinite(best.rtt)) return null;
    return best.url;
  }

  async function redirectMode(cfg){
    const fallback = cfg.fallbackUrl || "./success.html";
    errEl.style.color = "var(--muted)";
    errEl.textContent = "验证通过，正在为你选择延迟最低的官网入口…";

    const best = await pickBest(cfg);
    if (best){
      try{
        sessionStorage.setItem("official_best_url", best);
        sessionStorage.setItem("official_candidates", JSON.stringify((cfg.entries||[]).map(e=>e.url).filter(Boolean)));
      }catch{}
      window.location.href = best;
      return;
    }
    window.location.href = fallback;
  }

  // ===== List mode =====
  function listMode(cfg){
    const entries = Array.isArray(cfg.entries) ? cfg.entries.filter(e => e && e.url) : [];

    if (!resultSection || !resultList){
      window.location.href = cfg.fallbackUrl || "./success.html";
      return;
    }

    resultList.innerHTML = "";

    if (!entries.length){
      resultList.innerHTML = '<div class="entry"><div class="entry-left"><div class="badge">!</div><div class="entry-main"><div class="entry-name">未配置入口</div><div class="entry-note">请在 config.js 的 entries 中填写官网地址列表。</div></div></div></div>';
      resultSection.style.display = "";
      resultSection.scrollIntoView({behavior:"smooth", block:"start"});
      return;
    }

    const mask = cfg.maskDisplay !== false;

    entries.forEach((e, idx) => {
      const name = e.name || `官网入口 ${idx+1}`;
      const url = e.url;
      const note = e.note || "大陆推荐使用，海外网站会提示不安全，无视即可。";
      const shown = mask ? maskUrl(url) : url;

      const div = document.createElement("div");
      div.className = "entry";
      div.innerHTML = `
        <div class="entry-left">
          <div class="badge">${idx+1}</div>
          <div class="entry-main">
            <div class="entry-name">${escapeHtml(name)}</div>
            <div class="entry-url">${escapeHtml(shown)}</div>
            <div class="entry-note">${escapeHtml(note)}</div>
          </div>
        </div>
        <button class="entry-btn" type="button">点击进入</button>
      `;
      div.querySelector(".entry-btn").addEventListener("click", () => {
        window.open(url, "_blank", "noopener");
      });
      resultList.appendChild(div);
    });

    errEl.style.color = "var(--green)";
    errEl.textContent = "验证通过。";

    btnGo.disabled = true;
    btnGo.style.opacity = "0.85";
    btnGo.textContent = "已解锁（请从下方选择入口）";

    resultSection.style.display = "";
    resultSection.scrollIntoView({behavior:"smooth", block:"start"});
  }

  function onPass(){
    const cfg = window.VERIFY_CONFIG || {};
    const mode = String(cfg.mode || "redirect").toLowerCase();
    if (mode === "list") listMode(cfg);
    else redirectMode(cfg);
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
    onPass();
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
      onPass();
      return;
    }
  }catch{}

  renderCode();
})();
