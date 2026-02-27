// public/phone-case-shop-payment-app.js

// Helper: Get stored customer ID based on email (returns null for new customers)
function getCustomerId(email) {
    if (!email) return null;
    
    const storageKey = `customer_id_${btoa(email).replace(/=/g, '')}`;
    const customerId = localStorage.getItem(storageKey);
    
    if (customerId) {
        console.log('Returning customer detected. Customer ID:', customerId);
    } else {
        console.log('New customer detected. No customer ID stored yet.');
    }
    
    return customerId;
}

// Helper: Store customer ID after successful payment
function storeCustomerId(email, customerId) {
    if (!email || !customerId) return;
    
    const storageKey = `customer_id_${btoa(email).replace(/=/g, '')}`;
    localStorage.setItem(storageKey, customerId);
    console.log('Stored customer ID:', customerId, 'for email:', email);
}

// Helper: Store instrument IDs (source.id from payments) for customer
function storeInstrumentId(email, instrumentId) {
    if (!email || !instrumentId) return;
    
    const storageKey = `instrument_ids_${btoa(email).replace(/=/g, '')}`;
    
    let instruments = [];
    try {
        const existing = localStorage.getItem(storageKey);
        if (existing) {
            instruments = JSON.parse(existing);
        }
    } catch (e) {
        console.warn('Error parsing existing instruments:', e);
        instruments = [];
    }
    
    if (!instruments.includes(instrumentId)) {
        instruments.push(instrumentId);
        localStorage.setItem(storageKey, JSON.stringify(instruments));
        console.log('Stored instrument ID:', instrumentId, 'for email:', email);
    }
}

// Helper: Get stored instrument IDs for customer
function getInstrumentIds(email) {
    if (!email) return [];
    
    const storageKey = `instrument_ids_${btoa(email).replace(/=/g, '')}`;
    try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.warn('Error parsing instrument IDs:', e);
    }
    return [];
}

// Helper: Remove instrument IDs for customer
function removeInstrumentIds(email) {
    if (!email) return;
    
    const storageKey = `instrument_ids_${btoa(email).replace(/=/g, '')}`;
    localStorage.removeItem(storageKey);
    console.log('Removed instrument IDs from localStorage for email:', email);
}

// Helper: Fetch payment details from Checkout.com and store customer ID and instrument ID
async function fetchAndStoreCustomerId(paymentId, customerEmail) {
    try {
        console.log('Fetching payment details for payment ID:', paymentId);
        
        const response = await fetch(`/get-payment-details/${paymentId}`);
        
        if (!response.ok) {
            console.warn('Failed to fetch payment details:', response.status);
            return;
        }
        
        const paymentDetails = await response.json();
        console.log('Payment details received:', paymentDetails);
        
        if (paymentDetails.customer && paymentDetails.customer.id) {
            storeCustomerId(customerEmail, paymentDetails.customer.id);
            console.log('Customer ID stored successfully for future use:', paymentDetails.customer.id);
        } else {
            console.warn('No customer.id found in payment details');
        }
        
        if (paymentDetails.source && paymentDetails.source.id) {
            storeInstrumentId(customerEmail, paymentDetails.source.id);
            console.log('Instrument ID (source.id) stored successfully:', paymentDetails.source.id);
        } else {
            console.warn('No source.id found in payment details');
        }
    } catch (error) {
        console.error('Error fetching payment details:', error);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const loadingContainer = document.getElementById('loading-container');
    const contentContainer = document.getElementById('content-container');
    const errorContainer = document.getElementById('error-container');

    // Initialize Flow/HPP toggle (default to Flow)
    try {
        const flowHppToggle = document.getElementById('flow-hpp-toggle');
        if (flowHppToggle) {
            const useFlow = localStorage.getItem('useFlow') === 'true';
            flowHppToggle.innerText = useFlow ? 'Flow' : 'HPP';
            flowHppToggle.classList.toggle('active', useFlow);
            flowHppToggle.addEventListener('click', () => {
                const now = !(localStorage.getItem('useFlow') === 'true');
                localStorage.setItem('useFlow', now ? 'true' : 'false');
                flowHppToggle.innerText = now ? 'Flow' : 'HPP';
                flowHppToggle.classList.toggle('active', now);
            });
        }
    } catch (e) {
        console.warn('Flow/HPP toggle init failed', e);
    }

    // Keep the Flow/HPP toggle enabled/disabled based on confirm-checkbox state
    try {
        const confirmCheckbox = document.getElementById('confirm-checkbox');
        const flowHppToggleEl = document.getElementById('flow-hpp-toggle');
        if (confirmCheckbox && flowHppToggleEl) {
            flowHppToggleEl.disabled = !!confirmCheckbox.checked;
            confirmCheckbox.addEventListener('change', (e) => {
                flowHppToggleEl.disabled = !!e.target.checked;
            });
        }
    } catch (e) {
        console.warn('Error wiring toggle enable/disable', e);
    }

    // Show loading state
    loadingContainer.style.display = 'block';

    // Simulate a small delay for better UX
    setTimeout(() => {
        loadPaymentData();
    }, 300);
});

function loadPaymentData() {
    const loadingContainer = document.getElementById('loading-container');
    const contentContainer = document.getElementById('content-container');
    const errorContainer = document.getElementById('error-container');

    try {
        // Retrieve customer data from sessionStorage
        const customerDataStr = sessionStorage.getItem('phoneShopCustomerData');

        if (!customerDataStr) {
            throw new Error('Customer data not found. Please complete the form first.');
        }

        const customerData = JSON.parse(customerDataStr);

        // Build the payment payload
        let amount, currency;
        
        if (customerData.country === 'HK') {
            amount = 12900; // 129.00 HKD in cents
            currency = 'HKD';
        } else if (customerData.country === 'US') {
            amount = 1600; // 16.00 USD in cents
            currency = 'USD';
        } else if (customerData.country === 'CN') {
            amount = 12000; // 120.00 CNY in cents
            currency = 'CNY';
        } else {
            amount = 6200; // 62.00 SAR in cents
            currency = 'SAR';
        }

        // Create complete payload for payment
        const payload = {
            country: customerData.country,
            currency: currency,
            amount: amount,
            customer: {
                name: customerData.name,
                email: customerData.email,
                phone_country_code: getPhoneCountryCode(customerData.country),
                phone_number: customerData.phone
            },
            products: [
                {
                    name: customerData.productName || 'Classic iPhone Case',
                    quantity: 1,
                    unit_price: amount,
                    reference: 'iphone-case-demo',
                    description: customerData.productDescription
                }
            ]
        };

        // Store payload in sessionStorage for use in toggleActionButtons
        sessionStorage.setItem('paymentPayload', JSON.stringify(payload));

        // Display customer information
        document.getElementById('display-name').textContent = customerData.name || '-';
        document.getElementById('display-email').textContent = customerData.email || '-';
        document.getElementById('display-phone').textContent = customerData.phone || '-';
        document.getElementById('display-country').textContent = customerData.country || '-';
        document.getElementById('display-address').textContent = customerData.address || '-';
        document.getElementById('display-currency').textContent = currency || 'HKD';
        
        // Display product name if custom value provided
        document.getElementById('display-product').textContent = customerData.productName || 'Classic iPhone Case';
        document.getElementById('display-reference').textContent = customerData.productDescription || 'iphone-case-demo';
        
        // Convert amount from minor units (cents) to major units
        const amountInMajorUnits = (amount / 100).toFixed(2);
        const formattedAmount = parseFloat(amountInMajorUnits).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        document.getElementById('display-amount-formatted').textContent = formattedAmount;

        console.log('Payment Payload Prepared:', payload);

        // Hide loading, show content
        loadingContainer.style.display = 'none';
        contentContainer.style.display = 'block';

    } catch (error) {
        console.error('Error loading payment data:', error);
        
        // Hide loading, show error
        loadingContainer.style.display = 'none';
        errorContainer.innerHTML = `<div class="error-message">${error.message}</div>`;
        
        // Add return button
        errorContainer.innerHTML += `
            <button class="btn btn-back" onclick="goBackToForm()" style="width: 100%; margin-top: 20px;">
                Return to Form
            </button>
        `;
    }
}

function getPhoneCountryCode(country) {
    const codes = {
        'HK': '+852',
        'US': '+1',
        'CN': '+86',
        'SA': '+966'
    };
    return codes[country] || '+852';
}

function toggleActionButtons() {
    const checkbox = document.getElementById('confirm-checkbox');
    const actionButtons = document.getElementById('action-buttons');
    const backButton = actionButtons.querySelector('.btn-back');
    
    if (!checkbox.checked) {
        actionButtons.style.display = 'none';
        const flowContainer = document.getElementById('flow-container');
        if (flowContainer) flowContainer.innerHTML = '';
        const cardInfoDisplay = document.getElementById('card-info-display');
        if (cardInfoDisplay) cardInfoDisplay.style.display = 'none';
    } else {
        actionButtons.style.display = 'flex';

        const useFlow = localStorage.getItem('useFlow') === 'true';

        if (useFlow) {
            if (backButton) {
                backButton.style.display = 'none';
            }

            // Flow: create payment session and initialize the Checkout Flow component
            (async () => {
                try {
                    const payloadStr = sessionStorage.getItem('paymentPayload');
                    if (!payloadStr) {
                        alert('Payment data not found. Please complete the form first.');
                        return;
                    }
                    const payload = JSON.parse(payloadStr);

                    console.log('Flow mode: Creating payment session');

                    const response = await fetch('/create-payment-sessions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    const paymentSession = await response.json();

                    if (!response.ok) {
                        console.error('Error creating payment session', paymentSession);
                        alert('Failed to create payment session: ' + (paymentSession.error || JSON.stringify(paymentSession)));
                        return;
                    }

                    console.log('Payment session created:', paymentSession);

                    try {
                        const configResponse = await fetch('/api/checkout-config');
                        const config = await configResponse.json();
                        const CHECKOUT_PUBLIC_KEY = config.publicKey;

                        if (!CHECKOUT_PUBLIC_KEY) {
                            throw new Error('Checkout public key not configured. Please set CK_PUBLIC in .env file.');
                        }

                        const checkout = await CheckoutWebComponents({
                            publicKey: CHECKOUT_PUBLIC_KEY,
                            environment: 'sandbox',
                            locale: 'en-GB',
                            paymentSession,
                            onReady: () => {
                                console.log('Checkout ready');
                                if (backButton) {
                                    backButton.style.display = 'block';
                                }
                            },
                            onPaymentCompleted: async (_component, paymentResponse) => {
                                console.log('Payment completed', paymentResponse);
                                
                                if (paymentResponse && paymentResponse.id) {
                                    const payloadStr = sessionStorage.getItem('paymentPayload');
                                    const payload = JSON.parse(payloadStr);
                                    await fetchAndStoreCustomerId(paymentResponse.id, payload.customer.email);
                                }
                                
                                setTimeout(() => {
                                    window.location.href = '/success.html';
                                }, 1000);
                            },
                            onChange: (component) => {
                                console.log('onChange', component.type, component.isValid && component.isValid());
                                
                                if (component.type !== 'card') {
                                    const cardInfoDisplay = document.getElementById('card-info-display');
                                    if (cardInfoDisplay && cardInfoDisplay.style.display === 'block') {
                                        cardInfoDisplay.style.display = 'none';
                                        console.log('Card info hidden - switched to:', component.type);
                                    }
                                }
                            },
                            onCardBinChanged: (_component, cardMetadata) => {
                                console.log('BIN changed:', cardMetadata);
                                if (!cardMetadata || Object.keys(cardMetadata).length === 0) {
                                    updateCardInfoDisplay(null);
                                } else {
                                    updateCardInfoDisplay(cardMetadata);
                                }
                                return { continue: true };
                            },
                            onError: (component, error) => {
                                console.log('onError', error, component && component.type);
                                try {
                                    const errEl = document.getElementById('error-message');
                                    if (errEl) {
                                        const msg = (error && (error.message || error.reason || error.code))
                                            ? (error.message || error.reason || String(error.code))
                                            : 'Payment error occurred';
                                        errEl.textContent = msg;
                                        errEl.style.color = '#b81736';
                                    }
                                } catch (uiErr) {
                                    console.warn('Failed to display error message', uiErr);
                                }
                            },
                        });

                        const flowComponent = checkout.create('flow');
                        const flowContainer = document.getElementById('flow-container');
                        if (flowContainer) {
                            flowContainer.style.minHeight = '400px';  // Ensure proper height for Flow component
                        }
                        flowComponent.mount(flowContainer);
                    } catch (initErr) {
                        console.warn('Checkout Flow init failed or not available:', initErr);
                        const flowContainer = document.getElementById('flow-container');
                        if (flowContainer) {
                            flowContainer.innerHTML = '<div style="padding:12px;background:#fff;border-radius:6px;border:1px solid #e0e0e0;">Payment session created. Server response:<pre style="white-space:pre-wrap">' +
                                JSON.stringify(paymentSession, null, 2) +
                                '</pre></div>';
                        }
                    }

                } catch (err) {
                    console.error('Error in toggleActionButtons flow initialization:', err);
                    alert('Unexpected error creating payment session: ' + (err.message || err));
                }
            })();
        } else {
            // HPP: show a Pay button
            const flowContainer = document.getElementById('flow-container');
            const cardInfoDisplay = document.getElementById('card-info-display');
            if (cardInfoDisplay) cardInfoDisplay.style.display = 'none';
            
            if (flowContainer) {
                flowContainer.innerHTML = '';
                flowContainer.style.minHeight = 'auto';  // Remove large spacing for HPP mode
                const pay = document.createElement('button');
                pay.id = 'hpp-pay-btn';
                pay.className = 'pay-btn show';
                pay.textContent = 'Pay';
                flowContainer.appendChild(pay);

                pay.addEventListener('click', async () => {
                    try {
                        pay.disabled = true;
                        pay.textContent = 'Redirecting...';

                        const payloadStr = sessionStorage.getItem('paymentPayload');
                        if (!payloadStr) {
                            alert('Payment data not found. Please complete the form first.');
                            pay.disabled = false;
                            pay.textContent = 'Pay';
                            return;
                        }
                        const payload = JSON.parse(payloadStr);

                        console.log('HPP mode - Creating payment link');

                        const response = await fetch('/create-payment-link2', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });

                        const text = await response.text();
                        let data;
                        try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }

                        if (response.ok && data.link) {
                            window.location.href = data.link;
                            return;
                        }

                        const errMsg = data.error || data.details || data.message || JSON.stringify(data);
                        alert('Error creating payment link: ' + errMsg);
                        pay.disabled = false;
                        pay.textContent = 'Pay';
                    } catch (err) {
                        console.error('HPP pay error', err);
                        alert('Network error creating payment link: ' + (err.message || err));
                        pay.disabled = false;
                        pay.textContent = 'Pay';
                    }
                });
            }
        }
    }
}

function goBackToForm() {
    window.location.href = '/easy-checkout-demo/phone-case-shop.html';
}

// Helper function to update card info display with BIN lookup metadata
function updateCardInfoDisplay(cardMetadata) {
    console.log('=== Card BIN Metadata ===');
    console.log(JSON.stringify(cardMetadata, null, 2));
    console.log('========================');
    
    const cardInfoDisplay = document.getElementById('card-info-display');
    
    if (!cardMetadata || Object.keys(cardMetadata).length === 0) {
        if (cardInfoDisplay) {
            cardInfoDisplay.style.display = 'none';
        }
        const rows = ['card-bin-row', 'card-brand-row', 'card-type-row', 'card-category-row', 'card-issuer-row', 'card-issuer-country-row'];
        rows.forEach(rowId => {
            const row = document.getElementById(rowId);
            if (row) row.style.display = 'none';
        });
        return;
    }

    const updateRow = (rowId, valueId, value) => {
        const row = document.getElementById(rowId);
        const valueEl = document.getElementById(valueId);
        
        if (value && value !== '-' && value !== 'unknown' && value !== '' && value !== null && value !== undefined) {
            if (row) row.style.display = 'flex';
            if (valueEl) valueEl.textContent = value;
        } else {
            if (row) row.style.display = 'none';
        }
    };

    let validFieldCount = 0;
    const checkField = (value) => {
        if (value && value !== '-' && value !== 'unknown' && value !== '' && value !== null && value !== undefined) {
            validFieldCount++;
            return value;
        }
        return null;
    };

    const binValue = checkField(cardMetadata.bin);
    const brandValue = checkField(cardMetadata.scheme || cardMetadata.brand);
    const typeValue = checkField(cardMetadata.card_type || cardMetadata.type);
    const categoryValue = checkField(cardMetadata.card_category || cardMetadata.category);
    const issuerValue = checkField(cardMetadata.issuer || cardMetadata.issuer_name);
    const issuerCountryValue = checkField(cardMetadata.issuer_country_name);

    if (validFieldCount > 0) {
        if (cardInfoDisplay) {
            cardInfoDisplay.style.display = 'block';
        }
        
        updateRow('card-bin-row', 'card-bin-value', binValue);
        updateRow('card-brand-row', 'card-brand-value', brandValue);
        updateRow('card-type-row', 'card-type-value', typeValue);
        updateRow('card-category-row', 'card-category-value', categoryValue);
        updateRow('card-issuer-row', 'card-issuer-value', issuerValue);
        updateRow('card-issuer-country-row', 'card-issuer-country-value', issuerCountryValue);
    } else {
        if (cardInfoDisplay) {
            cardInfoDisplay.style.display = 'none';
        }
    }
}
