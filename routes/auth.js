const express = require('express');
const router = express.Router();
const passport = require('passport');
const { signToken } = require('../utils/paseto');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

// Google Auth Init
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google Auth Callback
router.get('/google/callback',
    passport.authenticate('google', { session: false }),
    async (req, res) => {
        try {
            const token = await signToken({ 
                userId: req.user._id, 
                role: req.user.role,
                email: req.user.email 
            });
            
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            });
            
            res.redirect(`${process.env.CLIENT_URL}/dashboard`);
        } catch (error) {
            console.error('Auth Callback Error:', error);
            res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
        }
    }
);

// Get Me (Check Session)
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-googleId');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
