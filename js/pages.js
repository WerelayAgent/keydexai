/* Keydex AI inner pages: models catalog, stocks table, pricing, status, connect, token. One file, routed by body[data-page]. */
(function () {
  const { $, $$, api, esc, store, fmt, busy, tabs, str } = window.KF;
  const page = document.body.dataset.page;
  const tx = (id, fb) => str(id, fb);
  const tpl = (el, key, val) => { if (!el) return; if (!el.dataset.tpl) el.dataset.tpl = el.textContent; el.textContent = el.dataset.tpl.replace(key, val); };
  const PH = "YOUR_KEYDEX_KEY";
  const MODEL = window.KF.meta("kf-model") || "openai/gpt-4.1-mini";

  /* LI.FI / Relay words → official marks */
  $$("[data-routes]").forEach((e) => {
    e.innerHTML = KF.v(esc(e.textContent).replace("LI.FI_OFF", '<img class="mark-in" src="/img/brand/lifi-white.svg" alt="LI.FI" width="33" height="12">').replace("Relay_OFF", '<img class="mark-in" src="/img/brand/relay-white.svg" alt="Relay" width="53" height="12">'));
  });
  /* tool names in text are code in their colour */
  const TC = { stock_quote: "--c-quote", stock_portfolio: "--c-port", build_trade: "--c-trade", fund_agent: "--c-fund" };
  /* walks text nodes: ticker marks inside the line stay; other identifiers go mono, neutral (P7 M-2) */
  const IDS = /\b(stock_quote|stock_portfolio|build_trade|fund_agent)\b|\b(POST \/api\/trial|GET \/v1\/key|origin_chain|stock_movers|stock_events|stock_approvals|build_revoke|chain_status|explain_tx|my_key|morpho_rates|morpho_loop|build_morpho_deposit|list_models|model_detail|ask_model|usdg_vault|check_approvals|cheapest_model|keydex:\/\/models)\b|\b(sign-in)\b/g;   // Arcom plan 1.6–1.9: the new names too
  $$("[data-cl], .prose p").forEach((e) => {
    const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT), ns = []; while (w.nextNode()) ns.push(w.currentNode);
    ns.forEach((n) => {
      const t = n.nodeValue; if (!t.match(IDS)) return; IDS.lastIndex = 0;
      const f = document.createDocumentFragment(); let i = 0, m;
      while ((m = IDS.exec(t))) { f.append(t.slice(i, m.index)); const c = document.createElement("span"); c.className = m[3] ? "nw" : "mono"; if (m[1]) c.style.color = `var(${TC[m[1]]})`; c.textContent = m[0]; f.append(c); i = m.index + m[0].length; }
      f.append(t.slice(i)); n.replaceWith(f);
    });
  });

  /* W1-4 «Featured»: flagship providers first, in this order (also the order of the provider chips); inside a provider — the server's order (newest first) */
  const FEAT = ["anthropic", "openai", "google", "x-ai", "deepseek", "qwen", "meta", "mistralai", "moonshotai", "z-ai", "minimax", "nvidia", "cohere", "perplexity", "amazon", "microsoft"];
  const own = (m) => (m.owned_by || String(m.id).split("/")[0] || "").toLowerCase();
  const provKey = KF.provKey, logoHTML = (o) => KF.modelMark(o, 18);
  const COPY = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 5.5V3.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2"/></svg>';
  /* V0-12 (P4-F1): the id fits its real column — budget = (name column − Copy 32 px) / 7.2 px per mono char; ellipsis in the middle only when it does not fit */
  const fitIds = (box) => {
    const items = $$(".mx-id > span", box).map((s) => { const nm = s.closest(".mx-nm"), li = s.closest("li"); let w = nm ? nm.clientWidth : 0;
      if (!w && li) { const cs = getComputedStyle(li); w = li.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 32 - parseFloat(cs.columnGap || 0); }   // phone: .mx-nm is display:contents
      return [s, s.parentElement.title, w]; });
    items.forEach(([s, id, w]) => { const n = Math.max(20, Math.floor((w - 32) / 7.2)), c = id.indexOf("/") + 1; s.textContent = !w || id.length <= n ? id : id.slice(0, c) + "…" + id.slice(id.length - (n - c - 1)); });   // P4-Н5: the cut stands after the provider — the version stays readable
    const ios = $$(".mx-io", box); ios.forEach((e) => e.classList.remove("noctx")); ios.filter((e) => e.offsetParent && e.scrollWidth > e.clientWidth).forEach((e) => e.classList.add("noctx"));   // P4 М1: a row whose third item does not fit gives it up, the others keep it
  };
  const row = (m) => {
    const o = own(m), p = m.pricing || {};
    const pi = fmt.price1M(p.prompt), po = fmt.price1M(p.completion);
    /* V1-33, P4-Н4: on a phone the third line is «in $0.10 · out $0.50 / 1M · 1M context»: the unit sticks to the price, the context is the real one */
    return `<li><span class="mx-m"><span class="mx-lg">${logoHTML(o)}</span><span class="mx-nm"><b title="${esc(m.name || m.id)}">${esc(m.name || m.id)}</b><span class="mx-id" title="${esc(m.id)}"><span>${esc(m.id)}</span><button type="button" class="icon-btn mx-cp" data-copy-value="${esc(m.id)}" aria-label="${esc(tx("s-copy-n", "Copy ID").replace("{name}", m.name || m.id))}">${COPY}</button></span></span></span><span class="mx-v c"><span class="sr">${esc(tx("s-col-ctx", ""))} </span>${fmt.ctx(m.context_length)}</span><span class="mx-v in"><span class="sr">${esc(tx("s-col-in", ""))} </span>${pi}</span><span class="mx-v o"><span class="sr">${esc(tx("s-col-out", ""))} </span>${po}</span><span class="mx-io" aria-hidden="true"><span class="l">${esc(tx("s-in", "in"))}</span> <b>${pi}</b> · <span class="l">${esc(tx("s-out", "out"))}</span> <b>${po}</b> <span class="l">/ ${esc(tx("s-unit", "1M"))}</span><span class="ctx"> · <span class="l">${fmt.ctx(m.context_length)} ${esc(tx("s-col-ctx", "Context").toLowerCase())}</span></span></span></li>`;
  };
  const errRow = (tag, id) => `<${tag} class="${tag === "li" ? "mx-empty" : "st-empty"}"${tag === "td" ? ' colspan="6"' : ""}><span>${esc(tx("s-err", ""))}</span> <button class="btn btn-sm btn-2" type="button" id="${id}">${esc(tx("s-retry", "Try again"))}</button></${tag}>`;

  /* ---------- /models ---------- */
  if (page === "models") {
    const list = $("#mxList"), q = $("#mxQ"), sort = $("#mxSort"), provBox = $("#mxProv"), count = $("#mxCount").firstElementChild;
    if (provBox) provBox.addEventListener("focusin", (e) => { if (e.target.matches("button")) e.target.scrollIntoView({ inline: "nearest", block: "nearest" }); });   // PP М3: a focused chip comes into view
    let all = [], view = [], shown = 0, prov = "all";
    const STEP = 50;   // X1-M5: 50 rows, the rest behind one button, so a keyboard can reach the footer
    const paint = (reset) => {
      if (reset) { list.innerHTML = ""; shown = 0; }
      const next = view.slice(shown, shown + STEP);
      list.insertAdjacentHTML("beforeend", next.map(row).join(""));
      shown += next.length; fitIds(list);
      const sw = $("#mxShow"); sw.hidden = shown >= view.length; const sl = $("span", sw); sl.textContent = (sl.dataset.tpl || sl.textContent).replace("{n}", fmt.int(view.length));
      if (!view.length) { list.innerHTML = `<li class="mx-empty"><span>${esc(tx("s-empty", "").replace("{query}", q.value.trim()))}</span><button class="btn btn-sm btn-2" type="button">${esc(tx("s-clear", ""))}</button></li>`; $(".mx-empty button", list).onclick = () => { q.value = ""; apply(); q.focus(); }; }
    };
    const apply = () => {
      const t = q.value.trim().toLowerCase();
      view = all.filter((m) => (prov === "all" || provKey(own(m)) === prov) && (!t || (m.id + " " + (m.name || "")).toLowerCase().includes(t)));
      const k = sort.value;
      const fr = (m) => { const i = FEAT.indexOf(provKey(own(m))); return i < 0 ? FEAT.length : i; };
      view.sort(k === "price" ? (a, b) => ((a.pricing || {}).prompt ?? 1e9) - ((b.pricing || {}).prompt ?? 1e9)
        : k === "ctx" ? (a, b) => (b.context_length || 0) - (a.context_length || 0)
        : k === "featured" ? (a, b) => fr(a) - fr(b) || (fr(a) === FEAT.length ? String(a.name || a.id).localeCompare(String(b.name || b.id)) : a._i - b._i)
        : (a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id)));
      /* owner-eye №6: Featured reads as a showcase — first one model per provider (no :batch), then the rest, batch and dated ids last (search and the count still see them) */
      if (k === "featured") {
        const plainId = (m) => !/:/.test(m.id) && !/-\d{4}$/.test(m.id) && !m.id.startsWith("~"), lead = [], used = new Set();
        FEAT.forEach((p) => { const m = view.find((x) => provKey(own(x)) === p && plainId(x)); if (m) { lead.push(m); used.add(m); } });
        const rest = view.filter((m) => !used.has(m)); view = [...lead, ...rest.filter(plainId), ...rest.filter((m) => !plainId(m))];
      }
      /* V1-35: the total, or «12 of 446» for a selection; the result is announced 400 ms after typing (X1-F10) */
      $("#mxCount").hidden = false;
      count.textContent = view.length === all.length ? (count.dataset.tpl || count.textContent).replace("{n}", fmt.int(all.length)) : tx("s-count-of", "{n}").replace("{n}", fmt.int(view.length)).replace("{total}", fmt.int(all.length));
      paint(true);
      list.removeAttribute("data-loading");
    };
    function load() {
      api("/v1/models").then((r) => {
        all = ((r.ok && r.data && r.data.data) || []).filter((m) => m.id); all.forEach((m, i) => (m._i = i));
        if (!all.length) { list.removeAttribute("data-loading"); list.innerHTML = errRow("li", "mxRetry"); $("#mxRetry").onclick = () => { busy($("#mxRetry"), true); load(); }; return; }   // V1-28: ≤ 160 px, no sheet
        if (!count.dataset.tpl) count.dataset.tpl = count.textContent;
        const c = {};
        all.forEach((m) => { const k = provKey(own(m)); c[k] = (c[k] || 0) + 1; });
        const top = FEAT.filter((k) => c[k]).map((k) => [k, c[k]]);
        const allBtn = $('[data-p="all"]', provBox); $$(".n", allBtn).forEach((e) => e.remove()); allBtn.insertAdjacentHTML("beforeend", `<span class="n">${fmt.int(all.length)}</span>`);
        provBox.innerHTML = allBtn.outerHTML + top.map(([k, n]) => `<button type="button" aria-pressed="false" data-p="${esc(k)}">${logoHTML(k)}<span>${esc(tx("s-pv-" + k, k))}</span><span class="n">${fmt.int(n)}</span></button>`).join("");   // V1-29: brand names, never slugs
        if (document.fonts) document.fonts.ready.then(window.KF.snapW);
        $$("button", provBox).forEach((b) => b.addEventListener("click", () => { prov = b.dataset.p; $$("button", provBox).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); apply(); }));
        apply(); KF.ftrBack();
      });
    }
    load();
    let liveT = 0;
    q.addEventListener("input", () => { apply(); clearTimeout(liveT); liveT = setTimeout(() => KF.live(tx("s-found", "").replace("{n}", fmt.int(view.length))), 400); });
    sort.addEventListener("change", apply);
    let rz = 0; addEventListener("resize", () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => fitIds(list)); }, { passive: true });
    $("#mxShowBtn").addEventListener("click", () => { const f = shown; shown = view.length; const next = view.slice(f); list.insertAdjacentHTML("beforeend", next.map(row).join("")); fitIds(list); $("#mxShow").hidden = true; const a = $$("li", list)[f]; if (a) { const b = $(".mx-cp", a); if (b) b.focus({ preventScroll: true }); } });
  }

  /* ---------- /pricing: one model per provider (V1-37, P5-F5) — the server's first plain id of each, no second version or -pro/-mini of the same line; the trial model last with a «Trial» chip ---------- */
  if (page === "pricing") {
    const PICK = ["anthropic/", "openai/", "google/", "x-ai/", "deepseek/", "qwen/", "mistralai/", "moonshotai/"];
    const plain = (m) => !/:|preview|beta|exp|free|-\d{4}$|-pro\b|-mini\b|-nano\b|-lite\b/.test(m.id);
    const box = $("#prList");
    function load() {
      api("/v1/models").then((r) => {
        const rows = ((r.ok && r.data && r.data.data) || []).filter((m) => m.id && m.pricing && m.pricing.prompt > 0);
        box.removeAttribute("data-pr");
        if (!rows.length) { box.innerHTML = errRow("li", "prRetry"); $("#prRetry").onclick = () => { busy($("#prRetry"), true); load(); }; return; }
        const pick = PICK.map((p) => rows.find((m) => m.id.startsWith(p) && plain(m))).filter(Boolean);
        const ex = rows.find((m) => m.id === MODEL);
        const tchip = (m) => row(m).replace("</b>", `<span class="chip dim mx-trial">${esc(tx("s-trial-chip", "Trial"))}</span></b>`);   // С-2: by each model's trial flag
        box.innerHTML = pick.filter((m) => m !== ex).map((m) => (m.trial ? tchip(m) : row(m))).join("") + (ex ? tchip(ex) : "");
        fitIds(box); KF.ftrBack();
      });
    }
    load();
  }

  /* ---------- /stocks: live table, refresh 30 s, rows built once (X2-F8), sortable by keyboard ---------- */
  if (page === "stocks") {
    const body = $("#stBody"), q = $("#stQ"), upd = $("#stUpd"), cnt = $("#stCount"), sel = $("#stSel"), more = $("#stMore");
    let rows = [], key = "depth_usd", dir = -1, filt = "all", asOf = null, all = false, built = false, lastLoad = 0;
    const SHOW = 50;
    const seen = new Set();
    const lazyIO = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return; const im = e.target, src = im.dataset.src; lazyIO.unobserve(im); if (!src) return; im.srcset = im.dataset.srcset; im.src = src; im.removeAttribute("data-src"); seen.add(src.split("/").pop().split("@")[0]); }), { rootMargin: "300px" }) : { observe: (im) => { im.srcset = im.dataset.srcset; im.src = im.dataset.src; } };
    const thin = tx("s-thin", "Thin pool"), thinT = tx("s-thin-t", "");
    const pth = $('th[data-k="price_usd"]'); if (pth) pth.title = tx("s-pnote", "");
    const val = (r, k) => (fmt.known(r[k]) ? +r[k] : null);
    const TR = new Map();   // ticker → <tr>, built once
    /* X2-Н-3: colspan = the columns really shown, or empty grid columns cut the header line short */
    const cols = () => $$("thead th", $("#stTable")).filter((e) => e.getClientRects().length).length;
    addEventListener("resize", () => $$("td[colspan]", body).forEach((e) => (e.colSpan = cols())), { passive: true });
    const mk = (r) => {
      const T = esc(r.ticker), etf = String(r.type || "stock").toLowerCase() === "etf", nm = esc(r.name || "");
      const tr = document.createElement("tr"); tr.dataset.t = r.ticker;
      tr.innerHTML = `<td><span class="st-t">${KF.stockMark(r.ticker, "md", true)}<i class="thin-dot" hidden></i><span><b>${T}${etf ? `<span class="ty">${esc(tx("s-etf", "ETF"))}</span>` : ""}</b><span class="nm" title="${nm}">${nm.replace(/(\S+-\S+)/g, '<span class="nw">$1</span>')}</span></span></span></td>` +
        `<td class="r px"></td><td class="r ch"></td><td class="r hide-s dpc"><span class="dp"><span class="ty thin" title="${esc(thinT)}" hidden>${esc(thin)}</span><span class="dv"></span></span></td>` +
        `<td class="r hide-m ad">${esc(String(r.token).slice(0, 6) + "…" + String(r.token).slice(-4))}<button type="button" class="icon-btn" data-copy-value="${esc(r.token)}" aria-label="${esc(tx("s-copy-t", "Copy").replace("{ticker}", r.ticker))}">${COPY}</button></td>`;
      $$("img[data-src]", tr).forEach((im) => lazyIO.observe(im));
      return tr;
    };
    /* values only: a refresh writes text into the cells it already has */
    const paintRow = (tr, r) => {
      const known = fmt.known(r.price_usd), px = $(".px", tr), ch = $(".ch", tr), d = val(r, "depth_usd");
      const note = r.price_note === "no_liquidity" ? ["s-noliq", "s-noliq-t"] : r.price_note === "unavailable" ? ["s-na", "s-na-t"] : null;
      const txt = known ? fmt.usd(r.price_usd) : note ? tx(note[0], fmt.DASH) : fmt.DASH;
      if (px.textContent !== txt) { if (px.textContent && known) { px.classList.remove("flash"); px.getAnimations().forEach((x) => x.cancel()); px.classList.add("flash"); } px.textContent = txt; }
      px.classList.toggle("unk", !known); px.title = !known && note ? tx(note[1], "") : "";
      ch.textContent = fmt.pct(r.change_24h_pct); ch.className = "r ch " + fmt.sign(r.change_24h_pct);
      const isThin = d != null && d < 50000;
      $(".dv", tr).textContent = fmt.usdM(d); $(".dpc", tr).classList.toggle("unk", d == null);
      $(".thin", tr).hidden = !isThin; const dot = $(".thin-dot", tr); dot.hidden = !isThin; dot.title = isThin ? thin + (thinT ? " · " + thinT : "") : "";
    };
    let liveT = 0;
    const render = (announce) => {
      const t = q.value.trim().toLowerCase();
      const v = rows.filter((r) => (filt === "all" || String(r.type || "stock").toLowerCase() === filt) && (!t || (r.ticker + " " + r.name).toLowerCase().includes(t)))
        .sort((a, b) => {
          if (key === "ticker") return String(a.ticker).localeCompare(String(b.ticker)) * dir;
          const x = val(a, key), y = val(b, key);
          if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1;   // unknown always last
          return (x - y) * dir;
        });
      const keep = new Set(v.map((r) => r.ticker));
      if (!built) { body.innerHTML = ""; rows.forEach((r) => TR.set(r.ticker, mk(r))); built = true; }
      const tn = $("#stThin"); if (tn) tn.hidden = !v.some((r, i) => { const d = val(r, "depth_usd"); return (all || t || i < SHOW) && d != null && d < 50000; });   // P4 М2: only when a dot is on the screen
      v.forEach((r, i) => { const tr = TR.get(r.ticker); tr.hidden = !all && !t && i >= SHOW; body.appendChild(tr); });
      TR.forEach((tr, k) => { if (!keep.has(k)) tr.hidden = true; });
      let em = $(".st-empty-r", body);
      if (!v.length) { if (!em) { body.insertAdjacentHTML("beforeend", `<tr class="st-empty-r"><td colspan="${cols()}" class="st-empty"><span></span> <button class="btn btn-sm btn-2" type="button">${esc(tx("s-clear", ""))}</button></td></tr>`); em = $(".st-empty-r", body); $("button", em).onclick = () => { q.value = ""; render(true); q.focus(); }; } $("span", em).textContent = tx("s-empty", "").replace("{query}", q.value.trim()); em.hidden = false; }
      else if (em) em.hidden = true;
      /* the kicker keeps the total; a selection reads «12 of 64» in the bar (P4-F14) */
      const total = rows.length, filtered = v.length !== total;
      sel.hidden = !filtered; tpl(sel.firstElementChild, "{n}", fmt.int(v.length)); sel.firstElementChild.textContent = sel.firstElementChild.dataset.tpl.replace("{n}", fmt.int(v.length)).replace("{total}", fmt.int(total));
      more.hidden = all || !!t || v.length <= SHOW; tpl(more.querySelector("[data-tpl]"), "{n}", fmt.int(v.length));
      if (announce) { clearTimeout(liveT); liveT = setTimeout(() => KF.live(tx("s-found", "").replace("{n}", fmt.int(v.length))), 400); }
    };
    async function load() {
      lastLoad = Date.now();
      const r = await api("/v1/stocks");
      const d = r.ok && r.data && (r.data.data || r.data.rows || r.data);
      const wrap = body.closest(".st-wrap");
      if (Array.isArray(d) && d.length) {
        const first = !rows.length; rows = d.filter((x) => x.ticker);
        if (first) { render(); } else { const add = rows.filter((x) => !TR.has(x.ticker)); if (add.length) { add.forEach((x) => TR.set(x.ticker, mk(x))); render(); } }
        rows.forEach((x) => paintRow(TR.get(x.ticker), x));
        wrap.removeAttribute("data-loading"); KF.ftrBack();
        asOf = d.reduce((m, x) => Math.max(m, +x.as_of || 0), +(r.data && r.data.as_of) || 0);
        upd.hidden = false; tpl(upd.firstElementChild, "{time}", fmt.utc(asOf ? new Date(asOf * 1000) : new Date()) + " UTC");
        cnt.hidden = false; tpl(cnt.firstElementChild, "{n}", rows.length);
      } else if (!rows.length) {
        wrap.removeAttribute("data-loading");   // V1-28: an error is one short row, never an empty sheet
        body.innerHTML = `<tr>${errRow("td", "stRetry").replace('colspan="6"', `colspan="${cols()}"`)}</tr>`;
        $("#stRetry").onclick = () => { busy($("#stRetry"), true); load(); };
      }
    }
    load();
    setInterval(() => { if (!document.hidden) load(); }, 30000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden && Date.now() - lastLoad > 30000) load(); });   // X2-F9
    q.addEventListener("input", () => render(true));
    $("#stAll").addEventListener("click", () => { all = true; render(); });
    $$("#stF button").forEach((b) => b.addEventListener("click", () => { filt = b.dataset.f; $$("#stF button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); render(true); }));
    $$("th[data-k]").forEach((th) => $(".th-sort", th).addEventListener("click", () => {
      const k = th.dataset.k, text = k === "ticker";
      dir = key === k ? -dir : text ? 1 : -1; key = k;   // P4-F13: a text column starts A→Z, numbers start high → low
      const asc = text ? dir > 0 : dir > 0;
      $$("th[data-k]").forEach((x) => x.removeAttribute("aria-sort")); th.setAttribute("aria-sort", asc ? "ascending" : "descending"); render();
      const said = tx(asc ? "s-sort-asc" : "s-sort-desc", "").replace("{col}", th.textContent.trim());
      KF.live(said); sortLine(k === "depth_usd" && !asc ? null : said);
    }));
    /* P4-Н6: the phone's line says the real order; a sort of your own has a way back to pool depth (that column is hidden there) */
    const stS = $("#stSorted"), stS0 = stS.firstElementChild.textContent;
    const sortLine = (t) => { stS.firstElementChild.textContent = t || stS0; stS.setAttribute("aria-disabled", String(!t)); };
    stS.addEventListener("click", () => { if (stS.getAttribute("aria-disabled") === "true") return; key = "depth_usd"; dir = -1; $$("th[data-k]").forEach((x) => x.removeAttribute("aria-sort")); $('th[data-k="depth_usd"]').setAttribute("aria-sort", "descending"); render(); sortLine(null); });
  }

  /* ---------- /status: server states, time of the data, refresh 30 s ---------- */
  if (page === "status") {
    /* one rule for colour: [data-state] = ok | degraded | down (W0-5); api and mcp are checked in-process → no ms ("<1 ms" reads fake) */
    const top = $("#ssTop"), kick = $("#ssKick"), at = $("#ssAt").firstElementChild, off = $("#ssOff");
    const ST = { ok: tx("s-ok", "Operational"), degraded: tx("s-deg", "Degraded"), down: tx("s-down", "Down"), checking: tx("s-chk", "Checking…"), unknown: tx("s-unk", "Unknown") };
    const NO_MS = { api: 1, mcp: 1 };
    async function load() {
      const [r, c] = await Promise.all([api("/api/status"), api("/api/chain")]);
      const d = r.ok && r.data, checks = (d && d.checks) || {};
      $$(".ss-r").forEach((el) => {
        const x = checks[el.dataset.k];
        const st = !d || !x ? "unknown" : (x.state || (x.ok ? "ok" : "down"));
        el.dataset.state = st;
        $("[data-st]", el).textContent = ST[st] || ST.unknown;
        /* P7 R-F2: the server says when a measurement is stale (older than its own window + 60 s); api / mcp are in-process — the cell stays empty */
        const msEl = $(".ss-ms", el), fresh = x && fmt.known(x.ms) && !x.stale;
        msEl.textContent = NO_MS[el.dataset.k] ? fmt.DASH : fresh ? fmt.ms(x.ms) : fmt.DASH;   // PD М20: no hole in the column
        msEl.title = x && x.at && !NO_MS[el.dataset.k] ? tx("s-measured", "").replace("{time}", fmt.utc(new Date(x.at * 1000), true)) : "";
        /* V0-14 (P7-F1): the error line and the description are two elements; a recovered row shows its description again */
        const e = $(".ss-err", el), sub = $(".ss-sub", el), bad = !!(x && x.error && st !== "ok");
        if (e) { e.textContent = bad ? x.error : ""; e.hidden = !bad; } if (sub) sub.hidden = bad;
      });
      /* kicker «Block …»: fresh block (< 5 s) → ok, otherwise degraded */
      const cd = c.ok && c.data;
      if (cd && cd.block) {
        $("#ssBlock").textContent = str("s-block", "Latest block {n}").replace("{n}", fmt.int(cd.block));   // М-22: the string from copy, not a literal
        const age = checks.chain && fmt.known(checks.chain.block_age_s) ? +checks.chain.block_age_s : (cd.at && cd.block_ts ? cd.at - cd.block_ts : null);
        kick.dataset.state = checks.chain && checks.chain.state ? checks.chain.state : age != null && age <= 60 ? "ok" : "degraded";   // V1-48 (P7-F4): the server's own verdict on the chain
        kick.classList.add("on");
      }
      /* summary: the server's state; no answer (visitor offline) → «couldn't check» + Try again, never «down» (B-М5) */
      const worst = window.KF.stateOf(r) || "unknown", routes = worst !== "ok" && worst !== "unknown" && window.KF.reasonOf(r) === "routes_busy";
      top.dataset.state = worst;
      $$("[data-ss]").forEach((e) => (e.hidden = e.dataset.ss !== (worst === "unknown" ? "offline" : routes ? "routes" : worst)));
      off.hidden = worst !== "unknown";
      at.parentElement.hidden = worst === "unknown";
      if (d && d.at) tpl(at, "{time}", fmt.utc(new Date(d.at * 1000), true));
      if (window.KF.paintFtr) window.KF.paintFtr(r);   // V0-15 (P7-F2): the footer says what the summary says, after every load and Try again
      if (window.KF.paintPv) window.KF.paintPv(r);     // P7 R-F4: and so does the header preview
    }
    /* W1-10: 90 daily segments under each row — rendered only with ≥ 7 days of history; until then «Last check … UTC» alone */
    api("/api/status/history").then((h) => {
      const d = h.ok && h.data; if (!d || !(d.days >= 7) || !d.checks) { $$("[data-hist-ph]").forEach((e) => e.remove()); $("#ssLegend").hidden = true; return; }
      const today = new Date(); today.setUTCHours(0, 0, 0, 0);
      const days = Array.from({ length: 90 }, (_, i) => new Date(today.getTime() - (89 - i) * 864e5).toISOString().slice(0, 10));
      const tplDay = tx("s-h-day", "{day} · {state}");
      $$(".ss-r").forEach((el) => {
        const m = new Map(((d.checks[el.dataset.k]) || []).map((x) => [x.day, x.state]));
        const bar = document.createElement("div"); bar.className = "ss-hist";
        /* P7 R-F3: one image with a one-line summary, day by day on hover (title); no tab stops; P7-F8: a phone shows the last 30 days */
        const cnt = (s) => days.filter((day) => m.get(day) === s).length, known = days.filter((day) => m.has(day)).length;
        const sum = tx("s-h-sum", "").replace("{days}", known).replace("{degraded}", cnt("degraded")).replace("{down}", cnt("down"));
        bar.innerHTML = `<div class="ss-segs" role="img" aria-label="${esc($(".ss-n", el).textContent.trim() + ". " + sum)}">${days.map((day) => { const st = m.get(day) || "none", t = esc(tplDay.replace("{day}", fmt.date(day + "T00:00:00Z")).replace("{state}", st === "none" ? tx("s-h-none", "") || "—" : ST[st] || st)); return `<i data-state="${st}" title="${t}"></i>`; }).join("")}</div><div class="ss-hx"><span class="h90">${esc(tx("s-h-start", ""))}</span><span class="h30">${esc(tx("s-h-start30", ""))}</span><span>${esc(tx("s-h-end", ""))}</span></div>`;
        const ph = el.nextElementSibling; if (ph && ph.hasAttribute("data-hist-ph")) ph.replaceWith(bar); else el.after(bar);   /* Q1 CLS: the build reserved its place */
      });
      $("#ssLegend").hidden = false;
    });
    $("#ssRetry").addEventListener("click", async (ev) => { const b = ev.currentTarget; busy(b, true); await load(); busy(b, false); });
    load(); setInterval(() => { if (!document.hidden) load(); }, 30000);
    let last = Date.now(); document.addEventListener("visibilitychange", () => { if (!document.hidden && Date.now() - last > 30000) { last = Date.now(); load(); } });   // X2-Н-9
  }

  /* ---------- /security: Verify block only when /health gives the addresses (W1-11, И-10) ---------- */
  if (page === "security") {
    api("/health").then((r) => {
      const h = (r.ok && r.data) || {}, ok = (a) => typeof a === "string" && (/^0x[0-9a-fA-F]{40}$/.test(a) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a));
      [["treasury", "#sxTreasury"], ["token", "#sxToken"]].forEach(([k, id]) => {
        if (!ok(h[k])) return;
        const li = $(`[data-addr="${k}"]`); li.hidden = false; $(id).textContent = h[k];
        $(".sx-ex", li).href = (k === "token" ? "https://solscan.io/token/" : "https://solscan.io/address/") + h[k];
        $("#sxVerify").hidden = false;
      });
    });
  }


  /* ---------- legal: «On this page» from the h2 ids, the section in view is --text (V1-51) ---------- */
  const ltoc = $(".lg-toc");
  if (ltoc) {
    const hs = $$(".prose h2[id]");
    ltoc.innerHTML = hs.map((h) => `<a href="#${h.id}">${h.innerHTML.trim()}</a>`).join("");   // the $KEYDEX mark comes along (our own markup)
    const ls = $$("a", ltoc);
    /* P8-Н1: a click or a deep link names its section until the visitor scrolls on; at the bottom of the page the last section is the current one */
    let fixed = location.hash ? hs.findIndex((h) => "#" + h.id === location.hash) : -1;
    const pick = () => { let c = 0; hs.forEach((h, i) => { if (h.getBoundingClientRect().top <= 64 + 24 + 1) c = i; }); if (scrollY + innerHeight >= document.documentElement.scrollHeight - 2) c = hs.length - 1; if (fixed >= 0) c = fixed; ls.forEach((l, i) => { l.classList.toggle("on", i === c); if (i === c) l.setAttribute("aria-current", "true"); else l.removeAttribute("aria-current"); }); };
    ls.forEach((l, i) => l.addEventListener("click", () => { fixed = i; pick(); }));
    ["wheel", "touchmove", "keydown"].forEach((ev) => addEventListener(ev, (e) => { if (ev === "keydown" && !["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(e.key)) return; fixed = -1; }, { passive: true }));
    let q = 0; addEventListener("scroll", () => { if (!q) q = requestAnimationFrame(() => { q = 0; pick(); }); }, { passive: true }); pick();
  }

  /* ---------- /token: CA when set ---------- */
  if (page === "token") {
    const ca = window.KF.meta("kf-ca");
    if (false) { const a = $("#tkCa"); a.textContent = ca; a.classList.add("set"); $("#tkCaNote").hidden = false; }
  }

  /* ---------- /connect: tabs + configs with the trial key ---------- */
  if (page === "connect") {
    const ORIGIN = window.KF.site();
    let trial = null; try { trial = JSON.parse(store.get("kf.trial") || "null"); } catch (e) {}
    if (trial && trial.expires_at && trial.expires_at * 1000 < Date.now()) trial = null;
    const k = () => (trial && trial.key) || null;
    const ks = (x) => x ? `<span class="key">${esc(x)}</span>` : `<span class="key ph">${PH}</span>`;
    const s = (x) => `<span class="s">${x}</span>`;
    const TPL = {
      url: (x) => `${esc(ORIGIN)}/mcp?key=${ks(x)}`,
      cli: (x) => `claude mcp add -s user \\\n  --transport http Keydex AI \\\n  ${esc(ORIGIN)}/mcp \\\n  --header ${s(`"Authorization: Bearer ${ks(x)}"`)}`,
      json: (x) => `{\n  ${s('"type"')}: ${s('"mcp"')},\n  ${s('"server_label"')}: ${s('"Keydex AI"')},\n  ${s('"server_url"')}: ${s(`"${esc(ORIGIN)}/mcp"`)},\n  ${s('"headers"')}: {\n    ${s('"Authorization"')}: ${s(`"Bearer ${ks(x)}"`)}\n  },\n  ${s('"require_approval"')}: ${s('"never"')}\n}`,
      cursor: (x) => `{\n  ${s('"mcpServers"')}: {\n    ${s('"Keydex AI"')}: {\n      ${s('"url"')}: ${s(`"${esc(ORIGIN)}/mcp"`)},\n      ${s('"headers"')}: {\n        ${s('"Authorization"')}: ${s(`"Bearer ${ks(x)}"`)}\n      }\n    }\n  }\n}`,
      vscode: (x) => `{\n  ${s('"servers"')}: {\n    ${s('"Keydex AI"')}: {\n      ${s('"type"')}: ${s('"http"')},\n      ${s('"url"')}: ${s(`"${esc(ORIGIN)}/mcp"`)},\n      ${s('"headers"')}: {\n        ${s('"Authorization"')}: ${s(`"Bearer ${ks(x)}"`)}\n      }\n    }\n  }\n}`,
      chat: (x) => `curl ${esc(ORIGIN)}/v1/chat/completions \\\n  -H ${s(`"Authorization: Bearer ${ks(x)}"`)} \\\n  -H ${s('"Content-Type: application/json"')} \\\n  -d ${s(`'{\n    "model": "${esc(MODEL)}",\n    "messages": [\n      {\n        "role": "user",\n        "content": "In one sentence, what is a stock token?"\n      }\n    ]\n  }'`)}`,
      rest: (x) => "curl " + s(`"${esc(ORIGIN)}/v1/tools/stock_quote?ticker=TSLA"`) + ` \\\n  -H ${s(`"Authorization: Bearer ${ks(x)}"`)}`,
      /* Arcom-plan D4 (behind build flags): Codex config.toml, Gemini CLI command — formats from the official docs of 07.11, not run in a live client */
      codex: (x) => `[mcp_servers.keydex]\nurl = ${s(`"${esc(ORIGIN)}/mcp"`)}\nhttp_headers = { ${s('"Authorization"')} = ${s(`"Bearer ${ks(x)}"`)} }`,
      gemini: (x) => `gemini mcp add -s user --transport http \\\n  -H ${s(`"Authorization: Bearer ${ks(x)}"`)} \\\n  Keydex AI ${esc(ORIGIN)}/mcp`,
      clinokey: () => `claude mcp add -s user \\\n  --transport http Keydex AI ${esc(ORIGIN)}/mcp`,
    };
    const exp = $("[data-keyexp]");
    const fill = () => {
      $$("pre[data-tpl]").forEach((p) => (p.innerHTML = TPL[p.dataset.tpl](k())));
      $("[data-need]").hidden = !!k(); $("[data-have]").hidden = !k(); $("[data-need]").classList.remove("gone");
      const kv = $("[data-keyval]"); if (kv) { kv.textContent = k() ? fmt.mid(k(), 28) : ""; kv.dataset.value = k() || ""; }   // V1-40: shown in the middle-cut form, copied whole
      if (k() && exp && trial.expires_at) tpl(exp, "{time}", fmt.utcd(new Date(trial.expires_at * 1000)));
    };
    fill();
    /* D4: ready-made tasks — a chip picks the line, the line copies; the box keeps the height of the longest line, so a pick never moves the page */
    const tk = $("#cnTasks");
    if (tk) {
      const out = $(".cx-prompt > span", tk), chips = $$(".cn-chips button", tk), line = (c) => c.querySelector("[hidden]").textContent;
      const fit = () => { const box = out.parentElement, was = out.textContent; box.style.minHeight = ""; let h = 0; chips.forEach((c) => { out.textContent = line(c); h = Math.max(h, box.getBoundingClientRect().height); }); out.textContent = was; box.style.minHeight = Math.ceil(h) + "px"; };
      chips.forEach((c) => c.addEventListener("click", () => { chips.forEach((o) => o.setAttribute("aria-pressed", String(o === c))); out.textContent = line(c); }));
      fit(); if (document.fonts) document.fonts.ready.then(fit);
      let rzt = 0; addEventListener("resize", () => { clearTimeout(rzt); rzt = setTimeout(fit, 120); }, { passive: true });
    }
    tabs($(".cn-tabs"), (t) => { $$(".cn-p").forEach((p) => (p.hidden = p.dataset.panel !== t.dataset.tab)); KF.reserveKey(); }, $$(".cn-p"));
    KF.reserveKey(); if (document.fonts) document.fonts.ready.then(() => KF.reserveKey());   // X3-Н1: the snippets keep the real key's height; the key lands, the footer stays
    let rzk = 0; addEventListener("resize", () => { clearTimeout(rzk); rzk = setTimeout(() => KF.reserveKey(), 120); }, { passive: true });
    $("[data-trial]").addEventListener("click", async (e) => {
      const b = e.currentTarget, err = $("[data-err]"); window.KF.cutting(b, true); err.hidden = true;
      const r = await api("/api/trial", { method: "POST", body: {} });
      window.KF.cutting(b, false);
      const d = r.ok && r.data && (r.data.data || r.data);
      if (d && d.key) {
        const kv0 = $("[data-keyval]"); if (kv0) kv0.dataset.value = d.key;
        trial = d; store.set("kf.trial", JSON.stringify({ key: d.key, expires_at: d.expires_at, allowance: d.allowance, models_count: d.models_count, example_model: d.example_model }));
        if (exp && trial.expires_at) tpl(exp, "{time}", fmt.utcd(new Date(trial.expires_at * 1000)));
        window.KF.birth($("#cnKey"), d.key, fill);   // WOW-03: decode in the key block, then land in every placeholder of the steps (hidden tabs too)
      }
      else {
        if (r.status === 429) { b.hidden = true; const a = $(".cn .cx-signin"); if (a) a.hidden = true; const sb = $(".cx-signin-btn"); if (sb) { sb.hidden = false; sb.focus(); } $("#cnKey .cx-need-txt .modal-text").textContent = KF.trialLimit(r, tx("s-trial-limit", r.error.message)); KF.live(KF.trialLimit(r, tx("s-trial-limit", r.error.message))); return; }   // V1-45, P6-R2-F4: one button, the hint gives its place to the line — the card keeps its height
        err.textContent = (r.error && r.error.message) || str("s-error", "The request didn’t go through.");
        err.hidden = false;
      }
    });
  }
  /* ---------- /tools (Arcom-plan D2, П-6): live descriptions from tools/list, Try = one REST call on click (never on load), no key ---------- */
  if (page === "tools") {
    const lim = $("#tlLim [data-slot]");
    tpl(lim, "{n}", lim.dataset.n);
    api("/v1/tools/my_key").then((r) => { const p = r.ok && r.data && r.data.data && r.data.data.preview; if (p && p.per_hour) tpl(lim, "{n}", fmt.int(p.per_hour)); });   // free: my_key is not counted
    const CODE_RE = /`([^`]+)`|\b(stock_quote|stock_portfolio|stock_movers|stock_events|stock_approvals|build_trade|build_revoke|fund_agent|my_key|chain_status|explain_tx|valid_until|morpho_\w+|build_morpho_deposit|list_models|model_detail|ask_model)\b/g;   // = TOOL_CODE in build.py
    const TICK = new Set((($("#tlTick") || {}).dataset || {}).t ? $("#tlTick").dataset.t.split(",") : []);
    const tkMark = (t) => {   // = tk_mark in build.py: the page's own markup, so a live refresh changes nothing on screen
      const m = t === "SOL" || t === "SOL" ? '<img src="/img/tokens/sol.svg" alt="" width="20" height="20">' : t === "USDG" ? '<img src="/img/tokens/usdg.png" alt="" width="20" height="20">'
        : KF.TXT_MARK.has(t) ? `<span class="tk txt mono1" aria-hidden="true">${t[0]}</span>` : `<span class="tk"><img src="/img/stocks/${t}@64.webp" alt="" width="20" height="20"></span>`;
      return `<span class="tkr">${m}${t}</span>`;
    };
    const desc = (txt) => esc(txt).split(/(`[^`]+`)/).map((x) => x.startsWith("`") ? `<code class="sf">${x.slice(1, -1)}</code>`
      : x.replace(/\b([A-Z]{1,5})\b/g, (m, t) => (TICK.has(t) ? tkMark(t) : m)).replace(CODE_RE, (m, a, b) => `<code class="sf">${a || b}</code>`)).join("");
    const field = (n, p, req) => {   // a card the build had no schema for (a tool switched on later)
      const ty = [].concat(p.type || (p.items ? "array" : "string")).find((x) => x !== "null") || "string";
      const PHX = { tickers: "NVDA, TSLA", wallet: "0x…", token: "TSLA", hash: "0x…", spender: "0x…" }, EXV = { ticker: "NVDA", top: "5", by: "change" };   // = TOOL_PH, TOOL_EX in build.py
      if (p.default == null && EXV[n]) p = { ...p, default: EXV[n] };
      const ctl = p.enum ? `<span class="sel"><select name="${esc(n)}" data-type="${esc(ty)}">${p.enum.map((o) => `<option${o === p.default ? " selected" : ""}>${esc(o)}</option>`).join("")}</select></span>`
        : `<input class="input" name="${esc(n)}" data-type="${esc(ty)}" value="${esc(p.default ?? "")}" placeholder="${esc(PHX[n] || "")}" title="${esc(p.description || "")}" autocomplete="off" spellcheck="false"${req ? " required" : ""}>`;
      return `<label class="tl-a"><span class="mono">${esc(n)}</span>${ctl}</label>`;
    };
    fetch("/mcp", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }) })
      .then((r) => r.json()).then((j) => (j.result && j.result.tools || []).forEach((t) => {
        const c = document.getElementById(t.name); if (!c) return;
        const d = $("[data-desc]", c), dh = t.description && desc(t.description);
        if (d && dh && d.innerHTML !== dh) d.innerHTML = dh;
        const f = $(".tl-f", c), props = (t.inputSchema && t.inputSchema.properties) || {};
        if (f && !$(".tl-a", f) && Object.keys(props).length) f.insertAdjacentHTML("afterbegin", KF.v(Object.entries(props).map(([n, p]) => field(n, p, (t.inputSchema.required || []).includes(n))).join("")));
      })).catch(() => {});
    $$(".tl-f").forEach((f) => f.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!f.reportValidity()) return;   // an empty required field never costs one of the visitor's free calls
      const c = f.closest(".tl-c"), out = $(".tl-out", c), pre = $(".tl-pre", c), err = $(".cx-err", c), cap = $(".tl-cap", c), btn = $(".tl-go", f), args = {};
      $$("[name]", f).forEach((i) => {
        const v = i.value.trim(); if (!v) return;
        const ty = i.dataset.type;
        args[i.name] = ty === "array" ? v.split(",").map((x) => x.trim()).filter(Boolean) : ty === "number" || ty === "integer" ? Number(v) : ty === "boolean" ? v === "true" : v;
      });
      window.KF.cutting(btn, true);
      const r = await api("/v1/tools/" + f.dataset.tool, { method: "POST", body: args });
      window.KF.cutting(btn, false);
      out.hidden = false;
      const ok = r.ok && r.data;
      cap.hidden = pre.hidden = !ok; err.hidden = !!ok;
      if (ok) pre.textContent = JSON.stringify(r.data.data ?? r.data, null, 2);
      else err.textContent = (r.error && r.error.message) || tx("s-error", "");
    }));
  }
  /* 404: the outline is drawn, then it keeps 1 css px under any transform (V1-9) */
  const nfk = $(".nf-km"); if (nfk) setTimeout(() => nfk.classList.add("settled"), window.KF.reduced ? 0 : 1700);
})();
