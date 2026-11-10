/* Keydex AI landing v2 — hero scenario, live tool cards, task phone, chain facts, Keyhole giants.
   Every scene runs only while on screen (KF.onScreen); reduced motion shows the final frame. Fixed boxes only.
   Demo numbers come from one set of constants below; prices are live or "—", never invented (P0-8, P0-9). */
(function () {
  const { $, $$, api, reduced, onScreen, sleeper, fmt, esc } = window.KF;
  const M = window.KFMascot;

  /* ---------- WOW-01 «Meet Keyhole» (wow/01-meet-keyhole.html on the compositor engine; xai:01-hero-1440-f1…f5, Cofounder 4a9ef501) ---------- */
  const heroIn = $(".hero-in"), heroBox = $(".hero-title .km-box"), heroKm = heroBox && heroBox.kfm;
  if (heroIn && heroKm && !reduced) {
    heroIn.classList.add("pre");                                   // before the first frame: only the mascot and the buttons are held back
    const [bC, bO] = $$(".hero-cta .btn", heroIn), words = $$(".hero-title .ht-w"), win = $("#hw");
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      heroIn.classList.add("go"); heroIn.classList.remove("pre");
      await wait(1000); heroKm.wake();                             // X3-F3: face on from the first frame; at 1 s the eye opens from the squint, then a nod
      await wait(1000); if (!hov) heroKm.gazeAt(words[0], 520);
      await wait(560); if (!hov) heroKm.gazeAt(words[1], 520);
      await wait(560); if (!hov) heroKm.gazeAt(bC, 700);
    })();
    let hov = null;
    [bC, bO].forEach((b, i) => {
      b.addEventListener("pointerenter", (e) => { if (e.pointerType === "touch") return; hov = b; heroKm.gazeAt(b, 60000); if (i === 0) heroKm.turn(); });
      b.addEventListener("pointerleave", () => { if (hov === b) { hov = null; heroKm.look(0, 0, 1); } });
      b.addEventListener("click", () => { heroKm.turn([220, 380]); setTimeout(() => heroKm.squint(620, 0.3), 420); });   // unlock, then a content squint; the modal opens 320 ms later (connect.js)
    });
    let tick = false;
    addEventListener("scroll", () => { if (tick) return; tick = true; requestAnimationFrame(() => { tick = false; if (scrollY > 60 && !hov && win) heroKm.gazeAt(win, 900); }); }, { passive: true });
    document.addEventListener("kf:approved", () => heroKm.squint(700, 0.3));   // WOW-02: the hero mascot is pleased when the trade is signed
  }

  /* ---------- demo constants: one scenario, one set of numbers ---------- */
  const PF = [["NVDA", 0.12], ["TSLA", 0.3], ["AAPL", 0.25]];      // the agent's one portfolio
  const PF_ETH = 0.05;                                               // its SOL = fund_agent card = task.phone.4
  const TRADE_USD = 50, TRADE_FEE_USD = 0.13;                        // LI.FI fee measured 28.10 (TSLA $50 buy)
  const FUND_ETH = 0.05;
  const NAMES = { NVDA: "NVIDIA", TSLA: "Tesla", AAPL: "Apple", GOOGL: "Alphabet", META: "Meta", AMZN: "Amazon", MSFT: "Microsoft", AMD: "AMD" };

  /* live quotes (GET /v1/tools/stock_quote); offline → nulls, never demo prices */
  const QC = {};
  function q(t) {
    if (!QC[t]) QC[t] = api("/v1/tools/stock_quote?ticker=" + t).then((r) => {
      const d = r.ok && r.data && (r.data.data || r.data);
      if (d && fmt.known(d.price_usd)) return { t, price: +d.price_usd, chg: fmt.known(d.change_24h_pct) ? +d.change_24h_pct : null, depth: fmt.known(d.depth_usd) ? +d.depth_usd : null, name: d.name || NAMES[t] };
      return { t, price: null, chg: null, depth: null, name: NAMES[t] };
    });
    return QC[t];
  }
  const logo = (t, big) => KF.asset(big ? `/img/stocks/${t}.webp` : `/img/stocks/${t}@64.webp`);
  const logoImg = (t, w, lazy) => `<img src="${logo(t)}" srcset="${logo(t)} 1x, ${logo(t, 1)} 2x" alt="" width="${w}" height="${w}"${lazy ? ' loading="lazy" decoding="async"' : ""}>`;
  /* run once when el comes within 600 px of the viewport (keeps below-the-fold requests out of the first load) */
  const near = (el, fn, m = "600px") => { if (!("IntersectionObserver" in window)) return fn(); const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { io.disconnect(); fn(); } }, { rootMargin: m }); io.observe(el); };
  const c2 = (x) => Math.round(x * 100) / 100;                     // cents: rows and totals are summed as shown (V0-4)
  const TK = /\b(NVDA|TSLA|AAPL|GOOGL|META|AMZN|MSFT|AMD|NFLX|PLTR|AVGO|TSM|COST|SOL)\b/g;
  const grp = (h) => h.replace(/([^\s<>]+) (<span class="tkr">.*?<\/span>)([.,;:!?]?)/g, '<span class="nw">$1 $2$3</span>');   // PD Н4: «0.05 ⟠SOL» never breaks before the mark
  const deco = (s) => grp(esc(s).replace(TK, (m) => `<span class="tkr"><img src="${m === "SOL" ? KF.asset("/img/tokens/sol.svg") : logo(m)}" alt="" width="16" height="16">${m}</span>`));
  /* F2 С2: where there is a ticker there is its mark — the hero's messages too */
  $$('.msg.u p, [data-slot="hero.win.receipt"]').forEach((p) => { p.innerHTML = deco(p.textContent); });
  const setNum = (e, txt, known) => { e.textContent = txt; e.classList.toggle("unk", !known); };

  /* pause CSS loops off screen (P1-32): --play on the scene root */
  function playWhenVisible(el) {
    if (!el || !("IntersectionObserver" in window)) return;
    new IntersectionObserver((e) => { const on = e[0].isIntersecting; el.style.setProperty("--play", on ? "running" : "paused"); el.classList.toggle("zz", !on); }).observe(el);   // X2-F11: off screen the loops are removed, not only paused
  }

  /* deterministic sparkline that ends at the live price and starts where the 24h change says */
  function series(t, price, chg, n = 32) {
    let s = 0; for (const c of t) s = (s * 31 + c.charCodeAt(0)) >>> 0;
    const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    const start = price / (1 + (chg || 0) / 100), walk = [0];
    for (let i = 1; i < n; i++) walk.push(walk[i - 1] * 0.85 + (rnd() - 0.5) * price * 0.006);
    const last = walk[n - 1];
    return walk.map((w, i) => { const k = i / (n - 1); return start + (price - start) * k + w - last * k; });
  }
  function path(vals, w, h, pad = 2) {
    const mn = Math.min(...vals), mx = Math.max(...vals), r = mx - mn || 1;
    return vals.map((v, i) => (i ? "L" : "M") + Math.round((i / (vals.length - 1)) * w * 10) / 10 + " " + Math.round((pad + (1 - (v - mn) / r) * (h - pad * 2)) * 10) / 10).join(" ");
  }
  const flat = (w, h) => `M0 ${h / 2} L${w} ${h / 2}`;
  function fillQ(d) {
    $$(`[data-q="${d.t}:price"]`).forEach((e) => setNum(e, fmt.usd(d.price), d.price != null));
    $$(`[data-q="${d.t}:chg"]`).forEach((e) => (e.textContent = fmt.pct(d.chg)));
    const sp = $(`[data-spark="${d.t}"]`);
    if (sp) {
      const p = d.price != null ? path(series(d.t, d.price, d.chg), 240, 44) : flat(240, 44);
      sp.setAttribute("d", p); $(`[data-spark-area="${d.t}"]`).setAttribute("d", d.price != null ? p + " L240 44 L0 44 Z" : "");
      sp.closest("svg").classList.toggle("flat", d.price == null);
    }
  }
  const tradeOut = (price) => (price ? (TRADE_USD - TRADE_FEE_USD) / price * 0.997 : null);

  /* ---------- show / hide helpers (opacity only, boxes keep their place) ---------- */
  const show = (el) => { if (!el) return; el.classList.remove("off"); el.classList.remove("in"); el.getAnimations().forEach((a) => a.cancel()); el.classList.add("in"); };  // no forced reflow (C-F8)
  const hide = (el) => { if (el) { el.classList.add("off"); el.classList.remove("in"); } };

  /* ---------- HERO (WOW-02): connect → calls → Review «Needs your approval» → the key turns (signature) → receipt → TSLA flies into the portfolio, numbers roll (~13 s)
     Runs only on screen (sleeper(onScreen)); offline / no quote → no roll and no flight, sums «—». Reduced motion → the final frame. ---------- */
  const hw = $("#hw");
  if (hw) {
    playWhenVisible(hw);
    const H = (k) => hw.querySelector(`[data-h="${k}"]`);
    /* PU Н-1: the portfolio total hides only when the approval card overlaps it on this width, never by the card's mere presence */
    const cover = () => { const rv = H("review"); $$(".sc-port .pt-total", hw).forEach((t) => { const a = rv && rv.getBoundingClientRect(), b = t.getBoundingClientRect();
      t.classList.toggle("under", !!(rv && !rv.classList.contains("off") && a.width && b.width && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top)); }); };
    if (H("review")) { new MutationObserver(() => { cover(); setTimeout(cover, 700); }).observe(H("review"), { attributes: true, attributeFilter: ["class"] }); addEventListener("resize", cover, { passive: true }); }
    const calls = $$(".call", hw), scr = $(".screen", hw), cur = H("cursor"), btn = $("[data-approve]", hw), sheet = $('[data-face="sheet"]', hw), ok = $(".rc-ok", hw);
    const msgs = $$(".chat-log .msg:not(.hist)", hw), hk = $(".win-title.hk", hw), plus = $("[data-tsla-plus]", hw);
    sheet.classList.add("hs");
    const mini = null;   // the window head carries the k sign (CSS), not the Keyhole
    const sig = null;    // Approve shows the k sign while signing
    const setCall = (i, st) => { calls[i].classList.remove("done", "wait", "pre"); if (st) calls[i].classList.add(st); };
    let P = null, OUT = null;   // live TSLA price and the trade output
    const FLY = true;
    q("TSLA").then((d) => {
      fillQ(d); P = d.price; OUT = tradeOut(d.price);
      if (d.price == null) $$(".call .http", hw).forEach((e) => (e.hidden = true));   // X4-F31: without an answer there is no 200 to show
      $$("[data-tsla-out]").forEach((e) => (e.textContent = OUT != null ? "≈ " + fmt.amt(OUT) + " TSLA" : fmt.DASH));
      $$("[data-tsla-plus]").forEach((e) => (e.textContent = OUT != null ? "≈ +" + fmt.amt(OUT) + " TSLA" : fmt.DASH));
    });
    $$(".seg button", hw).forEach((b) => b.addEventListener("click", () => {
      $$(".seg button", hw).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      const av = KF.v(b.dataset.m === "claude" ? '<img class="ic" src="/img/models/claude-color.svg" alt="" width="16" height="16">' : '<span class="i" style="--src:url(/img/models/openai.svg)"></span>');
      $("[data-av]", hw).innerHTML = av; const ha = $("[data-hk-av]", hw); if (ha) ha.innerHTML = av;   // the handshake pill follows the assistant
    }));
    function cursorTo(x, y, instant) {
      if (instant) { cur.style.transition = "none"; cur.style.transform = `translate(${x}px,${y}px)`; cur.getBoundingClientRect(); cur.style.transition = ""; }
      else cur.style.transform = `translate(${x}px,${y}px)`;
    }
    function approvePoint() { const sr = scr.getBoundingClientRect(), r = btn.getBoundingClientRect(); return [r.left - sr.left + r.width * 0.62, r.top - sr.top + r.height * 0.45]; }
    const pfLi = (t) => $(`.sc-port li[data-t="${t}"]`, hw);
    /* the TSLA mark flies from the receipt into its portfolio row: WAAPI transform, 3 keys, an arc 70 px up (×1.5), then fades */
    function flyToken() {
      const s0 = scr.getBoundingClientRect(), a0 = $(".rc-amt .logo-t", hw).getBoundingClientRect(), li = pfLi("TSLA"); if (!li) return Promise.resolve();
      const b0 = $(".logo-t", li).getBoundingClientRect(); if (!b0.width) return Promise.resolve();   // the compact portfolio has no rows to fly to
      const f = document.createElement("span"); f.className = "fly"; f.innerHTML = KF.v('<img src="/img/stocks/TSLA@64.webp" alt="">'); scr.appendChild(f);
      const x0 = a0.left - s0.left, y0 = a0.top - s0.top, x1 = b0.left - s0.left + (b0.width - 20) / 2, y1 = b0.top - s0.top + (b0.height - 20) / 2;
      const mx = (x0 + x1) / 2, my = Math.min(y0, y1) - 70, E = getComputedStyle(document.documentElement);
      const T = (n) => { const v = E.getPropertyValue(n).trim(); return v.endsWith("ms") ? parseFloat(v) : parseFloat(v) * 1000; };
      return f.animate([{ transform: `translate(${x0}px,${y0}px) scale(1)` }, { transform: `translate(${mx}px,${my}px) scale(1.5)`, offset: 0.45 }, { transform: `translate(${x1}px,${y1}px) scale(1.4)` }],
        { duration: T("--dur-roll"), easing: E.getPropertyValue("--ease-entry").trim(), fill: "forwards" }).finished
        .then(() => f.animate([{ transform: `translate(${x1}px,${y1}px) scale(1.4)`, opacity: 1 }, { transform: `translate(${x1}px,${y1}px) scale(1)`, opacity: 0 }], { duration: T("--dur-2"), easing: E.getPropertyValue("--ease-out").trim(), fill: "forwards" }).finished)
        .then(() => f.remove(), () => f.remove());
    }
    async function pfNums(tslaPlus, animate) {
      const p = await portfolio(); if (p.total == null) return false;
      const tsla = p.rows.find((r) => r.t === "TSLA"), add = tslaPlus && P && tsla ? c2(c2((tsla.a + tslaPlus) * P) - tsla.value) : 0, go = animate ? KF.roll.to : KF.roll.set;
      $$("[data-pf-total]", hw).forEach((e) => go(e, fmt.usd(c2(p.total + add))));
      p.rows.forEach((r) => { const li = pfLi(r.t); if (li) go($(".v", li), fmt.usd(c2(r.value + (r.t === "TSLA" ? add : 0)))); });
      return true;
    }
    function first(initial) {
      hk.classList.remove("on");
      msgs.forEach((m, i) => { m.classList.remove("go"); if (!(initial && i === 0)) m.classList.add("pre"); });   // X3-F5: on the first pass the ask stands from t = 0
      calls.forEach((c) => { c.classList.remove("done", "wait"); c.classList.add("pre"); });
      ["quote", "review", "need", "done", "cursor", "receipt"].forEach((k) => hide(H(k)));
      if (!H("port").classList.contains("off")) hide(H("port"));
      H("port").classList.remove("side");
      sheet.classList.remove("off"); btn.classList.remove("press", "signing"); ok.classList.remove("go");
      const tl = pfLi("TSLA"); if (tl) $(".amt-f", tl).textContent = fmt.amt(0.3);
      pfNums(0, false);
      if (plus && OUT != null) KF.roll.set(plus, "≈ +" + fmt.amt(OUT).replace(/\d/g, "0") + " TSLA");   // same mask → the amount rolls in
    }
    function final() {
      hk.classList.add("on"); msgs.forEach((m) => m.classList.remove("pre")); calls.forEach((c, i) => setCall(i, "done"));
      ["port", "review", "done", "receipt"].forEach((k) => H(k).classList.remove("off", "in")); H("port").classList.add("side"); hide(H("quote"));
      hide(H("need")); hide(H("cursor")); sheet.classList.add("off");
      q("TSLA").then(() => { if (OUT == null) return; const tl = pfLi("TSLA"); if (tl) $(".amt-f", tl).textContent = fmt.amt(0.3 + OUT); pfNums(OUT, false); });
    }
    if (reduced) final();
    else {
      const sleep = sleeper(onScreen(hw, 0.18));
      let initial = true;
      (async function loop() {
        for (;;) {
          first(initial);
          if (initial) {                                                                                 // X3-F5: the first pass starts working at once — the pill connects in parallel
            initial = false;
            (async () => { if (mini) mini.turn([150, 260]); await sleep(260); hk.classList.add("on"); })();
            await sleep(300); msgs[1].classList.replace("pre", "go"); await sleep(300);                  // stock_portfolio at 600 ms
          } else {
            await sleep(1100);
            if (mini) mini.turn([150, 260]); await sleep(260); hk.classList.add("on");                  // 1.36 s: connected, 4 tool dots pop
            await sleep(500); msgs[0].classList.replace("pre", "go");                                    // the ask
            await sleep(420); msgs[1].classList.replace("pre", "go");                                    // the calls block
          }
          { const d = await q("TSLA"); P = d.price; OUT = tradeOut(d.price); }                           // P1-F8: one snapshot per pass (the same QC as the bento)
          setCall(0, null); await sleep(800); setCall(0, "done"); show(H("port"));                     // portfolio in the middle of the scene
          await sleep(260); setCall(1, null); await sleep(800); setCall(1, "done"); H("port").classList.add("side");
          await sleep(460); show(H("quote"));                                                            // F1-М3: the quote comes once the portfolio has moved
          await sleep(160); setCall(2, null); await sleep(900); setCall(2, "done");                   // ≈ 4.5 s: Review rises
          msgs[2].classList.replace("pre", "go"); show(H("review")); hide(H("quote"));                 // V0-5: Review takes the quote's place; V1-2: no «Needs your approval» chip next to the sheet
          await sleep(700); const sr = scr.getBoundingClientRect();
          cursorTo(sr.width - 40, sr.height - 24, true); show(cur);
          await sleep(60); const [x, y] = approvePoint(); cursorTo(x, y);
          await sleep(1250); btn.classList.add("press"); await sleep(160); btn.classList.remove("press");
          btn.classList.add("signing"); await sleep(120); if (sig) sig.turn([200, 320]); await sleep(560);   // the key turns = the agent signs
          hide(sheet); await sleep(200); show(H("receipt")); ok.classList.remove("go"); ok.getAnimations().forEach((an) => an.cancel()); ok.classList.add("go"); hide(H("need")); show(H("done"));
          const live = OUT != null && P != null;
          await sleep(120); if (live && plus) KF.roll.to(plus, "≈ +" + fmt.amt(OUT) + " TSLA");
          await sleep(520); cursorTo(sr.width - 40, sr.height - 24);
          if (live) {
            if (FLY) flyToken();
            await sleep(700); const li = pfLi("TSLA");
            if (li) { li.classList.remove("hit"); li.getAnimations().forEach((an) => an.cancel()); li.classList.add("hit");
              const af = $(".amt-f", li); af.classList.remove("flip"); af.getAnimations().forEach((an) => an.cancel()); af.classList.add("flip"); setTimeout(() => (af.textContent = fmt.amt(0.3 + OUT)), 170); }
            pfNums(OUT, true);
            document.dispatchEvent(new Event("kf:approved"));
          }
          await sleep(4600); ["quote", "review", "done", "cursor"].forEach((k) => hide(H(k)));
          await sleep(500);
        }
      })();
    }
  }

  /* ---------- facts line: «A · B · Latest block {n}» → items; {n} = live block ---------- */
  const facts = $("#facts");
  if (facts) {
    const parts = facts.textContent.split(" · ").map((x) => x.trim()).filter(Boolean);
    facts.textContent = "";
    let live = null;
    parts.forEach((p) => {
      const li = document.createElement("span"); li.className = "fact";
      if (p.includes("{n}")) { const [pre, post] = p.split("{n}"); live = document.createElement("span"); live.className = "live num"; live.textContent = fmt.DASH; li.append(pre, live, post); }
      else li.textContent = p;
      facts.append(li);
    });
    const vis = onScreen(facts), sleep = sleeper(vis);
    (async function tick() {
      for (;;) {
        const r = await api("/api/chain");
        if (live && r.ok && r.data && r.data.block) live.textContent = fmt.int(r.data.block);
        await sleep(document.hasFocus() ? 3000 : 10000);   // X1-F3: outside focus the counter changes no more than once in 10 s
      }
    })();
  }

  /* ---------- stock_portfolio: one position × live prices; "in total" = the sum of what is named ---------- */
  async function portfolio() {
    /* P1-F2: every row is rounded to cents first, the total is the sum of what is shown */
    const rows = await Promise.all(PF.map(async ([t, a]) => { const d = await q(t); return { t, a, name: d.name, value: d.price != null ? c2(a * d.price) : null }; }));
    const known = rows.every((r) => r.value != null);
    return { rows, total: known ? c2(rows.reduce((x, r) => x + r.value, 0)) : null, eth: PF_ETH };
  }
  /* numbers change by the odometer (KF.roll), not a JS tween (WOW-02); unknown → «—» */
  function rollTo(el, to) {
    if (to == null) { el.classList.remove("roll"); el.removeAttribute("aria-label"); setNum(el, fmt.DASH, false); return; }
    if (el.classList.contains("roll")) KF.roll.to(el, fmt.usd(to)); else KF.roll.set(el, fmt.usd(to));
  }
  $$("[data-pf]").forEach((ul) => {
    ul.innerHTML = PF.map(([t, a]) => `<li data-t="${t}"><span class="logo-t md">${logoImg(t, 28, ul.dataset.pf !== "hero")}</span><span class="nm"><b>${t}</b><span><span class="amt-f">${fmt.amt(a)}</span> ${t}</span></span><span class="v num unk" data-pfv="${t}">${fmt.DASH}</span></li>`).join("");
  });
  async function pfRender() {
    const p = await portfolio();
    const own = (e) => !hw || !hw.contains(e);   // the hero window keeps its own numbers (it adds the trade)
    $$("[data-pf-total]").filter(own).forEach((e) => rollTo(e, p.total));
    p.rows.forEach((r) => $$(`[data-pfv="${r.t}"]`).filter(own).forEach((e) => rollTo(e, r.value)));
  }
  pfRender();   /* P1-F8: one price snapshot for the life of the page — the hero, the quote list and both portfolios always agree */

  /* ---------- tools: stock_quote (6 rows, logo + sparkline + price, neutral change) ---------- */
  const qList = $("#qList");
  if (qList) {
    const T = ["NVDA", "TSLA", "AAPL", "GOOGL", "META", "AMZN"];
    qList.innerHTML = T.map((t) => `<li data-t="${t}" class="flat"><span class="logo-t md">${logoImg(t, 28, true)}</span><span class="nm"><b>${t}</b><span data-nm>${NAMES[t]}</span></span><svg viewBox="0 0 64 22" preserveAspectRatio="none" aria-hidden="true"><path d="${flat(64, 22)}"/></svg><span class="px"><b class="num unk" data-px>${fmt.DASH}</b><span class="num" data-ch>${fmt.DASH}</span></span></li>`).join("");
    const rows = $$("li", qList);
    near(qList, () => T.forEach((t, i) => q(t).then((d) => {
      const li = rows[i];
      const nm = $("[data-nm]", li); nm.textContent = NAMES[t] || d.name;   // P1-F14: one naming everywhere — the short names
      setNum($("[data-px]", li), fmt.usd(d.price), d.price != null); $("[data-ch]", li).textContent = fmt.pct(d.chg);
      /* W1-9: a big 24h move on a thin pool is flagged, the same chip as /stocks */
      if (d.chg != null && Math.abs(d.chg) > 10 && d.depth != null && d.depth < 50000 && !$(".thin", li)) $(".nm b", li).insertAdjacentHTML("beforeend", `<span class="thin" title="${esc(KF.str("s-thin-t", ""))}">${esc(KF.str("s-thin", "Thin pool"))}</span>`);
      if (d.price != null) { $("path", li).setAttribute("d", path(series(t, d.price, d.chg, 24), 64, 22)); li.classList.remove("flat"); }
    })));
    if (!reduced && "IntersectionObserver" in window) {
      rows.forEach((r) => (r.style.opacity = "0"));
      const io = new IntersectionObserver((e) => {
        if (!e[0].isIntersecting) return; io.disconnect();
        rows.forEach((r, i) => { r.style.opacity = ""; r.style.animation = `rowin var(--dur-4) var(--ease-entry) ${i * 90}ms both`; });
      }, { threshold: 0.3 });
      io.observe(qList);
    }
  }

  /* tools: build_trade — a static unsigned transaction (V1-2): no cursor loop, nothing runs here */

  /* ---------- tools: fund_agent (network → agent → SOL balance) ---------- */
  const tFund = $("#tFund");
  if (tFund) {
    const srcs = $$(".fa-src span", tFund), dot = $(".fa-line i", tFund), bal = $(".fa-bal", tFund), num = $("[data-fa-bal]", tFund);
    num.textContent = fmt.amt(FUND_ETH);
    if (reduced) bal.classList.add("done");
    else {
      const sleep = sleeper(onScreen(tFund));
      (async () => {
        /* V1-10 (X2-F5): the sum counts up once, on the first entry; then it stays — only the network and the dot move (no forced reflow) */
        for (let i = 0, first = true; ; i = (i + 1) % srcs.length, first = false) {
          srcs.forEach((s, k) => s.classList.toggle("on", k === i));
          if (first) { bal.classList.remove("done"); num.textContent = "0"; dot.classList.add("go"); }
          else dot.getAnimations().forEach((a) => { a.currentTime = 0; a.play(); });
          await sleep(1000);
          if (first) {
            const t0 = performance.now();
            await new Promise((res) => { (function f(now) { const k = Math.min(1, (now - t0) / 700); num.textContent = fmt.amt(FUND_ETH * (1 - Math.pow(1 - k, 3))); k < 1 ? requestAnimationFrame(f) : res(); })(t0); });
            num.textContent = fmt.amt(FUND_ETH); bal.classList.add("done");
          }
          await sleep(2600);
        }
      })();
    }
  }

  /* ---------- Q1-С2 model board: the build snapshot's prices, refreshed from /v1/models (same formatter as /pricing; cells keep their width) ---------- */
  const okb = $(".okb-l");
  if (okb) api("/v1/models").then((r) => {
    const by = new Map(((r.ok && r.data && r.data.data) || []).map((m) => [m.id, m.pricing || {}]));
    $$("li[data-m]", okb).forEach((li) => { const p = by.get(li.dataset.m); if (!p) return; $('[data-p="in"]', li).textContent = fmt.price1M(p.prompt); $('[data-p="out"]', li).textContent = fmt.price1M(p.completion); });
  });

  /* ---------- Q1 ticker tape (DESIGN §6.8): the 24h change of each mark from /v1/stocks; the chips keep their width, so nothing moves ---------- */
  const tape = $(".q-tape");
  if (tape) api("/v1/stocks").then((r) => {
    const rows = (r.ok && r.data && r.data.data) || [];
    rows.forEach((d) => { if (!fmt.known(d.change_24h_pct)) return; const c = +d.change_24h_pct; $$(`[data-chg="${d.ticker}"]`, tape).forEach((e) => (e.textContent = (c > 0 ? "+" : c < 0 ? "−" : "") + Math.abs(c).toFixed(2) + "%")); });
  });

  /* ---------- task: chips + phone conversation ---------- */
  const chips = $$(".tk-chip"), phLog = $("#phLog"), desc = $("#taskDesc"), strs = $("#taskStr");
  if (chips.length && phLog && strs) {
    playWhenVisible(phLog.closest(".phone"));
    const conv = (n) => $$(`[data-slot="task.phone.${n}"]`, strs).map((e, i) => {
      const s = e.textContent.trim(); const m = /^([UA]):\s*/.exec(s);
      return { who: m ? (m[1] === "U" ? "u" : "a") : (i % 2 ? "a" : "u"), text: m ? s.slice(m[0].length) : s };
    });
    async function fillVals(text) {
      if (/\{(holdings|value|eth)\}/.test(text)) {
        const p = await portfolio();
        text = text.replace("{holdings}", p.rows.map((r) => fmt.amt(r.a) + " " + r.t).join(", ").replace(/, ([^,]*)$/, " and $1"))
          .replace("{value}", fmt.usd(p.total)).replace("{eth}", fmt.amt(p.eth));
      }
      if (/\{ticker\}/.test(text)) {   // PM М-6: the deeper pool of the live pair; no depth → the fallback line
        const ts = (text.match(/\b(NVDA|TSLA|AAPL|GOOGL|META|AMZN|MSFT|AMD)\b/g) || []), prev = conv(cur).map((l) => l.text).join(" ");   // the request names the pair
        const pair = [...new Set((prev.match(/\b(NVDA|TSLA|AAPL|GOOGL|META|AMZN|MSFT|AMD)\b/g) || []).concat(ts))].slice(0, 2);
        const ds = await Promise.all(pair.map((t) => q(t).then((d) => [t, d && d.depth]).catch(() => [t, null])));
        const ok = ds.length === 2 && ds.every((x) => x[1] > 0);
        if (!ok) { const fb = $('[data-slot="task.phone.5.fallback"]', strs); return fb ? fb.textContent.trim() : text.replace(/\{ticker\}\s*/, ""); }
        text = text.replace("{ticker}", ds[0][1] >= ds[1][1] ? ds[0][0] : ds[1][0]);
      }
      if (!/\{(price|change|depth)\}/.test(text)) return text;
      const re = /\b(NVDA|TSLA|AAPL|GOOGL|META|AMZN|MSFT|AMD)\b|\{(price|change|depth)\}/g;
      let out = "", last = 0, tk = null, m;
      while ((m = re.exec(text))) {
        out += text.slice(last, m.index); last = re.lastIndex;
        if (m[1]) { tk = m[1]; out += m[1]; continue; }
        const d = tk ? await q(tk) : null;
        out += !d ? fmt.DASH : m[2] === "price" ? fmt.usd(d.price) : m[2] === "change" ? fmt.pct(d.chg) : fmt.usdM(d.depth);
      }
      return out + text.slice(last);
    }
    const descOf = (n) => { const e = $(`[data-slot="task.desc.${n}"]`, strs); return e ? e.textContent.trim() : ""; };
    let cur = 0, run = 0, userAt = 0;
    const sleep = sleeper(onScreen(phLog.closest(".phone")));
    /* owner-eye №1: the agent's answer carries the tool's own card (xai:05-give-job-1440-f2) — real numbers from the same snapshot as the rest of the page; no new strings */
    const TICK = '<span class="ok-c"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8.5 6.5 11.5 12.5 5"/></svg></span>';
    const mark = (t, w = 28) => `<span class="logo-t${w === 28 ? " md" : ""}">${logoImg(t, w)}</span>`;
    async function card(n) {
      if (n === 1) { const p = await portfolio();
        return `<div class="pc"><p class="pt-total"><span>${esc(($(".pt-total span") || {}).textContent || "")}</span><b class="num">${fmt.usd(p.total)}</b></p><ul class="pf">${p.rows.map((r) => `<li>${mark(r.t)}<span class="nm"><b>${r.t}</b><span>${fmt.amt(r.a)} ${r.t}</span></span><span class="v num">${fmt.usd(r.value)}</span></li>`).join("")}<li><span class="logo-t md"><img src="${KF.asset("/img/tokens/sol.svg")}" alt="" width="28" height="28"></span><span class="nm"><b>SOL</b></span><span class="v num">${fmt.amt(p.eth)} SOL</span></li></ul></div>`; }
      if (n === 2) { const ds = await Promise.all(["AAPL", "GOOGL", "NVDA", "TSLA"].map(q));   // EYE Н1: four rows, the first two are the question
        return `<div class="pc"><ul class="ql">${ds.map((d) => `<li>${mark(d.t)}<span class="nm"><b>${d.t}</b><span>${esc(NAMES[d.t] || d.name)}</span></span><svg viewBox="0 0 64 22" preserveAspectRatio="none" aria-hidden="true"><path d="${d.price != null ? path(series(d.t, d.price, d.chg, 24), 64, 22) : flat(64, 22)}"/></svg><span class="px"><b class="num">${fmt.usd(d.price)}</b><span class="num">${fmt.pct(d.chg)}</span></span></li>`).join("")}</ul></div>`; }
      if (n === 3) { const d = await q("TSLA"), out = tradeOut(d.price), head = $(".rv-head", $("#hw")), lbl = $("[data-approve] .lbl");
        return `<div class="pc light"><div class="rv-head"><i></i><span>${esc(head ? head.textContent.trim() : "")}</span></div><div class="rv-amt">${mark("TSLA", 28)}<div><b class="num">$50.00</b><span class="num">${out != null ? "≈ " + fmt.amt(out) + " TSLA" : fmt.DASH}</span></div></div><span class="rv-btn">${esc(lbl ? lbl.textContent.trim() : "")}</span></div>`; }
      /* EYE Н1: the bento's fund_agent — six networks, a line to the agent, the SOL that arrives */
      if (n === 4) return `<div class="pc pc-fund"><div class="fl"><span class="nets">${["ethereum", "base", "arbitrum", "optimism", "bnb", "polygon"].map((c) => `<img src="${KF.asset("/img/chains/" + c + ".svg")}" alt="" width="36" height="36">`).join("")}</span><i class="dots"></i><span class="ag" id="phAg"></span></div><div class="to"><img src="${KF.asset("/img/tokens/sol.svg")}" alt="" width="28" height="28"><b class="num">${fmt.amt(FUND_ETH)}</b><span>SOL</span>${TICK}</div></div>`;
      /* EYE Н1, P1-R8: each stock with its 24h and its pool, the deeper pool's bar is full — the numbers the answer speaks about */
      if (n === 5) { const ds = await Promise.all(["NVDA", "AAPL"].map(q)), mx = Math.max(...ds.map((d) => d.depth || 0)), L = (k) => esc(KF.str(k, ""));
        return `<div class="pc pc-cmp">${ds.map((d) => `<div class="r"><p class="t">${mark(d.t)}<b>${d.t}</b><span class="n">${esc(NAMES[d.t] || d.name || "")}</span></p><dl><dt>${L("s-c-24h")}</dt><dd class="num">${fmt.pct(d.chg)}</dd><dt>${L("s-c-pool")}</dt><dd class="num">${fmt.usdM(d.depth)}</dd></dl><i class="bar"><i style="width:${mx && d.depth ? Math.round((d.depth / mx) * 100) : 0}%"></i></i></div>`).join("")}</div>`; }
      return "";
    }
    const receipt = async () => { const d = await q("TSLA"), out = tradeOut(d.price); return `<div class="pc pc-done">${TICK}<b class="num">$50.00</b><span class="num">${out != null ? mark("TSLA", 20) + "≈ +" + fmt.amt(out) + " TSLA" : fmt.DASH}</span></div>`; };   // P1-R2: where there is a ticker there is its mark
    /* the log sits on the composer: when a turn no longer fits, the oldest message leaves whole — never a half-cut bubble under the header */
    const mountAg = () => {};   // the agent avatar is the k sign (CSS)
    const trim = () => { const top = phLog.getBoundingClientRect().top + 8; while (phLog.children.length > 1 && phLog.firstElementChild.getBoundingClientRect().top < top) phLog.firstElementChild.remove(); };
    async function play(n, byUser) {
      const my = ++run; cur = n;
      desc.setAttribute("aria-live", byUser ? "polite" : "off");   // X1-F2: the auto-rotation is silent, a click is announced
      chips.forEach((c) => c.setAttribute("aria-pressed", String(+c.dataset.t === n)));
      const d = descOf(n), t = d.match(/^([a-z_]+)([\s\S]*)$/);   // С-6: the tool name in mono opens the line
      desc.innerHTML = t ? `<span class="tn">${esc(t[1])}</span>${deco(t[2])}` : deco(d);
      const lines = (await Promise.all(conv(n).map(async (l) => ({ who: l.who, text: await fillVals(l.text) })))).filter((l, i) => !(n === 3 && i === 2));   // P1-R9: the card carries Approve — no «Approve.» bubble under it, the question stays in view
      if (my !== run) return;
      phLog.innerHTML = "";
      const cardHTML = await card(n), doneHTML = n === 3 ? await receipt() : ""; if (my !== run) return;
      if (reduced) { lines.forEach((l, i) => { phLog.insertAdjacentHTML("beforeend", `<div class="bub ${l.who}">${deco(l.text)}</div>`); if (l.who === "a" && (i === 1)) { phLog.insertAdjacentHTML("beforeend", cardHTML); mountAg(); } }); phLog.insertAdjacentHTML("beforeend", doneHTML); trim(); return; }
      for (const [i, l] of lines.entries()) {
        await sleep(l.who === "u" ? 600 : 300); if (my !== run) return;
        if (l.who === "a") {
          phLog.insertAdjacentHTML("beforeend", '<div class="bub a typing"><i></i><i></i><i></i></div>');
          await sleep(900); if (my !== run) return;
          phLog.lastElementChild.remove();
        }
        phLog.insertAdjacentHTML("beforeend", `<div class="bub ${l.who}">${deco(l.text)}</div>`); trim();
        if (l.who === "a" && i === 1) { await sleep(300); if (my !== run) return; phLog.insertAdjacentHTML("beforeend", cardHTML); mountAg(); trim(); }
      }
      if (doneHTML) { await sleep(700); if (my !== run) return; phLog.insertAdjacentHTML("beforeend", doneHTML); trim(); }
    }
    chips.forEach((c) => c.addEventListener("click", () => { userAt = performance.now(); play(+c.dataset.t, true); if (matchMedia("(max-width:767px)").matches) phLog.closest(".phone").scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" }); }));   // EYE М5: the answer is below the chips on a phone
    play(1);
    if (!reduced) (async () => { for (;;) { await sleep(9500); if (performance.now() - userAt > 20000) play((cur % chips.length) + 1); } })();
  }

  /* the logo ribbon (marquee) is gone with WOW-04: the models live in the keyhole now (PLAN-v2 WOW-5) */

  /* ---------- «Routes via Jupiter / Relay»: the official mark replaces the word ---------- */
  $$("[data-route]").forEach((p) => {
    const t = p.textContent, dark = p.classList.contains("dark"), name = ["LI.FI", "Relay"].find((n) => t.includes(n)); if (!name) return;
    const i = t.indexOf(name), mark = name === "Relay" ? `<img src="/img/brand/relay-white.svg" alt="Relay" width="53" height="12">` : `<img src="/img/brand/lifi-${dark ? "black" : "white"}.svg" alt="LI.FI" width="33" height="12">`;
    p.innerHTML = esc(t.slice(0, i)) + KF.v(mark) + esc(t.slice(i + name.length));
  });

  /* ---------- Keyhole giants (eye follows the cursor) ---------- */
  if (M) {
    /* WOW-04 «through the keyhole»: the giant's eye is a window; behind it a drum of 8 model marks and 4 stock tokens clicks every 1.4 s, the view lags the eye (parallax −0.55).
       HTML layer with a static CSS mask (the EYE path), transform-only, nothing runs off screen. Refs xai:03-message-bots-1440-f1, Raycast 8df169fc, Anthropic customers 47dd61f0, Cofounder 4a9ef501 */
    const ok = $("#okGiant");
    if (ok) {
      let blink = () => {};
      const g = M.mount(ok, { seed: 1, sleep: !reduced, noSquint: true, gap: 4000, breathe: false, blink: () => blink() });   // V1-8: look/blink no more than once in 4 s
      const L = [["m", "claude-color"], ["m", "gemini-color"], ["s", "NVDA"], ["m", "deepseek-color"], ["m", "qwen-color"], ["s", "TSLA"], ["m", "mistral-color"], ["m", "meta-color"], ["s", "AAPL"], ["m", "kimi-color"], ["m", "zhipu-color"], ["s", "GOOGL"]];
      const src = ([k, f]) => KF.asset(k === "m" ? `/img/models/${f}.svg` : `/img/stocks/${f}.webp`);   // X2-F6: 128 px marks for a 72 px window (density ≥ 1 on DPR 2)
      const lid = $(".kmc-l", ok);
      lid.insertAdjacentHTML("beforeend", `<span class="km-win" aria-hidden="true"><span class="kw-col">${L.map((x) => `<span class="kw-c${x[0] === "s" ? " stk" : ""}"><img data-src="${src(x)}" alt="" width="40" height="40" decoding="async"></span>`).join("")}</span></span>`);
      const col = $(".kw-col", ok);
      near(ok, () => $$("img", col).forEach((im) => { im.src = im.dataset.src; if (im.decode) im.decode().catch(() => {}); }), "300px");   // loaded and decoded ahead (IO 300 px): not in the first load, no 100 ms frame at the first step
      if (!reduced) {
        let n = 0, timer = 0, vis = false, raf = 0, mx = 0, my = 0;
        const imgs = $$("img", col), dur = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--dur-follow")) || 0;
        blink = () => { const im = imgs[n]; if (im) im.animate([{ opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }], { duration: dur }); };   // X3-F7: the logo dips, the keyhole never squashes
        const step = () => { n = (n + 1) % L.length; col.style.setProperty("--n", n); timer = setTimeout(step, 2400); };   // V1-8: 1400 → 2400 ms
        new IntersectionObserver((e) => {
          vis = e[0].isIntersecting; clearTimeout(timer);
          if (vis) { g.wake(); timer = setTimeout(step, 1100); }
        }, { threshold: 0.35 }).observe(ok);
        addEventListener("pointermove", (ev) => {
          if (!vis || ev.pointerType === "touch") return; mx = ev.clientX; my = ev.clientY;
          if (!raf) raf = requestAnimationFrame(() => { raf = 0; const r = ok.getBoundingClientRect(), gx = Math.max(-7, Math.min(7, (mx - r.left - r.width / 2) / 55));
            col.style.setProperty("--px", (-0.55 * gx * r.width / 100).toFixed(1) + "px"); });
        }, { passive: true });
      }
    }
    /* WOW-05 «the last line»: the outline key draws itself in 1 css px when ≥ 60 % of it is on screen, then looks at «Connect to Claude»; hover on a CTA → a turn in the lock
       (Linear 404 b9c222c4, Linear brand 183fc84a, xai:10-final-cta-1440-f1) */
    const cg = $("#ctaGiant");
    if (cg) {
      const g = M.mount(cg, { cls: "outline", seed: 2, hover: false, draw: true, noSquint: true });   // V1-9 (X3-F8): no squint in the outline mode — only the gaze and a turn
      const cta = $$("#start .hero-cta .btn");
      if (reduced || !("IntersectionObserver" in window)) cg.classList.add("drawn", "settled");
      else {
        const io = new IntersectionObserver((e) => { if (!e[0].isIntersecting) return; io.disconnect(); cg.classList.add("drawn"); setTimeout(() => { cg.classList.add("settled"); g.gazeAt(cta[0], 900); }, 1700); }, { threshold: 0.6 });
        io.observe(cg);
        cta.forEach((b) => b.addEventListener("pointerenter", () => { g.gazeAt(b, 900); if (b === cta[0]) g.turn([170, 300]); }));
      }
    }
  }
})();
