/* /docs — tabs in code headers, copy of the visible snippet, trial key in every snippet, live model table, nav highlight */
(function () {
  const { $, $$, api, esc, store, fmt, tabs, busy } = window.KF;
  /* «Trades route through LI.FI.» — the official mark replaces the word */
  $$("[data-route]").forEach((p) => {
    const t = p.textContent, i = t.indexOf("LI.FI"); if (i < 0) return;
    p.innerHTML = esc(t.slice(0, i)) + `<span class="mk">${KF.v('<img src="/img/brand/lifi-white.svg" alt="LI.FI" width="38" height="14">')}${esc(t.slice(i + 5))}</span>`;   // P3-F14: the full stop sticks to the mark
  });
  /* text identifiers: tool names mono in their colour (P1-10), everything else that is code — paths with their method, snake_case fields, headers — mono neutral (P3-N6).
     Walks text nodes, so ticker marks and links inside a paragraph stay */
  const TC = { stock_quote: "--c-quote", stock_portfolio: "--c-port", build_trade: "--c-trade", fund_agent: "--c-fund" };
  const CODE = /\b(?:GET|POST) \/(?:[\w/?=-]|\.(?=\w))*|\/v1\/(?:[\w/?={}-]|\.(?=\w))*|\/api\/(?:[\w/?=-]|\.(?=\w))*|data: \[DONE\]|Retry-After|\b[a-z]+(?:_[a-z0-9]+)+\b|\bstream\b(?= to true)|\b(?:scope|base|8453)\b(?=[ ,.:])/g;
  const inCode = (n) => {
    const box = n.parentElement.closest("p,td,li"); if (!box) return;
    const t = n.nodeValue; if (!CODE.test(t)) return; CODE.lastIndex = 0;
    const f = document.createDocumentFragment(); let i = 0, m;
    while ((m = CODE.exec(t))) {
      f.append(t.slice(i, m.index));
      const c = document.createElement(TC[m[0]] ? "span" : "code"); c.className = TC[m[0]] ? "tn" : "ic-code"; c.textContent = m[0]; if (TC[m[0]]) c.style.setProperty("--c", `var(${TC[m[0]]})`);
      f.append(c); i = m.index + m[0].length;
    }
    f.append(t.slice(i)); n.replaceWith(f);
  };
  $$(".dt > p:not(.ep):not(.route):not(.callout), .dt .prm-d, .tbl.errs td:not(.mono), .dt > p.callout > span").forEach((e) => {
    const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT), ns = []; while (w.nextNode()) if (!w.currentNode.parentElement.closest("a,code,.tn")) ns.push(w.currentNode);
    ns.forEach(inCode);
  });
  /* trial key from this tab replaces YOUR_KEYDEX_KEY in all snippets (P0-10) */
  let trial = null; try { trial = JSON.parse(store.get("kf.trial") || "null"); } catch (e) {}
  if (trial && trial.key && !(trial.expires_at && trial.expires_at * 1000 < Date.now())) $$(".code .key.ph").forEach((k) => { k.textContent = trial.key; k.classList.remove("ph"); });

  /* V0-11 (P3-F4): step 1 of the quickstart — a trial key right here (WOW-03: the Keyhole turns in the button, the key decodes, then lands in every example) */
  const dq = $("#dqKey");
  if (dq) {
    const exp = $("[data-keyexp]", dq), err = $("[data-err]", dq), have = $("[data-have]", dq), need = $("[data-need]", dq);
    const setExp = (t) => { if (exp && t && t.expires_at) { if (!exp.dataset.tpl) exp.dataset.tpl = exp.textContent; exp.textContent = exp.dataset.tpl.replace("{time}", fmt.utcd(new Date(t.expires_at * 1000))); } };
    const live = trial && trial.key && !(trial.expires_at && trial.expires_at * 1000 < Date.now());
    if (live) { need.hidden = true; have.hidden = false; const v = $("[data-keyval]", dq); v.textContent = trial.key; v.dataset.value = trial.key; setExp(trial); }
    $("[data-trial]", dq).addEventListener("click", async (e) => {
      const b = e.currentTarget; err.hidden = true; KF.cutting(b, true);
      const r = await api("/api/trial", { method: "POST", body: {} });
      KF.cutting(b, false);
      if (r.ok && r.data && r.data.key) {
        const d = r.data; trial = { key: d.key, expires_at: d.expires_at, allowance: d.allowance, models_count: d.models_count, example_model: d.example_model };
        store.set("kf.trial", JSON.stringify(trial)); setExp(trial); $("[data-keyval]", dq).dataset.value = d.key;
        KF.birth(dq, d.key);
        const st = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--stagger")) || 0;
        $$(".code .key").forEach((k, i) => setTimeout(() => { k.classList.remove("ph"); k.classList.add("land"); KF.decode(k, d.key, { from: "YOUR_KEYDEX_KEY" }); }, st * Math.min(i + 1, 8)));
        return;
      }
      if (r.status === 429) { b.hidden = true; const a = $(".cx-signin", dq); if (a) { a.className = "btn btn-sm btn-1"; a.textContent = KF.str("s-signin-cta", a.textContent); KF.watchCta(a); a.focus(); } $(".cx-need-txt .modal-text", dq).textContent = KF.trialLimit(r); KF.live(KF.trialLimit(r)); return; }   // X4-M4: one line, one way on
      err.textContent = (r.error && r.error.message) || KF.str("s-error", ""); err.hidden = false;
    });
  }

  $$(".tabs[data-for]").forEach((list) => {
    const group = list.closest(".code");
    const file = $(".code-file", group);   // config file name lives in the header label, the pre stays strict JSON (W0-4)
    const inst = list.dataset.for === "qs" ? $("#qsInstall") : null;
    const show = (t) => {
      $$("pre", group).forEach((p) => { p.hidden = p.dataset.lang !== t.dataset.lang; if (!p.hidden && file) file.textContent = p.dataset.file || ""; });
      if (inst) { const l = t.dataset.lang; inst.hidden = l === "curl"; $$("pre", inst).forEach((p) => (p.hidden = p.dataset.lang !== l)); }   // V1-26: the install line follows the tab
    };
    tabs(list, show);
  });

  /* mobile section picker: jump, then focus the heading (P3-F2, X1-F25) */
  const pick = $("#dpick");
  const headOf = (sec) => sec && $(":scope > .dt > :is(h2,h3)", sec);
  pick.addEventListener("change", () => {
    const t = document.getElementById(pick.value); if (!t) return;
    t.scrollIntoView({ behavior: window.KF.reduced ? "auto" : "smooth" });
    const h = headOf(t); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  });

  /* current section = the last one whose heading is at or above the line hdr + 24 (picker bottom + 24 on a phone); on scroll in rAF, IO only triggers (P3-F2).
     One answer drives the left nav, the picker and «On this page». */
  const secs = $$(".dmain .ds"), links = $$(".dnav a");
  const hdrEl = $(".hdr"), pickBox = $(".dpick");
  const toc = $("#dtoc");
  const SUB = [["request", ".dc .code:not(.resp):not(.install)", "s-toc-request"], ["params", ".dt .params", "s-toc-params"], ["response", ".dc .code.resp", "s-toc-response"]];
  /* «On this page» = the current section and its parts (Request · Parameters · Response, sub-headings) — never a copy of the left nav (PLAN-v3 §0) */
  const parts = (sec) => {
    const out = [];
    SUB.forEach(([k, sel, sid]) => { const el = $(sel, sec); if (!el) return; if (!el.id) el.id = sec.id + "-" + k; out.push([el.id, KF.str(sid, "")]); });
    $$(".dt .sub-h", sec).filter((h) => h !== headOf(sec)).forEach((h, i) => { if (!h.id) h.id = sec.id + "-s" + (i + 1); out.push([h.id, h.textContent.trim()]); });
    const order = (id) => { const el = document.getElementById(id); return el.getBoundingClientRect().top + (el.closest(".dc") ? 0.5 : 0); };
    return out.filter((x) => x[1]).sort((a, b) => order(a[0]) - order(b[0]));
  };
  let cur = null, rafQ = 0, jumped = null;
  function line() { const pb = pickBox && getComputedStyle(pickBox).display !== "none" ? pickBox.getBoundingClientRect().bottom : hdrEl.getBoundingClientRect().bottom; return pb + 24 + 1; }
  function compute() {
    rafQ = 0; const L = line();
    let c = null; secs.forEach((s) => { const h = headOf(s); if (h && h.offsetParent && h.getBoundingClientRect().top <= L) c = s; });   // a section hidden by a flag (data-feature) never counts
    const atEnd = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
    if (atEnd && jumped && secs.includes(jumped)) { const h = headOf(jumped); if (h && h.getBoundingClientRect().top < innerHeight) c = jumped; }
    c = c || secs[0];
    if (c !== cur) {
      cur = c; const navId = c.dataset.nav || c.id, id = "#" + navId;
      links.forEach((a) => { const on = a.getAttribute("href") === id; a.classList.toggle("on", on); if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
      pick.value = navId;
      if (toc) { const t = headOf(c); toc.innerHTML = `<a href="${id}" class="on" aria-current="true">${esc(t ? t.textContent.trim() : c.id)}</a>` + parts(c).map(([pid, l]) => `<a class="sub" href="#${esc(pid)}">${esc(l)}</a>`).join(""); }
    }
    /* P3-N16: the part in view is lit too; the section's own line while none is reached */
    if (toc) { const subs = $$("a.sub", toc); let on = null; subs.forEach((a) => { const el = document.getElementById(a.getAttribute("href").slice(1)); if (el && el.getBoundingClientRect().top <= L) on = a; }); const headA = toc.firstElementChild; subs.forEach((a) => a.classList.toggle("on", a === on)); if (headA) headA.classList.toggle("on", !on); }
  }
  const later = () => { if (!rafQ) rafQ = requestAnimationFrame(compute); };
  addEventListener("scroll", later, { passive: true }); addEventListener("resize", later, { passive: true });
  addEventListener("hashchange", () => { const t = document.getElementById(location.hash.slice(1)); jumped = t && t.closest(".ds"); later(); });
  if (location.hash) { const t = document.getElementById(location.hash.slice(1)); jumped = t && t.closest(".ds"); }
  if ("IntersectionObserver" in window) { const io = new IntersectionObserver(later, { rootMargin: "-64px 0px -60% 0px" }); secs.forEach((x) => io.observe(x)); }
  compute();

  /* models table (V1-25, P3-F9/F11): GET /v1/models — no :batch or dated ids, the example model first, then Featured; while loading the build snapshot stands;
     an error is one 40 px row with Try again in the table, the block stays small */
  const PICK = ["openai/", "anthropic/", "google/", "x-ai/", "deepseek/", "qwen/"];
  const box = $(".mtable"), body = $("#mBody"), cnt = $("#mCount").firstElementChild, EX = KF.meta("kf-model");
  const plain = (m) => !/:/.test(m.id) && !/-\d{4}$/.test(m.id) && !/image|banana|vision|-exp\b|preview/i.test(m.id + " " + (m.name || ""));   // P3-N12: text flagships only
  function load() {
    /* P3-N11: with a trial key in this tab the table is what that key can call */
    const hdrs = trial && trial.key ? { headers: { Authorization: "Bearer " + trial.key } } : {};
    api("/v1/models", hdrs).then((r) => {
      const all = ((r.ok && r.data && r.data.data) || []).filter((m) => m.id), rows = all.filter(plain);
      box.removeAttribute("data-loading");
      if (!rows.length) {
        body.innerHTML = `<tr class="m-err"><td colspan="3"><span><span>${esc(KF.str("s-m-err", ""))}</span><button class="btn btn-sm btn-2" type="button" id="mRetry">${esc(KF.str("s-m-retry", ""))}</button></span></td></tr>`;
        $("#mRetry").addEventListener("click", (e) => { busy(e.currentTarget, true); load(); }); return;
      }
      const shown = [], ex = rows.find((m) => m.id === EX); if (ex) shown.push(ex);
      PICK.forEach((p) => rows.filter((m) => m.id.startsWith(p) && m !== ex).slice(0, 2).forEach((m) => shown.push(m)));
      const list = (shown.length ? shown : rows).slice(0, 12);
      body.innerHTML = list.map((m) => {
        const id = String(m.id), logo = KF.modelMark(id, 16);
        return `<tr><td><span class="mrow-n">${logo}<span>${esc(m.name || id)}</span></span></td><td class="mono">${esc(id)}</td><td class="r num">${fmt.ctx(m.context_length || m.context)}</td></tr>`;
      }).join("");
      if (!cnt.dataset.tpl) cnt.dataset.tpl = cnt.textContent;
      cnt.textContent = cnt.dataset.tpl.replace("{n}", fmt.int(all.length)); $("#mCount").classList.remove("wait"); KF.ftrBack();
    });
  }
  load();

  /* W1-6: a horizontally scrolled <pre> fades its right 24 px (opacity mask, no blur) until the end is reached */
  /* the fade on scrolled code and the keyboard region live in common.js (KF.codeFit) */
})();
