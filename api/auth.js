const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../middleware/auth");

/* POST - Login */
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await pool.query("SELECT * FROM users WHERE username = ? AND password = ?", [username, password]);

        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = rows[0];
        const token = jwt.sign({ username: user.username, role: user.role, id: user.id }, SECRET_KEY, { expiresIn: "1h" });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: "Login error" });
    }
});


/* POST - Signup */
router.post("/signup", async (req, res) => {
    const { username, password, role } = req.body;

    try {
        const [exists] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
        if (exists.length > 0) {
            return res.status(400).json({ message: "User already exists!" });
        }

        await pool.query("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
            [username, password, role || "customer"]);

        res.status(201).json({ message: "User registered successfully!" });
    } catch (err) {
        res.status(500).json({ message: "Database error" });
    }
});


module.exports = router;