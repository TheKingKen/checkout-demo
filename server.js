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
const PAYMENT_SESSIONS_API_URL = 'https://api.sandbox.checkout.com/payment-sessions';

const fs = require('fs');
const os = require('os');

// Helper: determine the correct base URL for redirect targets
// If the client is accessing via the public tunnel URL, use that for redirects.
// Otherwise, use the request origin (localhost) so redirects stay consistent with the client's access method.
function resolvePublicBase(req) {
  // Get the incoming request host
  const incomingHost = (req.get && req.get('host')) || (req.headers['host']) || '';
  
  // Try to read the public tunnel URL from the file
  let publicUrl = null;
  try {
    const cfgPath = path.join(os.homedir(), '.cloudflared', 'current_tunnel_url.txt');
    if (fs.existsSync(cfgPath)) {
      const raw = fs.readFileSync(cfgPath, 'utf8').trim();
      if (raw) publicUrl = raw.replace(/\/+$/,'');
    }
  } catch (err) {
    // ignore and fall back
  }

  // Check if the incoming request is already via the public tunnel URL
  // Extract the hostname from the public URL and compare with the incoming Host header
  if (publicUrl) {
    try {
      const publicUrlObj = new URL(publicUrl);
      const publicHost = publicUrlObj.host; // includes port if present
      
      // If the client accessed via the public URL, use it for redirects
      if (incomingHost.includes(publicHost) || incomingHost === publicHost) {
        return publicUrl;
      }
    } catch (e) {
      // ignore URL parse errors
    }
  }

  // Fallback: construct origin from the incoming request
  // This ensures redirects go back to the same place the client came from
  const protoHeader = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const proto = String(protoHeader).startsWith('http') ? protoHeader : 'http';
  const host = incomingHost || `localhost:${process.env.PORT || 4242}`;
  return `${proto}://${host}`;
}
app.post('/create-payment-link', async (req, res) => {
    const { country, customer, amount, currency, product, products } = req.body;

    // Backward compatibility: accept both product (singular) and products (array)
    const productList = products || (product ? [product] : []);
    
    if (!productList || productList.length === 0) {
        return res.status(400).json({ 
            error: 'Invalid payload', 
            details: 'Missing required field: product or products' 
        });
    }
    
    const firstProduct = productList[0];

  // Determine base URL for redirect targets (prefer public tunnel when available)
  const baseUrl = resolvePublicBase(req);

    // Dynamic logic: assign currency & payment methods based on country
    let allow_payment_methods = ['card', 'applepay', 'googlepay', 'alipay_hk', 'alipay_cn', 'tamara', 'octopus'];
    //let allow_payment_methods = ['card'];


    // let billing = { address: { country } };
    /*if (country === 'NL') {
    /    allow_payment_methods.push('ideal');
    }*/

    // Prepare the payment request body
    const body = {
        amount: amount,                      // in minor units, e.g. cents
        currency: currency,
        reference: `ORDER-${Date.now()}`,
        billing: {
            address: {
                address_line1: 'Billing Address',
                country: country || 'HK',
                city: 'Billing City'
            }
        },
        shipping: {
          address: {
            address_line1: 'Shipping Address',
            country: country || 'HK',
            city: 'Shipping City'
          },
          phone: {
            number: customer.phone_number || '',
            country_code: customer.phone_country_code || '+852',
          },
        },
        customer: {
            name: customer.name,
            email: customer.email,
            phone: {
                country_code: customer.phone_country_code,
                number: customer.phone_number
            }
        },
        products: productList.map(p => ({
            name: p.name,
            quantity: p.quantity,
            price: p.unit_price,
            reference: p.reference,
            unit_price: p.unit_price
        })),
        payment_type: `Regular`,
        // "payment_method_configuration": {
        //     "card": {
        //     "store_payment_details": "enabled"
        //     }
        // },
        // "stored_card": {
        //     "customer_id": "cus_dbompbxe6gfuxosnb62bopwjnm"
        // },
        processing_channel_id: PROCESSING_CHANNEL_ID,
        allow_payment_methods: allow_payment_methods,
        success_url: `${baseUrl}/success.html`,
        failure_url: `${baseUrl}/failure.html`,
        cancel_url: `${baseUrl}/cancel.html`,
        display_name: "iPhone Case Shop",
        description: `${firstProduct.name}${productList.length > 1 ? ` +${productList.length - 1} more` : ''} (${country === 'HK' ? 'HKD' : 'USD'})`
    };

    // Log the request payload for debugging
    console.log('=== /create-payment-link Request Payload ===');
    console.log(JSON.stringify(body, null, 2));
    console.log('==========================================');

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
        console.log('Checkout payment-link response:', JSON.stringify(body, null, 2));
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

// Card metadata lookup (BIN check) for pre-sale eligibility
app.post('/card-metadata', async (req, res) => {
  const { number, type, format, reference } = req.body || {};
  if (!number || typeof number !== 'string') {
    return res.status(400).json({ error: 'Missing card number' });
  }

  const sanitized = number.replace(/\D/g, '');
  if (sanitized.length < 6) {
    return res.status(400).json({ error: 'Card number must contain at least 6 digits' });
  }

  const payload = {
    source: {
      number: sanitized,
      type: type || 'card'
    },
    format: format || 'basic',
    reference: reference || `PRECHECK-${Date.now()}`
  };

  try {
    const response = await axios.post('https://api.sandbox.checkout.com/metadata/card',
      payload,
      {
        headers: {
          Authorization: `Bearer ${CHECKOUT_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const { scheme, card_type, issuer, issuer_country } = response.data || {};
    return res.json({ scheme, card_type, issuer, issuer_country });
  } catch (err) {
    console.error('Card metadata error:', err.message);
    if (err.response) {
      console.error('Checkout API status:', err.response.status);
      console.error('Checkout API body:', JSON.stringify(err.response.data, null, 2));
      return res.status(err.response.status).json({ error: 'Failed to fetch card metadata', details: err.response.data });
    }
    return res.status(500).json({ error: 'Failed to fetch card metadata', details: err.message });
  }
});

// Tokenize card for saved-card flow (server-side wrapper)
app.post('/tokenize-card', async (req, res) => {
  const { number, expiry_month, expiry_year, cvv, name } = req.body || {};
  if (!number || !expiry_month || !expiry_year || !cvv || !name) {
    return res.status(400).json({ error: 'Missing required card fields' });
  }

  if (!CHECKOUT_PUBLIC_KEY) {
    return res.status(500).json({ error: 'Checkout public key not configured' });
  }

  try {
    const response = await axios.post('https://api.sandbox.checkout.com/tokens',
      {
        type: 'card',
        number,
        expiry_month,
        expiry_year,
        cvv,
        name
      },
      {
        headers: {
          Authorization: `Bearer ${CHECKOUT_PUBLIC_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return res.json(response.data || {});
  } catch (err) {
    console.error('Tokenization error:', err.message);
    if (err.response) {
      console.error('Checkout API status:', err.response.status);
      console.error('Checkout API body:', JSON.stringify(err.response.data, null, 2));
      return res.status(err.response.status).json(err.response.data || { error: 'Tokenization failed' });
    }
    return res.status(500).json({ error: 'Tokenization failed', details: err.message });
  }
});

// Pay with stored card token
app.post('/pay-with-token', async (req, res) => {
  const { source, amount, currency, payment_type, reference, description } = req.body || {};
  
  console.log('=== Process Pay with Token Request ===');
  console.log(JSON.stringify(source, null, 2));

  if (!source || !source.type || !source.token || !amount || !currency) {
    return res.status(400).json({ error: 'Missing required payment fields' });
  }

  if (!CHECKOUT_SECRET_KEY) {
    return res.status(500).json({ error: 'Checkout secret key not configured' });
  }

  try {
    const paymentRequest = {
      source: {
        type: source.type,
        token: source.token
      },
      amount,
      currency,
      payment_type: payment_type || 'Regular',
      merchant_initiated: false
    };

    // Add optional fields
    if (reference) paymentRequest.reference = reference;
    if (description) paymentRequest.description = description;
    
    // Add 3DS settings if provided
    if (req.body['3ds']) {
      paymentRequest['3ds'] = req.body['3ds'];
    }

    console.log('Payment request:', JSON.stringify(paymentRequest, null, 2));

    const response = await axios.post('https://api.sandbox.checkout.com/payments',
      paymentRequest,
      {
        headers: {
          Authorization: `Bearer ${CHECKOUT_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Checkout.com response:', JSON.stringify(response.data, null, 2));
    return res.json(response.data || {});
  } catch (err) {
    console.error('Payment with token error:', err.message);
    if (err.response) {
      console.error('Checkout API status:', err.response.status);
      console.error('Checkout API body:', JSON.stringify(err.response.data, null, 2));
      return res.status(err.response.status).json(err.response.data || { error: 'Payment failed' });
    }
    return res.status(500).json({ error: 'Payment failed', details: err.message });
  }
});


app.post('/create-payment-link2', async (req, res) => {
    const { country, customer, amount, currency, product, products } = req.body;

    // Backward compatibility: accept both product (singular) and products (array)
    const productList = products || (product ? [product] : []);
    
    if (!productList || productList.length === 0) {
        return res.status(400).json({ 
            error: 'Invalid payload', 
            details: 'Missing required field: product or products' 
        });
    }
    
    const firstProduct = productList[0];

    let allow_payment_methods = ['applepay', 'googlepay', 'alipay_hk', 'alipay_cn'];
    // let allow_payment_methods = ['card','applepay', 'googlepay', 'alipay_hk', 'alipay_cn'];
    let disable_payment_methods = ['card'];

    // Determine base URL for redirect targets (prefer public tunnel when available)
    const baseUrl = resolvePublicBase(req);

    // Always use collect_consent - let Flow/HPP handle saved card display automatically
    const storePaymentDetails = 'collect_consent';
    
    console.log('Creating HPP link with store_payment_details:', storePaymentDetails);
    if (customer.id) {
        console.log('Customer ID provided:', customer.id, '- saved cards will be displayed if available');
    } else {
        console.log('No customer ID - new card form will be displayed');
    }

    // Prepare the payment request body
    const body = {
        amount: amount,                      // in minor units, e.g. cents
        currency: currency,
        reference: `ORDER-${Date.now()}`,
        billing: {
            address: {
                address_line1: 'Billing Address',
                country: country || 'HK',
            }
        },
        billing_descriptor: {
            name: customer.name,
            city: country || 'Unknown',
        },
        customer: {
            name: customer.name,
            email: customer.email,
            phone: {
                number: customer.phone_number || '',
                country_code: customer.phone_country_code || '+852',
            },
            ...(customer.id && { id: customer.id })  // Include customer.id if provided
        },
        /*shipping: {
            address: {
                address_line1: 'Shipping Address',
                country: country || 'HK',
            }
        },*/
        shipping: {
          address: {
            address_line1: 'Shipping Address',
            country: country || 'HK',
            city: 'Shipping City'
          },
          phone: {
            number: customer.phone_number || '',
            country_code: customer.phone_country_code || '+852',
          },
        },
        risk: {
            enabled: true,
        },
        products: productList.map(p => ({
            name: p.name,
            quantity: p.quantity,
            price: p.unit_price,
            reference: p.reference,
            unit_price: p.unit_price
        })),
        metadata: {
            products_count: productList.length,
            product_references: productList.map(p => p.reference).join(','),
        },
        payment_type: `Regular`,
        payment_method_configuration: {
            card: {
                store_payment_details: storePaymentDetails  // Always 'collect_consent'
            },
            ...(customer.id && {
                stored_card: {
                    customer_id: customer.id  // Display saved cards for this customer
                }
            })
        },
        processing_channel_id: PROCESSING_CHANNEL_ID,
        allow_payment_methods: allow_payment_methods,
        disable_payment_methods: disable_payment_methods,
        success_url: `${baseUrl}/success.html`,
        failure_url: `${baseUrl}/failure.html`,
        cancel_url: `${baseUrl}/cancel.html`,
        display_name: "Insurance Policy Payment",
        description: `${firstProduct.name}${productList.length > 1 ? ` +${productList.length - 1} more` : ''} (${currency})`
    };

    // Log the request payload for debugging
    console.log('=== /create-payment-link2 Request Payload ===');
    console.log(JSON.stringify(body, null, 2));
    console.log('=============================================');

    try {
        const response = await axios.post(HPP_API_URL, body, {
            headers: {
                Authorization: `Bearer ${CHECKOUT_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // Log full response for debugging
        console.log('Checkout payment-link response:', JSON.stringify(response.data, null, 2));

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
    const { customer, amount, currency, products, country, enable_payment_methods, disable_payment_methods } = req.body;

    // Use provided payment methods or default values
    let enabledMethods = enable_payment_methods || ['card', 'applepay', 'googlepay', 'alipay_hk', 'alipay_cn','tamara', 'octopus'];
    let disabledMethods = disable_payment_methods || [];

    console.log('enable payment methods:', enabledMethods);
    console.log('disable payment methods:', disabledMethods);

    // Validate incoming payload
    if (!customer || !amount || !currency || !products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        error: 'Invalid payload',
        details: 'Missing required fields: customer, amount, currency, or products (must be a non-empty array)'
      });
    }

    // Determine base URL for redirect targets (prefer public tunnel when available)
    const baseUrl = resolvePublicBase(req);

    // Always use Remember Me mode with collect_consent
    console.log('Payment session mode: Remember Me (RM)');
    const storePaymentDetails = 'collect_consent';
    console.log('Using collect_consent for Remember Me feature');

    // Construct the payment session request body dynamically from the incoming payload
    const paymentSessionBody = {
      amount: amount,                        // in minor units (cents)
      currency: currency,
      reference: `ORDER-${Date.now()}`,
      description: `${products[0].name}${products.length > 1 ? ` +${products.length - 1} more` : ''} (${currency})`,
      billing_descriptor: {
        name: customer.name,
        city: country || 'Unknown',
      },
      customer: {
        email: customer.email,
        name: customer.name,
        ...(customer.id && { id: customer.id }),  // Include customer.id if provided
      },
      shipping: {
        address: {
          address_line1: 'Shipping Address',
          country: country || 'HK',
          city: country || 'Unknown'
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
          city: country || 'Unknown'
        },
        phone: {
          number: customer.phone_number || '',
          country_code: customer.phone_country_code || '+852',
        },
      },
      risk: {
        enabled: true,
      },
      // redirect targets
      success_url: `${baseUrl}/success.html`,
      failure_url: `${baseUrl}/failure.html`,
      metadata: {
        products_count: products.length,
        product_references: products.map(p => p.reference).join(','),
      },
      items: products.map(product => ({
        name: product.name,
        quantity: product.quantity,
        unit_price: product.unit_price,
        reference: product.reference
      })),
      payment_type: `Regular`,
      payment_method_configuration: {
        card: {
          store_payment_details: storePaymentDetails  // Always 'collect_consent' for Remember Me
        },
        ...(customer.id && {
          stored_card: {
            customer_id: customer.id  // Display saved cards for this customer
          }
        })
      },
      enabled_payment_methods: enabledMethods,
      ...(disabledMethods.length > 0 && { disabled_payment_methods: disabledMethods }),
      processing_channel_id: PROCESSING_CHANNEL_ID
    };

    // Log the request for debugging
    console.log('=== Payment Session Configuration ===');
    console.log('Mode: Remember Me (RM)');
    console.log('store_payment_details:', storePaymentDetails);
    if (customer.id) {
        console.log('Customer ID:', customer.id, '- saved cards will be displayed if available');
    } else {
        console.log('No customer ID - new customer, Remember Me consent will be shown');
    }
    console.log('=====================================');
    console.log('Payment session request payload:', JSON.stringify(paymentSessionBody, null, 2));

    // Send request to Checkout.com API using axios
    const response = await axios.post(
      PAYMENT_SESSIONS_API_URL,
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

// Endpoint to get payment details from Checkout.com
app.get('/get-payment-details/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    console.log('Fetching payment details for:', paymentId);
    
    const response = await axios.get(
      `https://api.sandbox.checkout.com/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${CHECKOUT_SECRET_KEY}`
        }
      }
    );
    
    console.log('Payment details retrieved successfully');
    return res.json(response.data);
  } catch (error) {
    console.error('Error fetching payment details:', error.message);
    if (error.response) {
      console.error('Checkout API status:', error.response.status);
      console.error('Checkout API body:', JSON.stringify(error.response.data, null, 2));
      return res.status(error.response.status).json({
        error: 'Failed to fetch payment details',
        details: error.response.data
      });
    }
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Submit payment session with collected data (for logged-in express checkout)
app.post("/submit-payment-session", async (req, res) => {
  try {
    const { session_data, amount, currency, shipping, carrier } = req.body;

    if (!session_data || !amount || !currency) {
      return res.status(400).json({
        error: 'Invalid payload',
        details: 'Missing required fields: session_data, amount, or currency'
      });
    }

    console.log('=== Submit Payment Session Request ===');
    console.log(JSON.stringify(req.body, null, 2));

    // Construct the submit request
    const submitBody = {
      session_data: session_data,
      amount: amount,
      currency: currency,
      reference: `ORDER-${Date.now()}`,
      shipping: {
        address: {
          address_line1: shipping.line1 || 'Shipping Address',
          address_line2: shipping.line2 || '',
          city: shipping.city || 'City',
          country: shipping.country || 'HK'
        }
      }
    };

    // Send request to Checkout.com API
    const response = await axios.post(
      'https://api.sandbox.checkout.com/payment-sessions/complete',
      submitBody,
      {
        headers: {
          Authorization: `Bearer ${CHECKOUT_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log('Payment session submitted successfully:', JSON.stringify(response.data, null, 2));

    return res.status(200).json(response.data);

  } catch (error) {
    console.error('Error submitting payment session:', error.message);
    if (error.response) {
      console.error('Checkout API status:', error.response.status);
      console.error('Checkout API body:', JSON.stringify(error.response.data, null, 2));
      return res.status(error.response.status).json({
        error: 'Failed to submit payment session',
        details: error.response.data,
      });
    }
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
});

// Process direct payment
app.post("/process-payment", async (req, res) => {
  try {
    const { amount, currency, source, customer, shipping, products, billing } = req.body;

    if (!amount || !currency || !source) {
      return res.status(400).json({
        error: 'Invalid payload',
        details: 'Missing required fields: amount, currency, or source'
      });
    }

    // Determine base URL for redirect targets
    const baseUrl = resolvePublicBase(req);

    console.log('=== Process Direct Payment Request ===');
    console.log(JSON.stringify(req.body, null, 2));

    const productList = Array.isArray(products) ? products : [];
    const firstProduct = productList[0];
    const billingAddress = billing?.address || shipping?.address || undefined;
    const billingPhone = billing?.phone || customer?.phone || shipping?.phone || undefined;

    // Construct payment request
    const paymentBody = {
      source: source,
      amount: amount,
      currency: currency,
      reference: req.body.reference || `ORDER-${Date.now()}`,
      description: firstProduct
        ? `${firstProduct.name}${productList.length > 1 ? ` +${productList.length - 1} more` : ''} (${currency})`
        : `ORDER-${Date.now()}`,
      billing_descriptor: {
        name: customer?.name || 'Customer',
        city: billingAddress?.city || shipping?.address?.city || 'Unknown'
      },
      customer: customer,
      ...(billingAddress && {
        billing: {
          address: billingAddress,
          ...(billingPhone && { phone: billingPhone })
        }
      }),
      shipping: shipping,
      risk: {
        enabled: true
      },
      ...(productList.length > 0 && {
        items: productList.map(product => ({
          name: product.name,
          quantity: product.quantity,
          unit_price: product.unit_price,
          reference: product.reference
        }))
      }),
      payment_type: 'Regular',
      processing_channel_id: PROCESSING_CHANNEL_ID,
      success_url: `${baseUrl}/success.html`,
      failure_url: `${baseUrl}/failure.html`,
      metadata: {
        products_count: productList.length,
        product_references: productList.map(p => p.reference).join(',')
      }
    };

    // Add 3DS settings if provided
    if (req.body['3ds']) {
      paymentBody['3ds'] = req.body['3ds'];
    }

    // Send request to Checkout.com Payments API
    const response = await axios.post(
      'https://api.sandbox.checkout.com/payments',
      paymentBody,
      {
        headers: {
          Authorization: `Bearer ${CHECKOUT_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log('Payment processed successfully:', JSON.stringify(response.data, null, 2));

    return res.status(200).json(response.data);

  } catch (error) {
    console.error('Error processing payment:', error.message);
    if (error.response) {
      console.error('Checkout API status:', error.response.status);
      console.error('Checkout API body:', JSON.stringify(error.response.data, null, 2));
      return res.status(error.response.status).json({
        error: 'Failed to process payment',
        details: error.response.data,
      });
    }
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
});

// Serve the frontend - entrance portal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint to provide Checkout public key to frontend
app.get('/api/checkout-config', (req, res) => {
    res.json({
        publicKey: CHECKOUT_PUBLIC_KEY || '',
        environment: 'sandbox'
    });
});

// Endpoint to return current cloudflared tunnel URL (if present)
app.get('/tunnel-url', async (req, res) => {
  try {
    const cfgPath = path.join(os.homedir(), '.cloudflared', 'current_tunnel_url.txt');
    if (!fs.existsSync(cfgPath)) {
      return res.status(404).json({ url: null, error: 'tunnel url file not found' });
    }
    const url = (await fs.promises.readFile(cfgPath, 'utf8')).trim();
    if (!url) return res.status(404).json({ url: null, error: 'tunnel url empty' });
    return res.json({ url });
  } catch (err) {
    console.error('Error reading tunnel url file:', err);
    return res.status(500).json({ url: null, error: 'unable to read tunnel url' });
  }
});

// For local testing
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
