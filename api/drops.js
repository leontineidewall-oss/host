// every airdrop round so far, read from the drop wallet's own history. ?w= adds what one wallet received.
const { ADDR, send } = require("./_lib");
const { rpc, pool } = require("./_rpc");
const { MEMO, parseDrop, rounds } = require("./_drops");
module.exports = async function (req, res) {
  const q = req.query || Object.fromEntries(new URL(req.url, "http://x").searchParams);
  const drop = (process.env.DROP_WALLET || "").trim(), g = (process.env.GIANT_MINT || "").trim(), w = String(q.w || "");
  if (!ADDR.test(drop) || !ADDR.test(g)) return send(res, 200, { live: false }, "public, s-maxage=60");
  if (w && !ADDR.test(w)) return send(res, 400, { error: "w: one wallet address" });
  try {
    let sigs = [], before = null;
    for (let p = 0; p < 3; p++) {
      const opt = { limit: 1000 }; if (before) opt.before = before;
      const r = await rpc("getSignaturesForAddress", [drop, opt]);
      sigs = sigs.concat(r || []);
      if (!r || r.length < 1000) break;
      before = r[r.length - 1].signature;
    }
    const hits = sigs.filter(s => !s.err && s.memo && MEMO.test(s.memo)).slice(0, 400);
    const txs = await pool(hits, 8, s => rpc("getTransaction", [s.signature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0, commitment: "confirmed" }]));
    const parsed = txs.map(tx => parseDrop(tx, g, drop)), memos = hits.map(s => Number(MEMO.exec(s.memo)[1]));
    const list = rounds(parsed, memos, w || null);
    const all = new Set(); parsed.forEach(p => p && p.got.forEach(([k]) => all.add(k)));
    send(res, 200, { live: true, rounds: list.slice(0, 100), total: list.reduce((s, r) => s + r.amount, 0), recipients: all.size, received: w ? list.reduce((s, r) => s + (r.mine || 0), 0) : undefined,
      partial: hits.length >= 400 || sigs.length >= 3000, fetchedAt: new Date().toISOString() }, w ? "no-store" : "public, s-maxage=60, stale-while-revalidate=120");
  } catch (e) { send(res, 502, { error: "chain data unavailable" }); }
};
