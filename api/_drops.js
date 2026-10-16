// a drop is any successful tx from the drop wallet whose memo says "host:drop:<round>".
// it counts the giant tokens that left the drop wallet and every other owner whose giant balance went up.
const MEMO = /host:drop:(\d{1,9})\b/;
function deltas(tx, mint) {
  const d = new Map(), add = (b, s) => { if (!b || b.mint !== mint || !b.owner) return; d.set(b.owner, (d.get(b.owner) || 0) + s * Number(b.uiTokenAmount.uiAmountString || 0)); };
  (tx.meta.preTokenBalances || []).forEach(b => add(b, -1));
  (tx.meta.postTokenBalances || []).forEach(b => add(b, 1));
  return d;
}
function parseDrop(tx, mint, wallet) {
  if (!tx || !tx.meta || tx.meta.err) return null;
  const d = deltas(tx, mint), out = -(d.get(wallet) || 0);
  if (!(out > 0)) return null;
  const got = [];
  d.forEach((v, k) => { if (k !== wallet && v > 1e-12) got.push([k, v]); });
  if (!got.length) return null;
  return { sig: tx.transaction.signatures[0], t: tx.blockTime || 0, amount: out, got };
}
// rounds: [{round, t, amount, recipients, txs}], newest first; mine: what one wallet got per round
function rounds(parsed, memos, me) {
  const by = new Map();
  parsed.forEach((p, i) => {
    if (!p) return;
    const r = memos[i], o = by.get(r) || { round: r, t: p.t, amount: 0, who: new Set(), txs: 0, mine: 0 };
    o.t = Math.min(o.t || p.t, p.t); o.amount += p.amount; o.txs++;
    p.got.forEach(([k, v]) => { o.who.add(k); if (me && k === me) o.mine += v; });
    by.set(r, o);
  });
  return Array.from(by.values()).map(o => ({ round: o.round, t: o.t, amount: o.amount, recipients: o.who.size, txs: o.txs, mine: me ? o.mine : undefined }))
    .sort((a, b) => b.t - a.t || b.round - a.round);
}
module.exports = { MEMO, parseDrop, rounds };
