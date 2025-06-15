// Stripe.js (test mode)
const stripe = Stripe('pk_test_your_publishable_key_here');
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// DOM Loaded
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    updateCartUI();
});

// Load products from JSON
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        const products = await response.json();
        renderProducts(products);
    } catch (error) {
        console.error("Error loading products:", error);
        document.getElementById('products-container').innerHTML = 
            '<p class="error">Products failed to load. Please refresh.</p>';
    }
}

// Render products to page
function renderProducts(products) {
    const container = document.getElementById('products-container');
    container.innerHTML = products.map(product => `
        <div class="product-card" data-product="${product.id}">
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <h3 class="product-title">${product.name}</h3>
            <p>${product.description}</p>
            ${product.options ? product.options.map(option => `
                <label>${option.name}</label>
                <select class="product-option" data-option="${option.name.toLowerCase()}">
                    ${option.values.map(value => `<option>${value}</option>`).join('')}
                </select>
            `).join('') : ''}
            <p class="product-price">$${product.price.toFixed(2)}</p>
            <button class="btn" onclick="addToCart(${product.id})">Add to Cart</button>
        </div>
    `).join('');
}

// Cart Management
function addToCart(productId) {
    fetch('products.json')
        .then(response => response.json())
        .then(products => {
            const product = products.find(p => p.id === productId);
            const options = {};
            
            // Get selected options
            document.querySelectorAll(`[data-product="${productId}"] .product-option`).forEach(select => {
                options[select.dataset.option] = select.value;
            });
            
            // Add to cart
            cart.push({
                ...product,
                options,
                quantity: 1
            });
            
            saveCart();
            updateCartUI();
            showToast(`${product.name} added to cart!`);
        });
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartUI() {
    const cartItemsEl = document.getElementById('cart-items');
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Update cart counter
    document.getElementById('cart-count').textContent = cart.length;
    document.getElementById('cart-total').textContent = total.toFixed(2);
    
    // Render cart items
    cartItemsEl.innerHTML = cart.length ? cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" width="60">
            <div>
                <h4>${item.name}</h4>
                <p>$${item.price.toFixed(2)} × ${item.quantity}</p>
                ${Object.entries(item.options || {}).map(([key, val]) => 
                    `<small>${key}: ${val}</small><br>`
                ).join('')}
                <button onclick="removeFromCart(${item.id})" class="remove-btn">Remove</button>
            </div>
        </div>
    `).join('') : '<p class="empty-cart">Your cart is empty</p>';
    
    // Toggle checkout button
    document.getElementById('checkout-btn').style.display = 
        cart.length ? 'block' : 'none';
}

// UI Helpers
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('active');
}

// Stripe Checkout
async function processPayment() {
    const btn = document.getElementById('checkout-btn');
    try {
        // Show loading state
        btn.disabled = true;
        btn.textContent = 'Processing...';
        
        // Create checkout session
        const response = await fetch('YOUR_NETLIFY_FUNCTION_ENDPOINT', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                cart,
                success_url: window.location.origin + '/success.html',
                cancel_url: window.location.href
            })
        });
        
        if (!response.ok) throw new Error('Network error');
        
        // Redirect to Stripe
        const { sessionId } = await response.json();
        const { error } = await stripe.redirectToCheckout({ sessionId });
        
        if (error) throw error;
        
        // Clear cart on success (redirect happens before this)
        localStorage.removeItem('cart');
        
    } catch (error) {
        console.error("Checkout error:", error);
        alert("Payment failed: " + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Checkout Now';
    }
}

// Global access
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.toggleCart = toggleCart;
window.processPayment = processPayment;
