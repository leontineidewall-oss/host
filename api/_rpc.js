// json-rpc helper and a small worker pool, shared by the api routes
const { UA } = require("./_lib");
const RPC = () => process.env.RPC_URL || "https://api.mainnet-beta.solana.com";
async function rpc(method, params) {
  const r = await fetch(RPC(), { method: "POST", headers: { "Content-Type": "application/json", "User-Agent": UA }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  const j = await r.json().catch(() => null);
  if (!j || j.error) throw new Error(method + " " + (j && j.error ? j.error.message : r.status));
  return j.result;
}
async function pool(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  async function w() { while (i < items.length) { const k = i++; for (let a = 0; a < 3; a++) { try { out[k] = await fn(items[k]); break; } catch (e) { out[k] = undefined; await new Promise(r => setTimeout(r, 300 * (a + 1))); } } } }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, w));
  return out;
}
module.exports = { rpc, pool };
