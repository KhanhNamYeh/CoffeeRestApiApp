const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const fs = require("fs");
const { SECRET_KEY } = require("../middleware/auth");
let users = require("../user.js");

/* POST - Login */
router.post("/login", (req, res) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ username: user.username, role: user.role }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token });
});

router.post("/login-admin", (req, res) => {
    const { username, password } = req.body;

    if (username === "admin1" && password === "123456") {
        const user = { username };
        const token = jwt.sign(user, SECRET_KEY, { expiresIn: "1h" });
        res.json({ token });
    } else {
        res.status(401).json({ message: "Invalid credentials" });
    }
});

/* POST - Signup */
router.post("/signup", (req, res) => {
    const { username, password, role } = req.body;

    const userExists = users.find(u => u.username === username);
    if (userExists) {
        return res.status(400).json({ message: "User already exists!" });
    }

    const newUser = { username, password, role: role || "user" };
    users.push(newUser);

    // Rewrite to user.js 
    const jsCode = `const users = ${JSON.stringify(users, null, 2)};\n\nmodule.exports = users;\n`;
    fs.writeFileSync("./user.js", jsCode);

    res.status(201).json({ message: "User registered successfully!" });
});

module.exports = router;