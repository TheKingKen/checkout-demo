# Copilot Instructions for checkout-demo

## Project Overview
This is a minimal **e-commerce checkout integration** demo for Checkout.com's Hosted Payments Page (HPP) API. It demonstrates a Node.js Express backend paired with a browser-based checkout form. The codebase enables regional pricing (HKD for Hong Kong, EUR for Netherlands) with dynamic payment method selection.

## Architecture Highlights

### Client-Server Data Flow
1. **Frontend** (`public/app.js`, `public/index.html`): Collects customer data + country selection
2. **Backend** (`server.js`): Creates payment link via Checkout.com API, returns redirect URL
3. **External**: Checkout.com HPP handles actual payment processing

### Key Design Patterns
- **Environment-based secrets**: `CK_SECRET` and `PROCESSING_CHANNEL_ID` stored in `.env` (never committed)
- **Country-driven logic**: Determines pricing, currency, and available payment methods (e.g., iDEAL for Netherlands)
- **Error resilience**: Both frontend and backend parse responses defensively—backend API errors bubble up with full details for debugging
- **Frontend-to-backend payload**: Customer form data transformed to Checkout.com request format on the backend

## Critical Files & Responsibilities

| File | Purpose |
|------|---------|
| `server.js` | Express server, HPP endpoint creation, environment config |
| `public/app.js` | Form submission, price/currency toggling, error handling |
| `public/index.html` | Two-country radio toggle, form fields (name, email, phone, address) |
| `.env` | Secret key + channel ID (local only, never versioned) |

## Developer Workflows

### Local Setup & Testing
```bash
npm install
# Create .env with CK_SECRET and PROCESSING_CHANNEL_ID
npm start  # Runs on http://localhost:4242
```

### Key Endpoints
- **POST `/create-payment-link`**: Body contains `{ country, customer, amount, currency, product }`. Returns `{ link }` to HPP on success, or `{ error, details }` on failure
- **GET `/`**: Serves `public/index.html`
- Static assets served from `public/` directory

## Common Patterns & Conventions

### Payment Amounts (Minor Units)
- Always in cents: `12900` = 129.00 HKD, `1500` = 15.00 EUR
- Frontend embeds amounts; backend mirrors them into Checkout.com request

### Country-Specific Logic
```javascript
if (country === 'NL') allow_payment_methods.push('ideal');
```
Dynamically configure payment methods—add here when supporting new countries.

### Error Handling
**Backend**: Try-catch logs full Checkout.com response (`err.response.data`), then returns `{ error, details }` for frontend consumption.
**Frontend**: Handles both JSON responses and unexpected text; falls back to alert dialog on network/parsing failure.

### Form Field Mapping
- HTML `name` attributes in `index.html` must match form-data access in `app.js` (e.g., `form['customer-name']`)
- Backend expects nested object structure in request payload (see `server.js` line 24)

## Configuration & External Dependencies

- **axios** ^1.12.2: HTTP client for Checkout.com API
- **dotenv** ^17.2.2: Load `.env` file for secrets
- **express** ^5.1.0: Web framework
- **node-fetch**: Listed but not currently used (legacy import removed)

## When Working On This Codebase

1. **Adding new countries**: Update radio buttons in `index.html`, add amount/currency logic in `app.js`, conditionally add payment methods in `server.js`
2. **Modifying payment flow**: Both frontend (`/create-payment-link` fetch) and backend (request body shape) must stay in sync
3. **Testing without Checkout.com API**: Mock the `axios.post()` call in `server.js` to simulate API responses
4. **Debugging frontend**: Check network tab for actual request/response to `/create-payment-link`; console logs both client and server errors

## Known Issues & Debug Points

- Phone number regex strips non-digits on client (`/\D/g`); ensure international formats work
- Hardcoded port 4242; change in `.env` or `.gitignore` test values
- Success/failure/cancel URLs point to `localhost:4242`—update for production deployment
