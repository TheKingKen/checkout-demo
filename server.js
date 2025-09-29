// server.js
// Node.js backend for Checkout.com Hosted Payments Page integration

const express = require('express');
//const fetch = require('node-fetch');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Replace with your Checkout.com sandbox secret key and processing channel ID
const CHECKOUT_SECRET_KEY = process.env.CK_SECRET;
const PROCESSING_CHANNEL_ID = process.env.PROCESSING_CHANNEL_ID;


const HPP_API_URL = 'https://api.sandbox.checkout.com/hosted-payments';

app.post('/create-payment-link', async (req, res) => {
    const { country, customer, amount, currency, product } = req.body;

    // Dynamic logic: assign currency & payment methods based on country
    let allow_payment_methods = ['card', 'applepay', 'googlepay'];
    let billing = { address: { country } };
    if (country === 'NL') {
        allow_payment_methods.push('ideal');
    }

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
        processing_channel_id: PROCESSING_CHANNEL_ID,
        allow_payment_methods: allow_payment_methods,
        success_url: "http://localhost:4242/success.html",
        failure_url: "http://localhost:4242/failure.html",
        cancel_url: "http://localhost:4242/cancel.html",
        display_name: "iPhone Case Shop",
        description: `${product.name} (${country === 'HK' ? 'HKD' : 'EUR'})`
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

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// For local testing
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
