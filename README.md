# host

Pair with a giant. Half of $HOST's fees buy the giant and airdrop it to the giant's top holders.

## Env vars (Vercel → Settings → Environment Variables)

- `HOST_MINT`: the $HOST mint.
- `GIANT_MINT`: the paired giant's mint.
- `DROP_WALLET`: the wallet that sends the airdrops. Each drop tx carries the memo `host:drop:<round>`.
- `RPC_URL`: a Solana RPC (Helius recommended).

## Dev

`python3 build.py` builds index.html from src/. Tests: `node test/drops.js`, `node test/site.mjs`.
