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

// Enhanced Cart Logic
function addToCart(productId) {
    fetch('products.json')
        .then(response => response.json())
        .then(products => {
            const product = products.find(p => p.id === productId);
            const existingItem = cart.find(item => 
                item.id === productId && 
                JSON.stringify(item.options) === JSON.stringify(getSelectedOptions(productId))
            );

            if (existingItem) {
                existingItem.quantity++;
            } else {
                cart.push({
                    ...product,
                    quantity: 1,
                    options: getSelectedOptions(productId)
                });
            }
            
            saveCart();
            updateCartUI();
            showToast(existingItem ? 
                `Updated ${product.name} quantity` : 
                `Added ${product.name} to cart`);
        });
}

function getSelectedOptions(productId) {
    const options = {};
    document.querySelectorAll(`[data-product="${productId}"] .product-option`)
        .forEach(select => {
            options[select.dataset.option] = select.value;
        });
    return options;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
    showToast("Item removed");
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartUI() {
    const cartItemsEl = document.getElementById('cart-items');
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Cart badge animation
    const badge = document.getElementById('cart-count');
    badge.style.transform = 'scale(1.2)';
    setTimeout(() => badge.style.transform = 'scale(1)', 300);
    
    // Update UI
    document.getElementById('cart-count').textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-total').textContent = total.toFixed(2);
    
    cartItemsEl.innerHTML = cart.length ? cart.map((item, index) => `
        <div class="cart-item">
            <img src="${item.image}" width="60">
            <div>
                <h4>${item.name} × ${item.quantity}</h4>
                <p>$${(item.price * item.quantity).toFixed(2)}</p>
                ${Object.entries(item.options || {}).map(([key, val]) => 
                    `<small>${key}: ${val}</small><br>`
                ).join('')}
                <button onclick="removeFromCart(${index})" class="remove-btn">Remove</button>
            </div>
        </div>
    `).join('') : '<p class="empty-cart">Your cart is empty</p>';
    
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
        btn.disabled = true;
        btn.textContent = 'Processing...';
        
        const response = await fetch('YOUR_NETLIFY_FUNCTION_ENDPOINT', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                cart,
                success_url: window.location.origin + '/success.html',
                cancel_url: window.location.href
            })
        });
        
        const { sessionId } = await response.json();
        const { error } = await stripe.redirectToCheckout({ sessionId });
        
        if (error) throw error;
        localStorage.removeItem('cart');
    } catch (error) {
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
