const express = require("express");
const router = express.Router();
let users = require("../user.js");

/* GET - Get all users */
router.get("/", (req, res) => {
    res.json(users);
});

module.exports = router;