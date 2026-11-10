/* Keydex AI mascot A "Keyhole" — compositor engine (research/premium/v2/PLAN-v2.md W0-1, prototype v2/motion/kmc.js).
   Shape: research/shots/mascot-v2-board.html, picked by the owner 28.10 — BODY/EYE byte for byte as before.
   API: window.KFMascot = { svg(cls), mount(host, opts) → { pulse(), look(x,y,ms), wake(), turn([in,out]), gazeAt(el,ms), squint(hold,level) } }.
   Nothing runs per frame in JS: breathing = CSS animation, gaze = CSS transition, squint / turn / wake = WAAPI on HTML wrappers
   (transform / opacity only, compositor). JS only re-targets: ~1 timer per look step, one rAF per pointermove.
   Off screen or tab hidden: timers cleared, breathing paused. Reduced motion: static face, eye open, no timers. No blur.
   Durations and curves are CSS tokens (base.css :root, C-motion §4) read once — no motion literals here (lint.py). */
(function () {
  const OFF = () => document.documentElement.dataset.motion === "off";   // V1-11: paused by the visitor
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches || /[?&]reduced=1/.test(location.search) || OFF();
  const BODY = "M37 4H63A20 20 0 0 1 83 24V42A20 20 0 0 1 63 62H56V72H65.5A2.5 2.5 0 0 1 68 74.5V77.5A2.5 2.5 0 0 1 65.5 80H56V85H61.5A2.5 2.5 0 0 1 64 87.5V90.5A2.5 2.5 0 0 1 61.5 93H56A3 3 0 0 1 53 96H47A3 3 0 0 1 44 93V62H37A20 20 0 0 1 17 42V24A20 20 0 0 1 37 4Z";
  const EYE = "M44.36 34.64A9.5 9.5 0 1 1 55.64 34.64L58.5 47Q58.8 49 56.8 49H43.2Q41.2 49 41.5 47Z";
  const SHAPE = `<g class="km-body"><path class="km-p" d="${BODY}"/><g class="km-eye"><g class="km-lid"><path class="km-i" d="${EYE}"/></g></g></g>`;
  const svg = (cls) => `<svg class="kmascot ${cls || ""}" viewBox="0 0 100 100" aria-hidden="true" focusable="false">${SHAPE}</svg>`; // static copy (404 fallback, og)

  /* motion tokens */
  const cs = getComputedStyle(document.documentElement);
  const tok = (n) => cs.getPropertyValue(n).trim();
  const ms = (n) => { const v = tok(n); return v.endsWith("ms") ? parseFloat(v) : parseFloat(v) * 1000; };
  const E = { back: tok("--ease-back"), backSoft: tok("--ease-back-soft"), cosIn: tok("--ease-cos-in"), out: tok("--ease-entry"), std: tok("--ease-std") };
  const D = { wake: ms("--dur-5"), tin: ms("--dur-turn-in"), tout: ms("--dur-turn-out"), sq: ms("--dur-squint"), hov: ms("--dur-1") };
  const SQ_IN = D.sq * 0.2, SQ_OUT = D.sq * 0.3667, SQ_HOLD = D.sq - SQ_IN - SQ_OUT; // 120 / 260 / 220 of 600

  /* look-around script: keyhole offset (% of box), hold ms — deterministic choreography, not an animation duration */
  const LOOK = [[0, 0, 1600], [-6, -1.5, 1100], [-6, -1.5, 400], [6, -2.5, 1300], [1, 2.5, 900], [6.5, 1, 1200], [-3.5, 2.5, 1000], [0, -1, 1500]];
  const SQ = [2800, 4100, 1900, 4600, 3300];
  const all = [];
  let mx = 0, my = 0, lastMove = -1e9, rafQ = 0;
  const NOOP = { pulse() {}, look() {}, wake() {}, turn() {}, gazeAt() {}, squint() {} };

  function make(host, o = {}) {
    const cls = o.cls || "", pl = o.draw ? ' pathLength="1"' : "";   // draw: outline drawn by stroke-dashoffset 1 → 0 (WOW-05)
    host.innerHTML = `<span class="kmc"><span class="kmc-t"><span class="kmc-b"><svg class="kmascot ${cls}" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path class="km-p" d="${BODY}"${pl}/></svg>` +
      `<span class="kmc-e"><span class="kmc-l"><svg class="kmascot ${cls}" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path class="km-i" d="${EYE}"${pl}/></svg></span></span></span></span></span>`;
    const root = host.firstChild, t = root.querySelector(".kmc-t"), e = root.querySelector(".kmc-e"), l = root.querySelector(".kmc-l"), eyeSvg = l.firstChild;
    const st = { host, root, t, e, l, eyeSvg, seed: o.seed || 0, li: 0, si: o.seed || 0, visible: false, follow: o.follow !== false, asleep: !!o.sleep, forcedUntil: 0, tmLook: 0, tmSq: 0, gx: 0, gy: 0, rect: null };
    root.querySelector(".kmc-b").style.setProperty("--kmc-ph", `${-((st.seed * 900) % 2700)}ms`);
    const gaze = (x, y) => { x = Math.round(x * 10) / 10; y = Math.round(y * 10) / 10; if (x === st.gx && y === st.gy) return; st.gx = x; st.gy = y; e.style.transform = `translate(${x}%,${y}%)`; };
    st.gaze = gaze;
    function lookStep() {           // idle look-around: one style write per step, the compositor eases it
      clearTimeout(st.tmLook); if (!st.visible || REDUCED || st.asleep || OFF()) return;
      const now = performance.now();
      if (now < st.forcedUntil || (st.follow && now - lastMove < 2500)) { st.tmLook = setTimeout(lookStep, Math.max(600, o.gap || 0)); return; }
      root.classList.remove("fol");
      st.li = (st.li + 1) % LOOK.length; gaze(LOOK[st.li][0], LOOK[st.li][1]);
      st.tmLook = setTimeout(lookStep, Math.max(LOOK[st.li][2], o.gap || 0));   // o.gap: a big mascot looks around no more often than that (X2-F5)
    }
    function sqStep() { clearTimeout(st.tmSq); if (!st.visible || REDUCED || OFF()) return; if (!st.asleep) api.squint(); st.si = (st.si + 1) % SQ.length; st.tmSq = setTimeout(sqStep, Math.max(SQ[st.si], o.gap || 0)); }
    if (o.idle === false || o.breathe === false) root.classList.add("still");   // small marks (pill, Approve, trial button): no breathing, no look-around — they only turn on cue
    function setVisible(v) {
      st.visible = v; root.classList.toggle("zz", !v || document.hidden);
      clearTimeout(st.tmLook); clearTimeout(st.tmSq);
      if (v && !REDUCED && !document.hidden && o.idle !== false) { st.rect = null; st.tmLook = setTimeout(lookStep, LOOK[st.li][2]); st.tmSq = setTimeout(sqStep, 1400 + st.seed * 650); }
    }
    st.setVisible = setVisible;
    const api = {
      /* X3-F3 / PLAN-v3 §0: asleep = face on, eye squinting (never edge-on on a finished page); wake = the eye opens, then a quarter-turn nod */
      wake() { if (REDUCED || !st.asleep) return; st.asleep = false; l.style.transform = "";
        if (o.noSquint) { api.turn([150, 260]); if (st.visible) setVisible(true); return; }
        l.animate([{ transform: "scaleY(.22)" }, { transform: "scaleY(1)" }], { duration: SQ_OUT, easing: E.out, fill: "backwards" });
        setTimeout(() => { const T = 410; t.animate([{ transform: "scaleX(1)", easing: E.cosIn }, { transform: "scaleX(.72)", offset: .37, easing: E.backSoft }, { transform: "scaleX(1)" }], { duration: T }); }, SQ_OUT);   // a nod, not a full turn: the face stays a face (≥ .7 wide)
        if (st.visible) setVisible(true); },
      turn(d) { if (REDUCED) return; const [a, b] = d || [D.tin, D.tout], T = a + b, k = a / T;
        t.animate([{ transform: "scaleX(1)", easing: E.cosIn }, { transform: "scaleX(.1)", offset: k, easing: E.backSoft }, { transform: "scaleX(1)" }], { duration: T });
        eyeSvg.animate([{ opacity: 1 }, { opacity: 1, offset: k * .75 }, { opacity: 0, offset: k * .76 }, { opacity: 0, offset: k + (1 - k) * .3 }, { opacity: 1, offset: k + (1 - k) * .31 }, { opacity: 1 }], { duration: T }); },
      look(x, y, d = 700) { if (REDUCED) return; st.forcedUntil = performance.now() + d; root.classList.remove("fol"); gaze(x, y); },
      gazeAt(target, d = 900) { if (REDUCED || !target) return; const r = root.getBoundingClientRect(), q = target.getBoundingClientRect();
        const dx = q.left + q.width / 2 - (r.left + r.width / 2), dy = q.top + q.height / 2 - (r.top + r.height / 2), n = Math.hypot(dx, dy) || 1; api.look(7 * dx / n, 3.2 * dy / n, d); },
      /* o.noSquint (the WOW-04 giant: a logo lives in the keyhole): a blink is o.blink() — the logo dips, the keyhole keeps its shape (X3-F7) */
      squint(hold = SQ_HOLD, level = 0.3) { if (REDUCED) return; if (o.noSquint) { if (o.blink) o.blink(); return; } const T = SQ_IN + SQ_OUT + hold;
        l.animate([{ transform: "scaleY(1)", easing: E.cosIn }, { transform: `scaleY(${level})`, offset: SQ_IN / T }, { transform: `scaleY(${level})`, offset: (SQ_IN + hold) / T, easing: E.out }, { transform: "scaleY(1)" }], { duration: T }); },
      pulse() { api.turn(); },
    };
    if (st.asleep && !REDUCED && !o.noSquint) l.style.transform = "scaleY(.22)";
    if ("IntersectionObserver" in window) new IntersectionObserver((en) => setVisible(en[en.length - 1].isIntersecting)).observe(host); else setVisible(true);
    if (o.hover !== false && o.hoverTurn !== false) {
      host.addEventListener("pointerenter", () => { api.turn(); if (o.noSquint) return; st.hov = l.animate([{ transform: "scaleY(1)" }, { transform: "scaleY(.45)" }], { duration: D.hov, easing: E.out, fill: "forwards" }); });
      host.addEventListener("pointerleave", () => { if (st.hov) { st.hov.reverse(); st.hov = null; } });
    }
    all.push(st);
    return REDUCED ? NOOP : api;
  }

  /* cursor follow: one rAF per pointer move (coalesced), only for visible mascots; nothing while the pointer rests */
  addEventListener("pointermove", (ev) => { if (ev.pointerType === "touch" || OFF()) return; mx = ev.clientX; my = ev.clientY; lastMove = performance.now(); if (!REDUCED && !rafQ) rafQ = requestAnimationFrame(follow); }, { passive: true });
  addEventListener("scroll", () => all.forEach((s) => (s.rect = null)), { passive: true });
  addEventListener("resize", () => all.forEach((s) => (s.rect = null)), { passive: true });
  document.addEventListener("visibilitychange", () => all.forEach((s) => s.setVisible(s.visible)));
  function follow() {
    rafQ = 0; const now = performance.now();
    for (const s of all) {
      if (!s.visible || !s.follow || s.asleep || now < s.forcedUntil) continue;
      const r = s.rect || (s.rect = s.root.getBoundingClientRect()), cx = r.x + r.width / 2, cy = r.y + r.height / 2;
      s.root.classList.add("fol");
      s.gaze(Math.max(-7, Math.min(7, (mx - cx) / 55)), Math.max(-3, Math.min(3, (my - cy) / 80)));
    }
  }

  window.KFMascot = { svg, mount: (host, opts = {}) => make(host, opts), REDUCED, BODY, EYE };
  document.querySelectorAll("[data-mascot]").forEach((h, i) => { h.kfm = make(h, { seed: i, cls: h.dataset.mascot || "", sleep: h.hasAttribute("data-mascot-sleep"), draw: h.hasAttribute("data-mascot-draw"), noSquint: h.hasAttribute("data-mascot-draw") }); });   // X3-F8: an outline mascot never squints (the 1 px line would break)
})();
