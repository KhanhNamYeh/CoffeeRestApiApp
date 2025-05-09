// const express = require("express");
// const router = express.Router();

// /* GET - Get all orders */
// router.get("/", (req, res) => {
//     // Note: 'orders' is not defined in the original code
//     // You may need to define it or import it
//     res.json(orders);
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticateToken } = require("../middleware/auth");

// (ví dụ: lấy tất cả đơn hàng - cần cấu trúc bảng `orders`)
router.get("/", authenticateToken, async (req, res) => {
    try {
        const [orders] = await pool.query("SELECT * FROM orders WHERE user_id = ?", [req.user.id]);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: "Database error" });
    }
});

module.exports = router;
