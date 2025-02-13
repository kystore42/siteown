document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("pc-configurator-form");

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const cpu = document.getElementById("cpu").selectedOptions[0].text;
        const gpu = document.getElementById("gpu").selectedOptions[0].text;
        const ram = document.getElementById("ram").selectedOptions[0].text;
        const storage = document.getElementById("storage").selectedOptions[0].text;

        const pcConfig = {
            id: `custom-pc-${Date.now()}`, 
            name: `Custom PC (${cpu}, ${gpu}, ${ram}, ${storage})`,
            price: calculatePrice(cpu, gpu, ram, storage),
            quantity: 1
        };

        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        cart.push(pcConfig);
        localStorage.setItem("cart", JSON.stringify(cart));

        updateCartCount();

        alert("Custom PC added to cart!");
    });
});

function calculatePrice(cpu, gpu, ram, storage) {
    const prices = {
        "Intel Core i9": 500, "Intel Core i7": 350, "AMD Ryzen 9": 450, "AMD Ryzen 7": 300,
        "NVIDIA RTX 4090": 1600, "NVIDIA RTX 4080": 1200, "AMD RX 7900 XT": 1100,
        "16GB DDR5": 100, "32GB DDR5": 180, "64GB DDR5": 350,
        "1TB NVMe SSD": 150, "2TB NVMe SSD": 250, "4TB HDD": 200
    };
    return (prices[cpu] || 0) + (prices[gpu] || 0) + (prices[ram] || 0) + (prices[storage] || 0);
}

function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    document.getElementById("cart-count").textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
}
