const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'templates')));

// Import API routes
const menuRoutes = require("./api/menu");
const userRoutes = require("./api/user");
const authRoutes = require("./api/auth");
const orderRoutes = require("./api/order");

// Use API routes
app.use("/menu", menuRoutes);
app.use("/user", userRoutes);
app.use("/", authRoutes); // This will handle /login, /login-admin, and /signup
app.use("/orders", orderRoutes);

// Main route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'home.html'));
});

app.get('/manage', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'manage/admin.html'));
});

app.get('/manage/menu', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'manage/manage_menu.html'));
});

app.get('/manage/client', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'manage/manage_user.html'));
});

// Start the server

app.listen(PORT, () => {console.log(`Server running at http://localhost:${PORT}/ Ctrl + click that link`);});