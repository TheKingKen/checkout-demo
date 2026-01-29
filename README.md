# checkout-demo
Demo for Checkout.com Technical Assessment

## About This Project

This is a **Node.js/JavaScript** demonstration of Checkout.com's Hosted Payments Page (HPP) integration. It showcases how to integrate Checkout.com payment processing in a web application using Express.js backend and vanilla JavaScript frontend.

**Important:** This repository is specific to Node.js implementations. If you have questions about other Checkout.com SDKs or technologies, please refer to:

- **Java SDK**: [checkout/checkout-sdk-java](https://github.com/checkout/checkout-sdk-java) - For Java implementation questions, please file issues there
- **Other SDKs**: Visit [Checkout.com Developer Portal](https://www.checkout.com/docs) for other language implementations
- **General API Questions**: Refer to [Checkout.com API Documentation](https://api-reference.checkout.com/)

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

