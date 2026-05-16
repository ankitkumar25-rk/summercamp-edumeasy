const { verifyToken } = require('../utils/paseto');

async function protect(req, res, next) {
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    req.user = decoded;
    next();
}

function adminOnly(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Admin access required' });
    }
}

module.exports = { protect, adminOnly };
