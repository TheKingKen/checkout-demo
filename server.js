// server.js
// Node.js backend for Checkout.com Hosted Payments Page integration

const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

// Import fetch for Node.js (use axios for Checkout API calls instead)
let fetch;
try {
  fetch = require('node-fetch');
} catch (e) {
  // If node-fetch is not available, we'll use axios as fallback
  fetch = null;
}

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Replace with your Checkout.com sandbox secret key and processing channel ID
const CHECKOUT_SECRET_KEY = process.env.CK_SECRET;
const CHECKOUT_PUBLIC_KEY = process.env.CK_PUBLIC;
const PROCESSING_CHANNEL_ID = process.env.PROCESSING_CHANNEL_ID;
console.log('Environment check - CK_SECRET exists:', !!CHECKOUT_SECRET_KEY);
console.log('Environment check - CK_PUBLIC exists:', !!CHECKOUT_PUBLIC_KEY);
console.log('Environment check - PROCESSING_CHANNEL_ID exists:', !!PROCESSING_CHANNEL_ID);

const HPP_API_URL = 'https://api.sandbox.checkout.com/hosted-payments';

app.post('/create-payment-link', async (req, res) => {
    const { country, customer, amount, currency, product } = req.body;

    // Dynamic logic: assign currency & payment methods based on country
    //let allow_payment_methods = ['card', 'applepay', 'googlepay'];
    let allow_payment_methods = ['card'];
    let billing = { address: { country } };
    /*if (country === 'NL') {
    /    allow_payment_methods.push('ideal');
    }*/

    // Prepare the payment request body
    const body = {
        amount: amount,                      // in minor units, e.g. cents
        currency: currency,
        reference: `ORDER-${Date.now()}`,
        billing: billing,
        customer: {
            name: customer.name,
            email: customer.email,
            phone: {
                country_code: customer.phone_country_code,
                number: customer.phone_number
            }
        },
        products: [
            {
                name: product.name,
                quantity: product.quantity,
                price: product.unit_price,
                reference: product.reference
            }
        ],
        "payment_method_configuration": {
            "card": {
            "store_payment_details": "enabled"
            }
        },
        "stored_card": {
            "customer_id": "cus_dbompbxe6gfuxosnb62bopwjnm"
        },
        processing_channel_id: PROCESSING_CHANNEL_ID,
        allow_payment_methods: allow_payment_methods,
        success_url: "http://localhost:4242/success.html",
        failure_url: "http://localhost:4242/failure.html",
        cancel_url: "http://localhost:4242/cancel.html",
        display_name: "iPhone Case Shop",
        description: `${product.name} (${country === 'HK' ? 'HKD' : 'USD'})`
    };

    try {
        /*const response = await fetch(HPP_API_URL, {
        //const response = await axios.post(HPP_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': CHECKOUT_SECRET_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });*/
        const response = await axios.post(HPP_API_URL, body, {
            headers: {
                Authorization: `Bearer ${CHECKOUT_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // Log full response for debugging
        console.log('Checkout payment-link response:', JSON.stringify(response.data, null, 2));

        /*if (!response.ok) {
            const error = await response.json();
            return res.status(500).json({ error });
        }

        const data = await response.json();
        if (data._links && data._links.redirect && data._links.redirect.href) {
            return res.json({ url: data._links.redirect.href });
        } else {
            return res.status(500).json({ error: 'No redirect URL in response', data });
        }*/
        const link = response.data && response.data._links && response.data._links.redirect && response.data._links.redirect.href;
        if (!link) {
          console.error('No redirect link in Checkout response:', JSON.stringify(response.data, null, 2));
          return res.status(500).json({ error: 'No redirect link returned from Checkout', details: response.data });
        }

        // Return only the link to the frontend
        return res.status(200).json({ link });
    } catch (err) {
        //return res.status(500).json({ error: error.message });
        // Log details for debugging
        console.error('Error creating payment link:', err.message);
        if (err.response) {
          console.error('Checkout API status:', err.response.status);
          console.error('Checkout API body:', JSON.stringify(err.response.data, null, 2));
        } else {
          console.error(err);
        }

        const details = err.response?.data || err.message || 'Unknown server error';
        return res.status(500).json({ error: 'Failed to create payment link', details });
    }
});

app.post("/create-payment-sessions", async (req, res) => {
  try {
    const { customer, amount, currency, product, country } = req.body;

    let enable_payment_methods = ['applepay', 'googlepay', 'alipay_hk'];
    let disable_payment_methods = ['card'];

    // Validate incoming payload
    if (!customer || !amount || !currency || !product) {
      return res.status(400).json({
        error: 'Invalid payload',
        details: 'Missing required fields: customer, amount, currency, or product'
      });
    }

    // Construct the payment session request body dynamically from the incoming payload
    const paymentSessionBody = {
      amount: amount,                        // in minor units (cents)
      currency: currency,
      reference: `ORDER-${Date.now()}`,
      description: `${product.name} (${currency})`,
      billing_descriptor: {
        name: customer.name,
        city: country || 'Unknown',
      },
      customer: {
        email: customer.email,
        name: customer.name,
      },
      shipping: {
        address: {
          address_line1: 'Shipping Address',
          country: country || 'HK',
        },
        phone: {
          number: customer.phone_number || '',
          country_code: customer.phone_country_code || '+852',
        },
      },
      billing: {
        address: {
          address_line1: 'Billing Address',
          country: country || 'HK',
        },
        phone: {
          number: customer.phone_number || '',
          country_code: customer.phone_country_code || '+852',
        },
      },
      risk: {
        enabled: true,
      },
      success_url: "http://localhost:4242/success.html",
      failure_url: "http://localhost:4242/failure.html",
      metadata: {
        product_reference: product.reference,
        product_quantity: product.quantity,
      },
      items: [
        {
          name: product.name,
          quantity: product.quantity,
          unit_price: product.unit_price,
        },
      ],
      //disabled_payment_methods: disable_payment_methods,
      processing_channel_id: PROCESSING_CHANNEL_ID
    };

    // Log the request for debugging
    console.log('Creating payment session with payload:', JSON.stringify(paymentSessionBody, null, 2));

    // Send request to Checkout.com API using axios
    const response = await axios.post(
      "https://api.sandbox.checkout.com/payment-sessions",
      paymentSessionBody,
      {
        headers: {
          Authorization: `Bearer ${CHECKOUT_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const paymentSession = response.data;

    // Log the response for debugging
    console.log('Payment session response:', JSON.stringify(paymentSession, null, 2));

    // Return the payment session to the frontend
    return res.status(200).json(paymentSession);

  } catch (error) {
    console.error('Error creating payment session:', error.message);
    if (error.response) {
      console.error('Checkout API status:', error.response.status);
      console.error('Checkout API body:', JSON.stringify(error.response.data, null, 2));
      return res.status(error.response.status).json({
        error: 'Failed to create payment session',
        details: error.response.data,
      });
    }
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
});

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'insurance-form.html'));
});

// Endpoint to provide Checkout public key to frontend
app.get('/api/checkout-config', (req, res) => {
    res.json({
        publicKey: CHECKOUT_PUBLIC_KEY || '',
        environment: 'sandbox'
    });
});

// For local testing
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
