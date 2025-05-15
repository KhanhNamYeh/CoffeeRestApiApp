const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const pool = require("../db");
const fs = require("fs");
const path = require("path");


// GET - Get all orders
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                o.id_order,
                u.name AS name_user,
                o.created_order,
                order_price(o.id_order) AS price,
                o.status_order
            FROM 
                orders o
            JOIN 
                users u ON o.id_user = u.id_user
            WHERE
                o.status_order != 'cancelled'
            ORDER BY 
                CASE 
                    WHEN o.status_order = 'pending' THEN 1
                    WHEN o.status_order = 'processing' THEN 2
                    WHEN o.status_order = 'completed' THEN 3
                    ELSE 4
                END,
                o.created_order DESC
            LIMIT 30;
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: "Database error", error: err.message });
    }
});

// GET - Get order details by order ID
router.get("/:id_order", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                oi.id_item,
                m.name_menu,
                m.price + 
                    CASE 
                        WHEN oi.size = 'Medium' THEN 0.5
                        WHEN oi.size = 'Large' THEN 1
                        ELSE 0
                    END AS adjusted_price,
                oi.quantity,
                (oi.quantity * (
                    m.price + 
                    CASE 
                        WHEN oi.size = 'Medium' THEN 0.5
                        WHEN oi.size = 'Large' THEN 1
                        ELSE 0
                    END
                )) AS total_price,
                oi.detail,
                oi.note,
                oi.size
            FROM 
                order_items oi
            JOIN 
                menu m ON oi.id_menu = m.id_menu
            WHERE 
                oi.id_order = ?;
            `, [req.params.id_order]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: "Database error", error: err.message });
    }
});

// POST - Create a new order (customer: status = pending)
router.post("/customer", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "customer") {
            return res.status(403).json({ message: "You do not have permission to create orders!" });
        }

        const { items } = req.body;
        const id_user = req.user.id_user;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "No items provided in the order." });
        }

        const [orderResult] = await pool.query(
            `INSERT INTO orders (created_order, status_order, id_user) VALUES (NOW(), 'pending', ?)`,
            [id_user]
        );
        const id_order = orderResult.insertId;

        for (const item of items) {
            const menuId = Number(item.id);
            const quantity = Number(item.quantity);
            if (isNaN(menuId) || isNaN(quantity) || quantity <= 0) continue;
            await pool.query(
                `INSERT INTO order_items (quantity, id_order, id_menu, detail, note, size)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    quantity,
                    id_order,
                    menuId,
                    `Sugar: ${item.sugar || ""}, Ice: ${item.ice || ""}`,
                    item.note || "",
                    item.size
                ]
            );
        }

        res.status(201).json({ message: "Order created successfully", id_order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create order", error: err.message });
    }
});

// POST - Create a new order (staff: status = processing)
router.post("/staff", async (req, res) => {
    try {
        const { customer, items } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "No items provided in the order." });
        }

        const [[{ id_user }]] = await pool.query(
            "SELECT find_user(?, ?, ?) AS id_user",
            [customer.name, customer.email, customer.phone]
        );
        console.log("User ID:", id_user);

        const [orderResult] = await pool.query(
            "INSERT INTO orders (created_order, status_order, id_user) VALUES (NOW(), 'processing', ?)",
            [id_user]
        );
        const id_order = orderResult.insertId;

        for (const item of items) {
            const menuId = Number(item.id);
            const quantity = Number(item.quantity);
            if (isNaN(menuId) || isNaN(quantity) || quantity <= 0) continue;
            await pool.query(
                `INSERT INTO order_items (quantity, id_order, id_menu, detail, note, size)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    quantity,
                    id_order,
                    menuId,
                    `Sugar: ${item.sugar || ""}, Ice: ${item.ice || ""}`,
                    item.note || "",
                    item.size
                ]
            );
        }
        Invoice(items, id_order)
        res.status(201).json({ message: "Order created successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create order", error: err.message });
    }
});

// PUT - Update order status
router.put("/:id_order", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "staff" && req.user.role !== "admin") {
            return res.status(403).json({ message: "You do not have permission to update orders!" });
        }

        const { status } = req.body;
        const id_order = req.params.id_order;

        if (!status) {
            return res.status(400).json({ message: "Status is required." });
        }

        await pool.query(
            "UPDATE orders SET status_order = ? WHERE id_order = ?",
            [status, id_order]
        );

        res.json({ message: "Order status updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update order status", error: err.message });
    }
});

function Invoice(items, id) {
    // Tạo thư mục nếu chưa có
    const invoiceDir = path.join(__dirname, "../Invoice");
    if (!fs.existsSync(invoiceDir)) {
        fs.mkdirSync(invoiceDir, { recursive: true });
    }

    // Tính tổng tiền
    let total = 0;
    let content = `INVOICE - Order #${id}\n\n`;
    content += `| ${"Menu Name".padEnd(20)} | ${"Price".padEnd(8)} | ${"Qty".padEnd(3)} | ${"Total".padEnd(8)} | ${"Detail".padEnd(30)} | ${"Note"}\n`;
    content += "-".repeat(90) + "\n";

    items.forEach(item => {
        // Nếu item đã có adjusted_price và total_price thì dùng, nếu không thì tự tính
        const price = Number(item.adjusted_price || item.price || 0);
        const quantity = Number(item.quantity || 1);
        const itemTotal = Number(item.total_price || (price * quantity));
        total += itemTotal;
        content += `| ${String(item.name_menu || item.name).padEnd(20)} | ${price.toFixed(2).padEnd(8)} | ${String(quantity).padEnd(3)} | ${itemTotal.toFixed(2).padEnd(8)} | ${String(item.detail || "").padEnd(30)} | ${item.note || ""}\n`;
    });

    content += "-".repeat(90) + "\n";
    content += `Total: ${total.toFixed(2)} $\n`;

    // Ghi file
    const filePath = path.join(invoiceDir, `${id}.txt`);
    fs.writeFileSync(filePath, content, "utf8");
}

module.exports = router;


