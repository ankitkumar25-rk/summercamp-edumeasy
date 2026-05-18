const { V3 } = require('paseto');
require('dotenv').config();

// PASETO_SECRET_KEY should be a 32-byte hex string
const secretKey = process.env.PASETO_SECRET_KEY;

async function signToken(payload) {
    try {
        // payload: { userId, role }
        const key = Buffer.from(secretKey, 'hex'); 
        const token = await V3.encrypt({
            userId: payload.userId,
            role: payload.role
        }, key, {
            expiresIn: '15m',
            footer: 'EduMEasy'
        });
        return token;
    } catch (error) {
        console.error('Error signing PASETO:', error);
        throw error;
    }
}

async function verifyToken(token) {
    try {
        const key = Buffer.from(secretKey, 'hex');
        const payload = await V3.decrypt(token, key);
        return { userId: payload.userId, role: payload.role };
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
}

module.exports = { signToken, verifyToken };
