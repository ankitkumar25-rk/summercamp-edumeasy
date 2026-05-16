const { V3 } = require('paseto');
const { crypto } = require('node:crypto');
require('dotenv').config();

// PASETO_SECRET_KEY should be a 32-byte hex string or 32-character string
const secretKey = process.env.PASETO_SECRET_KEY;

async function signToken(payload) {
    try {
        // payload: { userId, role, email }
        const key = Buffer.from(secretKey, 'hex'); 
        const token = await V3.encrypt(payload, key, {
            expiresIn: '24h',
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
        return payload;
    } catch (error) {
        // console.error('Error verifying PASETO:', error);
        return null;
    }
}

module.exports = { signToken, verifyToken };
