// public/payment-flow-app.js

document.addEventListener('DOMContentLoaded', function () {
    const loadingContainer = document.getElementById('loading-container');
    const contentContainer = document.getElementById('content-container');
    const errorContainer = document.getElementById('error-container');

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
    } else {
        actionButtons.style.display = 'flex';
        
        // Hide the back button initially and show it after 3 seconds
        if (backButton) {
            backButton.style.display = 'none';
            setTimeout(() => {
                if (backButton) {
                    backButton.style.display = 'block';
                }
            }, 3000);
        }

        (async () => {
            try {
                // Retrieve payload from sessionStorage
                const payloadStr = sessionStorage.getItem('paymentPayload');
                if (!payloadStr) {
                    alert('Payment data not found. Please complete the insurance application form first.');
                    return;
                }

                const payload = JSON.parse(payloadStr);

                // POST the payload to the server endpoint that creates a payment session
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

                // Try to initialize Checkout Flow if the library is loaded
                try {
                    // Fetch the Checkout public key from the server
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
                        onReady: () => console.log('Checkout ready'),
                        onPaymentCompleted: (_component, paymentResponse) => {
                            console.log('Payment completed', paymentResponse);
                            // Redirect to success page after payment completion
                            setTimeout(() => {
                                window.location.href = '/success.html';
                            }, 1000);
                        },
                        onChange: (component) => console.log('onChange', component.type, component.isValid && component.isValid()),
                        onError: (component, error) => console.log('onError', error, component && component.type),
                    });

                    const flowComponent = checkout.create('flow');
                    flowComponent.mount(document.getElementById('flow-container'));
                } catch (initErr) {
                    // If Flow library isn't available or initialization fails, show the session payload for debugging
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
    }
}

function goBackToForm() {
    // Return to the insurance form
    window.location.href = '/insurance-form.html';
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
