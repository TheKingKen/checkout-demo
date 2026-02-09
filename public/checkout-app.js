// checkout-app.js
// JavaScript for checkout page functionality

// Global state
let cart = [];
let shippingAddress = null;
let selectedCarrier = { name: 'Regular Carrier', fee: 0 };
let checkoutPublicKey = '';
let checkoutEnvironment = 'sandbox';

// Helper function to check if cart contains only digital products
function isCartDigitalOnly() {
    if (cart.length === 0) return false;
    return cart.every(item => item.type === 'gift-card');
}

// Helper function to check if cart contains any physical products
function hasPhysicalProducts() {
    return cart.some(item => item.type !== 'gift-card');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Load cart from localStorage
    loadCart();
    
    // Initialize order summary
    renderOrderSummary();
    
    // Handle digital-only checkout
    handleDigitalOnlyCheckout();
    
    // Check if mobile and collapse order summary by default
    if (window.innerWidth <= 768) {
        collapseOrderSummary();
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Load Checkout.com configuration
    await loadCheckoutConfig();
    
    // Prefill shipping form if data exists (skip for digital-only)
    if (!isCartDigitalOnly()) {
        prefillShippingForm();
    }
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

// Handle digital-only checkout
function handleDigitalOnlyCheckout() {
    if (isCartDigitalOnly()) {
        console.log('🎁 Digital-only cart detected. Hiding shipping sections.');
        
        // Hide shipping and carrier sections
        const shippingSection = document.getElementById('shipping-section');
        const carrierSection = document.getElementById('carrier-section');
        
        if (shippingSection) shippingSection.style.display = 'none';
        if (carrierSection) carrierSection.style.display = 'none';
        
        // Show payment section and pay button immediately for digital-only
        const paymentSection = document.getElementById('payment-section');
        const payBtn = document.getElementById('pay-btn');
        const cardForm = document.getElementById('card-payment-form');
        
        if (paymentSection) {
            // Add digital goods message
            const digitalMessage = document.createElement('div');
            digitalMessage.className = 'digital-goods-message';
            digitalMessage.innerHTML = `
                <div style="background-color: #f0f8ff; border: 1px solid #87ceeb; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #333;">
                        <strong>💻 Digital Gift Card</strong><br/>
                        This is a digital gift card. No shipping address is required. 
                        You will receive a delivery confirmation via email.
                    </p>
                </div>
            `;
            paymentSection.insertBefore(digitalMessage, paymentSection.firstChild);
            
            // Show payment section
            paymentSection.classList.remove('hidden');
        }
        
        // Show card form and pay button
        if (cardForm) cardForm.classList.remove('hidden');
        if (payBtn) payBtn.classList.remove('hidden');
        
        // Update breadcrumb highlighting for digital-only flow
        const shippingBreadcrumb = document.getElementById('breadcrumb-shipping');
        const checkoutBreadcrumb = document.getElementById('breadcrumb-checkout');
        if (shippingBreadcrumb) shippingBreadcrumb.classList.remove('active');
        if (checkoutBreadcrumb) checkoutBreadcrumb.classList.add('active');
    }
}

// (rest of existing code continues...)

function calculateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    // Only add shipping fee if cart contains physical products
    const shippingFee = hasPhysicalProducts() ? selectedCarrier.fee : 0;
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
        
        // Handle gift cards
        if (item.type === 'gift-card') {
            html += `
                <div class="order-item">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border-radius: 6px; flex-shrink: 0;">$${item.price.toFixed(0)}</div>
                    <div class="order-item-details">
                        <div class="order-item-name">${item.name}</div>
                        <div class="order-item-price">$${item.price.toFixed(2)}</div>
                        <div class="order-item-quantity">Quantity: ${item.quantity}</div>
                    </div>
                    <div style="font-weight: 500;">$${itemSubtotal.toFixed(2)}</div>
                </div>
            `;
        } else {
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
        }
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
    
    // Cart breadcrumb - redirect to source page with cart overlay
    document.getElementById('breadcrumb-cart').addEventListener('click', (e) => {
        e.preventDefault();
        // Save a flag to show cart overlay on catalog page
        localStorage.setItem('showCartOnLoad', 'true');
        // Get the source page or default to phone-case-catalog
        const sourcePage = localStorage.getItem('checkoutSourcePage') || '/phone-case-catalog.html';
        window.location.href = sourcePage;
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
    
    // Pay button
    const payBtn = document.getElementById('pay-btn');
    if (payBtn) {
        payBtn.addEventListener('click', handlePayment);
    }
    
    // Card number formatting - add spacing every 4 digits
    const cardNumberInput = document.getElementById('card-number');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\s/g, ''); // Remove all spaces
            let formattedValue = '';
            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 4 === 0) {
                    formattedValue += ' ';
                }
                formattedValue += value[i];
            }
            e.target.value = formattedValue;
        });
    }
    
    // Expiry date formatting - auto add "/" after MM and auto-focus to CVV
    const expiryDateInput = document.getElementById('expiry-date');
    const cvvInput = document.getElementById('cvv');
    if (expiryDateInput) {
        expiryDateInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
            if (value.length >= 2) {
                value = value.slice(0, 2) + '/' + value.slice(2, 4);
            }
            e.target.value = value;
            
            // Auto-focus to CVV when 4 digits entered (MM/YY = 4 digits)
            if (value.replace(/\D/g, '').length === 4 && cvvInput) {
                cvvInput.focus();
            }
        });
    }
    
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
    
    // Update breadcrumb highlighting
    document.getElementById('breadcrumb-shipping').classList.remove('active');
    document.getElementById('breadcrumb-checkout').classList.add('active');
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
    
    // Update breadcrumb highlighting - back to shipping
    document.getElementById('breadcrumb-checkout').classList.remove('active');
    document.getElementById('breadcrumb-shipping').classList.add('active');
}

// Handle change carrier
function handleChangeCarrier() {
    // Expand carrier section
    const carrierSection = document.getElementById('carrier-section');
    carrierSection.classList.remove('collapsed');
    
    // Hide payment section and pay button
    document.getElementById('payment-section').classList.add('hidden');
    document.getElementById('pay-btn').classList.add('hidden');
    
    // Update breadcrumb highlighting - back to shipping
    document.getElementById('breadcrumb-checkout').classList.remove('active');
    document.getElementById('breadcrumb-shipping').classList.add('active');
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

// Prefill shipping form from saved data
function prefillShippingForm() {
    try {
        const savedStr = sessionStorage.getItem('userShippingAddress') || localStorage.getItem('userShippingAddress');
        if (!savedStr) return;
        
        const data = JSON.parse(savedStr);
        
        // Fill form fields if they exist
        const firstNameInput = document.getElementById('first-name');
        const lastNameInput = document.getElementById('last-name');
        const addressLine1Input = document.getElementById('address-line1');
        const addressLine2Input = document.getElementById('address-line2');
        const regionInput = document.getElementById('region');
        const countrySelect = document.getElementById('country');
        
        if (firstNameInput && data.firstName) firstNameInput.value = data.firstName;
        if (lastNameInput && data.lastName) lastNameInput.value = data.lastName;
        if (addressLine1Input && data.addressLine1) addressLine1Input.value = data.addressLine1;
        if (addressLine2Input && data.addressLine2) addressLine2Input.value = data.addressLine2;
        if (regionInput && data.region) regionInput.value = data.region;
        if (countrySelect && data.country) countrySelect.value = data.country;
        
        console.log('✅ Shipping form prefilled from saved data');
    } catch (e) {
        console.warn('Failed to prefill shipping form:', e);
    }
}

// Handle payment submission
async function handlePayment() {
    // Validate shipping address
    if (!shippingAddress) {
        alert('Please select shipping address and carrier first');
        return;
    }
    
    // Validate card form
    const cardForm = document.getElementById('card-payment-form');
    if (!cardForm.checkValidity()) {
        cardForm.reportValidity();
        return;
    }
    
    // Collect card data
    const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
    const cardholderName = document.getElementById('cardholder-name').value;
    const expiryDate = document.getElementById('expiry-date').value;
    const cvv = document.getElementById('cvv').value;
    
    // Validate card number (basic Luhn check)
    if (!isValidCardNumber(cardNumber)) {
        alert('Invalid card number');
        return;
    }
    
    // Validate expiry date
    if (!isValidExpiryDate(expiryDate)) {
        alert('Invalid expiry date (use MM/YY format)');
        return;
    }
    
    // Validate CVV
    if (!/^\d{3,4}$/.test(cvv)) {
        alert('Invalid CVV (3-4 digits required)');
        return;
    }
    
    // Disable pay button during submission
    const payBtn = document.getElementById('pay-btn');
    payBtn.disabled = true;
    payBtn.textContent = 'Processing...';
    
    try {
        // Parse expiry date
        const [expMonth, expYear] = expiryDate.split('/');
        
        // Calculate total amount
        const { total } = calculateTotals();
        const amountInMinorUnits = Math.round(total * 100);
        
        // Prepare payment data
        const paymentData = {
            source: {
                type: 'card',
                number: cardNumber,
                expiry_month: parseInt(expMonth),
                expiry_year: parseInt('20' + expYear),
                cvv: cvv
            },
            amount: amountInMinorUnits,
            currency: 'HKD',
            customer: {
                email: localStorage.getItem('userEmail') || 'customer@example.com',
                name: cardholderName
            },
            billing: {
                address: {
                    address_line1: shippingAddress.addressLine1,
                    address_line2: shippingAddress.addressLine2,
                    city: shippingAddress.region,
                    country: shippingAddress.country
                }
            },
            shipping: {
                address: {
                    address_line1: shippingAddress.addressLine1,
                    address_line2: shippingAddress.addressLine2,
                    city: shippingAddress.region,
                    country: shippingAddress.country
                }
            },
            reference: `ORDER-${Date.now()}`,
            success_url: `${window.location.origin}/success.html`,
            failure_url: `${window.location.origin}/failure.html`
        };
        
        console.log('💳 Submitting payment...');
        
        // Call process-payment endpoint
        const response = await fetch('/process-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || `Payment failed with status ${response.status}`);
        }
        
        console.log('✅ Payment successful:', result);
        
        // Redirect to success page
        setTimeout(() => {
            window.location.href = '/success.html';
        }, 1000);
        
    } catch (error) {
        console.error('❌ Payment failed:', error);
        alert('Payment failed: ' + error.message);
        
        // Re-enable pay button
        payBtn.disabled = false;
        payBtn.textContent = 'Pay';
    }
}

// Validate card number using Luhn algorithm
function isValidCardNumber(cardNumber) {
    if (!/^\d{13,19}$/.test(cardNumber)) {
        return false;
    }
    
    // Basic Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber[i]);
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    return sum % 10 === 0;
}

// Validate expiry date
function isValidExpiryDate(expiryDate) {
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
        return false;
    }
    
    const [month, year] = expiryDate.split('/');
    const monthNum = parseInt(month);
    
    if (monthNum < 1 || monthNum > 12) {
        return false;
    }
    
    // Check if expiry date is in the future
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const expiryYear = 2000 + parseInt(year);
    
    if (expiryYear < currentYear) {
        return false;
    }
    
    if (expiryYear === currentYear && monthNum < currentMonth) {
        return false;
    }
    
    return true;
}
