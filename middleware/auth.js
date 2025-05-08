const jwt = require("jsonwebtoken");
const SECRET_KEY = "your_secret_key";

function authenticateToken(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: "Forbidden" });
        req.user = user;
        next();
    });
}

module.exports = {
    authenticateToken,
    SECRET_KEY
};