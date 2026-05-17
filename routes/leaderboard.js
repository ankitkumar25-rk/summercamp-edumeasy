const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get Leaderboard
router.get('/', async (req, res) => {
    try {
        const topStudents = await User.find()
            .select('fullName xp level')
            .sort({ xp: -1 })
            .limit(10);
            
        // Map fullName to name for backward compatibility with the frontend
        const mappedStudents = topStudents.map(student => ({
            _id: student._id,
            name: student.fullName,
            xp: student.xp,
            level: student.level
        }));
        
        res.json(mappedStudents);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
