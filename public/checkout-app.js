// checkout-app.js
// JavaScript for checkout page functionality

// Global state
let cart = [];
let shippingAddress = null;
let selectedCarrier = { name: 'Regular Carrier', fee: 0 };
let checkoutPublicKey = '';
let checkoutEnvironment = 'sandbox';

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Load cart from localStorage
    loadCart();
    
    // Initialize order summary
    renderOrderSummary();
    
    // Check if mobile and collapse order summary by default
    if (window.innerWidth <= 768) {
        collapseOrderSummary();
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Load Checkout.com configuration
    await loadCheckoutConfig();
    
    // Initialize Express Payment (Checkout.com Payment Flow)
    await initializeExpressPayment();
});

// Load cart from localStorage
function loadCart() {
    const cartData = localStorage.getItem('cart');
    if (cartData) {
        try {
            cart = JSON.parse(cartData);
        } catch (e) {
            console.error('Failed to parse cart data:', e);
            cart = [];
        }
    }
    
    // If cart is empty, redirect to catalog
    if (cart.length === 0) {
        alert('Your cart is empty');
        window.location.href = '/phone-case-catalog.html';
    }
}

// Calculate totals
function calculateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = selectedCarrier.fee;
    const total = subtotal + shippingFee;
    
    return { subtotal, shippingFee, total };
}

// Render order summary
function renderOrderSummary() {
    const container = document.getElementById('order-summary-content');
    const { subtotal, shippingFee, total } = calculateTotals();
    
    let html = '';
    
    // Render cart items
    cart.forEach(item => {
        const itemSubtotal = item.price * item.quantity;
        html += `
            <div class="order-item">
                <img src="${item.image}" alt="${item.name}" class="order-item-image">
                <div class="order-item-details">
                    <div class="order-item-name">${item.name}</div>
                    <div class="order-item-price">$${item.price.toFixed(2)}</div>
                    <div class="order-item-quantity">Quantity: ${item.quantity}</div>
                </div>
                <div style="font-weight: 500;">$${itemSubtotal.toFixed(2)}</div>
            </div>
        `;
    });
    
    // Add summary rows
    html += `
        <div class="order-summary-row">
            <span>Subtotal</span>
            <span>$${subtotal.toFixed(2)}</span>
        </div>
        <div class="order-summary-row">
            <span>Shipping</span>
            <span id="shipping-fee-display">${shippingFee === 0 ? 'Free' : '$' + shippingFee.toFixed(2)}</span>
        </div>
        <div class="order-summary-row total">
            <span>Total</span>
            <span id="total-amount-display">$${total.toFixed(2)}</span>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Update mobile total display
    const mobileTotalEl = document.getElementById('order-total-mobile');
    if (mobileTotalEl) {
        mobileTotalEl.textContent = `$${total.toFixed(2)}`;
    }
}

// Toggle order summary collapse/expand
function collapseOrderSummary() {
    const orderSummary = document.getElementById('order-summary');
    const toggleArrow = document.getElementById('toggle-summary');
    orderSummary.classList.add('collapsed');
    toggleArrow.classList.remove('expanded');
}

function expandOrderSummary() {
    const orderSummary = document.getElementById('order-summary');
    const toggleArrow = document.getElementById('toggle-summary');
    orderSummary.classList.remove('collapsed');
    toggleArrow.classList.add('expanded');
}

// Setup event listeners
function setupEventListeners() {
    // Back button
    document.getElementById('back-button').addEventListener('click', () => {
        window.history.back();
    });
    
    // Cart breadcrumb - redirect to catalog with cart overlay
    document.getElementById('breadcrumb-cart').addEventListener('click', (e) => {
        e.preventDefault();
        // Save a flag to show cart overlay on catalog page
        localStorage.setItem('showCartOnLoad', 'true');
        window.location.href = '/phone-case-catalog.html';
    });
    
    // Toggle order summary
    document.getElementById('toggle-summary').addEventListener('click', (e) => {
        e.stopPropagation();
        const orderSummary = document.getElementById('order-summary');
        if (orderSummary.classList.contains('collapsed')) {
            expandOrderSummary();
        } else {
            collapseOrderSummary();
        }
    });
    
    // Order summary header click (mobile) - toggle on entire header
    const orderSummaryHeader = document.querySelector('.order-summary-header');
    if (orderSummaryHeader) {
        orderSummaryHeader.addEventListener('click', (e) => {
            // Only toggle if on mobile (when order summary can be collapsed)
            if (window.innerWidth <= 768) {
                const orderSummary = document.getElementById('order-summary');
                if (orderSummary.classList.contains('collapsed')) {
                    expandOrderSummary();
                } else {
                    collapseOrderSummary();
                }
            }
        });
    }
    
    // Choose shipping carrier button
    document.getElementById('choose-carrier-btn').addEventListener('click', handleChooseCarrier);
    
    // Continue checkout button
    document.getElementById('continue-checkout-btn').addEventListener('click', handleContinueCheckout);
    
    // Change shipping button
    document.getElementById('change-shipping-btn').addEventListener('click', handleChangeShipping);
    
    // Change carrier button
    document.getElementById('change-carrier-btn').addEventListener('click', handleChangeCarrier);
    
    // Shipping option selection
    document.querySelectorAll('.shipping-option').forEach(option => {
        option.addEventListener('click', handleCarrierSelection);
    });
    
    // Window resize handler
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            collapseOrderSummary();
        } else {
            expandOrderSummary();
        }
    });
}

// Handle choose carrier button click
function handleChooseCarrier() {
    // Validate shipping form
    const form = document.getElementById('shipping-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Collect shipping address
    const formData = new FormData(form);
    shippingAddress = {
        firstName: formData.get('first-name'),
        lastName: formData.get('last-name'),
        addressLine1: formData.get('address-line1'),
        addressLine2: formData.get('address-line2'),
        region: formData.get('region'),
        country: formData.get('country')
    };
    
    // Collapse shipping section
    const shippingSection = document.getElementById('shipping-section');
    shippingSection.classList.add('collapsed');
    
    // Update collapsed display
    const countrySelect = document.getElementById('country');
    const countryName = countrySelect.options[countrySelect.selectedIndex].text;
    const addressDisplay = `${shippingAddress.firstName} ${shippingAddress.lastName}, ${shippingAddress.addressLine1}, ${shippingAddress.region}, ${countryName}`;
    document.getElementById('shipping-address-display').textContent = addressDisplay;
    
    // Show carrier section
    document.getElementById('carrier-section').classList.remove('hidden');
    
    // Hide choose carrier button
    document.getElementById('choose-carrier-btn').style.display = 'none';
}

// Handle carrier selection
function handleCarrierSelection(e) {
    const clickedOption = e.currentTarget;
    
    // Update visual selection
    document.querySelectorAll('.shipping-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    clickedOption.classList.add('selected');
    
    // Update radio button
    const radio = clickedOption.querySelector('input[type="radio"]');
    radio.checked = true;
    
    // Update selected carrier
    const carrierName = clickedOption.dataset.carrier === 'regular' ? 'Regular Carrier' : 'Express Carrier';
    const carrierFee = parseFloat(clickedOption.dataset.fee);
    selectedCarrier = { name: carrierName, fee: carrierFee };
    
    // Update order summary
    renderOrderSummary();
}

// Handle continue checkout button
function handleContinueCheckout() {
    // Collapse carrier section
    const carrierSection = document.getElementById('carrier-section');
    carrierSection.classList.add('collapsed');
    
    // Update collapsed display
    const feeText = selectedCarrier.fee === 0 ? 'Free' : `$${selectedCarrier.fee.toFixed(2)}`;
    document.getElementById('carrier-display').textContent = `${selectedCarrier.name} - ${feeText}`;
    
    // Show payment section
    document.getElementById('payment-section').classList.remove('hidden');
    
    // Show pay button
    document.getElementById('pay-btn').classList.remove('hidden');
}

// Handle change shipping address
function handleChangeShipping() {
    // Expand shipping section
    const shippingSection = document.getElementById('shipping-section');
    shippingSection.classList.remove('collapsed');
    
    // Show choose carrier button
    document.getElementById('choose-carrier-btn').style.display = 'block';
    
    // Hide carrier section (but don't collapse it, so it will show expanded when made visible again)
    const carrierSection = document.getElementById('carrier-section');
    carrierSection.classList.add('hidden');
    carrierSection.classList.remove('collapsed');
    
    // Hide payment section and pay button
    document.getElementById('payment-section').classList.add('hidden');
    document.getElementById('pay-btn').classList.add('hidden');
}

// Handle change carrier
function handleChangeCarrier() {
    // Expand carrier section
    const carrierSection = document.getElementById('carrier-section');
    carrierSection.classList.remove('collapsed');
    
    // Hide payment section and pay button
    document.getElementById('payment-section').classList.add('hidden');
    document.getElementById('pay-btn').classList.add('hidden');
}

// Load Checkout.com configuration
async function loadCheckoutConfig() {
    try {
        const response = await fetch('/api/checkout-config');
        const config = await response.json();
        checkoutPublicKey = config.publicKey;
        checkoutEnvironment = config.environment;
        console.log('Checkout.com config loaded:', { environment: checkoutEnvironment });
    } catch (error) {
        console.error('Failed to load Checkout.com config:', error);
    }
}

// Initialize Express Payment (Checkout.com Payment Flow)
async function initializeExpressPayment() {
    if (!checkoutPublicKey) {
        console.error('Checkout.com public key not available');
        return;
    }
    
    try {
        // Calculate total amount
        const { total } = calculateTotals();
        const amountInMinorUnits = Math.round(total * 100); // Convert to cents
        
        // Map all cart items to products array
        const products = cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit_price: Math.round(item.price * 100),
            reference: item.id
        }));
        
        // Create payment session with only card and applepay enabled
        const paymentSessionResponse = await fetch('/create-payment-sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amountInMinorUnits,
                currency: 'HKD',
                country: 'HK',
                customer: {
                    name: 'Guest Customer',
                    email: 'guest@example.com',
                    phone_number: '12345678',
                    phone_country_code: '+852'
                },
                products: products,
                enable_payment_methods: ['card', 'applepay'], // Only enable card and Apple Pay
                disable_payment_methods: []
            })
        });
        
        if (!paymentSessionResponse.ok) {
            const errorData = await paymentSessionResponse.json();
            console.error('Payment session error:', errorData);
            throw new Error(errorData.details || errorData.error || 'Failed to create payment session');
        }
        
        const paymentSession = await paymentSessionResponse.json();
        console.log('Payment session created:', paymentSession);
        
        // Initialize Checkout.com Web Components for Flow
        if (window.CheckoutWebComponents) {
            const checkout = await window.CheckoutWebComponents({
                publicKey: checkoutPublicKey,
                environment: checkoutEnvironment,
                locale: 'en-GB',
                paymentSession: paymentSession,
                onReady: () => {
                    console.log('Express checkout ready');
                },
                onPaymentCompleted: (component, paymentResponse) => {
                    console.log('Express payment completed', paymentResponse);
                    // Redirect to success page
                    setTimeout(() => {
                        window.location.href = '/success.html';
                    }, 1000);
                },
                onChange: (component) => {
                    console.log('Payment method changed:', component.type);
                },
                onError: (component, error) => {
                    console.error('Payment error:', error);
                    alert('Payment error: ' + (error.message || 'Unknown error'));
                }
            });
            
            // Create and mount Flow component
            const flowComponent = checkout.create('flow');
            const container = document.getElementById('express-payment-container');
            if (container) {
                flowComponent.mount(container);
                console.log('Express payment Flow component mounted');
            }
        } else {
            console.error('Checkout.com Web Components not loaded');
        }
    } catch (error) {
        console.error('Failed to initialize express payment:', error);
    }
}
