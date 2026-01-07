# checkout-demo
Demo for Checkout.com Technical Assessment

## Cloudflared helper

This repository includes a small helper script that runs `cloudflared tunnel --url http://localhost:4242`, waits for the published `cfargotunnel` URL, and writes it to `~/.cloudflared/current_tunnel_url.txt` so the backend can expose it to the frontend via `/tunnel-url`.

Usage:

1. Make the helper script executable:

```bash
chmod +x ./scripts/run-cloudflared-capture.sh
```

2. Run the script in a separate terminal (it starts `cloudflared` in the background and waits for the public URL):

```bash
./scripts/run-cloudflared-capture.sh
```

3. After the script detects the public URL it writes the value to:

```text
~/.cloudflared/current_tunnel_url.txt
```

4. Verify from the repo root that your server endpoint returns the same URL:

```bash
cat ~/.cloudflared/current_tunnel_url.txt
curl http://localhost:4242/tunnel-url
```

Notes:
- If the script times out waiting for the `cfargotunnel` URL, inspect the log at `~/.cloudflared/cloudflared-capture.log`.
- Run the script in a terminal you can keep open while testing, or use a terminal multiplexer / background job manager.

