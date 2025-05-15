async function loadOrderList() {
    try {
        const res = await fetch("http://localhost:3000/orders");
        const data = await res.json();
        const tbody = document.getElementById("clientTableBody");
        tbody.innerHTML = "";

        const statusOptions = [
            { value: "pending", label: "Pending" },
            { value: "processing", label: "Processing" },
            { value: "completed", label: "Completed" },
            { value: "cancelled", label: "Cancelled" }
        ];

        function getAllowedStatuses(current) {
            if (current === "pending") return ["processing", "completed", "cancelled"];
            if (current === "processing") return ["completed", "cancelled"];
            return []; // completed/cancelled không đổi được nữa
        }

        data.forEach(item => {
            const row = document.createElement("tr");
            // Tách ngày và giờ
            let date = "", time = "";
            if (item.created_order) {
                const dt = new Date(item.created_order);
                date = dt.toLocaleDateString('en-CA'); // yyyy-mm-dd
                time = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); // HH:mm:ss
            }

            // Tạo select trạng thái với option hợp lệ
            const allowed = getAllowedStatuses(item.status_order);
            const disabled = allowed.length === 0 ? "disabled" : "";
            let selectHtml = `<select class="form-select form-select-sm" data-id-order="${item.id_order}" ${disabled}>`;
            statusOptions.forEach(opt => {
                const isSelected = item.status_order === opt.value ? "selected" : "";
                const isDisabled = (item.status_order !== opt.value && !allowed.includes(opt.value)) ? "disabled" : "";
                selectHtml += `<option value="${opt.value}" ${isSelected} ${isDisabled}>${opt.label}</option>`;
            });
            selectHtml += `</select>`;

            row.innerHTML = `
                <td class="px-4 py-2">${item.id_order}</td>
                <td class="px-4 py-2">${item.name_user}</td>
                <td class="px-4 py-2">${date}</td>
                <td class="px-4 py-2">${time}</td>
                <td class="px-4 py-2">${item.price} $</td>
                <td class="px-4 py-2">${selectHtml}</td>
                <td class="px-4 py-2">
                    <button class="bg-yellow-400 text-white px-4 py-1 rounded hover:bg-yellow-500 mr-2"
                        onclick='updateOrderStatus(${item.id_order})'>Update</button>
                </td>
                <td class="px-4 py-2">
                    <button class="bg-blue-400 text-white px-4 py-1 rounded hover:bg-blue-500 mr-2"
                        onclick='detailOrder(${item.id_order})'>Detail</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error("Error loading orders:", err);
    }
}

async function updateOrderStatus(id_order) {
    const token = localStorage.getItem("token");
    const select = document.querySelector(`select[data-id-order="${id_order}"]`);
    if (!select) return;
    const newStatus = select.value;

    const res = await fetch(`http://localhost:3000/orders/${id_order}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
    });

    if (res.ok) {
        alert("Order status updated!");
        loadOrderList();
    } else {
        alert("Failed to update order status!");
    }
}

async function detailOrder(id_order) {
    try {
        const res = await fetch(`http://localhost:3000/orders/${id_order}`);
        if (!res.ok) {
            alert("Không lấy được chi tiết đơn hàng!");
            return;
        }
        const items = await res.json();

        // Tạo HTML bảng chi tiết
        let html = `
            <h4>Order #${id_order} Details</h4>
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th class="px-4 py-2">Menu Name</th>
                        <th class="px-4 py-2">Price</th>
                        <th class="px-4 py-2">Quantity</th>
                        <th class="px-4 py-2">Total</th>
                        <th class="px-4 py-2">Size</th>
                        <th class="px-4 py-2">Detail</th>
                        <th class="px-4 py-2">Note</th>
                    </tr>
                </thead>
                <tbody>
        `;
        items.forEach(item => {
            html += `
                <tr>
                    <td class="px-4 py-2">${item.name_menu}</td>
                    <td class="px-4 py-2">${item.adjusted_price} $</td>
                    <td class="px-4 py-2">${item.quantity}</td>
                    <td class="px-4 py-2">${item.total_price} $</td>
                    <td class="px-4 py-2">${item.size}</td>
                    <td class="px-4 py-2">${item.detail}</td>
                    <td class="px-4 py-2">${item.note || ""}</td>
                </tr>
            `;
        });
        html += `
                </tbody>
            </table>
        `;

        // Hiển thị popup/modal (dùng alert đơn giản, hoặc bạn có thể thay bằng modal Bootstrap)
        const detailDiv = document.createElement("div");
        detailDiv.innerHTML = `
            <div style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
                <div style="background:#fff;padding:24px;border-radius:8px;max-width:90vw;max-height:90vh;overflow:auto;position:relative;">
                    <button style="position:absolute;top:8px;right:12px;font-size:20px;" onclick="this.parentElement.parentElement.remove()">×</button>
                    ${html}
                </div>
            </div>
        `;
        document.body.appendChild(detailDiv);
    } catch (err) {
        alert("Lỗi khi lấy chi tiết đơn hàng!");
        console.error(err);
    }
}

window.onload = function () {
    loadOrderList();
};