// find a solana coin to try as the giant: a mint address, or a name / ticker (DexScreener search)
const { ADDR, getJson, send, n } = require("./_lib");
const { pick } = require("./market");
function row(p) { return { mint: p.baseToken.address, symbol: String(p.baseToken.symbol || "").slice(0, 16), name: String(p.baseToken.name || "").slice(0, 40), priceUsd: n(p.priceUsd), marketCapUsd: n(p.marketCap != null ? p.marketCap : p.fdv), liquidityUsd: n(p.liquidity && p.liquidity.usd) }; }
module.exports = async function (req, res) {
  const q = String((req.query && req.query.q) || new URL(req.url, "http://x").searchParams.get("q") || "").trim().slice(0, 64);
  if (!q) return send(res, 400, { error: "q: a ticker, name or mint" });
  try {
    if (ADDR.test(q)) { const m = pick(await getJson("https://api.dexscreener.com/tokens/v1/solana/" + q), q); return send(res, 200, { results: m ? [{ mint: m.mint, symbol: m.symbol, name: "", priceUsd: m.priceUsd, marketCapUsd: m.marketCapUsd, liquidityUsd: m.liquidityUsd }] : [] }, "public, s-maxage=60"); }
    const j = await getJson("https://api.dexscreener.com/latest/dex/search?q=" + encodeURIComponent(q));
    const seen = new Set(), out = [];
    (j.pairs || []).filter(p => p && p.chainId === "solana" && p.baseToken && ADDR.test(p.baseToken.address))
      .sort((a, b) => ((b.liquidity && b.liquidity.usd) || 0) - ((a.liquidity && a.liquidity.usd) || 0))
      .forEach(p => { if (seen.has(p.baseToken.address) || out.length >= 6) return; seen.add(p.baseToken.address); out.push(row(p)); });
    send(res, 200, { results: out }, "public, s-maxage=60");
  } catch (e) { send(res, 502, { error: "market data unavailable" }); }
};
