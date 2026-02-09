// public/gift-cards-app.js

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

    // Check if user is already logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
        loginBtn.textContent = 'LOGOUT';
    }

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

    // Update preview when amount changes
    amountOptions.forEach(option => {
        option.addEventListener('change', (e) => {
            const amount = `$${e.target.value}`;
            if (previewAmount) previewAmount.textContent = amount;
            if (previewAmountMobile) previewAmountMobile.textContent = amount;
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
            loginBtn.textContent = 'LOGIN';
            alert('Logged out successfully');
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
                phone_number: '12345678',
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
            loginBtn.textContent = 'LOGOUT';
            
            // Close login overlay
            loginOverlay.classList.add('hidden');
            
            // Show success message
            alert('Login successful!');
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
        const giftCard = {
            id: `gift-card-${Date.now()}`,
            name: `Gift Card - $${amount}`,
            price: amount,
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
        alert(`Gift Card ($${amount}) added to cart!`);

        // Reset form
        giftCardForm.reset();
        charCount.textContent = '0';
        previewAmount.textContent = '$100';
        if (previewAmountMobile) previewAmountMobile.textContent = '$100';
        // Reset both desktop and mobile preview cards to red (default)
        previewCards.forEach(card => {
            card.style.backgroundColor = '#e74c3c';
        });
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
        localStorage.setItem('checkoutSourcePage', '/gift-cards.html');
        
        // Redirect to checkout page
        window.location.href = '/checkout.html';
    });

    // Express Checkout button (digital-only)
    const expressCheckoutBtn = document.getElementById('express-checkout-btn');
    if (expressCheckoutBtn) {
        expressCheckoutBtn.addEventListener('click', handleExpressCheckout);
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
    
    // Show/hide Express Checkout button based on cart contents
    const expressCheckoutBtn = document.getElementById('express-checkout-btn');
    if (expressCheckoutBtn) {
        if (isCartDigitalOnly()) {
            expressCheckoutBtn.style.display = 'block';
        } else {
            expressCheckoutBtn.style.display = 'none';
        }
    }
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

// Handle Express Checkout click
async function handleExpressCheckout() {
    const expressBtn = document.getElementById('express-checkout-btn');
    const flowContainer = document.getElementById('flow-container');
    
    // Transform cart items to Order Summary
    transformToOrderSummary();
    
    // Disable Express Checkout button
    expressBtn.disabled = true;
    expressBtn.textContent = 'Processing...';
    
    // Show flow container
    flowContainer.style.display = 'block';
    flowContainer.innerHTML = '<p style="text-align: center; padding: 20px;">Loading payment form...</p>';
    
    try {
        // Call server to create payment session
        const response = await fetch('/create-payment-sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer: {
                    email: 'customer@example.com',
                    name: 'Guest Customer',
                    phone_number: '12345678',
                    phone_country_code: '+852'
                },
                amount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 100,
                currency: 'HKD',
                products: cart.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: Math.round(item.price * 100)
                })),
                country: 'HK',
                enable_payment_methods: ['card', 'applepay', 'googlepay']
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Render Flow component placeholder
        flowContainer.innerHTML = `
            <div style="border: 2px dashed #ccc; padding: 40px; text-align: center; border-radius: 8px;">
                <p style="font-size: 18px; margin-bottom: 20px;">🔒 Checkout.com Payment Flow</p>
                <p style="color: #666;">Session ID: ${data.sessionId}</p>
                <p style="color: #999; font-size: 14px; margin-top: 20px;">Flow component would render here</p>
            </div>
        `;
    } catch (error) {
        console.error('Express Checkout error:', error);
        flowContainer.innerHTML = `<p style="color: red; padding: 20px; text-align: center;">Error: ${error.message}</p>`;
        expressBtn.disabled = false;
        expressBtn.textContent = 'Express Checkout';
    }
}

// Transform cart items to Order Summary (non-editable)
function transformToOrderSummary() {
    const cartItemsContainer = document.getElementById('cart-items');
    
    let html = '<div class="order-summary-header">';
    html += '<button class="back-arrow-btn" onclick="resumeCartEditing()" title="Back to Cart">←</button>';
    html += '<h3 style="margin: 0;">Order Summary</h3>';
    html += '</div>';
    html += '<div class="cart-list">';
    
    cart.forEach((item) => {
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
                    <p class="cart-item-price">$${item.price.toFixed(2)} × ${item.quantity}</p>
                    ${giftCardDetails}
                </div>
                <div class="cart-item-total">
                    <p class="item-total">$${itemTotal}</p>
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

// Resume cart editing (remove Order Summary, enable Express Checkout)
function resumeCartEditing() {
    const expressBtn = document.getElementById('express-checkout-btn');
    const flowContainer = document.getElementById('flow-container');
    
    // Re-enable Express Checkout button
    expressBtn.disabled = false;
    expressBtn.textContent = 'Express Checkout';
    
    // Hide flow container
    flowContainer.style.display = 'none';
    flowContainer.innerHTML = '';
    
    // Restore editable cart display
    updateCartDisplay();
}
