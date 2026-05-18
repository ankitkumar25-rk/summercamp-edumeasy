const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const { verifyToken } = require('../middleware/auth');

// Mark Class as Attended
router.post('/mark-attended', verifyToken, async (req, res) => {
    try {
        const { classId, day } = req.body;
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let targetClassId = classId;
        if (!targetClassId && day) {
            const targetClass = await Class.findOne({ day: parseInt(day) });
            if (!targetClass) {
                return res.status(404).json({ message: 'Class not found for selected day' });
            }
            targetClassId = targetClass._id;
        }

        if (!targetClassId) {
            return res.status(400).json({ message: 'classId or day is required' });
        }

        const existingRecord = await Attendance.findOne({ userId: user._id, classId: targetClassId });
        let xpGained = 0;

        if (!existingRecord) {
            await Attendance.create({ userId: user._id, classId: targetClassId, attended: true });
            xpGained = 100;
        } else if (!existingRecord.attended) {
            existingRecord.attended = true;
            existingRecord.markedAt = new Date();
            await existingRecord.save();
            xpGained = 100;
        }
        
        if (!user.completedClasses.includes(targetClassId)) {
            user.completedClasses.push(targetClassId);
        }

        if (xpGained > 0) {
            user.xp += xpGained;
            if (user.xp >= 1000) user.level = 'Math Wizard';
            else if (user.xp >= 600) user.level = 'Elite Solver';
            else if (user.xp >= 300) user.level = 'Algebra Challenger';
            else user.level = 'Rookie';
        }
        await user.save();
        
        res.json({ message: 'Attendance marked', xpGained, totalXp: user.xp });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
