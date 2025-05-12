const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const pool = require("../db");

router.get("/", async (req, res) => {
    try {
        const [users] = await pool.query("SELECT id_user, username, password, name, email, phone, role FROM users");
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Database error" });
    }
});

function getAuthToken(req) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return null;
    const token = authHeader.split(" ")[1];
    return token;
}

router.post("/", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "You do not have permission to add users!" });
    }

    const { username, password, name, email, phone, role } = req.body;

    if (!username || !password || !name || !role) {
        return res.status(400).json({ message: "All fields are required!" });
    }

    try {
        const [result] = await pool.query(
            "INSERT INTO users (username, password, name, email, phone, role) VALUES (?, ?, ?, ?, ?, ?)",
            [username, password, name, email, phone, role]
        );

        res.status(201).json({ message: "User created successfully", userId: result.insertId });
    } catch (err) {
        res.status(500).json({ message: "Database error" });
    }
});

router.put("/:id", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "You do not have permission to update users!" });
    }

    const { username, password, name, email, phone, role } = req.body;

    if (!username || !password || !name || !role) {
        return res.status(400).json({ message: "All fields are required!" });
    }

    try {
        const [result] = await pool.query(
            "UPDATE users SET username = ?, password = ?, name = ?, email = ?, phone = ?, role = ? WHERE id_user = ?",
            [username, password, name, email, phone, role, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found!" });
        }

        res.json({ message: "User updated successfully" });
    } catch (err) {
        res.status(500).json({ message: "Database error" });
    }
});

router.delete("/:id", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "You do not have permission to delete users!" });
    }

    try {
        const [result] = await pool.query("DELETE FROM users WHERE id_user = ?", [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found!" });
        }

        res.json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Database error" });
    }
});

module.exports = router;
