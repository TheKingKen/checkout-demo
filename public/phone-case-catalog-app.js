// public/phone-case-catalog-app.js

// Cart state
let cart = [];

// Base price in HKD (234 HKD ≈ 30 USD)
const PHONE_CASE_PRICE_HKD = 234;
const PHONE_CASE_KEYS = [
    'productBlack',
    'productWhite',
    'productRed',
    'productBlue',
    'productGreen',
    'productYellow',
    'productPurple',
    'productPink',
    'productOrange',
    'productTeal',
    'productBrown',
    'productGray'
];

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function () {
    const addButtons = document.querySelectorAll('.add-btn');
    const cartBtn = document.getElementById('cart-btn');
    const loginBtn = document.getElementById('login-btn');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const checkoutBtn = document.getElementById('checkout-btn');
    const loginOverlay = document.getElementById('login-overlay');
    const closeLoginBtn = document.getElementById('close-login-btn');
    const loginForm = document.getElementById('login-form');
    
    // Load cart from localStorage on page load
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
            console.log('Cart loaded from localStorage:', cart);
        } catch (e) {
            console.error('Failed to parse cart from localStorage:', e);
            cart = [];
        }
    }
    
    // Check if we should show cart overlay on load (from checkout page back navigation)
    if (localStorage.getItem('showCartOnLoad') === 'true') {
        localStorage.removeItem('showCartOnLoad');
        cartOverlay.classList.remove('hidden');
        updateCartDisplay();
    }
    
    window.CurrencyUtils.ensureTranslations();
    window.CurrencyUtils.applyTranslations('phone-case-catalog');

    function getCatalogStrings() {
        return window.CurrencyUtils.getTranslations('phone-case-catalog');
    }

    function updateLoginButtonLabel() {
        const strings = getCatalogStrings();
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        loginBtn.textContent = isLoggedIn ? (strings.logoutButton || 'LOGOUT') : (strings.loginButton || 'LOGIN');
    }

    // Check if user is already logged in
    updateLoginButtonLabel();

    // Add to cart event listeners
    addButtons.forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            const productCard = btn.closest('.product-card');
            const productName = productCard.querySelector('.product-name').textContent;
            
            // Use base HKD price
            const productPrice = PHONE_CASE_PRICE_HKD;
            
            // Generate a simple product image (placeholder or actual image)
            const productImage = generateProductImage(productName);
            const productId = `product-${index + 1}`;

            const strings = getCatalogStrings();
            const prefix = strings.phoneCasePrefix || 'Phone Case';
            const productKey = PHONE_CASE_KEYS[index];
            addToCart(`${prefix} - ${productName}`, productPrice, productImage, productId, productKey);
            
            // Visual feedback
            btn.textContent = strings.addedButton || 'Added!';
            btn.disabled = true;
            setTimeout(() => {
                const updatedStrings = getCatalogStrings();
                btn.textContent = updatedStrings.addButton || 'Add';
                btn.disabled = false;
            }, 1500);
        });
    });

    // Cart button - show overlay
    cartBtn.addEventListener('click', () => {
        cartOverlay.classList.remove('hidden');
        updateCartDisplay();
    });

    // Login button - toggle login/logout
    loginBtn.addEventListener('click', () => {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        if (isLoggedIn) {
            // Logout
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userShippingAddress');
            updateLoginButtonLabel();
            alert(getCatalogStrings().alertLoggedOut || 'Logged out successfully');
        } else {
            // Show login overlay
            loginOverlay.classList.remove('hidden');
        }
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
        
        // Simple validation (you can add more sophisticated logic here)
        if (username && password) {
            // Store login state
            localStorage.setItem('isLoggedIn', 'true');
            
            // Store complete user data for checkout (including customer contact info)
            const userData = {
                // Customer contact information (required for payment sessions)
                name: 'Ken So',
                email: 'ken.so@checkout.com',
                phone_number: '64416246',
                phone_country_code: '+852',
                // Shipping address information
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
            alert(getCatalogStrings().alertLoginSuccess || 'Login successful!');
        }
    });
    
    // Checkout button
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert(getCatalogStrings().alertCartEmpty || 'Your cart is empty');
            return;
        }
        
        // Save cart to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Save the source page for cart breadcrumb navigation
        localStorage.setItem('checkoutSourcePage', '/phone-case-catalog.html');
        
        // Redirect to checkout page
        window.location.href = '/checkout.html';
    });
    
    // Initialize currency conversion
    await window.CurrencyUtils.fetchFXRates();
    updatePhoneCasePrices();
});

// Update phone case prices based on current currency
function updatePhoneCasePrices() {
    const currency = window.CurrencyUtils.getCurrentCurrency();
    const formattedPrice = window.CurrencyUtils.formatPrice(PHONE_CASE_PRICE_HKD, currency);
    
    // Update all product price displays
    const priceElements = document.querySelectorAll('.product-price');
    priceElements.forEach(priceEl => {
        priceEl.textContent = formattedPrice;
    });
}

// Add product to cart
function addToCart(name, price, image, id, productKey) {
    const currency = window.CurrencyUtils.getCurrentCurrency();
    const convertedPrice = window.CurrencyUtils.convertPrice(price, currency);
    const formattedName = `${name} - ${currency} ${convertedPrice.toFixed(currency === 'JPY' ? 0 : 2)}`;
    
    const existingItem = cart.find(item => item.id === id && item.currency === currency);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: id,
            name: formattedName,
            productKey: productKey,
            price: convertedPrice,
            priceHKD: price,
            currency: currency,
            image: image,
            quantity: 1
        });
    }
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    console.log('Added to cart:', name, '- Current cart:', cart);
}

// Remove item from cart (removes entire item, not just decrement)
function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
}

// Sync cart items with current currency from sessionStorage
function syncCartWithCurrentCurrency() {
    const currentCurrency = window.CurrencyUtils.getCurrentCurrency();
    const strings = window.CurrencyUtils.getTranslations('phone-case-catalog');
    const giftCardName = strings.giftCardName || 'Gift Card';
    const designMap = {
        red: strings.designRed || 'Red',
        blue: strings.designBlue || 'Blue',
        green: strings.designGreen || 'Green',
        purple: strings.designPurple || 'Purple'
    };
    cart.forEach(item => {
        if (item.priceHKD) {
            const newPrice = window.CurrencyUtils.convertPrice(item.priceHKD, currentCurrency);
            item.price = newPrice;
            item.currency = currentCurrency;
            const formattedAmount = `${currentCurrency} ${newPrice.toFixed(currentCurrency === 'JPY' ? 0 : 2)}`;

            if (item.type === 'gift-card') {
                item.name = `${giftCardName} - ${formattedAmount}`;
            } else if (item.productKey && strings[item.productKey]) {
                const prefix = strings.phoneCasePrefix || 'Phone Case';
                item.name = `${prefix} - ${strings[item.productKey]} - ${formattedAmount}`;
            } else {
                const baseName = item.name.split(' - ')[0];
                item.name = `${baseName} - ${formattedAmount}`;
            }

            if (item.type === 'gift-card' && item.design) {
                item.designLabel = designMap[item.design] || item.design;
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
        const strings = window.CurrencyUtils.getTranslations('phone-case-catalog');
        cartItemsContainer.innerHTML = `<p class="empty-cart-message">${strings.emptyCart || 'Your cart is empty'}</p>`;
        return;
    }

    let html = '<div class="cart-list">';
    
    cart.forEach((item, index) => {
        const itemCurrency = item.currency || 'HKD';
        const itemTotal = item.price * item.quantity;
        const strings = window.CurrencyUtils.getTranslations('phone-case-catalog');
        const formattedPrice = `${itemCurrency} ${item.price.toFixed(itemCurrency === 'JPY' ? 0 : 2)}`;
        const formattedTotal = `${itemCurrency} ${itemTotal.toFixed(itemCurrency === 'JPY' ? 0 : 2)}`;
        
        const designMap = {
            red: strings.designRed || 'Red',
            blue: strings.designBlue || 'Blue',
            green: strings.designGreen || 'Green',
            purple: strings.designPurple || 'Purple'
        };
        const giftCardDetails = item.type === 'gift-card'
            ? `
                <p class="cart-item-extra">${strings.designLabel || 'Design'}: ${designMap[item.design] || item.design || 'N/A'}</p>
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
            <p class="summary-label">${(window.CurrencyUtils.getTranslations('phone-case-catalog').totalLabel || 'Total')}:</p>
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

// Generate product image as data URL (colored rectangle representing the case)
function generateProductImage(productName) {
    // Map product names to colors
    const colorMap = {
        'Black': '#1a1a1a',
        'White': '#f5f5f5',
        'Red': '#c92a2a',
        'Blue': '#1971c2',
        'Green': '#2f9e44',
        'Yellow': '#ffd43b',
        'Purple': '#9775fa',
        'Pink': '#f06595',
        'Orange': '#fd7e14',
        'Teal': '#20c997',
        'Brown': '#8b6f47',
        'Gray': '#868e96'
    };
    
    const color = colorMap[productName] || '#999';
    
    // Create a simple SVG as data URL
    const svg = `<svg width="80" height="160" xmlns="http://www.w3.org/2000/svg">
        <rect width="80" height="160" fill="${color}" rx="8"/>
        <rect x="10" y="20" width="60" height="100" fill="#000" opacity="0.1" rx="5"/>
    </svg>`;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
}
