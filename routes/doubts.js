const express = require('express');
const router = express.Router();
const Doubt = require('../models/Doubt');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Submit a doubt
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { question } = req.body;
        const user = await User.findById(req.user.userId);
        
        const doubt = await Doubt.create({
            userId: user._id,
            userName: user.name,
            question
        });
        
        res.status(201).json(doubt);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
