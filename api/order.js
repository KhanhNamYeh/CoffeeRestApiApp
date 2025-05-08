const express = require("express");
const router = express.Router();

/* GET - Get all orders */
router.get("/", (req, res) => {
    // Note: 'orders' is not defined in the original code
    // You may need to define it or import it
    res.json(orders);
});

module.exports = router;