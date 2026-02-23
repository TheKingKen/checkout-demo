// public/tickets-app.js

// Cart state
let cart = [];

// Ticket data - randomized content
const ticketEvents = [
    'Concert A',
    'Concert B',
    'Sport Games X',
    'Sport Games Y',
    'Cultural Activities 1',
    'Cultural Activities 2',
    'Concert A',
    'Sport Games X',
    'Cultural Activities 1',
    'Concert B'
];

// Base prices in HKD
const ticketPrices = [500, 800, 1200, 600, 400, 700, 500, 1200, 400, 800];

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

    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }

    window.CurrencyUtils.ensureTranslations();
    window.CurrencyUtils.applyTranslations('tickets');

    function getTicketsStrings() {
        return window.CurrencyUtils.getTranslations('tickets');
    }

    function updateLoginButtonLabel() {
        const strings = getTicketsStrings();
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
            alert(getTicketsStrings().alertLoggedOut || 'Logged out successfully');
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
            alert(getTicketsStrings().alertLoginSuccess || 'Login successful!');
        }
    });

    // Checkout button
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert(getTicketsStrings().alertCartEmpty || 'Your cart is empty');
            return;
        }
        
        // Save cart to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Save the source page for cart breadcrumb navigation
        localStorage.setItem('checkoutSourcePage', '/tickets.html');
        
        // Redirect to checkout page
        window.location.href = '/checkout.html';
    });

    // Initialize currency conversion and render tickets
    await window.CurrencyUtils.fetchFXRates();
    renderTickets();
    
    // Setup carousel controls
    setupCarousel('presale');
    setupCarousel('onsale');
    
    // Auto-scroll carousels
    startAutoScroll('presale', 4000);
    startAutoScroll('onsale', 5000);
});

// Render ticket cards
function renderTickets() {
    const currency = window.CurrencyUtils.getCurrentCurrency();
    const presaleTrack = document.getElementById('presale-track');
    const onsaleTrack = document.getElementById('onsale-track');

    // Render pre-sale tickets (first 5)
    presaleTrack.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        const card = createTicketCard(ticketEvents[i], ticketPrices[i], 'presale', i, currency);
        presaleTrack.appendChild(card);
    }

    // Render on-sale tickets (last 5)
    onsaleTrack.innerHTML = '';
    for (let i = 5; i < 10; i++) {
        const card = createTicketCard(ticketEvents[i], ticketPrices[i], 'onsale', i, currency);
        onsaleTrack.appendChild(card);
    }
}

// Create a ticket card element
function createTicketCard(eventName, priceHKD, status, index, currency) {
    const card = document.createElement('div');
    card.className = 'ticket-card';
    
    const convertedPrice = window.CurrencyUtils.convertPrice(priceHKD, currency);
    const formattedPrice = window.CurrencyUtils.formatPrice(priceHKD, currency);
    
    const strings = window.CurrencyUtils.getTranslations('tickets');
    const statusText = status === 'presale' ? (strings.presaleLabel || 'Pre-sale') : (strings.onsaleLabel || 'On-sale');
    
    card.innerHTML = `
        <div class="ticket-card-image">${eventName}</div>
        <div class="ticket-card-info">
            <h4 class="ticket-card-title">${eventName}</h4>
            <p class="ticket-card-price">${formattedPrice}</p>
            <span class="ticket-card-status status-${status}">${statusText}</span>
        </div>
    `;
    
    // Add click handler
    card.addEventListener('click', () => {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const nextParams = `event=${encodeURIComponent(eventName)}&price=${priceHKD}&index=${index}&status=${status}`;

        if (!isLoggedIn) {
            window.location.href = `/ticket-login.html?${nextParams}`;
            return;
        }

        if (status === 'presale') {
            window.location.href = `/ticket-eligibility.html?${nextParams}`;
        } else {
            window.location.href = `/ticket-seat-selection.html?${nextParams}`;
        }
    });
    
    return card;
}

// Setup carousel navigation
function setupCarousel(type) {
    const track = document.getElementById(`${type}-track`);
    const prevBtn = document.getElementById(`${type}-prev`);
    const nextBtn = document.getElementById(`${type}-next`);
    
    let currentIndex = 0;
    const cardWidth = 300; // 280px + 20px gap
    const maxIndex = 2; // 5 cards - 3 visible = 2
    
    function updateCarousel() {
        const offset = -currentIndex * cardWidth;
        track.style.transform = `translateX(${offset}px)`;
        
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === maxIndex;
    }
    
    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    });
    
    nextBtn.addEventListener('click', () => {
        if (currentIndex < maxIndex) {
            currentIndex++;
            updateCarousel();
        }
    });
    
    // Store control functions for auto-scroll
    track.dataset.currentIndex = currentIndex;
    track.dataset.maxIndex = maxIndex;
    
    updateCarousel();
}

// Auto-scroll carousel
function startAutoScroll(type, interval) {
    const track = document.getElementById(`${type}-track`);
    const nextBtn = document.getElementById(`${type}-next`);
    const prevBtn = document.getElementById(`${type}-prev`);
    
    let direction = 1; // 1 for forward, -1 for backward
    
    setInterval(() => {
        const currentIndex = parseInt(track.dataset.currentIndex || 0);
        const maxIndex = parseInt(track.dataset.maxIndex || 2);
        
        // Change direction at boundaries
        if (currentIndex >= maxIndex) {
            direction = -1;
        } else if (currentIndex <= 0) {
            direction = 1;
        }
        
        // Click appropriate button
        if (direction === 1) {
            nextBtn.click();
        } else {
            prevBtn.click();
        }
        
        // Update stored index
        track.dataset.currentIndex = parseInt(track.dataset.currentIndex || 0) + direction;
    }, interval);
}

// Update cart display in the overlay
function updateCartDisplay() {
    const cartItemsContainer = document.getElementById('cart-items');

    if (cart.length === 0) {
        const strings = window.CurrencyUtils.getTranslations('tickets');
        cartItemsContainer.innerHTML = `<p class="empty-cart-message">${strings.emptyCart || 'Your cart is empty'}</p>`;
        return;
    }

    let html = '<div class="cart-list">';

    cart.forEach((item, index) => {
        const itemCurrency = item.currency || 'HKD';
        const itemTotal = item.price * item.quantity;
        const strings = window.CurrencyUtils.getTranslations('tickets');
        const formattedPrice = `${itemCurrency} ${item.price.toFixed(itemCurrency === 'JPY' ? 0 : 2)}`;
        const formattedTotal = `${itemCurrency} ${itemTotal.toFixed(itemCurrency === 'JPY' ? 0 : 2)}`;

        html += `
            <div class="cart-item">
                <div class="cart-item-details">
                    <p class="cart-item-name">${item.name}</p>
                    <p class="cart-item-price">${formattedPrice} ${strings.eachLabel || 'each'}</p>
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
            <p class="summary-label">${(window.CurrencyUtils.getTranslations('tickets').totalLabel || 'Total')}:</p>
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
