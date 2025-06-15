// Initialize Stripe (test mode - replace with your publishable key)
const stripe = Stripe('pk_test_your_publishable_key_here');
let cart = JSON.parse(localStorage.getItem('cart')) || [];

document.addEventListener('DOMContentLoaded', function() {
    // Load products
    fetch('products.json')
        .then(response => response.json())
        .then(products => {
            renderProducts(products);
            updateCartUI();
        });
});

// Product rendering (unchanged)
function renderProducts(products) {
    const container = document.getElementById('products-container');
    
    products.forEach(product => {
        const productEl = document.createElement('div');
        productEl.className = 'product-card';
        
        let optionsHTML = '';
        if (product.options) {
            product.options.forEach(option => {
                optionsHTML += `
                    <label>${option.name}</label>
                    <select class="product-option" data-option="${option.name}">
                        ${option.values.map(value => 
                            `<option>${value}</option>`
                        ).join('')}
                    </select>
                `;
            });
        }
        
        productEl.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <h3 class="product-title">${product.name}</h3>
            <p>${product.description}</p>
            ${optionsHTML}
            <p class="product-price">$${product.price.toFixed(2)}</p>
            <button class="btn" onclick="addToCart(${product.id})">Add to Cart</button>
        `;
        
        container.appendChild(productEl);
    });
}

// Cart functions (unchanged)
function addToCart(productId) {
    fetch('products.json')
        .then(response => response.json())
        .then(products => {
            const product = products.find(p => p.id === productId);
            const options = {};
            
            document.querySelectorAll(`.product-card [data-product="${productId}"] .product-option`).forEach(select => {
                const optionName = select.getAttribute('data-option');
                options[optionName] = select.value;
            });
            
            cart.push({
                ...product,
                options,
                quantity: 1
            });
            
            saveCart();
            updateCartUI();
        });
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartUI() {
    const cartItemsEl = document.getElementById('cart-items');
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    document.getElementById('cart-count').textContent = cart.length;
    document.getElementById('cart-total').textContent = total.toFixed(2);
    
    cartItemsEl.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div>
                <h4>${item.name}</h4>
                <p>$${item.price.toFixed(2)} × ${item.quantity}</p>
                ${Object.entries(item.options || {}).map(([key, value]) => 
                    `<p><small>${key}: ${value}</small></p>`
                ).join('')}
                <button onclick="removeFromCart(${item.id})">Remove</button>
            </div>
        </div>
    `).join('') || '<p>Your cart is empty</p>';
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
}

function toggleCart() {
    document.getElementById('cart').classList.toggle('active');
}

function showCheckout() {
    document.getElementById('checkout-form').style.display = 'block';
}

// =============================================
// STRIPE CHECKOUT IMPLEMENTATION (Option B)
// =============================================
async function processPayment() {
    try {
        // 1. Show loading state
        const btn = document.querySelector('#checkout-form button');
        btn.disabled = true;
        btn.textContent = 'Processing...';
        
        // 2. Call your backend (Netlify/Netlify/Vercel)
        const response = await fetch('/.netlify/functions/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                cart,
                success_url: window.location.origin + '/success.html',
                cancel_url: window.location.href
            })
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        // 3. Redirect to Stripe
        const { sessionId } = await response.json();
        const { error } = await stripe.redirectToCheckout({ sessionId });
        
        if (error) throw error;
        
    } catch (err) {
        alert('Checkout failed: ' + err.message);
        console.error(err);
        
        // Reset button
        const btn = document.querySelector('#checkout-form button');
        btn.disabled = false;
        btn.textContent = 'Pay Now';
    }
}
