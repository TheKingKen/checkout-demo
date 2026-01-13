// public/payment-flow-app.js

// Helper: Get stored customer ID based on email (returns null for new customers)
// Customer IDs are provided by Checkout.com after first successful payment
function getCustomerId(email) {
    if (!email) return null;
    
    // Check if we have a customer ID for this email
    const storageKey = `customer_id_${btoa(email).replace(/=/g, '')}`;
    const customerId = localStorage.getItem(storageKey);
    
    if (customerId) {
        console.log('Returning customer detected. Customer ID:', customerId);
    } else {
        console.log('New customer detected. No customer ID stored yet.');
    }
    
    return customerId; // null for new customers
}

// Helper: Store customer ID after successful payment
function storeCustomerId(email, customerId) {
    if (!email || !customerId) return;
    
    const storageKey = `customer_id_${btoa(email).replace(/=/g, '')}`;
    localStorage.setItem(storageKey, customerId);
    console.log('Stored customer ID:', customerId, 'for email:', email);
}

// Helper: Remove customer ID from localStorage
function removeCustomerId(email) {
    if (!email) return;
    
    const storageKey = `customer_id_${btoa(email).replace(/=/g, '')}`;
    localStorage.removeItem(storageKey);
    console.log('Removed customer ID from localStorage for email:', email);
}

// Helper: Store instrument IDs (source.id from payments) for customer
function storeInstrumentId(email, instrumentId) {
    if (!email || !instrumentId) return;
    
    const storageKey = `instrument_ids_${btoa(email).replace(/=/g, '')}`;
    
    // Get existing instruments or initialize empty array
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
    
    // Add new instrument if not already present
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

// Helper: Remove all instrument IDs for customer
function removeInstrumentIds(email) {
    if (!email) return;
    
    const storageKey = `instrument_ids_${btoa(email).replace(/=/g, '')}`;
    localStorage.removeItem(storageKey);
    console.log('Removed instrument IDs from localStorage for email:', email);
}

// Helper: Retrieve customer ID from Checkout.com by email
async function validateCustomerByEmail(email) {
    if (!email) return null;
    
    try {
        console.log('Retrieving customer ID from Checkout.com for email:', email);
        
        const response = await fetch(`/validate-customer-by-email/${encodeURIComponent(email)}`);
        
        if (!response.ok) {
            console.warn('Failed to retrieve customer:', response.status);
            return null;
        }
        
        const result = await response.json();
        
        if (result.exists && result.customer_id) {
            console.log('✅ Customer ID found:', result.customer_id);
            
            // Sync with localStorage for reference
            storeCustomerId(email, result.customer_id);
            
            return result.customer_id;
        } else {
            console.log('ℹ️ No customer ID found for this email');
            
            // Clear localStorage if it has stale data
            removeCustomerId(email);
            
            return null;
        }
    } catch (error) {
        console.error('Error retrieving customer ID:', error);
        return null;
    }
}

// Helper: Check if customer is returning (has made a payment before)
function isReturningCustomer(email) {
    if (!email) return false;
    const storageKey = `customer_id_${btoa(email).replace(/=/g, '')}`;
    return !!localStorage.getItem(storageKey);
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
        
        // Extract customer.id from payment details
        if (paymentDetails.customer && paymentDetails.customer.id) {
            storeCustomerId(customerEmail, paymentDetails.customer.id);
            console.log('Customer ID stored successfully for future use:', paymentDetails.customer.id);
        } else {
            console.warn('No customer.id found in payment details');
        }
        
        // Extract source.id (payment instrument ID) from payment details
        // This is the token for the card stored in merchant's vault
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

    // Initialize RM/SC toggle (default to RM - Remember Me)
    try {
        const rmScToggle = document.getElementById('rm-sc-toggle');
        if (rmScToggle) {
            const useRM = localStorage.getItem('useRM') !== 'false'; // Default to true (RM mode)
            rmScToggle.innerText = useRM ? 'RM' : 'SC';
            rmScToggle.classList.toggle('active', useRM);
            rmScToggle.addEventListener('click', () => {
                const now = !(localStorage.getItem('useRM') !== 'false');
                localStorage.setItem('useRM', now ? 'true' : 'false');
                rmScToggle.innerText = now ? 'RM' : 'SC';
                rmScToggle.classList.toggle('active', now);
                
                // If changing mode while Flow is mounted, show info message
                const flowContainer = document.getElementById('flow-container');
                if (flowContainer && flowContainer.children.length > 0) {
                    console.log(`Switched to ${now ? 'RM (Remember Me)' : 'SC (Stored Card)'} mode. Uncheck and re-check the confirmation checkbox to apply changes.`);
                }
            });
        }
    } catch (e) {
        console.warn('RM/SC toggle init failed', e);
    }

    // Keep the toggles enabled/disabled based on confirm-checkbox state
    try {
        const confirmCheckbox = document.getElementById('confirm-checkbox');
        const flowHppToggleEl = document.getElementById('flow-hpp-toggle');
        const rmScToggleEl = document.getElementById('rm-sc-toggle');
        if (confirmCheckbox && flowHppToggleEl) {
            // Initialize state (toggles enabled when unchecked)
            flowHppToggleEl.disabled = !!confirmCheckbox.checked;
            if (rmScToggleEl) {
                rmScToggleEl.disabled = !!confirmCheckbox.checked;
            }

            // Update when checkbox changes
            confirmCheckbox.addEventListener('change', (e) => {
                flowHppToggleEl.disabled = !!e.target.checked;
                if (rmScToggleEl) {
                    rmScToggleEl.disabled = !!e.target.checked;
                }
            });
        }
    } catch (e) {
        console.warn('Error wiring toggle enable/disable', e);
    }

    // Show loading state
    loadingContainer.style.display = 'block';

    // If payload is passed via URL (level-2 QR scan), decode and store into sessionStorage
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.has('data')) {
            const data = params.get('data');
            try {
                // decode base64 (handles UTF-8)
                const jsonStr = decodeURIComponent(escape(atob(decodeURIComponent(data))));
                const parsed = JSON.parse(jsonStr);
                sessionStorage.setItem('paymentPayload', JSON.stringify(parsed));
                console.log('Loaded payment payload from URL data param');
                // Remove query string to keep URL clean
                history.replaceState(null, '', window.location.pathname);
            } catch (e) {
                console.warn('Failed to decode payment payload from URL', e);
            }
        }
    } catch (e) {
        console.warn('No URL params to process', e);
    }

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
        // Retrieve payload from sessionStorage
        const payloadStr = sessionStorage.getItem('paymentPayload');

        if (!payloadStr) {
            throw new Error('Payment data not found. Please complete the insurance application form first.');
        }

        const payload = JSON.parse(payloadStr);

        // Validate payload structure
        if (!payload.customer || !payload.product || !payload.amount) {
            throw new Error('Invalid payment data structure.');
        }

        // Display customer information
        document.getElementById('display-name').textContent = payload.customer.name || '-';
        document.getElementById('display-email').textContent = payload.customer.email || '-';
        
        const phoneDisplay = payload.customer.phone_country_code + ' ' + payload.customer.phone_number;
        document.getElementById('display-phone').textContent = phoneDisplay || '-';
        
        document.getElementById('display-country').textContent = payload.country || '-';

        // Display product information
        document.getElementById('display-product').textContent = payload.product.name || '-';
        document.getElementById('display-reference').textContent = payload.product.reference || '-';

        // Display amount information
        document.getElementById('display-currency').textContent = payload.currency || 'HKD';
        
        // Convert amount from minor units (cents) to major units with thousand separator
        const amountInMajorUnits = (payload.amount / 100).toFixed(2);
        const formattedAmount = parseFloat(amountInMajorUnits).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        document.getElementById('display-amount-formatted').textContent = formattedAmount;

        // Log payload for debugging
        console.log('Payment Payload Loaded:', payload);

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

function toggleActionButtons() {
    const checkbox = document.getElementById('confirm-checkbox');
    const actionButtons = document.getElementById('action-buttons');
    const backButton = actionButtons.querySelector('.btn-back');
    
    if (!checkbox.checked) {
        actionButtons.style.display = 'none';
        // clear any mounted flow UI
        const flowContainer = document.getElementById('flow-container');
        if (flowContainer) flowContainer.innerHTML = '';
        // clear card info display
        const cardInfoDisplay = document.getElementById('card-info-display');
        if (cardInfoDisplay) cardInfoDisplay.style.display = 'none';
        // hide SC consent checkbox
        const scConsentContainer = document.getElementById('sc-consent-container');
        if (scConsentContainer) scConsentContainer.style.display = 'none';
    } else {
        actionButtons.style.display = 'flex';

        // Decide Flow vs HPP mode based on toggle
        const useFlow = localStorage.getItem('useFlow') === 'true';

        if (useFlow) {
            // Hide the back button initially and show it after 3 seconds
            if (backButton) {
                backButton.style.display = 'none';
                setTimeout(() => {
                    if (backButton) {
                        backButton.style.display = 'block';
                    }
                }, 2000);
            }

            // Flow: create payment session and initialize the Checkout Flow component
            (async () => {
                try {
                    const payloadStr = sessionStorage.getItem('paymentPayload');
                    if (!payloadStr) {
                        alert('Payment data not found. Please complete the insurance application form first.');
                        return;
                    }
                    const payload = JSON.parse(payloadStr);

                    // Retrieve customer ID from Checkout.com (if exists)
                    const customerId = await validateCustomerByEmail(payload.customer.email);
                    
                    // Check RM/SC mode
                    const useRM = localStorage.getItem('useRM') !== 'false';
                    console.log(`Flow mode: ${useRM ? 'RM (Remember Me)' : 'SC (Stored Card)'}`);
                    
                    // SC mode: show custom consent checkbox
                    const scConsentContainer = document.getElementById('sc-consent-container');
                    const scConsentCheckbox = document.getElementById('sc-consent-checkbox');
                    
                    if (!useRM && scConsentContainer) {
                        // SC mode: show consent checkbox
                        scConsentContainer.style.display = 'block';
                        
                        // Pre-check the checkbox for returning customers (who already have cards saved)
                        if (customerId && scConsentCheckbox) {
                            scConsentCheckbox.checked = true;
                        }
                        
                        // Add event listener to handle consent checkbox changes
                        // When unchecked, user doesn't want to save card details
                        if (scConsentCheckbox) {
                            scConsentCheckbox.addEventListener('change', (e) => {
                                console.log('SC consent checkbox changed:', e.target.checked);
                                console.log('Note: To apply this change, you need to uncheck and re-check the confirmation checkbox');
                            });
                        }
                    } else if (scConsentContainer) {
                        // RM mode: hide consent checkbox
                        scConsentContainer.style.display = 'none';
                    }
                    
                    // Include customer.id in payload if available - Flow will handle saved card display
                    if (customerId) {
                        payload.customer.id = customerId;
                        console.log('Customer ID will be sent to Flow:', customerId);
                        
                        // For SC mode, also retrieve stored instrument IDs
                        if (!useRM) {
                            const instrumentIds = getInstrumentIds(payload.customer.email);
                            if (instrumentIds.length > 0) {
                                payload.instrument_ids = instrumentIds;
                                console.log('SC mode - Instrument IDs will be sent:', instrumentIds);
                            }
                        }
                        
                        console.log('Flow will display saved cards if available for this customer');
                    } else {
                        console.log('No customer ID - Flow will show new card form');
                    }
                    
                    // Add mode flag for backend to configure properly
                    payload.mode = useRM ? 'remember_me' : 'stored_card';
                    
                    // For SC mode, include consent status
                    if (!useRM && scConsentCheckbox) {
                        payload.store_consent_collected = scConsentCheckbox.checked;
                        console.log('SC mode - consent collected:', scConsentCheckbox.checked);
                    }

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
                            },
                            onPaymentCompleted: async (_component, paymentResponse) => {
                                console.log('Payment completed', paymentResponse);
                                
                                // Extract payment ID and fetch customer ID from payment details
                                if (paymentResponse && paymentResponse.id) {
                                    // Fetch and store customer ID for future use
                                    await fetchAndStoreCustomerId(paymentResponse.id, payload.customer.email);
                                }
                                
                                setTimeout(() => {
                                    window.location.href = '/success.html';
                                }, 1000);
                            },
                            onChange: (component) => {
                                console.log('onChange', component.type, component.isValid && component.isValid());
                                
                                // Hide card info display if payment method is not card
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
                                // If cardMetadata is empty/null, it means the card number was cleared
                                if (!cardMetadata || Object.keys(cardMetadata).length === 0) {
                                    updateCardInfoDisplay(null);
                                } else {
                                    updateCardInfoDisplay(cardMetadata);
                                }
                                // Accept the card by default (return nothing or { continue: true })
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
                        flowComponent.mount(document.getElementById('flow-container'));
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
            // HPP: show a Pay button inside flow-container that calls create-payment-link2 and redirects
            const flowContainer = document.getElementById('flow-container');
            // Clear card info display (only relevant for Flow mode)
            const cardInfoDisplay = document.getElementById('card-info-display');
            if (cardInfoDisplay) cardInfoDisplay.style.display = 'none';
            
            if (flowContainer) {
                flowContainer.innerHTML = '';
                const pay = document.createElement('button');
                pay.id = 'hpp-pay-btn';
                // Use the same pay button styling as the insurance form
                pay.className = 'pay-btn show';
                pay.textContent = 'Pay';
                flowContainer.appendChild(pay);

                pay.addEventListener('click', async () => {
                    try {
                        pay.disabled = true;
                        pay.textContent = 'Redirecting...';

                        const payloadStr = sessionStorage.getItem('paymentPayload');
                        if (!payloadStr) {
                            alert('Payment data not found. Please complete the insurance application form first.');
                            pay.disabled = false;
                            pay.textContent = 'Pay';
                            return;
                        }
                        const payload = JSON.parse(payloadStr);

                        // Retrieve customer ID from Checkout.com (if exists)
                        const customerId = await validateCustomerByEmail(payload.customer.email);
                        
                        // Include customer.id in payload if available - HPP will handle saved card display
                        if (customerId) {
                            payload.customer.id = customerId;
                            console.log('HPP mode - Customer ID will be sent:', customerId);
                            console.log('HPP will display saved payment methods if available for this customer');
                        } else {
                            console.log('HPP mode - No customer ID - HPP will show new payment form with save consent checkbox');
                        }

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
    // Return to the insurance form
    window.location.href = '/insurance-form.html';
}

// Helper function to update card info display with BIN lookup metadata
function updateCardInfoDisplay(cardMetadata) {
    const cardInfoDisplay = document.getElementById('card-info-display');
    
    // Hide if no metadata or if metadata indicates insufficient card number digits
    if (!cardMetadata || Object.keys(cardMetadata).length === 0) {
        if (cardInfoDisplay) {
            cardInfoDisplay.style.display = 'none';
        }
        // Hide all rows
        const rows = ['card-bin-row', 'card-brand-row', 'card-type-row', 'card-category-row', 'card-issuer-row'];
        rows.forEach(rowId => {
            const row = document.getElementById(rowId);
            if (row) row.style.display = 'none';
        });
        return;
    }

    // Helper to show/hide and update a row
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

    // Count how many fields have valid data
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

    // Only show the display if at least one field has valid data
    if (validFieldCount > 0) {
        if (cardInfoDisplay) {
            cardInfoDisplay.style.display = 'block';
        }
        
        // Update each field
        updateRow('card-bin-row', 'card-bin-value', binValue);
        updateRow('card-brand-row', 'card-brand-value', brandValue);
        updateRow('card-type-row', 'card-type-value', typeValue);
        updateRow('card-category-row', 'card-category-value', categoryValue);
        updateRow('card-issuer-row', 'card-issuer-value', issuerValue);
    } else {
        // No valid fields, hide the entire display
        if (cardInfoDisplay) {
            cardInfoDisplay.style.display = 'none';
        }
    }
}

/*function proceedToCheckout() {
    try {
        const payloadStr = sessionStorage.getItem('paymentPayload');
        const payload = JSON.parse(payloadStr);

        // Log the payload being sent
        console.log('Proceeding to checkout with payload:', payload);

        // Send payment request to backend
        fetch('/create-payment-link', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    try {
                        const data = JSON.parse(text);
                        throw new Error(data.error || 'Payment link creation failed');
                    } catch (e) {
                        throw new Error('Failed to create payment link: ' + text);
                    }
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.link) {
                // Redirect to Checkout.com Hosted Payments Page
                window.location.href = data.link;
            } else {
                throw new Error('No payment link returned from server');
            }
        })
        .catch(error => {
            console.error('Checkout error:', error);
            alert('Error proceeding to checkout: ' + error.message);
        });

    } catch (error) {
        console.error('Error in proceedToCheckout:', error);
        alert('Error: ' + error.message);
    }
}*/
