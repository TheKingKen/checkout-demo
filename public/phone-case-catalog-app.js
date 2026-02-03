// public/phone-case-catalog-app.js

// Cart state
let cart = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    const addButtons = document.querySelectorAll('.add-btn');
    const cartBtn = document.getElementById('cart-btn');
    const loginBtn = document.getElementById('login-btn');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const checkoutBtn = document.getElementById('checkout-btn');
    const loginOverlay = document.getElementById('login-overlay');
    const closeLoginBtn = document.getElementById('close-login-btn');
    const loginForm = document.getElementById('login-form');
    
    // Check if we should show cart overlay on load (from checkout page back navigation)
    if (localStorage.getItem('showCartOnLoad') === 'true') {
        localStorage.removeItem('showCartOnLoad');
        cartOverlay.classList.remove('hidden');
        updateCartDisplay();
    }
    
    // Check if user is already logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
        loginBtn.textContent = 'LOGOUT';
    }

    // Add to cart event listeners
    addButtons.forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            const productCard = btn.closest('.product-card');
            const productName = productCard.querySelector('.product-name').textContent;
            const productPrice = parseFloat(
                productCard.querySelector('.product-price').textContent.replace('$', '')
            );
            
            // Generate a simple product image (placeholder or actual image)
            const productImage = generateProductImage(productName);
            const productId = `product-${index + 1}`;

            addToCart(productName, productPrice, productImage, productId);
            
            // Visual feedback
            btn.textContent = 'Added!';
            btn.disabled = true;
            setTimeout(() => {
                btn.textContent = 'Add';
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
            loginBtn.textContent = 'LOGIN';
            alert('Logged out successfully');
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
                phone_number: '12345678',
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
            loginBtn.textContent = 'LOGOUT';
            
            // Close login overlay
            loginOverlay.classList.add('hidden');
            
            // Show success message
            alert('Login successful!');
        }
    });

    // Checkout button
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Your cart is empty');
            return;
        }
        
        // Save cart to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Redirect to checkout page
        window.location.href = '/checkout.html';
    });
});

// Add product to cart
function addToCart(name, price, image, id) {
    const existingItem = cart.find(item => item.name === name);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: id,
            name: name,
            price: price,
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
        html += `
            <div class="cart-item">
                <div class="cart-item-details">
                    <p class="cart-item-name">${item.name}</p>
                    <p class="cart-item-price">$${item.price.toFixed(2)} each</p>
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
