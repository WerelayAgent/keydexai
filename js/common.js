/* Keydex AI — shared: header, mobile menu, modals, tabs, copy, busy, toasts, number formats (KF.fmt), API helper */
document.documentElement.classList.add("js");   // X3-F4: no-JS fallback for the hero scene (html:not(.js))
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const str = (id, fb) => { const el = document.getElementById(id); return (el && el.textContent.trim()) || fb; };
  /* С-3 (server 1.4.2): a 429 from /api/trial carries retry_after_min → «Next one in {n} min.»; without it the plain line */
  const trialLimit = (r, fb) => {
    const e = (r && r.error) || {}, t = str("s-trial-limit-n", "");
    if (e.scope === "service") return str("s-trial-cap", e.message || fb || "");   // server 1.5: the cap for all visitors — no «Next one in»
    const m = Number.isFinite(e.retry_after_min) ? e.retry_after_min : Number.isFinite(e.retry_after_s) ? e.retry_after_s / 60 : NaN;
    const th = str("s-trial-limit-h", "");   // PU Н-2: «1356 min» is not read — hours from 60 min on (slot connect.trial.limit.h), else the line without a time
    if (Number.isFinite(m) && m >= 60) return th ? th.replace("{h}", String(Math.ceil(m / 60))) : str("s-trial-limit", fb || e.message || "");
    return Number.isFinite(m) && t ? t.replace("{n}", String(Math.max(1, Math.ceil(m)))) : str("s-trial-limit", fb || e.message || "");
  };
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
  };
  /* V1-11: «Pause animations» — kept for the tab; paused at load = the final frame of every scene (the reduced-motion branch) */
  const motionOff = store.get("kf.motion") === "off";
  if (motionOff) document.documentElement.dataset.motion = "off";
  let paused = motionOff;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches || motionOff;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  /* V1-64 (X2-F4): images named in JS carry the same ?v=<hash> as the HTML (map written by build.py) — no second copy of a cached file */
  const KF_V = /*KFV*/{"/img/stocks/AAPL.webp":"3a60754b","/img/stocks/AAPL@64.webp":"cb182404","/img/stocks/AMC.webp":"509ce3d3","/img/stocks/AMC@64.webp":"35b677aa","/img/stocks/AMD.webp":"29ca8c6a","/img/stocks/AMD@64.webp":"c9644c3a","/img/stocks/AMZN.webp":"3421f53c","/img/stocks/AMZN@64.webp":"9e13b428","/img/stocks/ASML.webp":"202bab40","/img/stocks/ASML@64.webp":"a4e337d8","/img/stocks/AVGO.webp":"5a7c2119","/img/stocks/AVGO@64.webp":"22ec940d","/img/stocks/BA.webp":"af114ccd","/img/stocks/BA@64.webp":"3232b194","/img/stocks/BABA.webp":"aac9bffb","/img/stocks/BABA@64.webp":"cb4eca99","/img/stocks/BB.webp":"f0c33ab6","/img/stocks/BB@64.webp":"c7147978","/img/stocks/BE.webp":"0e6cc8b7","/img/stocks/BE@64.webp":"5df8aaa9","/img/stocks/COST.webp":"622ec1e2","/img/stocks/COST@64.webp":"7843ec26","/img/stocks/CRCL.webp":"4649e5e8","/img/stocks/CRCL@64.webp":"9da05ff9","/img/stocks/DELL.webp":"74807c5f","/img/stocks/DELL@64.webp":"055d619a","/img/stocks/DJT.webp":"f88a98b3","/img/stocks/DJT@64.webp":"f6c640c7","/img/stocks/F.webp":"815cdf5c","/img/stocks/F@64.webp":"5b9c226c","/img/stocks/FIG.webp":"0d6bb633","/img/stocks/FIG@64.webp":"b43a79b6","/img/stocks/GLD.webp":"2482b887","/img/stocks/GLD@64.webp":"b1d4c669","/img/stocks/GLXY.webp":"68265617","/img/stocks/GLXY@64.webp":"a51f2ae5","/img/stocks/GME.webp":"2cc1094c","/img/stocks/GME@64.webp":"68bcb180","/img/stocks/GOOGL.webp":"43560550","/img/stocks/GOOGL@64.webp":"c6fdee7c","/img/stocks/HIMS.webp":"c2f27f3f","/img/stocks/HIMS@64.webp":"3dc71654","/img/stocks/IBM.webp":"2c2932e7","/img/stocks/IBM@64.webp":"1efb76ef","/img/stocks/INTC.webp":"8b968aad","/img/stocks/INTC@64.webp":"4ea497b3","/img/stocks/JNJ.webp":"3656f1cf","/img/stocks/JNJ@64.webp":"3f5f70f4","/img/stocks/LLY.webp":"16fe4ecf","/img/stocks/LLY@64.webp":"3170db1d","/img/stocks/LMT.webp":"feee4e71","/img/stocks/LMT@64.webp":"9ea54066","/img/stocks/LULU.webp":"99a446b6","/img/stocks/LULU@64.webp":"430ca9b4","/img/stocks/META.webp":"788cc65f","/img/stocks/META@64.webp":"715b96fc","/img/stocks/MRNA.webp":"a07156dd","/img/stocks/MRNA@64.webp":"f409684c","/img/stocks/MRVL.webp":"502d19ab","/img/stocks/MRVL@64.webp":"9d5053da","/img/stocks/MSFT.webp":"f4f3cf59","/img/stocks/MSFT@64.webp":"b08e3e54","/img/stocks/MSTR.webp":"ac1e4cda","/img/stocks/MSTR@64.webp":"96a41b4a","/img/stocks/MU.webp":"f4cc28d9","/img/stocks/MU@64.webp":"34554e4f","/img/stocks/NET.webp":"5bfdff8b","/img/stocks/NET@64.webp":"52c5666e","/img/stocks/NFLX.webp":"ed65a6f5","/img/stocks/NFLX@64.webp":"98604436","/img/stocks/NVDA.webp":"92ee9328","/img/stocks/NVDA@64.webp":"365a1893","/img/stocks/ON.webp":"6eb5394a","/img/stocks/ON@64.webp":"2d91fb54","/img/stocks/PENG.webp":"206e860f","/img/stocks/PENG@64.webp":"0fe96ca2","/img/stocks/PFE.webp":"04813389","/img/stocks/PFE@64.webp":"4f2edea2","/img/stocks/PLTR.webp":"4e9ddbf8","/img/stocks/PLTR@64.webp":"92e1417f","/img/stocks/QQQ.webp":"9c6debd6","/img/stocks/QQQ@64.webp":"dc0686a3","/img/stocks/QUBT.webp":"4dda2573","/img/stocks/QUBT@64.webp":"af103353","/img/stocks/RBLX.webp":"0f727472","/img/stocks/RBLX@64.webp":"ed6b1e11","/img/stocks/RCAT.webp":"ad162bac","/img/stocks/RCAT@64.webp":"7707320f","/img/stocks/RDDT.webp":"57175702","/img/stocks/RDDT@64.webp":"1b931c56","/img/stocks/RIVN.webp":"79073f3d","/img/stocks/RIVN@64.webp":"da6aa9ff","/img/stocks/SGOV.webp":"f27aa904","/img/stocks/SGOV@64.webp":"a1f390f3","/img/stocks/SHOP.webp":"daad9750","/img/stocks/SHOP@64.webp":"46c5f4e4","/img/stocks/SKHY.webp":"81aacbdb","/img/stocks/SKHY@64.webp":"b49e7c9a","/img/stocks/SLV.webp":"bdddbaf5","/img/stocks/SLV@64.webp":"429f8215","/img/stocks/SNAP.webp":"1d6fd2c5","/img/stocks/SNAP@64.webp":"5ec0073d","/img/stocks/SNDK.webp":"0219e9c3","/img/stocks/SNDK@64.webp":"1cfd4b40","/img/stocks/SNOW.webp":"96ee54d0","/img/stocks/SNOW@64.webp":"fb71da7c","/img/stocks/SOXX.webp":"1288e20d","/img/stocks/SOXX@64.webp":"1f4d14ae","/img/stocks/SPCX.webp":"bcd6a19a","/img/stocks/SPCX@64.webp":"4460981f","/img/stocks/SPY.webp":"85a8788c","/img/stocks/SPY@64.webp":"a19baa64","/img/stocks/TSLA.webp":"22ed67da","/img/stocks/TSLA@64.webp":"4fc7023e","/img/stocks/TSM.webp":"e0a2260d","/img/stocks/TSM@64.webp":"f223c1d4","/img/stocks/TTWO.webp":"996c8623","/img/stocks/TTWO@64.webp":"c790397d","/img/stocks/UPS.webp":"3b78f735","/img/stocks/UPS@64.webp":"070290b2","/img/stocks/USAR.webp":"300eac1e","/img/stocks/USAR@64.webp":"4d220798","/img/stocks/USO.webp":"a72b145b","/img/stocks/USO@64.webp":"f69b97e2","/img/stocks/VTI.webp":"211946b7","/img/stocks/VTI@64.webp":"977b9e6a","/img/stocks/WYFI.webp":"60d8281e","/img/stocks/WYFI@64.webp":"379f7b45","/img/models/_model.svg":"da7853b1","/img/models/anthropic.svg":"e833fdfa","/img/models/bytedance-color.svg":"3d37647b","/img/models/claude-color.svg":"a3101f30","/img/models/claude.svg":"365a70a7","/img/models/claudecode-color.svg":"670b3d8d","/img/models/claudecode.svg":"d7eb2d87","/img/models/codex.svg":"d08b4e82","/img/models/cohere-color.svg":"84d0ee3c","/img/models/cursor.svg":"0cb51bdd","/img/models/deepseek-color.svg":"deba5f98","/img/models/deepseek.svg":"8f9443e3","/img/models/doubao-color.svg":"3cd31ba0","/img/models/fireworks-color.svg":"f1c4782b","/img/models/gemini-color.svg":"8ab0a9ba","/img/models/gemini.svg":"87d5b3c4","/img/models/githubcopilot.svg":"bbc7fddc","/img/models/grok.svg":"9175fc90","/img/models/hunyuan-color.svg":"510e7bb4","/img/models/ibm.svg":"62c37af8","/img/models/inception.svg":"aa491f54","/img/models/kimi-color.svg":"952b010d","/img/models/ling-color.svg":"312e3603","/img/models/liquid.svg":"4727b1cb","/img/models/longcat-color.svg":"227f8085","/img/models/meta-color.svg":"64a8f184","/img/models/meta.svg":"805ef9a3","/img/models/microsoft-color.svg":"5cfb0ffa","/img/models/minimax-color.svg":"553256ae","/img/models/mistral-color.svg":"722f74b2","/img/models/mistral.svg":"a06cfa54","/img/models/moonshot.svg":"435f41b7","/img/models/morph-color.svg":"994eb5b5","/img/models/nousresearch.svg":"4dc3c7cd","/img/models/nova-color.svg":"be29ee23","/img/models/nvidia-color.svg":"8c941e4e","/img/models/openai.svg":"a595df6b","/img/models/perplexity-color.svg":"8353f3ab","/img/models/poolside-color.svg":"5df24fb3","/img/models/qwen-color.svg":"a158a0e3","/img/models/qwen.svg":"b2c16efc","/img/models/reka.svg":"533ae212","/img/models/relace.svg":"06f3327a","/img/models/sakana-color.svg":"a635d8f5","/img/models/stepfun-color.svg":"f55afc0e","/img/models/upstage-color.svg":"206e23f9","/img/models/xai.svg":"89eb7de9","/img/models/xiaomimimo.svg":"b04ad7da","/img/models/zhipu-color.svg":"8174e65f","/img/tokens/sol.svg":"1f94df85","/img/tokens/keyfo-mark.svg":"d4525333","/img/tokens/keyfo.svg":"8cce9f9d","/img/tokens/usdg.png":"a4bd50f0","/img/brand/apple-touch-icon.png":"7ccf5817","/img/brand/coinbase-wallet.svg":"f882108a","/img/brand/favicon-32.png":"7a31a482","/img/brand/favicon.svg":"ba49f76b","/img/brand/k.svg":"12ebdb9b","/img/brand/lifi-black.svg":"51aef6b0","/img/brand/lifi-white.svg":"8d868ab0","/img/brand/logo.svg":"74411aec","/img/brand/metamask.svg":"9f34b072","/img/brand/pwa-192.png":"ca67648f","/img/brand/pwa-512.png":"994e2a0f","/img/brand/pwa-mask-192.png":"efcae2c3","/img/brand/pwa-mask-512.png":"c0cb0b92","/img/brand/rabby.svg":"e5775fc5","/img/brand/relay-white.svg":"ce602043","/img/brand/relay.svg":"c1b6235e","/img/brand/vscode.png":"9a751a97","/img/brand/x.svg":"be03adbf"}/*/KFV*/;
  const asset = (u) => (KF_V[u] ? u + "?v=" + KF_V[u] : u);
  const vhtml = (h) => String(h).replace(/\/img\/[\w@.\/-]+\.(?:webp|svg|png)(?![?\w])/g, asset);
  const meta = (n) => { const m = document.querySelector(`meta[name="${n}"]`); return m ? m.content : ""; };

  /* ---------- KF.fmt: the one number format (research/premium/06-data-trust.md §3) ---------- */
  const DASH = "—", MINUS = "−";
  const isNum = (v) => v !== null && v !== undefined && v !== "" && isFinite(+v);
  const grp = (v, d) => (+v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmt = {
    DASH,
    known: isNum,
    /* $1,004.91 · <$1 → up to 4 significant · null → — */
    usd(v, d) {
      if (!isNum(v)) return DASH;
      const n = +v, a = Math.abs(n), s = n < 0 ? MINUS : "";
      if (a === 0) return d != null ? "$" + grp(0, d) : "$0.00";
      if (a < 0.005) return s + "<$0.01";                       // never «$0.00» for a non-zero amount (W2-3)
      if (d != null) return s + "$" + grp(a, d);
      if (a >= 0.01) return s + "$" + grp(a, 2);   // P1-F15: cents in one column look alike — $0.60 next to $0.18
      return s + "$" + String(+a.toPrecision(4));
    },
    /* $13.97M · $18.2K · ≤0/null → — */
    usdM(v) {
      if (!isNum(v) || +v <= 0) return DASH;
      const n = +v;
      if (n >= 1e12) return "$" + grp(n / 1e12, 2) + "T";
      if (n >= 1e9) return "$" + grp(n / 1e9, 2) + "B";
      if (n >= 1e6) return "$" + grp(n / 1e6, 2) + "M";
      if (n >= 1e3) return "$" + grp(n / 1e3, 1) + "K";
      return "$" + grp(n, 0);
    },
    /* +1.84% · −4.21% · 0.00% (no sign) */
    pct(v) {
      if (!isNum(v)) return DASH;
      const n = Math.round(+v * 100) / 100;
      if (n === 0) return "0.00%";
      if (Math.abs(n) >= 1000) return (n > 0 ? "+" : MINUS) + grp(Math.abs(n) / 1000, 1) + "K%";   // fits the −99.99% column (W2-3)
      return (n > 0 ? "+" : MINUS) + grp(Math.abs(n), 2) + "%";
    },
    sign(v) { if (!isNum(v)) return ""; const n = Math.round(+v * 100) / 100; return n > 0 ? "up" : n < 0 ? "dn" : ""; },
    /* amounts: up to 4 decimals, no trailing zeros */
    amt(v) { if (!isNum(v)) return DASH; return String(Math.round(+v * 1e4) / 1e4); },
    /* 132 ms · 1.2 s */
    ms(v) { if (!isNum(v)) return DASH; const n = +v; if (n < 1) return "<1 ms"; return n < 1000 ? Math.round(n) + " ms" : grp(n / 1000, 1) + " s"; },
    /* context: 262K · 1M · 1.1M */
    ctx(v) { if (!isNum(v) || +v <= 0) return DASH; const n = +v; return n >= 1e6 ? String(Math.round(n / 1e4) / 100) + "M" : Math.round(n / 1e3) + "K"; },   // P4-F17: 1.05M
    /* model price per 1M tokens: 2 decimals, <$0.01, $0 */
    /* V1-30 (P4-F8, PLAN-v3 §0): exact — 2 to 4 decimals ($0.075, $0.0339, $4.125), «<$0.0001» below that */
    price1M(v) { if (!isNum(v)) return DASH; const n = +v; if (n === 0) return "$0"; if (n < 0.0001) return "<$0.0001";
      const f = (String(+n.toFixed(6)).split(".")[1] || "").length; return "$" + grp(n, Math.max(2, Math.min(n < 1 ? 6 : 4, f))); },
    /* cost of one call: 4 decimals, <$0.0001 */
    cost(v) { if (!isNum(v)) return DASH; const n = +v; if (n === 0) return "$0"; if (n < 0.0001) return "<$0.0001"; return "$" + grp(n, n >= 1 ? 2 : 4); },
    /* long machine ids: ellipsis in the middle, both ends readable (W0-3): anthropic/…haiku-4.5 */
    mid(v, n) { const t = String(v == null ? "" : v); if (t.length <= n) return t; const k = n - 1, a = Math.ceil(k * 0.45); return t.slice(0, a) + "…" + t.slice(t.length - (k - a)); },
    int(v) { return isNum(v) ? grp(Math.round(+v), 0) : DASH; },
    utc(d, sec) { if (!(d instanceof Date) || isNaN(d)) return DASH; return d.toISOString().slice(11, sec ? 19 : 16); },
    /* V1-20: a deadline carries its date — «Oct 31, 05:30» (+ « UTC» from the string) */
    utcd(d) { if (!(d instanceof Date) || isNaN(d)) return DASH; return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }) + ", " + d.toISOString().slice(11, 16); },
    date(v) { const d = toDate(v); return d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }) : DASH; },
    when(v) { const d = toDate(v); return d ? d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }) : DASH; },
    left(sec) { if (!isNum(sec) || +sec <= 0) return DASH; const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60); return (h ? h + " h " : "") + m + " min"; },
  };
  function toDate(v) { if (v == null || v === "") return null; const d = new Date(typeof v === "number" && v < 1e12 ? v * 1000 : v); return isNaN(d) ? null : d; }
  fmt.toDate = toDate;

  /* API: always resolves {ok, status, data, error:{code,message}} — never throws */
  async function api(path, opts = {}) {
    const init = { method: opts.method || "GET", credentials: "same-origin", headers: { Accept: "application/json" } };
    if (opts.headers) Object.assign(init.headers, opts.headers);
    if (opts.body !== undefined) { init.headers["Content-Type"] = "application/json"; init.body = JSON.stringify(opts.body); }
    let res;
    /* V1-61 (X2-F1): a hung request ends in 12 s (8 s for the footer status) and becomes the same «Try again» state as an error */
    if (window.AbortSignal && AbortSignal.timeout) init.signal = AbortSignal.timeout(opts.timeout || 12000);
    try { res = await fetch(path, init); } catch (e) { return { ok: false, status: 0, data: null, error: { code: e && e.name === "TimeoutError" ? "timeout" : "network", message: "" } }; }
    let data = null;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("json")) { try { data = await res.json(); } catch (e) {} }
    if (res.ok) return { ok: true, status: res.status, data, error: null };
    const err = (data && data.error) || {};
    return { ok: false, status: res.status, data, error: { ...err, code: err.code || String(res.status), message: err.message || "" } };   // extra fields (retry_after_min, С-3) pass through
  }

  /* header line after 8px */
  const hdr = $("#hdr");
  if (hdr) { const on = () => hdr.classList.toggle("scrolled", window.scrollY > 8); on(); window.addEventListener("scroll", on, { passive: true }); }

  /* lazy backgrounds: [data-bg] (+ [data-bg2x] on DPR > 1) when near the viewport */
  const bgs = $$("[data-bg]");
  const setBg = (el) => { if (el.dataset.bgOn) return; el.dataset.bgOn = 1; const u = el.dataset.bg2x && el.clientWidth * (window.devicePixelRatio || 1) > 1400 ? el.dataset.bg2x : el.dataset.bg;   /* Q1 photos: the 2560 frame only where 1280 px would be upscaled */ el.style.backgroundImage = `url(${u})`; };
  if (bgs.length) {
    const dd = bgs.filter((e) => e.closest(".ddp")), rest = bgs.filter((e) => !e.closest(".ddp"));
    if ("IntersectionObserver" in window) { const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { setBg(e.target); io.unobserve(e.target); } }), { rootMargin: "600px" }); rest.forEach((e) => io.observe(e)); }
    else rest.forEach(setBg);
    $$(".dd").forEach((d) => { const load = () => $$("[data-bg]", d).forEach(setBg); d.addEventListener("pointerenter", load, { once: true }); d.addEventListener("focusin", load, { once: true }); });
    dd.length;
  }

  /* V1-31 (P4-F9, PLAN-v3 §0): marks whose glyph is ≤ 30 % of the disc height read as a speck — those tickers stand as text on the dark disc */
  const TXT_MARK = new Set(["SPCX", "PENG", "SGOV", "VTI", "RCAT", "DJT", "AMC", "SPY", "COST", "ASML", "QUBT", "HIMS", "F", "USO", "GLD", "MU", "QQQ", "IBM"]);
  function stockMark(t, size, lazy) {
    const T = esc(t), cls = "tk" + (size ? " " + size : "");
    if (TXT_MARK.has(String(t).toUpperCase())) return `<span class="${cls} txt mono1" aria-hidden="true">${esc(String(t)[0])}</span>`;   // F2 С3: the ticker reads in the line, the disc carries its initial — never «USO USO»
    const a = asset(`/img/stocks/${T}@64.webp`), b = asset(`/img/stocks/${T}.webp`), w = size === "md" ? 28 : size === "lg" ? 40 : size === "xs" ? 16 : 20;
    return `<span class="${cls}"><img ${lazy ? `data-src="${a}" data-srcset="${a} 1x, ${b} 2x"` : `src="${a}" srcset="${a} 1x, ${b} 2x"`} alt="" width="${w}" height="${w}" decoding="async"></span>`;
  }

  /* $KEYDEX in a text slot → icon + text (P1-12) */
  $$("[data-keyfo]").forEach((e) => { if (e.querySelector(".tk.keyfo")) return; e.innerHTML = esc(e.textContent).replace("$KEYDEX", '<span class="tk keyfo xs" aria-hidden="true"></span>$KEYDEX'); });

  /* mobile menu: dialog, inert background, Esc returns focus, scroll position kept */
  const mb = $("#menuBtn"), sheet = $("#sheet");
  if (mb && sheet) {
    const openL = mb.getAttribute("aria-label");
    const bg = () => $$("main, .ftr, .dx, body > section");
    const set = (o, focusBtn) => {
      const y = window.scrollY;
      document.body.classList.toggle("menu-open", o);
      mb.setAttribute("aria-expanded", String(o));
      mb.setAttribute("aria-label", o ? str("s-menu-close", openL) : openL);
      bg().forEach((el) => { if (o) el.setAttribute("inert", ""); else el.removeAttribute("inert"); });
      if (o) { const f = $$("a", sheet).find((a) => a.offsetParent); if (f) f.focus({ preventScroll: true }); }
      else if (focusBtn) mb.focus({ preventScroll: true });
      window.scrollTo(0, y);
    };
    mb.addEventListener("click", () => set(!document.body.classList.contains("menu-open")));
    $$("a", sheet).forEach((a) => a.addEventListener("click", () => set(false)));
    document.addEventListener("keydown", (e) => {
      if (!document.body.classList.contains("menu-open")) return;
      if (e.key === "Escape") { e.preventDefault(); set(false, true); }
      if (e.key === "Tab") {
        const f = [mb, ...$$("a", sheet)];
        const i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    window.addEventListener("resize", () => { if (window.innerWidth > 1023 && document.body.classList.contains("menu-open")) set(false); });
  }

  /* header dropdowns (hover with intent delay, click toggles, Esc closes; preview follows the hovered item) */
  const dds = $$(".dd");
  const closeAll = (except) => dds.forEach((d) => { if (d !== except) { d.classList.remove("open"); $(".nav-t", d).setAttribute("aria-expanded", "false"); } });
  dds.forEach((d) => {
    const t = $(".nav-t", d); let timer = 0;
    const open = () => { clearTimeout(timer); closeAll(d); d.classList.add("open"); t.setAttribute("aria-expanded", "true"); };
    const later = () => { clearTimeout(timer); timer = setTimeout(() => { d.classList.remove("open"); t.setAttribute("aria-expanded", "false"); }, 140); };
    d.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") open(); });
    d.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") later(); });
    /* V1-50 (P8-F4): a mouse click only opens (leaving, Esc or a click outside close); touch and keyboard toggle */
    let pt = "";
    t.addEventListener("pointerdown", (e) => (pt = e.pointerType));
    t.addEventListener("click", (e) => { const mouse = pt === "mouse" && e.detail > 0; pt = ""; if (mouse) return open(); d.classList.contains("open") ? later() : open(); });
    $$(".ddi", d).forEach((a) => {
      const show = () => { $$(".ddi", d).forEach((x) => x.classList.toggle("on", x === a)); $$(".pv", d).forEach((p) => p.classList.toggle("on", p.dataset.pv === a.dataset.prev)); };
      a.addEventListener("pointerenter", show); a.addEventListener("focus", show);
    });
    d.addEventListener("focusout", (e) => { if (!d.contains(e.relatedTarget)) later(); });
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && dds.some((d) => d.classList.contains("open"))) { const o = dds.find((d) => d.classList.contains("open")); closeAll(); $(".nav-t", o).focus(); } });
  document.addEventListener("click", (e) => { if (!e.target.closest(".dd")) closeAll(); });
  $$(".nav-a, .ddi").forEach((a) => { const h = a.getAttribute("href"); if (h && h === location.pathname) a.setAttribute("aria-current", "page"); });

  /* tabs: roving tabindex, ←/→/Home/End, aria-controls (P1-24). onSelect(tab) is set by each page. */
  let tabN = 0;
  function tabs(list, onSelect, panels) {
    const ts = $$('[role="tab"]', list);
    /* V1-42 (P6-F3/F9, X1-F12): every tab names its panel and every panel its tab (id / aria-controls / role=tabpanel / aria-labelledby) */
    if (panels && panels.length === ts.length) { const n = ++tabN; ts.forEach((t, i) => { const p = panels[i]; t.id ||= `kt${n}-${i}`; p.id ||= `kp${n}-${i}`; t.setAttribute("aria-controls", p.id); p.setAttribute("role", "tabpanel"); p.setAttribute("aria-labelledby", t.id); }); }
    ts.forEach((t, i) => {
      t.setAttribute("tabindex", t.getAttribute("aria-selected") === "true" ? "0" : "-1");
      t.addEventListener("click", () => sel(t));
      t.addEventListener("keydown", (e) => {
        const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; let n = null;
        if (k) n = ts[(i + k + ts.length) % ts.length]; else if (e.key === "Home") n = ts[0]; else if (e.key === "End") n = ts[ts.length - 1];
        if (n) { e.preventDefault(); sel(n); n.focus(); }
      });
    });
    function sel(t) {
      const cur = ts.find((x) => x.getAttribute("aria-selected") === "true"), prev = cur && cur !== t && document.getElementById(cur.getAttribute("aria-controls") || "");
      let ghost = null, op = null;
      if (prev && prev.offsetParent && !reduced && document.documentElement.dataset.motion !== "off") {   /* smooth switching (owner 09.11): a copy of the old panel fades out over the new one */
        op = prev.offsetParent; const a = prev.getBoundingClientRect(), b = op.getBoundingClientRect();
        ghost = prev.cloneNode(true); ghost.classList.add("kf-ghost"); ghost.removeAttribute("id"); ghost.removeAttribute("role"); [...ghost.attributes].forEach((x) => { if (x.name.startsWith("data-")) ghost.removeAttribute(x.name); });   /* no selector keyed on the panel (e.g. .cx-done on the API tab) sees the copy */ ghost.setAttribute("aria-hidden", "true"); ghost.inert = true;
        $$("[id]", ghost).forEach((e) => e.removeAttribute("id"));
        Object.assign(ghost.style, { position: "absolute", left: a.left - b.left - op.clientLeft + "px", top: a.top - b.top - op.clientTop + "px", width: a.width + "px", height: a.height + "px", margin: "0", pointerEvents: "none" });
      }
      ts.forEach((x) => { const on = x === t; x.setAttribute("aria-selected", String(on)); x.setAttribute("tabindex", on ? "0" : "-1"); }); onSelect(t);
      if (ghost) { ghost.hidden = false; op.appendChild(ghost); const cs = getComputedStyle(document.documentElement); ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: parseFloat(cs.getPropertyValue("--dur-2")) || 200, easing: cs.getPropertyValue("--ease-out").trim() || "ease-out" }).onfinish = () => ghost.remove(); }
    }
    return sel;
  }

  /* modals */
  let lastFocus = null;
  function openModal(el, opener) {
    if (typeof el === "string") el = document.getElementById(el);
    if (!el) return;
    lastFocus = opener || document.activeElement;   // X1-N3: opener may be a function — the element is looked up when the window closes
    el.classList.add("open");
    el.dispatchEvent(new CustomEvent("modal:open"));
    document.body.classList.add("modal-lock");
    const f = el.querySelector("[autofocus]") || el.querySelector(".modal-x") || el.querySelector("button");
    if (f) f.focus({ preventScroll: true });
  }
  function closeModal(el) {
    if (typeof el === "string") el = document.getElementById(el);
    if (!el || !el.classList.contains("open")) return;
    el.classList.remove("open");
    if (!$(".modal.open")) document.body.classList.remove("modal-lock");
    el.dispatchEvent(new CustomEvent("modal:close"));
    const back = typeof lastFocus === "function" ? lastFocus() : lastFocus;
    if (back && back.isConnected && back.focus) back.focus({ preventScroll: true });
  }
  document.addEventListener("click", (e) => { const m = e.target.closest(".modal"); if (m && (e.target === m || e.target.closest("[data-close]"))) closeModal(m); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { const m = $$(".modal.open").pop(); if (m) closeModal(m); }
    if (e.key === "Tab") {
      const m = $$(".modal.open").pop(); if (!m) return;
      const f = $$('button:not([disabled]),a[href],input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])', m).filter((x) => x.offsetParent !== null && !x.closest("[hidden]"));
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* live region + toasts (P0-6, P2-1) */
  const live = (t) => { const l = $("#kfLive"); if (!l) return; l.textContent = ""; setTimeout(() => (l.textContent = t), 30); };
  const OK = '<svg class="t-ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5 6.5 12 13 4.5"/></svg>';
  const ERR = '<svg class="t-ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 5v3.5M8 11v.01"/></svg>';
  function toast(text, kind) {
    let box = $("#kfToasts"); if (!box) { box = document.createElement("div"); box.className = "toasts"; box.id = "kfToasts"; box.setAttribute("aria-live", "polite"); document.body.appendChild(box); }
    const t = document.createElement("div"); t.className = "toast" + (kind === "err" ? " err" : ""); t.setAttribute("role", "status");
    t.innerHTML = (kind === "err" ? ERR : OK) + `<span>${esc(text)}</span>`;
    box.appendChild(t);
    /* X1-F26: an error stays 8 s, a hover or focus holds it */
    let left = kind === "err" ? 8000 : 3200, t0 = Date.now(), tm = 0;
    const go = () => { tm = setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 220); }, left); t0 = Date.now(); };
    const hold = () => { clearTimeout(tm); left -= Date.now() - t0; };
    t.addEventListener("pointerenter", hold); t.addEventListener("pointerleave", go); t.addEventListener("focusin", hold); t.addEventListener("focusout", go); go();
  }

  /* copy: pill buttons swap the word, icon buttons swap the icon (1600 ms), both announce */
  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); return true; }
    catch (e) {
      const ta = document.createElement("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand("copy"); } catch (x) {}
      ta.remove(); return ok;
    }
  }
  function flashCopied(btn) {
    const word = str("s-copied", "Copied");
    const lbl = btn.querySelector(":scope > span:not(.cx-prompt-copy)");
    clearTimeout(btn._t);
    if (lbl && !btn.classList.contains("cx-prompt")) {
      if (!btn.dataset.label) btn.dataset.label = lbl.textContent;
      const w = btn.offsetWidth; btn.style.minWidth = w + "px";
      lbl.textContent = word;
      btn._t = setTimeout(() => { lbl.textContent = btn.dataset.label; btn.style.minWidth = ""; }, 1600);
    } else {
      if (!btn.dataset.al) btn.dataset.al = btn.getAttribute("aria-label") || "";
      btn.classList.add("is-copied"); btn.setAttribute("aria-label", word);
      btn._t = setTimeout(() => { btn.classList.remove("is-copied"); if (btn.dataset.al) btn.setAttribute("aria-label", btn.dataset.al); else btn.removeAttribute("aria-label"); }, 1600);
    }
    live(word);
  }
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-copy],[data-copy-target],[data-copy-value],[data-copy-text],[data-copy-visible]");
    if (!b) return;
    let t = "";
    if (b.dataset.copyValue) t = b.dataset.copyValue;
    else if (b.dataset.copyTarget) { const el = document.getElementById(b.dataset.copyTarget); t = el ? (el.dataset.value || el.textContent) : ""; }
    else if (b.hasAttribute("data-copy-text")) { const s = b.querySelector("span"); t = s ? s.textContent : ""; }
    else { const box = b.closest(".code") || b.parentElement; const pre = $$("pre", box).find((p) => !p.hidden); if (pre) { const c = pre.cloneNode(true); $$(".key[data-k]", c).forEach((k) => (k.textContent = k.dataset.k)); t = c.textContent; } }
    if (t && await copyText(t.trim())) flashCopied(b);
  });

  /* busy: spinner instead of the label, width kept (P1-23) */
  function busy(btn, on) {
    if (!btn) return;
    if (on) { btn.style.minWidth = btn.offsetWidth + "px"; btn.setAttribute("aria-busy", "true"); btn.disabled = true; }
    else { btn.removeAttribute("aria-busy"); btn.disabled = false; btn.style.minWidth = ""; }
  }

  /* live stock quotes — cached; resolves null on error */
  const qc = {};
  function quote(t) {
    if (!qc[t]) qc[t] = api("/v1/tools/stock_quote?ticker=" + encodeURIComponent(t)).then((r) => {
      const d = r.ok && r.data && (r.data.data || r.data);
      return d && isNum(d.price_usd) ? { price: +d.price_usd, change: isNum(d.change_24h_pct) ? +d.change_24h_pct : null, depth: isNum(d.depth_usd) ? +d.depth_usd : null, name: d.name } : null;
    });
    return qc[t];
  }

  /* run fn only while el is on screen and the tab is visible */
  function onScreen(el, thr = 0.1) {
    const st = { v: false, cb: [] };
    const fire = () => { if (st.v && !document.hidden) { const c = st.cb; st.cb = []; c.forEach((f) => f()); } };
    if ("IntersectionObserver" in window) new IntersectionObserver((e) => { st.v = e[0].isIntersecting; fire(); }, { threshold: thr }).observe(el); else st.v = true;
    document.addEventListener("visibilitychange", fire);
    const fn = () => st.v && !document.hidden && !paused;
    fn.wake = (f) => { if (fn()) f(); else st.cb.push(f); };
    return fn;
  }
  /* sleep that only counts visible time; no polling while hidden */
  function sleeper(isOn) {
    return (ms) => new Promise((res) => {
      let left = ms, last = performance.now();
      (function tick() {
        const now = performance.now(); if (isOn()) left -= now - last; last = now;
        if (left <= 0) return res();
        if (isOn()) setTimeout(tick, left);
        else if (isOn.wake) isOn.wake(() => { last = performance.now(); tick(); });
        else setTimeout(tick, 500);
      })();
    });
  }

  /* the pause control (hero window bar): pause → every CSS / WAAPI animation and every scene timer stop; play → the scenes start again (reload, same scroll) */
  $$("[data-motion-toggle]").forEach((b) => {
    const t = $(".mo-t", b), sync = () => { b.setAttribute("aria-pressed", String(paused)); b.classList.toggle("off", paused); if (t) t.textContent = str(paused ? "s-mo-play" : "s-mo-pause", ""); };
    sync();
    if (store.get("kf.mofocus") === "1") { store.set("kf.mofocus", ""); b.focus({ preventScroll: true }); }   // X1-M2: the reload keeps the keyboard's place
    b.addEventListener("click", () => {
      if (paused) { store.set("kf.motion", "on"); store.set("kf.mofocus", "1"); location.reload(); return; }
      paused = true; store.set("kf.motion", "off"); document.documentElement.dataset.motion = "off";
      document.getAnimations().forEach((a) => { if (a.playState === "running") a.pause(); });
      sync();   // X1-M1: aria-pressed says it; the old announcement read the opposite word
    });
  });

  /* /health → honest plan states (P1-17): no treasury → top-up disabled + Soon; no token → holder Soon */
  /* P5-F19: no answer from /health → the states stay as they are and it is asked again in 5 s (never «everything is Soon» from a blip) */
  const health = () => api("/health").then((r) => {
    if (!r.ok || !r.data) { document.documentElement.dataset.launched="1"; return; }
    const h = r.data;
    /* W1-8: the plan that works right now gets the white button; it moves by itself when the quota or top-ups open (no inversion of a card) */
    const launched = true;   // the $KEYDEX holder model: before launch only trial keys
    document.documentElement.dataset.launched = launched ? "1" : "0";
    const live = launched ? "holder" : "trial";
    /* Q1 board: the number of tools = /health tools_count (1.11.6: tools/list under the current flags); before that the build snapshot stays */
    if (Number.isInteger(h.tools_count) && h.tools_count > 0) {
      $$("[data-tools-n]").forEach((e) => (e.textContent = String(h.tools_count)));
      $$("[data-tools-cost]").forEach((e) => { const t = e.parentElement && e.parentElement.querySelector("[data-tools-tpl]"); if (t && t.textContent.includes("{n}")) e.textContent = t.textContent.replace("{n}", String(h.tools_count)); });   /* /pricing «All {n} tools are free.»; no answer → the line without a number */
    }
    /* V1-36: «Open app» on /token is white only when the quota works; before that the white button is the trial key */
    $$("[data-gate-soft]").forEach((b) => { const on = !!h[b.dataset.gateSoft]; b.classList.toggle("btn-1", on); b.classList.toggle("btn-2", !on); $$("[data-trial-cta]").forEach((t) => (t.hidden = on)); });
    $$("[data-plan]").forEach((p) => $$(".plan-act .btn", p).forEach((b) => { b.classList.toggle("btn-1", p.dataset.plan === live); b.classList.toggle("btn-2", p.dataset.plan !== live); }));
    /* before launch «Buy $KEYDEX» stands disabled over its «Starts when…» line (owner 07.11); after launch it opens the Balance page */
    if (launched) {
      $$('[data-st="token"],[data-st-note="token"]').forEach((e) => (e.hidden = true));
      $$('[data-gate="token"]').forEach((b) => { b.removeAttribute("aria-disabled"); b.removeAttribute("title"); if (b.dataset.href) b.href = b.dataset.href; });   /* plans.holder.cta.soon: the «opens at launch» hint goes with the gate */
      /* 10.11 launch: the CA comes from /health `token` (nothing injects a kf-ca meta) — /token #tkCa and the footer #caAddr + its Copy */
      if (false) {
        /* owner 10.11 «исправь перенос»: the address never breaks — full where it fits, 0xa1b6…af8d where it does not (CSS picks); Copy and title keep the full one */
        const short = h.token.slice(0, 6) + "…" + h.token.slice(-4);
        [["#tkCa", "#tkCaNote"], ["#caAddr", "#caCopy"]].forEach(([a, b]) => { const e = $(a); if (!e) return; e.innerHTML = `<span class="ca-full">${h.token}</span><span class="ca-short" aria-hidden="true">${short}</span>`; e.dataset.value = h.token; e.title = h.token; e.classList.add("set"); e.removeAttribute("data-slot"); const n = $(b); if (n) n.hidden = false; });
      }
    }
  });
  if ($("[data-tools-n],[data-tools-cost],[data-st],[data-st-note],[data-gate-soft],[data-prelaunch],[data-postlaunch],.cx-signin,.cx-signin-btn")) health();

  /* one colour = one state (PLAN-v2 W0-5): ok → --ok-fg, degraded → --wait, down → --err-fg, the same rule for every [data-state] */
  const stateOf = (r) => (r && r.ok && r.data ? (["ok", "degraded", "down"].includes(r.data.state) ? r.data.state : r.data.ok === true ? "ok" : r.data.ok === false ? "degraded" : null) : null);   // P7-F13: 200 without state/ok = no answer
  /* V1-54 (P8-F8, X3-F13): when only the trade/funding routes are rate-limited the server says reason «routes_busy» — one line for the summary and the footer */
  const reasonOf = (r) => (r && r.ok && r.data ? (r.data.summary && r.data.summary.reason) || r.data.reason || null : null);
  let statusQ = null;
  /* X2-Н-8: a failed answer is not kept — the next «Try again» asks again */
  const status = () => (statusQ ||= api("/api/status", { timeout: 8000 }).then((r) => { if (!r.ok) statusQ = null; return r; }));
  /* footer status: GET /api/status once; no answer (visitor offline) → no dot and no status text, never «down» (B-М5) */
  const fl = $(".ftr-live"), fa = $("#ftrLive");
  function paintFtr(r) {
    if (!fl || !fa) return;
    const s = stateOf(r);
    if (!s) { fl.hidden = false; fl.dataset.state = "ok"; fa.textContent = str("s-ftr-ok", "All systems operational"); return; }
    fl.hidden = false; fl.dataset.state = s;
    fa.textContent = reasonOf(r) === "routes_busy" && s !== "ok" ? str("s-ftr-routes", fa.textContent) : str(s === "ok" ? "s-ftr-ok" : s === "degraded" ? "s-ftr-deg" : "s-ftr-down", fa.textContent);
    fa.style.width = ""; const w = fa.getBoundingClientRect().width; if (w % 1) fa.style.width = Math.ceil(w) + "px";   // P8: the status on a whole x
  }
  if (fl && fa && document.body.dataset.page !== "status") status().then(paintFtr);
  /* X2-Н-8: a page whose data came back after «Try again» asks for the status again if the footer stayed empty */
  const ftrBack = () => { if (fl && fl.hidden) status().then(paintFtr); };
  /* V1-48 (P7-F5): the header preview dot follows the live state; no answer → --muted */
  const pvs = $$(".pv-status");
  const paintPv = (r) => { const s = stateOf(r); pvs.forEach((p) => { if (s) p.dataset.state = s; else p.removeAttribute("data-state"); }); };   // P7 R-F4: /status repaints it after every load
  if (pvs.length) $$(".dd").forEach((d) => d.addEventListener("pointerenter", () => { if (document.body.dataset.page !== "status") status().then(paintPv); }, { once: true }));
  /* the site's own address from <meta name="kf-site"> (SITE_URL on the server), never the browser origin (W0-9) */
  const site = () => (meta("kf-site") || "").replace(/\/+$/, "");

  /* ---------- WOW-03 «the key is born» (research/premium/wow/WOW.md §03; Steel 764f128f, Cursor 653c2245, ElevenLabs 818f1298, TwelveLabs fa79eeed) ---------- */
  const tokMs = (n) => { const v = getComputedStyle(document.documentElement).getPropertyValue(n).trim(); return v.endsWith("ms") ? parseFloat(v) : parseFloat(v) * 1000; };
  const ALPH = "abcdefghijklmnopqrstuvwxyz0123456789";
  /* decode: the text keeps its length (mono → no reflow); unresolved chars cycle, resolved ones lock left → right (one-off rAF, ≤ 600 ms) */
  function decode(el, target, o = {}) {
    const ms = o.ms || tokMs("--dur-decode"), keep = o.keep || 0, from = o.from || "";
    if (reduced) { el.textContent = target; return Promise.resolve(); }
    const n = target.length, t0 = performance.now();
    return new Promise((res) => { (function f(now) {
      const k = Math.min(1, (now - t0) / ms), locked = keep + Math.floor((n - keep) * (1 - Math.pow(1 - k, 2)));
      let out = target.slice(0, locked); for (let i = locked; i < n; i++) out += from[i] && k < 0.25 ? from[i] : ALPH[(Math.random() * ALPH.length) | 0];
      el.textContent = out; if (k < 1) requestAnimationFrame(f); else { el.textContent = target; res(); }
    })(t0); });
  }
  /* the trial button while the request is in flight: label kept (width fixed), a 16 px Keyhole turns in the lock every 560 ms */
  function cutting(btn, on) {
    if (!btn) return;
    if (on) {
      if (!btn.querySelector(".kb")) btn.insertAdjacentHTML("beforeend", '<span class="kb" aria-hidden="true"></span>');
      const kb = btn.querySelector(".kb");
      busy(btn, true); btn.classList.add("cutting");
      const turn = () => kb.api && kb.api.turn([tokMs("--dur-turn-in"), tokMs("--dur-turn-out")]);
      turn(); btn._kbT = setInterval(turn, 560);
    } else { clearInterval(btn._kbT); btn.classList.remove("cutting"); busy(btn, false); }
  }
  /* the key arrives: need fades, have shows in the same box, check pops, the key decodes, then lands in every snippet placeholder (stagger) */
  async function birth(box, key, done) {
    const need = $("[data-need]", box), have = $("[data-have]", box), val = $("[data-keyval]", box), ic = $(".cx-ready .ok-ic", box);
    $$("pre[data-tpl] .key.ph", box.closest(".modal") || document).forEach((sp) => (sp.dataset.k = key));   // P6-R2-F11, R3 M5: Copy gives the whole key from the first frame of «Key added»
    if (need) need.classList.add("gone");
    if (have) { have.hidden = false; }
    /* V1-56 (X1-F1): focus goes to the first Copy of what is now visible, and the key is announced with its expiry */
    const scope = box.closest(".modal") || box.closest("main") || document;
    const cp = $$(".copy, [data-copy-target]", scope).find((b) => b.offsetParent !== null && !b.closest("[hidden]"));
    if (cp) cp.focus({ preventScroll: true });
    let t = null; try { t = JSON.parse(store.get("kf.trial") || "null"); } catch (e) {}
    live(str("s-key-ready-sr", "").replace("{time}", t && t.expires_at ? fmt.utcd(new Date(t.expires_at * 1000)) : DASH));
    if (ic) { ic.classList.remove("go"); ic.getAnimations().forEach((a) => a.cancel()); ic.classList.add("go"); }
    if (val) { val.setAttribute("aria-busy", "true"); await decode(val, key, { keep: 8 }); val.removeAttribute("aria-busy"); }
    const st = tokMs("--stagger"), phs = $$("pre[data-tpl] .key.ph", box.closest(".modal") || document);
    await Promise.all(phs.map((sp, i) => new Promise((r) => setTimeout(async () => { sp.classList.replace("ph", "land"); await decode(sp, key, { from: "YOUR_KEYDEX_KEY" }); r(); }, st * (i + 1)))));
    if (done) setTimeout(done, tokMs("--dur-6"));   // after the underline sweep: final render (Copy reads the DOM)
  }

  /* X3-Н1, P1-R1: a snippet that wraps keeps the height of the real key from the first frame — the key lands, nothing below moves. The key span is measured once at 52 characters (mono), min-height keeps it */
  function reserveKey(root) {
    $$("pre[data-tpl]", root || document).forEach((p) => {
      if (!p.offsetParent || !p.querySelector(".key.ph")) { if (p.offsetParent) p.style.minHeight = ""; return; }
      const ks = $$(".key.ph", p), keep = ks.map((k) => k.textContent);
      p.style.minHeight = ""; ks.forEach((k) => (k.textContent = "k".repeat(52)));
      const h = p.offsetHeight; ks.forEach((k, i) => (k.textContent = keep[i])); p.style.minHeight = h + "px";
    });
  }

  /* ---------- KF.roll — odometer (wow/assets/roll.js): each digit is a 1ch cell with a 0–9 strip moved by translateY (transform only, CLS 0) ---------- */
  const STRIP = "0123456789".split("").map((d) => `<i>${d}</i>`).join("");
  const roll = {
    set(el, text) {
      el.classList.add("roll"); el.classList.remove("unk"); el.dataset.v = text; el.removeAttribute("aria-label");   // X1-F16: the value lives in the .sr cell, not in aria-label on a span
      el.innerHTML = `<i class="sr">${esc(text)}</i>` + text.split("").map((c) => /\d/.test(c) ? `<i class="rd" aria-hidden="true"><i class="rs" style="transform:translateY(-${+c}lh)">${STRIP}</i></i>` : `<i class="rc" aria-hidden="true">${c === " " ? "&nbsp;" : esc(c)}</i>`).join("");
    },
    to(el, text) {   /* same mask → digits roll right to left (--stagger / 2 apart); otherwise a static redraw */
      const cur = el.dataset.v || "";
      if (reduced || cur.length !== text.length || cur.replace(/\d/g, "0") !== text.replace(/\d/g, "0")) { roll.set(el, text); return; }
      const strips = $$(".rs", el), digits = text.replace(/\D/g, "").split(""), st = tokMs("--stagger") / 2;
      strips.forEach((x, i) => { x.style.transitionDelay = (strips.length - 1 - i) * st + "ms"; x.style.transform = `translateY(-${+digits[i]}lh)`; });
      el.dataset.v = text; const sr = $(".sr", el); if (sr) sr.textContent = text;   // the real value for copy / screen readers
    },
  };

  /* V1-57 (X1-F4): a <pre> that scrolls sideways is a focusable region named after its block («cURL code»); its right 24 px fade until the end (V1-44).
     Re-checked on load, resize, a tab switch, a modal opening and a key landing in the snippet. */
  function codeFit(p) {
    const over = !p.hidden && p.scrollWidth > p.clientWidth;
    p.classList.toggle("ovf", over && p.scrollLeft + p.clientWidth < p.scrollWidth - 1);
    if (over) {
      const box = p.closest(".code"), l = box && box.querySelector(".code-l"), t = box && box.querySelector('[role="tab"][aria-selected="true"]');
      const name = (l && l.textContent.trim()) || (t && t.textContent.trim()) || "Code";
      const sec = p.closest("section"), h = sec && sec.querySelector("h2,h3"), where = h ? h.textContent.trim() + " · " : "";   // landmarks stay unique across the page
      const base = str("s-code-region", "{label} code").replace("{label}", where + name), taken = (v) => $$('pre[role="region"]').some((x) => x !== p && x.getAttribute("aria-label") === v);
      let lab = base, n = 1; while (taken(lab)) lab = `${base} ${++n}`;   // two blocks of one section can both scroll: axe landmark-unique
      p.tabIndex = 0; p.setAttribute("role", "region"); p.setAttribute("aria-label", lab);
    } else if (p.getAttribute("role") === "region") { p.removeAttribute("tabindex"); p.removeAttribute("role"); p.removeAttribute("aria-label"); }
  }
  let cfQ = 0;
  const codeFitAll = () => { cfQ = 0; $$(".code pre").forEach(codeFit); };
  const codeFitLater = () => { if (!cfQ) cfQ = requestAnimationFrame(codeFitAll); };
  if ($(".code pre")) {
    $$(".code pre").forEach((p) => p.addEventListener("scroll", () => p.classList.toggle("ovf", p.scrollLeft + p.clientWidth < p.scrollWidth - 1), { passive: true }));
    const mo = new MutationObserver(codeFitLater);
    $$(".code").forEach((c) => mo.observe(c, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["hidden"] }));
    $$(".modal, [role=tabpanel], .cn-p, .cx-panel").forEach((m) => mo.observe(m, { attributes: true, attributeFilter: ["class", "hidden"] }));
    addEventListener("resize", codeFitLater, { passive: true });
    if (document.fonts) document.fonts.ready.then(codeFitLater); codeFitLater();
  }

  /* one blue action on a screen: while a primary button of the page itself is in view, the header's Open app steps back */
  let watchCta = () => {};
  const hcta = $(".hdr-cta .btn-1"), seen = new Set();
  if (hcta && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
      document.documentElement.classList.toggle("cta-own", [...seen].some((b) => b.matches(".btn-1, .btn-n")));   /* Q1-С1: the hero and CTA «Connect to Claude» is white too (btn-n) */
    });
    $$("main .btn").forEach((b) => io.observe(b));
    watchCta = (b) => io.observe(b);   // R1-3: a button that turns blue later (429 → sign in) is watched too
  }

  /* Arcom-plan D3: the service worker (/sw.js, network first, /offline only when a load fails) lives where the page links the manifest
     (build.py PWA). A build without it takes an earlier worker away, so switching PWA off leaves nothing behind in the visitor's browser. */
  /* Arcom-plan D4: an element that needs a server source (data-feature="rhj") is shown only when /health lists it */
  const needF = $$("[data-feature],[data-nofeature]");   // data-nofeature: the line that stands in while the source is off
  if (needF.length) api("/health").then((r) => { const f = (r.ok && r.data && r.data.features) || []; needF.forEach((e) => { const on = f.includes(e.dataset.feature || e.dataset.nofeature); e.classList.toggle("feat-on", on); if (e.tagName === "OPTION") e.hidden = e.dataset.feature ? !on : on; }); });   // iOS ignores display on <option>

  try {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()), () => {});
    }
  } catch {}   // storage blocked (sandboxed frame): no worker, nothing else changes

  /* W2-1: text-sized controls get a whole-pixel width once the font is in, so everything after them sits on integer x (DPR 1) */
  const snapW = () => {
    $$(".brand, .nav-t, .nav-a, .hdr-cta .btn-nav, .tk-chip, .prov button, .plan-label .chip, .hero-cta .btn").forEach((e) => { e.style.width = ""; const w = e.getBoundingClientRect().width; if (w > 0 && w % 1) e.style.width = Math.ceil(w) + "px"; });
    /* a centred row of whole-pixel items can still land on .5 — give its last item one more pixel */
    $$(".nav, .hero-cta").forEach((r) => { const x = r.getBoundingClientRect().left; if (Math.abs(x % 1) > 0.01) { const l = r.lastElementChild, t = l && (l.matches(".dd") ? l.querySelector(".nav-t") : l); if (t) t.style.width = Math.ceil(t.getBoundingClientRect().width) + 1 + "px"; } });
  };
  /* fonts.ready alone can resolve before Geist is even requested → wait for the two faces the controls use */
  if (document.fonts && document.fonts.load) Promise.all([document.fonts.load("500 14px Geist"), document.fonts.load("400 16px Geist")]).then(() => document.fonts.ready).then(snapW, snapW);
  /* ---------- provider marks: the one map of the site (F4-F4), colored @lobehub icons, local; [file, 1] = a one-colour mark drawn by mask, [file] = a colored <img>. build.py reads this block ---------- */
  const MODEL_LOGO = {
    openai: ["openai", 1], anthropic: ["claude-color"], google: ["gemini-color"], qwen: ["qwen-color"], mistralai: ["mistral-color"],
    "z-ai": ["zhipu-color"], deepseek: ["deepseek-color"], nvidia: ["nvidia-color"], moonshotai: ["moonshot", 1], minimax: ["minimax-color"],
    meta: ["meta-color"], "x-ai": ["grok", 1], cohere: ["cohere-color"], perplexity: ["perplexity-color"], "bytedance-seed": ["doubao-color"], microsoft: ["microsoft-color"],
    /* W1-4: marks from @lobehub/icons for the rest (no mark → empty disc, never a letter) */
    tencent: ["hunyuan-color"], xiaomi: ["xiaomimimo", 1], amazon: ["nova-color"], sakana: ["sakana-color"], poolside: ["poolside-color"], inception: ["inception", 1],
    liquid: ["liquid", 1], stepfun: ["stepfun-color"], inclusionai: ["ling-color"], nousresearch: ["nousresearch", 1], upstage: ["upstage-color"], rekaai: ["reka", 1],
    relace: ["relace", 1], morph: ["morph-color"], "ibm-granite": ["ibm", 1], fireworks: ["fireworks-color"], bytedance: ["bytedance-color"], meituan: ["longcat-color"],
  };
  const provKey = (o) => String(o).toLowerCase().replace(/^~/, "").split("/")[0].replace(/^meta-llama$/, "meta");
  const modelMark = (o, px = 16) => {
    const l = MODEL_LOGO[provKey(o)];
    if (!l) return vhtml(`<span class="i mx-nl" style="--src:url(/img/models/_model.svg)"></span>`);   // V1-32: a neutral mark, never an empty disc
    return vhtml(l[1] ? `<span class="i" style="--src:url(/img/models/${l[0]}.svg)"></span>` : `<img src="/img/models/${l[0]}.svg" alt="" width="${px}" height="${px}" loading="lazy">`);
  };
  /* Smooth heights (owner 09.11, 06-connect-modal-tabs: «окно дергается… нужна плавность на всем сайте»): a container that changes height because
     its content changed (a tab, an accordion, a key that arrived, a result) goes from its last height to the new one in --dur-h on --ease-expo
     (next/ref-qfex/motion: the expo curve of their buttons and photos). The last height is tracked by a ResizeObserver; a DOM change (hidden, open,
     children, text) starts the animation. Reduced motion or the page's pause: no animation — those containers keep a fixed height in CSS instead. */
  const smoothed = new WeakSet();
  function smooth(el) {
    if (!el || smoothed.has(el) || reduced || !("ResizeObserver" in window) || !el.animate) return; smoothed.add(el);
    const cs = getComputedStyle(document.documentElement), dur = parseFloat(cs.getPropertyValue("--dur-h")) || 240, ease = cs.getPropertyValue("--ease-expo").trim() || "ease-out";
    const H = () => el.offsetHeight;   // layout height: a modal's entry scale (transform) is not a height change
    let last = H(), anim = null, q = 0;
    new ResizeObserver(() => { if (!anim) last = H(); }).observe(el);
    const go = () => {
      q = 0;
      const from = anim ? H() : last;
      if (anim) { anim.cancel(); anim = null; }
      const to = H();
      if (from < 1 || Math.abs(to - from) < 1 || document.documentElement.dataset.motion === "off" || !el.offsetParent && getComputedStyle(el).position !== "fixed") { last = to; return; }
      const ov = el.style.overflow; el.style.overflow = "hidden";
      anim = el.animate([{ height: from + "px" }, { height: to + "px" }], { duration: dur, easing: ease });
      const end = () => { el.style.overflow = ov; anim = null; last = H(); };
      anim.onfinish = end; anim.oncancel = () => { el.style.overflow = ov; };
    };
    const ghostOnly = (rs) => rs.every((r) => r.type === "childList" && [...r.addedNodes, ...r.removedNodes].every((n) => n.classList && n.classList.contains("kf-ghost")));
    new MutationObserver((rs) => { if (ghostOnly(rs)) return; if (!q) { q = 1; queueMicrotask(go); } }).observe(el, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["hidden", "open", "aria-selected"] });
  }
  $$("[data-smooth], .modal-box, .faq-list details, .code, .cn-panels, .tl-c, .center-card, .cx-key, .pr-list").forEach(smooth);

  window.KF = { smooth, watchCta: (b) => watchCta(b), trialLimit, provKey, modelMark, asset, v: vhtml, reasonOf, paintPv, reserveKey, ftrBack, stockMark, TXT_MARK, isPaused: () => paused, paintFtr, roll, decode, cutting, birth, snapW, $, $$, api, str, store, meta, site, status, stateOf, openModal, closeModal, copyText, flashCopied, busy, tabs, reduced, toast, live, esc, quote, fmt, onScreen, sleeper };
})();
