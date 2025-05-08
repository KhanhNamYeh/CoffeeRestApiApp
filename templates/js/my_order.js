const token = localStorage.getItem("token");
const payload = token ? JSON.parse(atob(token.split(".")[1])) : null;
const currentUser = payload?.username;

function removeOrder(index) {
    let orders = JSON.parse(localStorage.getItem("orders")) || [];
    orders.splice(index, 1);
    localStorage.setItem("orders", JSON.stringify(orders));
    location.reload();
}

function clearOrders() {
    localStorage.removeItem("orders");
    location.reload();
}

function back() {
    window.location.href = "menu.html";
}


async function confirmOrder() {
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    if (!Array.isArray(orders) || orders.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const res = await fetch("http://localhost:3000/menu");
    const menu = await res.json();

    const enrichedOrders = orders.map(order => {
        const product = menu.find(p => p.id == order.id);
        if (!product) return order;
        return {
            ...order,
            name: product.name,
            price: product.price
        };
    });

    const historyAll = JSON.parse(localStorage.getItem("historyOrders") || "{}");
    if (!historyAll[currentUser]) {
        historyAll[currentUser] = [];
    }

    const newEntry = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        items: enrichedOrders
    };

    historyAll[currentUser].push(newEntry);
    localStorage.setItem("historyOrders", JSON.stringify(historyAll));
    localStorage.removeItem("orders");

    setTimeout(() => {
        loadHistory();
        new bootstrap.Modal(document.getElementById('confirmModal')).show();
    }, 50);
}



function loadHistory() {
    const historyAll = JSON.parse(localStorage.getItem("historyOrders") || "{}");
    const historyData = historyAll[currentUser] || [];

    const container = document.getElementById("historyContainer");
    if (historyData.length === 0) {
        container.innerHTML = `<p class="text-muted text-center">No history found.</p>`;
        return;
    }

    container.innerHTML = historyData.map((entry, index) => {
        const items = entry.items.map(item => `
    <tr>
        <td>${item.name}</td>
        <td>$${item.price}</td>
        <td>${item.quantity}</td>
    </tr>
    `).join("");

        return `
    <div class="mb-4 border rounded p-3 shadow-sm bg-light">
        <h6>Order #${index + 1} - ${entry.date}</h6>
        <table class="table table-sm">
            <thead>
                <tr><th>Name</th><th>Price</th><th>Quantity</th></tr>
            </thead>
            <tbody>${items}</tbody>
        </table>
    </div>`;
    }).join("");
}


function goHome() {
    window.location.href = "home.html";
}
function loadOrders() {

    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    const orderList = document.getElementById("order-list");
    const totalPriceElement = document.getElementById("total-price");
    let totalPrice = 0;
    orderList.innerHTML = "";

    fetch("http://localhost:3000/menu")
        .then((res) => res.json())
        .then((menuItems) => {
            orders.forEach((order, index) => {
                const product = menuItems.find((item) => item.id == order.id);
                if (product) {
                    const itemTotal = product.price * order.quantity;
                    totalPrice += itemTotal;

                    const orderItem = document.createElement("div");
                    orderItem.classList.add("order-item");
                    orderItem.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <img src="${product.image}" alt="${product.name}">
                    <div>
                        <h5 class="font-weight-bold">${product.name} (x${order.quantity})</h5>
                        <p>Price: $${product.price.toFixed(2)}</p>
                        <p>Total: $${itemTotal.toFixed(2)}</p>
                        <p>Size: ${order.size}, Sugar: ${order.sugar}, Ice: ${order.ice}</p>
                        <p>NOTE: ${order.note}</p>
                    </div>
                </div>
                <button class="btn btn-warning" onclick="removeOrder(${index})">Delete</button>
            `;
                    orderList.appendChild(orderItem);
                }
            });

            totalPriceElement.textContent = totalPrice.toFixed(2);
        });
}

window.onload = function () {
    loadOrders();
    loadHistory();
};
