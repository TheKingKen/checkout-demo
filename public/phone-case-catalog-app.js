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

    // Add to cart event listeners
    addButtons.forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            const productCard = btn.closest('.product-card');
            const productName = productCard.querySelector('.product-name').textContent;
            const productPrice = parseFloat(
                productCard.querySelector('.product-price').textContent.replace('$', '')
            );

            addToCart(productName, productPrice);
            
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

    // Login button - no effect (as specified)
    loginBtn.addEventListener('click', () => {
        console.log('Login clicked - no effect');
    });

    // Close cart button
    closeCartBtn.addEventListener('click', () => {
        cartOverlay.classList.add('hidden');
    });

    // Click overlay background to close
    cartOverlay.addEventListener('click', (e) => {
        if (e.target === cartOverlay) {
            cartOverlay.classList.add('hidden');
        }
    });

    // Checkout button
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Your cart is empty');
            return;
        }
        console.log('Proceeding to checkout with items:', cart);
        alert('Checkout functionality will be implemented soon');
        // TODO: Implement checkout flow
    });
});

// Add product to cart
function addToCart(name, price) {
    const existingItem = cart.find(item => item.name === name);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            name: name,
            price: price,
            quantity: 1
        });
    }
    
    console.log('Added to cart:', name, '- Current cart:', cart);
}

// Remove item from cart (removes entire item, not just decrement)
function removeFromCart(index) {
    cart.splice(index, 1);
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
            updateCartDisplay();
        }
    }
}
