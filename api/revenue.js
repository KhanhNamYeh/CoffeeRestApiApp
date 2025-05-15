const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const pool = require("../db");


// GET - analysis customer
router.get("/customer", async (req, res) => {
    try {
        const [rows] = await pool.query(`
           CALL revenue_customer1();
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: "Database error", error: err.message });
    }
});

// GET - analysis menu
router.get("/menu", async (req, res) => {
    try {
        const [rows] = await pool.query(`
           CALL revenue_menu1();
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: "Database error", error: err.message });
    }
});

// GET - analysis revenue
router.get("/revenue", async (req, res) => {
    try {
        const [rows] = await pool.query(`
           CALL daily_revenue_in_month1();
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: "Database error", error: err.message });
    }
});

module.exports = router;