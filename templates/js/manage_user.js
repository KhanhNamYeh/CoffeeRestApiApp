isEditMode = false;

function showSection(id) {
    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
    const section = document.getElementById(id);
    if (section) section.classList.add("active");
    if (id === "menu") loadMenuItems();
}

async function loadUserList() {
    try {
        const res = await fetch("http://localhost:3000/user");
        const data = await res.json();
        const tbody = document.getElementById("clientTableBody");
        tbody.innerHTML = "";
        data.forEach(item => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td class="px-4 py-2">${item.id_user}</td>
                <td class="px-4 py-2">${item.username}</td>
                <td class="px-4 py-2">${item.password}</td>
                <td class="px-4 py-2">${item.name}</td>
                <td class="px-4 py-2">${item.email || '-'}</td>
                <td class="px-4 py-2">${item.phone || '-'}</td>
                <td class="px-4 py-2">${item.role || '-'}</td>
                <td class="px-4 py-2 flex flex-wrap gap-2">
                    <button class="bg-yellow-400 text-white px-4 py-1 rounded hover:bg-yellow-500 mr-2" onclick='openEditForm(${JSON.stringify(item)})'>Edit</button>
                    <button class="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600" onclick="deleteUser('${item.id_user}')">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error("Error loading menu:", err);
    }
}

function logoutAndRedirect() {
    localStorage.removeItem("token");
    window.location.href = "/home.html";
}

function closeModal() {
    document.getElementById("menuModal").classList.add("hidden");
}

window.onload = function () {
    loadUserList();
    document.getElementById("userForm").addEventListener("submit", async function (event) {
        event.preventDefault();
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const role = document.getElementById("role").value.trim();
        
        const token = localStorage.getItem("token");

        if (!name || !username || !password) {
            return alert("Please fill all fields correctly.");
        }

        const payload = { username, password, name, email, phone, role };

        const url = isEditMode ? `http://localhost:3000/user/${currentEditId}` : "http://localhost:3000/user";

        const method = isEditMode ? "PUT" : "POST";

        const res = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            closeModal();
            loadUserList();
            showSection('client');
            alert(`${isEditMode ? "✅ Item updated successfully!" : "✅ New item added successfully!"}`);
        } else {
            alert(`${isEditMode ? "Update" : "Add"} failed.`);
        }
    });
};

function openAddForm() {
    isEditMode = false;
    currentEditId = null;
    document.getElementById("modalTitle").textContent = "Add User";
    document.getElementById("modalSubmitBtn").textContent = "Add User";
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.getElementById("name").value = "";
    document.getElementById("email").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("role").value = "customer";
    document.getElementById("userModal").classList.remove("hidden");
}

function openEditForm(item) {
    isEditMode = true;
    currentEditId = item.id_user;
    document.getElementById("modalTitle").textContent = "Edit User";
    document.getElementById("modalSubmitBtn").textContent = "Update";
    document.getElementById("username").value = item.username;
    document.getElementById("password").value = item.password;
    document.getElementById("name").value = item.name;
    document.getElementById("email").value = item.email || "";
    document.getElementById("phone").value = item.phone || "";
    document.getElementById("role").value = item.role || "customer";
    document.getElementById("userModal").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("userModal").classList.add("hidden");
}

async function deleteUser(id) {
    const token = localStorage.getItem("token");
    if (!confirm("Are you sure you want to delete this item?")) return;

    const res = await fetch(`http://localhost:3000/user/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
        loadUserList();
        showSection('client');
    }
}