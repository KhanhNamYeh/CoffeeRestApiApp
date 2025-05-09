const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
    try {
        const [users] = await pool.query("SELECT id, username, role FROM users");
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Database error" });
    }
});

module.exports = router;
