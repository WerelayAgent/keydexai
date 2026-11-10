/* /app — wallet sign-in, keys, balance + top-up, usage. All API calls go through KF.api (never throws). */
(function () {
  const { $, $$, str, openModal, closeModal, esc, toast, fmt, busy } = window.KF;
  const Q = new URLSearchParams(location.search);
  const PREVIEW = Q.has("preview");
  const W = window.KF.wallet;   // js/wallet.js: discovery, open-in-wallet links, network switch, receipts (shared with /sign)

  /* ---------- api (with ?preview=1 mock for design review without a server) ---------- */
  /* W1-3: a plausible preview log — irregular tokens and prices, tool calls free with no tokens (never an arithmetic progression) */
  function mockUsage() {
    let x = 7; const r = () => ((x = (x * 1103515245 + 12345) >>> 0) / 4294967296);
    const M = [["anthropic/claude-sonnet-4.5", 3, 15], ["openai/gpt-4.1-mini", 0.4, 1.6], ["deepseek/deepseek-chat", 0.27, 1.1], ["google/gemini-2.5-flash", 0.3, 2.5]];
    const T = ["stock_quote", "stock_portfolio", "build_trade", "fund_agent"], K = ["trading-bot", "research-agent"], out = [];
    let t = Date.now() - 9 * 6e4;
    for (let i = 0; i < 64; i++) {
      t -= (0.4 + r() * r() * 26) * 36e5;
      if (r() < 0.38) { out.push({ ts: Math.round(t), key: K[r() < 0.7 ? 0 : 1], kind: "tool", model: T[Math.floor(r() * r() * 4)], tokens_in: null, tokens_out: null, cost_usd: 0, status: "ok" }); continue; }
      const m = M[Math.floor(r() * M.length)], ti = Math.round(380 + r() * r() * 5200), to = Math.round(60 + r() * 900);
      out.push({ ts: Math.round(t), key: K[r() < 0.6 ? 0 : 1], kind: "model", model: m[0], tokens_in: ti, tokens_out: to, cost_usd: i === 11 ? 0 : +((ti * m[1] + to * m[2]) / 1e6).toFixed(6), status: i === 11 ? "error" : "ok" });
    }
    return out;
  }
  /* the /api/usage contract (SERVER-v1 «Круг 2») over the preview log */
  function mockAnswer(path) {
    const q = new URLSearchParams(path.split("?")[1] || ""), days = +q.get("days") || 7, kid = q.get("key_id"), mod = q.get("model"), dd = q.get("day");
    const dOf = (x) => new Date(x.ts).toISOString().slice(0, 10), t0 = Date.now(), list = Array.from({ length: days }, (_, i) => new Date(t0 - (days - 1 - i) * 864e5).toISOString().slice(0, 10));
    const per = MOCK.usage.rows.filter((x) => list.includes(dOf(x))), base = per.filter((x) => (!kid || x.key === kid) && (!mod || x.model === mod)), rows = base.filter((x) => !dd || dOf(x) === dd);
    const tok = (x) => (x.tokens_in || 0) + (x.tokens_out || 0), sum = (a, f) => a.reduce((n, x) => n + f(x), 0), uniq = (a) => [...new Set(a)];
    return { days, totals: { spent_usd: sum(rows, (x) => x.cost_usd), requests: rows.length, tokens: sum(rows, tok) }, rows: rows.slice(0, 100),
      daily: list.map((d) => { const r = base.filter((x) => dOf(x) === d); return { day: d, spent_usd: sum(r, (x) => x.cost_usd), requests: r.length, tokens: sum(r, tok) }; }),
      keys: uniq(per.map((x) => x.key)).map((k) => ({ id: k, name: k, requests: per.filter((x) => x.key === k).length })), models: uniq(per.map((x) => x.model)).map((m) => ({ model: m, kind: "chat", requests: per.filter((x) => x.model === m).length })), filters: { key_id: kid, model: mod, day: dd } };
  }
  const MOCK = {
    me: { address: "0x12ab34cd56ef7890a1b2c3d4e5f60718293a4b5c", keyfo: { balance: "125,000", decimals: 18 }, allowance: Q.get("free") ? { usd: 0, used_usd: 0, left_usd: 0, held_usd: 12, tier: null, next_tier: { usd: 25, more_usd: 13, allowance_usd: 0.4, more_keyfo: "9,000" }, trial_rules: true, pool_out: false, pending_holding: "4,000", bought_usd: 0 } : { usd: 1.25, used_usd: 0.62, left_usd: 0.63, held_usd: 180, tier: { hold_usd: 100, allowance_usd: 1.25 }, next_tier: { usd: 500, more_usd: 320, allowance_usd: 5, more_keyfo: "222,000" }, trial_rules: false, pending_holding: "0", bought_usd: 3, holding: "125,000", resets_at: Math.ceil(Date.now() / 864e5) * 86400, pool_out: false },
      keys: [
        { id: "k1", name: "trading-bot", prefix: "kf_live_a1b2…", limit_usd: 5, limit_period: "day", spent_today_usd: 1.84, spent_total_usd: 12.4, resets_at: Math.ceil(Date.now() / 864e5) * 86400, created: 1793000000, last_used: 1793300000, revoked: false },
        { id: "k2", name: "research-agent-with-a-very-long-name-for-tests", prefix: "kf_live_9f3c…", limit_usd: 25, limit_period: "day", spent_today_usd: 0.12, spent_total_usd: 0.12, resets_at: Math.ceil(Date.now() / 864e5) * 86400, created: 1793100000, last_used: null, revoked: false },
      ] },
    usage: { rows: mockUsage() },
    topup: { address: Q.get("closed") ? null : "0x7a1c00000000000000000000000000000000beef", assets: [{ symbol: "USDG", address: "0x0000000000000000000000000000000000000001", decimals: 6 }, { symbol: "SOL", address: null, decimals: 18 }] },
  };
  async function api(path, opts) {
    if (!PREVIEW) return window.KF.api(path, opts);
    await new Promise((r) => setTimeout(r, 250));
    const ok = (data) => ({ ok: true, status: 200, data, error: null });
    if (path === "/health") return ok({ ok: true, token_launched: !Q.get("pre") });   // ?preview=1&pre=1 shows the screen before $KEYDEX launches
    if (path === "/api/me") return ok(MOCK.me);
    if (path.startsWith("/api/usage")) return ok(mockAnswer(path));
    if (path === "/api/topup/info") return ok(MOCK.topup);
    if (path === "/api/keys") return ok({ key: "kf_live_PREVIEW0123456789abcdefghijklmnopqrstuvwxyzAB", id: "k3", limit_period: "day" });
    if (path === "/api/trial") return ok({ key: "kf_test_PREVIEW0123456789abcdefghijklmnopqrstuvwxyzAB", expires_at: Date.now() / 1000 + 86400, allowance: { type: "free", period: "daily", remaining: true, resets_at: Math.ceil(Date.now() / 864e5) * 86400 }, models_count: 198, example_model: "openai/gpt-4.1-mini" });
    if (path === "/api/topup/claim") return ok({ status: "credited", amount_usd: 25 });
    return { ok: false, status: 404, data: null, error: { code: "not_found", message: "" } };
  }
  const errMsg = (r) => (r.error && r.error.message) || str("s-error", "The request didn’t go through.");

  /* ---------- formatting ---------- */
  const usd = (v) => fmt.usd(v, 2);
  const toDate = fmt.toDate, day = fmt.date, when = fmt.when, num = fmt.int;
  /* V1-20: a key older than a year shows the year */
  const dayY = (v) => { const d = toDate(v); if (!d) return fmt.DASH; return Date.now() - d.getTime() > 365 * 864e5 ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : day(v); };
  const short = (a) => a ? a.slice(0, 6) + "…" + a.slice(-4) : "";

  /* ---------- states ---------- */
  /* HOLD = the $KEYDEX holder model (build flag hold): no key limits, an allowance by holding, no top-ups; before launch (/health token_launched) no sign-in */
  const HOLD = !!$("#kfBal");
  const STATES = ["stLoading", "stSignin", "stError", "stDash"];
  let LAUNCHED = false;   // §78 (owner 09.11): wallet sign-in is open before launch; until then keys run on the free (trial) allowance and no amounts are shown
  const show = (id) => STATES.forEach((s) => { $("#" + s).hidden = s !== id; });
  let me = null;

  async function boot() {
    STATES.forEach((s) => { $("#" + s).hidden = true; });
    const slow = setTimeout(() => show("stLoading"), 300);
    if (HOLD) { const h = await api("/health"); LAUNCHED = !!(h.ok && h.data && h.data.token_launched === true); }   // decided here by /health, no rebuild
    const r = await api("/api/me");
    clearTimeout(slow);
    if (r.ok && r.data && r.data.address) { me = r.data; renderDash(); show("stDash"); afterBoot(); return; }
    if (r.status === 401 || r.status === 403) { setWallet(null); show("stSignin"); signedOut(); afterBoot(); return; }
    /* LIVE Д-8: a hung /api/me (timeout) is a network failure, not «signed out» — the same «Couldn’t load… Try again» screen as a drop */
    show("stError");
  }
  $("#retryBtn").addEventListener("click", boot);

  /* P2-F25: signed out, the menu offers only Docs (the sign-in card is the page) */
  const signedOut = () => $$("#sheet a[data-tab]").forEach((a) => (a.hidden = true));
  let booted = false;
  function afterBoot() {
    if (booted) return; booted = true;
    if (Q.get("trial") === "1" && !me) getTrial($("#trialBtn"));
    if (Q.get("tab") && me) tab(Q.get("tab"));
    if (Q.get("buy") === "1" && me && openBuyQ) openBuyQ();
  }

  /* ---------- trial key (no sign-in) ---------- */
  async function getTrial(btn) {
    const e = $("#trialErr"); e.hidden = true; KF.cutting(btn, true);
    const r = await api("/api/trial", { method: "POST", body: {} });
    KF.cutting(btn, false);
    if (r.ok && r.data && r.data.key) {
      /* same store as / and /connect: the docs fill their snippets with this key (W0-11) */
      KF.store.set("kf.trial", JSON.stringify({ key: r.data.key, expires_at: r.data.expires_at, allowance: r.data.allowance, models_count: r.data.models_count, example_model: r.data.example_model }));
      showOnce(r.data.key, r.data); KF.decode($("#onceKey"), r.data.key, { keep: 8 }); return;   // WOW-03: the key decodes in the once-modal
    }
    const s1 = $("#signinBtn");
    if (r.status === 429) { btn.hidden = true; s1.classList.replace("btn-2", "btn-1"); e.textContent = KF.trialLimit(r, errMsg(r)); e.hidden = false; s1.focus(); return; }   // PM: #trialErr is role=alert — no second announcement   // X4-M4: one line and one way on, as on /connect
    e.textContent = errMsg(r); e.hidden = false;
  }
  $("#trialBtn").addEventListener("click", (ev) => getTrial(ev.currentTarget));

  /* ---------- wallet discovery (EIP-6963, js/wallet.js) + sign-in ---------- */
  let provider = null, providerIcon = "";

  function utf8hex(s) { return "0x" + Array.from(new TextEncoder().encode(s), (b) => b.toString(16).padStart(2, "0")).join(""); }

  function openPick() {
    $("#wPick").hidden = false; $("#wSign").hidden = true;
    const list = $("#wList"); list.innerHTML = "";
    const items = W.list(str("s-w-browser", ""));
    items.forEach((w) => {
      const li = document.createElement("li");
      li.innerHTML = `<button type="button">${w.info.icon ? `<img src="${esc(w.info.icon)}" alt="">` : '<span class="wallet-ic"></span>'}<span>${esc(w.info.name)}</span></button>`;
      li.firstChild.addEventListener("click", () => signIn(w.provider, w.info.icon));
      list.appendChild(li);
    });
    $("#wNone").hidden = items.length > 0;
    /* documented deep links into the wallet's in-app browser, on our own address (SITE_URL) */
    const WL = W.links(KF.site() + "/app");
    $$("[data-wl]").forEach((a) => (a.href = WL[a.dataset.wl]));
    openModal("mWallet");
  }
  $("#signinBtn").addEventListener("click", openPick);
  $("#expiredGo").addEventListener("click", () => { closeModal("mExpired"); openPick(); });

  /* V1-65 (X3-F9): the sign-in Keyhole is alive — follows the cursor, unlocks on «Sign in», is pleased on success, shakes its eye on a refusal (Twist e881b4af) */
  const km = null;   // the sign-in card carries the k sign
  const kmNo = () => { if (!km) return; km.look(4, 0, 120); setTimeout(() => km.look(-4, 0, 120), 120); setTimeout(() => km.look(4, 0, 120), 240); setTimeout(() => km.look(0, 0, 200), 360); };
  $("#signinBtn").addEventListener("click", () => km && km.turn([220, 380]));
  async function signIn(p, icon) {
    provider = p; providerIcon = icon || "";
    $("#wPick").hidden = true; $("#wSign").hidden = false;
    $("#wSignIc").innerHTML = icon ? `<img src="${esc(icon)}" alt="">` : "";
    const ic = $(".wsign-ic"); ic.classList.remove("err");
    $("#wErr").hidden = true; $("#wRetryRow").hidden = true; $("#wMsg").textContent = "";
    const fail = (m) => { kmNo(); ic.classList.add("err"); $("#wErrMsg").textContent = m || ""; $("#wErr").hidden = false; $("#wRetryRow").hidden = false; };
    try {
      const accs = await p.request({ method: "eth_requestAccounts" });
      const address = (accs && accs[0] || "").toLowerCase();
      if (!address) return fail("");
      const n = await api("/api/auth/nonce?address=" + encodeURIComponent(address));
      if (!n.ok || !n.data || !n.data.message) return fail(n.ok ? "" : errMsg(n));
      $("#wMsg").textContent = n.data.message;
      const signature = await p.request({ method: "personal_sign", params: [utf8hex(n.data.message), address] });
      const v = await api("/api/auth/verify", { method: "POST", body: { address, signature, nonce: n.data.nonce } });
      if (!v.ok) return fail(errMsg(v));
      closeModal("mWallet"); if (km) km.squint(620, 0.3);
      boot();
    } catch (e) { fail(e && e.code === 4001 ? "" : (e && e.message) || ""); }
  }
  $("#wRetry").addEventListener("click", () => signIn(provider, providerIcon));

  /* wallet pill + menu */
  function setWallet(addr) {
    $("#wallet").hidden = !addr;
    if (!addr) return;
    $("#walletAddr").textContent = short(addr);
    /* W1-2: deterministic avatar from the address — two tool colours by its bytes, 4 quadrants */
    const C = ["--c-port", "--c-quote", "--c-trade", "--c-fund"], h = String(addr).toLowerCase().replace(/^0x/, "");
    let x = 0; for (let i = 0; i < h.length; i++) x = (x * 31 + parseInt(h[i], 16)) >>> 0;
    const a = x % 4, b = (a + 1 + ((x >>> 4) % 3)) % 4, ic = $("#walletIc");
    ic.innerHTML = ""; ic.classList.add("av"); ic.style.setProperty("--qa", `var(${C[a]})`); ic.style.setProperty("--qb", `var(${C[b]})`);
  }
  /* menus (wallet, row ⋯): aria-expanded, focus first item, ↑/↓, Esc/Tab close and return focus (P1-24) */
  let openMenu = null;
  function closeMenu(focus) { if (!openMenu) return; const { m, b } = openMenu; m.hidden = true; b.setAttribute("aria-expanded", "false"); openMenu = null; if (focus) b.focus(); }
  function toggleMenu(m, b) {
    if (openMenu && openMenu.m === m) return closeMenu(false);
    closeMenu(false); m.hidden = false; b.setAttribute("aria-expanded", "true"); openMenu = { m, b };
    const items = $$('[role="menuitem"]', m); items.forEach((x) => x.setAttribute("tabindex", "-1"));
    if (items[0]) items[0].focus();
  }
  document.addEventListener("keydown", (e) => {
    if (!openMenu) return;
    const items = $$('[role="menuitem"]', openMenu.m), i = items.indexOf(document.activeElement);
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeMenu(true); }
    else if (e.key === "Tab") closeMenu(false);
    else if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  }, true);
  const wMenu = $("#walletMenu"), wBtn = $("#walletBtn");
  wBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(wMenu, wBtn); });
  document.addEventListener("click", (e) => { if (openMenu && !openMenu.m.contains(e.target) && !openMenu.b.contains(e.target)) closeMenu(false); });
  $("#copyAddr").addEventListener("click", async () => { if (me && await window.KF.copyText(me.address)) toast(str("s-copied", "Copied")); closeMenu(true); });
  $("#signOut").addEventListener("click", async () => { await api("/api/auth/logout", { method: "POST", body: {} }); me = null; closeMenu(false); setWallet(null); show("stSignin"); });

  /* session ended mid-use */
  async function guard(r) { if (r.status === 401) { $$(".modal.open").forEach((m) => closeModal(m)); openModal("mExpired"); return false; } return true; }   // V1-18: one modal

  /* ---------- tabs ---------- */
  const loaded = {};
  function tab(name) {
    if (!["keys", "balance", "usage"].includes(name)) name = "keys";
    $$(".side-a[data-tab]").forEach((a) => { if (a.dataset.tab === name) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    $$("[data-pane]").forEach((p) => { p.hidden = p.dataset.pane !== name; });
    const ph = $(`[data-pane="${name}"] .pane-head h1`); if (ph) document.title = ph.textContent.trim() + " · Keydex AI";   // X1-F23
    if (name === "balance" && !loaded.topup) { loaded.topup = 1; loadTopup(); }
    if (name === "usage" && !loaded.usage) { loaded.usage = 1; loadUsage(); }
    const u = new URL(location.href); if (name === "keys") u.searchParams.delete("tab"); else u.searchParams.set("tab", name);
    u.searchParams.delete("trial"); history.replaceState(null, "", u);
  }
  $$(".side-a[data-tab]").forEach((a) => a.addEventListener("click", () => tab(a.dataset.tab)));
  /* mobile sheet: console sections switch in place when the dashboard is shown */
  $$("#sheet a[data-tab]").forEach((a) => a.addEventListener("click", (e) => { if (!me) return; e.preventDefault(); tab(a.dataset.tab); }));
  /* header status dot (W1-2): the same [data-state] rule as /status and the footer; no answer → no dot */
  const appSt = $("#appSt");
  /* X3-Н3: the dot says in words what it means (title + aria-label), the same line as the footer */
  if (appSt) KF.status().then((r) => { const st = KF.stateOf(r); if (!st) { appSt.hidden = true; return; } appSt.dataset.state = st;
    const t = KF.reasonOf(r) === "routes_busy" && st !== "ok" ? str("s-ftr-routes", "") : str(st === "ok" ? "s-ftr-ok" : st === "degraded" ? "s-ftr-deg" : "s-ftr-down", ""); if (t) { appSt.title = t; appSt.setAttribute("aria-label", $(".app-st-l", appSt).textContent + " · " + t); } });

  /* ---------- dashboard ---------- */
  function renderDash() {
    setWallet(me.address);
    renderKeys();
    if (HOLD) return renderHold();
    $("#balVal").textContent = usd(me.balance_usd);
    const q = me.quota, live = !!me.token;
    const total0 = q ? +(q.allowance_usd ?? q.limit_usd ?? q.total_usd ?? 0) : 0;
    const mode = !live ? "soon" : q && q.error ? "err" : !q || total0 <= 0 ? "none" : "on";
    $("#quotaSoon").hidden = mode !== "soon"; $("#quotaSoonChip").hidden = mode !== "soon"; $("#quotaErr").hidden = mode !== "err";
    $("#quotaOn").hidden = mode !== "on"; $("#quotaNone").hidden = mode !== "none";
    if (mode === "on") {
      const total = +(q.allowance_usd ?? q.limit_usd ?? q.total_usd ?? 0);
      const used = +(q.used_usd ?? (q.left_usd != null ? total - q.left_usd : 0));
      const left = Math.max(0, +(q.left_usd ?? q.remaining_usd ?? total - used));
      $("#qLeft").textContent = usd(left); $("#qTotal").textContent = usd(total);
      $("#qBar").style.width = total > 0 ? Math.min(100, (left / total) * 100) + "%" : "0%";
      const pool = q.pool === "used_up"; $("#qPool").hidden = !pool;
      $("#qOut").hidden = pool || !(total > 0 && left <= 0);
    }
  }

  /* HOLD: the wallet's $KEYDEX and today's model allowance from it (shared by all its keys); one line under the keys says the same */
  const amt = (v) => (Number.isInteger(+v) ? fmt.int(+v) : usd(v).replace(/^\$/, ""));   // «$320», «$1.25»: whole dollars without .00, as the tier table writes them
  function renderHold() {
    /* §78 before launch: the account is the keys and their use on the free allowance — no token balance, no sums, Buy waits (Soon) */
    const bo = $("#buyOpen"); if (bo) bo.disabled = !LAUNCHED;
    if (!LAUNCHED) { ["#quotaOn", "#quotaNone", "#qPool", "#alNext", "#alPending", "#boostLeft"].forEach((q) => { const e = $(q); if (e) e.hidden = true; }); return; }
    const kb = me.keyfo || {}, al = me.allowance || {};
    $("#kfBal").innerHTML = KF.v(`${esc(kb.balance ?? fmt.DASH)}\u00a0<span class="kfw"><span class="tk keyfo in" aria-hidden="true"></span>$KEYDEX</span>`);
    const total = +(al.usd ?? 0), left = Math.max(0, +(al.left_usd ?? total - +(al.used_usd ?? 0)));
    const on = total > 0 && al.trial_rules !== true;   // 1.11: trial_rules = this wallet works under the free (trial) rules — under the first tier or the pool is out
    $("#quotaOn").hidden = !on; $("#quotaNone").hidden = on || !!al.pool_out;
    const line = (el) => { if (!el) return; if (!el.dataset.tpl) el.dataset.tpl = el.textContent; el.innerHTML = KF.v(esc(el.dataset.tpl.replace("{usd}", usd(total).replace(/^\$/, "")).replace("{held}", fmt.known(al.held_usd) ? amt(al.held_usd) : fmt.DASH).replace("{n}", al.holding ?? kb.balance ?? "")).replace("$KEYDEX", '<span class="kfw"><span class="tk keyfo in" aria-hidden="true"></span>$KEYDEX</span>')); el.hidden = !on; };   // where there is a ticker there is its mark
    line($("#alLine")); line($("#keysNote"));
    /* the pool for all holders is out → one line, in or out of a tier (the key keeps working under the free rules) */
    const qp = $("#qPool"); if (qp) qp.hidden = !al.pool_out;
    /* tokens that arrived recently: counted later (1.11 pending_holding); bought allowance left (boost) */
    const pe = $("#alPending"); if (pe) { if (!pe.dataset.tpl) pe.dataset.tpl = pe.textContent; const pn = al.pending_holding; pe.hidden = !(pn && +String(pn).replace(/,/g, "") > 0); if (!pe.hidden) pe.innerHTML = KF.v(esc(pe.dataset.tpl.replace("{n}", pn)).replace("$KEYDEX", '<span class="kfw"><span class="tk keyfo in" aria-hidden="true"></span>$KEYDEX</span>')); }
    const bl = $("#boostLeft"); if (bl) { if (!bl.dataset.tpl) bl.dataset.tpl = bl.textContent; bl.hidden = !(+al.bought_usd > 0); if (!bl.hidden) bl.textContent = bl.dataset.tpl.replace("{usd}", amt(al.bought_usd)); }
    /* §63: «Hold ${more} more to reach ${usd} a day.» from the next tier (server 1.11: allowance.next_tier) — only a holder's amounts are shown, never a trial key's */
    const nx = al.next_tier, ne = $("#alNext");
    if (ne) { if (!ne.dataset.tpl) ne.dataset.tpl = ne.textContent; ne.hidden = !(nx && nx.more_usd > 0); if (!ne.hidden) ne.textContent = ne.dataset.tpl.replace("{more}", amt(nx.more_usd)).replace("{usd}", amt(nx.allowance_usd ?? nx.usd)); }   // {usd} = the next tier's allowance a day
    if (on) {
      $("#qLeft").textContent = usd(left); $("#qTotal").textContent = usd(total);
      $("#qBar").style.width = Math.min(100, (left / total) * 100) + "%";
      $("#qOut").hidden = !!al.pool_out || left > 0;
    }
  }

  const DOTS = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="3.5" cy="8" r="1.3"/><circle cx="8" cy="8" r="1.3"/><circle cx="12.5" cy="8" r="1.3"/></svg>';
  function renderKeys() {
    const keys = (me.keys || []).filter((k) => !(k.revoked || k.status === "revoked"));
    const body = $("#keysBody"); body.innerHTML = "";
    const th = $$(".keys-tbl th").map((t) => t.textContent.trim());
    $(".keys-tbl").hidden = !keys.length; $("#keysEmpty").hidden = !!keys.length; if (!HOLD) $("#keysNote").hidden = !keys.length;
    /* P2-F18: at 10 keys «Create key» is unavailable and says why with the count */
    const full = keys.length >= 10, ck = $("#createKey"); ck.setAttribute("aria-disabled", String(full)); ck.classList.toggle("is-off", full);
    ck.classList.toggle("btn-1", !!keys.length); ck.classList.toggle("btn-2", !keys.length);   // one blue action: with no keys the empty state's «Create key» is it
    let kc = $(".keys-count"); if (!kc) { ck.insertAdjacentHTML("beforebegin", '<span class="keys-count"></span>'); kc = $(".keys-count"); } kc.textContent = full ? keys.length + " / 10" : "";
    const o = HOLD ? -1 : 0;   // HOLD: no «Daily limit» column, the headers shift by one
    keys.forEach((k, i) => {
      const lim = !HOLD && fmt.known(k.limit_usd) ? +k.limit_usd : null, sp = fmt.known(k.spent_today_usd) ? +k.spent_today_usd : null;
      const pct = lim > 0 && sp != null ? Math.min(100, (sp / lim) * 100) : 0;
      const tleft = k.resets_at ? fmt.left(k.resets_at - Date.now() / 1000) : "", left = tleft ? str("s-resets-in", "").replace("{time}", tleft) : "";
      const full = lim > 0 && sp != null && sp >= lim, near = !full && pct >= 80;   // V1-14 (P2-F5): a key at its limit is visible without hovering
      const limT = str("s-limit-full", "").replace("{time}", tleft || fmt.DASH), lim2 = limT.split(" · ");   // P2 M-2: the second half steps aside where the column is narrow
      const chip = full ? `<span class="lim-chip" title="${esc(limT)}">${esc(lim2[0])}${lim2[1] ? `<span class="lim-t"> · ${esc(lim2[1])}</span>` : ""}</span>` : "";
      const hint = k.prefix || k.hint || "kf_live_…";
      const tr = document.createElement("tr"); tr.dataset.id = k.id;
      if (i < 8) tr.style.animationDelay = i * 30 + "ms";
      tr.innerHTML =
        `<td class="first" data-l="${esc(th[0])}" title="${esc(k.name || "")}"><span class="kcell"><span class="kname">${esc(k.name || "—")}</span>${chip}</span></td>` +
        `<td class="mono" data-l="${esc(th[1])}">${esc(hint)}</td>` +
        (HOLD ? "" : `<td class="r" data-l="${esc(th[2])}">${usd(lim)}</td>`) +
        (HOLD ? `<td class="r" data-l="${esc(th[2])}">${usd(sp)}</td>` : `<td class="r" data-l="${esc(th[3])}"><span class="spent${full ? " full" : near ? " near" : ""}" title="${esc(left)}"><span>${usd(sp)}</span><span class="bar"><i style="width:${pct}%"></i></span></span></td>`) +
        `<td class="r" data-l="${esc(th[o + 4])}">${usd(k.spent_total_usd)}</td>` +
        `<td data-l="${esc(th[o + 5])}">${dayY(k.created ?? k.created_at)}</td>` +
        `<td data-l="${esc(th[o + 6])}">${when(k.last_used ?? k.last_used_at)}</td>` +
        `<td class="act"><div class="row-menu"><button class="dots-btn" type="button" aria-label="${esc(str("s-key-actions", th[o + 7] || "").replace("{name}", k.name || ""))}" aria-haspopup="menu" aria-expanded="false">${DOTS}</button><div class="menu" role="menu" hidden>${HOLD ? "" : `<button type="button" role="menuitem" data-a="edit">${esc(str("s-edit", "Edit limit"))}</button>`}<button type="button" role="menuitem" class="danger" data-a="revoke">${esc(str("s-revoke", "Revoke"))}</button></div></div></td>`;
      const menu = tr.querySelector(".menu"), dots = tr.querySelector(".dots-btn");
      dots.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(menu, dots); });
      if (!HOLD) tr.querySelector('[data-a="edit"]').addEventListener("click", () => { closeMenu(false); openLimit(k); });
      tr.querySelector('[data-a="revoke"]').addEventListener("click", () => { closeMenu(false); openRevoke(k); });
      body.appendChild(tr);
    });
  }
  async function refreshMe() { const r = await api("/api/me"); if (r.ok && r.data) { me = r.data; renderDash(); } else guard(r); }
  if ($("#quotaRetry")) $("#quotaRetry").addEventListener("click", (e) => { const b = e.currentTarget; busy(b, true); refreshMe().finally(() => busy(b, false)); });

  /* X1-N3: focus returns to the row's ⋯ (the row is redrawn after a save, gone after a revoke → «Create key») */
  const keyBtn = (id) => () => $(`tr[data-id="${CSS.escape(String(id))}"] .dots-btn`) || $("#createKey");

  /* create key */
  const parseUsd = (v) => { const t = String(v).trim().replace(",", "."); if (!/^\d*\.?\d+$/.test(t)) return null; const n = +t; return n >= 0.01 && n <= 10000 ? Math.round(n * 100) / 100 : null; };
  const invalid = (input, err, on, msg) => { input.setAttribute("aria-invalid", String(!!on)); if (msg) { err.textContent = msg; err.hidden = false; } else err.hidden = true; };
  const limitMsg = () => str("s-err-limit", "Enter a limit from $0.01 to $10,000.");
  const errOf = (r) => (r.error && r.error.code === "invalid_limit") ? limitMsg() : errMsg(r);
  function openCreate() { if ($("#createKey").getAttribute("aria-disabled") === "true") return; $("#nName").value = ""; if (!HOLD) { $("#nLimit").value = "5"; invalid($("#nLimit"), $("#nErr"), false); } else $("#nErr").hidden = true; openModal("mNew"); }
  $("#createKey").addEventListener("click", openCreate);
  $("[data-create]").addEventListener("click", openCreate);
  $("#newForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("#nName").value.trim() || "key", limit = HOLD ? 0 : parseUsd($("#nLimit").value);
    const err = $("#nErr"), inp = HOLD ? $("#nName") : $("#nLimit");   // HOLD: no limit field — a name is all a key needs
    if (limit == null) { invalid(inp, err, true, limitMsg()); inp.focus(); return; }
    if (!HOLD) invalid(inp, err, false); else err.hidden = true;
    const b = e.submitter || $('#newForm [type=submit]'); if (b.getAttribute("aria-busy") === "true") return; busy(b, true);
    const r = await api("/api/keys", { method: "POST", body: HOLD ? { name } : { name, limit_usd: limit } });
    busy(b, false);
    if (!r.ok || !r.data || !r.data.key) { if (await guard(r)) { if (HOLD) { err.textContent = errMsg(r); err.hidden = false; } else invalid(inp, err, r.error && r.error.code === "invalid_limit", errOf(r)); } return; }
    closeModal("mNew"); showOnce(r.data.key); toast(str("s-key-created", "")); refreshMe();   // W1-13
  });

  /* key shown once */
  function showOnce(key, trial) {
    $("#onceKey").textContent = key; $("#onceKey").dataset.value = key; $("#onceCli").dataset.value = "";   // Copy reads data-value — whole even while the key decodes (P6-F18)
    $(".once-live").hidden = !!trial; $(".once-trial").hidden = !trial;
    $("#mOnce").setAttribute("aria-labelledby", trial ? "mOnceTT" : "mOnceT");
    if (trial) { const e = $("#onceExp"); e.textContent = (e.dataset.tpl || "").replace("{time}", trial.expires_at ? fmt.utcd(new Date(trial.expires_at * 1000)) : fmt.DASH); }
    const cli = `claude mcp add -s user \\\n  --transport http Keydex AI \\\n  ${KF.site()}/mcp \\\n  --header "Authorization: Bearer ${key}"`;
    /* PD «Прод 1.12.2»: every line is its own block with a hanging indent (as in the Connect windows) — a long line wraps at a space, the key stands whole under it */
    $("#onceCli").innerHTML = cli.split("\n").map((l, i, L) => `<span class="ln" style="--in:${l.match(/^ */)[0].length + 2}">${KF.esc(l)}${i < L.length - 1 ? "\n" : ""}</span>`).join("");
    const done = $("#onceDone"); done.classList.remove("btn-1"); done.classList.add("btn-2");
    openModal("mOnce");
  }
  $("#onceCopy").addEventListener("click", () => { const d = $("#onceDone"); d.classList.remove("btn-2"); d.classList.add("btn-1"); });
  $("#mOnce").addEventListener("modal:close", () => { $("#onceKey").textContent = ""; $("#onceCli").textContent = ""; delete $("#onceKey").dataset.value; delete $("#onceCli").dataset.value; });

  /* edit limit */
  let editing = null;
  function openLimit(k) { editing = k; $("#limitName").textContent = k.name || ""; $("#lLimit").value = k.limit_usd ?? ""; invalid($("#lLimit"), $("#lErr"), false); openModal("mLimit", keyBtn(k.id)); }
  if ($("#limitForm")) $("#limitForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const inp = $("#lLimit"), limit = parseUsd(inp.value), err = $("#lErr");
    if (limit == null) { invalid(inp, err, true, limitMsg()); inp.focus(); return; }
    invalid(inp, err, false);
    const b = e.submitter || $('#limitForm [type=submit]'); if (b.getAttribute("aria-busy") === "true") return; busy(b, true);
    const r = await api("/api/keys/" + encodeURIComponent(editing.id), { method: "PATCH", body: { limit_usd: limit } });
    busy(b, false);
    if (!r.ok) { if (await guard(r)) invalid(inp, err, r.error && r.error.code === "invalid_limit", errOf(r)); return; }
    closeModal("mLimit"); toast(str("s-key-saved", "")); await refreshMe(); keyBtn(editing.id)().focus({ preventScroll: true });   // W1-13
  });

  /* revoke */
  let revoking = null;
  function openRevoke(k) { revoking = k; $("#revokeName").textContent = k.name || ""; $("#rErr").hidden = true; openModal("mRevoke", keyBtn(k.id)); }
  $("#revokeGo").addEventListener("click", async (e) => {
    const b = e.currentTarget; busy(b, true);
    const r = await api("/api/keys/" + encodeURIComponent(revoking.id) + "/revoke", { method: "POST", body: {} });
    busy(b, false);
    if (!r.ok) { if (await guard(r)) { $("#rErr").textContent = errMsg(r); $("#rErr").hidden = false; } return; }
    closeModal("mRevoke"); toast(str("s-toast", "Key revoked.")); await refreshMe(); keyBtn(revoking.id)().focus({ preventScroll: true });
  });

  /* ---------- top-up (only while the page has it: build flag not_hold; the $KEYDEX holder model has no top-ups) ---------- */
  let loadTopup = () => {};
  if ($("#topup")) (() => {
  let tinfo = null, asset = null;
  loadTopup = async function () {
    const r = await api("/api/topup/info");
    $("#topupLoading").hidden = true;
    if (!r.ok) { if (await guard(r)) { $("#topupErr").textContent = errMsg(r); $("#topupErr").hidden = false; } return; }
    tinfo = r.data || {};
    if (!tinfo.address) { $("#topupSoon").hidden = false; return; }   // V1-17: closed — one line, nothing that sends you to pay
    $("#topupOn").hidden = false;
    $("#tAddr").textContent = tinfo.address;
    const assets = (tinfo.assets || []).map((a) => typeof a === "string" ? { symbol: a, address: null, decimals: a.toUpperCase() === "SOL" ? 18 : 6 } : a);
    const tabs = $("#assetTabs"); tabs.innerHTML = "";
    assets.forEach((a, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "tab"; b.setAttribute("role", "radio"); b.setAttribute("aria-checked", String(i === 0)); b.tabIndex = i === 0 ? 0 : -1;
      const icon = KF.v(`<img class="ic" src="/img/tokens/${a.symbol.toUpperCase() === "SOL" ? "eth.svg" : "usdg.png"}" alt="" width="14" height="14">`);
      b.innerHTML = icon + `<span>${esc(a.symbol)}</span>`; b._asset = a;
      tabs.appendChild(b);
    });
    /* V1-42: roving tabindex, ←/→, the selection drives the asset */
    const pickAsset = (t) => { asset = t._asset; $("#amtSym").textContent = asset.symbol; };
    if (assets.length) {
      const opts = $$('[role="radio"]', tabs), sel = (t) => { opts.forEach((x) => { const on = x === t; x.setAttribute("aria-checked", String(on)); x.tabIndex = on ? 0 : -1; }); pickAsset(t); };
      opts.forEach((t, i) => { t.addEventListener("click", () => sel(t)); t.addEventListener("keydown", (e) => { const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!k) return; e.preventDefault(); const n = opts[(i + k + opts.length) % opts.length]; sel(n); n.focus(); }); });
      pickAsset(tabs.firstElementChild);
    }
    /* V1-17: «$KEYDEX · Soon» — the third, inactive tab */
    tabs.insertAdjacentHTML("beforeend", `<span class="tab soon-tab" role="radio" aria-checked="false" aria-disabled="true"><span class="tk keyfo xs" aria-hidden="true"></span><span>$KEYDEX</span><span class="chip dim">${esc(str("s-soon", "Soon"))}</span></span>`);
    if (!assets.length) $("#sendBtn").hidden = true;
  }
  function parseUnits(v, dec) {
    const s = String(v).trim().replace(",", ".");
    if (!/^\d*\.?\d*$/.test(s) || !/\d/.test(s)) return null;
    const [i, f = ""] = s.split(".");
    if (f.length > dec) return null;
    const raw = BigInt((i || "0") + f.padEnd(dec, "0"));
    return raw > 0n ? raw : null;
  }
  const pad32 = (h) => h.replace(/^0x/, "").toLowerCase().padStart(64, "0");
  $("#sendBtn").addEventListener("click", async (e) => {
    const b = e.currentTarget, err = $("#topupErr"); err.hidden = true;
    const p = provider || W.first();
    const raw = asset && parseUnits($("#amt").value, +asset.decimals || 18);
    if (!raw) { $("#amt").setAttribute("aria-invalid", "true"); err.textContent = str("s-err-amount", "Enter an amount above 0."); err.hidden = false; $("#amt").focus(); return; }
    $("#amt").removeAttribute("aria-invalid");
    if (!p) { err.textContent = str("s-error", "The request didn’t go through."); err.hidden = false; return; }
    busy(b, true);
    try {
      await W.toChain(p, W.CHAIN);
      const isEth = asset.symbol.toUpperCase() === "SOL" || !asset.address;
      const tx = isEth
        ? { from: me.address, to: tinfo.address, value: "0x" + raw.toString(16) }
        : { from: me.address, to: asset.address, data: "0xa9059cbb" + pad32(tinfo.address) + pad32(raw.toString(16)) };
      const hash = await p.request({ method: "eth_sendTransaction", params: [tx] });
      busy(b, false);
      claim(hash);
    } catch (x) { busy(b, false); if (!(x && x.code === 4001)) { err.textContent = (x && x.message) || str("s-error", ""); err.hidden = false; } }
  });
  /* V1-60 (X1-F11): a wrong hash says why, next to the field */
  $("#claimBtn").addEventListener("click", () => { const h = $("#claimTx").value.trim(), e = $("#claimErr"); if (/^0x[0-9a-fA-F]{64}$/.test(h)) { invalid($("#claimTx"), e, false); claim(h); } else { invalid($("#claimTx"), e, true, str("s-err-tx", "")); $("#claimTx").focus(); } });

  let poll = null;
  $("#stFail").dataset.tpl = $("#stFail").textContent;
  const tplSeen = $("#stSeen").textContent, tplCred = $("#stCred").textContent;
  function setStep(name, cls) { const st = $(`#steps [data-step="${name}"] .stp`); st.className = "stp " + (cls || ""); }
  async function claim(tx) {
    clearTimeout(poll);
    $("#steps").hidden = false; $("#stFail").hidden = true; const fx0 = $("#stFailX"); if (fx0) fx0.hidden = true; $("#stFail").textContent = $("#stFail").dataset.tpl;
    $("#stTx").textContent = short(tx);
    $("#stSeen").textContent = tplSeen.replace(" {n}", "").replace("{n}", "");
    $("#stCred").textContent = tplCred.replace("{amount}", "");
    setStep("sent", "done"); setStep("seen", "run"); setStep("credited", ""); KF.live($("#stSeen").textContent);
    let n = 0;
    const tick = async () => {
      const r = await api("/api/topup/claim", { method: "POST", body: { tx }, timeout: 30000 });
      if (!r.ok) {
        if (r.status === 0 && ++n < 40) { poll = setTimeout(tick, 3000); return; }   // X2-Н-2: a timeout says nothing about the money — the step keeps running, the repeat is safe (already_credited)
        if (!(await guard(r))) return;
        setStep("seen", "fail"); setStep("credited", "");
        const f = $("#stFail"); f.textContent = (r.error && r.error.message) || f.dataset.tpl; f.hidden = false; const fx = $("#stFailX"); if (fx) fx.hidden = false; return;
      }
      const d = r.data || {}, s = String(d.status || "").toLowerCase();
      if (d.block) $("#stSeen").textContent = tplSeen.replace("{n}", num(d.block));
      if (["credited", "already_credited", "done", "ok"].includes(s)) {
        setStep("seen", "done"); setStep("credited", "done"); setTimeout(() => KF.live($("#stCred").textContent), 50);
        $("#stCred").textContent = tplCred.replace("{amount}", d.amount_usd != null ? usd(d.amount_usd).replace("$", "") : "");
        refreshMe(); return;
      }
      if (["failed", "rejected", "not_found", "invalid", "error"].includes(s)) { setStep("seen", "fail"); $("#stFail").hidden = false; const fx = $("#stFailX"); if (fx) fx.hidden = false; return; }
      if (s === "seen") { setStep("seen", "done"); setStep("credited", "run"); }
      if (s === "pending") { setStep("seen", "run"); }
      if (++n < 40) poll = setTimeout(tick, 4000);
    };
    tick();
  }
  })();

  /* ---------- Buy $KEYDEX (flag buy; owner 07.11): pay from any network, the route through LI.FI or Relay (/api/buy/quote), the wallet signs each call.
     Quoro's swap card in Keydex AI's look: the coin with its network on the corner, «At least…», route mark, signatures; a quote past valid_until is asked again before anything is signed. ---------- */
  /* boost (flags boost + holder): the window frame only; signing waits for the engineer's answer (claim expects both transfers in one tx) */
  if ($("#mBoost")) (() => {
    /* boost (flags boost + holder, server 1.11): POST /api/allowance/boost {Keydex AI} → ONE transfer of the whole sum to the team address; the wallet signs it once;
       the allowance is added by the server after 20 confirmations — /api/allowance/boost/claim {tx} says pending | credited, asked at most every 10 s */
    const go = $("#boostGo"), err = $("#boostErr"), st = $("#boostSt"), inp = $("#boostAmt");
    let busyB = false, poll = 0;
    const ok = () => /^\d*\.?\d+$/.test(inp.value.trim().replace(",", ".")) && +inp.value.replace(",", ".") > 0;
    inp.addEventListener("input", () => go.setAttribute("aria-disabled", String(!ok() || busyB)));
    const say = (id) => { st.textContent = str(id, ""); st.hidden = !st.textContent; };
    $("#boostOpen").addEventListener("click", () => { clearTimeout(poll); inp.value = ""; err.hidden = true; st.hidden = true; go.setAttribute("aria-disabled", "true"); openModal("mBoost", $("#boostOpen")); setTimeout(() => inp.focus(), 50); });
    async function claimLoop(tx, n = 0) {
      const r = await api("/api/allowance/boost/claim", { method: "POST", body: { tx } });
      const s2 = r.ok && r.data && (r.data.data || r.data).status;
      if (s2 === "credited") { say("s-boost-credited"); refreshMe(); return; }
      if (!r.ok && r.status !== 429) { if (await guard(r)) { err.textContent = errMsg(r); err.hidden = false; } return; }
      say("s-boost-pending"); if (n < 90) poll = setTimeout(() => claimLoop(tx, n + 1), 10000);   // never more often than every 10 s
    }
    $("#boostForm").addEventListener("submit", async (e) => {
      e.preventDefault(); if (!ok() || busyB) return;
      busyB = true; busy(go, true); err.hidden = true; st.hidden = true;
      try {
        const r = await api("/api/allowance/boost", { method: "POST", body: { keyfo: inp.value.trim().replace(",", ".") } });
        const d = r.ok && r.data && (r.data.data || r.data);
        const c = d && (d.calls || [])[0];
        if (!c) { if (await guard(r)) { err.textContent = errMsg(r); err.hidden = false; } return; }
        const p = provider || W.first();
        if (!p) { err.textContent = str("s-error", ""); err.hidden = false; return; }
        say("s-buy-wait");
        const accs = await p.request({ method: "eth_requestAccounts" });
        await W.toChain(p, W.CHAIN);
        const tx = { from: (accs && accs[0] || "").toLowerCase(), to: c.to, data: c.data, value: W.hex(c.value) }; if (c.gas) tx.gas = W.hex(c.gas);
        const h = await p.request({ method: "eth_sendTransaction", params: [tx] });
        say("s-buy-sent"); claimLoop(h);
      } catch (x) { st.hidden = true; if (!(x && x.code === 4001)) { err.textContent = (x && x.message) || str("s-error", ""); err.hidden = false; } }
      finally { busyB = false; busy(go, false); go.setAttribute("aria-disabled", String(!ok())); }
    });
  })();
  let openBuyQ = null;
  if ($("#mBuy")) (() => {
    const CH = [["Solana", "Solana", "SOL", 4663, ""], ["base", "Base", "SOL", 8453, "base.svg"], ["ethereum", "Ethereum", "SOL", 1, "ethereum.svg"], ["arbitrum", "Arbitrum", "SOL", 42161, "arbitrum.svg"],
      ["optimism", "Optimism", "SOL", 10, "optimism.svg"], ["unichain", "Unichain", "SOL", 130, "unichain.svg"], ["bnb", "BNB Chain", "BNB", 56, "bnb.svg"], ["polygon", "Polygon", "POL", 137, "polygon.svg"],
      ["linea", "Linea", "SOL", 59144, "linea.svg"], ["zksync", "zkSync", "SOL", 324, "zksync.svg"], ["scroll", "Scroll", "SOL", 534352, "scroll.svg"], ["ink", "Ink", "SOL", 57073, "ink.svg"], ["mode", "Mode", "SOL", 34443, "mode.svg"]];
    const COIN = { SOL: "/img/tokens/sol.svg", BNB: "/img/chains/bnb.svg", POL: "/img/chains/polygon.svg" };   // where there is a ticker there is its mark
    const KW = '<span class="kfw"><span class="tk keyfo in" aria-hidden="true"></span>$KEYDEX</span>';
    const MARK = { lifi: '<img class="mark-in" src="/img/brand/lifi-white.svg" alt="LI.FI" width="33" height="12">', relay: '<img class="mark-in" src="/img/brand/relay-white.svg" alt="Relay" width="53" height="12">' };
    const CHEV = '<svg class="chev" viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 3.75 5 6.25 7.5 3.75" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    let pick = CH[0], q = null, qSeq = 0, qT = 0, sending = false;
    const coin = (c) => `<span class="bx-coin"><img src="${COIN[c[2]]}" alt="" width="20" height="20">${c[4] ? `<img class="bx-ch" src="/img/chains/${c[4]}" alt="" width="12" height="12">` : ""}</span>`;
    const row = (c) => esc(str("s-buy-row", "{coin} on {chain}").replace("{coin}", c[2]).replace("{chain}", c[1]));
    const trim = (x) => { const [i, f = ""] = String(x ?? "0").split("."); const ff = f.slice(0, i.length > 3 ? 2 : 6).replace(/0+$/, ""); return Number(i).toLocaleString("en-US") + (ff ? "." + ff : ""); };
    const go = $("#bGo"), note = $("#bNote"), err = $("#bErr");
    const setGo = (on) => go.setAttribute("aria-disabled", String(!on));
    const paintFrom = () => { $("#bFrom").innerHTML = KF.v(coin(pick) + `<span>${row(pick)}</span>` + CHEV); };
    function paintList() {
      $("#bList").innerHTML = KF.v(CH.map((c, i) => `<li role="option" id="bo-${c[0]}" data-i="${i}" aria-selected="${c === pick}">${coin(c)}<span>${row(c)}</span></li>`).join(""));
    }
    const listOpen = (on) => { $("#bList").hidden = !on; $("#bFrom").setAttribute("aria-expanded", String(on)); if (on) { paintList(); const s = $('#bList [aria-selected="true"]'); if (s) s.classList.add("act"); $("#bList").setAttribute("tabindex", "0"); $("#bList").focus(); } };
    $("#bFrom").addEventListener("click", () => listOpen($("#bList").hidden));
    const choose = (i) => { pick = CH[+i]; paintFrom(); listOpen(false); $("#bFrom").focus(); quote(); };
    $("#bList").addEventListener("click", (e) => { const li = e.target.closest("li[data-i]"); if (li) choose(li.dataset.i); });
    $("#bList").addEventListener("keydown", (e) => {
      const items = $$("#bList li"), cur = items.findIndex((x) => x.classList.contains("act"));
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); const n = Math.max(0, Math.min(items.length - 1, cur + (e.key === "ArrowDown" ? 1 : -1))); items.forEach((x, k) => x.classList.toggle("act", k === n)); items[n].scrollIntoView({ block: "nearest" }); $("#bList").setAttribute("aria-activedescendant", items[n].id); }
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (cur >= 0) choose(items[cur].dataset.i); }
      else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); listOpen(false); $("#bFrom").focus(); }
    });
    function clearQuote() { q = null; $("#bOut").textContent = "0"; $("#bOut").classList.add("dim"); $("#bMin").textContent = ""; $("#bProv").textContent = fmt.DASH; $("#bSigs").textContent = fmt.DASH; setGo(false); }
    async function quote() {
      clearTimeout(qT); err.hidden = true; clearQuote();
      const amt = $("#bAmt").value.trim().replace(",", ".");
      if (!/^\d*\.?\d+$/.test(amt) || +amt <= 0) { note.textContent = ""; return; }
      const seq = ++qSeq; note.textContent = str("s-buy-finding", "");
      const r = await api(`/api/buy/quote?wallet=${encodeURIComponent(me.address)}&from_chain=${pick[0]}&amount=${encodeURIComponent(amt)}`, { timeout: 45000 });
      if (seq !== qSeq) return;   // only the last request paints
      note.textContent = "";
      const d = r.ok && r.data && (r.data.data || r.data);   // REST answers wrap the result in data
      if (!d || !d.calls) { if (await guard(r)) { err.textContent = errMsg(r); err.hidden = false; } return; }
      q = d;
      $("#bOut").textContent = trim(q.out); $("#bOut").classList.remove("dim");
      $("#bMin").innerHTML = KF.v(esc(str("s-buy-min", "").replace("{n}", trim(q.out_min))).replace("$KEYDEX", KW));
      $("#bProv").innerHTML = KF.v((MARK[q.provider] || esc(q.provider || "")) + (q.eta_s ? `<span class="muted">· ${esc(str("s-buy-eta", "").replace("{t}", q.eta_s < 60 ? q.eta_s + " s" : fmt.left(q.eta_s)))}</span>` : ""));
      $("#bSigs").textContent = fmt.int(q.calls.length);
      setGo(true);
      qT = setTimeout(() => { if (!sending) { note.textContent = str("s-buy-expired", ""); quote(); } }, Math.max(5, (q.valid_until || 0) - Date.now() / 1000) * 1000);   // a quote past valid_until is asked again
    }
    let deb = 0;
    $("#bAmt").addEventListener("input", () => { clearTimeout(deb); deb = setTimeout(quote, 500); });
    const wallet = () => provider || W.first();
    const { hex, toChain, receipt } = W;   // receipt: null after ~3 min without one — below that counts as not received, as before
    $("#buyForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      if (go.getAttribute("aria-disabled") === "true" || sending || !q) return;
      if ((q.valid_until || 0) - Date.now() / 1000 < 3) { note.textContent = str("s-buy-expired", ""); return quote(); }   // never sign an expired route
      const p = wallet(); err.hidden = true;
      if (!p) { err.textContent = str("s-error", "The request didn’t go through."); err.hidden = false; return; }
      sending = true; clearTimeout(qT); busy(go, true);
      const st = $("#bSteps"); st.hidden = false;
      st.innerHTML = q.calls.map((c, i) => `<li data-i="${i}"><span class="stp"></span><span>${esc(c.label || "")}</span> <span class="muted small" data-s></span></li>`).join("");
      const mark = (i, cls, t) => { const li = st.children[i]; li.querySelector(".stp").className = "stp " + cls; li.querySelector("[data-s]").textContent = t; };
      try {
        const accs = await p.request({ method: "eth_requestAccounts" });
        const from = (accs && accs[0] || "").toLowerCase();
        for (let i = 0; i < q.calls.length; i++) {
          const c = q.calls[i];
          mark(i, "run", str("s-buy-wait", ""));
          await toChain(p, c.chain_id);
          const tx = { from, to: c.to, data: c.data, value: hex(c.value) }; if (c.gas) tx.gas = hex(c.gas);
          const h = await p.request({ method: "eth_sendTransaction", params: [tx] });
          mark(i, "run", str("s-buy-sent", ""));
          if (!(await receipt(p, h))) { mark(i, "fail", ""); throw new Error(str("s-error", "")); }
          mark(i, "done", str("s-buy-done", ""));
        }
        note.textContent = str("s-buy-ok", ""); toast(str("s-buy-ok", "")); setTimeout(refreshMe, 6000);
      } catch (x) {
        if (x && x.code === 4001 && !st.querySelector(".stp.done")) { st.hidden = true; note.textContent = str("s-buy-declined", ""); setGo(true); }   // declined in the wallet before anything went: back to the quote, one line why
        else { if (!(x && x.code === 4001)) { err.textContent = (x && x.message) || str("s-error", ""); err.hidden = false; } $$("#bSteps .stp.run").forEach((s2) => { s2.className = "stp"; s2.parentElement.querySelector("[data-s]").textContent = ""; }); }
      }
      finally { sending = false; busy(go, false); }
    });
    function openBuy() { pick = CH[0]; paintFrom(); listOpen(false); $("#bAmt").value = ""; clearQuote(); note.textContent = ""; err.hidden = true; $("#bSteps").hidden = true; openModal("mBuy", $("#buyOpen")); setTimeout(() => $("#bAmt").focus(), 50); }
    $("#buyOpen").addEventListener("click", openBuy);
    openBuyQ = openBuy;   // /app?tab=balance&buy=1 opens it once the dashboard is up (afterBoot)
  })();

  /* ---------- usage ---------- */
  /* V1-13 (P2-F3/F4/F7/F15, X1-F5, X4-F17): KPI and chart from the server's totals / daily for the period (И-5), the table = the last 100 calls (rows);
     an error never shows as zeros; bars are buttons (←/→ between days, Enter selects). Refs Anthropic Cost 84d12459, Usage 865a7bf8, Rork d2607e71 */
  const TCU = { stock_quote: "--c-quote", stock_portfolio: "--c-port", build_trade: "--c-trade", fund_agent: "--c-fund" };
  let U = [], UD = null, uState = { key: "", model: "", p: 7, sel: null };
  const uCache = {};
  const isTool = (x) => x.kind === "tool" || !!TCU[x.model || x.tool];
  const okCall = (x) => !x.status || /^(ok|200|success)$/i.test(String(x.status));
  const cost = (x) => +(x.cost_usd ?? x.cost ?? 0) || 0;
  const shape = (d) => ({ rows: (d && d.rows) || [], totals: (d && d.totals) || {}, keys: (d && d.keys) || [], models: (d && d.models) || [], daily: ((d && d.daily) || []).map((x) => ({ t: Date.parse(x.day + "T00:00:00Z"), v: +x.spent_usd || 0, n: +x.requests || 0 })) });
  /* The server filters (SERVER-v1 «Круг 2»): totals and rows by key, model and day; daily by key and model for the whole period; keys and models = the lists for the filters.
     R-5: the chart always has 7+ days; R-6: only the last request paints; the cache is by days|key|model|day */
  let uSeq = 0, UC = null, uAll = false;
  const isoDay = (t) => new Date(t).toISOString().slice(0, 10);
  async function getU(days, day) {
    const k = [days, uState.key, uState.model, day || ""].join("|"); if (uCache[k]) return uCache[k];
    const r = await api(`/api/usage?days=${days}&key_id=${encodeURIComponent(uState.key)}&model=${encodeURIComponent(uState.model)}&day=${day || ""}`);
    return r.ok ? (uCache[k] = shape(r.data)) : r;
  }
  async function loadUsage() {
    const seq = ++uSeq, p = uState.p, sel = uState.sel, err = $("#usageErr"), chartDays = Math.max(p, 7), mainDays = sel != null ? chartDays : p;
    const [a, c] = await Promise.all([getU(mainDays, sel != null ? isoDay(sel) : ""), mainDays === chartDays ? null : getU(chartDays, "")]);
    if (seq !== uSeq) return;
    const bad = [a, c].find((x) => x && x.ok === false);
    if (bad) {
      if (bad.status === 401) { await guard(bad); return; }   // the session modal only — no line in the table
      ["#kSpent", "#kReq", "#kTok"].forEach((id) => ($(id).textContent = fmt.DASH));
      $(".chart-card").hidden = true; $("#usageBlock").hidden = true; $(".u-scope").hidden = true; err.hidden = false; loaded.usage = 0; return;
    }
    err.hidden = true; $(".chart-card").hidden = false; $("#usageBlock").hidden = false; $(".u-scope").hidden = false;
    UD = a; UC = c || a; U = UD.rows;
    const fill = (sel, vals) => { const first = sel.options[0].outerHTML, v = sel.value; sel.innerHTML = first + vals.map(([id, l]) => `<option value="${esc(id)}">${esc(l)}</option>`).join(""); sel.value = vals.some(([id]) => id === v) ? v : ""; };
    fill($("#fKey"), UC.keys.map((k) => [String(k.id), k.name || String(k.id)]));
    fill($("#fModel"), UC.models.map((m) => [m.model, m.model]));
    renderUsage();
  }
  $("#usageRetry").addEventListener("click", (e) => { const b = e.currentTarget; busy(b, true); loaded.usage = 1; loadUsage().finally(() => busy(b, false)); });
  $("#fKey").addEventListener("change", (e) => { uState.key = e.target.value; uAll = false; loadUsage(); });
  $("#fModel").addEventListener("change", (e) => { uState.model = e.target.value; uAll = false; loadUsage(); });
  $("#uShowBtn").addEventListener("click", () => { uAll = true; renderUsage(); });
  $("#uDay").addEventListener("click", async () => { uState.sel = null; uAll = false; await loadUsage(); const b = $(".bar[tabindex='0']", $("#chart")); if (b) b.focus(); });
  $$("#fPeriod button").forEach((b) => b.addEventListener("click", () => { uState.p = +b.dataset.p; uState.sel = null; uAll = false; $$("#fPeriod button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); loadUsage(); }));
  /* one money format for the axis, the bar label and the KPI; zero is $0 (X4-M1, copy v10) */
  const axisDec = (v) => { for (let d = 2; d < 8; d++) if (Math.abs(+v.toFixed(d) - v) < 1e-9) return d; return 8; };
  const axisUsd = (v, d) => (v ? "$" + (+v).toFixed(d) : "$0");
  function renderUsage() {
    if (!UD) return;
    const t = UD.totals, days = UC.daily;
    $("#kSpent").textContent = fmt.cost(t.spent_usd); $("#kReq").textContent = fmt.int(t.requests); $("#kTok").textContent = fmt.int(t.tokens);
    /* chart: one bar per UTC day (Today → the last 7 days, today selected) */
    /* P2 M-3: free tool calls have no spend — the bars then count requests, the axis says numbers */
    const byReq = (HOLD && !LAUNCHED) || (!days.some((d) => d.v > 0) && days.some((d) => d.n > 0)), val = (d) => (byReq ? d.n : d.v);
    const n = days.length, max = Math.max(0, ...days.map(val)), top0 = max > 0 ? niceTop(max) : 0, top = byReq ? Math.ceil(top0 / 2) * 2 : top0;   // request counts stay whole on the axis
    const dec = top ? Math.max(2, axisDec(top / 2)) : 2;   // one number of decimals on all three ticks
    const ys = $$("#chartY span"); ys[0].textContent = !top ? fmt.DASH : byReq ? fmt.int(top) : axisUsd(top, dec); ys[1].textContent = !top ? fmt.DASH : byReq ? String(top / 2) : axisUsd(top / 2, dec); ys[2].textContent = byReq ? "0" : "$0";
    const chart = $("#chart");
    if (chart.children.length !== n) chart.innerHTML = days.map(() => '<button type="button" class="bar"><i></i></button>').join("");
    const bars = $$(".bar", chart), today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const selDay = uState.sel ?? (uState.p === 1 ? today.getTime() : null);
    chart.classList.toggle("has-sel", selDay != null);
    const dayBtn = $("#uDay"); dayBtn.hidden = uState.sel == null; if (uState.sel != null) dayBtn.firstElementChild.textContent = day(uState.sel);
    days.forEach((d, i) => {
      const b = bars[i], on = d.t === selDay; b.className = "bar" + (val(d) > 0 ? "" : " zero") + (on ? " sel" : ""); b.dataset.t = d.t;
      b.setAttribute("aria-pressed", String(on)); b.tabIndex = on || (selDay == null && i === n - 1) ? 0 : -1;
      b.setAttribute("aria-label", val(d) > 0 ? str("s-bar", "{day} · {cost}").replace("{day}", day(d.t)).replace("{cost}", byReq ? fmt.int(d.n) : fmt.cost(d.v)) : str("s-bar-none", "{day}").replace("{day}", day(d.t)));
      b.firstChild.style.height = top > 0 && val(d) > 0 ? Math.max(2, (val(d) / top) * 100) + "%" : "2px";
    });
    requestAnimationFrame(() => chart.classList.add("on"));
    const xi = [0, Math.floor((n - 1) / 2), n - 1];
    const cw = $(".chart-w"); cw.style.setProperty("--n", n); cw.style.setProperty("--bar-gap", n > 45 ? "1px" : "");   // F4-F3: bars and dates on the same tracks; a long period: the 6 px gap alone would eat a phone-wide chart
    $("#chartX").innerHTML = xi.map((i) => `<span style="grid-column:${i + 1}">${day(days[i].t)}</span>`).join("");
    /* table: the last 100 matching calls; 25 at first, the rest on «Show all» (R-11). Nothing at all in the period → the first-call line; nothing for these filters → «no match» */
    const none = !U.length, narrowed = !!(uState.key || uState.model || uState.sel != null);
    $(".usage-tbl").hidden = none; $("#usageEmpty").hidden = !none || narrowed; $("#usageNone").hidden = !none || !narrowed;
    const body = $("#usageBody"); body.innerHTML = "";
    const th = $$(".usage-tbl th").map((tt) => tt.textContent.trim());
    const lim = uAll ? 100 : 25, total = Math.min(U.length, 100), sb = $("#uShow"), sl = $("#uShowBtn span");
    sb.hidden = total <= lim; sl.textContent = (sl.dataset.tpl || sl.textContent).replace("{n}", fmt.int(total));
    U.slice(0, lim).forEach((x, i) => {
      const model = String(x.model || x.tool || "—"), tool = isTool(x), failed = !okCall(x);
      const kind = tool ? `<span class="ukind tool" style="--c:var(${TCU[model] || "--muted"})" title="${esc(str("s-kind-tool", "Tool call"))}"></span>` : `<span class="ukind" title="${esc(str("s-kind-model", "Model call"))}">${modelLogo(model)}</span>`;
      const name = tool ? `<span class="tn" style="--c:var(${TCU[model] || "--text"})">${esc(model)}</span>` : `<span title="${esc(model)}">${esc(model)}</span>`;
      const noTok = tool || failed;   // P2-F7: a failed model call has no tokens and no cost
      const tr = document.createElement("tr");
      if (i < 8) tr.style.animationDelay = i * 30 + "ms";
      tr.innerHTML =
        `<td class="first" data-l="${esc(th[0])}">${when(x.ts ?? x.time ?? x.created_at)}</td>` +
        `<td data-l="${esc(th[1])}" title="${esc(x.key_name || x.key || "")}">${esc(x.key_name || x.key || "—")}</td>` +
        `<td class="mono" data-l="${esc(th[2])}"><span class="mcell">${kind}${name}</span></td>` +
        `<td class="r" data-l="${esc(th[3])}">${noTok ? fmt.DASH : num(x.tokens_in)}</td>` +
        `<td class="r" data-l="${esc(th[4])}">${noTok ? fmt.DASH : num(x.tokens_out)}</td>` +
        `<td class="r" data-l="${esc(th[5])}">${tool && !cost(x) ? esc(str("s-free", "Free")) : failed && !cost(x) ? fmt.DASH : fmt.cost(x.cost_usd ?? x.cost)}</td>` +
        `<td data-l="${esc(th[6])}">${statusCell(x.status)}</td>`;
      body.appendChild(tr);
    });
  }
  /* V0-7 (P2-F2): the status in words by its class — ok → OK, 429 / rate limit → --wait, 5xx / upstream → error; the machine code in title and under the chip */
  function statusCell(st) {
    const c = String(st == null || st === "" ? "ok" : st), ok = /^(ok|200|success)$/i.test(c);
    const lim = /^(429|error 429|rate_limit.*|key_limit_reached)$/i.test(c), up = /^(5\d\d|error 5\d\d|upstream_.*)$/i.test(c);
    const word = ok ? str("s-st-ok", c) : lim ? str("s-st-limited", c) : up ? str("s-st-upstream", c) : str("s-st-error", c);
    return `<span class="ust" title="${esc(c)}"><span class="chip ${ok ? "ok" : lim ? "wait" : "err"}">${esc(word)}</span>${ok ? "" : `<span class="ucode">${esc(c)}</span>`}</span>`;
  }
  const chartEl = $("#chart");
  chartEl.addEventListener("click", async (e) => { const b = e.target.closest(".bar"); if (!b) return; const t = +b.dataset.t; uState.sel = uState.sel === t ? null : t; uAll = false; await loadUsage(); const nb = $(`.bar[data-t="${t}"]`, chartEl); if (nb) nb.focus(); });
  chartEl.addEventListener("keydown", (e) => {
    const bars = $$(".bar", chartEl), i = bars.indexOf(document.activeElement), k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (i < 0 || !k) return;
    e.preventDefault(); const nb = bars[Math.max(0, Math.min(bars.length - 1, i + k))]; bars.forEach((x) => (x.tabIndex = x === nb ? 0 : -1)); nb.focus();
  });
  const niceTop = (v) => { const p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p; return ([1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((x) => f <= x)) * p; };   // F2 М8: a finer scale, the top half is not empty
  const modelLogo = (m) => KF.modelMark(m, 14);   // F4-F4: the one map of the site

  boot();
})();
