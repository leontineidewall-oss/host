// the giant right now: its top 20 holders (owner wallets, merged) and supply
const { ADDR, send } = require("./_lib");
const { rpc } = require("./_rpc");
module.exports = async function (req, res) {
  const g = (process.env.GIANT_MINT || "").trim();
  if (!ADDR.test(g)) return send(res, 200, { live: false }, "public, s-maxage=60");
  try {
    const [big, sup] = await Promise.all([rpc("getTokenLargestAccounts", [g]), rpc("getTokenSupply", [g])]);
    const accs = (big && big.value) || [], supply = Number(sup.value.uiAmountString || sup.value.uiAmount || 0);
    const info = accs.length ? await rpc("getMultipleAccounts", [accs.map(a => a.address), { encoding: "jsonParsed" }]) : { value: [] };
    const by = new Map();
    accs.forEach((a, i) => {
      const v = info.value[i], owner = v && v.data && v.data.parsed ? v.data.parsed.info.owner : a.address;
      by.set(owner, (by.get(owner) || 0) + Number(a.uiAmountString || a.uiAmount || 0));
    });
    const holders = Array.from(by, ([owner, amount]) => ({ owner, amount, pct: supply ? amount / supply * 100 : null })).sort((a, b) => b.amount - a.amount);
    send(res, 200, { live: true, mint: g, supply, holders, fetchedAt: new Date().toISOString() }, "public, s-maxage=60, stale-while-revalidate=120");
  } catch (e) { send(res, 502, { error: "chain data unavailable" }); }
};
