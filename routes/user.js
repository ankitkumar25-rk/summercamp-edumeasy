const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// Mark Class as Attended
router.post('/mark-attended', verifyToken, async (req, res) => {
    try {
        const { classId } = req.body;
        const user = await User.findById(req.user.userId);
        
        if (!user.completedClasses.includes(classId)) {
            user.completedClasses.push(classId);
            user.xp += 100; // Award 100 XP for attending
            await user.save();
        }
        
        res.json({ message: 'Attendance marked', xpGained: 100, totalXp: user.xp });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
