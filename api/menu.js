const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const pool = require("../db");


// GET - Get all available menu items
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query(`
           SELECT id_menu AS id, name_menu AS name, description, price, category, image, available FROM menu
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: "Database error", error: err.message });
    }
});



/* PUT - Update a menu item (admin only) */
router.put("/:id", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "You do not have permission to update menu!" });
    }

    const { name, description, price, image, category, available } = req.body;

    try {
        const [result] = await pool.query(
            `UPDATE menu SET name_menu = ?, description = ?, price = ?, category = ?, image = ?, available = ?
            WHERE id_menu = ?`,
            [name, description, price, category, image, available, req.params.id]
        );

        if (result.affectedRows === 0)
            return res.status(404).json({ message: "Item not found!" });

        res.json({ message: "Updated successfully" });
    } catch (err) {
        res.status(500).json({ message: "Update error", error: err.message });
    }
});

/* POST - Add new menu item (admin only) */
router.post("/", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "You do not have permission to add menu!" });
    }

    const { name, description, price, image, category, available } = req.body;

    if (!name || !description || isNaN(price) || price <= 0 || !category) {
        return res.status(400).json({ message: "Invalid data!" });
    }

    try {
        await pool.query(
            `INSERT INTO menu (name_menu, description, price, category, image, available)
             VALUES (?, ?, ?, ?, ?, 1)`,
            [name, description, price, category, image, available]
        );

        res.status(201).json({ message: "Item added successfully" });
    } catch (err) {
        res.status(500).json({ message: "Insert error", error: err.message });
    }
});

/* DELETE - Delete menu item (admin only) */
router.delete("/:id", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "You do not have permission to delete!" });
    }

    try {
        const [result] = await pool.query(
            `DELETE FROM menu WHERE id_menu = ?`,
            [req.params.id]
        );


        if (result.affectedRows === 0)
            return res.status(404).json({ message: "Item not found!" });

        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Delete error", error: err.message });
    }
});

module.exports = router;