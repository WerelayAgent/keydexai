/* Keydex AI — "Connect to Claude / OpenAI" modals. Trial key: POST /api/trial -> {key, expires_at, allowance {type: free, period: daily, remaining, resets_at}, models_count, example_model} — no sums shown (owner 07.11) */
(function () {
  const { $, $$, api, str, store, openModal, esc, fmt, busy, tabs } = window.KF;
  const ORIGIN = window.KF.site();
  const PH = "YOUR_KEYDEX_KEY";
  let trial = null;
  try { trial = JSON.parse(store.get("kf.trial") || "null"); } catch (e) { trial = null; }
  if (trial && trial.expires_at && trial.expires_at * 1000 < Date.now()) trial = null;

  const keySpan = (k) => k ? `<span class="key">${esc(k)}</span>` : `<span class="key ph">${PH}</span>`;
  const s = (x) => `<span class="s">${x}</span>`;
  const TPL = {
    url: (k) => `${esc(ORIGIN)}/mcp?key=${keySpan(k)}`,
    cli: (k) => `claude mcp add -s user \\\n  --transport http Keydex AI \\\n  ${esc(ORIGIN)}/mcp \\\n  --header ${s(`"Authorization: Bearer ${keySpan(k)}"`)}`,
    json: (k) => `{\n  ${s('"type"')}: ${s('"mcp"')},\n  ${s('"server_label"')}: ${s('"Keydex AI"')},\n  ${s('"server_url"')}: ${s(`"${esc(ORIGIN)}/mcp"`)},\n  ${s('"headers"')}: {\n    ${s('"Authorization"')}: ${s(`"Bearer ${keySpan(k)}"`)}\n  },\n  ${s('"require_approval"')}: ${s('"never"')}\n}`,
  };

  function render(modal, landing) {
    const k = trial && trial.key;
    /* PD С1: every code line is its own block with a hanging indent — a wrapped key stands under its line, not in column 0 (owner-eye №8: the key stays whole) */
    const lines = (h) => { const L = h.split("\n"); return L.map((l, i) => `<span class="ln" style="--in:${l.match(/^ */)[0].length + 2}">${l}${i < L.length - 1 ? "\n" : ""}</span>`).join(""); };
    $$("pre[data-tpl]", modal).forEach((pre) => { const h = TPL[pre.dataset.tpl](landing ? null : k); pre.innerHTML = pre.dataset.tpl === "url" ? h : lines(h); });   // landing: placeholders stay for the WOW-03 cascade
    $("[data-need]", modal).hidden = !!k && !landing; $("[data-have]", modal).hidden = !k || !!landing;
    if (!landing) $("[data-need]", modal).classList.remove("gone");
    if (k) {
      if (!landing) $("[data-keyval]", modal).textContent = k;
      const parts = [];
      const n = trial.models_count ?? (Array.isArray(trial.models) ? trial.models.length : null);
      if (fmt.known(n)) parts.push(str("s-trial-models", "{n}").replace("{n}", fmt.int(n)));
      $("[data-keymeta]", modal).textContent = parts.join(" · ");
      const exp = $("[data-keyexp]", modal);
      if (exp && trial.expires_at) { if (!exp.dataset.tpl) exp.dataset.tpl = exp.textContent; exp.textContent = exp.dataset.tpl.replace("{time}", fmt.utcd(new Date(trial.expires_at * 1000))); }
    }
  }

  async function getTrial(modal, btn) {
    const err = $("[data-err]", modal);
    err.hidden = true; window.KF.cutting(btn, true);
    const r = await api("/api/trial", { method: "POST", body: {} });
    window.KF.cutting(btn, false);
    if (r.ok && r.data && r.data.key) {
      trial = { key: r.data.key, expires_at: r.data.expires_at, allowance: r.data.allowance, models_count: r.data.models_count, example_model: r.data.example_model };
      store.set("kf.trial", JSON.stringify(trial));
      $$(".modal[data-provider]").forEach((m) => render(m, m === modal));
      window.KF.birth($(".cx-key", modal), trial.key, () => render(modal));   // WOW-03: the key is born in this modal and lands in its snippets
      return;
    }
    if (r.status === 429) {
      /* X4-M4: one behaviour with /connect — the line replaces the hint, the sign-in takes the button's place; X1-M8: focus goes there */
      $$(".modal[data-provider]").forEach((m) => { $("[data-trial]", m).hidden = true; const a = $(".cx-signin", m); if (a) { a.className = "btn btn-sm btn-1"; a.textContent = str("s-signin-cta", a.textContent); } $(".cx-need-txt .modal-text", m).textContent = window.KF.trialLimit(r); });
      const a = $(".cx-signin", modal); if (a) a.focus();
      window.KF.live(window.KF.trialLimit(r));   // X1-M12
      return;
    }
    err.textContent = (r.error && r.error.message) || str("s-error", "The request didn’t go through.");
    err.hidden = false;
  }

  $$(".modal[data-provider]").forEach((modal) => {
    render(modal);
    tabs($('[role="tablist"]', modal), (t) => $$("[data-panel]", modal).forEach((p) => { p.hidden = p.dataset.panel !== t.dataset.tab; }), $$("[data-panel]", modal));
    modal.addEventListener("modal:open", () => window.KF.reserveKey(modal));   // X3-Н1: the key lands, nothing below moves
    $("[data-trial]", modal).addEventListener("click", (e) => getTrial(modal, e.currentTarget));
  });

  /* WOW-01: the hero buttons let the Keyhole turn in the lock first (320 ms), every other entry point opens at once */
  $$("[data-connect]").forEach((b) => b.addEventListener("click", () => { const hero = !window.KF.reduced && b.closest(".hero"); setTimeout(() => openModal("m-" + b.dataset.connect), hero ? 320 : 0); }));
  window.KF.openConnect = (p) => openModal("m-" + p);
  let rz = 0; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => $$(".modal[data-provider].open").forEach((m) => window.KF.reserveKey(m)), 120); }, { passive: true });
})();
