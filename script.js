let cart = JSON.parse(localStorage.getItem('cart')) || [];

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    renderCart();
});

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-to-cart')) {
        const card = e.target.closest('.product-card');
        const name = card.querySelector('h3').textContent;
        const price = parseFloat(card.querySelector('.price').textContent.replace('$', ''));
        const id = name.toLowerCase().replace(/\s+/g, '-');

        const existingItem = cart.find(item => item.id === id);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ id, name, price, quantity: 1 });
        }

        saveCart();
        updateCartCount();
        alert(`${name} added to cart.`);
    }
});

function updateCartCount() {
    document.getElementById('cart-count').textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
}

function renderCart() {
    const cartTable = document.getElementById('cart-items');
    if (!cartTable) return;

    const tableBody = cartTable.querySelector('tbody');
    tableBody.innerHTML = '';

    cart.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>${item.quantity}</td>
            <td><button class="remove-item" data-id="${item.id}">Remove</button></td>
        `;
        tableBody.appendChild(row);
    });
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-item')) {
        const id = e.target.dataset.id;
        cart = cart.filter(item => item.id !== id);
        saveCart();
        renderCart();
        updateCartCount();
    }
});

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}
