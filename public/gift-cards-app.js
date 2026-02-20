// public/gift-cards-app.js

// Cart state
let cart = [];

// Original HKD prices for gift cards
const GIFT_CARD_PRICES_HKD = {
    amount100: 100,
    amount200: 200,
    amount500: 500,
    amount1000: 1000
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function () {
    const loginBtn = document.getElementById('login-btn');
    const cartBtn = document.getElementById('cart-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const checkoutBtn = document.getElementById('checkout-btn');
    const loginOverlay = document.getElementById('login-overlay');
    const closeLoginBtn = document.getElementById('close-login-btn');
    const cartOverlay = document.getElementById('cart-overlay');
    const loginForm = document.getElementById('login-form');
    const giftCardForm = document.getElementById('gift-card-form');
    const designOptions = document.querySelectorAll('input[name="design"]');
    const amountOptions = document.querySelectorAll('input[name="amount"]');
    const messageField = document.getElementById('gift-message');
    const charCount = document.getElementById('char-count');
    const previewAmount = document.getElementById('preview-amount');
    const previewAmountMobile = document.querySelector('.preview-amount-mobile');
    const previewCards = document.querySelectorAll('.preview-card');

    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }

    window.CurrencyUtils.ensureTranslations();
    window.CurrencyUtils.applyTranslations('gift-cards');

    function getGiftCardStrings() {
        return window.CurrencyUtils.getTranslations('gift-cards');
    }

    function updateLoginButtonLabel() {
        const strings = getGiftCardStrings();
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        loginBtn.textContent = isLoggedIn ? (strings.logoutButton || 'LOGOUT') : (strings.loginButton || 'LOGIN');
    }

    // Check if user is already logged in
    updateLoginButtonLabel();

    // Update preview when design changes
    designOptions.forEach(option => {
        option.addEventListener('change', (e) => {
            const colors = {
                red: '#e74c3c',
                blue: '#3498db',
                green: '#27ae60',
                purple: '#9b59b6'
            };
            // Update both desktop and mobile preview cards
            previewCards.forEach(card => {
                card.style.backgroundColor = colors[e.target.value];
            });
        });
    });

    // Update character count
    messageField.addEventListener('input', (e) => {
        charCount.textContent = e.target.value.length;
    });

    // Login button - toggle login/logout
    loginBtn.addEventListener('click', () => {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        if (isLoggedIn) {
            // Logout
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userShippingAddress');
            updateLoginButtonLabel();
            alert(getGiftCardStrings().alertLoggedOut || 'Logged out successfully');
        } else {
            // Show login overlay
            loginOverlay.classList.remove('hidden');
        }
    });

    // Cart button - show overlay
    cartBtn.addEventListener('click', () => {
        cartOverlay.classList.remove('hidden');
        updateCartDisplay();
    });

    // Close cart button
    closeCartBtn.addEventListener('click', () => {
        cartOverlay.classList.add('hidden');
    });

    // Close login button
    closeLoginBtn.addEventListener('click', () => {
        loginOverlay.classList.add('hidden');
    });

    // Click overlay background to close
    cartOverlay.addEventListener('click', (e) => {
        if (e.target === cartOverlay) {
            cartOverlay.classList.add('hidden');
        }
    });
    
    // Click login overlay background to close
    loginOverlay.addEventListener('click', (e) => {
        if (e.target === loginOverlay) {
            loginOverlay.classList.add('hidden');
        }
    });

    // Login form submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Simple validation
        if (username && password) {
            // Store login state
            localStorage.setItem('isLoggedIn', 'true');
            
            // Store complete user data for checkout
            const userData = {
                name: 'Ken So',
                email: 'ken.so@checkout.com',
                phone_number: '64416246',
                phone_country_code: '+852',
                firstName: 'Ken',
                lastName: 'So',
                addressLine1: 'Level 14, Five Pacific Place',
                addressLine2: '28 Hennessy Road',
                region: 'Wan Chai',
                country: 'HK'
            };
            localStorage.setItem('userShippingAddress', JSON.stringify(userData));
            
            // Update login button text
            updateLoginButtonLabel();
            
            // Close login overlay
            loginOverlay.classList.add('hidden');
            
            // Show success message
            alert(getGiftCardStrings().alertLoginSuccess || 'Login successful!');
        }
    });

    // Gift card form submission
    giftCardForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get form data
        const design = document.querySelector('input[name="design"]:checked').value;
        const amount = parseFloat(document.querySelector('input[name="amount"]:checked').value);
        const recipientName = document.getElementById('recipient-name').value;
        const recipientEmail = document.getElementById('recipient-email').value;
        const senderName = document.getElementById('sender-name').value;
        const senderEmail = document.getElementById('sender-email').value;
        const message = document.getElementById('gift-message').value;

        // Create gift card item
        const currency = window.CurrencyUtils.getCurrentCurrency();
        const convertedPrice = window.CurrencyUtils.convertPrice(amount, currency);
        const formattedAmount = window.CurrencyUtils.formatPrice(amount, currency);
        
        const strings = getGiftCardStrings();
        const giftCardName = strings.giftCardName || 'Gift Card';
        const giftCard = {
            id: `gift-card-${Date.now()}`,
            name: `${giftCardName} - ${formattedAmount}`,
            price: convertedPrice,
            priceHKD: amount,
            currency: currency,
            quantity: 1,
            image: null,
            type: 'gift-card',  // Mark as digital product
            design: design,
            recipientName: recipientName,
            recipientEmail: recipientEmail,
            senderName: senderName,
            senderEmail: senderEmail,
            message: message
        };

        // Add to cart
        cart.push(giftCard);
        localStorage.setItem('cart', JSON.stringify(cart));

        // Show success message
        const prefix = strings.giftCardAddedPrefix || 'Gift Card (';
        const suffix = strings.giftCardAddedSuffix || ') added to cart!';
        alert(`${prefix}${formattedAmount}${suffix}`);

        // Reset form
        giftCardForm.reset();
        charCount.textContent = '0';
        const defaultFormatted = window.CurrencyUtils.formatPrice(100, currency);
        previewAmount.textContent = defaultFormatted;
        if (previewAmountMobile) previewAmountMobile.textContent = defaultFormatted;
        // Reset both desktop and mobile preview cards to red (default)
        previewCards.forEach(card => {
            card.style.backgroundColor = '#e74c3c';
        });
    });

    // Checkout button
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert(getGiftCardStrings().alertCartEmpty || 'Your cart is empty');
            return;
        }
        
        // Save cart to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Save the source page for cart breadcrumb navigation
        localStorage.setItem('checkoutSourcePage', '/gift-cards.html');
        
        // Redirect to checkout page
        window.location.href = '/checkout.html';
    });

    // Express Checkout button (digital-only)
    const expressCheckoutBtn = document.getElementById('express-checkout-btn');
    if (expressCheckoutBtn) {
        expressCheckoutBtn.addEventListener('click', handleExpressCheckout);
    }

    // Initialize currency conversion
    await window.CurrencyUtils.fetchFXRates();
    updateGiftCardPrices();
});

// Update gift card prices based on current currency
function updateGiftCardPrices() {
    const currency = window.CurrencyUtils.getCurrentCurrency();
    
    // Update amount labels
    const amountLabels = document.querySelectorAll('.amount-label');
    amountLabels.forEach((label, index) => {
        const priceKey = ['amount100', 'amount200', 'amount500', 'amount1000'][index];
        const hkdPrice = GIFT_CARD_PRICES_HKD[priceKey];
        const formattedPrice = window.CurrencyUtils.formatPrice(hkdPrice, currency);
        label.textContent = formattedPrice;
    });
    
    // Update preview amounts
    const selectedAmount = document.querySelector('input[name="amount"]:checked');
    if (selectedAmount) {
        const hkdValue = parseFloat(selectedAmount.value);
        const formattedPrice = window.CurrencyUtils.formatPrice(hkdValue, currency);
        const previewAmount = document.getElementById('preview-amount');
        const previewAmountMobile = document.querySelector('.preview-amount-mobile');
        if (previewAmount) previewAmount.textContent = formattedPrice;
        if (previewAmountMobile) previewAmountMobile.textContent = formattedPrice;
    }
}

// Override amount change handler
document.addEventListener('DOMContentLoaded', () => {
    const amountOptions = document.querySelectorAll('input[name="amount"]');
    amountOptions.forEach(option => {
        option.addEventListener('change', (e) => {
            const hkdValue = parseFloat(e.target.value);
            const currency = window.CurrencyUtils.getCurrentCurrency();
            const formattedPrice = window.CurrencyUtils.formatPrice(hkdValue, currency);
            const previewAmount = document.getElementById('preview-amount');
            const previewAmountMobile = document.querySelector('.preview-amount-mobile');
            if (previewAmount) previewAmount.textContent = formattedPrice;
            if (previewAmountMobile) previewAmountMobile.textContent = formattedPrice;
        });
    });
});

// Sync cart items with current currency from sessionStorage
function syncCartWithCurrentCurrency() {
    const currentCurrency = window.CurrencyUtils.getCurrentCurrency();
    const strings = window.CurrencyUtils.getTranslations('gift-cards');
    const giftCardName = strings.giftCardName || 'Gift Card';
    
    cart.forEach(item => {
        if (item.priceHKD) {
            const newPrice = window.CurrencyUtils.convertPrice(item.priceHKD, currentCurrency);
            item.price = newPrice;
            item.currency = currentCurrency;
            const formattedAmount = window.CurrencyUtils.formatPrice(item.priceHKD, currentCurrency);

            // Update the item name to reflect current locale and currency
            if (item.type === 'gift-card') {
                item.name = `${giftCardName} - ${formattedAmount}`;
            } else {
                const baseName = item.name.split(' - ')[0];
                item.name = `${baseName} - ${formattedAmount}`;
            }
        }
    });
    
    // Save updated cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Update cart display in the overlay
function updateCartDisplay() {
    // Sync cart with current currency before displaying
    syncCartWithCurrentCurrency();
    
    const cartItemsContainer = document.getElementById('cart-items');

    if (cart.length === 0) {
        const strings = window.CurrencyUtils.getTranslations('gift-cards');
        cartItemsContainer.innerHTML = `<p class="empty-cart-message">${strings.emptyCart || 'Your cart is empty'}</p>`;
        return;
    }

    let html = '<div class="cart-list">';

    cart.forEach((item, index) => {
        const itemCurrency = item.currency || 'HKD';
        const itemTotal = item.price * item.quantity;
        const strings = window.CurrencyUtils.getTranslations('gift-cards');
        const formattedPrice = `${itemCurrency} ${item.price.toFixed(itemCurrency === 'JPY' ? 0 : 2)}`;
        const formattedTotal = `${itemCurrency} ${itemTotal.toFixed(itemCurrency === 'JPY' ? 0 : 2)}`;
        
        const giftCardDetails = item.type === 'gift-card'
            ? `
                <p class="cart-item-extra">${strings.designLabel || 'Design'}: ${item.design || 'N/A'}</p>
                <p class="cart-item-extra">${strings.recipientLabel || 'Recipient'}: ${item.recipientName || 'N/A'}</p>
                <p class="cart-item-extra">${strings.senderLabel || 'Sender'}: ${item.senderName || 'N/A'}</p>
            `
            : '';

        html += `
            <div class="cart-item">
                <div class="cart-item-details">
                    <p class="cart-item-name">${item.name}</p>
                    <p class="cart-item-price">${formattedPrice} ${strings.eachLabel || 'each'}</p>
                    ${giftCardDetails}
                </div>
                <div class="cart-item-quantity">
                    <button class="qty-btn minus-btn" onclick="updateQuantity(${index}, -1)">−</button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="qty-btn plus-btn" onclick="updateQuantity(${index}, 1)">+</button>
                </div>
                <div class="cart-item-total">
                    <p class="item-total">${formattedTotal}</p>
                    <button class="remove-btn" onclick="removeFromCart(${index})">${strings.removeButton || 'Remove'}</button>
                </div>
            </div>
        `;
    });

    let cartTotal = 0;
    let cartCurrency = cart[0]?.currency || 'HKD';
    
    cart.forEach(item => {
        if (item.currency === cartCurrency) {
            cartTotal += item.price * item.quantity;
        }
    });
    
    const formattedCartTotal = `${cartCurrency} ${cartTotal.toFixed(cartCurrency === 'JPY' ? 0 : 2)}`;

    html += `
        <div class="cart-summary">
            <p class="summary-label">${(window.CurrencyUtils.getTranslations('gift-cards').totalLabel || 'Total')}:</p>
            <p class="summary-total">${formattedCartTotal}</p>
        </div>
    </div>`;

    cartItemsContainer.innerHTML = html;
}

// Update quantity of cart item
function updateQuantity(index, change) {
    if (cart[index]) {
        cart[index].quantity += change;
        
        if (cart[index].quantity <= 0) {
            removeFromCart(index);
        } else {
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartDisplay();
        }
    }
}

// Remove item from cart
function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
}

// Resume gift card form after Express Checkout
function resumeGiftCardForm() {
    const giftCardForm = document.getElementById('gift-card-form');
    const addToCartBtn = giftCardForm.querySelector('button[type="submit"]');
    const expressBtn = document.getElementById('express-checkout-btn');
    const expressLayout = document.getElementById('gift-express-layout');
    const mobilePreview = document.querySelector('.mobile-preview');
    const desktopPreview = document.querySelector('.desktop-preview');
    
    // Show form again
    giftCardForm.style.display = '';
    if (mobilePreview) mobilePreview.style.display = '';
    if (desktopPreview) desktopPreview.style.display = '';
    
    // Re-enable buttons
    addToCartBtn.disabled = false;
    expressBtn.disabled = false;
    const strings = window.CurrencyUtils.getTranslations('gift-cards');
    expressBtn.textContent = strings.expressCheckoutButton || 'Express Checkout';
    
    // Remove express checkout layout
    if (expressLayout) {
        expressLayout.remove();
    }
}

function collapseGiftOrderSummary() {
    const orderSummary = document.getElementById('gift-order-summary');
    const toggleArrow = document.getElementById('gift-toggle-summary');
    if (!orderSummary || !toggleArrow) return;
    orderSummary.classList.add('collapsed');
    toggleArrow.classList.remove('expanded');
}

function expandGiftOrderSummary() {
    const orderSummary = document.getElementById('gift-order-summary');
    const toggleArrow = document.getElementById('gift-toggle-summary');
    if (!orderSummary || !toggleArrow) return;
    orderSummary.classList.remove('collapsed');
    toggleArrow.classList.add('expanded');
}

function setupGiftOrderSummaryToggle() {
    const orderSummary = document.getElementById('gift-order-summary');
    const toggleArrow = document.getElementById('gift-toggle-summary');
    const summaryHeader = orderSummary ? orderSummary.querySelector('.order-summary-header') : null;

    if (!orderSummary || !toggleArrow) return;

    toggleArrow.addEventListener('click', (e) => {
        e.stopPropagation();
        if (orderSummary.classList.contains('collapsed')) {
            expandGiftOrderSummary();
        } else {
            collapseGiftOrderSummary();
        }
    });

    if (summaryHeader) {
        summaryHeader.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                if (orderSummary.classList.contains('collapsed')) {
                    expandGiftOrderSummary();
                } else {
                    collapseGiftOrderSummary();
                }
            }
        });
    }

    // Set initial state based on screen width
    if (window.innerWidth <= 768) {
        collapseGiftOrderSummary();
    } else {
        expandGiftOrderSummary();
    }

    // Add resize listener to auto-expand on wide screens
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (window.innerWidth > 768) {
                expandGiftOrderSummary();
            } else {
                if (!orderSummary.classList.contains('collapsed')) {
                    collapseGiftOrderSummary();
                }
            }
        }, 100);
    });
}

// Check if cart contains only digital items (gift cards)
function isCartDigitalOnly() {
    if (cart.length === 0) return false;
    return cart.every(item => item.type === 'gift-card');
}

// Map currency to country code
function getCountryFromCurrency(currency) {
    const currencyToCountry = {
        'HKD': 'HK',  // Hong Kong
        'USD': 'US',  // United States
        'GBP': 'GB',  // United Kingdom
        'AED': 'AE',  // United Arab Emirates
        'CNY': 'CN',  // China
        'JPY': 'JP',  // Japan
        'SGD': 'SG'   // Singapore
    };
    return currencyToCountry[currency] || 'HK'; // Default to HK if not found
}

// Handle Express Checkout click
async function handleExpressCheckout() {
    const expressBtn = document.getElementById('express-checkout-btn');
    const giftCardForm = document.getElementById('gift-card-form');
    const formContainer = giftCardForm.parentElement;
    const addToCartBtn = giftCardForm.querySelector('button[type="submit"]');
    const strings = window.CurrencyUtils.getTranslations('gift-cards');
    
    // Validate gift card form first
    if (!giftCardForm.checkValidity()) {
        giftCardForm.reportValidity();
        return;
    }
    
    // Get form data
    const design = document.querySelector('input[name="design"]:checked').value;
    const amount = parseFloat(document.querySelector('input[name="amount"]:checked').value);
    const recipientName = document.getElementById('recipient-name').value;
    const recipientEmail = document.getElementById('recipient-email').value;
    const senderName = document.getElementById('sender-name').value;
    const senderEmail = document.getElementById('sender-email').value;
    const message = document.getElementById('gift-message').value;
    
    // Get current currency and convert amount
    const currency = window.CurrencyUtils.getCurrentCurrency();
    const convertedAmount = window.CurrencyUtils.convertPrice(amount, currency);
    const formattedAmountForItem = window.CurrencyUtils.formatPrice(amount, currency);
    
    // Create gift card item
    const giftCardName = strings.giftCardName || 'Gift Card';
    const designMap = {
        red: strings.designRed || 'Red',
        blue: strings.designBlue || 'Blue',
        green: strings.designGreen || 'Green',
        purple: strings.designPurple || 'Purple'
    };
    const giftCard = {
        id: `gift-card-${Date.now()}`,
        name: `${giftCardName} - ${formattedAmountForItem}`,
        price: convertedAmount,
        priceHKD: amount,
        currency: currency,
        quantity: 1,
        image: null,
        type: 'gift-card',
        design: design,
        recipientName: recipientName,
        recipientEmail: recipientEmail,
        senderName: senderName,
        senderEmail: senderEmail,
        message: message
    };
    
    // Create order summary HTML
    const colors = {
        red: '#e74c3c',
        blue: '#3498db',
        green: '#27ae60',
        purple: '#9b59b6'
    };
    const designColor = colors[design] || '#667eea';
    
    // Format amount with current currency (reuse currency from above)
    const formattedAmount = window.CurrencyUtils.formatPrice(amount, currency);
    
    const orderSummaryHTML = `
        <div class="order-summary-wrapper-header">
            <button class="back-arrow-btn gift-summary-back" type="button">← ${strings.expressBack || 'Back to Gift Card Form'}</button>
        </div>
        <div class="gift-express-left">
            <div id="flow-display" class="gift-flow-container">
                <p style="text-align: center; padding: 20px;">${strings.expressLoading || 'Loading payment form...'}</p>
            </div>
        </div>
        <div class="gift-express-right">
            <div class="order-summary gift-order-summary" id="gift-order-summary">
                <div class="order-summary-header">
                    <h2 class="order-summary-title">
                        ${strings.expressOrderSummary || 'Order Summary'}
                        <div class="toggle-arrow" id="gift-toggle-summary">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                            </svg>
                        </div>
                    </h2>
                    <div class="order-total-mobile" id="gift-order-total-mobile">${formattedAmount}</div>
                </div>
                <div class="order-summary-content" id="gift-order-summary-content">
                    <div class="order-item">
                        <div style="background-color: ${designColor}; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border-radius: 8px; flex-shrink: 0; font-size: 28px;">$</div>
                        <div class="order-item-details">
                            <div class="order-item-name">${giftCardName} - ${formattedAmount}</div>
                            <div class="order-item-price">${formattedAmount}</div>
                            <div class="order-item-quantity">${strings.expressQuantity || 'Quantity'}: 1</div>
                            <div class="gift-card-meta">
                                <div>${strings.designLabel || 'Design'}: <strong style="text-transform: capitalize;">${designMap[design] || design}</strong></div>
                                <div>${strings.recipientLabel || 'Recipient'}: <strong>${recipientName}</strong></div>
                                <div>${strings.senderLabel || 'Sender'}: <strong>${senderName}</strong></div>
                                <div>${strings.expressRecipientEmail || 'Recipient Email'}: <strong>${recipientEmail}</strong></div>
                                <div>${strings.expressSenderEmail || 'Your Email'}: <strong>${senderEmail}</strong></div>
                                ${message ? `<div>${strings.expressMessage || 'Message'}: <strong>${message}</strong></div>` : ''}
                            </div>
                        </div>
                        <div style="font-weight: 500;">${formattedAmount}</div>
                    </div>
                    <div class="order-summary-row total">
                        <span>${strings.expressTotal || 'Total'}</span>
                        <span>${formattedAmount}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Hide form and preview sections
    giftCardForm.style.display = 'none';
    const mobilePreview = document.querySelector('.mobile-preview');
    const desktopPreview = document.querySelector('.desktop-preview');
    if (mobilePreview) mobilePreview.style.display = 'none';
    if (desktopPreview) desktopPreview.style.display = 'none';
    
    addToCartBtn.disabled = true;
    expressBtn.disabled = true;
    expressBtn.textContent = strings.expressProcessing || 'Processing...';
    
    // Remove any existing express checkout layout
    const existingLayout = document.getElementById('gift-express-layout');
    if (existingLayout) {
        existingLayout.remove();
    }
    
    // Insert express checkout layout before form in the container
    const layout = document.createElement('div');
    layout.id = 'gift-express-layout';
    layout.className = 'gift-express-layout';
    const wrapper = document.createElement('div');
    wrapper.className = 'order-summary-wrapper';
    wrapper.innerHTML = orderSummaryHTML;
    layout.appendChild(wrapper);
    formContainer.insertBefore(layout, giftCardForm);
    
    const backBtn = layout.querySelector('.gift-summary-back');
    if (backBtn) {
        backBtn.addEventListener('click', resumeGiftCardForm);
    }
    setupGiftOrderSummaryToggle();
    
    try {
        // Get user data from localStorage if available
        let customerData = {
            email: senderEmail,
            name: senderName,
            phone_number: '64416246',
            phone_country_code: '+852'
        };
        
        try {
            const savedUserData = localStorage.getItem('userShippingAddress');
            if (savedUserData) {
                const userData = JSON.parse(savedUserData);
                if (userData.email) customerData.email = userData.email;
                if (userData.name) customerData.name = userData.name;
                if (userData.phone_number) customerData.phone_number = userData.phone_number;
                if (userData.phone_country_code) customerData.phone_country_code = userData.phone_country_code;
            }
        } catch (e) {
            console.warn('Could not load user data from localStorage:', e);
        }
        
        // Get country code from selected currency
        const countryCode = getCountryFromCurrency(currency);
        
        // Prepare payment session payload
        const payload = {
            customer: customerData,
            amount: Math.round(convertedAmount * 100),
            currency: currency,
            products: [{
                name: giftCard.name,
                quantity: giftCard.quantity,
                unit_price: Math.round(convertedAmount * 100),
                reference: giftCard.id || giftCard.name
            }],
            country: countryCode
        };
        
        console.log('Creating payment session with payload:', payload);
        
        // Call server to create payment session
        const response = await fetch('/create-payment-sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const paymentSession = await response.json();
        
        if (!response.ok || paymentSession.error) {
            throw new Error(paymentSession.error || 'Failed to create payment session');
        }
        
        console.log('Payment session created:', paymentSession);
        
        // Get Checkout.com public key
        const configResponse = await fetch('/api/checkout-config');
        const config = await configResponse.json();
        const CHECKOUT_PUBLIC_KEY = config.publicKey;
        
        if (!CHECKOUT_PUBLIC_KEY) {
            throw new Error('Checkout public key not configured');
        }
        
        // Initialize Checkout Flow component
        const locale = window.CurrencyUtils.getCurrentLocale() === 'zh' ? 'zh-CN' : 'en-GB';
        const checkout = await CheckoutWebComponents({
            publicKey: CHECKOUT_PUBLIC_KEY,
            environment: 'sandbox',
            locale,
            paymentSession,
            onReady: () => {
                console.log('Checkout Flow ready');
            },
            onPaymentCompleted: (_component, paymentResponse) => {
                console.log('Payment completed', paymentResponse);
                
                // Clear cart after successful payment
                cart = [];
                localStorage.setItem('cart', JSON.stringify(cart));
                
                setTimeout(() => {
                    window.location.href = '/success.html';
                }, 1000);
            },
            onError: (component, error) => {
                console.error('Payment error:', error);
                alert('Payment error: ' + (error.message || error.reason || 'Unknown error'));
            }
        });
        
        // Clear container and mount Flow
        const flowDisplay = document.getElementById('flow-display');
        flowDisplay.innerHTML = '';
        const flowComponent = checkout.create('flow');
        flowComponent.mount(flowDisplay);
    } catch (error) {
        console.error('Express Checkout error:', error);
        const flowDisplay = document.getElementById('flow-display');
        if (flowDisplay) {
            flowDisplay.innerHTML = `<p style="color: red; padding: 20px; text-align: center;">Error: ${error.message}</p>`;
        }
        resumeGiftCardForm();
    }
}
