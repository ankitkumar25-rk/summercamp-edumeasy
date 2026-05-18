const express = require('express');
const router = express.Router();
const Doubt = require('../models/Doubt');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// Submit a doubt
router.post('/', verifyToken, async (req, res) => {
    try {
        const { question, text } = req.body;
        const finalQuestion = (question || text || '').trim();
        if (!finalQuestion) {
            return res.status(400).json({ message: 'Question is required' });
        }
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const doubt = await Doubt.create({
            userId: user._id,
            userName: user.fullName,
            question: finalQuestion
        });

        user.xp += 10;
        if (user.xp >= 1000) user.level = 'Math Wizard';
        else if (user.xp >= 600) user.level = 'Elite Solver';
        else if (user.xp >= 300) user.level = 'Algebra Challenger';
        else user.level = 'Rookie';
        await user.save();
        
        res.status(201).json({
            doubt,
            xpGained: 10,
            totalXp: user.xp
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
