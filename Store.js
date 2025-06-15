// Stripe (test mode - replace with your publishable key)
const stripe = Stripe('pk_test_your_test_key_here');
const elements = stripe.elements();
let cardElement;

// Cart state
let cart = JSON.parse(localStorage.getItem('cart')) || [];

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Stripe card element
    const card = elements.create('card');
    card.mount('#card-element');
    cardElement = card;
    
    // Load products
    fetch('products.json')
        .then(response => response.json())
        .then(products => {
            renderProducts(products);
            updateCartUI();
        });
});

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

function addToCart(productId) {
    fetch('products.json')
        .then(response => response.json())
        .then(products => {
            const product = products.find(p => p.id === productId);
            const options = {};
            
            // Get selected options
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
            alert(`${product.name} added to cart!`);
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

async function processPayment() {
    // Create payment intent on your server (you'll need a simple backend)
    // For GitHub Pages, you can use a serverless function (Netlify, Vercel, etc.)
    
    // This is a mock implementation - in production:
    // 1. Create a payment intent
    // 2. Confirm the card payment
    try {
        const { error, paymentIntent } = await stripe.confirmCardPayment('client_secret_here', {
            payment_method: {
                card: cardElement,
            }
        });
        
        if (error) throw error;
        alert('Payment successful!');
        cart = [];
        saveCart();
        updateCartUI();
    } catch (err) {
        alert('Payment failed: ' + err.message);
    }
}
