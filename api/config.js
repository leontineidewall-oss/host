// public settings set by the team in Vercel. anything unset shows as "—" on the site.
const { ADDR, send } = require("./_lib");
const pick = v => { v = (v || "").trim(); return ADDR.test(v) ? v : null; };
module.exports = function (req, res) {
  send(res, 200, { mint: pick(process.env.HOST_MINT), giant: pick(process.env.GIANT_MINT), drop: pick(process.env.DROP_WALLET), customRpc: !!process.env.RPC_URL }, "public, s-maxage=60");
};
