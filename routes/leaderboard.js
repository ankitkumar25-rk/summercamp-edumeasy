const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get Leaderboard
router.get('/', async (req, res) => {
    try {
        const topStudents = await User.find()
            .select('name xp picture')
            .sort({ xp: -1 })
            .limit(10);
        res.json(topStudents);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
