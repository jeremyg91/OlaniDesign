// Initialize Stripe (test mode)
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
    }
}

// Render products to page
function renderProducts(products) {
    const container = document.getElementById('products-container');
    container.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <h3 class="product-title">${product.name}</h3>
            <p>${product.description}</p>
            ${product.options ? product.options.map(option => `
                <label>${option.name}</label>
                <select class="product-option" data-option="${option.name}">
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
            
            document.querySelectorAll(`[data-product="${productId}"] .product-option`).forEach(select => {
                options[select.dataset.option] = select.value;
            });
            
            cart.push({ ...product, options, quantity: 1 });
            saveCart();
            updateCartUI();
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
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    document.getElementById('cart-count').textContent = cart.length;
    document.getElementById('cart-total').textContent = total.toFixed(2);
    
    document.getElementById('cart-items').innerHTML = cart.length ? cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" width="60">
            <div>
                <h4>${item.name}</h4>
                <p>$${item.price.toFixed(2)} × ${item.quantity}</p>
                ${Object.entries(item.options || {}).map(([key, val]) => 
                    `<small>${key}: ${val}</small>`
                ).join('')}
                <button onclick="removeFromCart(${item.id})">Remove</button>
            </div>
        </div>
    `).join('') : '<p>Your cart is empty</p>';
}

// UI Controls
function toggleCart() {
    document.getElementById('cart').classList.toggle('active');
}

function showCheckout() {
    document.getElementById('checkout-form').style.display = 'block';
}

// Stripe Checkout
async function processPayment() {
    try {
        // Show loading state
        const btn = document.querySelector('#checkout-form button');
        btn.disabled = true;
        btn.textContent = 'Processing...';
        
        // Create checkout session
        const response = await fetch('/.netlify/functions/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                cart,
                success_url: window.location.origin + '/success.html',
                cancel_url: window.location.href
            })
        });
        
        if (!response.ok) throw new Error('Failed to create checkout session');
        
        // Redirect to Stripe
        const { sessionId } = await response.json();
        const { error } = await stripe.redirectToCheckout({ sessionId });
        
        if (error) throw error;
        
        // Clear cart on success (redirect will happen before this)
        localStorage.removeItem('cart');
        
    } catch (error) {
        console.error("Checkout error:", error);
        alert("Checkout failed: " + error.message);
        
        // Reset button
        const btn = document.querySelector('#checkout-form button');
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Pay Now';
        }
    }
}

// Make functions globally available
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.toggleCart = toggleCart;
window.showCheckout = showCheckout;
window.processPayment = processPayment;
