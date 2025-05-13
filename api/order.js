const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const pool = require("../db");


// GET - Get all orders
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                o.id_order,
                u.name AS name_user,
                o.created_order,
                IFNULL(SUM(oi.quantity * m.price), 0.00) AS price,
                o.status_order
            FROM 
                orders o
            JOIN 
                users u ON o.id_user = u.id_user
            LEFT JOIN 
                order_items oi ON o.id_order = oi.id_order
            LEFT JOIN 
                menu m ON oi.id_menu = m.id_menu
            GROUP BY 
                o.id_order, u.name, o.created_order, o.status_order;
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
                m.price,
                oi.quantity,
                (oi.quantity * m.price) AS item_total,
                oi.detail,
                oi.note
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
router.post("/", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "customer") {
            return res.status(403).json({ message: "You do not have permission to create orders!" });
        }

        const { items } = req.body;
        const id_user = req.user.id_user;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "No items provided in the order." });
        }

        // Tạo đơn hàng mới
        const [orderResult] = await pool.query(
            `INSERT INTO orders (created_order, status_order, id_user) VALUES (NOW(), 'pending', ?)`,
            [id_user]
        );
        const id_order = orderResult.insertId;

        // Thêm từng món vào order_items
        for (const item of items) {
            const menuId = Number(item.id);
            const quantity = Number(item.quantity);
            if (isNaN(menuId) || isNaN(quantity) || quantity <= 0) continue;
            await pool.query(
                `INSERT INTO order_items (quantity, id_order, id_menu, detail, note)
                VALUES (?, ?, ?, ?, ?)`,
                [
                    quantity,
                    id_order,
                    menuId,
                    `Size: ${item.size || ""}, Sugar: ${item.sugar || ""}, Ice: ${item.ice || ""}`,
                    item.note || ""
                ]
            );
        }

        res.status(201).json({ message: "Order created successfully", id_order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create order", error: err.message });
    }
});

module.exports = router;


