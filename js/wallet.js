/* Keydex AI — Solana browser wallets (Phantom, Solflare, Backpack) */
(function () {
  const CHAIN = "solana", CHAIN_HEX = "solana";
  const found = new Map();
  const subs = [];
  function scanSolana() {
    const out = [];
    const ph = (window.phantom && window.phantom.solana) || (window.solana && window.solana.isPhantom ? window.solana : null);
    if (ph) out.push({ info: { uuid: "phantom", name: "Phantom", icon: "" }, provider: ph });
    const sf = window.solflare || (window.solana && window.solana.isSolflare ? window.solana : null);
    if (sf && !out.some((x) => x.provider === sf)) out.push({ info: { uuid: "solflare", name: "Solflare", icon: "" }, provider: sf });
    const bp = (window.backpack && window.backpack.solana) || window.backpack || (window.solana && window.solana.isBackpack ? window.solana : null);
    if (bp && !out.some((x) => x.provider === bp)) out.push({ info: { uuid: "backpack", name: "Backpack", icon: "" }, provider: bp });
    if (!out.length && window.solana) out.push({ info: { uuid: "solana", name: "Solana Wallet", icon: "" }, provider: window.solana });
    out.forEach((w) => found.set(w.info.uuid, w));
    return out;
  }
  const list = () => { scanSolana(); return [...found.values()]; };
  const first = () => (list()[0] || {}).provider || window.solana || null;
  const links = (url) => ({
    phantom: "https://phantom.app/ul/browse/" + encodeURIComponent(url),
    solflare: "https://solflare.com/ul/v1/browse/" + encodeURIComponent(url),
  });
  const hex = (n) => String(n || "solana");
  async function toChain() { return true; }
  async function receiptOf() { return null; }
  const receipt = async () => true;
  window.KF.wallet = { CHAIN, CHAIN_HEX, list, first, links, hex, toChain, receipt, receiptOf, onFound: (f) => subs.push(f) };
})();
