const express = require("express");
const router = express.Router();
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

module.exports = router;
