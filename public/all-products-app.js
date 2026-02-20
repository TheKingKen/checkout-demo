// public/all-products-app.js

// Cart state
let cart = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    const loginBtn = document.getElementById('login-btn');
    const cartBtn = document.getElementById('cart-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const checkoutBtn = document.getElementById('checkout-btn');
    const loginOverlay = document.getElementById('login-overlay');
    const closeLoginBtn = document.getElementById('close-login-btn');
    const cartOverlay = document.getElementById('cart-overlay');
    const loginForm = document.getElementById('login-form');
    const phoneCaseCard = document.getElementById('phone-case-card');
    const giftCardsCard = document.getElementById('gift-cards-card');

    // Check if coming from index page and clear cart if so
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('from') === 'index') {
        cart = [];
        localStorage.removeItem('cart');
        // Clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        // Load cart from localStorage
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
        }
    }

    window.CurrencyUtils.ensureTranslations();
    window.CurrencyUtils.applyTranslations('all-products');

    function getAllProductsStrings() {
        return window.CurrencyUtils.getTranslations('all-products');
    }

    function updateLoginButtonLabel() {
        const strings = getAllProductsStrings();
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        loginBtn.textContent = isLoggedIn ? (strings.logoutButton || 'LOGOUT') : (strings.loginButton || 'LOGIN');
    }

    // Check if user is already logged in
    updateLoginButtonLabel();

    // Login button - toggle login/logout
    loginBtn.addEventListener('click', () => {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        if (isLoggedIn) {
            // Logout
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userShippingAddress');
            updateLoginButtonLabel();
            alert('Logged out successfully');
        } else {
            // Show login overlay
            loginOverlay.classList.remove('hidden');
        }
    });

    // Cart button - show overlay (only if cart button exists)
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            cartOverlay.classList.remove('hidden');
            updateCartDisplay();
        });
    }

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
            alert('Login successful!');
        }
    });

    // Category card click handlers
    phoneCaseCard.addEventListener('click', () => {
        window.location.href = '/phone-case-catalog.html';
    });

    giftCardsCard.addEventListener('click', () => {
        window.location.href = '/gift-cards.html';
    });

    // Checkout button
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Your cart is empty');
            return;
        }
        
        // Save cart to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Save the source page for cart breadcrumb navigation
        localStorage.setItem('checkoutSourcePage', '/all-products.html');
        
        // Redirect to checkout page
        window.location.href = '/checkout.html';
    });

    // Initialize currency utilities
    window.CurrencyUtils.fetchFXRates();
    
    // Setup currency selector - restore from sessionStorage on page load
    const currencySelector = document.getElementById('currency-selector');
    if (currencySelector) {
        currencySelector.value = window.CurrencyUtils.getCurrentCurrency();
        currencySelector.addEventListener('change', (e) => {
            window.CurrencyUtils.setCurrentCurrency(e.target.value);
            window.CurrencyUtils.applyTranslations('all-products');
            updateLoginButtonLabel();
            console.log('Currency changed to:', e.target.value);
        });
    }
});

// Update cart display in the overlay
function updateCartDisplay() {
    const cartItemsContainer = document.getElementById('cart-items');
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-message">Your cart is empty</p>';
        return;
    }

    let html = '<div class="cart-list">';
    
    cart.forEach((item, index) => {
        const itemTotal = (item.price * item.quantity).toFixed(2);
        const giftCardDetails = item.type === 'gift-card'
            ? `
                <p class="cart-item-extra">Design: ${item.design || 'N/A'}</p>
                <p class="cart-item-extra">Recipient: ${item.recipientName || 'N/A'}</p>
                <p class="cart-item-extra">Sender: ${item.senderName || 'N/A'}</p>
            `
            : '';

        html += `
            <div class="cart-item">
                <div class="cart-item-details">
                    <p class="cart-item-name">${item.name}</p>
                    <p class="cart-item-price">$${item.price.toFixed(2)} each</p>
                    ${giftCardDetails}
                </div>
                <div class="cart-item-quantity">
                    <button class="qty-btn minus-btn" onclick="updateQuantity(${index}, -1)">−</button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="qty-btn plus-btn" onclick="updateQuantity(${index}, 1)">+</button>
                </div>
                <div class="cart-item-total">
                    <p class="item-total">$${itemTotal}</p>
                    <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>
                </div>
            </div>
        `;
    });

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
    
    html += `
        <div class="cart-summary">
            <p class="summary-label">Total:</p>
            <p class="summary-total">$${cartTotal}</p>
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

// Check if cart contains only digital items (gift cards)
function isCartDigitalOnly() {
    if (cart.length === 0) return false;
    return cart.every(item => item.type === 'gift-card');
}
