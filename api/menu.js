const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const pool = require("../db"); // ✅ import kết nối DB


/* GET - Get all menu items */
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                id_menu AS id,
                name_menu AS name,
                description AS description,
                price,
                category,
                image AS image
            FROM menu
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: "Database error" });
    }
});



// // Lấy toàn bộ menu từ database
// router.get("/", async (req, res) => 
//     try {
//         const [rows] = await pool.query("SELECT * FROM menu");
//         res.json(rows);
//     } catch (err) {
//         res.status(500).json({ message: "Database error" });
//     }
// });

// /* PUT - Update a menu item (admin only) */
// router.put("/:id", authenticateToken, (req, res) => {
//     if (req.user.role !== "admin") {
//         return res.status(403).json({ message: "You do not have permission to update menu!" });
//     }

//     const { name, description, price, image, category } = req.body;

//     if (!name || !description || isNaN(price) || price <= 0) {
//         return res.status(400).json({ message: "Invalid data!" });
//     }

//     const index = menu.findIndex((item) => item.id === req.params.id);
//     if (index === -1) return res.status(404).json({ message: "Item not found!" });

//     menu[index] = { ...menu[index], name, description, price, image, category };

//     // Rewrite to menu.js 
//     const menuCode = `const menu = ${JSON.stringify(menu, null, 2)};\n\nmodule.exports = menu;\n`;
//     fs.writeFileSync("./menu.js", menuCode);

//     res.json({ message: "Menu item updated successfully!", item: menu[index] });
// });

// /* POST - Add new menu item (admin only) */
// router.post("/", authenticateToken, (req, res) => {
//     if (req.user.role !== "admin") {
//         return res.status(403).json({ message: "You do not have permission to add menu!" });
//     }

//     const { name, description, price, image, category } = req.body;

//     if (!name || !description || isNaN(price) || price <= 0 || !category) {
//         return res.status(400).json({ message: "Invalid data!" });
//     }

//     // Find prefix by category
//     const prefixMap = { coffee: "c", tea: "t", matcha: "m" };
//     const prefix = prefixMap[category.toLowerCase()];
//     if (!prefix) return res.status(400).json({ message: "Invalid category!" });

//     // Find next number ID
//     const existingIds = menu
//         .filter(item => item.id && item.id.startsWith(prefix))
//         .map(item => parseInt(item.id.substring(1)))
//         .filter(num => !isNaN(num));
//     const nextIdNum = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
//     const id = `${prefix}${nextIdNum}`;

//     const newItem = { id, name, description, price, image, category };
//     menu.push(newItem);

//     const menuCode = `const menu = ${JSON.stringify(menu, null, 2)};\n\nmodule.exports = menu;\n`;
//     fs.writeFileSync("./menu.js", menuCode);

//     res.status(201).json({ message: "Item added!", item: newItem });
// });

// /* DELETE - Delete menu item (admin only) */
// router.delete("/:id", authenticateToken, (req, res) => {
//     if (req.user.role !== "admin") {
//         return res.status(403).json({ message: "You do not have permission to delete!" });
//     }

//     const index = menu.findIndex((item) => item.id === req.params.id);
//     if (index === -1) return res.status(404).json({ message: "Item not found!" });

//     menu.splice(index, 1);

//     // Rewrite to menu.js 
//     const menuCode = `const menu = ${JSON.stringify(menu, null, 2)};\n\nmodule.exports = menu;\n`;
//     fs.writeFileSync("./menu.js", menuCode);

//     res.json({ message: "Menu item deleted successfully!" });
// });

module.exports = router;