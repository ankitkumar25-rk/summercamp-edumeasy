const { verifyToken } = require('../utils/paseto');

const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const payload = await verifyToken(token);
    if (!payload) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }

    req.user = payload; // payload contains { userId, role, email }
    next();
};

module.exports = authMiddleware;
